// The studio's own storefront, serioludere.com (owner, 2026-09-23): the theme's spec blocks and the
// ECG phrasing its descriptions reuse. The whole-page reading, on real captured pages, is in
// serioludere.test.ts.
import { describe, expect, it } from 'vitest';
import { proseFacts, storefrontSpecs } from '../../../src/lib/scrape/storefront.ts';

/** The theme's markup, as serioludere.com renders it (trimmed to the parts that matter). */
function page(accordion: string[] | null, blocks: Record<string, string>): string {
  const spec = accordion
    ? `<details class="accordion__disclosure group"><summary><span class="accordion__toggle h6"><span>Specifications</span></span></summary>
       <div class="accordion__content prose"><p>${accordion.join('<br>')}</p></div></details>`
    : '';
  const short = Object.entries(blocks)
    .map(
      ([id, text]) =>
        `<div class="product-info__block-item" data-block-id="${id}" data-block-type="text"><div class="prose"><p>${text}</p></div></div>`,
    )
    .join('');
  return `<html><body><main>${short}
    <details class="accordion__disclosure"><summary>Care instructions</summary><div class="accordion__content prose"><p>Material: not this one</p></div></details>
    ${spec}</main></body></html>`;
}

describe('storefrontSpecs', () => {
  it('reads every labelled fact of the Specifications accordion', () => {
    const specs = storefrontSpecs(
      page(
        [
          'Accent color: Beige, Dark Brown',
          'Color: Brown',
          'Method: Hand-Knotted',
          'Pile: Thick Pile',
          'Age: New',
          'Origin: Nepal',
          'Material: Wool, Silk',
          'Size: Medium',
          'Dimensions: 170 x 259 cm',
          'Shape: Rectangular',
        ],
        {
          spec_size: 'Size: 170 cm x 259 cm',
          spec_method: 'Method: Hand-Knotted',
          spec_material: 'Material: Wool and Silk',
        },
      ),
    );
    expect(specs).toEqual({
      dimensions: '170 x 259 cm',
      sizeBand: 'Medium',
      material: 'Wool, Silk', // the accordion's list, not the short block's "Wool and Silk"
      method: 'Hand-Knotted',
      age: 'New',
      origin: 'Nepal',
      pile: 'Thick Pile',
      shape: 'Rectangular',
      colors: ['Beige', 'Dark Brown', 'Brown'],
      styles: [],
    });
  });

  it('ignores the other accordions ("Care instructions" is not a spec)', () => {
    expect(storefrontSpecs(page(null, {})).material).toBeUndefined();
  });

  it('falls back to the short blocks, and skips their empty "Method:" and "Size: x"', () => {
    expect(
      storefrontSpecs(
        page(null, { spec_size: 'Size: 85 cm x 81 cm', spec_method: 'Method:', spec_material: 'Material:' }),
      ),
    ).toEqual({ dimensions: '85 cm x 81 cm', colors: [], styles: [] });
    expect(
      storefrontSpecs(page([], { spec_size: 'Size: x', spec_method: 'Method:', spec_material: 'Material:' })),
    ).toEqual({ colors: [], styles: [] });
  });

  it('keeps a partial accordion partial — a vintage rug with no method or material', () => {
    const specs = storefrontSpecs(
      page(['Age: Vintage', 'Size: Medium', 'Dimensions: 160 x 250 cm', 'Shape: Rectangular'], {
        spec_size: 'Size: 160 cm x 250 cm',
        spec_method: 'Method:',
      }),
    );
    expect(specs).toEqual({
      age: 'Vintage',
      sizeBand: 'Medium',
      dimensions: '160 x 250 cm',
      shape: 'Rectangular',
      colors: [],
      styles: [],
    });
  });

  it('is empty, never throwing, for no page or another theme', () => {
    expect(storefrontSpecs(undefined)).toEqual({ colors: [], styles: [] });
    expect(storefrontSpecs('<html><body><p>Material: Wool</p></body></html>')).toEqual({
      colors: [],
      styles: [],
    });
  });
});

describe('proseFacts (ECG copy, for a page whose blocks could not be read)', () => {
  it('reads the standard ECG description', () => {
    const text = [
      'Handmade in Nepal, these rugs are simple, elegant and eye-catching',
      'Casual, Transitional style rug with Beige, Dark Brown accent colors',
      'Imported from Nepal and crafted using the finest weaving techniques',
      'Hand-knotted and constructed from 60% Wool & 40% Silk with 100% Cotton foundation',
      '5-Feet 7-Inch by 8-Feet 6-Inch (170 cm x 259 cm)',
    ].join('\n');
    expect(proseFacts(text)).toEqual({
      origin: 'Nepal',
      material: '60% Wool, 40% Silk', // the pile — never the cotton foundation
      colors: ['Beige', 'Dark Brown'],
      styles: ['Casual', 'Transitional'],
    });
  });

  it('reads the newer ECG copy: base colour, "hand knotted from", pile height, newly woven', () => {
    const text = [
      'Handmade in Pakistan, this Peshawar Ziegler rug features an abstract design.',
      'Brown base with dark brown, grey, and light khaki accents',
      'Hand knotted from 100% wool for lasting quality',
      'Medium pile height offers a soft feel underfoot',
      'Newly woven using time-honoured techniques',
    ].join('\n');
    expect(proseFacts(text)).toEqual({
      origin: 'Pakistan',
      material: '100% wool',
      age: 'New',
      pile: 'Medium Pile',
      colors: ['Brown'],
      styles: [],
    });
  });

  it('files a flat weave as No Pile, like the store does, and reads an age in years', () => {
    expect(
      proseFacts('Handwoven flat weave from 100% wool\nFlat pile is ideal for low-clearance areas').pile,
    ).toBe('No Pile');
    expect(proseFacts('Handwoven flat weave from 100% wool').material).toBe('100% wool');
    expect(proseFacts('Medallion design\n40–50 years old').age).toBe('40–50 years old');
    expect(proseFacts('50 Years Old').age).toBe('50 years old');
    expect(proseFacts('A vintage piece').age).toBe('Vintage');
  });

  it('says nothing it was not told', () => {
    expect(proseFacts(undefined)).toEqual({ colors: [], styles: [] });
    expect(proseFacts('A heavily laden fruit tree anchors the scene.')).toEqual({ colors: [], styles: [] });
    // "made in the 1960s" is not a country.
    expect(proseFacts('Probably made in the 1960s').origin).toBeUndefined();
  });
});
