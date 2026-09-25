// Is this product on the Shopify store? (owner, 2026-09-25) One closed list, stored as the `Shopify`
// cell on the Products row, chosen on the add/edit form and straight from the admin products table.
//
// Blank is its own answer — "nobody has said yet" — and is what every existing product reads as.
// Dependency-free, because the admin's browser scripts import it as well as the server.

/** The three answers, in the order the dropdowns offer them. What "TA" stands for is the studio's. */
export const SHOPIFY_OPTIONS = ['Yes', 'No', 'TA'] as const;

export type ShopifyListing = (typeof SHOPIFY_OPTIONS)[number] | '';

/**
 * The cell as one of the answers. Case and surrounding space are forgiven ("yes", " TA "), because the
 * sheet is also edited by hand; anything else reads as blank rather than failing the row, so a typo in
 * one cell can never take a product off the catalogue.
 */
export function shopifyListingOf(cell: unknown): ShopifyListing {
  const key = String(cell ?? '')
    .trim()
    .toLowerCase();
  return SHOPIFY_OPTIONS.find((o) => o.toLowerCase() === key) ?? '';
}
