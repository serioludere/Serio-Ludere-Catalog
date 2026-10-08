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

  describe('a bar that pins tucked under the header (the phone strip, owner 2026-10-08)', () => {
    // 139 tall, pinned at 53 - 139 + 44 = -42 so that only its last 44px show under a 53px header.
    const tucked = (anchorAt: number, restAt: () => number, scrollY = 1200) => {
      document.body.innerHTML = '<span data-anchor></span><div data-bar></div>';
      const anchor = document.querySelector<HTMLElement>('[data-anchor]')!;
      const bar = document.querySelector<HTMLElement>('[data-bar]')!;
      placeAnchor(anchor, anchorAt);
      const w = fakeWin({ top: '-42px', scrollY });
      return { bar, ...w, sticky: bindStickyBar(bar, anchor, { win: w.win, restAt }) };
    };

    it('counts as pinned only once it has slid under the header as far as it goes', () => {
      expect(tucked(20, () => 53).sticky.isStuck()).toBe(false);
      expect(tucked(-41, () => 53).sticky.isStuck()).toBe(false);
      expect(tucked(-43, () => 53).sticky.isStuck()).toBe(true);
    });

    it('reveal() opens it back out below the header, not at its tucked pin line', () => {
      const { sticky, scrollTo } = tucked(-800, () => 53);
      sticky.reveal();
      expect(scrollTo).toHaveBeenCalledWith({ top: 1200 - 853, behavior: 'instant' });
    });

    it('reveal() opens out a strip that is only part-way under the header', () => {
      const { sticky, scrollTo } = tucked(20, () => 53, 40);
      sticky.reveal();
      expect(scrollTo).toHaveBeenCalledWith({ top: 40 - 33, behavior: 'instant' });
    });

    it('never reveals a bar to above where it pins, where it would still be pinned', () => {
      // A header that measures 0 (not laid out yet) must not leave a bar pinned at 57 still pinned.
      document.body.innerHTML = '<span data-anchor></span><div data-bar></div>';
      const anchor = document.querySelector<HTMLElement>('[data-anchor]')!;
      placeAnchor(anchor, -800);
      const { win, scrollTo } = fakeWin({ top: '57px', scrollY: 1200 });
      const bar = document.querySelector<HTMLElement>('[data-bar]')!;
      bindStickyBar(bar, anchor, { win, restAt: () => 0 }).reveal();
      expect(scrollTo).toHaveBeenCalledWith({ top: 1200 - 857, behavior: 'instant' });
    });
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

  it('starts a turned page at the top of the grid, not at the pager under it (owner, 2026-10-08)', () => {
    const cards = Array.from(
      { length: 21 },
      (_, i) => `<div data-card data-rug="C-${i}" data-name="C${i}" data-collections="classics"></div>`,
    ).join('');
    document.body.innerHTML = PAGE.replace(
      '</main>',
      `${cards}<nav id="gridPager" hidden>
         <button data-page="prev"></button><p data-page="label"></p><button data-page="next"></button>
       </nav></main>`,
    );
    placeAnchor(document.querySelector<HTMLElement>('[data-tabbar-anchor]')!, -2000);
    const { win, scrollTo } = fakeWin({ top: '53px', scrollY: 2600 });
    unbind = bindFilters({ win });

    document.querySelector<HTMLButtonElement>('#gridPager [data-page="next"]')!.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 2600 - 2053, behavior: 'instant' });
  });

  it("publishes the bar's own height, which the phone's fold pins against", () => {
    document.body.innerHTML = PAGE;
    document.querySelector<HTMLElement>('[data-tabbar]')!.getBoundingClientRect = () =>
      ({ height: 139 }) as DOMRect;
    unbind = bindFilters({ win: fakeWin({ top: '53px', scrollY: 0 }).win });
    expect(document.documentElement.style.getPropertyValue('--pv-tabbar-h')).toBe('139px');
  });

  it('opens the folded strip back out under the header when the phone dropdown changes collection', () => {
    // Owner, 2026-10-08: on a phone the pinned strip is folded to its last 44px (pinned at -42 under
    // a 53px header). A choice made there lands at the top of the new list with the tabs showing.
    document.body.innerHTML = PAGE.replace(
      '</nav>',
      `<select data-collection-select>
         <option value="classics" selected>Classics</option>
         <option value="kilims">Kilims</option>
         <option value="all">All</option>
       </select></nav>`,
    );
    document.querySelector<HTMLElement>('.pv-header')!.getBoundingClientRect = () =>
      ({ top: 0, bottom: 53, height: 53 }) as DOMRect;
    placeAnchor(document.querySelector<HTMLElement>('[data-tabbar-anchor]')!, -2000);
    const { win, scrollTo } = fakeWin({ top: '-42px', scrollY: 2600 });
    unbind = bindFilters({ win });

    const select = document.querySelector<HTMLSelectElement>('[data-collection-select]')!;
    select.value = 'kilims';
    select.dispatchEvent(new Event('change'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 2600 - 2053, behavior: 'instant' });
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

  it("folds the buyer's strip into its dropdown on a phone without the bar changing height", () => {
    // Owner, 2026-10-08. The bar pins with all but the dropdown's band tucked under the header…
    const page = read('src/pages/[slug]/index.astro');
    const phone = page.indexOf('@media (max-width: 767px)');
    const bar = rule(page, '    .pv-tabbar', phone);
    expect(bar).toMatch(/top:\s*min\(/);
    expect(bar).toMatch(/--pv-tabbar-h/);
    expect(bar).toMatch(/--pv-picker-h/);
    // …and the tabs are HIDDEN there, never removed: a bar that shrank as it pinned would pull the
    // rugs up under the buyer's thumb, and its published height would no longer be its height.
    const tabs = rule(page, '    .pv-tabbar.is-stuck :global(.pv-chip)', phone);
    expect(tabs).toMatch(/visibility:\s*hidden/);
    expect(tabs).not.toMatch(/display:/);
    expect(rule(page, '    .pv-tabbar.is-stuck :global(.pv-picker)', phone)).toMatch(/visibility:\s*visible/);
  });

  it("keeps the phone dropdown's select tappable, and big enough that iOS does not zoom into it", () => {
    const select = rule(read('src/components/customer/CollectionFilters.astro'), '  .pv-picker-select');
    expect(select).toMatch(/opacity:\s*0/);
    expect(select).toMatch(/font-size:\s*16px/);
    expect(select).not.toMatch(/display:\s*none|visibility:\s*hidden|pointer-events:\s*none/);
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
