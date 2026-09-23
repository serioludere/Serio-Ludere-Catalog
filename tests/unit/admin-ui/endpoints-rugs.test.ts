// /api/admin/rugs* handlers against the in-memory sheet (docs/ADMIN_SPEC.md §2.3, §3.4): create
// writes the row and its audit entry in ONE batchUpdate, allocates SL-nnn, derives the slug, rounds
// the price; update answers 409 with the fresh row on a stale version;
// unknown collection / tag → 422; oversized bodies → 413; every mutation invalidates the catalogue.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { APIContext } from 'astro';
import { adminRugRow, apiContext, fakeCache, fakeSheet, type FakeSheet } from './fake-sheets.ts';

const state = vi.hoisted(() => ({ sheet: undefined as unknown, cache: undefined as unknown }));

vi.mock('astro:env/server', async () => ({ ...(await import('./fake-sheets.ts')).ENV_MOCK }));

vi.mock('../../../src/lib/runtime.ts', () => ({
  getClient: () => (state.sheet as FakeSheet).client,
  getCache: () => state.cache,
  getAdminDeps: () => ({
    authMode: 'service_account',
    scrape: { jinaFallback: true },
    convertToUsd: () => undefined,
  }),
}));

import { newSession } from '../../../src/lib/admin/auth.ts';
import { rugVersion } from '../../../src/lib/admin/read.ts';
import { forgetProductWidth } from '../../../src/lib/admin/write.ts';
import { HEADERS, PRODUCT_COLS, PRODUCT_WIDTH } from '../../../src/lib/sheets/contract.ts';
import {
  GET as listGet,
  POST as createPost,
  ALL as rugsAll,
} from '../../../src/pages/api/admin/rugs/index.ts';
import { GET as nextIdGet } from '../../../src/pages/api/admin/rugs/next-id.ts';
import { GET as oneGet, POST as updatePost } from '../../../src/pages/api/admin/rugs/[id]/index.ts';
import { POST as deletePost } from '../../../src/pages/api/admin/rugs/[id]/delete.ts';

const session = newSession('owner', Date.now());
const PHOTO = '1U8FwNPCdm-n8RUvSNRcJLBA_27u-Pjkb';

/** `over` lets one test seed a narrower grid, or a header row from before a column was added. */
function seed(over: Parameters<typeof fakeSheet>[0] = {}): FakeSheet {
  const sheet = fakeSheet({
    ...over,
    rugs: [
      adminRugRow({ id: 'SL-021' }, ['https://karavanrug.com/products/winks', 'karavanrug', '1389', '']),
      adminRugRow({ id: 'SL-029', name: 'Yellow', slug: 'yellow' }),
      adminRugRow({ id: '1389', name: 'Old' }),
    ],
    collections: [
      ['kilims', 'Kilims', 'kilims', '', '', '', 1],
      ['tulu', 'Tulu', 'tulu', '', '', '', 2],
    ],
    tags: [
      ['kilim', 'kilim', 'Kilim', ''],
      ['denizli', 'denizli', 'Denizli', '#bb3e03'],
      ['plant-dyes', 'plant-dyes', 'Plant Dyes', ''],
    ],
    settings: [['price_round_step', '5', '', '']],
  });
  return sheet;
}

const ctx = (init: Parameters<typeof apiContext>[0]): APIContext =>
  apiContext({ session, ...init }) as unknown as APIContext;

let sheet: FakeSheet;
let cache: ReturnType<typeof fakeCache>;
beforeEach(() => {
  sheet = seed();
  cache = fakeCache();
  state.sheet = sheet;
  state.cache = cache;
});

const baseInput = {
  name: 'Khal Mohammadi',
  collections: ['kilims'], // case-insensitive match → canonical "Kilims"
  tags: ['KILIM', 'Denizli'],
  photos: [PHOTO],
  widthCm: 130,
  lengthCm: 226,
  material: '100% Wool',
  method: 'Hand-knotted',
  age: 'Vintage',
  origin: 'Afghanistan',
  priceUsd: 1332.4,
  featured: true,
  sourceUrl: 'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
  supplier: 'ecarpetgallery',
  supplierRef: '380114',
  notes: 'bought at the fair',
  roundPrice: true,
};

