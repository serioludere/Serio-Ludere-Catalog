// Which products' covers fill the full height of their 2:3 plate (owner, 2026-09-28): the
// `coverFullHeight` switch in src/lib/features.ts, per supplier.
//
// Decided on the server, from the row's Source Site, or from the host of its Source URL when an older
// row left that cell blank. Only the yes/no ever reaches a page: a buyer's HTML says how to fit the
// photo, never which supplier the rug came from.
import { FEATURES } from './features.ts';
import type { Supplier } from './scrape/types.ts';

/**
 * The supplier hosts, without `www.`. scrape/detect.ts has the scraper's own table, but importing it
 * would pull the fetch guard (undici, node:dns) into every page render for one lookup.
 */
const SUPPLIER_HOSTS: Readonly<Record<string, Supplier>> = {
  'karavanrug.com': 'karavanrug',
  'ecarpetgallery.com': 'ecarpetgallery',
  'serioludere.com': 'serioludere',
};
const SUPPLIERS: ReadonlySet<string> = new Set(Object.values(SUPPLIER_HOSTS));

/** The shop a stored product came from: its Source Site when that names one, else its link's host. */
export function supplierOfRow(
  sourceSite: string | undefined,
  sourceUrl: string | undefined,
): Supplier | undefined {
  const named = (sourceSite ?? '').trim().toLowerCase();
  if (SUPPLIERS.has(named)) return named as Supplier;
  try {
    return SUPPLIER_HOSTS[new URL(sourceUrl ?? '').hostname.toLowerCase().replace(/^www\./, '')];
  } catch {
    return undefined;
  }
}

/** Whether this product's cover is shown at its plate's full height (features.ts `coverFullHeight`). */
export function coverFillsHeight(sourceSite: string | undefined, sourceUrl: string | undefined): boolean {
  const supplier = supplierOfRow(sourceSite, sourceUrl);
  return supplier !== undefined && FEATURES.coverFullHeight[supplier];
}
