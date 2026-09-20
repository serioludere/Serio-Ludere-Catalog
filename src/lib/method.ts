// How a rug was made (owner, 2026-09-20): four named techniques, chosen with checkboxes on the
// product form rather than typed into a free-text box.
//
// The sheet column stays ONE text cell (`Method`, contract.ts): the catalogue, the spec panel and
// the Shopify export all read a string, and swapping a column's type to please a control would be
// the tail wagging the dog. So the form joins what is ticked with ", " and splits it again to fill
// itself — which is also why a rug may carry more than one: a piece can honestly be both flatweave
// and hand-loomed, and the studio was already typing pairs into the old field.
//
// Nothing here throws away what it does not recognise. A scraped "Handmade pile rug", or anything a
// previous row already carries, survives as an extra option on the form and as itself in the cell —
// the four names are a shortcut for what the studio types most, not a closed vocabulary.

/** The four the studio picks from, in the order the form lists them. */
export const METHOD_OPTIONS: readonly string[] = ['Flatweave', 'Hand-loomed', 'Hand-knotted', 'Handwoven'];

/** "hand woven", "Hand-Woven" and "handwoven" are one technique spelled three ways. */
function methodKey(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

const CANONICAL = new Map(METHOD_OPTIONS.map((m) => [methodKey(m), m]));

/**
 * The techniques in a `Method` cell, canonically spelled where they are one of the four.
 *
 * Splits on "," and "|" — the cell has been written by hand, by the scraper and by two earlier
 * versions of this form — trims, drops blanks, and de-duplicates on the same key the canonical
 * spelling uses, so "Hand-woven, handwoven" is one technique, not two.
 */
export function splitMethods(cell: string | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of (cell ?? '').split(/[,|]/)) {
    const value = raw.trim();
    if (!value) continue;
    const key = methodKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(CANONICAL.get(key) ?? value);
  }
  return out;
}

/** What goes into the cell: the ticked techniques, in the order the form lists them. */
export function joinMethods(methods: readonly string[]): string {
  return splitMethods(methods.join(',')).join(', ');
}

/** The techniques a cell carries that are NOT one of the four — the form keeps them tickable. */
export function otherMethods(cell: string | undefined): string[] {
  return splitMethods(cell).filter((m) => !CANONICAL.has(methodKey(m)));
}
