// @vitest-environment happy-dom
// The collection dropdown on a phone, drawn in the catalogue's own style (owner, 2026-10-09: the
// native list looked bare). Pinned here: opening and closing, the ways out a menu is expected to
// have, the keys, and what it hands back to filters.ts.
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { bindCollectionMenu, type CollectionMenu } from '../../../src/scripts/customer/collection-menu.ts';

const MENU = `
  <div data-collection-picker>
    <button data-picker-toggle aria-expanded="false"><span data-picker-name>Classics</span></button>
    <div data-picker-scrim hidden></div>
    <ul data-picker-menu hidden>
      <li><button data-pick="classics">Classics</button></li>
      <li><button data-pick="kilims" aria-current="true">Kilims</button></li>
      <li><button data-pick="all">All</button></li>
    </ul>
  </div>
  <button id="elsewhere">Elsewhere</button>`;

/** A window stand-in whose scroll position the test moves. */
function fakeWin() {
  const listeners = new Map<string, () => void>();
  const win = {
    scrollY: 900,
    addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
    removeEventListener: (type: string) => listeners.delete(type),
  };
  return {
    win: win as unknown as Window,
    scrollTo(y: number) {
      win.scrollY = y;
      listeners.get('scroll')?.();
    },
  };
}

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector<T>(sel)!;
const toggle = () => $<HTMLButtonElement>('[data-picker-toggle]');
const menuEl = () => $('[data-picker-menu]');
const isOpen = () => toggle().getAttribute('aria-expanded') === 'true';
const row = (pick: string) => $<HTMLButtonElement>(`[data-pick="${pick}"]`);
const key = (target: HTMLElement, k: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

let menu: CollectionMenu | undefined;
let onPick: Mock<(filter: string, byKeyboard: boolean) => void>;
let scroll: (y: number) => void;

beforeEach(() => {
  document.body.innerHTML = MENU;
  onPick = vi.fn<(filter: string, byKeyboard: boolean) => void>();
  const w = fakeWin();
  scroll = w.scrollTo;
  menu = bindCollectionMenu($('[data-collection-picker]'), { onPick, win: w.win });
});

afterEach(() => {
  menu?.dispose();
  menu = undefined;
});

describe('bindCollectionMenu', () => {
  it('opens from the face, dims the page, and puts focus on the collection on screen', () => {
    toggle().click();
    expect(isOpen()).toBe(true);
    expect(menuEl().hidden).toBe(false);
    expect($('[data-picker-scrim]').hidden).toBe(false);
    expect(document.activeElement).toBe(row('kilims'));

    toggle().click();
    expect(isOpen()).toBe(false);
    expect(menuEl().hidden).toBe(true);
    expect($('[data-picker-scrim]').hidden).toBe(true);
  });

  it('hands back the row chosen, and closes', () => {
    toggle().click();
    // A tap: a pointer click counts one (`detail`), where `.click()` would count none.
    row('all').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(onPick).toHaveBeenCalledWith('all', false);
    expect(isOpen()).toBe(false);
  });

  it('says when Enter or Space chose the row, so focus can be put somewhere still on screen', () => {
    toggle().click();
    // A keyboard click carries no pointer: its click count (`detail`) is 0.
    row('classics').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(onPick).toHaveBeenCalledWith('classics', true);
    toggle().click();
    row('classics').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(onPick).toHaveBeenLastCalledWith('classics', false);
  });

  it('closes on Esc and gives focus back to the face', () => {
    toggle().click();
    key(row('kilims'), 'Escape');
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it('closes on a tap on the dimmed page, which goes no further', () => {
    toggle().click();
    $('[data-picker-scrim]').click();
    expect(isOpen()).toBe(false);
    expect(onPick).not.toHaveBeenCalled();
  });

  it('closes on a tap anywhere else, and when the page scrolls more than a nudge', () => {
    toggle().click();
    $('#elsewhere').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(isOpen()).toBe(false);

    toggle().click();
    scroll(905); // iOS moving its toolbars
    expect(isOpen()).toBe(true);
    scroll(1000);
    expect(isOpen()).toBe(false);
  });

  it('moves between rows with the arrow keys, Home and End, round the ends', () => {
    toggle().click();
    key(row('kilims'), 'ArrowDown');
    expect(document.activeElement).toBe(row('all'));
    key(row('all'), 'ArrowDown');
    expect(document.activeElement).toBe(row('classics'));
    key(row('classics'), 'ArrowUp');
    expect(document.activeElement).toBe(row('all'));
    key(row('all'), 'Home');
    expect(document.activeElement).toBe(row('classics'));
    key(row('classics'), 'End');
    expect(document.activeElement).toBe(row('all'));
  });

  it('opens on Down from the closed face, the way a select does', () => {
    key(toggle(), 'ArrowDown');
    expect(isOpen()).toBe(true);
    expect(document.activeElement).toBe(row('kilims'));
  });

  it('names the face and marks the row on screen, or none during a search', () => {
    menu!.update('classics', 'Classics');
    expect($('[data-picker-name]').textContent).toBe('Classics');
    expect(row('classics').getAttribute('aria-current')).toBe('true');
    expect(row('kilims').hasAttribute('aria-current')).toBe(false);

    menu!.update('', 'Search results');
    expect($('[data-picker-name]').textContent).toBe('Search results');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(0);
  });

  it('does nothing without its face or its menu', () => {
    document.body.innerHTML = '<div data-collection-picker></div>';
    expect(bindCollectionMenu($('[data-collection-picker]'), { onPick: vi.fn() })).toBeUndefined();
  });
});
