// The admin locks page scrolling while a <dialog> is open (admin.css `html:has(dialog[open])`).
// Hiding the document scrollbar widens the viewport by the scrollbar's width, which jolted the rail,
// the topbar and every table sideways under the scrim. `scrollbar-gutter: stable` fixed the jolt but
// reserved the gutter on EVERY page — on Windows an empty grey strip down the right edge of any
// screen too short to scroll.
//
// So the width is measured instead, and only while the page can still scroll: it is published as
// `--sl-scrollbar` on <html> (a CSSOM write, which the hash CSP permits) and the lock pads the root
// by exactly that much. On macOS overlay scrollbars and on phones the value is 0 and nothing moves.

export interface ScrollLockBindings {
  doc?: Document;
  win?: Window;
}

/** The document scrollbar's width right now: 0 when there is none or it overlays the content. */
export function measureScrollbar(win: Window, doc: Document): number {
  return Math.max(0, win.innerWidth - doc.documentElement.clientWidth);
}

export function bindScrollLock(opts: ScrollLockBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const win = opts.win ?? window;
  const root = doc.documentElement;

  const update = (): void => {
    // Measured before the lock and kept during it: with the scrollbar gone the reading would be 0,
    // and the padding it feeds would vanish mid-dialog — the very jolt this exists to prevent.
    if (doc.querySelector('dialog[open]')) return;
    root.style.setProperty('--sl-scrollbar', `${measureScrollbar(win, doc)}px`);
  };

  update();
  win.addEventListener('resize', update, { passive: true });
  // The scrollbar comes and goes as content loads (a report, more audit rows); the root's content
  // box changes width when it does, which is what a ResizeObserver on <html> reports.
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
  ro?.observe(root);

  return () => {
    win.removeEventListener('resize', update);
    ro?.disconnect();
  };
}

export function initScrollLock(): void {
  if (typeof document === 'undefined') return;
  bindScrollLock();
}