describe('GET /api/admin/rugs and next-id', () => {
  it('lists every rug with row + version and filters by q', async () => {
    const res = await listGet(ctx({ path: '/api/admin/rugs' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body.rugs.map((r: { id: string }) => r.id)).toEqual(['SL-021', 'SL-029', '1389']);
    expect(body.rugs[0]).toMatchObject({ row: 2, supplier: 'karavanrug', supplierRef: '1389' });
    expect(body.rugs[0].version).toMatch(/^[a-f0-9]{16}$/);
    expect(body.collections).toHaveLength(2);
    const q = await (await listGet(ctx({ path: '/api/admin/rugs?q=1389' }))).json();
    expect(q.rugs.map((r: { id: string }) => r.id)).toEqual(['SL-021', '1389']);
    const next = await (await nextIdGet(ctx({ path: '/api/admin/rugs/next-id' }))).json();
    expect(next).toEqual({ ok: true, id: 'SL-030' });
    expect((await rugsAll(ctx({ path: '/api/admin/rugs' }))).status).toBe(405);
  });
  it('requires a session (the gate answers first; the wrapper re-checks)', async () => {
    const res = await listGet(ctx({ path: '/api/admin/rugs', session: undefined }));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/rugs (rug.create)', () => {
  it('writes the row and its audit entry in ONE batchUpdate, allocates SL-030, derives the slug, rounds the price', async () => {
    const res = await createPost(ctx({ path: '/api/admin/rugs', method: 'POST', body: baseInput }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.row).toBe(5);
    expect(body.audit).toEqual({ row: 2, action: 'rug.create' });
    expect(body.rug).toMatchObject({
      id: 'SL-030',
      slug: 'khal-mohammadi',
      name: 'Khal Mohammadi',
      collections: ['Kilims'],
      tags: ['KILIM', 'Denizli'], // as typed: tags are free strings now,
      photos: [PHOTO],
      priceUsd: 1335,
      featured: true,
      supplier: 'ecarpetgallery',
      supplierRef: '380114',
      notes: 'bought at the fair',
      row: 5,
    });
    expect(body.rug.version).toBe(rugVersion(sheet.row('Products', 5)));
    // one batchUpdate containing the Rugs cells AND the AuditLog insert
    expect(sheet.writes).toHaveLength(1);
    const reqs = sheet.writes[0] as Array<Record<string, unknown>>;
    const sheetIds = reqs.map((r) => {
      const u = r.updateCells as { start?: { sheetId: number } } | undefined;
      const i = r.insertDimension as { range?: { sheetId: number } } | undefined;
      return u?.start?.sheetId ?? i?.range?.sheetId;
    });
    expect(sheetIds).toContain(11);
    expect(sheetIds).toContain(99);
    const written = sheet.row('Products', 5);
    expect(written[0]).toBe('SL-030');
    expect(written[PRODUCT_COLS.variantPrice]).toBe(1335);
    expect(String(written[PRODUCT_COLS.scrapedAt])).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(written[PRODUCT_COLS.sourceUrl]).toBe(baseInput.sourceUrl);
    const audit = sheet.auditRows()[0]!;
    expect(audit[2]).toBe('rug.create');
    expect(audit[4]).toBe('SL-030');
    expect(JSON.parse(String(audit[6]))).toMatchObject({
      id: 'SL-030',
      priceUsd: 1335,
      requestedPrice: 1332.4,
    });
    expect(audit[7]).toMatch(/^[a-f0-9]{32}$/);
    expect(cache.busts).toBe(1);
  });

  /**
   * The studio's own failure, end to end (2026-09-20).
   *
   * Their Products tab was created before `Texture Image` existed, so its grid is 42 columns wide
   * while a product write is 43 cells — and Sheets refuses the whole batch, rug and audit row alike:
   *
   *   Invalid requests[0].updateCells: Attempting to write column: 42, beyond the last requested
   *   column of: 41
   *
   * Nothing could be saved at all until someone re-ran `sheet:init`. The fake enforces grid width
   * exactly as Sheets does, so this test fails against a server without `ensureProductWidth`.
   */
  it('saves against a sheet from before the texture column, widening it first', async () => {
    forgetProductWidth();
    sheet = seed({ columns: PRODUCT_WIDTH - 1, rugsHeader: [...HEADERS.Products].slice(0, -1) });
    state.sheet = sheet;

    const res = await createPost(ctx({ path: '/api/admin/rugs', method: 'POST', body: baseInput }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.rug).toMatchObject({ id: 'SL-030', name: 'Khal Mohammadi' });

    // The repair came first and is only ever additive: the column, and the label for it.
    expect(sheet.writes).toHaveLength(2);
    const repair = sheet.writes[0] as Array<Record<string, unknown>>;
    expect(repair[0]).toMatchObject({ appendDimension: { dimension: 'COLUMNS', length: 1 } });
    expect(sheet.row('Products', 1)).toEqual([...HEADERS.Products.slice(0, -1), 'Texture Image']);

    // And the row itself landed whole, texture cell included.
    const written = sheet.row('Products', 5);
    expect(written).toHaveLength(PRODUCT_WIDTH);
    expect(written[PRODUCT_COLS.textureImage]).toBe('');
    expect(written[PRODUCT_COLS.productId]).toBe('SL-030');
  });

  it('saves the chosen texture photograph onto the row', async () => {
    const res = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, textureId: PHOTO } }),
    );
    expect(res.status).toBe(201);
    expect(sheet.row('Products', 5)[PRODUCT_COLS.textureImage]).toBe(PHOTO);
    // …and a save that names none clears the cell rather than leaving the last choice behind.
    const body = await res.json();
    const cleared = await updatePost(
      ctx({
        path: `/api/admin/rugs/${body.rug.id}`,
        method: 'POST',
        params: { id: body.rug.id },
        body: { ...baseInput, textureId: '', version: body.rug.version },
      }),
    );
    expect(cleared.status).toBe(200);
    expect(sheet.row('Products', 5)[PRODUCT_COLS.textureImage]).toBe('');
  });
  it('writes Pile and Shape, and an edit that sends them back keeps them (owner, 2026-09-23)', async () => {
    // Both columns were always in the sheet, but the form never sent them, so every save blanked them.
    const res = await createPost(
      ctx({
        path: '/api/admin/rugs',
        method: 'POST',
        body: { ...baseInput, pile: 'Thick Pile', shape: 'Rectangular' },
      }),
    );
    expect(res.status).toBe(201);
    const created = (await res.json()).rug;
    expect(created).toMatchObject({ pile: 'Thick Pile', shape: 'Rectangular' });
    expect(sheet.row('Products', 5)[PRODUCT_COLS.pile]).toBe('Thick Pile');
    expect(sheet.row('Products', 5)[PRODUCT_COLS.shape]).toBe('Rectangular');

    const edited = await updatePost(
      ctx({
        path: `/api/admin/rugs/${created.id}`,
        method: 'POST',
        params: { id: created.id },
        body: {
          ...baseInput,
          pile: created.pile,
          shape: created.shape,
          name: 'Renamed',
          version: created.version,
        },
      }),
    );
    expect(edited.status).toBe(200);
    const out = await edited.json();
    expect(out.changed).toContain('name');
    expect(out.changed).not.toContain('pile');
    expect(sheet.row('Products', 5)[PRODUCT_COLS.pile]).toBe('Thick Pile');
    expect(sheet.row('Products', 5)[PRODUCT_COLS.shape]).toBe('Rectangular');
  });

  it('honours a typed id / slug, refuses duplicates (409) and a number below the sequence (422)', async () => {
    const dup = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, id: 'sl-021' } }),
    );
    expect(dup.status).toBe(409);
    const low = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, id: 'SL-012' } }),
    );
    expect(low.status).toBe(422);
    const slug = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, slug: 'yellow' } }),
    );
    expect(slug.status).toBe(409);
    expect(await slug.json()).toMatchObject({ error: 'slug exists' });
    const ok = await createPost(
      ctx({
        path: '/api/admin/rugs',
        method: 'POST',
        body: { ...baseInput, id: 'ECG-380114', slug: 'custom-slug', roundPrice: false },
      }),
    );
    expect(ok.status).toBe(201);
    expect((await ok.json()).rug).toMatchObject({ id: 'ECG-380114', slug: 'custom-slug', priceUsd: 1332.4 });
    // a second create with the same name gets a -2 slug
    const again = await createPost(ctx({ path: '/api/admin/rugs', method: 'POST', body: baseInput }));
    expect((await again.json()).rug.slug).toBe('khal-mohammadi');
    const third = await createPost(ctx({ path: '/api/admin/rugs', method: 'POST', body: baseInput }));
    expect((await third.json()).rug).toMatchObject({ id: 'SL-031', slug: 'khal-mohammadi-2' });
  });
  it('refuses an unknown collection with 422 and writes nothing; any tag is accepted as typed', async () => {
    const c = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, collections: ['Nope'] } }),
    );
    expect(c.status).toBe(422);
    expect(await c.json()).toMatchObject({ ok: false, error: 'unknown collection', collection: 'Nope' });
    const t = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, tags: ['Kilim', 'Ghost'] } }),
    );
    expect(t.status).toBe(201);
    expect((await t.json()).rug.tags).toEqual(['Kilim', 'Ghost']);
  });
  it('validates the body (400 with issues), the size (413) and the content type (415)', async () => {
    const bad = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, name: '', widthCm: 5 } }),
    );
    expect(bad.status).toBe(400);
    const issues = (await bad.json()).issues as Array<{ path: string }>;
    expect(issues.map((i) => i.path)).toEqual(expect.arrayContaining(['name', 'widthCm']));
    const big = await createPost(
      ctx({
        path: '/api/admin/rugs',
        method: 'POST',
        body: { ...baseInput, description: 'x'.repeat(70_000) },
      }),
    );
    expect(big.status).toBe(413);
    const text = await createPost(
      ctx({
        path: '/api/admin/rugs',
        method: 'POST',
        rawBody: 'name=x',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }),
    );
    expect(text.status).toBe(415);
    expect(sheet.writes).toHaveLength(0);
  });
  it('refuses to write when the Products tab has no header row (503, run sheet:init)', async () => {
    state.sheet = fakeSheet({
      rugsHeader: [],
      rugs: [adminRugRow({ id: 'SL-021' })],
      collections: [['kilims', 'Kilims', 'kilims', '', '', '', 1]],
    });
    const res = await createPost(
      ctx({ path: '/api/admin/rugs', method: 'POST', body: { ...baseInput, tags: [] } }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'sheet not initialised' });
  });
});

