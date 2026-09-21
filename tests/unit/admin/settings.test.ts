import { describe, expect, it } from 'vitest';
import {
  SETTINGS_KEYS,
  markupFor,
  parseSettingValue,
  parseSettings,
  roundStepOf,
} from '../../../src/lib/admin/settings.ts';
import { HEADERS, SETTINGS_SEED } from '../../../src/lib/sheets/contract.ts';

const header = [...HEADERS.Settings];

describe('parseSettings (ADMIN_SPEC §3.2)', () => {
  it('ignores a key this app retired, without calling it unknown', () => {
    /* Owner, 2026-09-21: the dashboard was reporting `unknown key "default_status" ignored` on every
       read. The key chose a new product's status; products lost their status on 2026-09-16 and
       nothing has read it since — so the warning was an alarm about our own decision, on a row the
       studio never has to touch. Retired is dropped quietly; a typo is still reported, because that
       one they DO want to know about. */
    const s = parseSettings([
      [...HEADERS.Settings],
      ['price_round_step', '5', '', ''],
      ['default_status', 'draft', '2026-09-01', 'owner'],
      ['retial_markup', '1.6', '', ''],
    ]);
    expect(s.warnings).toEqual(['Settings row 4: unknown key "retial_markup" ignored']);
    expect(s.rows.map((r) => r.key)).toEqual(['price_round_step', 'retial_markup']);
    expect(s.priceRoundStep).toBe(5);
  });
  it('parses the seed to the documented defaults', () => {
    const s = parseSettings([header, ...SETTINGS_SEED.map(([k, v]) => [k, v, '', ''])]);
    expect(s.retailMarkup).toBeUndefined();
    expect(s.retailMarkupBySupplier).toEqual({});
    expect(s.priceRoundStep).toBe(5);
    expect(s.warnings).toEqual([]);
    expect(s.rows.map((r) => r.key)).toEqual([...SETTINGS_KEYS]);
    expect(s.rows[0]).toMatchObject({ row: 2, key: 'retail_markup', value: '' });
    expect(SETTINGS_SEED.map(([k]) => k)).toEqual([...SETTINGS_KEYS]);
  });
  it('reads numbers as sheet numbers or text and applies each key', () => {
    const s = parseSettings([
      header,
      ['retail_markup', 1.6, '2026-09-07', 'owner'],
      ['retail_markup.karavanrug', '1.8', '', ''],
      ['price_round_step', '50', '', ''],
    ]);
    expect(s.retailMarkup).toBe(1.6);
    expect(s.retailMarkupBySupplier).toEqual({ karavanrug: 1.8 });
    expect(s.priceRoundStep).toBe(50);
    expect(s.rows[0]).toMatchObject({ updatedAt: '2026-09-07', updatedBy: 'owner' });
  });
  it('turns bad values into undefined with a warning (never a crash), first duplicate wins, unknown keys reported', () => {
    const warnings: string[] = [];
    const s = parseSettings(
      [
        header,
        ['retail_markup', '-1', '', ''],
        ['price_round_step', '2.5', '', ''],
        ['price_round_step', '10', '', ''],
        ['mystery', 'x', '', ''],
        ['', 'blank key row is skipped', '', ''],
      ],
      { info: () => {}, warn: (m) => warnings.push(m), error: () => {} },
    );
    expect(s.retailMarkup).toBeUndefined();
    // First duplicate wins, so the invalid 2.5 is what stuck and the later valid 10 is reported.
    expect(s.priceRoundStep).toBeUndefined();
    expect(s.warnings).toHaveLength(4);
    expect(warnings).toEqual(s.warnings);
    expect(s.warnings.join('\n')).toMatch(/positive number/);
    expect(s.warnings.join('\n')).toMatch(/whole number/);
    expect(s.warnings.join('\n')).toMatch(/duplicate key "price_round_step"/);
    expect(s.warnings.join('\n')).toMatch(/unknown key "mystery"/);
    expect(roundStepOf(s)).toBe(5);
  });
  it('rejects a wrong header row', () => {
    expect(() => parseSettings([['name', 'value']])).toThrow(/Sheet contract violated in tab "Settings"/);
  });
});

describe('parseSettingValue', () => {
  it('validates per key; blank clears', () => {
    expect(parseSettingValue('retail_markup', ' 1.6 ')).toEqual({ ok: true, value: 1.6 });
    expect(parseSettingValue('retail_markup', '')).toEqual({ ok: true, value: undefined });
    expect(parseSettingValue('retail_markup', '1,6').ok).toBe(false);
    expect(parseSettingValue('retail_markup', '0').ok).toBe(false);
    expect(parseSettingValue('price_round_step', '10')).toEqual({ ok: true, value: 10 });
    expect(parseSettingValue('price_round_step', '0.5').ok).toBe(false);
  });
});

describe('markupFor lookup order', () => {
  it('supplier override → retail_markup → env → unset', () => {
    const s = { retailMarkup: 1.6, retailMarkupBySupplier: { ecarpetgallery: 1.5 } };
    expect(markupFor(s, 'ecarpetgallery')).toBe(1.5);
    expect(markupFor(s, 'karavanrug')).toBe(1.6);
    expect(markupFor(s, '')).toBe(1.6);
    expect(markupFor({ retailMarkupBySupplier: {} }, 'karavanrug', 1.7)).toBe(1.7);
    expect(markupFor({ retailMarkupBySupplier: {} }, 'karavanrug', 0)).toBeUndefined();
    expect(markupFor({ retailMarkupBySupplier: {} }, 'karavanrug')).toBeUndefined();
    expect(markupFor({ retailMarkupBySupplier: { karavanrug: 2 } }, 'unknown-supplier')).toBeUndefined();
  });
});
