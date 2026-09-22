import { describe, expect, it } from 'vitest';
import { detectSupplier, manualFallback, manualFromDetected } from '../../../src/lib/scrape/detect.ts';

describe('detectSupplier (ADMIN_SPEC §4.2)', () => {
  it('rebuilds ECG links on the us_en store from any store code, host spelling or scheme', () => {
    for (const input of [
      'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
      'https://www.ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
      'http://ecarpetgallery.com/eu_en/red-5x8-andelz-area-rugs-380114',
      'https://ecarpetgallery.com/ca_fr/red-5x8-andelz-area-rugs-380114/',
      'https://ecarpetgallery.com/red-5x8-andelz-area-rugs-380114?utm_source=x#top',
      '  https://ECARPETGALLERY.com/ca_en/RED-5x8-andelz-area-rugs-380114  ',
    ]) {
      const det = detectSupplier(input);
      expect(det).toMatchObject({
        supplier: 'ecarpetgallery',
        sku: '380114',
        urlKey: 'red-5x8-andelz-area-rugs-380114',
        supplierRef: '380114',
        sourceUrl: 'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
        htmlUrl: 'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
      });
    }
  });

  it('remembers the store the link came from, and only when it is not us_en', () => {
    /* Owner, 2026-09-22: "404 — knowing that the page is working". Every ECG link is canonicalised
       onto us_en so the price is in USD, but the catalogues differ by store, and a rug listed on
       ca_en may not exist on us_en at all. So the store the link came from is kept — rebuilt from the
       key, not taken as pasted — and the ladder falls back to it on a 404. */
    expect(
      detectSupplier('https://ecarpetgallery.com/ca_en/a/b/red-5x8-andelz-area-rugs-380114'),
    ).toMatchObject({
      sourceUrl: 'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
      pastedUrl: 'https://ecarpetgallery.com/ca_en/red-5x8-andelz-area-rugs-380114',
    });
    expect(detectSupplier('https://ecarpetgallery.com/ca_fr/red-5x8-andelz-area-rugs-380114')).toMatchObject({
      pastedUrl: 'https://ecarpetgallery.com/ca_fr/red-5x8-andelz-area-rugs-380114',
    });
    // us_en IS the canonical store, so there is no second URL to try; nor is there for a link with
    // no store code at all.
    for (const input of [
      'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
      'https://ecarpetgallery.com/red-5x8-andelz-area-rugs-380114',
      'https://ecarpetgallery.com/shop-by-shape/red-5x8-andelz-area-rugs-380114',
    ]) {
      expect(detectSupplier(input), input).toMatchObject({ pastedUrl: undefined });
    }
  });

  it('takes the trailing digits as the sku even when the key contains numbers', () => {
    const det = detectSupplier('https://ecarpetgallery.com/us_en/red-10-ft-runner-andelz-runner-rug-425302');
    expect(det).toMatchObject({
      supplier: 'ecarpetgallery',
      sku: '425302',
      urlKey: 'red-10-ft-runner-andelz-runner-rug-425302',
    });
  });

  it('rebuilds KV links into the Shopify .js / .json / HTML endpoints', () => {
    for (const input of [
      'https://karavanrug.com/products/vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm',
      'http://www.karavanrug.com/products/vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm/?variant=1#x',
    ]) {
      expect(detectSupplier(input)).toEqual({
        supplier: 'karavanrug',
        handle: 'vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm',
        supplierRef: 'vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm',
        sourceUrl: 'https://karavanrug.com/products/vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm',
        jsUrl: 'https://karavanrug.com/products/vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm.js',
        jsonUrl: 'https://karavanrug.com/products/vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm.json',
        htmlUrl: 'https://karavanrug.com/products/vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm',
      });
    }
  });

  it('accepts a link copied from a category page, which is how the studio copies them', () => {
    /* The studio's own failing link (2026-09-21): browsed to by shape, so ECG wrote two category
       segments into the path, and the detector refused a URL that IS the product page —
       `POST /api/admin/scrape` 400, "not a supported product link". The url key is unique in
       Magento, so the categories are decoration and the outbound URL is unchanged. */
    for (const input of [
      'https://ecarpetgallery.com/ca_en/shop-by-shape/rectangle-rugs/green-6x8-finest-peshawar-bokhara-area-rugs-417246',
      'https://ecarpetgallery.com/shop-by-shape/rectangle-rugs/green-6x8-finest-peshawar-bokhara-area-rugs-417246',
      'https://ecarpetgallery.com/us_en/green-6x8-finest-peshawar-bokhara-area-rugs-417246.html',
      'ecarpetgallery.com/us_en/green-6x8-finest-peshawar-bokhara-area-rugs-417246',
    ]) {
      expect(detectSupplier(input), input).toMatchObject({
        supplier: 'ecarpetgallery',
        sku: '417246',
        urlKey: 'green-6x8-finest-peshawar-bokhara-area-rugs-417246',
        sourceUrl: 'https://ecarpetgallery.com/us_en/green-6x8-finest-peshawar-bokhara-area-rugs-417246',
      });
    }
  });

  it('accepts the /collections/<collection>/products/<handle> link Shopify writes', () => {
    // Every Karavan link followed from a collection page carries that prefix; same product, same
    // handle, and the canonical URL the scraper fetches is the same either way.
    expect(
      detectSupplier('https://karavanrug.com/collections/vintage-rugs/products/vintage-turkish-runner-rug'),
    ).toMatchObject({
      supplier: 'karavanrug',
      handle: 'vintage-turkish-runner-rug',
      sourceUrl: 'https://karavanrug.com/products/vintage-turkish-runner-rug',
    });
  });

  it('still refuses the category pages themselves, which carry no product', () => {
    // The widening is for a product reached THROUGH a category, never for the category.
    for (const input of [
      'https://ecarpetgallery.com/ca_en/shop-by-shape/rectangle-rugs/',
      'https://ecarpetgallery.com/us_en/shop-by-size/8x10-rugs',
      'https://karavanrug.com/collections/vintage-rugs',
      'https://karavanrug.com/collections/vintage-rugs/products/',
    ]) {
      expect(detectSupplier(input), input).toEqual({ error: 'invalid_url' });
    }
  });

  it('finds the product wherever it sits in the path, whatever the tail', () => {
    /* Owner, 2026-09-21: "accept links from these two domains no matter what the tail". The path is
       not a permission check — the HOST allow-list is, and fetch.ts re-validates every redirect hop
       against it — so the only job left is finding the identifier. These are the shapes the two
       stores actually produce: store codes, category trails, locale prefixes, `.html`, tracking
       query, a missing scheme. Every one names the same rug and rebuilds to the same canonical URL. */
    for (const input of [
      'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
      'https://ecarpetgallery.com/ca_en/shop-by-shape/rectangle-rugs/red-5x8-andelz-area-rugs-380114',
      'https://ecarpetgallery.com/shop-by-colour/reds/on-sale/red-5x8-andelz-area-rugs-380114.html',
      'https://www.ecarpetgallery.com/eu_en/a/b/c/d/red-5x8-andelz-area-rugs-380114/?utm_source=x#top',
      'ecarpetgallery.com/red-5x8-andelz-area-rugs-380114',
    ]) {
      expect(detectSupplier(input), input).toMatchObject({
        supplier: 'ecarpetgallery',
        sku: '380114',
        sourceUrl: 'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-380114',
      });
    }
    for (const input of [
      'https://karavanrug.com/products/vintage-turkish-runner-rug',
      'https://karavanrug.com/collections/vintage-rugs/products/vintage-turkish-runner-rug',
      'https://karavanrug.com/en-ca/collections/all/products/vintage-turkish-runner-rug?variant=1',
      'karavanrug.com/products/vintage-turkish-runner-rug',
    ]) {
      expect(detectSupplier(input), input).toMatchObject({
        supplier: 'karavanrug',
        handle: 'vintage-turkish-runner-rug',
        sourceUrl: 'https://karavanrug.com/products/vintage-turkish-runner-rug',
      });
    }
  });

  it('takes the LAST key in the path, because everything before a product is a category', () => {
    // A category can itself end in digits ("8x10-rugs-2024"); the product is the one at the end.
    expect(
      detectSupplier('https://ecarpetgallery.com/us_en/clearance-2024/red-5x8-andelz-area-rugs-380114'),
    ).toMatchObject({ sku: '380114', urlKey: 'red-5x8-andelz-area-rugs-380114' });
  });

  it('refuses a page with no product in it, and says so rather than blaming the supplier', async () => {
    /* The one thing a broadened rule must NOT do is accept a listing: there is no rug to fetch, no
       reference to file it under, and whatever was scraped would be whichever product the page
       happened to show first. The message has to say that — "not a supported product link" reads as
       "your supplier is not supported", which is the one thing it does not mean. */
    const { scrapeRug } = await import('../../../src/lib/scrape/index.ts');
    for (const input of [
      'https://ecarpetgallery.com/ca_en/shop-by-shape/rectangle-rugs/',
      'https://ecarpetgallery.com/us_en/catalogsearch/result/?q=380114',
      'https://ecarpetgallery.com/',
      'https://karavanrug.com/collections/vintage-rugs',
    ]) {
      const r = await scrapeRug(input, { respectRobots: false });
      expect(r.ok, input).toBe(false);
      if (r.ok) continue;
      expect(r.code).toBe('invalid_url');
      expect(r.message).toContain('has no product in it');
      // …and the supplier is still recognised, so "Enter manually" opens pre-filled.
      expect(r.manual?.supplier).toMatch(/ecarpetgallery|karavanrug/);
    }
    const other = await scrapeRug('https://rugsource.com/products/foo', { respectRobots: false });
    expect(other.ok).toBe(false);
    if (!other.ok) {
      expect(other.code).toBe('unsupported_host');
      expect(other.message).toContain('only ecarpetgallery.com, karavanrug.com and serioludere.com');
    }
  });

  it('accepts the studio’s own Shopify storefront as a third source', () => {
    // Owner, 2026-09-21. serioludere.com is Shopify, like karavanrug.com, so it reads through the
    // same rungs; only the host it is rebuilt on differs.
    for (const input of [
      'https://serioludere.com/products/oushak-rug',
      'https://www.serioludere.com/collections/all/products/oushak-rug?variant=1',
      'serioludere.com/products/oushak-rug',
    ]) {
      expect(detectSupplier(input), input).toMatchObject({
        supplier: 'serioludere',
        handle: 'oushak-rug',
        supplierRef: 'oushak-rug',
        sourceUrl: 'https://serioludere.com/products/oushak-rug',
        jsUrl: 'https://serioludere.com/products/oushak-rug.js',
        jsonUrl: 'https://serioludere.com/products/oushak-rug.json',
      });
    }
    // A rebuild never crosses shops: a Karavan link stays on Karavan.
    expect(detectSupplier('https://karavanrug.com/products/oushak-rug')).toMatchObject({
      supplier: 'karavanrug',
      sourceUrl: 'https://karavanrug.com/products/oushak-rug',
    });
    // …and the manual-entry pre-fill knows the new shop too, rather than dead-ending on it.
    expect(manualFallback('https://serioludere.com/collections/all')).toMatchObject({
      supplier: 'serioludere',
    });
  });

  it('refuses hosts off the allow-list, including look-alikes', () => {
    for (const input of [
      'https://example.com/products/x',
      'https://ecarpetgallery.com.evil.example/us_en/red-5x8-andelz-area-rugs-380114',
      'https://notkaravanrug.com/products/x',
      'https://images.ecarpetwholesale.com/x-1234',
      'https://r.jina.ai/https://ecarpetgallery.com/us_en/x-1234',
    ]) {
      expect(detectSupplier(input)).toEqual({ error: 'unsupported_host' });
    }
  });

  it('refuses malformed or dangerous links', () => {
    for (const input of [
      '',
      'not a url',
      'ftp://ecarpetgallery.com/us_en/x-1234',
      'https://user:pw@ecarpetgallery.com/us_en/x-1234',
      'https://ecarpetgallery.com:8443/us_en/x-1234',
      'https://127.0.0.1/us_en/x-1234',
      'https://[::1]/products/x',
      'https://localhost/products/x',
    ]) {
      expect(detectSupplier(input)).toEqual({ error: 'invalid_url' });
    }
  });

  it('refuses non-product paths on the supplier hosts (never a listing or search page)', () => {
    for (const input of [
      'https://ecarpetgallery.com/us_en/catalogsearch/result/?q=380114',
      'https://ecarpetgallery.com/us_en/',
      'https://ecarpetgallery.com/us_en/our-story',
      'https://ecarpetgallery.com/us_en/red-5x8-andelz-area-rugs-38',
      'https://karavanrug.com/collections/runners',
      'https://karavanrug.com/products/',
      'https://karavanrug.com/products/x.js',
    ]) {
      expect(detectSupplier(input)).toEqual({ error: 'invalid_url' });
    }
  });
});

