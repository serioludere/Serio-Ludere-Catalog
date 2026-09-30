// @vitest-environment happy-dom
// The customer grid's name search (owner, 2026-09-30): the matching rule, the magnifier that opens
// into a field, and how it hands the query to filters.ts, which owns what the grid shows.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SEARCH_EVENT,
  SEARCH_RESET_EVENT,
  bindSearch,
  foldName,
  nameMatches,
} from '../../../src/scripts/customer/search.ts';
import { bindFilters } from '../../../src/scripts/filters.ts';

describe('nameMatches', () => {
  it('ignores case, accents and the Turkish dotless i', () => {
    expect(foldName('  Tülü   Deniz ')).toBe('tulu deniz');
    expect(nameMatches('Çiçek', 'cicek')).toBe(true);
    expect(nameMatches('Kırmızı', 'kirmizi')).toBe(true);
    expect(nameMatches('Ayşe', 'AYSE')).toBe(true);
    expect(nameMatches('Tülü Deniz', 'tül')).toBe(true);
  });

  it('finds the name anywhere, word by word and in any order, whatever the spacing', () => {
    expect(nameMatches('Ruby Teimani', 'tei')).toBe(true);
    expect(nameMatches('Ruby Teimani', 'teimani ruby')).toBe(true);
    expect(nameMatches('RedTeimani', 'red teimani')).toBe(true);
    expect(nameMatches('Red Teimani', 'redteimani')).toBe(true);
    expect(nameMatches('Ruby Teimani', 'ruby kazak')).toBe(false);
    expect(nameMatches('Santo', 'aile')).toBe(false);
  });

  it('matches everything on an empty query', () => {
    expect(nameMatches('Santo', '')).toBe(true);
    expect(nameMatches('Santo', '   ')).toBe(true);
  });
});

/** One copy of the control, as PreviewControls renders it. */
const widget = (id: string): string => `
  <div class="pv-search" data-search role="search">
    <button type="button" data-search-toggle aria-expanded="false" aria-controls="${id}">search</button>
    <input id="${id}" type="search" data-search-input tabindex="-1" />
    <button type="button" data-search-clear hidden>clear</button>
  </div>`;

const typeInto = (input: HTMLInputElement, text: string): void => {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};
const key = (input: HTMLInputElement, k: string): void => {
  input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
};

