// The legacy `.msg` banner (reference/admin.html `msg()` / `hide()`): text only, three kinds, and an
// optional trailing action link built as a node (never markup).
import { append, clear } from './dom.ts';

export type MsgKind = 'ok' | 'err' | 'busy';

export function msg(target: HTMLElement, content: string | Node | Array<string | Node>, kind: MsgKind): void {
  // A live region is announced only if it is ALREADY in the accessibility tree when its content
  // changes. `.msg` is `display: none` until `on` (src/styles/admin.css:174-183), so inserting the
  // content first — as this did — mutated a node the tree did not yet contain, and stamped the role
  // on afterwards. Nothing was ever announced: not a save, not an error, not a retry. This is the
  // only feedback channel in the admin.
  //
  // Order now: role, then visibility, then a forced layout read, then the content.
  //
  // Honest limitation: reading offsetHeight flushes LAYOUT, not the accessibility tree, and no DOM
  // API flushes the latter on demand. It makes the element rendered — and therefore eligible for the
  // tree — before the text lands, which is what the announcement depends on, but the two still occur
  // in one task and a given screen reader may still coalesce them. A region that is permanently in
  // the tree and merely empty would be strictly more reliable; that needs the banner markup to change
  // on every admin page, so it is recorded in docs/ui-audit/ rather than done here.
  target.setAttribute('role', kind === 'err' ? 'alert' : 'status');
  target.className = `msg on ${kind}`;
  void target.offsetHeight;
  clear(target);
  append(target, Array.isArray(content) ? content : [content]);
}

export function hide(target: HTMLElement): void {
  target.className = 'msg';
  clear(target);
}

export function isShown(target: HTMLElement): boolean {
  return target.classList.contains('on');
}

/** Hides the visible banners in `doc` (Escape, §8.2). Returns how many were hidden. */
export function hideVisible(doc: Document = document): number {
  let n = 0;
  doc.querySelectorAll<HTMLElement>('.msg.on').forEach((m) => {
    hide(m);
    n++;
  });
  return n;
}
