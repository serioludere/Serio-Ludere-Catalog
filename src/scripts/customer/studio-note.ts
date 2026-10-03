// The studio's note to a signed-in buyer (owner, 2026-10-03): a banner that rises from the bottom
// of the catalog ten seconds in, saying the pieces are one of a kind and that the studio can find or
// make a close match, with a button to close it.
//
// Rendered `hidden`, so a buyer without JavaScript — who could not close it — never sees it. Once
// closed it stays closed in that browser; storage that throws (a private window, blocked site data)
// only means it may come back on the next visit.

const DELAY_MS = 10_000;
/** --motion-transition on the preview (600ms), the length of the slide in StudioNote.astro. */
const SLIDE_MS = 600;
const CLOSED_KEY = 'sl-studio-note-closed';

function wasClosed(): boolean {
  try {
    return localStorage.getItem(CLOSED_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberClosed(): void {
  try {
    localStorage.setItem(CLOSED_KEY, '1');
  } catch {
    /* Not remembered: it may show again next visit, which is harmless. */
  }
}

export function initStudioNote(): void {
  const note = document.querySelector<HTMLElement>('[data-studio-note]');
  if (!note || wasClosed()) return;

  window.setTimeout(() => {
    note.hidden = false;
    // One frame at the start position first, or the browser skips straight to the end of the slide.
    requestAnimationFrame(() => requestAnimationFrame(() => note.classList.add('is-open')));
  }, DELAY_MS);

  note.querySelector('[data-studio-note-close]')?.addEventListener('click', () => {
    rememberClosed();
    note.classList.remove('is-open');
    const done = (): void => {
      note.hidden = true;
    };
    // No transition under reduced motion, so no transitionend: hide straight away.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done();
      return;
    }
    // The note's own slide only: the button's hover fade bubbles a transitionend up here too, and
    // would hide the band mid-slide. The timer covers a tab that is not painting, which never fires
    // transitionend at all.
    note.addEventListener('transitionend', (e) => {
      if (e.target === note) done();
    });
    window.setTimeout(done, SLIDE_MS + 100);
  });
}
