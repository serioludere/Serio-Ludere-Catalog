// The studio's own store, serioludere.com (owner, 2026-09-23: "train our scraper on our store … so it
// pulls every piece of data possible without failing"), on pages captured from the live store with
// `node scripts/scrape-fixture.ts <url>`:
//   - nepal-silk-touch-rug: the full case — every Specifications line, a SKU, ECG's copy, a 3D model
//     among the media;
//   - armenian-rug: the sparse case — no SKU, 0.00 for the price, half the specs, a one-line
//     description.
import { describe, expect, it } from 'vitest';
import { ScrapeCache } from '../../../src/lib/scrape/cache.ts';
import { scrapeRug } from '../../../src/lib/scrape/index.ts';
import { parseKaravan } from '../../../src/lib/scrape/karavan.ts';
import {
  NO_STORE_PRICE,
  STORE_MARKET_COOKIE,
  storefrontCurrency,
} from '../../../src/lib/scrape/storefront.ts';
import {
  fakeTransport,
  fixture,
  guards,
  type FakeCall,
  type FakeRoute,
} from '../../fixtures/scrape/index.ts';

const NEPAL = 'nepal-silk-touch-rug';
const ARMENIAN = 'armenian-rug';
const base = (handle: string): string => `https://serioludere.com/products/${handle}`;
const src = (handle: string) => ({
  js: fixture(`sl-${handle}.js.json`),
  json: fixture(`sl-${handle}.json`),
  html: fixture(`sl-${handle}.html`),
});

/**
 * The Nepal rug as a server outside the US was shown it (owner, 2026-09-30): Shopify Markets placed
 * it in the EUR market, so the payload's price is the store's $1,315 converted at 0.9 (€1,183.50),
 * and the page says EUR in its meta, its JSON-LD and `Shopify.currency`.
 */
const inEuros = (rate = '0.9') => {
  const s = src(NEPAL);
  return {
    js: s.js.replaceAll('131500', '118350'),
    json: s.json
      .replaceAll('"1315.00"', '"1183.50"')
      .replaceAll('"price_currency":"USD"', '"price_currency":"EUR"'),
    html: s.html
      .replace(
        '<meta property="product:price:currency" content="USD">',
        '<meta property="product:price:currency" content="EUR">',
      )
      .replaceAll('"priceCurrency":"USD"', '"priceCurrency":"EUR"')
      .replace(
        'Shopify.currency = {"active":"USD","rate":"1.0"}',
        `Shopify.currency = {"active":"EUR","rate":"${rate}"}`,
      ),
  };
};

function routes(handle: string, overrides: Record<string, FakeRoute> = {}): Record<string, FakeRoute> {
  const s = src(handle);
  return {
    [`${base(handle)}.js`]: { body: s.js, contentType: 'text/javascript; charset=utf-8' },
    [`${base(handle)}.json`]: { body: s.json, contentType: 'application/json; charset=utf-8' },
    [base(handle)]: { body: s.html },
    ...overrides,
  };
}

