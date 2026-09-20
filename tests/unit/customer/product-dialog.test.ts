// @vitest-environment happy-dom
// The product popup on the customer grid (owner, 2026-09-20): a card opens the rug in a dialog
// beside the grid rather than navigating to its own page.
//
// What matters here is what it does NOT break. The cards stay real links, so anything that is not a
// plain left click — a new tab, a modified click, no JavaScript at all — must still navigate to
// `/{slug}/{id}`, which is the page a buyer's shared link opens.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bindProductDialog } from '../../../src/scripts/customer/product-dialog.ts';

const GRID = `
  <div class="pv-grid">
    <div data-card data-rug="SL-021" data-collections="kilims">
      <a class="pv-card-hit" href="/hala/SL-021"></a>
      <p class="pv-card-name"><a href="/hala/SL-021">Khal Mohammadi</a></p>
      <button data-vote="like" data-rug="SL-021" aria-pressed="false"></button>
    </div>
    <div data-card data-rug="SL-022" data-collections="kilims">
      <a href="/hala/SL-022">Yellow</a>
    </div>
  </div>
  <template data-detail="SL-021">
    <div class="pv-modal__media"><img data-hero-img src="/a.jpg" alt="Khal Mohammadi" /></div>
    <div class="pv-modal__info">
      <h2>Khal Mohammadi</h2>
      <div class="pv-react" data-react data-rug="SL-021">
        <button type="button" data-vote="like" data-rug="SL-021" aria-pressed="false"></button>
      </div>
    </div>
  </template>
  <dialog class="pv-modal" data-product-dialog>
    <button type="button" data-product-close></button>
    <div class="pv-modal__body" data-product-body></div>
  </dialog>`;

/** happy-dom has no top layer; `open` is what the module and the CSS both read. */
function stubDialog(): HTMLDialogElement {
  const d = document.querySelector('dialog')! as HTMLDialogElement;
  d.showModal = () => d.setAttribute('open', '');
  d.close = () => {
    d.removeAttribute('open');
    d.dispatchEvent(new Event('close'));
  };
  return d;
}

let unbind: (() => void) | undefined;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.customer = 'hala';
  document.body.innerHTML = GRID;
  history.replaceState(null, '', '/hala');
});

afterEach(() => {
  unbind?.();
  unbind = undefined;
  delete document.documentElement.dataset.customer;
});

function clickCard(id: string, init: MouseEventInit = {}): MouseEvent {
  const link = document.querySelector<HTMLAnchorElement>(`[data-rug="${id}"] a[href]`)!;
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  link.dispatchEvent(e);
  return e;
}

describe('product dialog', () => {
  it('opens the rug in the dialog instead of navigating, and puts its address in the bar', () => {
    const dialog = stubDialog();
    unbind = bindProductDialog();

    const e = clickCard('SL-021');
    expect(e.defaultPrevented).toBe(true); // the navigation was taken over
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.querySelector('[data-hero-img]')).not.toBeNull();
    expect(dialog.textContent).toContain('Khal Mohammadi');
    // Copyable and shareable: the address bar names the rug while it is open.
    expect(location.pathname).toBe('/hala/SL-021');
  });

  it('shows a rug this buyer already liked as liked', () => {
    localStorage.setItem('sl-saved:hala', JSON.stringify({ 'SL-021': 'liked' }));
    stubDialog();
    unbind = bindProductDialog();
    clickCard('SL-021');
    const heart = document.querySelector<HTMLButtonElement>('[data-product-body] button[data-vote="like"]')!;
    expect(heart.getAttribute('aria-pressed')).toBe('true');
  });

  it('leaves every other kind of click alone, so the rug page is still reachable', () => {
    stubDialog();
    unbind = bindProductDialog();
    // ⌘/Ctrl-click, middle click and shift-click are "open it over there", not "open it here".
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { button: 1 }]) {
      const e = clickCard('SL-021', init);
      expect(e.defaultPrevented).toBe(false);
      expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false);
    }
  });

  it('navigates as before for a rug with no content rendered for it', () => {
    stubDialog();
    unbind = bindProductDialog();
    const e = clickCard('SL-022'); // no <template data-detail="SL-022">
    expect(e.defaultPrevented).toBe(false);
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false);
  });

  it('closing empties the dialog, so two rugs are never in it at once', () => {
    const dialog = stubDialog();
    unbind = bindProductDialog();
    clickCard('SL-021');
    dialog.querySelector<HTMLButtonElement>('[data-product-close]')!.click();
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(dialog.querySelector('[data-product-body]')!.children).toHaveLength(0);
  });
});
