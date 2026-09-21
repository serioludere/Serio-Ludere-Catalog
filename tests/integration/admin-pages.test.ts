// The admin pages rendered through Astro's container with a scripted Sheets client (ADMIN_SPEC
// §2.1, §8): each page shows its data from the admin read, escapes sheet text, carries its initial
// data in a JSON block, has no inline handlers / style attributes, and every <script> is either an
// external module or an application/json block (hash CSP). The edit page 404s for an unknown id.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import type { CellValue, ValueRange } from '../../src/lib/sheets/client.ts';
import { HEADERS } from '../../src/lib/sheets/contract.ts';
import { rugRow } from '../helpers/ranges.ts';

vi.mock('astro:env/server', () => ({
  SITE_URL: 'https://catalogue.example.test',
  VOTE_SALT: 'v'.repeat(40),
  REVALIDATE_SECRET: 'r'.repeat(40),
  CLIENT_IP_HEADER: '',
  TRUSTED_PROXY_HOPS: 1,
  ADMIN_PASSWORD_HASH: 'scrypt.4096.8.1.' + 'a'.repeat(22) + '.' + 'b'.repeat(86),
  ADMIN_SESSION_SECRET: 's'.repeat(40),
  ADMIN_USER: 'owner',
  RETAIL_MARKUP: undefined,
  GOOGLE_SHEET_ID: 'dev',
  GOOGLE_AUTH_MODE: 'service_account',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: undefined,
  GOOGLE_PRIVATE_KEY: undefined,
  GOOGLE_OAUTH_CLIENT_ID: undefined,
  GOOGLE_OAUTH_CLIENT_SECRET: undefined,
  GOOGLE_OAUTH_REFRESH_TOKEN: undefined,
  GOOGLE_DRIVE_FOLDER_ID: undefined,
  SCRAPE_JINA_FALLBACK: true,
  SCRAPE_ECG_GRAPHQL: false,
  SCRAPE_RESPECT_ROBOTS: true,
  SHEETS_CACHE_TTL: 60,
  DATA_DIR: undefined,
  // Customer realm + FX (brief §8, §10).
  AUTH_SECRET: undefined,
  PUBLIC_CATALOGUE: true,
  BASE_CURRENCY: 'USD',
  FX_API_URL: 'https://api.frankfurter.dev/v1/latest',
  FX_REFRESH_HOURS: 24,
}));

const state = vi.hoisted(() => ({ down: false }));

vi.mock('../../src/lib/runtime.ts', () => ({
  getClient: () => ({
    batchGet: async (ranges: readonly string[]): Promise<ValueRange[]> => {
      if (state.down) throw new Error('Sheets down: refresh_token=secret');
      const rugsHeader: CellValue[] = [...HEADERS.Products];
      return [
        {
          range: ranges[0]!,
          values: [
            rugsHeader,
            rugRow({
              id: 'SL-021',
              source_url: 'https://karavanrug.com/products/winks',
              supplier: 'karavanrug',
              supplier_ref: '1389',
              notes: 'my <note>',
            }),
            rugRow({ id: 'SL-022', name: 'Yellow <b>x</b>', status: 'draft', collection: 'Tulu' }),
            rugRow({ id: 'SL-023', name: 'Old', status: 'archived', collection: '' }),
          ],
        },
        {
          range: ranges[1]!,
          values: [
            [...HEADERS.Collections],
            ['kilims', 'Kilims', 'kilims', 'Flat "weaves"', '', '', 1],
            ['tulu', 'Tulu', 'tulu', '', '', '', 2],
          ],
        },
        {
          range: ranges[2]!,
          values: [
            [...HEADERS.Tags],
            ['kilim', 'kilim', 'Kilim', '#bb3e03'],
            ['denizli', 'denizli', 'Denizli', ''],
          ],
        },
        {
          range: ranges[3]!,
          values: [
            [...HEADERS.Settings],
            ['price_round_step', '50', '', ''],
            ['default_status', 'draft', '', ''],
          ],
        },
        {
          range: ranges[4]!,
          values: [
            [...HEADERS.Customers],
            ['nadia-k7m2pq', 'Nadia <i>', 'VIP', 'active', '2026-09-01', 'owner', 'https://old/?c=x'],
          ],
        },
        {
          range: ranges[5]!,
          values: [
            [...HEADERS.AuditLog],
            [
              '2026-09-07T10:00:00Z',
              'owner',
              'rug.update',
              'Products',
              'SL-021',
              '{"name":"a"}',
              '{"name":"<b>"}',
              'h',
              'r',
              '<script>x</script>',
            ],
          ],
        },
      ];
    },
  }),
  getCache: () => ({ health: () => ({ snapshotAgeSec: 12, lastRefreshOk: true }) }),
  getAdminDeps: () => ({
    authMode: 'service_account',
    drive: undefined,
    scrape: { jinaFallback: true },
    convertToUsd: () => undefined,
  }),
}));