describe('parseKaravan on serioludere.com pages', () => {
  it('reads every fact the page states, from the theme’s Specifications block', () => {
    const rug = parseKaravan(NEPAL, src(NEPAL), 'serioludere');
    expect(rug).toMatchObject({
      supplier: 'serioludere',
      supplierRef: '349281',
      sourceUrl: base(NEPAL),
      supplierTitle: 'Nepal Silk Touch Rug',
      widthCm: 170,
      lengthCm: 259,
      sizeRaw: '170 x 259 cm',
      material: 'Wool, Silk',
      method: 'Hand-Knotted',
      age: 'New',
      origin: 'Nepal',
      pile: 'Thick Pile',
      shape: 'Rectangular',
      seenPrice: 1315,
      seenCurrency: 'USD',
      currencyAssumed: false,
    });
    expect(rug?.description).toContain('Handmade in Nepal');
    // Read off the page, so nothing is flagged for the studio to check.
    expect(rug?.fieldStatus).toEqual({});
    // The colours and style go to the (unshown) suggestions, alongside the store's own tags.
    expect(rug?.tagsSuggested).toEqual(
      expect.arrayContaining(['Beige', 'Dark Brown', 'Brown', 'Hand-knotted', 'Silk-touch']),
    );
    expect(rug?.warnings).toEqual(['On the store: vendor ECG, type Carpets']);
  });

  it('keeps the four photographs and drops the 3D model', () => {
    const rug = parseKaravan(NEPAL, src(NEPAL), 'serioludere')!;
    expect(rug.photos).toHaveLength(4);
    expect(rug.photos.every((p) => p.url.startsWith('https://cdn.shopify.com/'))).toBe(true);
    expect(rug.photos[0]?.original).toContain('nepal-silk-touch-rug-349281-background-removed.png');
  });

  it('reads the sparse page for what it has, and leaves the rest blank rather than guessing', () => {
    const rug = parseKaravan(ARMENIAN, src(ARMENIAN), 'serioludere')!;
    expect(rug).toMatchObject({
      supplierRef: '', // no SKU on the store; the handle is not one, and it would become the product id
      supplierTitle: 'Armenian Rug',
      description: '50 Years Old',
      widthCm: 160,
      lengthCm: 250,
      age: 'Vintage', // the Specifications line wins over "50 Years Old" in the description
      shape: 'Rectangular',
      seenPrice: undefined,
    });
    expect(rug.material).toBeUndefined();
    expect(rug.method).toBeUndefined();
    expect(rug.origin).toBeUndefined();
    expect(rug.warnings).toContain(NO_STORE_PRICE);
    expect(rug.warnings).toContain('On the store: vendor Sham, type Carpets');
  });

  it('falls back to the description, flagged, when the page could not be read', () => {
    const { js } = src(NEPAL);
    const rug = parseKaravan(NEPAL, { js }, 'serioludere')!;
    expect(rug).toMatchObject({
      widthCm: 170,
      lengthCm: 259,
      material: '60% Wool, 40% Silk', // the pile, never the cotton foundation
      method: 'Hand-knotted',
      origin: 'Nepal',
      seenPrice: 1315,
      currencyAssumed: true,
    });
    expect(rug.fieldStatus).toMatchObject({
      widthCm: 'inferred',
      material: 'inferred',
      method: 'inferred',
      origin: 'inferred',
    });
    expect(rug.pile).toBeUndefined();
  });

  it('reads a page Shopify priced in euros back to the store’s own USD, with Shopify’s own rate', () => {
    const rug = parseKaravan(NEPAL, inEuros(), 'serioludere')!;
    expect(rug).toMatchObject({ seenPrice: 1315, seenCurrency: 'USD', currencyAssumed: false });
    expect(rug.warnings.some((w) => w.includes('answered in EUR (1183.5)') && w.includes('0.9'))).toBe(true);
  });

  it('leaves a euro price alone when the page does not say what rate made it', () => {
    const eur = inEuros();
    const html = eur.html.replace(/Shopify\.currency = \{[^}]*\}/, '');
    const rug = parseKaravan(NEPAL, { ...eur, html }, 'serioludere')!;
    // Nothing to read it back with: the Rates tab converts it downstream, and says so.
    expect(rug).toMatchObject({ seenPrice: 1183.5, seenCurrency: 'EUR' });
  });

  it('leaves a karavanrug.com page exactly as it was — the store reading is serioludere’s alone', () => {
    const rug = parseKaravan(NEPAL, src(NEPAL), 'karavanrug')!;
    expect(rug.pile).toBeUndefined();
    expect(rug.shape).toBeUndefined();
    expect(rug.supplierRef).toBe('349281');
    expect(rug.warnings).not.toContain('On the store: vendor ECG, type Carpets');
    // A supplier's euro price is its price: converted by the Rates tab, never read back.
    expect(parseKaravan(NEPAL, inEuros(), 'karavanrug')).toMatchObject({
      seenPrice: 1183.5,
      seenCurrency: 'EUR',
    });
  });
});

