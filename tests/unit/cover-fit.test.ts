// The full-height cover fit (owner, 2026-09-28: "the image height set to 100% of its parent without
// distortion ... only for KV products"): which rows get it, and that a buyer's card carries only the
// yes/no, never the supplier.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { coverFillsHeight, supplierOfRow } from '../../src/lib/cover-fit.ts';
import { FEATURES } from '../../src/lib/features.ts';
import { supplierForHost } from '../../src/lib/scrape/detect.ts';
import { snapshotFromRanges } from '../../src/lib/sheets/read.ts';
import { cardView } from '../../src/lib/view.ts';
import { rangesWith, rugRow } from '../helpers/ranges.ts';

const KV_URL = 'https://karavanrug.com/products/vintage-turkish-runner-rug-2-7x9-8-ft-82x300-cm';
const ECG_URL = 'https://ecarpetgallery.com/us_en/hand-knotted-rug-380114.html';

describe('supplierOfRow', () => {
  it('reads the Source Site cell first', () => {
    expect(supplierOfRow('karavanrug', '')).toBe('karavanrug');
    expect(supplierOfRow(' KaravanRug ', ECG_URL)).toBe('karavanrug');
    expect(supplierOfRow('ecarpetgallery', '')).toBe('ecarpetgallery');
    expect(supplierOfRow('serioludere', '')).toBe('serioludere');
  });

  it('falls back to the Source URL host when an older row left the cell blank', () => {
    expect(supplierOfRow('', KV_URL)).toBe('karavanrug');
    expect(supplierOfRow('', 'https://www.karavanrug.com/products/x')).toBe('karavanrug');
    expect(supplierOfRow('', ECG_URL)).toBe('ecarpetgallery');
    expect(supplierOfRow('', 'https://serioludere.com/products/x')).toBe('serioludere');
  });

  it('is undefined for owned stock, other hosts and junk', () => {
    expect(supplierOfRow('', '')).toBeUndefined();
    expect(supplierOfRow('', 'https://example.com/rug')).toBeUndefined();
    expect(supplierOfRow('', 'not a link')).toBeUndefined();
    expect(supplierOfRow(undefined, undefined)).toBeUndefined();
    expect(supplierOfRow('someone', '')).toBeUndefined();
  });

  it('agrees with the scraper on every supplier host', () => {
    for (const host of [
      'karavanrug.com',
      'www.karavanrug.com',
      'ecarpetgallery.com',
      'www.ecarpetgallery.com',
      'serioludere.com',
      'www.serioludere.com',
    ]) {
      expect(supplierOfRow('', `https://${host}/products/x`)).toBe(supplierForHost(host));
    }
  });
});

describe('coverFillsHeight', () => {
  it('follows the per-supplier switch: Karavan on, the rest off', () => {
    expect(FEATURES.coverFullHeight).toEqual({
      karavanrug: true,
      ecarpetgallery: false,
      serioludere: false,
    });
    expect(coverFillsHeight('karavanrug', '')).toBe(true);
    expect(coverFillsHeight('', KV_URL)).toBe(true);
    expect(coverFillsHeight('ecarpetgallery', ECG_URL)).toBe(false);
    expect(coverFillsHeight('serioludere', '')).toBe(false);
    expect(coverFillsHeight('', '')).toBe(false);
  });
});

describe('cardView', () => {
  const cardOf = (over: Record<string, string>) => {
    const snap = snapshotFromRanges(
      rangesWith({
        rugs: [rugRow({ photos: '1U8FwNPCdm-n8RUvSNRcJLBA_27u-Pjkb', ...over })],
        collections: [['kilims', 'Kilims', 'kilims', '', '', '', 1]],
      }),
    );
    return cardView(snap.catalogue.rugs[0]!, snap.catalogue);
  };

  it('marks a Karavan cover, by its Source Site or its link', () => {
    expect(cardOf({ supplier: 'karavanrug', source_url: KV_URL }).fillHeight).toBe(true);
    expect(cardOf({ supplier: '', source_url: KV_URL }).fillHeight).toBe(true);
  });

  it('leaves every other cover as it was', () => {
    expect(cardOf({ supplier: 'ecarpetgallery', source_url: ECG_URL }).fillHeight).toBeUndefined();
    expect(cardOf({ supplier: 'serioludere', source_url: '' }).fillHeight).toBeUndefined();
    expect(cardOf({ supplier: '', source_url: '' }).fillHeight).toBeUndefined();
  });

  it('carries the yes/no only, never the supplier or its link', () => {
    const json = JSON.stringify(cardOf({ supplier: 'karavanrug', source_url: KV_URL }));
    expect(json).not.toMatch(/karavan/i);
  });
});

/** The declarations of every rule whose selector is exactly `selector` (admin.css splits `.card .ph`). */
function rule(css: string, selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...css.matchAll(new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`, 'gm'))]
    .map((m) => m[1])
    .join('\n');
}

describe('the full-height rule, wherever a cover sits in a 2:3 plate', () => {
  const plates: Array<[string, string, string]> = [
    ['customer card', 'src/components/customer/ProductCard.astro', ".pv-card-image[data-fit='height']"],
    ['admin card and edit-form tile', 'src/styles/admin.css', ".card .ph[data-fit='height']"],
    ['client’s liked rugs', 'src/pages/admin/clients/[code].astro', ".gcard__image[data-fit='height']"],
  ];

  it.each(plates)('%s: full height, width from the photo, never stretched', (_, file, plate) => {
    const img = rule(fs.readFileSync(file, 'utf8'), `${plate} img`);
    expect(img).toMatch(/height:\s*100%/);
    expect(img).toMatch(/width:\s*auto/);
    // A global `max-width: 100%` would squeeze a wide photo back into the plate: distortion.
    expect(img).toMatch(/max-width:\s*none/);
    // A flex item may shrink below its size by default, which would squeeze it the same way.
    expect(img).toMatch(/flex:\s*none/);
  });

  it.each(plates)('%s: the photo is centred in a clipping 2:3 plate', (_, file, plate) => {
    const css = fs.readFileSync(file, 'utf8');
    const base = plate.replace("[data-fit='height']", '');
    expect(rule(css, base)).toMatch(/aspect-ratio:\s*2 \/ 3/);
    expect(rule(css, base)).toMatch(/overflow:\s*hidden/);
    // The admin plate is already a centring flex box; the other two become one only when fitted.
    const flex = /display:\s*flex/.test(rule(css, base)) ? rule(css, base) : rule(css, plate);
    expect(flex).toMatch(/display:\s*flex/);
    expect(flex).toMatch(/justify-content:\s*center/);
  });

  it('turned (the legacy rotate flag), the element’s width is what reads as the plate’s height', () => {
    const img = rule(fs.readFileSync('src/styles/admin.css', 'utf8'), ".card .ph[data-fit='height'] img.rot");
    expect(img).toMatch(/width:\s*150%/);
    expect(img).toMatch(/height:\s*auto/);
  });
});
