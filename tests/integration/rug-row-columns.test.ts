// The admin products table's owner-added columns: whether the product is on the Shopify store, as a
// dropdown saved from the row (2026-09-25), and the scraped product page it came from, opened in a new
// tab — a column of its own from 2026-09-25, the ID itself since 2026-09-29, when the one Open/Edit
// link replaced the Open + Edit pair.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import RugRow from '../../src/components/admin/RugRow.astro';
import RugTable from '../../src/components/admin/RugTable.astro';
import type { AdminRug } from '../../src/lib/admin/read.ts';

const base = {
  id: 'SL-024',
  row: 2,
  version: 'a1b2c3d4e5f60718',
  slug: 'winks',
  name: 'Winks',
  description: '',
  collections: ['Kilims'],
  collection: 'Kilims',
  tags: [],
  photos: [],
  widthCm: 135,
  lengthCm: 190,
  priceUsd: 576,
  sourceUrl: 'https://www.karavanrug.com/products/winks',
  supplier: 'karavanrug',
  supplierRef: '1389',
  notes: '',
  commitStatus: '',
  shopify: '',
} as unknown as AdminRug;

const collections = [{ id: 'kilims', name: 'Kilims', slug: 'kilims' }] as never;

async function row(rug: Partial<AdminRug>): Promise<string> {
  const c = await AstroContainer.create();
  return c.renderToString(RugRow, { props: { rug: { ...base, ...rug } as AdminRug, collections } });
}

describe('the Shopify column', () => {
  it('offers blank, Yes, No and TA, with the row’s own answer selected', async () => {
    const html = await row({ shopify: 'TA' });
    const select = html.slice(html.indexOf('<select data-shopify="SL-024"'), html.indexOf('</select>'));
    expect([...select.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1])).toEqual([
      '',
      'Yes',
      'No',
      'TA',
    ]);
    expect(select).toMatch(/<option value="TA" selected>/);
    expect(select).not.toMatch(/<option value="" selected>/);
  });

  it('shows a dash, selected, until anyone has answered', async () => {
    const html = await row({ shopify: '' });
    expect(html).toMatch(/<option value="" selected>—<\/option>/);
  });

  it('is named by the product id, never by its title (which is sheet text)', async () => {
    const html = await row({ name: 'Yellow <b>x</b>' });
    expect(html).toContain('aria-label="Shopify, product SL-024"');
    expect(html).not.toContain('<b>x</b>');
  });
});

describe('the ID links the source page (owner, 2026-09-29: the Source column it replaced)', () => {
  const idCell = (html: string): string =>
    html.slice(html.indexOf('class="irow__id"'), html.indexOf('class="irow__title"'));

  it('opens the scraped page in a new tab from the ID, and names the site in the tooltip', async () => {
    const cell = idCell(await row({}));
    expect(cell).toContain(
      '<a href="https://www.karavanrug.com/products/winks" target="_blank" rel="noopener noreferrer"',
    );
    expect(cell).toContain('title="karavanrug.com: https://www.karavanrug.com/products/winks"');
    // The id is still the text that is read and copied.
    expect(cell).toMatch(/>\s*SL-024\s*<span class="sr-only">/);
    expect(cell).toContain('opens in a new tab');
  });

  it('leaves the ID plain text when the cell is not a web address', async () => {
    // The cell can be typed into by hand; a `javascript:` link in an admin page is a live wire.
    for (const sourceUrl of ['javascript:alert(1)', 'not a url', '']) {
      const cell = idCell(await row({ sourceUrl }));
      expect(cell, sourceUrl).not.toContain('<a ');
      expect(cell, sourceUrl).toContain('SL-024');
    }
  });

  it('draws no Source column any more', async () => {
    const html = await row({});
    expect(html).not.toContain('irow__source');
    expect(html).not.toContain(' ↗');
  });
});

describe('the row actions (owner, 2026-09-29)', () => {
  it('offers one Open/Edit link to the rug page, and no separate Edit button', async () => {
    const html = await row({});
    const action = html.slice(html.indexOf('class="irow__action"'), html.indexOf('class="irow__message"'));
    expect(action).toContain('<a href="/admin/rugs/SL-024">Open/Edit</a>');
    expect(action).not.toContain('data-edit');
    expect(action).not.toMatch(/>\s*Edit\s*</);
  });

  it('keeps the name as the click-to-rename cell, and says so', async () => {
    const html = await row({});
    expect(html).toContain(
      '<span class="irow__title" role="cell" data-cell="name" title="Click to rename">Winks</span>',
    );
  });
});

describe('the table head', () => {
  it('names Shopify after Likes, then the actions — and no Source column', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(RugTable, { props: { rugs: [base], collections } });
    const head = html.slice(html.indexOf('rugtable__head'), html.indexOf('class="irow"'));
    const names = [...head.matchAll(/role="columnheader">([^<]*)</g)].map((m) => m[1]);
    expect(names).toEqual(['ID', 'Title', 'Collection', 'Size', 'Price', 'Likes', 'Shopify', '']);
  });
});
