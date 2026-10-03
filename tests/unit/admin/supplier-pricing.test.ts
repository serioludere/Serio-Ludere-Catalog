// Per-supplier retail formulas (owner, 2026-09-13; ecarpetgallery's replaced 2026-10-03).
//
// The interesting part is not the arithmetic, it is the BOUNDARIES. The owner's wording is
// "if X<500 then add 100 USD, if X=500 to 1000 then add 150 USD, if X>1000 then add 200 USD", which
// makes 500 and 1000 both belong to the middle band. Off-by-one here silently mis-prices every rug
// that lands on a round number — and supplier prices land on round numbers constantly.
import { describe, expect, it } from 'vitest';
import {
  ecarpetgalleryRetail,
  karavanRetail,
  priceBand,
  pricingRuleName,
  supplierRetail,
} from '../../../src/lib/price.ts';

describe('priceBand', () => {
  it('adds 100 below 500', () => {
    expect(priceBand(1)).toBe(100);
    expect(priceBand(499.99)).toBe(100);
  });

  it('adds 150 across the inclusive 500–1000 band, both ends included', () => {
    expect(priceBand(500)).toBe(150); // "X=500 to 1000" — 500 is IN the middle band
    expect(priceBand(750)).toBe(150);
    expect(priceBand(1000)).toBe(150); // …and so is 1000
  });

  it('adds 200 above 1000', () => {
    expect(priceBand(1000.01)).toBe(200);
    expect(priceBand(5000)).toBe(200);
  });
});

describe('karavanRetail', () => {
  it('multiplies by 0.7 then 2, then adds the band for the BASE price', () => {
    // The band reads the scraped price, not the multiplied one: 400 × 1.4 = 560, which would sit in
    // the middle band, but 400 is below 500 so the flat amount is 100, not 150.
    expect(karavanRetail(400)).toBe(660);
  });

  it('works through the owner-supplied worked values', () => {
    expect(karavanRetail(500)).toBe(850); // 700 + 150
    expect(karavanRetail(1000)).toBe(1550); // 1400 + 150
    expect(karavanRetail(1001)).toBeCloseTo(1601.4, 6); // 1401.4 + 200
    expect(karavanRetail(4000)).toBe(5800); // 5600 + 200
  });
});

describe('ecarpetgalleryRetail', () => {
  it('multiplies by 0.75 then 2, then adds the band for the USD price (owner, 2026-10-03)', () => {
    expect(ecarpetgalleryRetail(400)).toBe(700); // 600 + 100
    expect(ecarpetgalleryRetail(499.99)).toBeCloseTo(849.985, 6); // 749.985 + 100
    expect(ecarpetgalleryRetail(500)).toBe(900); // 750 + 150 — 500 is in the middle band
    expect(ecarpetgalleryRetail(700)).toBe(1200); // 1050 + 150
    expect(ecarpetgalleryRetail(1000)).toBe(1650); // 1500 + 150 — and so is 1000
    expect(ecarpetgalleryRetail(1001)).toBeCloseTo(1701.5, 6); // 1501.5 + 200
    expect(ecarpetgalleryRetail(2000)).toBe(3200); // 3000 + 200
  });

  it('reads the band from the USD price, not the multiplied one', () => {
    // 400 × 1.5 = 600 would sit in the middle band, but 400 is below 500 so the flat amount is 100.
    expect(ecarpetgalleryRetail(400) - 400 * 1.5).toBe(100);
  });
});

describe('supplierRetail', () => {
  it('rounds the formula up to the step, leaving the setting that owners actually tune in charge', () => {
    // 833 × 0.75 × 2 + 150 = 1399.5 → next 5 is 1400; next 50 is 1400 as well.
    expect(supplierRetail('ecarpetgallery', 833, undefined, 5)).toBe(1400);
    expect(supplierRetail('ecarpetgallery', 810, undefined, 50)).toBe(1400); // 1365 → 1400
    expect(supplierRetail('ecarpetgallery', 333, undefined, 5)).toBe(600); // 499.5 + 100 → 600
  });

  it('ignores the Settings markup for a supplier that has a formula', () => {
    // A stale retail_markup row must not quietly override the rule the owner wrote down.
    const withMarkup = supplierRetail('karavanrug', 4000, 99, 5);
    const without = supplierRetail('karavanrug', 4000, undefined, 5);
    expect(withMarkup).toBe(without);
    expect(withMarkup).toBe(5800);
  });

  it('prices a formula supplier even with no markup configured at all', () => {
    expect(supplierRetail('karavanrug', 600, undefined)).toBe(990); // 840 + 150, already a multiple of 5
  });

  it('carries the studio’s own store price over as the retail price, never marked up again', () => {
    // serioludere.com already sells at retail (owner, 2026-09-23): 1315 there is 1315 here.
    expect(supplierRetail('serioludere', 1315, 1.6, 5)).toBe(1315);
    expect(supplierRetail('serioludere', 1315, undefined, 5)).toBe(1315);
    // Only the rounding step still applies, exactly as it does to every other rule.
    expect(supplierRetail('serioludere', 1312.5, 1.6, 5)).toBe(1315);
    expect(supplierRetail('serioludere', 0, 1.6)).toBeUndefined();
  });

  it('falls back to the plain multiplier for owned stock and anything unrecognised', () => {
    expect(supplierRetail('', 700, 1.6, 5)).toBe(1120);
    expect(supplierRetail('somewhere-else', 700, 2, 5)).toBe(1400);
  });

  it('gives no suggestion for unowned stock without a markup', () => {
    expect(supplierRetail('', 700, undefined)).toBeUndefined();
    expect(supplierRetail('', 700, 0)).toBeUndefined();
  });

  it('gives no suggestion without a usable price, formula or not', () => {
    expect(supplierRetail('karavanrug', undefined, 1.6)).toBeUndefined();
    expect(supplierRetail('karavanrug', 0, 1.6)).toBeUndefined();
    expect(supplierRetail('karavanrug', -5, 1.6)).toBeUndefined();
    expect(supplierRetail('ecarpetgallery', Number.NaN, 1.6)).toBeUndefined();
  });
});

describe('pricingRuleName', () => {
  it('names the rule for each supplier that has one, so the form can show what was applied', () => {
    expect(pricingRuleName('karavanrug')).toContain('0.7');
    expect(pricingRuleName('ecarpetgallery')).toBe('ecarpetgallery: USD × 0.75 × 2 + band');
    expect(pricingRuleName('serioludere')).toBe("serioludere: the store's own price");
  });

  it('names nothing for a supplier priced by the plain multiplier', () => {
    expect(pricingRuleName('')).toBeUndefined();
  });
});
