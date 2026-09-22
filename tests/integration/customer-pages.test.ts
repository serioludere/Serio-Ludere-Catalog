// The private preview rendered through Astro's container (brief §7, §10): the password gate for a
// buyer without a session, their catalog with it, a 404 for a slug that is not an active customer,
// and the asymmetric reactions (card = like only, detail = like and dislike, `source` recorded).
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import { hashPassword } from '../../src/lib/admin/auth.ts';
import { parseSnapshot } from '../../src/lib/sheets/parse.ts';
import { rangesWith, rugRow } from '../helpers/ranges.ts';

vi.mock('astro:env/server', () => ({
  SITE_URL: 'https://preview.example.test',
  VOTE_SALT: 'v'.repeat(40),
  REVALIDATE_SECRET: 'r'.repeat(40),
  CLIENT_IP_HEADER: '',
  TRUSTED_PROXY_HOPS: 1,
  AUTH_SECRET: 's'.repeat(40),
  PUBLIC_CATALOGUE: true,
  ADMIN_PASSWORD_HASH: undefined,
  ADMIN_SESSION_SECRET: undefined,
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
  BASE_CURRENCY: 'USD',
  FX_API_URL: 'https://api.frankfurter.dev/v1/latest',
  FX_REFRESH_HOURS: 24,
}));

const state = vi.hoisted(() => ({ down: false }));

vi.mock('../../src/lib/runtime.ts', async () => {
  const { rangesWith: build, rugRow: row } = await import('../helpers/ranges.ts');
  const { parseSnapshot: parse } = await import('../../src/lib/sheets/parse.ts');
  const { hashPassword: hash } = await import('../../src/lib/admin/auth.ts');
  const cheap = { N: 2 ** 12 } as const;
  return {
    loadCatalogue: async () => {
      if (state.down) return { error: 'could not load the catalogue' };
      const parsed = parse(
        build({
          rugs: [
            // SL-021 carries a texture photograph; SL-022 carries a marker tag and no texture, which
            // is the other half of the product popup's one either/or (owner, 2026-09-20).
            // Texture AND a marker: since 2026-09-21 they are not an either/or — the texture sits
            // beside the hero, the markers stay in the facts column.
            row({
              id: 'SL-021',
              texture: '1TeXtUrE0000000000000000000000000',
              tags: 'Kilim|Denizli|Antique',
            }),
            row({
              id: 'SL-022',
              name: 'Yellow',
              slug: 'yellow',
              collection: 'Kilims',
              tags: 'Kilim|Signed',
            }),
          ],
          collections: [['c1', 'Kilims', 'kilims', 'Flatweaves from Denizli.', '', '', 1]],
          customers: [
            ['hala', 'Hala', hash('amber-loom-serai-47', cheap), 'VIP', '2026-09-01', true],
            ['omar', 'Omar', hash('cedar-quarry-tulip-11', cheap), '', '2026-09-01', false],
          ],
        }),
      );
      return { snapshot: { ...parsed, fetchedAt: Date.now() } };
    },
    getClient: () => ({}),
    getCache: () => ({}),
    photoMonitor: { schedule: () => {} },
    // The FX layer has its own suite; here the sheet's own table is enough.
    baseCurrency: 'USD',
    ratesFor: (c: { rates: Array<{ currency: string; rateToBase: number; symbol: string }> }) => ({
      rates: Object.fromEntries([['USD', 1], ...c.rates.map((r) => [r.currency, r.rateToBase])]),
      symbols: Object.fromEntries([['USD', '$'], ...c.rates.map((r) => [r.currency, r.symbol])]),
    }),
  };
});

import CustomerCatalog from '../../src/pages/[slug]/index.astro';
import CustomerDetail from '../../src/pages/[slug]/[productId].astro';

