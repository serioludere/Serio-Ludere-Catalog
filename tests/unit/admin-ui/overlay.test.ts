// @vitest-environment happy-dom
// Modal / Drawer / Fetch Modal behaviour — Figma 24:232, 73:237, 78:241.
//
// All three are native <dialog>, so the top layer, backdrop, Esc-to-close and focus trapping come
// from the platform. This module only adds what <dialog> does not: opening by id, closing on a
// backdrop click, and — for the Drawer — returning focus to whatever opened it, because the list
// behind stays mounted and the eye should come back to where it left.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bindOverlays } from '../../../src/scripts/ui/overlay.ts';

const off: Array<() => void> = [];
afterEach(() => {
  while (off.length) off.pop()?.();
});

/** happy-dom implements <dialog> only partially; showModal/close are stubbed onto the element. */
function stubDialog(el: HTMLElement): void {
  const d = el as HTMLDialogElement & { showModal: () => void; close: () => void };
  d.showModal = () => {
    d.setAttribute('open', '');
  };
  d.close = () => {
    d.removeAttribute('open');
    d.dispatchEvent(new Event('close'));
  };
}

beforeEach(() => {
  document.body.innerHTML = `
    <button type="button" id="opener" data-open="add-rug">Add product</button>
    <dialog id="add-rug" class="drawer">
      <button type="button" class="drawer__close" data-close="add-rug">Close</button>
      <input id="first" />
    </dialog>`;
  stubDialog(document.getElementById('add-rug')!);
});

describe('opening', () => {
  it('opens the dialog named by data-open', () => {
    off.push(bindOverlays());
    document.getElementById('opener')!.click();
    expect(document.getElementById('add-rug')!.hasAttribute('open')).toBe(true);
  });

  it('does nothing when the id names no dialog — a stale data-open must not throw', () => {
    document.getElementById('opener')!.setAttribute('data-open', 'nope');
    off.push(bindOverlays());
    expect(() => document.getElementById('opener')!.click()).not.toThrow();
  });
});

describe('focus on open', () => {
  it('lands in the first field, not on the Close control', () => {
    off.push(bindOverlays());
    document.getElementById('opener')!.click();
    // <dialog> would focus Close, which is a dismiss button, not the thing you opened the form for.
    expect(document.activeElement?.id).toBe('first');
  });
});

describe('closing', () => {
  it('closes on the close control', () => {
    off.push(bindOverlays());
    document.getElementById('opener')!.click();
    document.querySelector<HTMLButtonElement>('[data-close]')!.click();
    expect(document.getElementById('add-rug')!.hasAttribute('open')).toBe(false);
  });

  it('returns focus to the opener — the list behind was never unmounted', () => {
    off.push(bindOverlays());
    const opener = document.getElementById('opener') as HTMLButtonElement;
    opener.click();
    document.getElementById('first')!.focus();
    document.querySelector<HTMLButtonElement>('[data-close]')!.click();
    expect(document.activeElement).toBe(opener);
  });

  it('does not steal focus when the opener has since left the page', () => {
    off.push(bindOverlays());
    const opener = document.getElementById('opener')!;
    opener.click();
    opener.remove();
    expect(() => document.querySelector<HTMLButtonElement>('[data-close]')!.click()).not.toThrow();
  });
});

describe('backdrop dismissal', () => {
  /** happy-dom has no layout: the dialog is given a box so "outside the frame" means something. */
  function boxed(el: HTMLElement): void {
    el.getBoundingClientRect = () =>
      ({ left: 100, top: 100, right: 400, bottom: 500, x: 100, y: 100, width: 300, height: 400 }) as DOMRect;
  }

  function press(target: EventTarget, x: number, y: number): void {
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
  }
  function release(target: EventTarget, x: number, y: number): void {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
  }

  let dialog: HTMLElement;
  beforeEach(() => {
    dialog = document.getElementById('add-rug')!;
    boxed(dialog);
    off.push(bindOverlays());
    document.getElementById('opener')!.click();
  });

  it('closes when the whole gesture happened on the backdrop', () => {
    press(dialog, 20, 20);
    release(dialog, 20, 20);
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('stays open when a drag begins in the form and ends past the frame', () => {
    // Selecting the text in a field and letting go outside: the browser fires ONE click, on the
    // <dialog> itself, at coordinates outside its box. That is not a dismissal.
    press(document.getElementById('first')!, 200, 200);
    release(dialog, 20, 20);
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('stays open when a backdrop press is released inside the form', () => {
    press(dialog, 20, 20);
    release(document.getElementById('first')!, 200, 200);
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('does not carry a backdrop press over to the next click', () => {
    press(dialog, 20, 20);
    release(document.getElementById('first')!, 200, 200);
    release(dialog, 20, 20); // a click with no press of its own
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('ignores a click inside the frame that targets the dialog', () => {
    press(dialog, 200, 200);
    release(dialog, 200, 200);
    expect(dialog.hasAttribute('open')).toBe(true);
  });
});

describe('teardown', () => {
  it('stops listening once unbound, so a second bind cannot double-fire', () => {
    const stop = bindOverlays();
    stop();
    document.getElementById('opener')!.click();
    expect(document.getElementById('add-rug')!.hasAttribute('open')).toBe(false);
  });
});
