// @vitest-environment node
// How a rug was made, as four checkboxes over one text cell (owner, 2026-09-20).
//
// The interesting part is not the four names, it is what happens to everything that is NOT one of
// them: rows written by hand, by the scraper and by two earlier versions of the form all sit in the
// same column, and a control that only understood its own four options would quietly erase them on
// the next save.
import { describe, expect, it } from 'vitest';
import { METHOD_OPTIONS, joinMethods, otherMethods, splitMethods } from '../../src/lib/method.ts';

describe('splitMethods', () => {
  it('reads one technique, however it was spelled', () => {
    expect(splitMethods('Hand-knotted')).toEqual(['Hand-knotted']);
    expect(splitMethods('hand knotted')).toEqual(['Hand-knotted']);
    expect(splitMethods('HANDWOVEN')).toEqual(['Handwoven']);
    // The old fixture spelling. It is the same technique as "Handwoven" and must tick that box.
    expect(splitMethods('Hand-woven')).toEqual(['Handwoven']);
  });

  it('reads several, from either separator, and never twice', () => {
    expect(splitMethods('Flatweave, Hand-loomed')).toEqual(['Flatweave', 'Hand-loomed']);
    expect(splitMethods('Flatweave|Hand-loomed')).toEqual(['Flatweave', 'Hand-loomed']);
    expect(splitMethods('Hand-woven, handwoven')).toEqual(['Handwoven']);
    expect(splitMethods(' , ,Flatweave, ')).toEqual(['Flatweave']);
  });

  it('keeps a technique that is not one of the four, as typed', () => {
    // What a Karavan page says. Dropping it would lose a fact the studio scraped on purpose.
    expect(splitMethods('Handmade pile rug')).toEqual(['Handmade pile rug']);
    expect(splitMethods('Flatweave, Handmade pile rug')).toEqual(['Flatweave', 'Handmade pile rug']);
    expect(otherMethods('Flatweave, Handmade pile rug')).toEqual(['Handmade pile rug']);
    expect(otherMethods('Flatweave, Hand-woven')).toEqual([]);
  });

  it('is empty for a blank cell', () => {
    expect(splitMethods(undefined)).toEqual([]);
    expect(splitMethods('   ')).toEqual([]);
    expect(otherMethods('')).toEqual([]);
  });
});

describe('joinMethods', () => {
  it('writes the cell back in the canonical spelling', () => {
    expect(joinMethods(['Flatweave', 'Hand-loomed'])).toBe('Flatweave, Hand-loomed');
    expect(joinMethods(['hand woven'])).toBe('Handwoven');
    expect(joinMethods([])).toBe('');
  });

  it('round-trips whatever the cell already held', () => {
    for (const cell of ['Hand-knotted', 'Flatweave, Handmade pile rug', '']) {
      expect(joinMethods(splitMethods(cell))).toBe(splitMethods(cell).join(', '));
    }
  });
});

describe('METHOD_OPTIONS', () => {
  it('is the four the owner named, in the order the form lists them', () => {
    expect([...METHOD_OPTIONS]).toEqual(['Flatweave', 'Hand-loomed', 'Hand-knotted', 'Handwoven']);
  });
});
