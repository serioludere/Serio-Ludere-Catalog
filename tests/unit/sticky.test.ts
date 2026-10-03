// @vitest-environment happy-dom
// Sticky tab and navigation bars (owner, 2026-10-03: "make them sticky on scroll so the user can
// change the tab", buyer's catalogue and admin, desktop and phone). The pinning itself is CSS and is
// pinned by the stylesheet assertions at the bottom; the script is tested for what CSS cannot do —
// knowing when a bar is pinned, and taking the reader back to the top of a list they just changed.
import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindFilters } from '../../src/scripts/filters.ts';
import { initRugList } from '../../src/scripts/admin/rug-list.ts';
import { bindStickyBar, publishHeight } from '../../src/scripts/ui/sticky.ts';

/**
 * A window whose scroll position is ours to set. The bar pins at `top` (its computed style); the
 * anchor's viewport position is what the page's scroll would put it at.
 */
function fakeWin(opts: { top: string; marginTop?: string; scrollY: number }) {
  const listeners = new Map<string, () => void>();
  const scrollTo = vi.fn();
  const win = {
    scrollY: opts.scrollY,
    location: { href: 'http://localhost/hala', search: '' },
    history: { replaceState: vi.fn() },
    getComputedStyle: () => ({ top: opts.top, marginTop: opts.marginTop ?? '0px' }),
    requestAnimationFrame: (fn: () => void) => {
      fn();
      return 1;
    },
    addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
    removeEventListener: (type: string) => listeners.delete(type),
    scrollTo,
  };
  return { win: win as unknown as Window, scrollTo, fire: (type: string) => listeners.get(type)?.() };
}

/** Puts the anchor `y` px from the top of the viewport. */
function placeAnchor(anchor: HTMLElement, y: number): void {
  anchor.getBoundingClientRect = () => ({ top: y }) as DOMRect;
}

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.style.removeProperty('--pv-header-h');
});

describe('bindStickyBar', () => {
  const setup = (anchorAt: number, scrollY = 1200, marginTop = '0px') => {
    document.body.innerHTML = '<span data-anchor></span><div data-bar></div>';
    const anchor = document.querySelector<HTMLElement>('[data-anchor]')!;
    const bar = document.querySelector<HTMLElement>('[data-bar]')!;
    placeAnchor(anchor, anchorAt);
    const w = fakeWin({ top: '57px', marginTop, scrollY });
    return { anchor, bar, ...w, sticky: bindStickyBar(bar, anchor, { win: w.win }) };
  };

  it('is not pinned while the bar rests at or below where it would pin', () => {
    const { bar, sticky } = setup(120);
    expect(sticky.isStuck()).toBe(false);
    expect(bar.classList.contains('is-stuck')).toBe(false);
    // Exactly at the pin line, give or take sub-pixel layout, is still at rest.
    placeAnchor(document.querySelector<HTMLElement>('[data-anchor]')!, 56.8);
    expect(sticky.isStuck()).toBe(false);
  });

  it('marks the bar while it is pinned, and clears it on the way back up', () => {
    const { anchor, bar, sticky, fire } = setup(120);
    placeAnchor(anchor, -800);
    fire('scroll');
    expect(sticky.isStuck()).toBe(true);
    expect(bar.classList.contains('is-stuck')).toBe(true);
    placeAnchor(anchor, 300);
    fire('scroll');
    expect(bar.classList.contains('is-stuck')).toBe(false);
  });

  it('reveal() scrolls back exactly to where the bar rests: the top of the list under it', () => {
    // Anchor 800 above the viewport, bar pinned at 57: the bar rests 857 above where it is pinned.
    const { sticky, scrollTo } = setup(-800, 1200);
    sticky.reveal();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1200 - 857, behavior: 'instant' });
  });

  it("counts the bar's own top margin as part of where it rests", () => {
    const { sticky, scrollTo } = setup(-800, 1200, '4px');
    sticky.reveal();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1200 - 853, behavior: 'instant' });
  });

  it('reveal() leaves a reader who has not scrolled past the bar where they are', () => {
    const { sticky, scrollTo } = setup(200);
    sticky.reveal();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('stops listening once disposed', () => {
    const { anchor, bar, sticky, fire } = setup(120);
    sticky.dispose();
    placeAnchor(anchor, -800);
    fire('scroll');
    expect(bar.classList.contains('is-stuck')).toBe(false);
  });
});

describe('publishHeight', () => {
  it("publishes the element's height on <html>, for the bar that pins under it", () => {
    document.body.innerHTML = '<header></header>';
    const header = document.querySelector<HTMLElement>('header')!;
    header.getBoundingClientRect = () => ({ height: 53 }) as DOMRect;
    const stop = publishHeight(header, '--pv-header-h');
    expect(document.documentElement.style.getPropertyValue('--pv-header-h')).toBe('53px');
    stop();
  });
});

