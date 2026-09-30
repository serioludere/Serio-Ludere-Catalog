// The Add-product modal scrolls in ONE place, its body (owner, 2026-09-30: "a double scroll, one of
// them is useless"). The second scrollbar was the dialog's own: the UA gives a modal <dialog>
// `overflow: auto`, and the visually hidden "New tags" label — absolutely placed, with the dialog as
// its containing block — sat 1,486px down a fetched product and stretched the dialog to that height.
// Checked in Chromium when it was fixed (dialog 730/1485 before, 730/730 after); this pins the two
// declarations that fix it.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync('src/styles/components.css', 'utf8');

/** The declarations of the rule whose selector is exactly `selector`, at the top level. */
function rule(selector: string): string {
  const at = css.indexOf(`\n${selector} {`);
  if (at < 0) return '';
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}

describe('the wide modal scrolls in its body only', () => {
  it('makes the body the containing block, so nothing positioned escapes its scrolling', () => {
    const body = rule('.modal--wide .modal__body');
    expect(body).toMatch(/position:\s*relative/);
    expect(body).toMatch(/overflow-y:\s*auto/);
    expect(body).toMatch(/min-height:\s*0/);
  });

  it('never lets the dialog itself scroll', () => {
    expect(rule('.modal--wide')).toMatch(/overflow:\s*hidden/);
  });
});
