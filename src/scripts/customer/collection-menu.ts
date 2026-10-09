// The collection dropdown on a phone (owner, 2026-10-08), drawn in the catalogue's own style since
// 2026-10-09: the owner found the phone's native list bare and unstyled. The markup is in
// CollectionFilters.astro. filters.ts decides what is chosen and what choosing does; this module is
// only the menu.
//
// It is a button that opens a list of buttons, not a hand-built role="listbox". Every row is a real
// button, so Tab, Enter, Space and a screen reader work as they do anywhere, and `aria-current` marks
// the collection on screen. What is added here is what a menu is expected to do on top of that:
//   - Esc closes it and puts focus back on the face; the arrow keys, Home and End move between rows;
//   - a tap on the dimmed page closes it, and goes no further, so it never opens a rug;
//   - scrolling the page closes it, because the band it hangs from may be about to unpin;
//   - focus moving out of it closes it.

export interface CollectionMenu {
  /** Names the face and marks the row on screen. An `active` that matches no row marks none. */
  update(active: string, label: string): void;
  close(): void;
  dispose(): void;
}

export interface CollectionMenuBindings {
  /** A row was chosen. `byKeyboard` when Enter or Space chose it, for where focus should go next. */
  onPick: (filter: string, byKeyboard: boolean) => void;
  doc?: Document;
  win?: Window;
}

/** How far the page may move under an open menu before it closes; iOS nudges it as toolbars move. */
const SCROLL_GIVE = 8;

export function bindCollectionMenu(
  root: HTMLElement,
  opts: CollectionMenuBindings,
): CollectionMenu | undefined {
  const doc = opts.doc ?? document;
  const win = opts.win ?? (typeof window !== 'undefined' ? window : undefined);
  const toggle = root.querySelector<HTMLButtonElement>('[data-picker-toggle]');
  const menu = root.querySelector<HTMLElement>('[data-picker-menu]');
  if (!toggle || !menu) return undefined;
  const name = root.querySelector<HTMLElement>('[data-picker-name]');
  const scrim = root.querySelector<HTMLElement>('[data-picker-scrim]');
  const rows = [...menu.querySelectorAll<HTMLButtonElement>('button[data-pick]')];

  let openedAt = 0;
  const isOpen = (): boolean => toggle.getAttribute('aria-expanded') === 'true';

  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    close(true);
  };
  // The capture phase, so a tap anywhere outside closes the menu before that tap does its own work.
  const onOutside = (e: Event): void => {
    if (!root.contains(e.target as Node)) close();
  };
  const onScroll = (): void => {
    if (Math.abs((win?.scrollY ?? 0) - openedAt) > SCROLL_GIVE) close();
  };

  /** Scrolls the menu itself, never the page, to bring a row into view. */
  const bring = (row: HTMLElement): void => {
    if (row.offsetTop < menu.scrollTop) menu.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = row.offsetTop + row.offsetHeight - menu.clientHeight;
    }
  };
  const focusRow = (row: HTMLButtonElement | undefined): void => {
    if (!row) return;
    row.focus({ preventScroll: true });
    bring(row);
  };

  const open = (): void => {
    if (isOpen()) return;
    openedAt = win?.scrollY ?? 0;
    toggle.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    if (scrim) scrim.hidden = false;
    focusRow(rows.find((r) => r.getAttribute('aria-current') === 'true') ?? rows[0]);
    doc.addEventListener('keydown', onKey);
    doc.addEventListener('pointerdown', onOutside, true);
    win?.addEventListener('scroll', onScroll, { passive: true });
  };

  const close = (refocus = false): void => {
    if (!isOpen()) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    if (scrim) scrim.hidden = true;
    doc.removeEventListener('keydown', onKey);
    doc.removeEventListener('pointerdown', onOutside, true);
    win?.removeEventListener('scroll', onScroll);
    if (refocus) toggle.focus({ preventScroll: true });
  };

  const onToggle = (): void => {
    if (isOpen()) close();
    else open();
  };

  // Down or Up on the closed face opens the menu, the way a select does.
  const onToggleKey = (e: KeyboardEvent): void => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    open();
  };

  const onMenuKey = (e: KeyboardEvent): void => {
    const at = rows.indexOf(doc.activeElement as HTMLButtonElement);
    const last = rows.length - 1;
    let next: number;
    if (e.key === 'ArrowDown') next = at < 0 || at === last ? 0 : at + 1;
    else if (e.key === 'ArrowUp') next = at <= 0 ? last : at - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    focusRow(rows[next]);
  };

  const onRow = (e: MouseEvent): void => {
    const row = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-pick]');
    if (!row?.dataset.pick) return;
    close();
    // A click from Enter or Space carries no pointer, so its `detail` (the click count) is 0.
    opts.onPick(row.dataset.pick, e.detail === 0);
  };

  const onScrim = (): void => close();

  // Focus going somewhere outside closes the menu. Focus going nowhere (a tap on plain page, or a
  // Safari tap, which does not focus buttons) is left to the outside-tap check.
  const onFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget as Node | null;
    if (next && !root.contains(next)) close();
  };

  toggle.addEventListener('click', onToggle);
  toggle.addEventListener('keydown', onToggleKey);
  menu.addEventListener('keydown', onMenuKey);
  menu.addEventListener('click', onRow);
  scrim?.addEventListener('click', onScrim);
  root.addEventListener('focusout', onFocusOut);

  return {
    update(active, label) {
      if (name) name.textContent = label;
      for (const row of rows) {
        if (row.dataset.pick === active) row.setAttribute('aria-current', 'true');
        else row.removeAttribute('aria-current');
      }
    },
    close: () => close(),
    dispose() {
      close();
      toggle.removeEventListener('click', onToggle);
      toggle.removeEventListener('keydown', onToggleKey);
      menu.removeEventListener('keydown', onMenuKey);
      menu.removeEventListener('click', onRow);
      scrim?.removeEventListener('click', onScrim);
      root.removeEventListener('focusout', onFocusOut);
    },
  };
}