/** The fixture, parsed once, so a test can assert against the same data the page sees. */
const fixture = parseSnapshot(
  rangesWith({
    rugs: [rugRow({ id: 'SL-021' })],
    customers: [['hala', 'Hala', hashPassword('amber-loom-serai-47', { N: 2 ** 12 }), '', '', true]],
  }),
);

async function render(
  Component: Parameters<AstroContainer['renderToResponse']>[0],
  path: string,
  params: Record<string, string>,
  locals: Record<string, unknown> = {},
): Promise<{ status: number; html: string; location: string | null }> {
  const container = await AstroContainer.create();
  const res = await container.renderToResponse(Component, {
    request: new Request(`https://preview.example.test${path}`),
    params,
    locals: { requestId: 'r'.repeat(16), ...locals },
    partial: false,
  });
  return { status: res.status, html: await res.text(), location: res.headers.get('location') };
}

describe('/{slug} — the gate', () => {
  it('asks only for the password and never names the buyer', async () => {
    state.down = false;
    const { status, html } = await render(CustomerCatalog, '/hala', { slug: 'hala' });
    expect(status).toBe(200);
    // Owner, 2026-09-14: the buyer's name appears nowhere in the customer realm. Figma 53:3 draws
    // "Welcome, {name}." above the form; printing it in front of the password turns a shared screen
    // into an identification, and the studio already has the name in the admin.
    expect(html).not.toContain('Welcome, Hala.');
    expect(html).not.toContain('Hala');
    // Owner, 2026-09-17: the brand block is the logo mark, not a text title or a standfirst line,
    // and the gate runs on the same black theme as the admin login.
    expect(html).not.toContain('A private preview, prepared for you');
    expect(html).toContain('aria-label="Serio Ludere"');
    expect(html).toContain('data-mode="preview-dark"');
    expect(html).toContain('Enter');
    expect(html).not.toContain('View the catalogue');
    expect(html).toContain('action="/api/customers/hala/login"');
    expect(html).toContain('autocomplete="current-password"');
    expect(html).toContain('data-gate-reveal');
    // The consent note below the form is gone too (owner, 2026-09-17).
    expect(html).not.toContain('The rugs you like are shared with Serio Ludere.');
    // No username, no reset, no account: the brief's one-field form (§10).
    expect(html).not.toContain('name="email"');
    expect(html).not.toContain('Forgot');
    // Nothing of the catalogue leaks before the password is right.
    expect(html).not.toContain('Winks');
    expect(html).not.toContain('id="grid"');
  });

  it('404s for an unknown slug and for a customer whose access was switched off', async () => {
    state.down = false;
    const missing = await render(CustomerCatalog, '/nobody', { slug: 'nobody' });
    expect(missing.status).toBe(404);
    expect(missing.html).toContain('This preview link is not active.');
    // `active = FALSE` keeps the row (and their reaction history) but ends their access.
    const inactive = await render(CustomerCatalog, '/omar', { slug: 'omar' });
    expect(inactive.status).toBe(404);
    expect(inactive.html).not.toContain('Welcome, Omar.');
  });

  it('answers 503 with a retry, never a 500, when the sheet is unreachable', async () => {
    state.down = true;
    const { status, html } = await render(CustomerCatalog, '/hala', { slug: 'hala' });
    state.down = false;
    expect(status).toBe(503);
    expect(html).toContain('Could not load the catalogue.');
  });
});

