// karavanrug.com adapter — the host-specific (last) rung of the brief's §11 ladder. Shopify,
// server-rendered, no bot protection (docs/ADMIN_SPEC.md §4.4). The generic Shopify product parsing
// now lives in `shopify.ts` (ladder rung 1) and is re-exported here under the historic names; what
// stays is what is specific to KV: the "Item Details" spec block, the method keyword fallback, the
// tag tidying and the JSON-LD/OG currency read. Pure: takes the fetched bodies, returns a ScrapedRug.
import { SHOPIFY_BASE } from './detect.ts';
import {
  collapse,
  dedupeStrings,
  extractGeneric,
  firstKeyword,
  htmlToText,
  labelValueLines,
  loadHtml,
  splitList,
  tidyTag,
} from './generic.ts';
import { normaliseCurrency } from './money.ts';
import { resolvePhotos } from './photos.ts';
import {
  parseShopifyProduct,
  shopifyPhotos,
  shopifyPrice,
  withWidth,
  type ShopifyProduct,
} from './shopify.ts';
import { parseSize } from './size.ts';
import {
  NO_STORE_PRICE,
  proseFacts,
  storefrontSpecs,
  type ProseFacts,
  type StorefrontSpecs,
} from './storefront.ts';
import type { FieldStatusMap, ScrapedRug, ShopifySupplier } from './types.ts';

export { withWidth };
/** Historic names: KV's product payload is an ordinary Shopify one (`shopify.ts`). */
export const parseKaravanProduct = parseShopifyProduct;
export const karavanPhotos = shopifyPhotos;
export type KaravanProduct = ShopifyProduct;

export interface KaravanSources {
  /** Body of `/products/<handle>.js` (JSON). */
  js?: string;
  /** Body of `/products/<handle>.json` (JSON, `{ product: … }`). */
  json?: string;
  /** Body of `/products/<handle>` (HTML, JSON-LD). */
  html?: string;
}

export const KV_METHOD_KEYWORDS: readonly string[] = [
  'Kilim',
  'Cicim',
  'Soumak',
  'Tulu',
  'Handwoven',
  'Hand-knotted',
];

/** Headings that KV prints on their own line with the value on the next (`Size` / `305 x 370 cm …`). */
/* A heading may carry more words than the fact it names — KV prints "Material & Design" over the
   material, and "Size" over the size. Matched on the FIRST word so a section title reads as its
   fact, and only for headings where that cannot be ambiguous. */
const KV_HEADINGS: readonly string[] = [
  'stock code',
  'size',
  'material',
  'technique',
  'age',
  'origin',
  'colors',
  'colours',
  'style',
  'dyes',
  'condition',
];

export const DESCRIPTION_MAX = 4000;

/** `Label: value` lines plus KV's heading-on-its-own-line blocks. */
export function parseKaravanSpecs(descriptionHtml: string): { text: string; specs: Map<string, string> } {
  const text = htmlToText(descriptionHtml);
  const specs = labelValueLines(text);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const heading = collapse(lines[i]).replace(/:$/, '').toLowerCase().replace(/&amp;/g, '&');
    const key = KV_HEADINGS.find(
      (h) => heading === h || heading.startsWith(`${h} `) || heading.startsWith(`${h} &`),
    );
    const next = collapse(lines[i + 1]);
    if (key && next && !specs.has(key)) specs.set(key, next);
  }
  return { text, specs };
}

/**
 * The product as the PAGE describes it, for when neither JSON endpoint answered.
 *
 * Why this exists (owner, 2026-09-21: "the scrape does not fill the data from karavanrug.com"): the
 * adapter used to return undefined without `.js` or `.json`, and the ladder then fell back to the
 * generic rungs, which know a name, a price and a photograph — and nothing about size, material,
 * method, age or origin. So a Shopify rug arrived with five empty fields while an ECG rug, whose
 * adapter reads the HTML itself, arrived complete. That asymmetry was the bug, not the endpoints.
 *
 * Both endpoints failing is ordinary: `/products/<handle>.js` 404s on some Shopify shops, and a
 * storefront may rate-limit or block them for a server that is not a browser. The page itself is the
 * one thing that is always there, and its JSON-LD carries the same description the endpoints do —
 * which is where every spec is written.
 */
