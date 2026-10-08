// The preview's filter strip (Figma 53:42). Client-side, like the public catalogue's collection
// tabs: the whole grid is already in the document, so filtering is showing and hiding rather than a
// round trip.
//
// Collections only (owner, 2026-09-17): buyers think in collections, never in tags, so the strip is
// one chip per collection, then "All". The tag chips and the "Liked" shortlist chip are gone.
//
// The grid opens on the chip the page rendered pressed — the first collection (owner, 2026-09-25) —
// and the chosen filter is written to `?collection=` so a reload and the Back button keep it. "All"
// is written too (`?collection=all`): with no parameter the page opens on the first collection, so
// leaving it out would send a buyer who chose "All" back to Classics.
//
// The name search (owner, 2026-09-30; the control is customer/search.ts) looks across EVERY
// collection while there is a query: a buyer typing a rug's name wants that rug, not to be told it
// is in another tab. No tab is pressed meanwhile, since none of them is what the grid shows; emptying
// the field brings the tab back, and pressing a tab ends the search.
//
// The strip sticks under the header on scroll (owner, 2026-10-03), so it can be pressed from deep in
// a collection. When it is, the buyer is taken back to the top of the new result rather than left
// part-way down it (ui/sticky.ts).
//
// On a phone, the pinned strip folds into one dropdown (owner, 2026-10-08). Choosing from the
// dropdown does exactly what pressing that tab does. While a search is on, the dropdown reads
// "Search results" and has nothing chosen, so any collection picked from it ends the search.
import { SEARCH_EVENT, SEARCH_RESET_EVENT, nameMatches, type SearchDetail } from './customer/search.ts';
import { initPager } from './ui/paginate.ts';
import { bindStickyBar, publishHeight } from './ui/sticky.ts';

const PARAM = 'collection';
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export interface FilterBindings {
  doc?: Document;
  win?: Window;
}

/** Cards carry every collection slug they belong to, space-separated. */
function collectionsOf(card: HTMLElement): string[] {
  return (card.dataset.collections ?? '').split(/\s+/).filter(Boolean);
}