describe('GET/POST /api/admin/rugs/[id] (rug.update)', () => {
  it('reads one rug (404 for unknown) and updates B:P + U:Z with a diff-only audit row', async () => {
    const one = await oneGet(ctx({ path: '/api/admin/rugs/SL-021', params: { id: 'SL-021' } }));
    expect(one.status).toBe(200);
    const rug = (await one.json()).rug;
    expect(rug).toMatchObject({ id: 'SL-021', row: 2 });
    const missing = await oneGet(ctx({ path: '/api/admin/rugs/SL-999', params: { id: 'SL-999' } }));
    expect(missing.status).toBe(404);

    const body = {
      ...baseInput,
      name: 'Winks renamed',
      slug: undefined,
      collections: ['Tulu'],
      tags: ['Kilim'],
      priceUsd: 705,
      roundPrice: false,
      version: rug.version,
      supplier: 'karavanrug',
      sourceUrl: 'https://karavanrug.com/products/winks',
    };
    const res = await updatePost(
      ctx({ path: '/api/admin/rugs/SL-021', method: 'POST', params: { id: 'SL-021' }, body }),
    );
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out.audit).toEqual({ row: 2, action: 'rug.update' });
    expect(out.rug).toMatchObject({
      id: 'SL-021',
      slug: 'winks',
      name: 'Winks renamed',
      collections: ['Tulu'],
      row: 2,
    });
    expect(out.rug.version).not.toBe(rug.version);
    expect(out.changed).toEqual(expect.arrayContaining(['name', 'collections', 'priceUsd']));
    expect(out.changed).not.toContain('slug'); // kept on rename (stable URLs)
    const written = sheet.row('Products', 2);
    expect(written[0]).toBe('SL-021');
    expect(written[2]).toBe('Winks renamed');
    expect(written[PRODUCT_COLS.collection]).toBe('Tulu'); // the update moved it
    const audit = sheet.auditRows()[0]!;
    expect(audit[2]).toBe('rug.update');
    const before = JSON.parse(String(audit[5]));
    const after = JSON.parse(String(audit[6]));
    expect(before).toMatchObject({ name: 'Winks', collections: ['Kilims'] });
    expect(after).toMatchObject({ name: 'Winks renamed', collections: ['Tulu'] });
    expect(before).not.toHaveProperty('slug');
    expect(sheet.writes).toHaveLength(1);
    expect(cache.busts).toBe(1);
  });
  it('answers 409 with the fresh rug on a stale version and writes nothing', async () => {
    const res = await updatePost(
      ctx({
        path: '/api/admin/rugs/SL-021',
        method: 'POST',
        params: { id: 'SL-021' },
        body: { ...baseInput, version: 'a'.repeat(16) },
      }),
    );
    expect(res.status).toBe(409);
    const out = await res.json();
    expect(out).toMatchObject({ ok: false, error: 'version mismatch', row: 2 });
    expect(out.rug).toMatchObject({ id: 'SL-021', name: 'Winks' });
    expect(out.rug.version).toMatch(/^[a-f0-9]{16}$/);
    expect(sheet.writes).toHaveLength(0);
    expect(cache.busts).toBe(0);
  });
  it('reports an unchanged save without writing, and takes a regenerated slug when it is free', async () => {
    const rug = (
      await (await oneGet(ctx({ path: '/api/admin/rugs/SL-029', params: { id: 'SL-029' } }))).json()
    ).rug;
    const same = {
      name: rug.name,
      description: rug.description,
      collections: rug.collections,
      tags: rug.tags,
      photos: rug.photos,
      widthCm: rug.widthCm,
      lengthCm: rug.lengthCm,
      material: rug.material,
      method: rug.method,
      age: rug.age,
      origin: rug.origin,
      priceUsd: rug.priceUsd,
      rotate: rug.rotate,
      featured: rug.featured,
      supplier: rug.supplier,
      supplierRef: rug.supplierRef,
      notes: rug.notes,
      version: rug.version,
    };
    const unchanged = await updatePost(
      ctx({ path: '/api/admin/rugs/SL-029', method: 'POST', params: { id: 'SL-029' }, body: same }),
    );
    expect(await unchanged.json()).toMatchObject({ ok: true, unchanged: true });
    expect(sheet.writes).toHaveLength(0);
    const taken = await updatePost(
      ctx({
        path: '/api/admin/rugs/SL-029',
        method: 'POST',
        params: { id: 'SL-029' },
        body: { ...same, slug: 'winks' },
      }),
    );
    expect(taken.status).toBe(409);
    const renamed = await updatePost(
      ctx({
        path: '/api/admin/rugs/SL-029',
        method: 'POST',
        params: { id: 'SL-029' },
        body: { ...same, slug: 'sunny' },
      }),
    );
    expect((await renamed.json()).rug.slug).toBe('sunny');
  });
});

