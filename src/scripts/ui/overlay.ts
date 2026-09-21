// Modal (24:232), Drawer (73:237) and Fetch Modal (78:241) behaviour.
//
// All three are native <dialog>, so the top layer, backdrop, Esc-to-close, focus trapping and
// inert-behind come from the platform. This module only adds what <dialog> does not:
//   - a close button wired by id,
//   - click-on-backdrop to dismiss, which <dialog> does not do — judged on both ends of the
//     gesture, so a drag that starts in the form and ends past the frame is not a dismissal,
//   - and for the Drawer, restoring the opener's focus, because the list behind stays mounted and
//     the eye should come back to where it left.

export interface OverlayBindings {
  doc?: Document;
}

/**
 * Backdrop presses land on the dialog itself, so compare against its own content box.
 *
 * Both ends of the gesture are checked, not just the release. A press that starts inside the
 * modal — dragging to select the text in a field, sweeping across a list of options — and ends
 * past the frame makes the browser fire one `click` on the nearest common ancestor, which IS the
 * <dialog>, at coordinates outside its box. Judged on the release alone that is indistinguishable
 * from a backdrop click, and the modal you were typing into vanished mid-selection (owner,
 * 2026-09-21). So a dismiss now requires the press to have begun on the backdrop too.
 */
function onBackdrop(dialog: HTMLDialogElement, e: MouseEvent): boolean {
  if (e.target !== dialog) return false;
  const r = dialog.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

export function bindOverlays(opts: OverlayBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const teardown: (() => void)[] = [];
  const openers = new Map<string, HTMLElement>();

  // Anything with [data-open="<id>"] opens that dialog and is remembered as the return point.
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[data-open]'))) {
    const id = el.getAttribute('data-open');
    if (!id) continue;
    const handler = (event: Event): void => {
      const dialog = doc.getElementById(id);
      // No dialog on this page: let the event run. The opener is often an <a> whose href is the
      // no-JS fallback (Add product -> /admin/rugs/new), and that fallback must still work.
      if (!(dialog instanceof HTMLDialogElement)) return;
      // The dialog EXISTS, so it is the experience Figma specifies (P3/P4 draw Add product as a
      // slide-over, not a page). Without this the anchor navigated and the drawer was unreachable:
      // it opened for one frame and the browser left the page. The whole drawer flow shipped dead.
      event.preventDefault();
      openers.set(id, el);
      dialog.showModal();
      // <dialog> focuses the first focusable child, which is the Close control — so opening
      // "Add product" would land on a dismiss button rather than in the form. Move to the first
      // real field when there is one; a dialog with no fields (a confirm) keeps the default.
      const field = dialog.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      field?.focus();
    };
    el.addEventListener('click', handler);
    teardown.push(() => el.removeEventListener('click', handler));
  }

  for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[data-close]'))) {
    const id = el.getAttribute('data-close');
    if (!id) continue;
    const handler = (): void => {
      const dialog = doc.getElementById(id);
      if (dialog instanceof HTMLDialogElement) dialog.close();
    };
    el.addEventListener('click', handler);
    teardown.push(() => el.removeEventListener('click', handler));
  }

  for (const dialog of Array.from(
    doc.querySelectorAll<HTMLDialogElement>('dialog.modal, dialog.drawer, dialog.fetch'),
  )) {
    // Where the current press began. Every press resets it, so a stale `true` can never outlive
    // the gesture that set it, and a click with no press before it (a synthetic one, or a keyboard
    // activation, which carries coordinates 0,0 and would read as "above and left of the frame")
    // dismisses nothing.
    let pressedBackdrop = false;
    const onMouseDown = (e: MouseEvent): void => {
      pressedBackdrop = onBackdrop(dialog, e);
    };
    const onClick = (e: MouseEvent): void => {
      const dismiss = pressedBackdrop && onBackdrop(dialog, e);
      pressedBackdrop = false;
      if (dismiss) dialog.close();
    };
    const onClose = (): void => {
      const opener = openers.get(dialog.id);
      if (opener && doc.contains(opener)) opener.focus();
      openers.delete(dialog.id);
    };
    dialog.addEventListener('mousedown', onMouseDown);
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('close', onClose);
    teardown.push(() => {
      dialog.removeEventListener('mousedown', onMouseDown);
      dialog.removeEventListener('click', onClick);
      dialog.removeEventListener('close', onClose);
    });
  }

  return () => {
    for (const fn of teardown) fn();
  };
}

export function initOverlays(): void {
  if (typeof document === 'undefined') return;
  bindOverlays();
}
