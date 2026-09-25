// @vitest-environment node
// Material and Method as two closed lists over one text cell each (owner, 2026-09-21).
//
// The interesting part is not the lists, it is everything the cells already hold: rows written by
// hand, by the scraper and by three earlier versions of the form. A control that only understood its
// own options would quietly rewrite them on the next save.
import { describe, expect, it } from 'vitest';
import {
  MATERIAL_OPTIONS,
  METHOD_OPTIONS,
  extraTerms,
  joinTerms,
  matchTerms,
  splitTerms,
  termsFromScrape,
} from '../../src/lib/terms.ts';

describe('the two lists', () => {
  it('are the values the owner named, in the order the dropdown shows them', () => {
    expect([...MATERIAL_OPTIONS]).toEqual(['Wool', 'Viscose', 'Silk', 'Cotton', 'Bamboo']);
    expect([...METHOD_OPTIONS]).toEqual([
      'Hand-Knotted',
      'Flatweave',
      'Hand-Woven',
      'Hand-Loomed',
      'Hand-Embroidered',
      'Jacquard Loom',
      'Aghabani - Natural Dye',
    ]);
  });

  it('offers Hand-Loomed as its own choice and no longer offers Vegetable Dye (owner, 2026-09-25)', () => {
    expect(METHOD_OPTIONS).toContain('Hand-Loomed');
    expect(METHOD_OPTIONS).not.toContain('Vegetable Dye');
  });
});

describe('splitTerms', () => {
  it('reads a stored cell into the list, however it was spelled', () => {
    expect(splitTerms('Wool', MATERIAL_OPTIONS)).toEqual(['Wool']);
    expect(splitTerms('100% Wool', MATERIAL_OPTIONS)).toEqual(['Wool']);
    expect(splitTerms('hand knotted', METHOD_OPTIONS)).toEqual(['Hand-Knotted']);
    expect(splitTerms('HAND-WOVEN', METHOD_OPTIONS)).toEqual(['Hand-Woven']);
    // Hand-loomed was read as Hand-Woven until it became its own option (2026-09-25).
    expect(splitTerms('Hand-loomed', METHOD_OPTIONS)).toEqual(['Hand-Loomed']);
    expect(splitTerms('handloom', METHOD_OPTIONS)).toEqual(['Hand-Loomed']);
    // The supplier's own words for a knotted pile.

    expect(splitTerms('Handmade pile rug', METHOD_OPTIONS)).toEqual(['Hand-Knotted']);
    expect(splitTerms('Viscos', MATERIAL_OPTIONS)).toEqual(['Viscose']);
  });

  it('reads several from one cell, from either separator, and never twice', () => {
    expect(splitTerms('Wool, Silk', MATERIAL_OPTIONS)).toEqual(['Wool', 'Silk']);
    expect(splitTerms('Wool|Silk', MATERIAL_OPTIONS)).toEqual(['Wool', 'Silk']);
    expect(splitTerms('Wool and silk', MATERIAL_OPTIONS)).toEqual(['Wool', 'Silk']);
    expect(splitTerms('Hand-knotted, handknotted', METHOD_OPTIONS)).toEqual(['Hand-Knotted']);
    expect(splitTerms(' , ,Cotton, ', MATERIAL_OPTIONS)).toEqual(['Cotton']);
  });

  it('keeps a value nothing recognises, exactly as typed', () => {
    // The one thing worth keeping verbatim: a cell no rule can read is the studio's own word for
    // something, and the form offers it back as a ticked option rather than dropping it.
    expect(splitTerms('Tufted', METHOD_OPTIONS)).toEqual(['Tufted']);
    expect(extraTerms('Tufted', METHOD_OPTIONS)).toEqual(['Tufted']);
    expect(extraTerms('Hand-loomed', METHOD_OPTIONS)).toEqual([]);
    // Off the list since 2026-09-25, but a row that already says it keeps saying it.
    expect(splitTerms('Hand-Knotted, Vegetable Dye', METHOD_OPTIONS)).toEqual([
      'Hand-Knotted',
      'Vegetable Dye',
    ]);
    expect(extraTerms('Hand-Knotted, Vegetable Dye', METHOD_OPTIONS)).toEqual(['Vegetable Dye']);
    expect(extraTerms('100% Wool', MATERIAL_OPTIONS)).toEqual([]);
  });

  it('is empty for a blank cell', () => {
    expect(splitTerms(undefined, MATERIAL_OPTIONS)).toEqual([]);
    expect(splitTerms('   ', METHOD_OPTIONS)).toEqual([]);
  });
});

