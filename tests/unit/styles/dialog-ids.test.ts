// @vitest-environment node
/**
 * Every bare <dialog> an admin page owns is styled by admin.css (owner, 2026-09-20).
 *
 * The Modal, Drawer and Fetch dialogs are styled by CLASS and so cannot drift. The two a page opens
 * directly — the confirm and the rename dialog — are styled by ID, and an id is exactly the kind of
 * thing a rename leaves behind: the rename dialog used to be the password-reset dialog, the markup
 * was renamed to `renameDialog`, and the stylesheet kept saying `#pwDialog`. Pressing Rename then
 * opened an unstyled browser box in the middle of the panel, which reads as "the rename does not
 * work" rather than as a missing stylesheet.
 *
 * This walks the admin pages for `<dialog id="...">` and requires a matching rule, so the next
 * rename fails here instead of in the panel.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/** The admin pages and the components only they render — both can own a bare <dialog>. */
const ADMIN_DIRS = [
  path.join(process.cwd(), 'src/pages/admin'),
  path.join(process.cwd(), 'src/components/admin'),
];
const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/admin.css'), 'utf8');

function astroFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return astroFiles(full);
    return e.isFile() && e.name.endsWith('.astro') ? [full] : [];
  });
}

/** `<dialog id="x">` on an admin page, ignoring the class-styled shared components. */
function pageDialogIds(): Array<{ id: string; file: string }> {
  const out: Array<{ id: string; file: string }> = [];
  for (const file of ADMIN_DIRS.flatMap(astroFiles)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<dialog\b[^>]*\sid="([A-Za-z0-9_-]+)"/g)) {
      out.push({ id: m[1]!, file: path.relative(process.cwd(), file) });
    }
  }
  return out;
}

describe('admin dialogs styled by id', () => {
  it('finds the page-owned dialogs at all, so an empty list cannot pass this file', () => {
    const ids = pageDialogIds().map((d) => d.id);
    expect(ids).toContain('renameDialog');
    expect(ids).toContain('confirm');
  });

  it('styles every one of them in admin.css', () => {
    const unstyled = pageDialogIds().filter(({ id }) => !css.includes(`dialog#${id}`));
    expect(unstyled.map((d) => `${d.id} (${d.file})`)).toEqual([]);
  });

  it('leaves no rule behind for a dialog id no page renders any more', () => {
    const ids = new Set(pageDialogIds().map((d) => d.id));
    const styled = [...css.matchAll(/dialog#([A-Za-z0-9_-]+)/g)].map((m) => m[1]!);
    expect([...new Set(styled)].filter((id) => !ids.has(id))).toEqual([]);
  });
});
