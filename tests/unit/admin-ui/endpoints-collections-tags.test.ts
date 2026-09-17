// /api/admin/collections* and /api/admin/tags* against the in-memory sheet (docs/ADMIN_SPEC.md
// §3.4): create = bottom insert with id = slug and sort_order max+1 (409 on a duplicate slug),
// update = version-guarded whole-row write (409 with the fresh cells), reorder = one batchUpdate
// rewriting column F for every row with the full before/after order in the audit row.
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
import {
  GET as collectionsGet,
  POST as collectionsPost,
} from '../../../src/pages/api/admin/collections/index.ts';
import { POST as collectionPost } from '../../../src/pages/api/admin/collections/[id].ts';
import { POST as reorderPost } from '../../../src/pages/api/admin/collections/reorder.ts';
import { GET as tagsGet, POST as tagsPost } from '../../../src/pages/api/admin/tags/index.ts';
import { POST as tagPost } from '../../../src/pages/api/admin/tags/[id].ts';
import { POST as collectionDeletePost } from '../../../src/pages/api/admin/collections/[id]/delete.ts';
import { POST as tagDeletePost } from '../../../src/pages/api/admin/tags/[id]/delete.ts';

const session = newSession('owner', Date.now());
const ctx = (init: Parameters<typeof apiContext>[0]): APIContext =>
  apiContext({ session, ...init }) as unknown as APIContext;

let sheet: FakeSheet;
let cache: ReturnType<typeof fakeCache>;
beforeEach(() => {
  sheet = fakeSheet({
    rugs: [
      adminRugRow({ id: 'SL-021', collection: 'Kilims' }),
      adminRugRow({ id: 'SL-022', collection: 'kilims', tags: 'Kilim' }),
    ],
    collections: [
      ['kilims', 'Kilims', 'kilims', 'Flat weaves', '', '', 2],
      ['tulu', 'Tulu', 'tulu', '', '', '', 1],
      ['modern', 'Modern', 'modern', '', '', '', 3],
    ],
    tags: [
      ['kilim', 'kilim', 'Kilim', ''],
      ['denizli', 'denizli', 'Denizli', '#bb3e03'],
    ],
  });
  cache = fakeCache();
  state.sheet = sheet;
  state.cache = cache;
});