describe('joinTerms', () => {
  it('writes the cell back in the list spelling', () => {
    expect(joinTerms(['Wool', 'Silk'], MATERIAL_OPTIONS)).toBe('Wool, Silk');
    expect(joinTerms(['hand knotted'], METHOD_OPTIONS)).toBe('Hand-Knotted');
    expect(joinTerms([], METHOD_OPTIONS)).toBe('');
  });
});

describe('matchTerms', () => {
  it('finds what a supplier page says, and nothing it does not', () => {
    expect(matchTerms('Material: 100% Wool pile on a cotton foundation', MATERIAL_OPTIONS)).toEqual([
      'Wool',
      'Cotton',
    ]);
    expect(matchTerms('Technique: Hand-knotted', METHOD_OPTIONS)).toEqual(['Hand-Knotted']);
    expect(matchTerms('A vintage Turkish kilim', METHOD_OPTIONS)).toEqual(['Flatweave']);
    expect(matchTerms('Soft and beautiful', MATERIAL_OPTIONS)).toEqual([]);
    expect(matchTerms(undefined, MATERIAL_OPTIONS)).toEqual([]);
  });

  it('does not match a word inside another word', () => {
    // "woollen" is wool; "Woolworths" is a shop. Boundaries, not substrings.
    expect(matchTerms('Woolworths silkscreen', MATERIAL_OPTIONS)).toEqual([]);
    expect(matchTerms('woollen', MATERIAL_OPTIONS)).toEqual(['Wool']);
  });

  it('gives the longest name the match, so overlapping options do not both fire', () => {
    expect(matchTerms('Aghabani - Natural Dye', METHOD_OPTIONS)).toEqual(['Aghabani - Natural Dye']);
    expect(matchTerms('Handmade pile rug', METHOD_OPTIONS)).toEqual(['Hand-Knotted']);
  });

  it('tells hand-woven and hand-loomed apart', () => {
    expect(matchTerms('Hand woven, then hand loomed', METHOD_OPTIONS)).toEqual(['Hand-Woven', 'Hand-Loomed']);
    expect(matchTerms('A handloomed wool rug', METHOD_OPTIONS)).toEqual(['Hand-Loomed']);
  });

  it('no longer reads natural dyes as a method, now that Vegetable Dye is off the list', () => {
    expect(matchTerms('Dyed with natural dyes', METHOD_OPTIONS)).toEqual([]);
  });
});

describe('termsFromScrape', () => {
  it('trusts the supplier field first', () => {
    // A description mentioning cotton may be describing the foundation, the fringe, or the rug in
    // the next photograph; the field the supplier labelled "Material" is a stated fact.
    expect(termsFromScrape('Wool', MATERIAL_OPTIONS, 'Silk rug', 'Silk and cotton everywhere')).toEqual([
      'Wool',
    ]);
  });

  it('falls back to the title and the description only when the field says nothing usable', () => {
    expect(termsFromScrape('', METHOD_OPTIONS, `Hand-knotted Wool Rug`, undefined)).toEqual(['Hand-Knotted']);
    expect(termsFromScrape(undefined, MATERIAL_OPTIONS, undefined, 'Woven from bamboo silk')).toEqual([
      'Silk',
      'Bamboo',
    ]);
  });

  it('keeps an unrecognised supplier field rather than guessing from prose around it', () => {
    expect(termsFromScrape('Tufted', METHOD_OPTIONS, 'A kilim, probably', undefined)).toEqual(['Tufted']);
  });

  it('is empty when nothing anywhere says anything', () => {
    expect(termsFromScrape('', MATERIAL_OPTIONS, '', '')).toEqual([]);
  });
});
