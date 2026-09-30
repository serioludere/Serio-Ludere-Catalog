// The studio's own storefront behind Shopify's password page (owner, 2026-09-29: "SL photos don't
// show when our website is behind a password").
//
// Confirmed that day: with the password on, every serioludere.com product URL — the page and both
// JSON endpoints — answers 401, so a fetch stopped before it read a single field or photo. The photos
// themselves are on cdn.shopify.com and were never locked; only the product page that lists them is.
//
// So when the store answers 401 and the site has the store's password (SERIOLUDERE_STORE_PASSWORD),
// the scraper signs in the way a visitor does and the way Shopify's own CLI does for `theme dev`:
// POST /password with `form_type=storefront_password`. A right password is answered with a redirect
// into the shop and a `storefront_digest` cookie; that cookie then goes on the scrape's requests.
// A wrong one is answered with a redirect back to /password and no cookie.
//
// The cookie is kept per shop for an hour so a morning of imports signs in once, and dropped the
// moment the shop answers 401 through it (the password was changed).
import { silentLogger } from '../sheets/errors.ts';
import { defaultTransport, toScrapeError, type FetchTextOptions } from './fetch.ts';
import { SUPPLIER_HOSTS, validateOutboundUrl } from './guard.ts';

export const STOREFRONT_COOKIE = 'storefront_digest';
const SESSION_TTL_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;

const sessions = new Map<string, { cookie: string; at: number }>();

/** Test hook. */
export function resetStorefrontSessionsForTests(): void {
  sessions.clear();
}

/** A remembered, still-fresh sign-in for this shop, as a `Cookie` header value. */
export function storefrontSession(sourceUrl: string, now: number = Date.now()): string | undefined {
  const origin = new URL(sourceUrl).origin;
  const hit = sessions.get(origin);
  if (hit && now - hit.at < SESSION_TTL_MS) return hit.cookie;
  sessions.delete(origin);
  return undefined;
}

/** Forgets a sign-in the shop no longer honours. */
export function dropStorefrontSession(sourceUrl: string): void {
  sessions.delete(new URL(sourceUrl).origin);
}

/**
 * Signs in to a password-protected Shopify storefront. Returns the `Cookie` header value that opens
 * it, or undefined when the password was refused or the shop answered anything unexpected. Never
 * throws for a refusal; a network failure surfaces as the scraper's own error.
 */
export async function unlockStorefront(
  sourceUrl: string,
  password: string,
  opts: Omit<FetchTextOptions, 'kind'> = {},
  now: number = Date.now(),
): Promise<string | undefined> {
  const logger = opts.logger ?? silentLogger;
  const origin = new URL(sourceUrl).origin;
  const url = validateOutboundUrl(
    `${origin}/password`,
    opts.allowHosts ?? SUPPLIER_HOSTS,
    'storefront password URL',
  ).toString();
  if (opts.throttle) await opts.throttle.take(new URL(url).hostname, opts.signal);
  const timer = AbortSignal.timeout(opts.requestTimeoutMs ?? REQUEST_TIMEOUT_MS);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timer]) : timer;
  let res;
  try {
    res = await (opts.transport ?? defaultTransport)(url, {
      method: 'POST',
      body: new URLSearchParams({ form_type: 'storefront_password', utf8: '✓', password }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal,
      client: 'impit',
      logger,
    });
  } catch (e) {
    throw toScrapeError(e, url);
  }
  res.abort?.();
  const digest = new RegExp(`${STOREFRONT_COOKIE}=([^;,\\s]+)`).exec(
    res.headers.get('set-cookie') ?? '',
  )?.[1];
  const location = res.headers.get('location') ?? '';
  // Right password: a redirect into the shop, with the cookie. Anything else is a refusal.
  if (res.status < 300 || res.status >= 400 || !digest || /\/password(?:[/?#]|$)/.test(location)) {
    logger.warn('storefront password refused', { host: new URL(origin).hostname, status: res.status });
    return undefined;
  }
  const cookie = `${STOREFRONT_COOKIE}=${digest}`;
  sessions.set(origin, { cookie, at: now });
  logger.info('signed in to the password-protected storefront', { host: new URL(origin).hostname });
  return cookie;
}
