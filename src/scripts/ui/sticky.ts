// Sticky bars (owner, 2026-10-03: "make the tab and navigation bar sticky on scroll so the user can
// change the tab", on the buyer's catalogue and in the admin, desktop and phone). `position: sticky`
// in the stylesheets does the pinning; this does the three things CSS cannot.
//
//   1. A bar that sticks BELOW another one needs that one's height for its `top`, and the height is
//      not a constant: the buyer's header wraps on a 320 phone, its controls change size at 768, the
//      admin topbar grows with a larger text setting. So the height is measured and published as a
//      custom property on <html> — a CSSOM write, which the hash CSP permits (scroll-lock.ts takes
//      the same route).
//   2. `is-stuck` on a bar while it is pinned, so it can draw an edge only then. At rest the page
//      keeps the layout it was drawn with.
//   3. A tab pressed while the bar is pinned swaps the list beneath it. Left where it was, the reader
//      would be part-way down a different list — or past its end, looking at the footer. `reveal()`
//      puts them back at the top of the new list, just under the bar.
//
// Position is read against a zero-height anchor placed immediately before the bar: a pinned bar's
// own rect reports where it is pinned, never where it would sit in the flow.
//
// A bar may also pin partly tucked under the header, with only its bottom edge showing. The buyer's
// tab strip does this on a phone, where it folds into a dropdown (owner, 2026-10-08). `restAt` then
// tells `reveal()` to open it back out fully, below the header.

export interface StickyBindings {
  doc?: Document;
  win?: Window;
}

export interface StickyBarBindings extends StickyBindings {
  /**
   * Where `reveal()` leaves the bar's top, in px from the top of the viewport. By default that is
   * where the bar pins. It is never above the pin line, because a bar left there would still be
   * pinned.
   */
  restAt?: () => number;
}

/** Publishes `el`'s rendered height as `prop` on <html>, and keeps it current. */
export function publishHeight(el: HTMLElement, prop: string, opts: StickyBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const root = doc.documentElement;
  const update = (): void => {
    root.style.setProperty(prop, `${el.getBoundingClientRect().height}px`);
  };
  update();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
  ro?.observe(el);
  return () => ro?.disconnect();
}

export interface StickyBar {
  /** True while the bar is pinned, i.e. the reader has scrolled past where it sits in the flow. */
  isStuck(): boolean;
  /** When pinned, scrolls back so the bar sits where it rests — the top of the list under it. */
  reveal(): void;
  dispose(): void;
}

export function bindStickyBar(
  bar: HTMLElement,
  anchor: HTMLElement,
  opts: StickyBarBindings = {},
): StickyBar {
  const win = opts.win ?? window;

  /** Where the bar pins, and where it would sit in the flow, both from the top of the viewport. */
  const place = (): { pinnedAt: number; restsAt: number } => {
    const style = win.getComputedStyle(bar);
    return {
      pinnedAt: Number.parseFloat(style.top) || 0,
      restsAt: anchor.getBoundingClientRect().top + (Number.parseFloat(style.marginTop) || 0),
    };
  };
  /** How far the bar's resting place is above where it is pinned; > 0 means pinned. */
  const overshoot = (): number => {
    const { pinnedAt, restsAt } = place();
    return pinnedAt - restsAt;
  };
  // Half a pixel of slack: fractional layout must not flicker the edge on and off at rest.
  const isStuck = (): boolean => overshoot() > 0.5;

  let queued = false;
  const paint = (): void => {
    queued = false;
    bar.classList.toggle('is-stuck', isStuck());
  };
  const onScroll = (): void => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(paint);
  };
  paint();
  win.addEventListener('scroll', onScroll, { passive: true });
  win.addEventListener('resize', onScroll, { passive: true });

  const reveal = (): void => {
    const { pinnedAt, restsAt } = place();
    const by = Math.max(pinnedAt, opts.restAt?.() ?? pinnedAt) - restsAt;
    if (by <= 0.5) return;
    // Instant, not smooth: the list has already changed under the bar, and a glide up through rugs
    // that are no longer the ones chosen is motion between the question and its answer.
    win.scrollTo({ top: Math.max(0, win.scrollY - by), behavior: 'instant' });
    paint();
  };

  return {
    isStuck,
    reveal,
    dispose: () => {
      win.removeEventListener('scroll', onScroll);
      win.removeEventListener('resize', onScroll);
    },
  };
}