describe('collections', () => {
  it('lists with row + version and creates at the bottom with id = slug and sort_order max + 1', async () => {
    const list = await (await collectionsGet(ctx({ path: '/api/admin/collections' }))).json();
    expect(list.collections.map((c: { id: string; row: number }) => [c.id, c.row])).toEqual([
      ['kilims', 2],
      ['tulu', 3],
      ['modern', 4],
    ]);
    const res = await collectionsPost(
      ctx({
        path: '/api/admin/collections',
        method: 'POST',
        body: { name: 'Wabi Sabi', description: 'Imperfect' },
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.collection).toMatchObject({
      id: 'wabi-sabi',
      slug: 'wabi-sabi',
      name: 'Wabi Sabi',
      sortOrder: 4,
      row: 5,
    });
    expect(body.collection.coverImageUrl ?? '').toBe('');
    expect(body.audit).toEqual({ row: 2, action: 'collection.create' });
    const created = sheet.row('Collections', 5);
    // The cover column stays in the sheet, written blank (owner, 2026-09-16).
    expect([created[0], created[1], created[2], created[3], created[5], created[6]]).toEqual([
      'wabi-sabi',
      'Wabi Sabi',
      'wabi-sabi',
      'Imperfect',
      '',
      4,
    ]);
    expect(String(created[4])).toMatch(/^[0-9]{4}-/); // created_at
    expect(sheet.writes).toHaveLength(1);
    expect(cache.busts).toBe(1);
    const dup = await collectionsPost(
      ctx({ path: '/api/admin/collections', method: 'POST', body: { name: 'KILIMS' } }),
    );
    expect(dup.status).toBe(409);
    // A cover sent by an older client is ignored rather than refused — the field is simply gone.
    const stray = await collectionsPost(
      ctx({
        path: '/api/admin/collections',
        method: 'POST',
        body: { name: 'X', coverImageUrl: 'http://evil.test/a.jpg' },
      }),
    );
    expect(stray.status).toBe(201);
    expect(sheet.row('Collections', 6)[5]).toBe('');
  });
  it('updates name/description with the version token, keeps the slug, reports detached rugs, 409 on stale', async () => {
    const list = await (await collectionsGet(ctx({ path: '/api/admin/collections' }))).json();
    const kilims = list.collections[0];
    const res = await collectionPost(
      ctx({
        path: '/api/admin/collections/kilims',
        method: 'POST',
        params: { id: 'kilims' },
        body: { name: 'Flatweaves', description: 'Renamed', version: kilims.version },
      }),
    );
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out.collection).toMatchObject({
      id: 'kilims',
      slug: 'kilims',
      name: 'Flatweaves',
      sortOrder: 2,
      row: 2,
    });
    expect(out.collection.version).not.toBe(kilims.version);
    expect(out.detached).toBe(2); // both rugs store "Kilims"/"kilims"
    expect(out.audit).toEqual({ row: 2, action: 'collection.update' });
    expect(sheet.row('Collections', 2)).toEqual(['kilims', 'Flatweaves', 'kilims', 'Renamed', '', '', 2]);
    const audit = sheet.auditRows()[0]!;
    expect(JSON.parse(String(audit[5]))).toEqual({ name: 'Kilims', description: 'Flat weaves' });
    expect(JSON.parse(String(audit[6]))).toEqual({ name: 'Flatweaves', description: 'Renamed' });
    const stale = await collectionPost(
      ctx({
        path: '/api/admin/collections/kilims',
        method: 'POST',
        params: { id: 'kilims' },
        body: { name: 'Again', version: kilims.version },
      }),
    );
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({
      error: 'version mismatch',
      tab: 'Collections',
      fresh: ['kilims', 'Flatweaves', 'kilims', 'Renamed', '', '', 2],
    });
    const clash = await collectionPost(
      ctx({
        path: '/api/admin/collections/tulu',
        method: 'POST',
        params: { id: 'tulu' },
        body: { name: 'flatweaves', version: list.collections[1].version },
      }),
    );
    expect(clash.status).toBe(409);
    expect(await clash.json()).toMatchObject({ error: 'name exists' });
    const missing = await collectionPost(
      ctx({
        path: '/api/admin/collections/nope',
        method: 'POST',
        params: { id: 'nope' },
        body: { name: 'x', version: kilims.version },
      }),
    );
    expect(missing.status).toBe(404);
  });
  it('reorders every row in one batchUpdate with the whole order in the audit row; refuses unknown / partial lists', async () => {
    const res = await reorderPost(
      ctx({
        path: '/api/admin/collections/reorder',
        method: 'POST',
        body: { order: ['modern', 'kilims', 'tulu'] },
      }),
    );
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out.audit).toEqual({ row: 2, action: 'collection.reorder' });
    expect(out.collections.map((c: { id: string; sortOrder: number }) => [c.id, c.sortOrder])).toEqual([
      ['kilims', 2],
      ['tulu', 3],
      ['modern', 1],
    ]);
    expect(sheet.writes).toHaveLength(1);
    expect(sheet.row('Collections', 4)[6]).toBe(1); // sort_order moved to column G
    const audit = sheet.auditRows()[0]!;
    expect(JSON.parse(String(audit[5]))).toEqual({ order: ['tulu', 'kilims', 'modern'] });
    expect(JSON.parse(String(audit[6]))).toEqual({ order: ['modern', 'kilims', 'tulu'] });
    const unknown = await reorderPost(
      ctx({
        path: '/api/admin/collections/reorder',
        method: 'POST',
        body: { order: ['modern', 'kilims', 'ghost'] },
      }),
    );
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toMatchObject({ error: 'unknown id', id: 'ghost' });
    const partial = await reorderPost(
      ctx({ path: '/api/admin/collections/reorder', method: 'POST', body: { order: ['modern'] } }),
    );
    expect(partial.status).toBe(400);
    const same = await reorderPost(
      ctx({
        path: '/api/admin/collections/reorder',
        method: 'POST',
        body: { order: ['modern', 'kilims', 'tulu'] },
      }),
    );
    expect(await same.json()).toMatchObject({ ok: true, unchanged: true });
    expect(sheet.writes).toHaveLength(1);
  });
});

