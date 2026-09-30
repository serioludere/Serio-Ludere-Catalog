// serioludere.com — the studio's own Shopify storefront (owner, 2026-09-23: "train our scraper on our
// store … so it pulls every piece of data possible without failing"). Pure: takes the page HTML and
// the description text, returns what they say.
//
// The theme prints each product's facts OUTSIDE the description, from the product's metafields, in
// two places:
//   - a "Specifications" accordion of `Label: value` lines — Accent color, Color, Method, Pile, Age,
//     Origin, Material, Size, Dimensions, Shape — each present only when the metafield is filled;
//   - three short blocks beside the price (`data-block-id="spec_size|spec_method|spec_material"`),
//     which print their label even when the value is empty ("Method:", "Size: x").
// Neither the `.js` nor the `.json` payload carries metafields, so the page is the only place they
// are. They are the studio's own structured facts and win over anything read out of prose.
//
// The description is the fallback, for a page that could not be read. On most of the store it is
// ECG's copy ("Handmade in Nepal…", "constructed from 60% Wool & 40% Silk with 100% Cotton
// foundation", "Medium pile height…"); 23 of the 133 products (2026-09-23) have none at all. What is
// read from it is phrasing, not a labelled fact, so the caller marks it `inferred`.
import { collapse, htmlToText, loadHtml, splitList } from './generic.ts';
import { parseSize } from './size.ts';

/** What the form shows when the studio's store lists a rug at 0.00 — its "not priced yet". */
export const NO_STORE_PRICE = 'the store shows no price for this rug (0.00) — enter the retail price by hand';

/** The studio's store is priced in US dollars; every other currency it shows is a conversion. */
export const STORE_CURRENCY = 'USD';

/**
 * The US market, asked for on every request to the studio's store (owner, 2026-09-30: "it always says
 * the price was given in EUR then it gets converted to USD … the store's default currency is USD").
 *
 * The store sells in USD, EUR, GBP, CAD, MXN, AED and SAR (Shopify Markets; the country selector on
 * every page lists them), and Shopify picks the market from the visitor's IP address. The site's
 * server is not in the US, so Shopify showed it a European market: the `.js` payload's price was
 * already converted into euros, the page's JSON-LD said EUR, and the scraper then converted that
 * back with the Rates tab — two conversions away from the store's own figure.
 *
 * These are the cookies Shopify itself sets when a visitor picks "United States (USD $)" in that
 * selector, so the server is answered as a US visitor is, in the store's own prices.
 */
export const STORE_MARKET_COOKIE = `localization=US; cart_currency=${STORE_CURRENCY}`;

/**
 * `Shopify.currency = {"active":"EUR","rate":"0.9246"}`, which every Shopify theme prints: the
 * currency the page is priced in, and the rate Shopify converted the store's own prices with.
 * Undefined when the page does not say.
 */
export function storefrontCurrency(html: string | undefined): { active: string; rate: number } | undefined {
  const m = /Shopify\.currency\s*=\s*(\{[^}]*\})/.exec(html ?? '');
  if (!m?.[1]) return undefined;
  try {
    const parsed = JSON.parse(m[1]) as { active?: unknown; rate?: unknown };
    const active = typeof parsed.active === 'string' ? parsed.active.trim().toUpperCase() : '';
    const rate = Number(parsed.rate);
    return /^[A-Z]{3}$/.test(active) && Number.isFinite(rate) && rate > 0 ? { active, rate } : undefined;
  } catch {
    return undefined;
  }
}

export interface StorefrontSpecs {
  /** The measurement: `Dimensions`, else a `Size` line that parses as one ("170 cm x 259 cm"). */
  dimensions?: string;
  /** `Size` when it is the band rather than a measurement ("Medium", "Extra Small"). */
  sizeBand?: string;
  material?: string;
  method?: string;
  age?: string;
  origin?: string;
  pile?: string;
  shape?: string;
  /** `Color` then `Accent color`, split into single colours. */
  colors: string[];
  styles: string[];
}

/** One `Label: value` line; the label is a few words, the value may be empty ("Method:"). */
const LABEL_RE = /^([A-Za-z][A-Za-z ]{0,30}?)\s*:\s*(.*)$/;

/** A value that only looks like one: the empty spec block prints "Size: x" and "Method:". */
function blank(value: string): boolean {
  return /^[\sx×\-–—.]*$/i.test(value);
}

type Key = Exclude<keyof StorefrontSpecs, 'colors' | 'styles' | 'dimensions' | 'sizeBand'>;
const KEYS: Readonly<Record<string, Key | 'size' | 'dimensions' | 'color' | 'style'>> = {
  dimensions: 'dimensions',
  size: 'size',
  material: 'material',
  materials: 'material',
  method: 'method',
  technique: 'method',
  construction: 'method',
  age: 'age',
  origin: 'origin',
  'country of origin': 'origin',
  pile: 'pile',
  'pile height': 'pile',
  shape: 'shape',
  color: 'color',
  colour: 'color',
  colors: 'color',
  colours: 'color',
  'accent color': 'color',
  'accent colors': 'color',
  'accent colour': 'color',
  'accent colours': 'color',
  style: 'style',
  styles: 'style',
};