describe('scrapeRug: serioludere.com end to end', () => {
  it('reads .js + the page, prices at the store’s own price, and fills every field', async () => {
    const calls: FakeCall[] = [];
    const r = await scrapeRug(`https://www.serioludere.com/collections/all/products/${NEPAL}?variant=1`, {
      fetchImpl: fakeTransport(routes(NEPAL), calls),
      cache: new ScrapeCache(),
      ...guards(),
      markup: 1.6,
    });
    expect(r).toMatchObject({ ok: true, via: 'impit', cached: false });
    if (!r.ok) return;
    expect(r.data).toMatchObject({
      supplierRef: '349281',
      priceUsd: 1315,
      // The store already sells at retail: not 1315 × 1.6.
      suggestedRetailUsd: 1315,
      pricingRule: "serioludere: the store's own price",
      markupApplied: undefined,
      sizeLabel: '170 × 259 cm',
      sizeBand: 'M',
      pile: 'Thick Pile',
      shape: 'Rectangular',
    });
    const missing = Object.entries(r.data.fieldStatus)
      .filter(([, s]) => s === 'missing')
      .map(([f]) => f);
    // Only the ECG-only estimate is missing; everything the store states is there.
    expect(missing).toEqual(['retailEstimate']);
    expect(calls.map((c) => c.url)).toEqual([`${base(NEPAL)}.js`, base(NEPAL)]);
    // Every request asks for the store's US market, so Shopify answers in its own USD.
    expect(calls.every((c) => c.headers.Cookie === STORE_MARKET_COOKIE)).toBe(true);
  });

  it('prices at the store’s USD even when Shopify answers in euros — no Rates-tab round trip', async () => {
    const eur = inEuros();
    const r = await scrapeRug(base(NEPAL), {
      fetchImpl: fakeTransport(
        routes(NEPAL, {
          [`${base(NEPAL)}.js`]: { body: eur.js, contentType: 'text/javascript; charset=utf-8' },
          [base(NEPAL)]: { body: eur.html },
        }),
      ),
      cache: new ScrapeCache(),
      ...guards(),
      // A Rates tab that disagrees with Shopify, to prove it is not what priced the rug.
      convertToUsd: (amount, currency) => (currency === 'EUR' ? amount * 1.2 : undefined),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ seenCurrency: 'USD', priceUsd: 1315, suggestedRetailUsd: 1315 });
    expect(r.data.warnings.some((w) => w.includes('Rates tab'))).toBe(false);
  });

  it('succeeds on an unpriced rug and asks for the price, instead of failing the scrape', async () => {
    const r = await scrapeRug(base(ARMENIAN), {
      fetchImpl: fakeTransport(routes(ARMENIAN)),
      cache: new ScrapeCache(),
      ...guards(),
      markup: 1.6,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.seenPrice).toBeUndefined();
    expect(r.data.suggestedRetailUsd).toBeUndefined();
    expect(r.data.fieldStatus.seenPrice).toBe('missing');
    // Once, even though both the adapter and the generic rungs saw the 0.00.
    expect(r.data.warnings.filter((w) => w === NO_STORE_PRICE)).toHaveLength(1);
  });

  it('still reads the rug when .js is refused, through .json and the page', async () => {
    const r = await scrapeRug(base(NEPAL), {
      fetchImpl: fakeTransport(routes(NEPAL, { [`${base(NEPAL)}.js`]: { status: 403, body: 'no' } })),
      cache: new ScrapeCache(),
      ...guards(),
    });
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.data).toMatchObject({ supplierRef: '349281', pile: 'Thick Pile', seenPrice: 1315 });
  });

  it('still reads the rug when the page fails, from the payload and its description', async () => {
    const r = await scrapeRug(base(NEPAL), {
      fetchImpl: fakeTransport(routes(NEPAL, { [base(NEPAL)]: { status: 500, body: 'down' } })),
      cache: new ScrapeCache(),
      ...guards(),
    });
    expect(r).toMatchObject({ ok: true });
    if (r.ok) {
      expect(r.data).toMatchObject({
        widthCm: 170,
        origin: 'Nepal',
        seenPrice: 1315,
        suggestedRetailUsd: 1315,
      });
      expect(r.data.fieldStatus.origin).toBe('inferred');
    }
  });

  it('reports a product that is gone as not found', async () => {
    const r = await scrapeRug(base('no-such-rug'), {
      fetchImpl: fakeTransport({ [`${base('no-such-rug')}.js`]: { status: 404, body: '{}' } }),
      cache: new ScrapeCache(),
      ...guards(),
    });
    expect(r).toMatchObject({ ok: false, code: 'not_found' });
  });
});

describe('storefrontCurrency', () => {
  it('reads the currency a Shopify page is priced in, and the rate that made it', () => {
    expect(storefrontCurrency(fixture(`sl-${NEPAL}.html`))).toEqual({ active: 'USD', rate: 1 });
    expect(
      storefrontCurrency('<script>Shopify.currency = {"active":"eur","rate":"0.9246"};</script>'),
    ).toEqual({
      active: 'EUR',
      rate: 0.9246,
    });
  });

  it('says nothing rather than guess', () => {
    expect(storefrontCurrency(undefined)).toBeUndefined();
    expect(storefrontCurrency('<p>no script</p>')).toBeUndefined();
    expect(storefrontCurrency('Shopify.currency = {"active":"EUR","rate":"0"}')).toBeUndefined();
    expect(storefrontCurrency('Shopify.currency = {"active":"EUR","rate":')).toBeUndefined();
    expect(storefrontCurrency('Shopify.currency = {"active":"EURO","rate":"1.0"}')).toBeUndefined();
  });
});
