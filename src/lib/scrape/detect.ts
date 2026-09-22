// URL normalisation and supplier detection (docs/ADMIN_SPEC.md §4.2). The pasted string is never
// fetched: the outbound URLs are rebuilt from `(supplier, urlKey | handle)` against constant hosts.
import { hostnameProblem } from './guard.ts';
import type { DetectError, Detected, ManualEntry, ShopifySupplier, Supplier } from './types.ts';

const ECG_HOSTS: readonly string[] = ['ecarpetgallery.com', 'www.ecarpetgallery.com'];
/** The Shopify shops, each with the host its canonical product URL is rebuilt on. */
const SHOPIFY_HOSTS: Readonly<Record<string, ShopifySupplier>> = {
  'karavanrug.com': 'karavanrug',
  'www.karavanrug.com': 'karavanrug',
  // The studio's own storefront (owner, 2026-09-21).
  'serioludere.com': 'serioludere',
  'www.serioludere.com': 'serioludere',
};

/** Where each Shopify shop's canonical product URL lives. */
export const SHOPIFY_BASE: Readonly<Record<ShopifySupplier, string>> = {
  karavanrug: 'https://karavanrug.com/products/',
  serioludere: 'https://serioludere.com/products/',
};

/*
 * WHY THE PATH IS PARSED AT ALL (owner asked, 2026-09-21: "why not accept any link from these two
 * hosts, whatever the tail?").
 *
 * It is not a permission check — the HOST allow-list is what decides whether we fetch anything, and
 * `fetch.ts` re-validates every redirect hop against it, so a strange path was never a security
 * question. The path is read for two things the scrape cannot do without:
 *
 *   1. the URL we actually request, which is REBUILT from `(supplier, key)` rather than taken as
 *      pasted, so a tracking query, a store code or a category trail cannot change what is fetched
 *      or make two links to one rug look like two rugs;
 *   2. the supplier's reference — the ECG sku, the Shopify handle — which becomes `supplierRef` and,
 *      on the add form, the product id.
 *
 * So "any tail" is exactly right for a PRODUCT link, and these two rules now find the identifier
 * wherever it sits in the path rather than insisting on a position. What they still refuse is a link
 * with no product in it — a category, a search, the home page — because there is nothing there to
 * fetch, nothing to file it under, and a rug scraped from a listing page would be whichever one the
 * page happened to show first. That refusal now says so in as many words (see scrape/index.ts).
 */

/** ECG's store codes, which lead a product path when the link was copied from one of those stores. */
export const ECG_STORES: readonly string[] = ['us_en', 'ca_en', 'eu_en', 'ca_fr'];

/** The ECG url key, wherever it sits: the last path segment ending in a 4+ digit sku. */
export const ECG_KEY_RE = /^([a-z0-9-]+?-(\d{4,}))(?:\.html)?$/;
/** The Shopify handle: whatever follows a `products` segment, wherever that segment sits. */
export const KV_HANDLE_RE = /^[a-z0-9-]+$/;

/** Path segments, lowercased, with the empty ones a leading/trailing/double slash leaves behind. */
function segmentsOf(path: string): string[] {
  return path
    .toLowerCase()
    .split('/')
    .filter((s) => s !== '');
}

export const ECG_BASE = 'https://ecarpetgallery.com/us_en/';
/** Kept as the historic name for KV's base; `SHOPIFY_BASE` is the one to read. */
export const KV_BASE = SHOPIFY_BASE.karavanrug;

export function supplierForHost(hostname: string): Supplier | undefined {
  const h = hostname.toLowerCase();
  if (ECG_HOSTS.includes(h)) return 'ecarpetgallery';
  return SHOPIFY_HOSTS[h];
}

/**
 * Parses a pasted supplier link. http is rewritten to https; userinfo, ports, tracking query/hash
 * and anything off the allow-list are refused. Paths are compared lowercased ([assumption]: Magento
 * url keys and Shopify handles are lowercase).
 */