describe('manualFallback (ADMIN_SPEC §4.8)', () => {
  it('derives supplier and reference from the pasted URL alone', () => {
    expect(manualFallback('https://ecarpetgallery.com/us_en/catalogsearch/result/?q=380114&x=1')).toEqual({
      supplier: 'ecarpetgallery',
      supplierRef: '',
      sourceUrl: 'https://ecarpetgallery.com/us_en/catalogsearch/result/',
    });
    expect(
      manualFallback('http://www.ecarpetgallery.com/eu_en/red-5x8-andelz-area-rugs-380114.html'),
    ).toEqual({
      supplier: 'ecarpetgallery',
      supplierRef: '380114',
      sourceUrl: 'https://www.ecarpetgallery.com/eu_en/red-5x8-andelz-area-rugs-380114.html',
    });
    expect(manualFallback('karavanrug.com/products/Some-Handle?variant=1')).toEqual({
      supplier: 'karavanrug',
      supplierRef: 'some-handle',
      sourceUrl: 'https://karavanrug.com/products/Some-Handle',
    });
    expect(manualFallback('https://example.com/products/x')).toBeUndefined();
    expect(manualFallback('')).toBeUndefined();
  });

  it('manualFromDetected mirrors the detection', () => {
    const det = detectSupplier('https://karavanrug.com/products/abc');
    expect('error' in det).toBe(false);
    if (!('error' in det)) {
      expect(manualFromDetected(det)).toEqual({
        supplier: 'karavanrug',
        supplierRef: 'abc',
        sourceUrl: 'https://karavanrug.com/products/abc',
      });
    }
  });
});
