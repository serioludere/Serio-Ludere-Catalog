// @vitest-environment happy-dom
// The two client modules the redesigned preview adds: the filter strip (Figma 53:42) and the
// thumbnail strip on the product detail page (Figma 57:242).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEARCH_EVENT, SEARCH_RESET_EVENT } from '../../src/scripts/customer/search.ts';
import { bindFilters } from '../../src/scripts/filters.ts';
import { bindPreviewGallery } from '../../src/scripts/preview-gallery.ts';

function page(html: string): void {
  document.body.innerHTML = html;
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

const STRIP = `
  <nav class="pv-filters">
    <button class="pv-chip is-on" data-filter="all" aria-pressed="true">All</button>
    <button class="pv-chip" data-filter="kilims" aria-pressed="false">Kilims</button>
    <button class="pv-chip" data-filter="gabbeh" aria-pressed="false">Gabbeh</button>
  </nav>
  <div data-card data-rug="SL-1" data-collections="kilims antique"></div>
  <div data-card data-rug="SL-2" data-collections="gabbeh"></div>
  <div data-card data-rug="SL-3" data-collections="more"></div>
  <p data-grid-empty hidden></p>`;

/**
 * A window stand-in: filters.ts reads the query string and rewrites it with replaceState, and the
 * phone's collection menu listens for the page scrolling while it is open.
 */
const fakeWin = (search = '') => {
  const replaceState = vi.fn();
  return {
    win: {
      location: { href: `http://localhost/hala${search}`, search },
      history: { replaceState },
      scrollY: 0,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as Window,
    replaceState,
  };
};

const shown = (): string[] =>
  [...document.querySelectorAll<HTMLElement>('[data-card]')]
    .filter((c) => !c.hidden)
    .map((c) => c.dataset.rug!);

describe('filters.ts', () => {
  let unbind: (() => void) | undefined;
  afterEach(() => {
    unbind?.();
    unbind = undefined;
  });

  it('shows everything under All and narrows to one collection on click', () => {
    page(STRIP);
    const { win, replaceState } = fakeWin();
    unbind = bindFilters({ win });
    expect(shown()).toEqual(['SL-1', 'SL-2', 'SL-3']);

    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(shown()).toEqual(['SL-1']);
    expect(document.querySelector('[data-filter="kilims"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-filter="all"]')?.getAttribute('aria-pressed')).toBe('false');
    // The choice survives a reload and the Back button.
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toContain('collection=kilims');

    document.querySelector<HTMLButtonElement>('[data-filter="all"]')!.click();
    expect(shown()).toEqual(['SL-1', 'SL-2', 'SL-3']);
    // "All" is written too (owner, 2026-09-25): a bare URL now opens on the first collection.
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toContain('collection=all');
  });

  it('opens on whichever tab the page rendered pressed — the first collection (owner, 2026-09-25)', () => {
    // The strip as the page renders it now: collections first, "All" last, the first one pressed,
    // and the cards outside it already hidden so the first paint is the right grid.
    page(`
      <nav class="pv-filters">
        <button class="pv-chip is-on" data-filter="kilims" aria-pressed="true">Kilims</button>
        <button class="pv-chip" data-filter="gabbeh" aria-pressed="false">Gabbeh</button>
        <button class="pv-chip" data-filter="all" aria-pressed="false">All</button>
      </nav>
      <div data-card data-rug="SL-1" data-collections="kilims"><a href="/hala/SL-1">Winks</a></div>
      <div data-card data-rug="SL-2" data-collections="gabbeh" hidden><a href="/hala/SL-2">Yellow</a></div>
      <p data-grid-empty hidden></p>`);
    const { win, replaceState } = fakeWin();
    unbind = bindFilters({ win });
    expect(shown()).toEqual(['SL-1']);
    // Loading changes nothing in the address bar; only a choice does.
    expect(replaceState).not.toHaveBeenCalled();

    document.querySelector<HTMLButtonElement>('[data-filter="all"]')!.click();
    expect(shown()).toEqual(['SL-1', 'SL-2']);
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toContain('collection=all');
    // Opening a rug from "All" and coming back must land on "All", not on the first collection.
    expect(document.querySelector('[data-rug="SL-2"] a')?.getAttribute('href')).toBe(
      '/hala/SL-2?collection=all',
    );
  });

  it('honours ?collection= on load and ignores one that is not on the page', () => {
    page(STRIP);
    unbind = bindFilters({ win: fakeWin('?collection=gabbeh').win });
    expect(shown()).toEqual(['SL-2']);
    unbind();

    page(STRIP);
    unbind = bindFilters({ win: fakeWin('?collection=nothing-like-this').win });
    expect(shown()).toEqual(['SL-1', 'SL-2', 'SL-3']);
  });

  it('matches a rug in several collections under each of them', () => {
    page(STRIP.replace('data-collections="gabbeh"', 'data-collections="gabbeh kilims"'));
    unbind = bindFilters({ win: fakeWin().win });
    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(shown()).toEqual(['SL-1', 'SL-2']);
    document.querySelector<HTMLButtonElement>('[data-filter="gabbeh"]')!.click();
    expect(shown()).toEqual(['SL-2']);
  });

  it('announces an empty result instead of leaving a blank band', () => {
    page(STRIP.replace('data-collections="gabbeh"', 'data-collections="kilims"'));
    unbind = bindFilters({ win: fakeWin().win });
    const empty = document.querySelector<HTMLElement>('[data-grid-empty]')!;
    expect(empty.hidden).toBe(true);
    document.querySelector<HTMLButtonElement>('[data-filter="gabbeh"]')!.click();
    expect(shown()).toEqual([]);
    expect(empty.hidden).toBe(false);
  });

  it('moves the pressed collection’s description into the intro line, and hides it when there is none', () => {
    // Owner, 2026-09-18: the description introduces that tab's cards. "All" is not a collection and
    // has none, and a collection may simply not have one — both hide the line rather than leaving an
    // empty paragraph, which would still cost its gap above the grid.
    page(`
      <nav class="pv-filters">
        <button class="pv-chip is-on" data-filter="all" aria-pressed="true">All</button>
        <button class="pv-chip" data-filter="kilims" data-description="Flatweaves from Denizli." aria-pressed="false">Kilims</button>
        <button class="pv-chip" data-filter="gabbeh" aria-pressed="false">Gabbeh</button>
      </nav>
      <p data-collection-intro hidden></p>
      <div data-card data-rug="SL-1" data-collections="kilims"></div>
      <div data-card data-rug="SL-2" data-collections="gabbeh"></div>`);
    unbind = bindFilters({ win: fakeWin().win });
    const intro = document.querySelector<HTMLElement>('[data-collection-intro]')!;
    expect(intro.hidden).toBe(true);

    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(intro.textContent).toBe('Flatweaves from Denizli.');
    expect(intro.hidden).toBe(false);

    // A collection with no description of its own, then back to All.
    document.querySelector<HTMLButtonElement>('[data-filter="gabbeh"]')!.click();
    expect(intro.hidden).toBe(true);
    document.querySelector<HTMLButtonElement>('[data-filter="all"]')!.click();
    expect(intro.textContent).toBe('');
    expect(intro.hidden).toBe(true);
  });

  it('deep-links straight to a collection with its description already showing', () => {
    page(`
      <nav class="pv-filters">
        <button class="pv-chip is-on" data-filter="all" aria-pressed="true">All</button>
        <button class="pv-chip" data-filter="kilims" data-description="Flatweaves from Denizli." aria-pressed="false">Kilims</button>
      </nav>
      <p data-collection-intro hidden></p>
      <div data-card data-rug="SL-1" data-collections="kilims"></div>`);
    unbind = bindFilters({ win: fakeWin('?collection=kilims').win });
    const intro = document.querySelector<HTMLElement>('[data-collection-intro]')!;
    expect(intro.textContent).toBe('Flatweaves from Denizli.');
    expect(intro.hidden).toBe(false);
  });

  it('does nothing on a page with no strip', () => {
    page('<p>no filters here</p>');
    expect(() => bindFilters()()).not.toThrow();
  });

  describe('the dropdown the strip folds into on a phone (owner, 2026-10-08)', () => {
    // Drawn in the catalogue's own style since 2026-10-09: a face that opens a list of rows.
    const FOLDING = `
      <nav class="pv-filters">
        <button class="pv-chip is-on" data-filter="kilims" aria-pressed="true">Kilims</button>
        <button class="pv-chip" data-filter="gabbeh" data-description="Deep pile from Fars." aria-pressed="false">Gabbeh</button>
        <button class="pv-chip" data-filter="all" aria-pressed="false">All</button>
        <div data-collection-picker>
          <button data-picker-toggle aria-expanded="false"><span data-picker-name>Kilims</span></button>
          <div data-picker-scrim hidden></div>
          <ul data-picker-menu hidden>
            <li><button data-pick="kilims" aria-current="true">Kilims</button></li>
            <li><button data-pick="gabbeh">Gabbeh</button></li>
            <li><button data-pick="all">All</button></li>
          </ul>
        </div>
      </nav>
      <p data-collection-intro hidden></p>
      <div data-card data-rug="SL-1" data-name="Winks" data-collections="kilims"></div>
      <div data-card data-rug="SL-2" data-name="Yellow" data-collections="gabbeh" hidden></div>
      <p data-grid-empty hidden></p>`;

    const face = (): string | null | undefined => document.querySelector('[data-picker-name]')?.textContent;
    const marked = (): string[] =>
      [...document.querySelectorAll<HTMLElement>('[data-pick][aria-current="true"]')].map(
        (r) => r.dataset.pick!,
      );
    const pick = (value: string): void => {
      document.querySelector<HTMLButtonElement>('[data-picker-toggle]')!.click();
      document.querySelector<HTMLButtonElement>(`[data-pick="${value}"]`)!.click();
    };

    it('does what pressing that tab does, and closes', () => {
      page(FOLDING);
      const { win, replaceState } = fakeWin();
      unbind = bindFilters({ win });
      pick('gabbeh');
      expect(shown()).toEqual(['SL-2']);
      expect(document.querySelector('[data-filter="gabbeh"]')?.getAttribute('aria-pressed')).toBe('true');
      expect(document.querySelector('[data-filter="kilims"]')?.getAttribute('aria-pressed')).toBe('false');
      expect(String(replaceState.mock.calls.at(-1)?.[2])).toContain('collection=gabbeh');
      expect(document.querySelector('[data-collection-intro]')?.textContent).toBe('Deep pile from Fars.');
      expect(face()).toBe('Gabbeh');
      expect(marked()).toEqual(['gabbeh']);
      expect(document.querySelector<HTMLElement>('[data-picker-menu]')!.hidden).toBe(true);
    });

    it('follows the tabs, so it always names and marks the collection on screen', () => {
      page(FOLDING);
      unbind = bindFilters({ win: fakeWin('?collection=gabbeh').win });
      expect(face()).toBe('Gabbeh');
      expect(marked()).toEqual(['gabbeh']);
      document.querySelector<HTMLButtonElement>('[data-filter="all"]')!.click();
      expect(face()).toBe('All');
      expect(marked()).toEqual(['all']);
    });

    it('reads "Search results" with no row marked during a search, and picking a collection ends it', () => {
      page(FOLDING);
      unbind = bindFilters({ win: fakeWin().win });
      const reset = vi.fn();
      document.addEventListener(SEARCH_RESET_EVENT, reset);
      document.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: { query: 'yel' } }));
      expect(shown()).toEqual(['SL-2']);
      expect(face()).toBe('Search results');
      expect(marked()).toEqual([]);

      // Even the collection the search interrupted counts as a choice, and takes the buyer back to it.
      pick('kilims');
      expect(reset).toHaveBeenCalledTimes(1);
      expect(shown()).toEqual(['SL-1']);
      expect(face()).toBe('Kilims');
      document.removeEventListener(SEARCH_RESET_EVENT, reset);
    });

    it('ignores a row that is not one of the tabs', () => {
      page(
        FOLDING.replace(
          '<li><button data-pick="all">All</button></li>',
          '<li><button data-pick="all">All</button></li><li><button data-pick="ghost">Ghost</button></li>',
        ),
      );
      const { win, replaceState } = fakeWin();
      unbind = bindFilters({ win });
      pick('ghost');
      expect(shown()).toEqual(['SL-1']);
      expect(replaceState).not.toHaveBeenCalled();
    });
  });

  describe('the next collection, at the end of one (owner, 2026-10-08)', () => {
    const END = (cards: string, pager = ''): string => `
      <nav class="pv-filters">
        <button class="pv-chip is-on" data-filter="kilims" aria-pressed="true">Kilims</button>
        <button class="pv-chip" data-filter="gabbeh" aria-pressed="false">Gabbeh</button>
        <button class="pv-chip" data-filter="all" aria-pressed="false">All</button>
      </nav>
      ${cards}
      ${pager}
      <div data-next-collection hidden>
        <p>Next collection</p>
        <button data-next-filter><span data-next-name></span></button>
      </div>
      <p data-grid-empty hidden></p>`;
    const SHORT = END(`
      <div data-card data-rug="SL-1" data-name="Winks" data-collections="kilims"></div>
      <div data-card data-rug="SL-2" data-name="Yellow" data-collections="gabbeh" hidden></div>`);
    const box = (): HTMLElement => document.querySelector<HTMLElement>('[data-next-collection]')!;
    const name = (): string | null | undefined => document.querySelector('[data-next-name]')?.textContent;

    it('names the next collection under the last rug of this one, and opens it', () => {
      page(SHORT);
      const { win, replaceState } = fakeWin();
      unbind = bindFilters({ win });
      expect(box().hidden).toBe(false);
      expect(name()).toBe('Gabbeh');

      document.querySelector<HTMLButtonElement>('[data-next-filter]')!.click();
      expect(shown()).toEqual(['SL-2']);
      expect(document.querySelector('[data-filter="gabbeh"]')?.getAttribute('aria-pressed')).toBe('true');
      expect(String(replaceState.mock.calls.at(-1)?.[2])).toContain('collection=gabbeh');
    });

    it('offers nothing after the last collection, under All, or during a search', () => {
      page(SHORT);
      unbind = bindFilters({ win: fakeWin('?collection=gabbeh').win });
      // "All" follows Gabbeh in the strip, but it is not a collection.
      expect(box().hidden).toBe(true);
      document.querySelector<HTMLButtonElement>('[data-filter="all"]')!.click();
      expect(box().hidden).toBe(true);

      document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
      expect(box().hidden).toBe(false);
      document.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: { query: 'win' } }));
      expect(box().hidden).toBe(true);
      document.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: { query: '' } }));
      expect(box().hidden).toBe(false);
    });

    it('waits for the last page of a collection that runs to more than one', () => {
      const many = Array.from(
        { length: 21 },
        (_, i) =>
          `<div data-card data-rug="K-${i + 1}" data-name="K${i + 1}" data-collections="kilims"></div>`,
      ).join('');
      page(
        END(
          many,
          `<nav id="gridPager" hidden>
             <button data-page="prev"></button><p data-page="label"></p><button data-page="next"></button>
           </nav>`,
        ),
      );
      document.getElementById('gridPager')!.scrollIntoView = () => {};
      unbind = bindFilters({ win: fakeWin().win });
      expect(box().hidden).toBe(true);

      document.querySelector<HTMLButtonElement>('#gridPager [data-page="next"]')!.click();
      expect(shown()).toEqual(['K-21']);
      expect(box().hidden).toBe(false);
      expect(name()).toBe('Gabbeh');
    });
  });
});