export function detectSupplier(input: string): Detected | DetectError {
  const raw = input.trim();
  if (!raw) return { error: 'invalid_url' };
  let url: URL;
  try {
    // A link copied as text often arrives without its scheme. `manualFallback` below has always
    // assumed https for exactly that case; the detector refusing what the fallback accepts was a
    // difference with no reason behind it. Anything that names a scheme keeps it, and is then held
    // to the https rule three lines down.
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { error: 'invalid_url' };
  }
  if (url.protocol === 'http:') url.protocol = 'https:';
  if (url.protocol !== 'https:') return { error: 'invalid_url' };
  if (url.username || url.password || url.port) return { error: 'invalid_url' };
  if (hostnameProblem(url.hostname)) return { error: 'invalid_url' };
  const supplier = supplierForHost(url.hostname);
  if (!supplier) return { error: 'unsupported_host' };
  const segments = segmentsOf(url.pathname);
  if (supplier === 'ecarpetgallery') {
    /* The LAST segment that looks like a url key, so a category trail, a store code, a `.html` or
       anything else ECG puts in front of the product is simply walked past. Last rather than first:
       every segment before the product is a category, and a category is never the thing you pasted. */
    let urlKey: string | undefined;
    let sku: string | undefined;
    for (const segment of segments) {
      const m = ECG_KEY_RE.exec(segment);
      if (m) {
        urlKey = m[1];
        sku = m[2];
      }
    }
    if (!urlKey || !sku) return { error: 'invalid_url' };
    const sourceUrl = `${ECG_BASE}${urlKey}`;
    /* The store code the link came from, kept so the ladder can fall back to it when the canonical
       us_en page 404s (owner, 2026-09-22). Rebuilt from the key, never taken as pasted: the category
       trail and any query are still dropped, so this is the same URL policy on a different store. */
    const store = segments[0];
    const pastedUrl =
      store && ECG_STORES.includes(store) && store !== 'us_en'
        ? `https://ecarpetgallery.com/${store}/${urlKey}`
        : undefined;
    return { supplier, urlKey, sku, supplierRef: sku, sourceUrl, htmlUrl: sourceUrl, pastedUrl };
  }
  // Shopify always spells a product `/products/<handle>`; what precedes it (a collection, a locale
  // prefix like /en-ca) is Shopify's own routing and never changes which product it is.
  const at = segments.lastIndexOf('products');
  const next = at === -1 ? undefined : segments[at + 1];
  const handle = next && KV_HANDLE_RE.test(next) ? next : undefined;
  if (!handle) return { error: 'invalid_url' };
  const sourceUrl = `${SHOPIFY_BASE[supplier]}${handle}`;
  return {
    supplier,
    handle,
    supplierRef: handle,
    sourceUrl,
    jsUrl: `${sourceUrl}.js`,
    jsonUrl: `${sourceUrl}.json`,
    htmlUrl: sourceUrl,
  };
}

/**
 * Manual-entry pre-fill (§4.8): supplier and reference from the pasted URL alone — the last 4+ digit
 * run for ECG, the handle for KV — even when the link is not a product page. Undefined for other hosts.
 */
export function manualFallback(input: string): ManualEntry | undefined {
  const raw = input.trim();
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  // The same allow-list the detector uses, so a shop added there is offered here too rather than
  // dead-ending on "Enter manually" with nothing pre-filled.
  const supplier = supplierForHost(host) ?? supplierForHost(host.replace(/^www\./, ''));
  if (!supplier) return undefined;
  if (url.protocol === 'http:') url.protocol = 'https:';
  url.search = '';
  url.hash = '';
  url.username = '';
  url.password = '';
  const path = url.pathname;
  const supplierRef =
    supplier === 'ecarpetgallery'
      ? ([...path.matchAll(/\d{4,}/g)].at(-1)?.[0] ?? '')
      : (/\/products\/([a-z0-9-]+)/i.exec(path)?.[1]?.toLowerCase() ?? '');
  return { supplier, supplierRef, sourceUrl: url.toString() };
}

/** The manual pre-fill for a successfully detected link. */
export function manualFromDetected(det: Detected): ManualEntry {
  return { supplier: det.supplier, supplierRef: det.supplierRef, sourceUrl: det.sourceUrl };
}
