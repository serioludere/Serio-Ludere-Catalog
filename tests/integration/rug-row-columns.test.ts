// The two columns the owner added to the admin products table (2026-09-25): whether the product is
// on the Shopify store, as a dropdown saved from the row, and the scraped product page it came from,
// as a link that opens in a new tab.
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

describe('the Source column', () => {
  it('links the scraped page in a new tab, labelled with its site', async () => {
    const html = await row({});
    expect(html).toMatch(
      /<a href="https:\/\/www\.karavanrug\.com\/products\/winks" target="_blank" rel="noopener noreferrer"/,
    );
    // The site, without "www.", is the label; the whole address is the tooltip.
    expect(html).toMatch(/>\s*karavanrug\.com\s*<span aria-hidden="true"> ↗<\/span>/);
    expect(html).toContain('title="https://www.karavanrug.com/products/winks"');
    expect(html).toContain('(opens in a new tab)');
  });

  it('never turns a cell that is not a web address into a link', async () => {
    // The cell can be typed into by hand; a `javascript:` link in an admin page is a live wire.
    for (const sourceUrl of ['javascript:alert(1)', 'not a url', '']) {
      const html = await row({ sourceUrl });
      const cell = html.slice(html.indexOf('class="irow__source"'), html.indexOf('class="irow__spacer"'));
      expect(cell, sourceUrl).not.toContain('<a ');
      expect(cell, sourceUrl).toContain('—');
    }
  });
});

describe('the table head', () => {
  it('names both new columns, after Likes and before the actions', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(RugTable, { props: { rugs: [base], collections } });
    const head = html.slice(html.indexOf('rugtable__head'), html.indexOf('class="irow"'));
    const names = [...head.matchAll(/role="columnheader">([^<]*)</g)].map((m) => m[1]);
    expect(names).toEqual(['ID', 'Title', 'Collection', 'Size', 'Price', 'Likes', 'Shopify', 'Source', '']);
  });
});
