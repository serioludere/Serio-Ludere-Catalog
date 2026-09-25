// @vitest-environment node
// The `Shopify` cell (owner, 2026-09-25): Yes / No / TA, or blank. The sheet is edited by hand too,
// so reading it has to be forgiving about case and space and must never fail a row over a typo.
import { describe, expect, it } from 'vitest';
import { adminRugFromCells } from '../../src/lib/admin/read.ts';
import { PRODUCT_COLS } from '../../src/lib/sheets/contract.ts';
import { SHOPIFY_OPTIONS, shopifyListingOf } from '../../src/lib/shopify-listing.ts';
import { rugRow } from '../helpers/ranges.ts';

describe('shopifyListingOf', () => {
  it('offers the three answers, in the order the dropdowns show them', () => {
    expect([...SHOPIFY_OPTIONS]).toEqual(['Yes', 'No', 'TA']);
  });

  it('reads each answer however it was typed', () => {
    expect(shopifyListingOf('Yes')).toBe('Yes');
    expect(shopifyListingOf(' yes ')).toBe('Yes');
    expect(shopifyListingOf('NO')).toBe('No');
    expect(shopifyListingOf('ta')).toBe('TA');
  });

  it('reads anything else — blank, a typo, a number — as not chosen yet', () => {
    for (const cell of ['', '   ', undefined, null, 'y', 'maybe', 1, true]) {
      expect(shopifyListingOf(cell), String(cell)).toBe('');
    }
  });
});

describe('the admin read', () => {
  it('carries the cell onto the product, and a typo there never drops the row', () => {
    expect(adminRugFromCells(rugRow({ shopify: 'TA' }), 2)?.shopify).toBe('TA');
    const typo = adminRugFromCells(rugRow({ shopify: 'yess' }), 2);
    expect(typo?.id).toBe('SL-021');
    expect(typo?.shopify).toBe('');
    // A row from a sheet that has no Shopify column yet reads as not chosen.
    expect(adminRugFromCells(rugRow().slice(0, PRODUCT_COLS.shopify), 2)?.shopify).toBe('');
  });
});
