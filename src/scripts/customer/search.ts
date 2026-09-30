// Searching the preview grid by rug name (owner, 2026-09-30: "a magnifier icon, clicking it will
// expand a search bar to type in … search by name").
//
// This module is the control only: the magnifier that opens into a field, the clear button, and the
// keys. It says what the buyer typed by dispatching SEARCH_EVENT on the document; filters.ts — which
// already owns what the grid shows, the pager and the result count — does the filtering. The same
// split as the collection tabs, so there is one place that decides whether a card is on screen.
//
// The page renders the control twice, like the unit toggle: once in the title row and once on the
// phone header (PreviewControls `placement`). Only one is ever displayed, and both are kept in step,
// so turning a tablet round mid-search keeps the query and the open field.

/** Dispatched on the document whenever the query changes; `detail.query` is what was typed. */
export const SEARCH_EVENT = 'sl:search';
/** Dispatched by filters.ts when a collection tab is pressed: the search ends and closes. */
export const SEARCH_RESET_EVENT = 'sl:search-reset';

export interface SearchDetail {
  query: string;
}

/**
 * A name reduced to what a buyer would type: accents gone (`Tülü` → `tulu`, `Çiçek` → `cicek`), the
 * Turkish dotless ı read as i, lower case, single spaces. Rug names are Turkish, Persian and
 * Italian words, and nobody reaches for ü on a phone keyboard to find one.
 */
export function foldName(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whether a rug's name answers the query: every word typed appears somewhere in the name, in any
 * order, and spaces do not matter (`red teimani` finds "RedTeimani", `redteimani` finds "Red
 * Teimani"). An empty query matches everything.
 */
export function nameMatches(name: string, query: string): boolean {
  const q = foldName(query);
  if (!q) return true;
  const n = foldName(name);
  const squashed = n.replace(/ /g, '');
  return q.split(' ').every((term) => n.includes(term) || squashed.includes(term));
}

interface Widget {
  root: HTMLElement;
  toggle: HTMLButtonElement;
  input: HTMLInputElement;
  clear: HTMLButtonElement | null;
}

export interface SearchBindings {
  doc?: Document;
}

export function bindSearch(opts: SearchBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const widgets: Widget[] = [];
  for (const root of doc.querySelectorAll<HTMLElement>('[data-search]')) {
    const toggle = root.querySelector<HTMLButtonElement>('[data-search-toggle]');
    const input = root.querySelector<HTMLInputElement>('[data-search-input]');
    if (toggle && input) {
      widgets.push({ root, toggle, input, clear: root.querySelector('[data-search-clear]') });
    }
  }
  if (widgets.length === 0) return () => {};

  let query = '';
  let open = false;

  /** Every copy shows the same state; only the one on screen is ever seen. */
  const render = (): void => {
    for (const w of widgets) {
      w.root.classList.toggle('is-open', open);
      w.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      w.toggle.setAttribute('aria-label', open ? 'Close search' : 'Search by name');
      // Out of the tab order while folded away: an invisible field must not take a Tab press.
      w.input.tabIndex = open ? 0 : -1;
      if (w.input.value !== query) w.input.value = query;
      if (w.clear) w.clear.hidden = query === '';
    }
  };

  const emit = (): void => {
    doc.dispatchEvent(new CustomEvent<SearchDetail>(SEARCH_EVENT, { detail: { query } }));
  };

  const setQuery = (next: string): void => {
    if (next === query) return;
    query = next;
    render();
    emit();
  };

  const expand = (w: Widget): void => {
    open = true;
    render();
    w.input.focus();
  };

  /** Folds the field away and ends the search: a closed search never keeps the grid filtered. */
  const collapse = (w: Widget | undefined, refocus: boolean): void => {
    const had = query !== '';
    open = false;
    query = '';
    render();
    if (had) emit();
    if (refocus) w?.toggle.focus();
  };

  const cleanups: Array<() => void> = [];
  const on = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ): void => {
    el.addEventListener(type, fn);
    cleanups.push(() => el.removeEventListener(type, fn));
  };

  /* Set between pressing the magnifier and its click. Safari does not focus a button it clicks, so
     the field's focusout arrives with no relatedTarget; without this it would fold the field away and
     the click that follows would open it straight back up. */
  let pressingToggle = false;

  for (const w of widgets) {
    on(w.toggle, 'pointerdown', () => {
      pressingToggle = true;
      // Cleared after the click has had its turn, or when the press ends somewhere else.
      doc.addEventListener('pointerup', () => setTimeout(() => (pressingToggle = false), 0), { once: true });
    });
    on(w.toggle, 'click', () => {
      pressingToggle = false;
      if (open) collapse(w, true);
      else expand(w);
    });
    on(w.input, 'input', () => setQuery(w.input.value));
    on(w.input, 'keydown', (e) => {
      if (e.key === 'Escape') {
        // First Escape empties the field, the second folds it away — the usual search-box manners.
        e.preventDefault();
        if (query) setQuery('');
        else collapse(w, true);
      } else if (e.key === 'Enter') {
        // There is nothing to submit — the grid already shows the answer. On a phone this puts the
        // keyboard away so the buyer can see it.
        e.preventDefault();
        w.input.blur();
      }
    });
    if (w.clear) {
      const clear = w.clear;
      on(clear, 'click', () => {
        setQuery('');
        w.input.focus();
      });
    }
    // Leaving an empty field folds it back into the magnifier; a field with a query stays open,
    // because the grid under it is still answering that query.
    on(w.root, 'focusout', (e) => {
      const next = e.relatedTarget as Node | null;
      if (pressingToggle || (next && w.root.contains(next))) return;
      if (open && query === '') collapse(w, false);
    });
  }

  const onReset = (): void => {
    if (open || query) collapse(undefined, false);
  };
  doc.addEventListener(SEARCH_RESET_EVENT, onReset);
  cleanups.push(() => doc.removeEventListener(SEARCH_RESET_EVENT, onReset));

  render();
  return () => {
    for (const fn of cleanups) fn();
  };
}

export function initSearch(): void {
  if (typeof document === 'undefined') return;
  bindSearch();
}