describe('/{slug} — the signed-in catalog', () => {
  it('renders the buyer’s grid with like-only cards that link inside the realm', async () => {
    state.down = false;
    const { status, html } = await render(CustomerCatalog, '/hala', { slug: 'hala' }, { customer: 'hala' });
    expect(status).toBe(200);
    // The header used to carry `<span class="pv-who">Hala</span>` (Figma 53:37). Removed with the
    // gate greeting on the owner's instruction: no buyer name anywhere in this realm.
    expect(html).not.toContain('pv-who');
    expect(html).not.toContain('Hala');
    // "The collection" heading and standfirst are gone (owner, 2026-09-17): the header carries the
    // logo mark instead, and the freed space puts the collection tabs on the controls' own row.
    expect(html).not.toContain('The collection');
    expect(html).not.toContain('Mark what draws you');
    expect(html).not.toContain('action="/api/customers/hala/login"');
    expect(html).toContain('Winks');
    // Cards stay inside the realm and are keyed by Product ID, not by handle (brief §7).
    expect(html).toContain('href="/hala/SL-021"');
    expect(html).not.toContain('href="/rugs/winks"');
    // Card = like only.
    expect(html).toMatch(/class="sr-only"[^>]*>Like this rug</);
    expect(html).not.toContain('data-vote="dislike"');
    expect(html).toContain('data-source="card"');
    // The realm is published for the reaction batch; the server still verifies the cookie.
    expect(html).toContain('data-customer="hala"');
    // The payment disclaimer is mandatory; the enquiry actions are still forbidden. The footer does
    // carry the studio's WhatsApp lines now (owner, 2026-09-16), so only 'Enquire' stays excluded.
    expect(html).toContain('For some card/transfer payments prices are subject to 16% IVA');
    expect(html).toContain('wa.me');
    expect(html).not.toContain('Enquire');
    // A private preview is never indexed.
    expect(html).toContain('noindex');
  });

  it('shows the texture photograph in the product popup, or the markers when there is none', async () => {
    // Owner, 2026-09-20: the popup's one either/or. A rug with a texture chosen shows the weave up
    // close where the marker chips used to be; a rug without one keeps the chips, so the slot is
    // never an empty gap. Both templates are server-rendered beside the grid, which is why one page
    // is enough to see both halves.
    state.down = false;
    const { html } = await render(CustomerCatalog, '/hala', { slug: 'hala' }, { customer: 'hala' });
    const templateFor = (id: string): string =>
      html.slice(html.indexOf(`data-detail="${id}"`), html.indexOf(`data-detail="${id}"`) + 4000);

    const withTexture = templateFor('SL-021');
    expect(withTexture).toContain('pv-modal__texture');
    expect(withTexture).toContain('1TeXtUrE0000000000000000000000000');
    expect(withTexture).toContain('the weave up close');
    /* Side by side with the hero (owner, 2026-09-21), not under the title: both plates are in the
       MEDIA column, inside one row that says it has a texture. It used to sit in the facts column
       where it read as an afterthought to the price. */
    const plates = withTexture.slice(
      withTexture.indexOf('pv-modal__plates'),
      withTexture.indexOf('pv-modal__info'),
    );
    expect(plates).toContain('has-texture');
    expect(plates).toContain('pv-modal__photo');
    expect(plates).toContain('pv-modal__texture');
    // The hero comes first, so the rug is the subject and the weave the detail beside it.
    expect(plates.indexOf('pv-modal__photo')).toBeLessThan(plates.indexOf('pv-modal__texture'));

    const withMarkers = templateFor('SL-022');
    expect(withMarkers).not.toContain('pv-modal__texture');
    // A rug with no texture keeps a plain row — nothing shifts and no empty plate is drawn.
    expect(withMarkers).toContain('pv-modal__plates');
    expect(withMarkers).not.toContain('has-texture');
    // The markers are the facts column's own, whether or not there is a texture (owner, 2026-09-21).
    expect(withMarkers).toContain('pv-modal__marker');
    expect(withTexture).toContain('pv-modal__marker');
    // Capitalised again on 2026-09-20 (owner), from the one BADGE_TAG_NAMES list.
    expect(withMarkers).toContain('>Signed<');
  });

  it('asks for the password in sentence case, on a cream field', async () => {
    /* Owner, 2026-09-22. Two changes to the same control: the placeholder was "PASSWORD", the last
       shouted capitals on the buyer's side; and the field was #202020 on the black gate, which read
       as a smudge rather than as somewhere to type. Cream on cream cannot be read, so the ink turns
       over with the ground — see --field-* in modes.css. */
    const { html } = await render(CustomerCatalog, '/hala', { slug: 'hala' });
    expect(html).toContain('placeholder="Password"');
    expect(html).not.toContain('placeholder="PASSWORD"');
    const css = readFileSync('src/styles/preview.css', 'utf8');
    const dark = css.slice(css.indexOf("[data-mode='preview-dark'] .pv-input {"));
    expect(dark).toContain('background: var(--field-bg)');
    expect(dark).toContain('color: var(--field-ink)');
    // The old literal survives only in the comment explaining what it was; no rule paints it.
    expect(css).not.toMatch(/background:\s*#202020/);
  });

  it('gives the like heart a shadow, so a cream heart is visible on a cream rug', () => {
    /* Owner, 2026-09-22: "add a nice shadow behind it so it appears when the bg is the same colour
       as its". The control is drawn without a background and must not grow one — it sits ON the
       photograph — so the separation is a shadow under the stroke itself: a filter on the svg, not
       a box-shadow on the button, which would box a circle that has no box. */
    const reactions = readFileSync('src/components/customer/Reactions.astro', 'utf8');
    expect(reactions).toMatch(/\.pv-glyph svg\s*\{[^}]*filter:\s*var\(--shadow-glyph\)/);
    expect(reactions).not.toMatch(/\.pv-circle\s*\{[^}]*box-shadow/);
    // …and the token is a drop-shadow pair: a tight pass for the outline, a softer one for the lift.
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    const value = /--shadow-glyph:([^;]+);/.exec(tokens)?.[1] ?? '';
    expect(value.match(/drop-shadow\(/g) ?? []).toHaveLength(2);
  });

  it('never ships a like count below the threshold — not even in an attribute', async () => {
    // Owner requirement 2026-09-13: the count is visible only at >= 5. The fixture rug sits at 3
    // (tests/helpers/ranges.ts), so this is non-vacuous: until 2026-09-14 the page served
    // `data-like-count="3"` and `data-likes="3"` with the badge correctly blank, which published
    // the exact number to View Source and published the whole hidden ranking to the "Most liked"
    // sort. "Not painted" is not the requirement; "not present" is.
    state.down = false;
    const { html } = await render(CustomerCatalog, '/hala', { slug: 'hala' }, { customer: 'hala' });
    expect(html).not.toMatch(/data-like-count="[0-4]"/);
    expect(html).not.toMatch(/data-likes="[0-4]"/);
    // …and the attribute is absent entirely rather than emptied, so the sort reads it as 0 and
    // leaves the rug in served order instead of ranking it.
    expect(html).not.toContain('data-likes=""');
    expect(html).toContain('pv-card-likes');
  });

  it('filters by collection only — no tag chips, no shortlist chip', async () => {
    state.down = false;
    const { html } = await render(CustomerCatalog, '/hala', { slug: 'hala' }, { customer: 'hala' });
    // Owner, 2026-09-17: buyers filter by collection, never by tag.
    expect(html).toContain('data-filter="all"');
    expect(html).toMatch(/data-filter="kilims"[^>]*>\s*Kilims\s*</);
    expect(html).not.toContain('data-filter="liked"');
    expect(html).not.toContain('data-filter="kilim"');
    expect(html).not.toContain('data-tags=');
    // Each card publishes its collections so the strip can filter without a round trip.
    expect(html).toMatch(/data-card[^>]*data-collections="[^"]*kilims/);
  });

  it('carries each collection’s description on its tab, for the intro line under the strip', async () => {
    state.down = false;
    const { html } = await render(CustomerCatalog, '/hala', { slug: 'hala' }, { customer: 'hala' });
    // Owner, 2026-09-18: the selected collection's description introduces its cards. It ships as an
    // attribute on the tab and filters.ts moves the pressed one into the intro line, so the server
    // renders that line empty and hidden — "All" has no description of its own.
    expect(html).toMatch(/data-filter="kilims"[^>]*data-description="Flatweaves from Denizli\."/);
    expect(html).toContain('data-collection-intro');
    expect(html).toMatch(/data-collection-intro[^>]*hidden/);
  });
});

describe('the buyer’s name never reaches the customer realm', () => {
  // Owner instruction, 2026-09-14: remove the name from everything client-facing, keep it in the
  // admin. Checked across ALL THREE customer-facing renders in one place, because the leak was in
  // three unrelated spots at once — the gate heading (PreviewGate), the header chip (PreviewHeader)
  // and the <title> — and a per-component assertion would not have caught the third.
  //
  // The fixture buyer is "Hala Nasser" on slug "hala", so the SLUG is deliberately not asserted
  // against: the scrambled route is derived from the name by design (owner requirement, D20) and is
  // the one place half those letters still appear. This checks the DISPLAY NAME.
  it.each([
    ['the gate (signed out)', () => render(CustomerCatalog, '/hala', { slug: 'hala' })],
    [
      'the catalog (signed in)',
      () => render(CustomerCatalog, '/hala', { slug: 'hala' }, { customer: 'hala' }),
    ],
    [
      'the detail page',
      () =>
        render(CustomerDetail, '/hala/SL-021', { slug: 'hala', productId: 'SL-021' }, { customer: 'hala' }),
    ],
  ])('%s never prints the display name', async (_label, go) => {
    state.down = false;
    const { html } = await go();
    expect(html).not.toContain('Hala');
    expect(html).not.toContain('Nasser');
    expect(html).not.toContain('Welcome,');
    expect(html).not.toContain('pv-who');
    // …including the tab title, which is read over a shoulder and lands in browser history.
    expect(html).not.toMatch(/<title>[^<]*Hala[^<]*<\/title>/);
  });
});

describe('/{slug}/{productId} — the detail page', () => {
  it('offers a like only, records the source, and shows no enquiry action', async () => {
    state.down = false;
    const { status, html } = await render(
      CustomerDetail,
      '/hala/SL-021',
      { slug: 'hala', productId: 'SL-021' },
      { customer: 'hala' },
    );
    expect(status).toBe(200);
    expect(html).toContain('Winks');
    expect(html).toMatch(/class="sr-only"[^>]*>Like this rug</);
    expect(html).not.toContain('Not for me'); // dislikes were removed (owner, 2026-09-15)
    expect(html).toContain('data-source="detail"');
    expect(html).toContain('Specification');
    expect(html).toContain('135 · 190 cm'); // a middle dot, as drawn, not the reference's cross
    expect(html).not.toContain('Shape'); // stored, deliberately never shown
    expect(html).not.toContain('Enquire on WhatsApp');
    expect(html).not.toContain('Email the studio');
    expect(html).toContain('For some card/transfer payments prices are subject to 16% IVA');
  });

  it('sends a deep link into someone else’s preview back to their own gate', async () => {
    state.down = false;
    const { status, location } = await render(CustomerDetail, '/hala/SL-021', {
      slug: 'hala',
      productId: 'SL-021',
    });
    expect(status).toBe(303);
    expect(location).toBe('/hala');
  });

  it('404s for a product that is not in the catalogue', async () => {
    state.down = false;
    const { status, html } = await render(
      CustomerDetail,
      '/hala/SL-999',
      { slug: 'hala', productId: 'SL-999' },
      { customer: 'hala' },
    );
    expect(status).toBe(404);
    expect(html).toContain('This rug is not in your preview.');
  });
});

describe('the fixture itself', () => {
  it('parses customers with their hash, which never reaches a rendered page', () => {
    expect(fixture.catalogue.customers.map((c) => c.slug)).toEqual(['hala']);
    expect(fixture.catalogue.customers[0]?.passwordHash).toContain('scrypt.');
  });
});
