// Permanent row deletion (owner, 2026-09-16). Until then nothing in the admin could remove a row —
// `assertRugRequestsSafe` threw on any delete request and still does — so the guarantees worth
// pinning here are the ones that replace "we simply never delete":
//
//   1. the batch is exactly ONE single-row deleteDimension on the named tab, plus the audit insert;
//   2. the row is re-read inside the lock and must still carry both its id and its version hash,
//      which is what makes a row number that went stale behind someone else's delete safe;
//   3. the audit row rides in the same batch, so the trail outlives the row it describes;
//   4. the insert/update builders still refuse deletes outright.
import { describe, expect, it, vi, type Mock } from 'vitest';
import { buildAuditRow, type AuditRow } from '../../../src/lib/admin/audit.ts';
import { rowVersion, rugVersion } from '../../../src/lib/admin/read.ts';
import {
  UnsafeRequestError,
  VersionMismatchError,
  assertDeleteRequestsSafe,
  assertRugRequestsSafe,
  buildRowDeleteRequests,
  deleteRow,
} from '../../../src/lib/admin/write.ts';
import type { CellValue, SpreadsheetInfo, ValueRange } from '../../../src/lib/sheets/client.ts';
import { HEADERS, TABS } from '../../../src/lib/sheets/contract.ts';
import { rugRow } from '../../helpers/ranges.ts';

const IDS: Record<string, number> = {
  Products: 11,
  Collections: 33,
  Tags: 44,
  Customers: 88,
  AuditLog: 99,
  Settings: 100,
};

const audit: AuditRow = buildAuditRow({
  action: 'rug.delete',
  targetTab: 'Products',
  targetId: 'SL-021',
  actor: 'owner',
  ipHash: 'a'.repeat(32),
  requestId: 'b'.repeat(16),
  before: { name: 'Winks' },
  timestamp: '2026-09-16T00:00:00.000Z',
});

interface Fake {
  client: {
    batchGet: Mock<(ranges: readonly string[]) => Promise<ValueRange[]>>;
    batchUpdate: Mock<(reqs: unknown[]) => Promise<{ replies?: unknown[] }>>;
    sheetIdByTitle: (t: string) => Promise<number>;
    getSpreadsheet: () => Promise<SpreadsheetInfo>;
    forgetSheetIds: () => void;
  };
  writes: unknown[][];
}

function fake(rows: Record<string, CellValue[]>): Fake {
  const writes: unknown[][] = [];
  return {
    writes,
    client: {
      batchGet: vi.fn(async (ranges: readonly string[]) =>
        ranges.map((range): ValueRange => {
          const cells = rows[range];
          return { range, values: cells ? [cells] : undefined };
        }),
      ),
      batchUpdate: vi.fn(async (reqs: unknown[]) => {
        writes.push(reqs);
        return { replies: reqs.map(() => ({})) };
      }),
      sheetIdByTitle: async (t: string) => IDS[t]!,
      getSpreadsheet: async () => ({ spreadsheetId: 'dev', sheets: [] }),
      forgetSheetIds: () => {},
    },
  };
}

const product = rugRow({ id: 'SL-021' });
const PRODUCT_RANGE = `${TABS.products}!A7:AR7`;

/** A Collections row and the range `deleteRow` reads it through. */
const collection: CellValue[] = ['kilims', 'Kilims', 'kilims', 'Flat weaves', '2026-09-01', '', 1];
const COLLECTION_RANGE = `${TABS.collections}!A4:G4`;

describe('assertDeleteRequestsSafe', () => {
  const del = (range: Record<string, unknown>): unknown => ({ deleteDimension: { range } });
  const ok = { sheetId: 11, dimension: 'ROWS', startIndex: 6, endIndex: 7 };

  it('accepts exactly one single-row ROWS delete on the target tab', () => {
    expect(() => assertDeleteRequestsSafe([del(ok)], 11, 7)).not.toThrow();
  });

  it('refuses a span of more than one row', () => {
    expect(() => assertDeleteRequestsSafe([del({ ...ok, endIndex: 9 })], 11, 7)).toThrow(UnsafeRequestError);
  });

  it('refuses a delete aimed at another sheet', () => {
    expect(() => assertDeleteRequestsSafe([del({ ...ok, sheetId: 44 })], 11, 7)).toThrow(/another sheet/);
  });

  it('refuses column deletes, range deletes and sheet deletes', () => {
    expect(() => assertDeleteRequestsSafe([del({ ...ok, dimension: 'COLUMNS' })], 11, 7)).toThrow(/ROWS/);
    expect(() => assertDeleteRequestsSafe([{ deleteRange: {} }, del(ok)], 11, 7)).toThrow(/never a range/);
    expect(() => assertDeleteRequestsSafe([{ deleteSheet: {} }, del(ok)], 11, 7)).toThrow(/never a range/);
  });

  it('refuses a batch with no delete, or with two', () => {
    expect(() => assertDeleteRequestsSafe([], 11, 7)).toThrow(/got 0/);
    expect(() => assertDeleteRequestsSafe([del(ok), del(ok)], 11, 7)).toThrow(/got 2/);
  });

  it('refuses any other write to the target tab riding along', () => {
    const sneak = { updateCells: { start: { sheetId: 11, rowIndex: 0, columnIndex: 0 } } };
    expect(() => assertDeleteRequestsSafe([del(ok), sneak], 11, 7)).toThrow(/writes nothing else/);
  });

  it('never touches the header row', () => {
    expect(() => assertDeleteRequestsSafe([del(ok)], 11, 1)).toThrow(/header row/);
  });
});