import RugsPage from '../../src/pages/admin/rugs/index.astro';
import NewPage from '../../src/pages/admin/rugs/new.astro';
import EditPage from '../../src/pages/admin/rugs/[id].astro';
import CollectionsPage from '../../src/pages/admin/collections.astro';
import ClientsPage from '../../src/pages/admin/clients.astro';
import AuditPage from '../../src/pages/admin/audit.astro';
import Dashboard from '../../src/pages/admin/index.astro';

const locals = {
  requestId: 'c'.repeat(16),
  admin: { sid: 'a'.repeat(32), user: 'owner', iat: 0, exp: 1, abs: 2 },
};

async function render(
  Page: Parameters<AstroContainer['renderToResponse']>[0],
  path: string,
  params?: Record<string, string>,
): Promise<{ status: number; html: string }> {
  const container = await AstroContainer.create();
  const res = await container.renderToResponse(Page, {
    request: new Request(`https://catalogue.example.test${path}`),
    locals,
    params,
    partial: false,
  });
  return { status: res.status, html: await res.text() };
}

/** Hash CSP: no inline handlers, no style attributes, every script external or a JSON block. */
function expectCspClean(html: string): void {
  expect(html).not.toMatch(/\son[a-z]+=/i);
  expect(html).not.toMatch(/\sstyle="/);
  const scripts = html.match(/<script\b[^>]*>/g) ?? [];
  expect(scripts.length).toBeGreaterThan(0);
  for (const tag of scripts) {
    expect(tag).toMatch(/src=|type="application\/json"/);
  }
}

describe('/admin/rugs', () => {
  it('puts the collections in the bar as multi-select tabs with counts, and drops the status filter', async () => {
    state.down = false;
    const { status, html } = await render(RugsPage, '/admin/rugs');
    expect(status).toBe(200);
    expect(html).toContain('aria-current="page"');
    // One collection at a time (owner, 2026-09-16), with "All" pressed as the reset. This used to
    // assert data-multi="true" and passed on the tag chips in the add drawer rather than on this
    // group, which has always rendered single-select; the tag chips are gone, so it is pinned here.
    expect(html).toContain('id="collectionChips"');
    expect(html).toMatch(/id="collectionChips"[^>]*data-multi="false"/);
    expect(html).toMatch(/data-value="\*" aria-pressed="true"/);
    expect(html).toMatch(/data-value="kilims"[^>]*>\s*Kilims\s*1/);
    expect(html).toMatch(/data-value="tulu"[^>]*>\s*Tulu\s*1/);
    expect(html).toMatch(/data-value="__none"[^>]*>\s*No collection\s*1/);
    // …and the select it replaced is gone, along with the status chips entirely.
    expect(html).not.toContain('id="f_collection_filter"');
    expect(html).not.toContain('id="statusChips"');
    expect(html).not.toContain('Any status');
    expect(html).toContain('href="/admin/rugs/SL-021"');
    // Products carry no status since 2026-09-16: no data-status hook, no status modifier class.
    expect(html).not.toContain('data-status=');
    expect(html).toContain('class="card"');
    expect(html).toContain('Yellow &lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
    // Figma's "All sources" dropdown, delivered as capability rather than chrome: `supplier` is a
    // two-value enum, so a 180px select for two options is furniture. Typing "karavan" finds them.
    expect(html).toContain('data-search="winks sl-021 1389 winks karavanrug"');
    expect(html).toContain('api/image/1U8FwNPCdm-n8RUvSNRcJLBA_27u-Pjkb?w=800');
    // Add product opens a CENTRED, wide modal (owner, 2026-09-20), not the 480px slide-over it was:
    // the form is two columns of fields and a description worth writing, and a 480px drawer made
    // every one of them a single cramped column. Opener, id and the no-JS page are unchanged.
    expect(html).toContain('<dialog id="add-rug" class="modal modal--wide"');
    expect(html).not.toContain('class="drawer"');
    expect(html).toContain('data-open="add-rug"');
    expect(html).toContain('href="/admin/rugs/new"');
    expect(html).toContain('data-rot="0"');
    expect(html).toContain('135 × 190 cm');
    expect(html).toContain('$576');
    expectCspClean(html);
  });
});

describe('/admin/rugs/new', () => {
  it('renders the add form with collections, tag chips, the next id and the JSON block', async () => {
    state.down = false;
    const { status, html } = await render(NewPage, '/admin/rugs/new');
    expect(status).toBe(200);
    expect(html).toContain(String.raw`href="/admin/rugs" aria-current="page"`);
    /* Owner, 2026-09-21: before a fetch this form asks ONE question — the link — so the name field
       that used to sit above it is gone, and the review below owns the name, the collections and the
       tags. The two term dropdowns replace the free-text Material and Method boxes. */
    expect(html).not.toContain('id="yourName"');
    expect(html).toContain('id="f_name"');
    expect(html).toMatch(/<input class="check__box" type="checkbox" id="f_material__Wool"[^>]*value="Wool">/);
    expect(html).toMatch(
      /<input class="check__box" type="checkbox" id="f_method__Hand-Knotted"[^>]*value="Hand-Knotted">/,
    );
    // …and the web address is the server's to derive on add, so it rides along as a hidden input.
    expect(html).toContain('<input type="hidden" id="f_slug"');
    expect(html).not.toContain('Web address');
    expect(html).not.toContain('Name (shown to customers)');
    expect(html).not.toContain('The name is what customers see');
    expect(html).not.toContain('id="supplierTitle"');
    // The collection picker is a multi-select of checkboxes now, not a <select> of options.

    expect(html).toMatch(
      /<input class="check__box" type="checkbox" id="f_collection__Kilims"[^>]*value="Kilims">/,
    );
    // Tags are the product's own strings now (owner, 2026-09-18): a new product has none, so the
    // list renders empty rather than offering every tag in a registry to press.
    expect(html).toContain('id="tagChips"');
    expect(html).not.toContain('data-tag=');
    expect(html).toContain('id="newTag"');
    expect(html).toContain('id="url"');
    expect(html).toContain('id="btnFetch"');
    expect(html).toMatch(/id="f_id" value="SL-024"/); // max(SL-021..SL-023) + 1
    expect(html).not.toContain('id="f_status"'); // no status field since 2026-09-16
    expect(html).toContain('Round price to 50 on save'); // Settings price_round_step
    expect(html).toMatch(/id="savePhotos" disabled/); // service-account mode: Drive not authorised
    expect(html).toContain('id="admin-data"');
    expect(html).toContain('"nextId":"SL-024"');
    expect(html).toContain('"driveScopeOk":false');
    expect(html).toContain('id="photoStrip"');
    expect(html).toContain('id="btnAdd"');
    expect(html).not.toContain('id="btnSave"');
    expectCspClean(html);
  });
});

describe('/admin/rugs/[id]', () => {
  it('renders the edit form for a known id with its version, chips and photo thumbnails', async () => {
    state.down = false;
    const { status, html } = await render(EditPage, '/admin/rugs/SL-021', { id: 'SL-021' });
    expect(status).toBe(200);
    expect(html).toContain('<title>Serio Ludere — Winks</title>');
    expect(html).toMatch(/id="f_id" value="SL-021" readonly/);
    expect(html).toMatch(/id="f_version" value="[a-f0-9]{16}"/);
    expect(html).toMatch(/id="f_collection__Kilims"[^>]*value="Kilims" checked>/);
    // The fixture rug carries both tags; each renders as a token with an × that removes it.
    expect(html).toMatch(/data-tag="Kilim"/);
    expect(html).toMatch(/data-tag="Denizli"/);
    expect(html).toMatch(/data-remove="Kilim"[^>]*aria-label="Remove Kilim"/);
    expect(html).toContain('api/image/1U8FwNPCdm-n8RUvSNRcJLBA_27u-Pjkb?w=800');
    expect(html).toContain('id="btnSave"');
    expect(html).not.toContain('id="btnArchive"');
    expect(html).not.toContain('id="btnRestore"');
    expect(html).not.toContain('id="openSite"');
    expect(html).toContain('<dialog id="confirm">');
    expect(html).toContain('my &lt;note&gt;');
    expect(html).toContain('"supplierRef":"1389"');
    expect(html).toContain('0 likes ·'); // counts come from Reactions, not the admin read
    expect(html).not.toContain('id="yourName"');
    expectCspClean(html);
  });
  it('answers 404 with the shell for an unknown or malformed id', async () => {
    state.down = false;
    const missing = await render(EditPage, '/admin/rugs/SL-404', { id: 'SL-404' });
    expect(missing.status).toBe(404);
    expect(missing.html).toContain('No rug with id "SL-404"');
    expect(missing.html).toContain('href="/admin/rugs"');
    expect(missing.html).not.toContain('id="admin-data"');
    const bad = await render(EditPage, '/admin/rugs/x%20y', { id: 'x y' });
    expect(bad.status).toBe(404);
  });
});

describe('/admin/collections', () => {
  it('renders the ordered table with inputs, rug counts and the add form — no reorder, no tags', async () => {
    state.down = false;
    const { status, html } = await render(CollectionsPage, '/admin/collections');
    expect(status).toBe(200);
    expect(html.indexOf('data-id="kilims"')).toBeLessThan(html.indexOf('data-id="tulu"'));
    expect(html).toMatch(/<li class="crow" data-id="kilims" data-version="[a-f0-9]{16}" data-name="Kilims"/);
    // A textarea since 2026-09-20 (a description runs to a paragraph), with the sheet's own cap on
    // it so the box and the server agree about how much fits.
    expect(html).toMatch(
      /<textarea[^>]*data-field="description"[^>]*maxlength="1000"[^>]*>Flat &quot;weaves&quot;<\/textarea>/,
    );
    expect(html.replace(/\s+/g, ' ')).toContain('<span class="crow__count"> 1 product </span>'); // one rug in Kilims
    expect(html).toContain('id="btnAddCollection"');
    // Owner, 2026-09-18: the ▲/▼ pair and the whole tag half of this page are gone, and so are the
    // two hint lines that explained the ordering and the description clamp.
    expect(html).not.toContain('data-act="up"');
    expect(html).not.toContain('data-act="down"');
    expect(html).not.toContain('id="tagList"');
    expect(html).not.toContain('id="btnAddTag"');
    expect(html).not.toContain('"tags":[{');
    expect(html).not.toContain('Collections appear on the site in this order');
    expect(html).not.toContain('press See more');
    expectCspClean(html);
  });
});

describe('/admin/clients', () => {
  it('renders the generator, the client table with regenerated links and the report block', async () => {
    state.down = false;
    const { status, html } = await render(ClientsPage, '/admin/clients');
    expect(status).toBe(200);
    expect(html).toContain('id="btnGenerate"');
    expect(html).toMatch(/id="linkOut" class="stack" hidden/);
    expect(html).toContain('Nadia &lt;i&gt;');
    expect(html).toContain('https://catalogue.example.test/nadia-k7m2pq');
    expect(html).not.toContain('https://old/?c=x'); // never the stored link
    expect(html).toContain(String.raw`data-act="toggle"`);
    expect(html).toContain(String.raw`role="switch"`);
    expect(html).toContain('id="btnReport"');
    expect(html).toContain('"siteOrigin":"https://catalogue.example.test"');
    expectCspClean(html);
  });

  it('never serialises a stored password hash into the page', async () => {
    // Until 2026-09-14 this page did `{ ...c, link }` over a row that `parseClients` fills with
    // `passwordHash` for EVERY customer, and then emitted the object as JSON in `#admin-data`. A
    // scrypt hash is not a password, but publishing one per buyer turns a single admin-session leak
    // into an offline cracking target for the whole customer list.
    // Asserting on the KEY rather than a fixture value keeps this true whatever the fixture holds.
    state.down = false;
    const { html } = await render(ClientsPage, '/admin/clients');
    expect(html).not.toContain('passwordHash');
    expect(html).not.toContain('password_hash');
  });
});

describe('/admin/audit', () => {
  it('renders the newest rows as text with pretty JSON, the filters and Load more with the offset', async () => {
    state.down = false;
    const { status, html } = await render(AuditPage, '/admin/audit');
    expect(status).toBe(200);
    expect(html).toContain('<tr data-action="rug.update" data-target="sl-021" data-row="2">');
    expect(html).toContain('<option value="rug.update">Product updated</option>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&quot;name&quot;: &quot;&lt;b&gt;&quot;');
    expect(html).toMatch(/id="btnMore" type="button" data-offset="1"/);
    expectCspClean(html);
  });
});

describe('failure state', () => {
  it('every page renders the shell with a scrubbed error when the sheet is unreachable', async () => {
    state.down = true;
    for (const [Page, path, params] of [
      [RugsPage, '/admin/rugs', undefined],
      [NewPage, '/admin/rugs/new', undefined],
      [EditPage, '/admin/rugs/SL-021', { id: 'SL-021' }],
      [CollectionsPage, '/admin/collections', undefined],
      [ClientsPage, '/admin/clients', undefined],
      [AuditPage, '/admin/audit', undefined],
      [Dashboard, '/admin', undefined],
    ] as const) {
      const { status, html } = await render(Page, path, params);
      expect(status, path).toBe(200);
      expect(html, path).toContain('Could not read the sheet');
      expect(html, path).toContain('[redacted]');
      expect(html, path).not.toContain('refresh_token=secret');
      expect(html, path).toContain('/admin/logout');
    }
    state.down = false;
  });
  it('the activity log relativises its timestamps through the script hook', async () => {
    // The dashboard used to carry the newest audit rows; since 2026-09-16 the log lives only on its
    // own page, which is where the `data-ts` hook has to keep working.
    state.down = false;
    const { html } = await render(AuditPage, '/admin/audit');
    expect(html).toContain('data-ts="2026-09-07T10:00:00Z"');
    expectCspClean(html);
  });
});