describe('tags', () => {
  it('lists, creates with id = slug (409 on a duplicate), updates with the version', async () => {
    const list = await (await tagsGet(ctx({ path: '/api/admin/tags' }))).json();
    expect(list.tags.map((t: { id: string; row: number }) => [t.id, t.row])).toEqual([
      ['kilim', 2],
      ['denizli', 3],
    ]);
    const res = await tagsPost(
      ctx({ path: '/api/admin/tags', method: 'POST', body: { name: 'Plant Dyes', color: '#2f6b3a' } }),
    );
    expect(res.status).toBe(201);
    const out = await res.json();
    expect(out.tag).toMatchObject({ id: 'plant-dyes', slug: 'plant-dyes', name: 'Plant Dyes', row: 4 });
    expect(out.audit).toEqual({ row: 2, action: 'tag.create' });
    // The colour column stays in the sheet, written blank (owner, 2026-09-16).
    expect(sheet.row('Tags', 4)).toEqual(['plant-dyes', 'plant-dyes', 'Plant Dyes', '']);
    const dup = await tagsPost(ctx({ path: '/api/admin/tags', method: 'POST', body: { name: 'kilim' } }));
    expect(dup.status).toBe(409);
    const pipe = await tagsPost(ctx({ path: '/api/admin/tags', method: 'POST', body: { name: 'a|b' } }));
    expect(pipe.status).toBe(400);

    const upd = await tagPost(
      ctx({
        path: '/api/admin/tags/kilim',
        method: 'POST',
        params: { id: 'kilim' },
        body: { name: 'Kilim weave', version: list.tags[0].version },
      }),
    );
    expect(upd.status).toBe(200);
    const u = await upd.json();
    expect(u.tag).toMatchObject({ id: 'kilim', slug: 'kilim', name: 'Kilim weave', row: 2 });
    expect(u.detached).toBe(2); // both fixture rugs carry the default tag "Kilim"
    expect(sheet.row('Tags', 2)).toEqual(['kilim', 'kilim', 'Kilim weave', '']);
    const stale = await tagPost(
      ctx({
        path: '/api/admin/tags/kilim',
        method: 'POST',
        params: { id: 'kilim' },
        body: { name: 'x', version: list.tags[0].version },
      }),
    );
    expect(stale.status).toBe(409);
    expect(cache.busts).toBe(2);
  });
});

/**
 * Deleting a collection or a tag (owner, 2026-09-16). Both refuse while a product still references
 * them, and for the same reason: products store the DISPLAY NAME as text, so removing the definition
 * would not detach anything — it would quietly relabel those rugs on the buyer's side.
 */
describe('deleting collections and tags', () => {
  it('refuses a collection that still has products, naming the count', async () => {
    const list = await (await collectionsGet(ctx({ path: '/api/admin/collections' }))).json();
    const kilims = list.collections[0];
    const res = await collectionDeletePost(
      ctx({
        path: '/api/admin/collections/kilims/delete',
        method: 'POST',
        params: { id: 'kilims' },
        body: { version: kilims.version },
      }),
    );
    expect(res.status).toBe(409);
    const out = await res.json();
    expect(out).toMatchObject({ error: 'collection in use', inUse: 2 });
    expect(out.message).toContain('2 products are still in "Kilims"');
    expect(sheet.writes).toHaveLength(0); // nothing was touched
  });

  it('deletes an empty collection and keeps the audit row', async () => {
    const list = await (await collectionsGet(ctx({ path: '/api/admin/collections' }))).json();
    const tulu = list.collections.find((c: { id: string }) => c.id === 'tulu');
    const res = await collectionDeletePost(
      ctx({
        path: '/api/admin/collections/tulu/delete',
        method: 'POST',
        params: { id: 'tulu' },
        body: { version: tulu.version },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, id: 'tulu' });
    const after = await (await collectionsGet(ctx({ path: '/api/admin/collections' }))).json();
    expect(after.collections.map((c: { id: string }) => c.id)).toEqual(['kilims', 'modern']);
    expect(sheet.auditRows()[0]![2]).toBe('collection.delete');
    expect(cache.busts).toBe(1);
  });

  it('refuses a tag that products carry, and deletes an unused one', async () => {
    const list = await (await tagsGet(ctx({ path: '/api/admin/tags' }))).json();
    const kilim = list.tags.find((t: { id: string }) => t.id === 'kilim');
    const used = await tagDeletePost(
      ctx({
        path: '/api/admin/tags/kilim/delete',
        method: 'POST',
        params: { id: 'kilim' },
        body: { version: kilim.version },
      }),
    );
    expect(used.status).toBe(409);
    expect(await used.json()).toMatchObject({ error: 'tag in use', inUse: 2 });

    // A tag nothing carries goes without argument — created here so the fixture's own two stay used.
    const made = await (
      await tagsPost(ctx({ path: '/api/admin/tags', method: 'POST', body: { name: 'Nomad Stripe' } }))
    ).json();
    const res = await tagDeletePost(
      ctx({
        path: '/api/admin/tags/nomad-stripe/delete',
        method: 'POST',
        params: { id: 'nomad-stripe' },
        body: { version: made.tag.version },
      }),
    );
    expect(res.status).toBe(200);
    const after = await (await tagsGet(ctx({ path: '/api/admin/tags' }))).json();
    expect(after.tags.map((t: { id: string }) => t.id)).toEqual(['kilim', 'denizli']);
    expect(sheet.auditRows()[0]![2]).toBe('tag.delete');
  });

  it('refuses a stale version rather than deleting whatever is there now', async () => {
    const res = await collectionDeletePost(
      ctx({
        path: '/api/admin/collections/tulu/delete',
        method: 'POST',
        params: { id: 'tulu' },
        body: { version: 'f'.repeat(16) },
      }),
    );
    expect(res.status).toBe(409);
    expect(sheet.writes).toHaveLength(0);
  });
});
