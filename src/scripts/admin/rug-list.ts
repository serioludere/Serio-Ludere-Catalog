// /admin/rugs (docs/ADMIN_SPEC.md §8.3): collection chips + status chips + search filter the
// server-rendered cards client-side (`hidden`), the photo rotate logic from the legacy page runs on
// load, and a polite count announces the result.
import { shouldRotate } from '../../lib/rotate.ts';
import { initChips } from './chips.ts';
import { byId, maybe } from './dom.ts';
import { post, type ApiOptions } from './api.ts';
import { msg } from './msg.ts';

export interface ListFilter {
  /**
   * The collection slugs to show, ORed together; empty means every collection. '__none' matches the
   * rugs filed under none. Multi-select since 2026-09-16 — the owner picks one or more tabs.
   */
  collections: string[];
  q: string;
}

/** The chip that means "every collection"; it is exclusive against the individual ones. */
export const ALL_COLLECTIONS = '*';

export interface CardData {
  /** The primary collection's slug. */
  collection?: string;
  /** Space-separated: every collection slug the rug belongs to (owner requirement 2026-09-13). */
  collections?: string;
  status?: string;
  search?: string;
  /** 'photos' when the row's Drive import never finished; '' otherwise. */
  attention?: string;
}

/**
 * Every collection slug a card claims. Falls back to the primary when `data-collections` is absent,
 * so a card rendered before this change — or by an older test fixture — still filters instead of
 * vanishing from every chip at once.
 */
function slugsOf(card: CardData): string[] {
  if (card.collections !== undefined) return card.collections.split(' ').filter(Boolean);
  return card.collection ? [card.collection] : [];
}

/** Pure: does a card's data-* set pass the filter? Status is no longer filtered on (owner, 2026-09-16). */
export function matches(card: CardData, f: ListFilter): boolean {
  if (f.collections.length > 0) {
    const slugs = slugsOf(card);
    const hit = f.collections.some((want) =>
      want === '__none' ? slugs.length === 0 : slugs.includes(want),
    );
    if (!hit) return false;
  }
  const needle = f.q.trim().toLowerCase();
  if (needle && !(card.search ?? '').includes(needle)) return false;
  return true;
}

/** Adds `.rot` to loaded photos per the sheet's rotate flag (legacy onPhoto()). */
export function bindRotate(doc: Document = document): void {
  doc.querySelectorAll<HTMLImageElement>('img[data-rot]').forEach((img) => {
    const apply = (): void => {
      if (shouldRotate(img.dataset.rot, img.naturalWidth, img.naturalHeight)) img.classList.add('rot');
    };
    if (img.complete && img.naturalWidth > 0) apply();
    else img.addEventListener('load', apply, { once: true });
    img.addEventListener('error', () => img.remove(), { once: true });
  });
}

/**
 * Finishes a row whose photo import stopped half way (brief §12). The endpoint re-reads the source
 * page for the images it still needs, so this button is safe to press twice: photos already in the
 * row are kept and only the shortfall is fetched.
 */
export async function retryPhotos(id: string, doc: Document = document, api: ApiOptions = {}): Promise<void> {
  const button = doc.querySelector<HTMLButtonElement>(`[data-retry="${CSS.escape(id)}"]`);
  const out = doc.getElementById('m-retry');
  if (button) {
    button.disabled = true;
    button.textContent = 'Finishing…';
  }
  const r = await post<{ imported: number; complete: boolean }>(
    `/api/admin/rugs/${encodeURIComponent(id)}/retry`,
    {},
    { timeoutMs: 120_000, ...api },
  );
  if (!r.ok) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Finish photo import';
    }
    if (out) msg(out, `${id}: ${r.message}`, 'err');
    return;
  }
  if (out) {
    msg(
      out,
      r.data.complete ? `${id}: photos finished.` : `${id}: ${r.data.imported} more saved, still incomplete.`,
      r.data.complete ? 'ok' : 'busy',
    );
  }
  // The card is server-rendered, so a reload is the honest way to show the new state.
  setTimeout(() => location.reload(), 1200);
}

export interface RugList {
  apply(): void;
  filter(): ListFilter;
}

export function initRugList(doc: Document = document): RugList {
  const q = byId<HTMLInputElement>('q', doc);
  const count = maybe('count', doc);
  const emptyFirst = maybe('empty-first', doc);
  const emptyNone = maybe('empty-none', doc);
  const cards = [...doc.querySelectorAll<HTMLElement>('[data-card]')];

  const filter = (): ListFilter => {
    const chosen = collectionChips.values();
    // "All" pressed — or nothing pressed at all — means no collection filter.
    return { collections: chosen.includes(ALL_COLLECTIONS) ? [] : chosen, q: q.value };
  };

  const apply = (): void => {
    const f = filter();
    // Every rug appears twice — once as a table row, once as a gallery card — so that one filter
    // drives both views and switching view can never change what you are looking at. The COUNT has
    // to be of rugs, not of elements, or it reports double.
    const shownIds = new Set<string>();
    for (const card of cards) {
      const on = matches(card.dataset as CardData, f);
      card.hidden = !on;
      if (on && card.dataset.id) shownIds.add(card.dataset.id);
    }
    const shown = shownIds.size;
    if (count) count.textContent = `${shown} ${shown === 1 ? 'rug' : 'rugs'} shown`;
    // First run and no-results are different problems and get different copy, different icons and
    // different actions (Figma Empty State 24:231) — collapsing them into one generic 'no data' is
    // the common miss. Both are server-rendered and toggled, so neither is assembled in JS.
    const total = new Set(cards.map((c) => c.dataset.id).filter(Boolean)).size;
    if (emptyFirst) emptyFirst.hidden = total !== 0;
    if (emptyNone) emptyNone.hidden = total === 0 || shown !== 0;
  };

  /**
   * "All" against the individual collections. The chip group itself is a plain multi-select, so the
   * exclusivity lives here: pressing All clears the rest, pressing a collection releases All, and
   * releasing the last collection falls back to All rather than leaving an empty selection that
   * looks like a filter but reads like "everything".
   */
  let pressed: string[] = [];
  const onCollections = (values: string[]): void => {
    const allJustPressed = values.includes(ALL_COLLECTIONS) && !pressed.includes(ALL_COLLECTIONS);
    let next = values;
    if (allJustPressed || values.length === 0) next = [ALL_COLLECTIONS];
    else if (values.length > 1) next = values.filter((v) => v !== ALL_COLLECTIONS);
    if (next.length !== values.length || next.some((v, i) => v !== values[i])) collectionChips.set(next);
    pressed = next;
    apply();
  };

  const collectionChips = initChips(byId('collectionChips', doc), { multi: true, onChange: onCollections });
  pressed = collectionChips.values();
  q.addEventListener('input', apply);
  doc.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-retry]');
    if (b?.dataset.retry) void retryPhotos(b.dataset.retry, doc);
  });
  bindRotate(doc);
  apply();
  return { apply, filter };
}