describe("the buyer's tab strip", () => {
  const PAGE = `
    <header class="pv-header"></header>
    <main>
      <span data-tabbar-anchor></span>
      <div data-tabbar>
        <nav class="pv-filters">
          <button class="pv-chip is-on" data-filter="classics" aria-pressed="true">Classics</button>
          <button class="pv-chip" data-filter="kilims" aria-pressed="false">Kilims</button>
          <button class="pv-chip" data-filter="all" aria-pressed="false">All</button>
        </nav>
      </div>
      <div data-card data-rug="SL-1" data-name="Jonas" data-collections="classics"></div>
      <div data-card data-rug="SL-2" data-name="Aile" data-collections="kilims" hidden></div>
    </main>`;

  let unbind: (() => void) | undefined;
  afterEach(() => {
    unbind?.();
    unbind = undefined;
  });

  it('takes a buyer deep in a collection back to the top of the one they press', () => {
    document.body.innerHTML = PAGE;
    placeAnchor(document.querySelector<HTMLElement>('[data-tabbar-anchor]')!, -2000);
    const { win, scrollTo } = fakeWin({ top: '53px', scrollY: 2600 });
    unbind = bindFilters({ win });
    expect(document.querySelector('[data-tabbar]')!.classList.contains('is-stuck')).toBe(true);

    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 2600 - 2053, behavior: 'instant' });
  });

  it('does not move a buyer who pressed a tab from the top of the page', () => {
    document.body.innerHTML = PAGE;
    placeAnchor(document.querySelector<HTMLElement>('[data-tabbar-anchor]')!, 120);
    const { win, scrollTo } = fakeWin({ top: '53px', scrollY: 0 });
    unbind = bindFilters({ win });
    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("the studio's Products tabs", () => {
  it('take the studio back to the top of the list when a tab is pressed from the pinned strip', () => {
    document.body.innerHTML = `
      <input id="q" />
      <div data-sticky-anchor></div>
      <div class="chips rugfilters" id="collectionChips" role="group">
        <button class="chip" data-value="classics" aria-pressed="false">Classics</button>
        <button class="chip on" data-value="*" aria-pressed="true">All</button>
      </div>
      <p id="count"></p>
      <div data-card data-id="SL-1" data-collections="classics"></div>`;
    placeAnchor(document.querySelector<HTMLElement>('[data-sticky-anchor]')!, -900);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(window, 'scrollY', { value: 1500, configurable: true });
    document.getElementById('collectionChips')!.style.top = '49px';
    initRugList(document);

    document.querySelector<HTMLButtonElement>('[data-value="classics"]')!.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1500 - 949, behavior: 'instant' });
    scrollTo.mockRestore();
  });
});

/* ---------- the CSS that does the pinning ---------- */

/** The declarations of the first top-level rule whose selector is exactly `selector`. */
function rule(css: string, selector: string, from = 0): string {
  const at = css.indexOf(`${selector} {`, from);
  if (at < 0) return '';
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}
const read = (path: string): string => fs.readFileSync(path, 'utf8');

describe('the stylesheets keep the bars pinned', () => {
  it("pins the buyer's header at the top, on the page ground", () => {
    const header = rule(read('src/styles/preview.css'), '\n.pv-header');
    expect(header).toMatch(/position:\s*sticky/);
    expect(header).toMatch(/top:\s*0/);
    expect(header).toMatch(/background:\s*var\(--canvas\)/);
  });

  it('never unpins the phone header that carries the controls (a `relative` would)', () => {
    const src = read('src/components/customer/PreviewHeader.astro');
    const declarations = rule(src, '.pv-header--controls').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarations).not.toMatch(/position:/);
  });

  it("pins the buyer's tab bar under the header's published height", () => {
    const bar = rule(read('src/pages/[slug]/index.astro'), '  .pv-tabbar');
    expect(bar).toMatch(/position:\s*sticky/);
    expect(bar).toMatch(/--pv-header-h/);
    expect(bar).toMatch(/background:\s*var\(--canvas\)/);
  });

  it('pins the admin topbar, and the rail on desktop', () => {
    const css = read('src/styles/components.css');
    expect(rule(css, '\n.shell__topbar')).toMatch(/position:\s*sticky/);
    const desk = css.indexOf('@media (min-width: 768px)', css.indexOf('App Shell'));
    const rail = rule(css, '  .shell__nav', desk);
    expect(rail).toMatch(/position:\s*sticky/);
    expect(rail).toMatch(/height:\s*100dvh/);
  });

  it("pins the Products tabs under the topbar's published height", () => {
    const css = read('src/styles/admin.css');
    const sticky = rule(css, '\n.chips.rugfilters', css.indexOf('Sticky under the topbar'));
    expect(sticky).toMatch(/position:\s*sticky/);
    expect(sticky).toMatch(/--shell-topbar-h/);
    expect(sticky).toMatch(/background:\s*var\(--canvas\)/);
  });
});
