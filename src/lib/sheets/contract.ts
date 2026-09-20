// The sheet contract (docs/ADR.md §5, brief §2/§9). Column headers are validated on every read; the
// site fails a refresh loudly on a mismatch and keeps serving the last good snapshot (ADR D5.2).
//
// Brief v0.5 replaced the original tabs: `Products` carries Shopify's product-CSV column set so the
// tab imports without remapping, `Reactions` and `Visits` are append-only event logs, and
// `Customers` holds one row per named buyer. Header strings here are lowercase because
// `assertHeaders` compares case-insensitively; the casing written into the sheet (and used by the
// CSV export) lives in `PRODUCT_HEADER_LABELS`.

export const TABS = {
  products: 'Products',
  collections: 'Collections',
  customers: 'Customers',
  reactions: 'Reactions',
  reactionsArchive: 'ReactionsArchive',
  visits: 'Visits',
  tags: 'Tags',
  rates: 'Rates',
  auditLog: 'AuditLog',
  settings: 'Settings',
} as const;

export type TabName = (typeof TABS)[keyof typeof TABS];

/** Shopify's product-CSV headers, in the casing the sheet and the CSV export use (brief §9). */
export const PRODUCT_HEADER_LABELS = [
  'Product ID',
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Product Category',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Variant SKU',
  'Variant Grams',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Image Src',
  'Image Alt Text',
  'SEO Title',
  'SEO Description',
  'Status',
  'Width CM',
  'Length CM',
  'Size Label',
  'Size Band',
  'Material',
  'Method',
  'Origin',
  'Age',
  'Pile',
  'Shape',
  'Collection',
  'Source URL',
  'Source Site',
  'Drive Folder ID',
  'Drive Folder URL',
  'Scraped At',
  'Commit Status',
  'Internal Notes',
  /**
   * The texture photograph (owner, 2026-09-20): one of the product's own photos, the close-up of the
   * weave, shown in the buyer's product popup. A Drive file id, exactly like `Image Src`.
   *
   * Appended AFTER `Internal Notes` rather than filed next to `Image Src`, because `assertHeaders`
   * compares positionally: inserting it mid-row would shift every column behind it and invalidate
   * every existing sheet. Trailing, it is also the one column an existing sheet may simply not have
   * yet — see PRODUCT_OPTIONAL_TRAILING.
   */
  'Texture Image',
] as const;

/** Zero-based column index of every Products field (A..AQ). */
export const PRODUCT_COLS = {
  productId: 0,
  handle: 1,
  title: 2,
  bodyHtml: 3,
  vendor: 4,
  productCategory: 5,
  type: 6,
  tags: 7,
  published: 8,
  option1Name: 9,
  option1Value: 10,
  variantSku: 11,
  variantGrams: 12,
  variantInventoryQty: 13,
  variantInventoryPolicy: 14,
  variantPrice: 15,
  variantCompareAtPrice: 16,
  variantRequiresShipping: 17,
  variantTaxable: 18,
  imageSrc: 19,
  imageAltText: 20,
  seoTitle: 21,
  seoDescription: 22,
  status: 23,
  widthCm: 24,
  lengthCm: 25,
  sizeLabel: 26,
  sizeBand: 27,
  material: 28,
  method: 29,
  origin: 30,
  age: 31,
  pile: 32,
  shape: 33,
  collection: 34,
  sourceUrl: 35,
  sourceSite: 36,
  driveFolderId: 37,
  driveFolderUrl: 38,
  scrapedAt: 39,
  commitStatus: 40,
  internalNotes: 41,
  textureImage: 42,
} as const;

/** Number of columns a Products row occupies (A..AQ). */
export const PRODUCT_WIDTH = PRODUCT_HEADER_LABELS.length;

/** The last Products column letter, so a range is never spelled out by hand and left behind. */
export const PRODUCT_LAST_COL = 'AQ';

/**
 * How many of the Products headers a sheet is allowed to be missing off the END of row 1.
 *
 * `Texture Image` was added on 2026-09-20 to a contract that had been live for weeks. A header check
 * that demanded it outright would have taken every deployed catalogue down with a contract error —
 * a 503 on the buyer's page — until someone ran `npm run sheet:init`. So the newest trailing
 * column(s) may be ABSENT (a blank cell is absent too); anything present must still be the right
 * label in the right place, and the cells behind a missing header read as empty.
 *
 * `sheet:init` writes the header and widens the grid, after which this tolerance does nothing.
 */
export const PRODUCT_OPTIONAL_TRAILING = 1;

/**
 * What column X carries now that products have no status (owner, 2026-09-16). The column stays in
 * the sheet and in PRODUCT_COLS — `assertHeaders` compares positionally, so removing it would shift
 * every column after index 23 — but nothing reads it any more. Every write puts this literal there,
 * which also keeps the Shopify export (src/lib/admin/export.ts) emitting a value Shopify accepts.
 */
export const PRODUCT_STATUS_CELL = 'active';

