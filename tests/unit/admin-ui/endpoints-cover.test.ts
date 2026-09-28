// POST /api/admin/rugs/[id]/cover — "Re-fetch cover" on the edit page (owner, 2026-09-28).
//
// The contract: the supplier's FIRST photo goes through the import's own upload with the supplier and
// index 0 (so the cover's turn, cut-out and 2:3 crop apply exactly as they do to a new product), and
// the one cell that changes is Image Src. Every refusal — no supplier link, no Drive, a sold rug gone
// from the supplier's site, a failed upload — leaves the sheet exactly as it was.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { APIContext } from 'astro';
import type * as ScrapeModuleNs from '../../../src/lib/scrape/index.ts';
type ScrapeModule = typeof ScrapeModuleNs;
import type { CellValue } from '../../../src/lib/sheets/client.ts';
import type { UploadResult } from '../../../src/lib/drive/types.ts';
import { adminRugRow, apiContext, fakeCache, fakeSheet, type FakeSheet } from './fake-sheets.ts';

const state = vi.hoisted(() => ({
  sheet: undefined as unknown,
  cache: undefined as unknown,
  drive: undefined as unknown,
  scrape: vi.fn(),
}));

vi.mock('astro:env/server', async () => ({ ...(await import('./fake-sheets.ts')).ENV_MOCK }));
vi.mock('../../../src/lib/runtime.ts', () => ({
  getClient: () => (state.sheet as FakeSheet).client,
  getCache: () => state.cache,
  getAdminDeps: () => ({
    authMode: state.drive ? 'oauth_refresh' : 'service_account',
    drive: state.drive,
    scrape: { jinaFallback: false, respectRobots: true },
    convertToUsd: () => undefined,
  }),
}));
vi.mock('../../../src/lib/scrape/index.ts', async (importOriginal) => ({
  ...(await importOriginal<ScrapeModule>()),
  scrapeRug: (...args: unknown[]) => state.scrape(...args),
}));

import { newSession } from '../../../src/lib/admin/auth.ts';
import { adminRuntime } from '../../../src/lib/admin/http.ts';
import { PRODUCT_COLS } from '../../../src/lib/sheets/contract.ts';
import type { ScrapedRug } from '../../../src/lib/scrape/types.ts';
import { RateLimiter } from '../../../src/lib/votes/ratelimit.ts';
import { POST as coverPost, ALL as coverAll } from '../../../src/pages/api/admin/rugs/[id]/cover.ts';

const session = newSession('owner', Date.now());
const SOURCE = 'https://karavanrug.com/products/winks';
const OLD_COVER = '1U8FwNPCdm-n8RUvSNRcJLBA_27u-Pjkb';
const NEW_COVER = '1NEWcoverCCCCCCCCCCCCCCCCCCCCCCCC';
const FOLDERS = {
  productId: '1PRODUCTfolderAAAAAAAAAAAAAAAAAA',
  allImagesId: '1ALLIMAGESfolderBBBBBBBBBBBBBBBB',
  name: 'SL-021 — Winks',
  url: 'https://drive.google.com/drive/folders/1PRODUCTfolderAAAAAAAAAAAAAAAAAA',
};

const scraped = (n = 3): ScrapedRug => ({
  supplier: 'karavanrug',
  supplierRef: '1389',
  sourceUrl: SOURCE,
  supplierTitle: 'Winks',
  tagsSuggested: [],
  photos: Array.from({ length: n }, (_, i) => ({
    url: `https://cdn.shopify.com/winks-${i + 1}.jpg?width=1600`,
  })),
  warnings: [],
});

function kvRow(source = SOURCE, supplier = 'karavanrug'): CellValue[] {
  return adminRugRow({ id: 'SL-021', slug: 'winks', photos: OLD_COVER }, [source, supplier, '1389', '']);
}

function drive(upload: () => UploadResult = () => ({ id: NEW_COVER, name: '01-primary-x.webp' })) {
  return {
    scopeStatus: async () => ({ driveScopeOk: true, scopes: ['drive.file'], checkedAt: 1 }),
    ensureProductFolders: vi.fn(async () => FOLDERS),
    uploadFromUrl: vi.fn(
      async (
        _url: string,
        _name: string,
        _folder?: string,
        _opts?: { supplier?: string; index?: number },
      ): Promise<UploadResult> => upload(),
    ),
  };
}

const ctx = (init: Parameters<typeof apiContext>[0]): APIContext =>
  apiContext({ session, ...init }) as unknown as APIContext;
const call = async (id = 'SL-021'): Promise<Response> =>
  coverPost(ctx({ path: `/api/admin/rugs/${id}/cover`, method: 'POST', params: { id }, body: {} }));

let sheet: FakeSheet;
let cache: ReturnType<typeof fakeCache>;
beforeEach(() => {
  // The photos budget is 5 a minute per session; the suite would run through it.
  adminRuntime.limiter = new RateLimiter({ maxKeys: 1000 });
  sheet = fakeSheet({ rugs: [kvRow()] });
  cache = fakeCache();
  state.sheet = sheet;
  state.cache = cache;
  state.drive = drive();
  state.scrape.mockReset();
  state.scrape.mockResolvedValue({ ok: true, data: scraped(), via: 'impit', cached: false, ms: 10 });
});

/** The sheet was not written at all: no cell, no audit row. */
const untouched = (): void => {
  expect(sheet.writes).toHaveLength(0);
  expect(sheet.auditRows()).toHaveLength(0);
};

