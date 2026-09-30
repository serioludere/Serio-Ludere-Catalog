// The product popup's rug and texture as two equal pictures (owner, 2026-09-30: "the same dimensions
// and size, ratio as the main thumbnail next to it, these 2 should look like equal even if we had to
// extend the popup width"), and the texture as a plain picture ("no need for the zoom").
//
// Like admin-geometry.test.ts, this reads the declarations rather than laying anything out: it pins
// the handful that make the pair equal, so a later edit cannot quietly undo one of them. The layout
// itself was checked in Chromium when it was built (identical boxes at 1440, 1280 and 390 wide, for a
// 3:4 rug and a 0.61 one).
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync('src/components/customer/ProductDialog.astro', 'utf8');
const markup = css.slice(0, css.indexOf('<style>'));

/** The declarations of the rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const at = css.indexOf(`\n  ${selector} {`);
  const alt = css.indexOf(`\n    ${selector} {`);
  const start = at >= 0 ? at : alt;
  if (start < 0) return '';
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('}', open));
}

describe('product popup: the rug and its texture as two equal pictures', () => {
  it('sizes the pair from the rug: two equal columns, only as wide as the rug needs', () => {
    const plates = rule('.pv-modal__plates.has-texture');
    expect(plates).toMatch(/display:\s*grid/);
    expect(plates).toMatch(/grid-template-columns:\s*1fr 1fr/);
    expect(plates).toMatch(/width:\s*fit-content/);
    // The rug at its own shape, as large as the plate height and its column allow.
    const hero = rule('.pv-modal__plates.has-texture .pv-modal__photo');
    expect(hero).toMatch(/width:\s*auto/);
    expect(hero).toMatch(/height:\s*auto/);
    expect(hero).toMatch(/max-width:\s*100%/);
    expect(hero).toMatch(/max-height:\s*var\(--pv-plate-h\)/);
  });

  it('fills the rug’s box with the texture, and never crops the rug', () => {
    const texture = rule('.pv-modal__texture img');
    // Out of the flow, so it takes the box the rug sets and adds nothing of its own.
    expect(texture).toMatch(/position:\s*absolute/);
    expect(texture).toMatch(/inset:\s*0/);
    expect(texture).toMatch(/object-fit:\s*cover/);
    expect(rule('.pv-modal__photo')).toMatch(/object-fit:\s*contain/); // ADR D6
  });

  it('widens the dialog for a rug with a texture, and keeps the facts column readable', () => {
    expect(css).toMatch(
      /\.pv-modal:has\(\.pv-modal__plates\.has-texture\)\s*\{\s*width:\s*min\(calc\(var\(--pv-pair-w\) \+ var\(--pv-info-w\)\)/,
    );
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0, var\(--pv-pair-w\)\) minmax\(380px, 1fr\)/);
  });

  it('has no enlarged view: the texture is a picture, not a button', () => {
    expect(markup).toMatch(/<figure class="pv-modal__texture">/);
    expect(markup).not.toMatch(/data-texture-zoom|data-zoom|pv-zoom/);
    expect(css).not.toMatch(/\.pv-zoom|cursor:\s*zoom-in/);
  });
});
