// The link-preview card a chat app builds when a buyer pastes their preview link (owner, 2026-09-21).
//
// The card is read by everyone in the thread the link was pasted into, and a forwarded link takes it
// along. So the interesting assertions here are not "the copy is right" — they are the negatives:
// the buyer's slug, the buyer's name and any rug must never reach a meta tag, on ANY page of the
// realm, including the signed-in detail page whose <title> legitimately carries a rug name.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PreviewLayout from '../../src/components/customer/PreviewLayout.astro';
import type { RateTable } from '../../src/lib/currency.ts';
import { SHARE_DESCRIPTION, SHARE_SITE_NAME, SHARE_TITLE } from '../../src/lib/customer/share.ts';

const rates: RateTable = {
  rates: { USD: 1, MXN: 17.5, CAD: 1.37, EUR: 0.92, AED: 3.67, SAR: 3.75 },
  symbols: { USD: '$', MXN: '$', CAD: '$', EUR: '€', AED: 'AED ', SAR: 'SAR ' },
};

/** Every `<meta>` in the rendered head, as [identifier, content]. */
function metas(html: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const tag of html.match(/<meta\b[^>]*>/g) ?? []) {
    const key = /(?:name|property)="([^"]*)"/.exec(tag)?.[1];
    const content = /content="([^"]*)"/.exec(tag)?.[1];
    if (key && content !== undefined) out.push([key, content]);
  }
  return out;
}

function render(props: Record<string, unknown>): Promise<string> {
  return AstroContainer.create().then((c) => c.renderToString(PreviewLayout, { props }));
}

describe('the card a chat app shows', () => {
  it('carries the owner’s copy on Open Graph and Twitter', async () => {
    const found = new Map(metas(await render({ title: 'Serio Ludere', rates })));
    expect(found.get('og:title')).toBe(SHARE_TITLE);
    expect(found.get('og:description')).toBe(SHARE_DESCRIPTION);
    expect(found.get('og:site_name')).toBe(SHARE_SITE_NAME);
    expect(found.get('og:type')).toBe('website');
    // Some apps read only the plain description; others only the Twitter pair.
    expect(found.get('description')).toBe(SHARE_DESCRIPTION);
    expect(found.get('twitter:card')).toBe('summary');
    expect(found.get('twitter:title')).toBe(SHARE_TITLE);
    expect(found.get('twitter:description')).toBe(SHARE_DESCRIPTION);
  });

  it('asks for no image, so no photo can be pulled into a group chat', async () => {
    const keys = metas(await render({ title: 'Serio Ludere', rates })).map(([k]) => k);
    expect(keys).not.toContain('og:image');
    expect(keys).not.toContain('twitter:image');
  });

  it('never names the buyer, even signed in on a rug’s page', async () => {
    // The worst case: the detail page's own <title> is the rug, and the shell knows the slug.
    const html = await render({
      title: 'Winks — Serio Ludere',
      rates,
      customer: 'quiet-harbour-41',
    });
    const card = metas(html)
      .map(([, content]) => content)
      .join(' ');
    expect(card).not.toContain('quiet-harbour-41');
    expect(card).not.toContain('Winks');
  });

  it('still refuses indexing — the card is for chat apps, not for search', async () => {
    const found = new Map(metas(await render({ title: 'Serio Ludere', rates })));
    expect(found.get('robots')).toBe('noindex, nofollow');
  });
});
