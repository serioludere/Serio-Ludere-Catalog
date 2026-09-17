// The preview's filter strip (Figma 53:42). Client-side, like the public catalogue's collection
// tabs: the whole grid is already in the document, so filtering is showing and hiding rather than a
// round trip.
//
// Three kinds of chip:
//   * `all`   — everything;
//   * a tag slug — the cards carrying that tag;
//   * `liked` — the visitor's own shortlist, read from the same `sl-saved` key the reaction buffer
//     writes. It is per-visitor and the page is cached, so its count is rendered as a placeholder on
//     the server and corrected here on load, then kept live as the visitor reacts.
//
// The chosen filter is written to `?tag=` so a reload and the Back button keep it, which is what the
// collection tabs already do with `?collection=`.
import { readSaved } from './votes.ts';
import { initPager } from './ui/paginate.ts';

const PARAM = 'tag';
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export interface FilterBindings {
  doc?: Document;
  win?: Window;
  storage?: Storage;
}

function likedIds(storage: Storage): Set<string> {
  return new Set(
    Object.entries(readSaved(storage))
      .filter(([, state]) => state === 'liked')
      .map(([id]) => id),
  );
}

/** Cards carry their tag slugs space-separated; a card with no tags matches only `all`. */
function tagsOf(card: HTMLElement): string[] {
  return (card.dataset.tags ?? '').split(/\s+/).filter(Boolean);
}

export function bindFilters(opts: FilterBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const win = opts.win ?? (typeof window !== 'undefined' ? window : undefined);
  const storage = opts.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  const nav = doc.querySelector<HTMLElement>('.pv-filters');
  if (!nav) return () => {};
  const chips = [...nav.querySelectorAll<HTMLButtonElement>('button[data-filter]')];
  const cards = [...doc.querySelectorAll<HTMLElement>('[data-card]')];
  const countEl = nav.querySelector<HTMLElement>('[data-liked-count]');
  const likedChip = nav.querySelector<HTMLButtonElement>('button[data-filter="liked"]');
  const live = doc.querySelector<HTMLElement>('[data-grid-live]');

  let active = 'all';

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

  const liked = (): Set<string> => (storage ? likedIds(storage) : new Set<string>());

  const matches = (card: HTMLElement, shortlist: Set<string> | undefined): boolean =>
    active === 'all'
      ? true
      : shortlist
        ? shortlist.has(card.dataset.rug ?? '')
        : tagsOf(card).includes(active);

  const apply = (resetPage = true): void => {
    const shortlist = active === 'liked' ? liked() : undefined;
    // The pager owns `hidden` when the page renders one: filtering decides what is in the result,
    // paging decides which 20 of it are on screen (owner, 2026-09-16).
    if (pager) pager.apply((card) => matches(card, shortlist), resetPage);
    else for (const card of cards) card.hidden = !matches(card, shortlist);
    for (const chip of chips) {
      const on = chip.dataset.filter === active;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    /* Carry the chosen chip onto every card link, so opening a rug and coming back lands on the
       same filtered grid. The detail page reads `?tag=` and rebuilds its back link and its prev/next
       run from it; without this the parameter only ever existed on the grid's own URL and any
       in-page route out of the detail page silently dropped the buyer's filter. */
    const q = active === 'all' ? '' : `?${PARAM}=${encodeURIComponent(active)}`;
    for (const card of cards) {
      for (const a of card.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        // Rebuilt from the base each time, so switching chips replaces rather than appends.
        const base = (a.getAttribute('href') ?? '').split('?')[0];
        if (base) a.setAttribute('href', base + q);
      }
    }

    // The RESULT, not the page: "3 rugs shown" while looking at page 2 of 3 would be a lie.
    const shown = cards.filter((c) => matches(c, shortlist)).length;
    const empty = doc.querySelector<HTMLElement>('[data-grid-empty]');
    if (empty) empty.hidden = shown > 0;
    announce(shown);
  };

  /* Written only when the number actually moves. `apply()` also runs on load and on every reaction
     while the shortlist is open, and re-setting identical text re-fires the live region — which is
     how a status line turns into a screen reader repeating itself. */
  let said: number | undefined;
  const announce = (shown: number): void => {
    if (!live || shown === said) return;
    said = shown;
    live.textContent = shown === 1 ? '1 rug shown' : `${shown} rugs shown`;
  };

  /** The shortlist count, and the chip itself, only exist when the visitor has liked something. */
  const refreshCount = (): void => {
    const n = liked().size;
    if (countEl) countEl.textContent = String(n);
    if (likedChip) likedChip.hidden = n === 0;
    // Standing on an empty shortlist would show a blank grid with no way back.
    if (n === 0 && active === 'liked') {
      active = 'all';
      apply();
    }
  };

  const setActive = (next: string): void => {
    active = next;
    apply();
    if (!win) return;
    try {
      const url = new URL(win.location.href);
      if (next === 'all') url.searchParams.delete(PARAM);
      else url.searchParams.set(PARAM, next);
      win.history.replaceState(null, '', url.toString());
    } catch {
      /* ignore */
    }
  };

  const onClick = (e: Event): void => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filter]');
    if (!chip?.dataset.filter) return;
    setActive(chip.dataset.filter);
  };

  const onReaction = (): void => {
    refreshCount();
    // Keep the page: un-liking a rug while reading page 2 of the shortlist should not throw the
    // buyer back to the top of page 1. The pager clamps if the page no longer exists.
    if (active === 'liked') apply(false);
  };

  nav.addEventListener('click', onClick);
  doc.addEventListener('sl:reaction', onReaction);

  // A deep link wins over the default, but only if that chip is actually on the page.
  const wanted = win ? new URLSearchParams(win.location.search).get(PARAM) : null;
  refreshCount();
  if (wanted && SLUG_RE.test(wanted) && chips.some((c) => c.dataset.filter === wanted)) {
    if (wanted !== 'liked' || liked().size > 0) active = wanted;
  }
  apply();

  return () => {
    nav.removeEventListener('click', onClick);
    doc.removeEventListener('sl:reaction', onReaction);
  };
}

export function initFilters(): void {
  bindFilters();
}
