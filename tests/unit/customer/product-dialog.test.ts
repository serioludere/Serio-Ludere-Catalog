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
    <div class="pv-modal__media">
      <img data-hero-img src="/a.jpg" alt="Khal Mohammadi" />
      <button type="button" class="pv-modal__texture" data-texture-zoom="/api/image/TEX?w=1600"
        data-texture-alt="Khal Mohammadi, the weave up close"><img src="/api/image/TEX?w=800" alt="" /></button>
    </div>
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
    <div class="pv-zoom" data-zoom hidden>
      <img class="pv-zoom__img" data-zoom-img alt="" />
      <button type="button" data-zoom-close aria-label="Close the enlarged photograph"></button>
    </div>
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

  /* The texture photograph (owner, 2026-09-29: "still shows a thin slice, we need full photo,
     perhaps pop up larger"): a tap opens it large over the dialog; Esc, a tap or the close button
     put the rug back — and only the rug, the dialog stays open. */
  describe('the enlarged texture', () => {
    const zoom = (): HTMLElement => document.querySelector<HTMLElement>('[data-zoom]')!;
    const zoomImg = (): HTMLImageElement => document.querySelector<HTMLImageElement>('[data-zoom-img]')!;
    const texture = (): HTMLButtonElement =>
      document.querySelector<HTMLButtonElement>('[data-product-body] [data-texture-zoom]')!;

    it('opens the whole photograph at 1600px, and moves focus to its close button', () => {
      stubDialog();
      unbind = bindProductDialog();
      clickCard('SL-021');
      expect(zoom().hidden).toBe(true);
      texture().click();
      expect(zoom().hidden).toBe(false);
      expect(zoomImg().getAttribute('src')).toBe('/api/image/TEX?w=1600');
      expect(zoomImg().alt).toBe('Khal Mohammadi, the weave up close');
      expect(document.activeElement).toBe(document.querySelector('[data-zoom-close]'));
    });

    it('Esc closes the enlargement, not the dialog; a second Esc closes the dialog as always', () => {
      const dialog = stubDialog();
      unbind = bindProductDialog();
      clickCard('SL-021');
      texture().click();
      const first = new Event('cancel', { cancelable: true });
      dialog.dispatchEvent(first);
      expect(first.defaultPrevented).toBe(true);
      expect(zoom().hidden).toBe(true);
      expect(dialog.hasAttribute('open')).toBe(true);
      expect(document.activeElement).toBe(texture()); // back where the buyer was
      const second = new Event('cancel', { cancelable: true });
      dialog.dispatchEvent(second);
      expect(second.defaultPrevented).toBe(false);
    });

    it('catches Esc on keydown, before the browser’s own close request can close both', () => {
      // Chrome only lets a `cancel` be prevented after a fresh user gesture; the key itself can be.
      const dialog = stubDialog();
      unbind = bindProductDialog();
      clickCard('SL-021');
      texture().click();
      const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      document.querySelector<HTMLElement>('[data-zoom-close]')!.dispatchEvent(esc);
      expect(esc.defaultPrevented).toBe(true);
      expect(zoom().hidden).toBe(true);
      expect(dialog.hasAttribute('open')).toBe(true);
      // With nothing enlarged, Esc is left to the dialog as always.
      const next = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      dialog.dispatchEvent(next);
      expect(next.defaultPrevented).toBe(false);
    });

    it('a tap anywhere on it, or its close button, puts the rug back', () => {
      const dialog = stubDialog();
      unbind = bindProductDialog();
      clickCard('SL-021');
      texture().click();
      zoomImg().click();
      expect(zoom().hidden).toBe(true);
      expect(zoomImg().hasAttribute('src')).toBe(false); // the next rug never flashes this one
      texture().click();
      document.querySelector<HTMLButtonElement>('[data-zoom-close]')!.click();
      expect(zoom().hidden).toBe(true);
      expect(dialog.hasAttribute('open')).toBe(true);
    });

    it('closing the dialog closes the enlargement with it', () => {
      const dialog = stubDialog();
      unbind = bindProductDialog();
      clickCard('SL-021');
      texture().click();
      dialog.close();
      expect(zoom().hidden).toBe(true);
    });
  });
});