export function bindFilters(opts: FilterBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const win = opts.win ?? (typeof window !== 'undefined' ? window : undefined);
  const nav = doc.querySelector<HTMLElement>('.pv-filters');
  if (!nav) return () => {};
  const chips = [...nav.querySelectorAll<HTMLButtonElement>('button[data-filter]')];
  const picker = nav.querySelector<HTMLSelectElement>('select[data-collection-select]');
  const pickerName = nav.querySelector<HTMLElement>('[data-picker-name]');
  const cards = [...doc.querySelectorAll<HTMLElement>('[data-card]')];
  const live = doc.querySelector<HTMLElement>('[data-grid-live]');
  const intro = doc.querySelector<HTMLElement>('[data-collection-intro]');
  /* 'read more' (owner, 2026-09-20). The description is clamped to three lines and the control only
     appears when there is a fourth — a two-line description with a 'read more' under it is noise. */
  const introMore = doc.querySelector<HTMLButtonElement>('[data-intro-more]');
  const fitIntro = (): void => {
    if (!intro || !introMore) return;
    intro.classList.remove('is-open');
    introMore.textContent = 'read more';
    introMore.setAttribute('aria-expanded', 'false');
    // scrollHeight beats clientHeight only when the clamp is actually hiding a line.
    introMore.hidden = intro.hidden || intro.scrollHeight <= intro.clientHeight + 1;
  };
  introMore?.addEventListener('click', () => {
    const open = intro?.classList.toggle('is-open') ?? false;
    introMore.textContent = open ? 'read less' : 'read more';
    introMore.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // What the server rendered pressed; 'all' only for a page that pressed nothing.
  let active = chips.find((c) => c.getAttribute('aria-pressed') === 'true')?.dataset.filter ?? 'all';

  /** 20 per page (owner, 2026-09-16), when the page renders the control. */
  const pagerRoot = doc.getElementById('gridPager');
  const pager = pagerRoot
    ? initPager({
        items: cards,
        elements: {
          root: pagerRoot,
          prev: pagerRoot.querySelector<HTMLButtonElement>('[data-page="prev"]')!,
          next: pagerRoot.querySelector<HTMLButtonElement>('[data-page="next"]')!,
          label: pagerRoot.querySelector<HTMLElement>('[data-page="label"]')!,
        },
      })
    : undefined;

  /** What the buyer typed in the name search; '' when not searching. */
  let query = '';

  const matches = (card: HTMLElement): boolean =>
    query
      ? nameMatches(card.dataset.name ?? '', query)
      : active === 'all' || collectionsOf(card).includes(active);

  const empty = doc.querySelector<HTMLElement>('[data-grid-empty]');
  const emptyText = empty?.textContent ?? '';

  /* The sticky bar the strip lives in, pinned under the header — whose height the bar needs for its
     `top`, so it is published here, where the only thing that sticks below it is bound. On a phone
     the bar pins with all but its last 44px tucked under the header, which takes the bar's own
     height as well; a choice made there opens it back out below the header. */
  const bar = doc.querySelector<HTMLElement>('[data-tabbar]');
  const anchor = doc.querySelector<HTMLElement>('[data-tabbar-anchor]');
  const header = doc.querySelector<HTMLElement>('.pv-header');
  const unpublish = bar && header ? publishHeight(header, '--pv-header-h', { doc }) : undefined;
  const unpublishBar = bar ? publishHeight(bar, '--pv-tabbar-h', { doc }) : undefined;
  const sticky =
    bar && anchor && win
      ? bindStickyBar(bar, anchor, {
          win,
          restAt: header ? () => header.getBoundingClientRect().bottom : undefined,
        })
      : undefined;

  /* Written only when the number actually moves: re-setting identical text re-fires the live region,
     which is how a status line turns into a screen reader repeating itself. */
  let said: number | undefined;
  const announce = (shown: number): void => {
    if (!live || shown === said) return;
    said = shown;
    live.textContent = shown === 1 ? '1 rug shown' : `${shown} rugs shown`;
  };

  const apply = (): void => {
    // The pager owns `hidden` when the page renders one: filtering decides what is in the result,
    // paging decides which 20 of it are on screen.
    if (pager) pager.apply(matches, true);
    else for (const card of cards) card.hidden = !matches(card);
    let description = '';
    let name = '';
    for (const chip of chips) {
      // While searching no tab is pressed, so no description shows either.
      const on = !query && chip.dataset.filter === active;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        description = chip.dataset.description ?? '';
        name = chip.textContent?.trim() ?? '';
      }
    }
    if (picker) {
      if (query) picker.selectedIndex = -1;
      else picker.value = active;
    }
    if (pickerName) pickerName.textContent = query ? 'Search results' : name;
    /* The chosen collection's description, as the intro to the cards (owner, 2026-09-18). Hidden
       rather than emptied: the band is a flex column with a gap, so an empty <p> would still push
       the grid down by one gap under "All", which has no description of its own. */
    if (intro) {
      intro.textContent = description;
      intro.hidden = !description;
      fitIntro();
    }
    /* Carry the chosen chip onto every card link, so opening a rug and coming back lands on the
       same filtered grid. The detail page reads `?collection=` for its back link and prev/next run;
       'all' rides along as well, since the bare grid now opens on the first collection. */
    const q = `?${PARAM}=${encodeURIComponent(active)}`;
    for (const card of cards) {
      for (const a of card.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        // Rebuilt from the base each time, so switching chips replaces rather than appends.
        const base = (a.getAttribute('href') ?? '').split('?')[0];
        if (base) a.setAttribute('href', base + q);
      }
    }

    // The RESULT, not the page: "3 rugs shown" while looking at page 2 of 3 would be a lie.
    const shown = cards.filter(matches).length;
    if (empty) {
      empty.hidden = shown > 0;
      empty.textContent = query ? `Nothing matches “${query}”.` : emptyText;
    }
    announce(shown);
  };

  const setActive = (next: string): void => {
    active = next;
    apply();
    if (!win) return;
    try {
      const url = new URL(win.location.href);
      url.searchParams.set(PARAM, next);
      win.history.replaceState(null, '', url.toString());
    } catch {
      /* ignore */
    }
  };

  /** A tab pressed, or the same choice made in the phone's dropdown. */
  const choose = (filter: string): void => {
    // A tab pressed mid-search ends the search: the buyer has gone back to browsing.
    if (query) {
      query = '';
      doc.dispatchEvent(new CustomEvent(SEARCH_RESET_EVENT));
    }
    setActive(filter);
    sticky?.reveal();
  };

  const onClick = (e: Event): void => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filter]');
    if (chip?.dataset.filter) choose(chip.dataset.filter);
  };

  const onPick = (): void => {
    const next = picker?.value;
    if (next && chips.some((c) => c.dataset.filter === next)) choose(next);
  };

  const onSearch = (e: Event): void => {
    const next = ((e as CustomEvent<SearchDetail>).detail?.query ?? '').trim();
    if (next === query) return;
    query = next;
    apply();
    // The result is a different list too; a search typed from the pinned bar starts at its top.
    sticky?.reveal();
  };

  nav.addEventListener('click', onClick);
  picker?.addEventListener('change', onPick);
  doc.addEventListener(SEARCH_EVENT, onSearch);

  // A deep link wins over the default, but only if that chip is actually on the page.
  const wanted = win ? new URLSearchParams(win.location.search).get(PARAM) : null;
  if (wanted && SLUG_RE.test(wanted) && chips.some((c) => c.dataset.filter === wanted)) active = wanted;
  apply();

  return () => {
    nav.removeEventListener('click', onClick);
    picker?.removeEventListener('change', onPick);
    doc.removeEventListener(SEARCH_EVENT, onSearch);
    sticky?.dispose();
    unpublish?.();
    unpublishBar?.();
  };
}

export function initFilters(): void {
  bindFilters();
}