describe('preview-gallery.ts', () => {
  let unbind: (() => void) | undefined;
  afterEach(() => {
    unbind?.();
    unbind = undefined;
  });

  const GALLERY = `
    <img data-hero-img src="/a.jpg" alt="Kashan" />
    <div data-thumbs>
      <button class="pv-thumb is-on" data-full="/a.jpg" data-alt="Kashan, photograph 1" aria-current="true"></button>
      <button class="pv-thumb" data-full="/b.jpg" data-alt="Kashan, photograph 2"></button>
    </div>`;

  it('swaps the hero and moves the current marker', () => {
    page(GALLERY);
    unbind = bindPreviewGallery();
    const [first, second] = document.querySelectorAll<HTMLButtonElement>('.pv-thumb');
    second!.click();
    const hero = document.querySelector<HTMLImageElement>('[data-hero-img]')!;
    expect(hero.getAttribute('src')).toBe('/b.jpg');
    expect(hero.getAttribute('alt')).toBe('Kashan, photograph 2');
    expect(second!.getAttribute('aria-current')).toBe('true');
    expect(second!.classList.contains('is-on')).toBe(true);
    // Exactly one is current at a time, and it is announced rather than shown by colour alone.
    expect(first!.getAttribute('aria-current')).toBeNull();
    expect(first!.classList.contains('is-on')).toBe(false);
  });

  it('does nothing without a strip or without a hero', () => {
    page('<img data-hero-img src="/a.jpg" />');
    expect(() => bindPreviewGallery()()).not.toThrow();
    page('<div data-thumbs><button data-full="/b.jpg"></button></div>');
    expect(() => bindPreviewGallery()()).not.toThrow();
  });
});