describe('POST /api/admin/rugs/[id]/cover', () => {
  it("stores the supplier's first photo as an import would, and makes it the cover", async () => {
    const before = [...sheet.row('Products', 2)];
    const res = await call();
    expect(res.status).toBe(200);
    const out = await res.json();

    // The FIRST photo, into the product's own All Images folder, as supplier + index 0 — which is
    // what makes transform.ts turn, cut out and crop it like any new Karavan cover.
    const d = state.drive as ReturnType<typeof drive>;
    expect(d.uploadFromUrl).toHaveBeenCalledTimes(1);
    const [url, name, folder, opts] = d.uploadFromUrl.mock.calls[0]!;
    expect(url).toBe('https://cdn.shopify.com/winks-1.jpg?width=1600');
    expect(name).toMatch(/^01-primary-\d{4}-\d{2}-\d{2}$/);
    expect(folder).toBe(FOLDERS.allImagesId);
    expect(opts).toEqual({ supplier: 'karavanrug', index: 0 });

    // One cell changed: Image Src. Everything else on the row is as it was.
    const after = sheet.row('Products', 2);
    expect(after[PRODUCT_COLS.imageSrc]).toBe(NEW_COVER);
    expect(after.filter((_, i) => i !== PRODUCT_COLS.imageSrc)).toEqual(
      before.filter((_, i) => i !== PRODUCT_COLS.imageSrc),
    );

    expect(out).toMatchObject({
      ok: true,
      cover: { id: NEW_COVER, previous: OLD_COVER, host: 'karavanrug.com' },
      audit: { row: 2, action: 'rug.update' },
    });
    expect(out.rug.photos[0]).toBe(NEW_COVER);
    const audit = sheet.auditRows()[0]!;
    expect(audit[2]).toBe('rug.update');
    expect(JSON.parse(String(audit[5]))).toEqual({ cover: OLD_COVER });
    expect(JSON.parse(String(audit[6]))).toEqual({
      cover: NEW_COVER,
      from: 'https://cdn.shopify.com/winks-1.jpg?width=1600',
    });
    expect(cache.busts).toBe(1);
  });

  it('works for the other vendors too, each with its own fixes', async () => {
    sheet = fakeSheet({ rugs: [kvRow('https://ecarpetgallery.com/us_en/red-rug-380114', 'ecarpetgallery')] });
    state.sheet = sheet;
    expect((await call()).status).toBe(200);
    const d = state.drive as ReturnType<typeof drive>;
    expect(d.uploadFromUrl.mock.calls[0]![3]).toEqual({ supplier: 'ecarpetgallery', index: 0 });
  });

  it('knows an older Karavan row by its link when Source Site was left blank', async () => {
    sheet = fakeSheet({ rugs: [kvRow(SOURCE, '')] });
    state.sheet = sheet;
    expect((await call()).status).toBe(200);
    const d = state.drive as ReturnType<typeof drive>;
    // Karavan's fixes, not none: the turn and the crop hang on the supplier.
    expect(d.uploadFromUrl.mock.calls[0]![3]).toEqual({ supplier: 'karavanrug', index: 0 });
  });

  it('refuses a product with no supplier link, or a link to no supplier, without fetching anything', async () => {
    for (const row of [kvRow(''), kvRow('https://example.com/rugs/winks', '')]) {
      sheet = fakeSheet({ rugs: [row] });
      state.sheet = sheet;
      const res = await call();
      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({ error: 'no_source' });
      untouched();
    }
    expect(state.scrape).not.toHaveBeenCalled();
  });

  it('says so plainly when the supplier no longer has the page — a sold rug — and changes nothing', async () => {
    state.scrape.mockResolvedValue({ ok: false, code: 'not_found', status: 404, message: 'HTTP 404' });
    const res = await call();
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('source_gone');
    expect(body.message).toContain('karavanrug.com no longer has');
    expect((state.drive as ReturnType<typeof drive>).uploadFromUrl).not.toHaveBeenCalled();
    untouched();
  });

  it('502s when the supplier page cannot be read, and changes nothing', async () => {
    state.scrape.mockResolvedValue({ ok: false, code: 'blocked', message: 'Cloudflare' });
    const res = await call();
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: 'scrape_failed', reason: 'blocked' });
    untouched();
  });

  it('422s when the page no longer shows any photographs', async () => {
    state.scrape.mockResolvedValue({ ok: true, data: scraped(0), via: 'impit', cached: false, ms: 10 });
    const res = await call();
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: 'no_photos' });
    untouched();
  });

  it('leaves the old cover in place when the new one cannot be saved to Drive', async () => {
    state.drive = drive(() => ({ error: 'download_failed', detail: 'HTTP 403' }));
    const res = await call();
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: 'download_failed', detail: 'HTTP 403' });
    expect(sheet.row('Products', 2)[PRODUCT_COLS.imageSrc]).toBe(OLD_COVER);
    untouched();
  });

  it('409s without Drive, before reading the supplier', async () => {
    state.drive = undefined;
    const res = await call();
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: 'drive_not_authorised' });
    expect(state.scrape).not.toHaveBeenCalled();
    untouched();
  });

  it('404s an unknown product, and answers 405 to anything but POST', async () => {
    expect((await call('SL-999')).status).toBe(404);
    const res = await coverAll(ctx({ path: '/api/admin/rugs/SL-021/cover' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
    untouched();
  });
});