describe('POST /api/admin/rugs/[id]/delete (rug.delete)', () => {
  it('removes the row for good, keeps the audit trail, and busts the cache', async () => {
    const rug = (
      await (await oneGet(ctx({ path: '/api/admin/rugs/SL-029', params: { id: 'SL-029' } }))).json()
    ).rug;
    expect(sheet.row('Products', rug.row)[PRODUCT_COLS.productId]).toBe('SL-029');
    const res = await deletePost(
      ctx({
        path: '/api/admin/rugs/SL-029/delete',
        method: 'POST',
        params: { id: 'SL-029' },
        body: { version: rug.version },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, id: 'SL-029' });
    // Gone from the tab — and the rows below it moved up, which is why a stale row number is unsafe
    // and why deleteRow re-checks column A inside the lock.
    const list = await (await listGet(ctx({ path: '/api/admin/rugs' }))).json();
    expect(list.rugs.map((r: { id: string }) => r.id)).toEqual(['SL-021', '1389']);
    expect(sheet.auditRows()[0]![2]).toBe('rug.delete');
    expect(JSON.parse(String(sheet.auditRows()[0]![5]))).toMatchObject({ id: 'SL-029' });
    expect(cache.busts).toBe(1);
  });

  it('refuses a stale version and an unknown id, writing nothing', async () => {
    const stale = await deletePost(
      ctx({
        path: '/api/admin/rugs/SL-029/delete',
        method: 'POST',
        params: { id: 'SL-029' },
        body: { version: 'f'.repeat(16) },
      }),
    );
    expect(stale.status).toBe(409);
    const unknown = await deletePost(
      ctx({
        path: '/api/admin/rugs/SL-404/delete',
        method: 'POST',
        params: { id: 'SL-404' },
        body: { version: 'a'.repeat(16) },
      }),
    );
    expect(unknown.status).toBe(404);
    expect(sheet.writes).toHaveLength(0);
  });
});
