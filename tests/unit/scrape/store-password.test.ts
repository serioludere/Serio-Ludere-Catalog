// The studio's own storefront behind Shopify's password page (owner, 2026-09-29: "SL photos don't
// show when our website is behind a password"). With the password on, serioludere.com answers 401 to
// every product URL; given the store password, the scraper signs in the way a visitor does and reads
// the rug anyway. A fake shop here behaves as Shopify does: 401 without the `storefront_digest`
// cookie, POST /password → 302 into the shop with the cookie for the right password, 302 back to
// /password for a wrong one.
import { beforeEach, describe, expect, it } from 'vitest';
import { ScrapeCache } from '../../../src/lib/scrape/cache.ts';
import { scrapeRug } from '../../../src/lib/scrape/index.ts';
import {
  resetStorefrontSessionsForTests,
  storefrontSession,
  unlockStorefront,
} from '../../../src/lib/scrape/store-password.ts';
import type { Transport, TransportResponse } from '../../../src/lib/scrape/types.ts';
import { KV_OUSHAK_HANDLE, fixture, guards } from '../../fixtures/scrape/index.ts';

const PASSWORD = 'open sesame';
const DIGEST = 'f00dfeed1234';
const slBase = `https://serioludere.com/products/${KV_OUSHAK_HANDLE}`;
const kvJs = fixture(`kv-${KV_OUSHAK_HANDLE}.js.json`);
const kvJson = fixture(`kv-${KV_OUSHAK_HANDLE}.json`);
const kvHtml = fixture(`kv-${KV_OUSHAK_HANDLE}.html`);

interface Call {
  url: string;
  method: string;
  cookie?: string;
  body?: string;
  client: string;
}

function answer(status: number, body = '', headers: Record<string, string> = {}): TransportResponse {
  return {
    status,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8', ...headers }),
    body: new Blob([body]).stream(),
    via: 'impit',
    abort: () => {},
  };
}

/** A locked Shopify shop at `origin` serving the Karavan fixture as its product. */
function lockedShop(calls: Call[], origin = 'https://serioludere.com'): Transport {
  const base = `${origin}/products/${KV_OUSHAK_HANDLE}`;
  return async (url, init) => {
    calls.push({
      url,
      method: init.method ?? 'GET',
      cookie: init.headers.Cookie,
      body: init.body,
      client: init.client,
    });
    if (url === `${origin}/password`) {
      const form = new URLSearchParams(init.body ?? '');
      if (
        init.method === 'POST' &&
        form.get('form_type') === 'storefront_password' &&
        form.get('password') === PASSWORD
      ) {
        return answer(302, '', {
          location: `${origin}/`,
          'set-cookie': `storefront_digest=${DIGEST}; path=/; HttpOnly; SameSite=Lax`,
        });
      }
      return answer(302, '', { location: `${origin}/password` });
    }
    if (init.headers.Cookie !== `storefront_digest=${DIGEST}`) return answer(401);
    if (url === `${base}.js`) return answer(200, kvJs, { 'content-type': 'text/javascript; charset=utf-8' });
    if (url === `${base}.json`) return answer(200, kvJson, { 'content-type': 'application/json' });
    if (url === base) return answer(200, kvHtml);
    throw new Error(`lockedShop: no route for ${url}`);
  };
}

beforeEach(() => resetStorefrontSessionsForTests());

describe('scrapeRug: the studio’s store behind its password', () => {
  it('signs in with the store password on a 401 and reads the rug, photos and all', async () => {
    const calls: Call[] = [];
    const r = await scrapeRug(slBase, {
      fetchImpl: lockedShop(calls),
      cache: new ScrapeCache(),
      storefrontPassword: PASSWORD,
      ...guards(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.supplier).toBe('serioludere');
    expect(r.data.photos.length).toBeGreaterThan(0);
    // 401 → sign in once → the same endpoint again, now with the cookie.
    expect(calls.slice(0, 3).map((c) => `${c.method} ${c.url}`)).toEqual([
      `GET ${slBase}.js`,
      'POST https://serioludere.com/password',
      `GET ${slBase}.js`,
    ]);
    const post = calls[1]!;
    expect(new URLSearchParams(post.body).get('form_type')).toBe('storefront_password');
    expect(new URLSearchParams(post.body).get('password')).toBe(PASSWORD);
    expect(post.client).toBe('impit');
    // Every request after the sign-in carries the cookie.
    expect(calls.slice(2).every((c) => c.cookie === `storefront_digest=${DIGEST}`)).toBe(true);
  });

  it('remembers the sign-in, so the next fetch goes straight in', async () => {
    const opts = { cache: new ScrapeCache(), storefrontPassword: PASSWORD, ...guards() };
    await scrapeRug(slBase, { ...opts, fetchImpl: lockedShop([]) });
    expect(storefrontSession(slBase)).toBe(`storefront_digest=${DIGEST}`);
    const calls: Call[] = [];
    const r = await scrapeRug(slBase, { ...opts, force: true, fetchImpl: lockedShop(calls) });
    expect(r.ok).toBe(true);
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
    expect(calls[0]?.cookie).toBe(`storefront_digest=${DIGEST}`);
  });

  it('says the password was refused, and tries it only once', async () => {
    const calls: Call[] = [];
    const r = await scrapeRug(slBase, {
      fetchImpl: lockedShop(calls),
      cache: new ScrapeCache(),
      storefrontPassword: 'not it',
      ...guards(),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toContain('serioludere.com is password-protected');
    expect(r.message).toContain('was refused');
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect(r.manual?.supplier).toBe('serioludere');
  });

  it('with no password configured, says what would open it and never posts', async () => {
    const calls: Call[] = [];
    const r = await scrapeRug(slBase, {
      fetchImpl: lockedShop(calls),
      cache: new ScrapeCache(),
      ...guards(),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toContain('SERIOLUDERE_STORE_PASSWORD');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('never sends the studio’s password to a supplier’s shop', async () => {
    const calls: Call[] = [];
    const kvBase = `https://karavanrug.com/products/${KV_OUSHAK_HANDLE}`;
    const r = await scrapeRug(kvBase, {
      fetchImpl: lockedShop(calls, 'https://karavanrug.com'),
      cache: new ScrapeCache(),
      storefrontPassword: PASSWORD,
      ...guards(),
    });
    expect(r.ok).toBe(false);
    expect(calls.some((c) => c.method === 'POST' || (c.body ?? '').includes(PASSWORD))).toBe(false);
  });
});

describe('unlockStorefront', () => {
  it('answers undefined, not a throw, when the shop is not behind a password at all', async () => {
    // An open shop sends /password straight on to the home page, with no digest cookie.
    const open: Transport = async () => answer(302, '', { location: 'https://serioludere.com/' });
    expect(await unlockStorefront(slBase, PASSWORD, { transport: open })).toBeUndefined();
    expect(storefrontSession(slBase)).toBeUndefined();
  });

  it('forgets a sign-in after an hour', async () => {
    const t0 = 1_000_000;
    await unlockStorefront(slBase, PASSWORD, { transport: lockedShop([]) }, t0);
    expect(storefrontSession(slBase, t0 + 59 * 60_000)).toBe(`storefront_digest=${DIGEST}`);
    expect(storefrontSession(slBase, t0 + 61 * 60_000)).toBeUndefined();
  });

  it('only ever posts to the shop’s own /password page', async () => {
    const calls: Call[] = [];
    await unlockStorefront(`${slBase}?variant=1#x`, PASSWORD, { transport: lockedShop(calls) });
    expect(calls.map((c) => c.url)).toEqual(['https://serioludere.com/password']);
  });
});
