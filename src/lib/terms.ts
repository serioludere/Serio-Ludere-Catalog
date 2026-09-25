// What a rug is made of and how it was made (owner, 2026-09-21): two closed lists, chosen from a
// dropdown on the product form instead of typed.
//
// The sheet columns stay ONE text cell each (`Material`, `Method`): the catalogue, the spec panel
// and the Shopify export all read a string, and changing a column's type to please a control would
// be the tail wagging the dog. So the form joins what is ticked with ", " and splits it again to
// fill itself — which is also why a rug may carry more than one of each. A piece can honestly be
// wool AND silk, and the studio was already typing pairs into the old free-text fields.
//
// Nothing here throws away what it does not recognise. A value a row already carries that is not on
// the list — "Vegetable Dye" from before 2026-09-25, "Tufted" typed by hand — survives as an extra,
// already-ticked option on the form and as itself in the cell. The lists are a shortcut for what the
// studio picks most, not a cage.

/** What the rug is made of. */
export const MATERIAL_OPTIONS: readonly string[] = ['Wool', 'Viscose', 'Silk', 'Cotton', 'Bamboo'];

/**
 * How it was made. Hand-Loomed is its own choice again and Vegetable Dye is gone (owner, 2026-09-25).
 * A row that already says "Vegetable Dye" keeps it: the form shows it as an extra, ticked option.
 */
export const METHOD_OPTIONS: readonly string[] = [
  'Hand-Knotted',
  'Flatweave',
  'Hand-Woven',
  'Hand-Loomed',
  'Hand-Embroidered',
  'Jacquard Loom',
  'Aghabani - Natural Dye',
];

/**
 * The supplier's words for each option, so a scrape can be read into the list (owner: "they should
 * be recognized from the scrape and prefilled based on the page data").
 *
 * Deliberately short. Every entry is either a spelling of the option itself ("hand knotted",
 * "handknotted") or a phrase the two suppliers actually print ("Handmade pile rug" for a knotted
 * pile, "Kilim" for a flatweave). Guessing beyond that — "silky sheen" for Silk, "soft" for Wool —
 * would fill the form with things the page never said, and the studio would have to audit every
 * field instead of glancing at it. What is not recognised is simply left for them to choose.
 */
const ALIASES: Readonly<Record<string, readonly string[]>> = {
  Wool: ['wool', 'woollen', 'woolen'],
  // "Viscos" is how the owner wrote it and how half the supplier pages spell it; the label is the
  // dictionary spelling, and both forms are recognised.
  Viscose: ['viscose', 'viscos', 'rayon'],
  Silk: ['silk'],
  Cotton: ['cotton'],
  Bamboo: ['bamboo'],
  'Hand-Knotted': ['hand knotted', 'handknotted', 'knotted', 'handmade pile rug', 'pile rug'],
  Flatweave: ['flatweave', 'flat weave', 'flat woven', 'flatwoven', 'kilim', 'dhurrie', 'soumak'],
  'Hand-Woven': ['hand woven', 'handwoven'],
  // Its own option since 2026-09-25; these four spellings used to be read as Hand-Woven.
  'Hand-Loomed': ['hand loomed', 'handloomed', 'handloom', 'hand loom'],
  'Hand-Embroidered': ['hand embroidered', 'handembroidered', 'embroidered', 'embroidery', 'suzani'],
  'Jacquard Loom': ['jacquard loom', 'jacquard'],
  'Aghabani - Natural Dye': ['aghabani', 'agabani'],
};