describe('buildRowDeleteRequests', () => {
  it('pairs the delete with the audit insert, in one batch', () => {
    const reqs = buildRowDeleteRequests({ target: 11, auditLog: 99 }, 7, audit) as Array<
      Record<string, { range?: { sheetId?: number; startIndex?: number; endIndex?: number } }>
    >;
    // One delete, then the audit insert — which is itself an insertDimension plus the cells to fill it.
    expect(reqs).toHaveLength(3);
    expect(reqs[0]!.deleteDimension?.range).toMatchObject({ sheetId: 11, startIndex: 6, endIndex: 7 });
    // The audit row lands on the AuditLog tab — a different sheet, so the guard lets it pass.
    expect(reqs[1]!.insertDimension?.range?.sheetId).toBe(99);
  });
});

describe('deleteRow', () => {
  it('removes a product row and writes its audit row in the SAME batch', async () => {
    const f = fake({ [PRODUCT_RANGE]: product });
    const res = await deleteRow(f.client, {
      tab: TABS.products,
      row: 7,
      expectFirstCell: 'SL-021',
      version: rugVersion(product),
      audit,
    });
    expect(res).toEqual({ row: 7, audit: { row: 2, action: 'rug.delete' }, verified: true });
    expect(f.writes).toHaveLength(1);
    const reqs = f.writes[0] as Array<Record<string, unknown>>;
    expect(reqs.filter((r) => 'deleteDimension' in r)).toHaveLength(1);
    expect(reqs.filter((r) => 'insertDimension' in r)).toHaveLength(1);
  });

  it('removes a row from a row tab, hashing the row at that tab’s width', async () => {
    const f = fake({ [COLLECTION_RANGE]: collection });
    const res = await deleteRow(f.client, {
      tab: TABS.collections,
      row: 4,
      expectFirstCell: 'kilims',
      version: rowVersion(collection, HEADERS.Collections.length),
      audit: buildAuditRow({ ...audit, action: 'collection.delete', targetTab: 'Collections' }),
    });
    expect(res.row).toBe(4);
    const reqs = f.writes[0] as Array<{ deleteDimension?: { range: { sheetId: number } } }>;
    expect(reqs[0]?.deleteDimension?.range.sheetId).toBe(IDS.Collections);
  });

  it('refuses when column A no longer holds the expected id — the row moved under us', async () => {
    // Exactly what a stale row number looks like after someone else deleted an earlier row: the
    // number now addresses a DIFFERENT product, and deleting it would destroy an innocent row.
    const f = fake({ [PRODUCT_RANGE]: rugRow({ id: 'SL-099' }) });
    await expect(
      deleteRow(f.client, {
        tab: TABS.products,
        row: 7,
        expectFirstCell: 'SL-021',
        version: rugVersion(product),
        audit,
      }),
    ).rejects.toThrow(VersionMismatchError);
    expect(f.writes).toHaveLength(0);
  });

  it('refuses when the row changed since it was read, and writes nothing', async () => {
    const f = fake({ [PRODUCT_RANGE]: product });
    await expect(
      deleteRow(f.client, {
        tab: TABS.products,
        row: 7,
        expectFirstCell: 'SL-021',
        version: 'f'.repeat(16),
        audit,
      }),
    ).rejects.toThrow(/changed since it was read/);
    expect(f.writes).toHaveLength(0);
  });

  it('refuses an already-deleted row, whose read comes back blank', async () => {
    const f = fake({});
    await expect(
      deleteRow(f.client, {
        tab: TABS.products,
        row: 7,
        expectFirstCell: 'SL-021',
        version: rugVersion(product),
        audit,
      }),
    ).rejects.toThrow(/already deleted/);
    expect(f.writes).toHaveLength(0);
  });

  it('never deletes the header row', async () => {
    const f = fake({});
    await expect(
      deleteRow(f.client, {
        tab: TABS.products,
        row: 1,
        expectFirstCell: 'SL-021',
        version: rugVersion(product),
        audit,
      }),
    ).rejects.toThrow(/header row/);
  });
});

describe('the insert/update guard still refuses deletes', () => {
  it('assertRugRequestsSafe throws on any delete request, as it always has', () => {
    const del = { deleteDimension: { range: { sheetId: 11, dimension: 'ROWS' } } };
    expect(() => assertRugRequestsSafe([del], 11, 'update')).toThrow(/never delete/);
    expect(() => assertRugRequestsSafe([{ deleteSheet: {} }], 11, 'insert')).toThrow(/never delete/);
  });
});