function productFromHtml(html: string | undefined, handle: string): ShopifyProduct | undefined {
  if (!html) return undefined;
  const g = extractGeneric(loadHtml(html));
  const title = g.ld?.name ?? g.title;
  const description = g.ld?.description ?? g.description ?? '';
  // A 404 page is still a page: it has a title and no product in it. Anything without a name or a
  // description is not worth pretending about — the caller then reports `parse_failed`, which is true.
  if (!title || !description) return undefined;
  const images = g.ld?.images?.length ? g.ld.images : g.image ? [g.image] : [];
  return {
    title,
    handle,
    descriptionHtml: description,
    tags: [],
    variantPrice: g.ld?.price ?? g.price,
    variantSku: g.ld?.sku ?? g.sku,
    images,
    media: images.map((src) => ({ src })),
    source: 'html',
  };
}

/**
 * Builds the ScrapedRug for a KV handle from whichever bodies were fetched. Undefined when the page
 * carried no product at all. `seenCurrency` comes from the HTML's JSON-LD / og meta, else USD is
 * assumed and flagged.
 */
export function parseKaravan(
  handle: string,
  src: KaravanSources,
  /* Which Shopify shop this came from (owner, 2026-09-21). Defaults to KV, which is the only shop
     that existed when this adapter was written and the one every fixture is taken from. */
  supplier: ShopifySupplier = 'karavanrug',
): ScrapedRug | undefined {
  const product = parseKaravanProduct(src.js, src.json) ?? productFromHtml(src.html, handle);
  if (!product) return undefined;
  const warnings: string[] = [];
  const { text, specs } = parseKaravanSpecs(product.descriptionHtml);
  /* The studio's own store (owner, 2026-09-23) prints its facts in the theme, from metafields, and
     writes its descriptions in ECG's words — see storefront.ts. Read for that shop only, so a KV page
     is parsed exactly as it always was. */
  const own = supplier === 'serioludere';
  const store: StorefrontSpecs = own ? storefrontSpecs(src.html) : { colors: [], styles: [] };
  const prose: ProseFacts = own ? proseFacts(text) : { colors: [], styles: [] };

  // brief §11 field status: anything KV did not print as a labelled spec is marked `inferred`.
  const fieldStatus: Partial<FieldStatusMap> = {};
  let seenCurrency: string | undefined;
  let currencyAssumed = false;
  let ldSku: string | undefined;
  let ldPrice: number | undefined;
  let ogImage: string | undefined;
  if (src.html) {
    const g = extractGeneric(loadHtml(src.html));
    seenCurrency = g.ld?.currency ?? g.currency;
    ldSku = g.ld?.sku;
    ldPrice = g.ld?.price ?? g.price;
    ogImage = g.image;
  }
  if (!seenCurrency) {
    seenCurrency = 'USD';
    currencyAssumed = true;
    warnings.push(
      src.html
        ? 'currency not stated on the product page; USD assumed'
        : 'product page not read; currency USD assumed',
    );
  }
  seenCurrency = normaliseCurrency(seenCurrency) ?? 'USD';

  let seenPrice = shopifyPrice(product) ?? ldPrice;
  /* A rug the studio has not priced yet shows 0.00 on its own store. That is "no price", not a price
     of nothing: left blank for the studio to type, and not a reason to fail the scrape. */
  if (own && seenPrice !== undefined && !(seenPrice > 0)) {
    seenPrice = undefined;
    warnings.push(NO_STORE_PRICE);
  }

  const stockCode = specs.get('stock code');
  const sku = product.variantSku?.trim() || ldSku?.trim() || '';
  /* On the studio's own store the variant SKU IS the reference, and a rug without one simply has none:
     the handle is not a SKU, and on the add form the reference becomes the product id. */
  const supplierRef = own ? sku : (stockCode ?? product.variantSku ?? ldSku ?? handle);
  // No Stock Code on the page: the variant sku, the JSON-LD sku or the handle stands in for it.
  if (!own && !stockCode) fieldStatus.supplierRef = 'inferred';

  const sizeText = store.dimensions ?? specs.get('size');
  const sizeFromSpec = parseSize(sizeText);
  const size = sizeFromSpec ?? parseSize(product.title) ?? parseSize(text);
  if (size && (!sizeFromSpec || size.source !== 'cm')) {
    // Read out of the title or the description, or converted from feet — not a stated cm pair.
    fieldStatus.widthCm = 'inferred';
    fieldStatus.lengthCm = 'inferred';
    fieldStatus.sizeRaw = 'inferred';
  }
  if (size?.note) warnings.push(size.note);

  // The page's own labelled fact first; what the description only says in passing is `inferred`.
  const stated = (
    fact: string | undefined,
    fromProse: string | undefined,
    field: 'material' | 'age' | 'origin' | 'pile',
  ): string | undefined => {
    if (fact) return fact;
    if (fromProse) fieldStatus[field] = 'inferred';
    return fromProse;
  };
  const material = stated(specs.get('material') ?? store.material, prose.material, 'material');
  const technique = specs.get('technique') ?? store.method;
  const method = technique ?? firstKeyword(`${product.title}\n${text}`, KV_METHOD_KEYWORDS) ?? undefined;
  // Guessed from a keyword in the title/description rather than read from the Technique row.
  if (!technique && method) fieldStatus.method = 'inferred';
  const age = stated(specs.get('age') ?? store.age, prose.age, 'age');
  const origin = stated(specs.get('origin') ?? store.origin, prose.origin, 'origin');
  const pile = stated(store.pile, prose.pile, 'pile');

  if (own) {
    const listing = [
      product.vendor && `vendor ${product.vendor}`,
      product.productType && `type ${product.productType}`,
    ].filter(Boolean);
    if (listing.length) warnings.push(`On the store: ${listing.join(', ')}`);
    if (product.available === false) warnings.push('the store shows this rug as sold out');
  }

  for (const key of ['dyes', 'condition'] as const) {
    const v = specs.get(key);
    if (v) warnings.push(`${key === 'dyes' ? 'Dyes' : 'Condition'}: ${v}`);
  }

  const tagsSuggested = dedupeStrings(
    [
      ...splitList(specs.get('colors') ?? specs.get('colours')),
      ...splitList(specs.get('style')),
      ...(store.colors.length ? store.colors : prose.colors),
      ...(store.styles.length ? store.styles : prose.styles),
      ...product.tags,
    ]
      .map(tidyTag)
      .filter((t) => t.toLowerCase() !== 'rugs'),
    20,
  );

  // Photo-first (brief §11): the Shopify media list is the gallery, og:image the last resort.
  const resolved = resolvePhotos(() => shopifyPhotos(product), { fallback: ogImage });
  if (resolved.warning) warnings.push(resolved.warning);

  let description: string | undefined = text || undefined;
  if (description && description.length > DESCRIPTION_MAX) {
    description = description.slice(0, DESCRIPTION_MAX);
    warnings.push(`description truncated to ${DESCRIPTION_MAX} characters`);
  }

  return {
    supplier,
    supplierRef: collapse(supplierRef),
    sourceUrl: `${SHOPIFY_BASE[supplier]}${handle}`,
    supplierTitle: product.title,
    description,
    widthCm: size?.widthCm,
    lengthCm: size?.lengthCm,
    sizeRaw: sizeText ?? size?.sizeRaw,
    material,
    method,
    age,
    origin,
    pile,
    shape: store.shape,
    seenPrice,
    seenCurrency,
    currencyAssumed,
    tagsSuggested,
    photos: resolved.photos,
    primaryImage: resolved.primaryImage,
    warnings,
    fieldStatus,
  };
}
