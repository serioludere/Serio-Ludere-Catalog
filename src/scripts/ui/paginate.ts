// Client-side pagination, shared by the admin product list and the buyer's catalogue (owner,
// 2026-09-16: 20 per page in both).
//
// Both screens already render every product and then hide what does not match, so paging is the same
// idea one step further: the filter decides what MATCHES, this decides what of that is on the page.
//
// It keys on `data-id`, never on elements, because /admin/rugs renders each product TWICE — once as
// a table row, once as a gallery card — and both carry the same id. Keying on the id means the two
// views page identically, the count reports products rather than nodes, and switching view never
// changes what you are looking at.

/** The owner's page size (owner, 2026-09-16). */
export const PAGE_SIZE = 20;

export interface PagerElements {
  /** Wraps the whole control; hidden when everything fits on one page. */
  root: HTMLElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  /** "Page 2 of 5" — a status region, so a screen reader hears the page change. */
  label: HTMLElement;
}

export interface PagerOptions {
  /** Every pageable element, in render order. Several may share one id. */
  items: readonly HTMLElement[];
  elements: PagerElements;
  pageSize?: number;
  /** Called after every page change, so the caller can re-announce its own count. */
  onChange?: (page: number, pages: number) => void;
}

export interface Pager {
  /** Re-pages after the filter changed. `reset` returns to page 1, which a filter change always does. */
  apply(matches: (el: HTMLElement) => boolean, reset?: boolean): void;
  page(): number;
  pages(): number;
  /** The ids on the current page, in order — the count the caller announces. */
  visibleIds(): string[];
}

const idOf = (el: HTMLElement): string => el.dataset.id ?? el.dataset.rug ?? '';

export function initPager(opts: PagerOptions): Pager {
  const size = opts.pageSize ?? PAGE_SIZE;
  const { root, prev, next, label } = opts.elements;
  let page = 1;
  let pages = 1;
  let ids: string[] = [];

  const paint = (matched: readonly HTMLElement[]): void => {
    // The ordered set of matching ids: `Set` keeps insertion order, and a product that is in the DOM
    // twice contributes one entry.
    const all = [...new Set(matched.map(idOf).filter(Boolean))];
    pages = Math.max(1, Math.ceil(all.length / size));
    if (page > pages) page = pages;
    const start = (page - 1) * size;
    ids = all.slice(start, start + size);
    const onPage = new Set(ids);
    const show = new Set(matched);
    for (const el of opts.items) el.hidden = !show.has(el) || !onPage.has(idOf(el));

    root.hidden = all.length <= size;
    prev.disabled = page <= 1;
    next.disabled = page >= pages;
    label.textContent = `Page ${page} of ${pages}`;
    opts.onChange?.(page, pages);
  };

  let last: (el: HTMLElement) => boolean = () => true;

  const apply = (matchFn: (el: HTMLElement) => boolean, reset = true): void => {
    last = matchFn;
    if (reset) page = 1;
    paint(opts.items.filter(matchFn));
  };

  const go = (to: number): void => {
    const target = Math.min(Math.max(1, to), pages);
    if (target === page) return;
    page = target;
    paint(opts.items.filter(last));
    // A page change moves content the reader is looking at; put them back at the top of it.
    root.scrollIntoView({ block: 'nearest' });
  };

  prev.addEventListener('click', () => go(page - 1));
  next.addEventListener('click', () => go(page + 1));

  return { apply, page: () => page, pages: () => pages, visibleIds: () => [...ids] };
}