/**
 * The theme's own facts, accordion first (it is the full list, and its lists are comma-separated:
 * "Wool, Silk" where the short block says "Wool and Silk"), then the short blocks for anything the
 * accordion left out. Empty when the page has neither — another theme, or a product with no
 * metafields filled.
 */
export function storefrontSpecs(html: string | undefined): StorefrontSpecs {
  const out: StorefrontSpecs = { colors: [], styles: [] };
  if (!html) return out;
  const $ = loadHtml(html);
  const lines: string[] = [];
  $('details').each((_, el) => {
    const details = $(el);
    if (!/^specifications?$/i.test(collapse(details.find('summary').first().text()))) return;
    const body = details.clone();
    body.find('summary').remove();
    lines.push(...htmlToText(body.html() ?? '').split('\n'));
  });
  $('[data-block-id^="spec_"]').each((_, el) => {
    lines.push(...htmlToText($(el).html() ?? '').split('\n'));
  });

  for (const line of lines) {
    const m = LABEL_RE.exec(collapse(line));
    const key = m?.[1] ? KEYS[m[1].trim().toLowerCase()] : undefined;
    const value = collapse(m?.[2] ?? '');
    if (!key || blank(value)) continue;
    switch (key) {
      case 'size':
        // "Size" is the band in the accordion and the measurement in the short block.
        if (parseSize(value)) out.dimensions ??= value;
        else out.sizeBand ??= value;
        break;
      case 'dimensions':
        if (parseSize(value)) out.dimensions ??= value;
        break;
      case 'color':
        out.colors.push(...splitList(value));
        break;
      case 'style':
        out.styles.push(...splitList(value));
        break;
      default:
        out[key] ??= value;
    }
  }
  return out;
}

export interface ProseFacts {
  material?: string;
  age?: string;
  origin?: string;
  pile?: string;
  colors: string[];
  styles: string[];
}

function titleCase(s: string): string {
  return collapse(s).replace(/(^|[\s-])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/**
 * What ECG's copy says in so many words, for a page whose blocks could not be read. Each pattern is
 * a sentence the store's descriptions actually use; anything else is left blank rather than guessed.
 */
export function proseFacts(text: string | undefined): ProseFacts {
  const out: ProseFacts = { colors: [], styles: [] };
  if (!text) return out;

  // "Handmade in Nepal, these rugs…", "Imported from Nepal and crafted…", "hand-knotted in India". The
  // verb is matched in any case; the place must be capitalised, so "made in the 1960s" names nothing.
  const origins =
    /\b(?:hand-?made|hand[- ]?knotted|hand[- ]?woven|woven|knotted|made|imported|crafted)\s+(?:in|from)\s+([a-z]+(?:\s[a-z]+)?)/gi;
  for (const m of text.matchAll(origins)) {
    // "Nepal and" → "Nepal": only the capitalised words that lead the phrase are the place.
    const lead: string[] = [];
    for (const w of m[1]?.split(/\s+/) ?? []) {
      if (!/^[A-Z][a-z]+$/.test(w)) break;
      lead.push(w);
    }
    if (lead.length) {
      out.origin = lead.join(' ');
      break;
    }
  }

  // "constructed from 60% Wool & 40% Silk with 100% Cotton foundation" — the pile, not the foundation.
  const built =
    /\bconstructed from\s+(.+?)(?:\s+with\s+[^\n.]*?foundation\b|\s*[.;\n]|$)/i.exec(text) ??
    /\b(?:hand[- ]?knotted|hand[- ]?woven|handwoven|woven)(?:\s+flat\s*weave)?\s+from\s+(\d{1,3}%\s*[a-z][a-z ]*?)(?=\s+(?:for|with|on)\b|\s*[.;,\n]|$)/i.exec(
      text,
    );
  if (built?.[1]) out.material = collapse(built[1].replace(/\s*&\s*/g, ', '));

  // "40–50 years old", "50 Years Old", then the words the copy uses for the rest.
  const years = /\b(\d{1,3}(?:\s*[-–]\s*\d{1,3})?)\s+years?\s+old\b/i.exec(text);
  if (years?.[1]) out.age = `${years[1].replace(/\s*[-–]\s*/, '–')} years old`;
  else if (/\bantique\b/i.test(text)) out.age = 'Antique';
  else if (/\bvintage\b/i.test(text)) out.age = 'Vintage';
  else if (/\bnewly woven\b|\bnew production\b/i.test(text)) out.age = 'New';

  // "Medium pile height offers…", "Thick pile", "Flat pile is ideal…" — the store files flat as No Pile.
  const pile = /\b(no|flat|low|short|medium|high|thick|long|plush)\s+pile\b/i.exec(text);
  if (pile?.[1]) out.pile = pile[1].toLowerCase() === 'flat' ? 'No Pile' : `${titleCase(pile[1])} Pile`;

  // "Casual, Transitional style rug with Beige, Dark Brown accent colors".
  const styled = /^(.+?)\s+style rug with\s+(.+?)\s+accent colou?rs?\b/im.exec(text);
  if (styled?.[1]) out.styles.push(...splitList(styled[1]));
  if (styled?.[2]) out.colors.push(...splitList(styled[2]));
  // "Ivory base with prominent black, cream, and dark red accents".
  const base = /^([A-Za-z]+(?:\s[A-Za-z]+)?)\s+base with\b/im.exec(text);
  if (base?.[1]) out.colors.unshift(titleCase(base[1]));
  return out;
}