/** Lower case, every run of punctuation or space a single space, padded so a match has boundaries. */
function normalise(value: string): string {
  return ` ${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

/** "hand-knotted", "Hand Knotted" and "HANDKNOTTED" are one value spelled three ways. */
function termKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function canonicalOf(options: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const option of options) {
    out.set(termKey(option), option);
    for (const alias of ALIASES[option] ?? []) out.set(termKey(alias), option);
  }
  return out;
}

/**
 * The values in a stored cell, canonically spelled where they are on the list.
 *
 * Splits on "," and "|" — the cell has been written by hand, by the scraper and by three earlier
 * versions of this form — trims, drops blanks, and de-duplicates on the same key the canonical
 * spelling uses, so "Hand-knotted, handknotted" is one value, not two.
 */
export function splitTerms(cell: string | undefined, options: readonly string[] = []): string[] {
  const canonical = canonicalOf(options);
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (term: string): void => {
    const id = termKey(term);
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(term);
  };
  for (const raw of (cell ?? '').split(/[,|]/)) {
    const value = raw.trim();
    if (!value) continue;
    const exact = canonical.get(termKey(value));
    if (exact) {
      add(exact);
      continue;
    }
    /* Not the list's spelling, so read it the way a scrape is read: "100% Wool" is Wool, "Wool and
       Silk" in one cell is both, "Handmade pile rug" is Hand-Knotted. Normalising these two columns
       is the whole point of closing the list — a cell nobody can recognise is the only thing worth
       keeping verbatim, and that is what falls through to the last line. */
    const matched = matchTerms(value, options);
    if (matched.length) matched.forEach(add);
    else add(value);
  }
  return out;
}

/** What goes into the cell: the chosen values, in the order they were given, de-duplicated. */
export function joinTerms(terms: readonly string[], options: readonly string[] = []): string {
  return splitTerms(terms.join(','), options).join(', ');
}

/** The values a cell carries that are NOT on the list — the form offers them as ticked extras. */
export function extraTerms(cell: string | undefined, options: readonly string[]): string[] {
  const known = new Set(options.map(termKey));
  return splitTerms(cell, options).filter((t) => !known.has(termKey(t)));
}

/**
 * The options a piece of supplier text mentions, in list order.
 *
 * Longest alias first, and every match is consumed from the text before the shorter ones are tried,
 * so overlapping names resolve the same way every time: "handmade pile rug" is read once rather
 * than again as "pile rug", and "bamboo silk" does not quietly become Silk alone.
 */
export function matchTerms(text: string | undefined, options: readonly string[]): string[] {
  if (!text?.trim()) return [];
  let haystack = normalise(text);
  const pairs: Array<{ option: string; alias: string }> = [];
  for (const option of options) {
    for (const alias of [option, ...(ALIASES[option] ?? [])]) pairs.push({ option, alias });
  }
  pairs.sort((a, b) => b.alias.length - a.alias.length);
  const found = new Set<string>();
  for (const { option, alias } of pairs) {
    const needle = normalise(alias);
    if (needle === '  ') continue;
    // A page says "natural dyes" and "hand-knotted rugs" as readily as the singular, so the plural
    // of the last word counts as the same word. Nothing else is inflected: this is a word list, not
    // a stemmer, and "knot" must not match "knotting".
    const plural = needle.endsWith('s ') ? needle : `${needle.trimEnd()}s `;
    const hit = [needle, plural].find((n) => haystack.includes(n));
    if (!hit) continue;
    found.add(option);
    // Consume it, keeping the surrounding spaces so the neighbours still have their boundaries.
    haystack = haystack.split(hit).join('  ');
  }
  return options.filter((o) => found.has(o));
}

/**
 * What the form should tick for a scraped rug: what the supplier's own field says, and only when
 * that says nothing recognisable, what the title and description say.
 *
 * The narrower source first on purpose. `Material: 100% Wool` is a fact the supplier stated; a
 * description mentioning cotton might be describing the foundation, the fringe, or the rug in the
 * next photograph. Widening the search only when the answer would otherwise be blank keeps the
 * common case exact and still rescues the pages that put everything in one paragraph.
 */
export function termsFromScrape(
  field: string | undefined,
  options: readonly string[],
  ...fallbacks: Array<string | undefined>
): string[] {
  const direct = matchTerms(field, options);
  if (direct.length) return direct;
  // Anything the supplier's own field said that we do not recognise is kept as typed, so a scrape
  // is never quietly emptied — the studio can see it and choose.
  const asTyped = splitTerms(field, options);
  if (asTyped.length) return asTyped;
  return matchTerms(fallbacks.filter(Boolean).join(' . '), options);
}
