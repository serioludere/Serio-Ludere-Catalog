// @vitest-environment happy-dom
// The collections, clients, audit and dashboard page scripts (docs/ADMIN_SPEC.md §8.3) on the
// markup their pages render: inline save carries the version and refreshes on 409, add appends,
// client link generation + copy + revoke, the saves report, audit filter + load more, relative times.
import { beforeEach, describe, expect, it } from 'vitest';
import { auditRow, initAudit, pretty } from '../../../src/scripts/admin/audit.ts';
import { clientRow, initClients, renderReport } from '../../../src/scripts/admin/clients.ts';
import { collectionRow, initCollections } from '../../../src/scripts/admin/collections.ts';
import { initDashboard, relativeTime } from '../../../src/scripts/admin/dashboard.ts';
import { jsonForScript } from '../../../src/lib/view.ts';

type Handler = (
  url: string,
  method: string,
  body: Record<string, unknown>,
) => { status: number; body: unknown };
function fakeFetch(
  handler: Handler,
  calls: Array<{ url: string; method: string; body: Record<string, unknown> }>,
): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    const method = init?.method ?? 'GET';
    calls.push({ url, method, body });
    const r = handler(url, method, body);
    return new Response(JSON.stringify(r.body), {
      status: r.status,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}
const data = (value: unknown): string =>
  `<script type="application/json" id="admin-data">${jsonForScript(value)}</script>`;
const text = (id: string): string => document.getElementById(id)?.textContent?.trim() ?? '';
const cls = (id: string): string => document.getElementById(id)?.className ?? '';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('collections.ts', () => {
  const collections = [
    {
      id: 'tulu',
      slug: 'tulu',
      name: 'Tulu',
      description: '',
      sortOrder: 1,
      row: 3,
      version: 'a'.repeat(16),
      rugs: 0,
    },
    {
      id: 'kilims',
      slug: 'kilims',
      name: 'Kilims',
      description: 'Flat',
      coverImageUrl: '',
      sortOrder: 2,
      row: 2,
      version: 'b'.repeat(16),
      rugs: 2,
    },
  ];
  // Collections only (owner, 2026-09-18): the tag half of this page, and the ▲/▼ reorder pair, are
  // gone — tags are assigned on the product form and nowhere else.
  const markup = (): string => `
    <div id="m5" class="msg"></div>
    <ul id="collectionList">${collections.map((c, i) => collectionRow(c, i).outerHTML).join('')}</ul>
    <input id="c_name" /><input id="c_description" /><button id="btnAddCollection"></button><div id="m6" class="msg"></div>
    ${data({ collections })}`;

  it('inline save carries the version and reports detached rugs; 409 refreshes; add appends', async () => {
    document.body.innerHTML = markup();
    const calls: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
    let conflict = false;
    const page = initCollections(document, {
      fetchImpl: fakeFetch((url, method, body) => {
        if (url === '/api/admin/collections/kilims')
          return conflict
            ? { status: 409, body: { ok: false, error: 'version mismatch', tab: 'Collections', fresh: [] } }
            : {
                status: 200,
                body: {
                  ok: true,
                  collection: { ...collections[1], name: body.name, version: 'n'.repeat(16) },
                  audit: { row: 2 },
                  detached: 2,
                },
              };
        if (url === '/api/admin/collections' && method === 'POST')
          return {
            status: 201,
            body: {
              ok: true,
              collection: {
                id: 'modern',
                slug: 'modern',
                name: 'Modern',
                description: '',
                sortOrder: 3,
                row: 4,
                version: 'm'.repeat(16),
              },
              audit: { row: 2 },
            },
          };
        if (url === '/api/admin/collections') return { status: 200, body: { ok: true, collections } };
        return { status: 500, body: {} };
      }, calls),
    });
    const input = document.querySelector<HTMLInputElement>('[data-id="kilims"] input[data-field="name"]')!;
    input.value = 'Flatweaves';
    await page.saveCollection('kilims');
    // Owner, 2026-09-16: name and description are the whole body — no cover image.
    expect(calls[0]?.body).toEqual({ name: 'Flatweaves', description: 'Flat', version: 'b'.repeat(16) });
    expect(text('m5')).toContain('2 rugs still store the old name "Kilims"');
    expect(document.querySelector<HTMLElement>('[data-id="kilims"]')?.dataset.version).toBe('n'.repeat(16));
    conflict = true;
    await page.saveCollection('kilims');
    expect(cls('m5')).toBe('msg on err');
    expect(calls.map((c) => c.url)).toContain('/api/admin/collections'); // refresh after 409
    (document.getElementById('c_name') as HTMLInputElement).value = 'Modern';
    await page.addCollection();
    expect(cls('m6')).toBe('msg on ok');
    expect(
      [...document.querySelectorAll<HTMLElement>('#collectionList [data-id]')].map((r) => r.dataset.id),
    ).toContain('modern');
  });
});

describe('clients.ts', () => {
  const client = {
    row: 2,
    code: 'nadia-k7m2pq',
    name: 'Nadia',
    note: '',
    status: 'active' as const,
    createdAt: '2026-09-01',
    createdBy: 'owner',
    link: 'https://s.test/nadia-k7m2pq',
    version: 'a'.repeat(16),
  };
  const markup = (): string => `
    <input id="cl_name" /><button id="btnGenerate"></button><div id="m8" class="msg"></div>
    <dialog id="renameDialog"><form id="renameDialogForm"><h3 id="renameDialogTitle"></h3><input id="renameDialogInput" />
      <p id="renameDialogErr" hidden></p>
      <button id="renameDialogOk" type="submit"></button><button id="renameDialogCancel" type="button"></button></form></dialog>
    <div id="linkOut" hidden>
      <section class="credential">
        <div class="credential__value"><span data-credential-url></span>
          <button class="credential__copy" data-copy data-copy-what="url"></button></div>
        <button class="btn btn--primary credential__both" data-copy data-copy-what="both"></button>
      </section>
      <span id="linkCode"></span><span id="linkNote"></span></div>
    <div id="m9" class="msg"></div>
    <table id="clientTable"><tbody>${clientRow(client).outerHTML}</tbody></table>
    <button id="btnReport"></button><div id="m10" class="msg"></div><div id="reportOut"></div>
    ${data({ clients: [client], siteOrigin: 'https://s.test' })}`;

  it('generates a link, shows it with Copy, prepends the row; revoke posts the version; the report renders as text', async () => {
    document.body.innerHTML = markup();
    const calls: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
    const created = {
      ...client,
      row: 2,
      code: 'lea-abc123',
      name: 'Léa',
      link: 'https://s.test/lea-abc123',
      version: 'l'.repeat(16),
    };
    const page = initClients(document, {
      fetchImpl: fakeFetch((url, method) => {
        if (url === '/api/admin/clients' && method === 'POST')
          return {
            status: 201,
            body: { ok: true, client: created, password: 'amber-loom-serai-47', audit: { row: 2 } },
          };
        if (url === '/api/admin/clients/nadia-k7m2pq' && method === 'POST')
          return {
            status: 200,
            body: {
              ok: true,
              client: { ...client, name: 'Nadia K', version: 'p'.repeat(16) },
              audit: { row: 3 },
            },
          };
        if (url === '/api/admin/clients/nadia-k7m2pq/status')
          return {
            status: 200,
            body: {
              ok: true,
              client: { ...client, status: 'revoked', version: 'v'.repeat(16) },
              audit: { row: 2 },
            },
          };
        if (url === '/api/admin/clients/report')
          return {
            status: 200,
            body: {
              ok: true,
              generatedAt: '2026-09-07T00:00:00Z',
              rowsRead: 3,
              rowsDropped: 0,
              mostSaved: [
                {
                  rugId: 'SL-021',
                  name: 'Winks <b>x</b>',
                  slug: 'winks',
                  known: true,
                  saves: 2,
                  dislikes: 0,
                },
              ],
              byClient: [
                {
                  code: 'nadia-k7m2pq',
                  name: 'Nadia',
                  known: true,
                  status: 'active',
                  liked: [{ rugId: 'SL-021', name: 'Winks <b>x</b>', slug: 'winks', known: true }],
                  disliked: [],
                },
                {
                  code: 'anon',
                  name: 'anonymous',
                  known: false,
                  // A product that has since been deleted: still named in the report, no longer linked.
                  liked: [{ rugId: 'SL-022', name: 'Old', slug: '', known: false }],
                  disliked: [],
                },
              ],
            },
          };
        return { status: 500, body: {} };
      }, calls),
    });
    (document.getElementById('cl_name') as HTMLInputElement).value = 'Léa';
    await page.generate();
    const call = (url: string) => calls.find((c) => c.url === url);
    // Owner, 2026-09-16: a name is the whole body — no note, and no password to choose or reveal.
    expect(call('/api/admin/clients')).toMatchObject({ method: 'POST', body: { name: 'Léa' } });
    expect(call('/api/admin/clients')?.body).not.toHaveProperty('note');
    expect(call('/api/admin/clients')?.body).not.toHaveProperty('password');
    expect((document.getElementById('linkOut') as HTMLElement).hidden).toBe(false);
    expect(document.querySelector('[data-credential-url]')?.textContent).toBe('https://s.test/lea-abc123');
    expect(text('linkCode')).toBe('lea-abc123');
    expect(text('linkNote')).toContain('recorded under Léa');
    // The panel carries the link and nothing else, so every copy control copies the same thing.
    expect(document.querySelector('[data-credential-password]')).toBeNull();
    const both = document.querySelector<HTMLElement>('[data-copy-what="both"]')!;
    expect(both.getAttribute('data-copy')).toBe('https://s.test/lea-abc123');
    expect(document.querySelector<HTMLTableRowElement>('#clientTable tr')?.dataset.code).toBe('lea-abc123');
    // Renaming keeps the code, and so the link the buyer already has.
    await page.rename('nadia-k7m2pq', 'Nadia K');
    expect(call('/api/admin/clients/nadia-k7m2pq')).toMatchObject({
      method: 'POST',
      body: { name: 'Nadia K', version: 'a'.repeat(16) },
    });
    await page.setStatus('nadia-k7m2pq', 'revoked');
    expect(call('/api/admin/clients/nadia-k7m2pq/status')).toMatchObject({
      body: { status: 'revoked', version: 'p'.repeat(16) },
    });
    const row = document.querySelector<HTMLTableRowElement>('tr[data-code="nadia-k7m2pq"]')!;
    expect(row.dataset.status).toBe('revoked');
    expect(row.querySelector<HTMLInputElement>('[data-act="toggle"]')?.checked).toBe(false);
    await page.loadReport();
    const out = document.getElementById('reportOut')!;
    expect(out.textContent).toContain('Most liked');
    expect(out.textContent).toContain('Winks <b>x</b>');
    expect(out.innerHTML).not.toContain('<b>x</b>');
    expect(out.textContent).toContain('Nadia — 1 liked');
    expect(out.textContent).toContain('anonymous — 1 liked');
    expect(out.querySelector('.rug-gone')?.textContent).toBe('Old (SL-022)');
    // The like count lives in the "Most liked" report, not in a column — F1 does not draw one.
    expect(out.textContent).toContain('Nadia — 1 liked');
    expect(document.body.innerHTML).not.toMatch(/\son[a-z]+=/i);
  });
  it('renderReport handles an empty report', () => {
    document.body.innerHTML = '<div id="out"></div>';
    renderReport(document.getElementById('out')!, {
      generatedAt: 'now',
      mostSaved: [],
      byClient: [],
      rowsRead: 0,
      rowsDropped: 0,
    });
    expect(text('out')).toContain('No saves logged yet.');
  });
});

describe('audit.ts', () => {
  const entry = (n: number, action: string, target: string) => ({
    row: n,
    timestamp: `t${n}`,
    actor: 'owner',
    action,
    targetTab: 'Rugs',
    targetId: target,
    before: '',
    after: '{"a":1}',
    note: '',
  });
  it('filters rows client-side, loads more pages until the total, renders JSON as text', async () => {
    document.body.innerHTML = `
      <select id="f_action"><option value="">any</option><option value="rug.update">rug.update</option></select>
      <input id="f_target" /><p id="count"></p>
      <table id="auditTable"><tbody>${[entry(2, 'rug.update', 'SL-021'), entry(3, 'auth.login', 'owner')].map((e) => auditRow(e).outerHTML).join('')}</tbody></table>
      <button id="btnMore" data-offset="2"></button><div id="m11" class="msg"></div>`;
    const calls: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
    const page = initAudit(document, {
      fetchImpl: fakeFetch((url) => {
        if (url === '/api/admin/audit?offset=2&limit=100')
          return {
            status: 200,
            body: { ok: true, rows: [entry(4, 'rug.update', 'SL-022')], offset: 2, limit: 100, total: 3 },
          };
        return { status: 500, body: {} };
      }, calls),
    });
    const visible = (): string[] =>
      [...document.querySelectorAll<HTMLTableRowElement>('#auditTable tr')]
        .filter((r) => !r.hidden)
        .map((r) => r.dataset.target!);
    expect(visible()).toEqual(['sl-021', 'owner']);
    (document.getElementById('f_action') as HTMLSelectElement).value = 'rug.update';
    document.getElementById('f_action')!.dispatchEvent(new Event('change'));
    expect(visible()).toEqual(['sl-021']);
    await page.loadMore();
    expect(visible()).toEqual(['sl-021', 'sl-022']);
    expect((document.getElementById('btnMore') as HTMLButtonElement).disabled).toBe(true);
    expect(text('m11')).toBe('Everything is loaded.');
    const target = document.getElementById('f_target') as HTMLInputElement;
    target.value = '022';
    target.dispatchEvent(new Event('input'));
    expect(visible()).toEqual(['sl-022']);
    expect(text('count')).toBe('1 of 3 loaded rows shown');
    expect(document.querySelector('#auditTable pre')?.textContent).toBe('{\n  "a": 1\n}');
    expect(pretty('not json')).toBe('not json');
  });
});

describe('dashboard.ts', () => {
  it('relativises timestamps', () => {
    const now = Date.parse('2026-09-07T12:00:00Z');
    expect(relativeTime('2026-09-07T11:59:30Z', now)).toBe('30 s ago');
    expect(relativeTime('2026-09-07T11:15:00Z', now)).toBe('45 min ago');
    expect(relativeTime('2026-09-06T12:00:00Z', now)).toBe('24 h ago');
    expect(relativeTime('2026-08-01T12:00:00Z', now)).toBe('37 d ago');
    expect(relativeTime('junk', now)).toBe('');
    document.body.innerHTML =
      '<table><tbody><tr><td data-ts="2026-09-07T11:15:00Z">2026-09-07T11:15:00Z</td>' +
      '<td data-ts="junk">junk</td></tr></tbody></table>';
    initDashboard(document, now);
    const cells = document.querySelectorAll('td');
    expect(cells[0]?.textContent).toBe('45 min ago');
    expect(cells[0]?.title).toBe('2026-09-07T11:15:00Z');
    expect(cells[1]?.textContent).toBe('junk');
  });
});