describe('bindSearch', () => {
  let unbind: (() => void) | undefined;
  let queries: string[];
  const record = (e: Event): void => {
    queries.push((e as CustomEvent<{ query: string }>).detail.query);
  };
  beforeEach(() => {
    queries = [];
    document.addEventListener(SEARCH_EVENT, record);
  });
  afterEach(() => {
    unbind?.();
    unbind = undefined;
    document.removeEventListener(SEARCH_EVENT, record);
    document.body.innerHTML = '';
  });

  it('opens the field from the magnifier, focused, and announces what is typed', () => {
    document.body.innerHTML = widget('pvSearch');
    unbind = bindSearch();
    const root = document.querySelector<HTMLElement>('[data-search]')!;
    const toggle = root.querySelector<HTMLButtonElement>('[data-search-toggle]')!;
    const input = root.querySelector<HTMLInputElement>('input')!;
    const clear = root.querySelector<HTMLButtonElement>('[data-search-clear]')!;
    expect(root.classList.contains('is-open')).toBe(false);
    expect(input.tabIndex).toBe(-1);

    toggle.click();
    expect(root.classList.contains('is-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Close search');
    expect(input.tabIndex).toBe(0);
    expect(document.activeElement).toBe(input);

    typeInto(input, 'tei');
    expect(queries).toEqual(['tei']);
    expect(clear.hidden).toBe(false);

    clear.click();
    expect(queries).toEqual(['tei', '']);
    expect(input.value).toBe('');
    expect(clear.hidden).toBe(true);
    expect(root.classList.contains('is-open')).toBe(true);
  });

  it('empties the field on the first Escape and folds it away on the second', () => {
    document.body.innerHTML = widget('pvSearch');
    unbind = bindSearch();
    const root = document.querySelector<HTMLElement>('[data-search]')!;
    const toggle = root.querySelector<HTMLButtonElement>('[data-search-toggle]')!;
    const input = root.querySelector<HTMLInputElement>('input')!;
    toggle.click();
    typeInto(input, 'aile');

    key(input, 'Escape');
    expect(input.value).toBe('');
    expect(root.classList.contains('is-open')).toBe(true);
    key(input, 'Escape');
    expect(root.classList.contains('is-open')).toBe(false);
    expect(document.activeElement).toBe(toggle);
    expect(queries).toEqual(['aile', '']);
  });

  it('closing from the magnifier ends the search, so a folded field never leaves the grid filtered', () => {
    document.body.innerHTML = widget('pvSearch');
    unbind = bindSearch();
    const toggle = document.querySelector<HTMLButtonElement>('[data-search-toggle]')!;
    const input = document.querySelector<HTMLInputElement>('input')!;
    toggle.click();
    typeInto(input, 'santo');
    toggle.click();
    expect(input.value).toBe('');
    expect(queries).toEqual(['santo', '']);
  });

  it('keeps the page copy and the phone-header copy in step', () => {
    document.body.innerHTML = widget('pvSearchHeader') + widget('pvSearch');
    unbind = bindSearch();
    const [header, pageCopy] = [...document.querySelectorAll<HTMLElement>('[data-search]')];
    pageCopy!.querySelector<HTMLButtonElement>('[data-search-toggle]')!.click();
    typeInto(pageCopy!.querySelector('input')!, 'cicek');
    expect(header!.classList.contains('is-open')).toBe(true);
    expect(header!.querySelector('input')!.value).toBe('cicek');
    expect(queries).toEqual(['cicek']);
  });

  it('closes and clears when a collection tab takes over', () => {
    document.body.innerHTML = widget('pvSearch');
    unbind = bindSearch();
    const root = document.querySelector<HTMLElement>('[data-search]')!;
    root.querySelector<HTMLButtonElement>('[data-search-toggle]')!.click();
    typeInto(root.querySelector('input')!, 'tulu');
    document.dispatchEvent(new CustomEvent(SEARCH_RESET_EVENT));
    expect(root.classList.contains('is-open')).toBe(false);
    expect(root.querySelector('input')!.value).toBe('');
  });

  it('does nothing on a page without the control', () => {
    document.body.innerHTML = '<p>detail page</p>';
    expect(() => bindSearch()()).not.toThrow();
  });
});

describe('filters.ts with the name search', () => {
  let unbind: (() => void) | undefined;
  afterEach(() => {
    unbind?.();
    unbind = undefined;
    document.body.innerHTML = '';
  });

  const GRID = `
    <nav class="pv-filters">
      <button class="pv-chip is-on" data-filter="classics" data-description="Classic carpets." aria-pressed="true">Classics</button>
      <button class="pv-chip" data-filter="kilims" aria-pressed="false">Kilims</button>
      <button class="pv-chip" data-filter="all" aria-pressed="false">All</button>
    </nav>
    <p data-collection-intro>Classic carpets.</p>
    <div data-card data-rug="SL-1" data-name="Ruby Teimani" data-collections="classics"></div>
    <div data-card data-rug="SL-2" data-name="Aile" data-collections="kilims" hidden></div>
    <div data-card data-rug="SL-3" data-name="Çiçek" data-collections="kilims" hidden></div>
    <p data-grid-empty hidden>Nothing matches that filter yet.</p>
    <p data-grid-live></p>`;

  const win = { location: { href: 'http://localhost/hala', search: '' }, history: { replaceState: vi.fn() } };
  const search = (query: string): void => {
    document.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: { query } }));
  };
  const shown = (): string[] =>
    [...document.querySelectorAll<HTMLElement>('[data-card]')]
      .filter((c) => !c.hidden)
      .map((c) => c.dataset.rug!);
  const pressed = (): string[] =>
    [...document.querySelectorAll<HTMLElement>('.pv-chip[aria-pressed="true"]')].map(
      (c) => c.dataset.filter!,
    );

  it('searches every collection, with no tab pressed, and gives the tab back when emptied', () => {
    document.body.innerHTML = GRID;
    unbind = bindFilters({ win: win as unknown as Window });
    expect(shown()).toEqual(['SL-1']);

    search('cicek');
    expect(shown()).toEqual(['SL-3']);
    expect(pressed()).toEqual([]);
    expect(document.querySelector<HTMLElement>('[data-collection-intro]')!.hidden).toBe(true);
    expect(document.querySelector('[data-grid-live]')!.textContent).toBe('1 rug shown');

    search('');
    expect(shown()).toEqual(['SL-1']);
    expect(pressed()).toEqual(['classics']);
    expect(document.querySelector<HTMLElement>('[data-collection-intro]')!.hidden).toBe(false);
  });

  it('says what found nothing, and goes back to its own words afterwards', () => {
    document.body.innerHTML = GRID;
    unbind = bindFilters({ win: win as unknown as Window });
    const empty = document.querySelector<HTMLElement>('[data-grid-empty]')!;
    search('  zzz ');
    expect(shown()).toEqual([]);
    expect(empty.hidden).toBe(false);
    expect(empty.textContent).toBe('Nothing matches “zzz”.');
    search('');
    expect(empty.hidden).toBe(true);
    expect(empty.textContent).toBe('Nothing matches that filter yet.');
  });

  it('ends the search when a tab is pressed, and tells the control to close', () => {
    document.body.innerHTML = GRID;
    unbind = bindFilters({ win: win as unknown as Window });
    const reset = vi.fn();
    document.addEventListener(SEARCH_RESET_EVENT, reset);
    search('ai');
    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(shown()).toEqual(['SL-2', 'SL-3']);
    expect(pressed()).toEqual(['kilims']);
    document.removeEventListener(SEARCH_RESET_EVENT, reset);
  });
});
