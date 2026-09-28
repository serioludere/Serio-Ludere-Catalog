// The full-height cover fit reaches the markup for Karavan rugs only (owner, 2026-09-28), on the
// buyer's card and on the admin's, rendered through Astro's container from the real components.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import RugCardAdmin from '../../src/components/admin/RugCardAdmin.astro';
import ProductCard from '../../src/components/customer/ProductCard.astro';
import type { AdminRug } from '../../src/lib/admin/read.ts';
import type { CardView } from '../../src/lib/view.ts';

const PHOTO = '1U8FwNPCdm-n8RUvSNRcJLBA_27u-Pjkb';

const rug = {
  id: 'SL-031',
  row: 2,
  version: 'a1b2c3d4e5f60718',
  slug: 'runner',
  name: 'Runner',
  description: '',
  collections: ['Kilims'],
  collection: 'Kilims',
  tags: [],
  photos: [PHOTO],
  widthCm: 82,
  lengthCm: 300,
  material: '',
  method: '',
  age: '',
  origin: '',
  priceUsd: 576,
  rotate: 'false',
  featured: false,
  status: 'active',
  sourceUrl: 'https://karavanrug.com/products/vintage-turkish-runner-rug',
  supplier: 'karavanrug',
  supplierRef: '1389',
  notes: '',
  commitStatus: '',
  driveFolderId: '',
  driveFolderUrl: '',
  scrapedAt: '',
} as unknown as AdminRug;

const collections = [{ id: 'kilims', name: 'Kilims', slug: 'kilims' }] as never;

const card: CardView = {
  id: 'SL-031',
  slug: 'runner',
  name: 'Runner',
  collection: 'Kilims',
  collectionSlug: 'kilims',
  collections: ['Kilims'],
  collectionSlugs: ['kilims'],
  photoUrl: `/api/image/${PHOTO}?w=800`,
  photoUrls: [],
  rot: '0',
  material: '',
  age: '',
  origin: '',
  method: '',
  pile: '',
  description: '',
  likes: 0,
  dislikes: 0,
  rating: 0,
  tags: [],
};

async function adminCard(over: Partial<AdminRug>): Promise<string> {
  const c = await AstroContainer.create();
  return c.renderToString(RugCardAdmin, { props: { rug: { ...rug, ...over }, collections } });
}

async function buyerCard(over: Partial<CardView>): Promise<string> {
  const c = await AstroContainer.create();
  return c.renderToString(ProductCard, {
    props: { card: { ...card, ...over }, rates: [], baseCurrency: 'USD', href: '/hala/SL-031' },
  });
}

describe('admin catalogue card', () => {
  it('fits a Karavan cover to the plate’s height', async () => {
    expect(await adminCard({})).toContain('data-fit="height"');
  });

  it('knows a Karavan rug by its link when Source Site is blank', async () => {
    expect(await adminCard({ supplier: '' })).toContain('data-fit="height"');
  });

  it('leaves the other vendors, owned stock and a rug with no photo as they were', async () => {
    for (const over of [
      { supplier: 'ecarpetgallery', sourceUrl: 'https://ecarpetgallery.com/us_en/rug-380114.html' },
      { supplier: 'serioludere', sourceUrl: 'https://serioludere.com/products/x' },
      { supplier: '', sourceUrl: '' },
      { photos: [] },
    ] as Array<Partial<AdminRug>>) {
      expect(await adminCard(over)).not.toContain('data-fit');
    }
  });
});

describe('buyer’s card', () => {
  it('fits the cover to the plate’s height when the card says so', async () => {
    const html = await buyerCard({ fillHeight: true });
    expect(html).toMatch(/class="pv-card-image"[^>]*data-fit="height"/);
  });

  it('is unchanged otherwise, and never names the supplier', async () => {
    const html = await buyerCard({});
    expect(html).not.toContain('data-fit');
    expect(await buyerCard({ fillHeight: true })).not.toMatch(/karavan/i);
  });
});