export const HEADERS: Record<TabName, readonly string[]> = {
  Products: PRODUCT_HEADER_LABELS.map((h) => h.toLowerCase()),
  // The brief's five columns first (id, name, slug, description, created_at); cover_image_url and
  // sort_order are ours and trail, so a CSV of the first five still matches the brief.
  Collections: ['id', 'name', 'slug', 'description', 'created_at', 'cover_image_url', 'sort_order'],
  Customers: ['slug', 'display_name', 'password_hash', 'note', 'created_at', 'active'],
  Reactions: ['event_id', 'customer_slug', 'product_id', 'reaction', 'source', 'created_at'],
  ReactionsArchive: ['event_id', 'customer_slug', 'product_id', 'reaction', 'source', 'created_at'],
  Visits: ['event_id', 'customer_slug', 'occurred_at', 'user_agent', 'referrer'],
  Tags: ['id', 'slug', 'name', 'color'],
  Rates: ['currency', 'rate_to_base', 'symbol', 'updated_at'],
  AuditLog: [
    'timestamp',
    'actor',
    'action',
    'target_tab',
    'target_id',
    'before',
    'after',
    'ip_hash',
    'request_id',
    'note',
  ],
  Settings: ['key', 'value', 'updated_at', 'updated_by'],
};

/** Settings rows seeded by scripts/init-sheet.ts when the tab has no data rows. */
export const SETTINGS_SEED: ReadonlyArray<readonly [string, string]> = [
  ['retail_markup', ''],
  ['retail_markup.ecarpetgallery', ''],
  ['retail_markup.karavanrug', ''],
  ['price_round_step', '5'],
];

/** How many newest Reactions rows are read to rebuild the customer→product state map (brief §3). */
export const REACTIONS_WINDOW_ROWS = 5000;

/** One batchGet per refresh; order matters (parsed positionally by parseSnapshot). */
export const READ_RANGES = [
  `${TABS.products}!A1:${PRODUCT_LAST_COL}`,
  `${TABS.collections}!A1:G`,
  `${TABS.tags}!A1:D`,
  `${TABS.rates}!A1:D`,
  `${TABS.reactions}!A1:F${REACTIONS_WINDOW_ROWS + 1}`,
  `${TABS.customers}!A1:F`,
] as const;

/** Reference ORDER list; used only when the Collections tab is empty (ADR D10.5). */
export const REFERENCE_COLLECTION_ORDER = [
  'Classics',
  'Gabbeh',
  'Modern',
  'Kilims',
  'Tulu',
  'Wabi Sabi',
  'Signed',
  'More',
] as const;

/**
 * Seed values for the Rates tab. `rate_to_base` is "how many units of this currency per 1 base unit"
 * and doubles as the hardcoded fallback table when the FX API is unreachable (brief §8).
 */
export const RATES_SEED: ReadonlyArray<readonly [string, number, string]> = [
  ['USD', 1, '$'],
  ['EUR', 0.92, '€'],
  ['GBP', 0.79, '£'],
  ['CAD', 1.37, '$'],
  ['MXN', 17.5, '$'],
  ['AED', 3.67, 'AED '],
  ['SAR', 3.75, 'SAR '],
];

/* ---------- legacy (pre-brief) tab names and headers ----------
 *
 * The brief replaced Rugs → Products, Votes → Reactions and Clients → Customers. `sheet:init` adds
 * the new tabs beside the old ones on an existing spreadsheet and re-seeds Products from
 * `reference/live_catalogue.2026-09-05.json`, so there is no migration script: the legacy tabs are
 * left in place, unread, for the owner to inspect and delete when they are satisfied. These names
 * are kept so a stale tab is recognised rather than mistaken for corruption.
 */

export const LEGACY_TABS = {
  rugs: 'Rugs',
  votes: 'Votes',
  votesArchive: 'VotesArchive',
  clients: 'Clients',
} as const;

export const LEGACY_RUGS_HEADERS = [
  'id',
  'slug',
  'name',
  'description',
  'collection',
  'tags',
  'photos',
  'width_cm',
  'length_cm',
  'material',
  'age',
  'origin',
  'price_usd',
  'rotate',
  'featured',
  'status',
  'likes',
  'dislikes',
  'rating',
  'created_at',
  'updated_at',
  'method',
  'source_url',
  'supplier',
  'supplier_ref',
  'notes',
] as const;

/**
 * The pre-brief Collections header. The brief reordered it (name before slug) and added
 * `created_at`, so an existing spreadsheet keeps the old shape until `sheet:init` upgrades it.
 */
export const LEGACY_COLLECTIONS_HEADERS = [
  'id',
  'slug',
  'name',
  'description',
  'cover_image_url',
  'sort_order',
] as const;

export const LEGACY_VOTES_HEADERS = [
  'timestamp',
  'rug_id',
  'vote',
  'client',
  'visitor_hash',
  'user_agent',
  'action',
] as const;
