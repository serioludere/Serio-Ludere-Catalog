// The site password (owner, 2026-09-15): "lock the home page link so nobody can access it, only
// using a password". The public catalogue — `/`, `/rugs/*`, `/tags/*` and `/api/catalogue` — opens
// only to a visitor who has entered the one shared password on /enter; the cookie that proves it is
// signed and expires. Pure: src/middleware.ts and src/pages/enter.astro wire it.
//
// It is a separate gate from the customer realm, which keeps its own per-buyer passwords, and from
// /admin, which keeps its own session. Turning it on is one variable: SITE_PASSWORD_HASH.
import { createHmac, timingSafeEqual } from 'node:crypto';

/** 30 days: long enough that a client who bookmarked the catalogue is not asked again every visit. */
export const SITE_SESSION_MS = 30 * 24 * 3600_000;
export const ENTER_PATH = '/enter';
const MAX_TOKEN_LENGTH = 256;

/** The public catalogue's prefixes; `/` itself is matched separately. */
const GATED_PREFIXES: readonly string[] = ['/rugs', '/tags', '/api/catalogue'];

export interface SiteGateConfig {
  /** `SITE_PASSWORD_HASH`; unset leaves the public catalogue open, as it always was. */
  passwordHash: string | undefined;
  /** Signs the cookie. Unset with a password set means nobody can enter — the gate fails closed. */
  secret: string | undefined;
  /** `PUBLIC_CATALOGUE`: with the catalogue off there is nothing to gate. */
  publicCatalogue: boolean;
  isSecureSite: boolean;
  now?: () => number;
}

export function siteGateEnabled(config: Pick<SiteGateConfig, 'passwordHash' | 'publicCatalogue'>): boolean {
  return Boolean(config.passwordHash) && config.publicCatalogue;
}

/** `/rugs/x/` and `/rugs/x` are the same path. */
function normalise(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

/** Is this one of the public catalogue's own paths? Everything else is another gate's business. */
export function isGatedPath(pathname: string): boolean {
  const path = normalise(pathname);
  if (path === '' || path === '/') return true;
  return GATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** `__Host-` requires Secure, so the plain name is used on http (local development). */
export function siteCookieName(secure: boolean): string {
  return `${secure ? '__Host-' : ''}sl_site`;
}

interface SiteSession {
  /** Epoch ms when the cookie stops being accepted. */
  exp: number;
}

function sign(payload: string, secret: string): Buffer {
  // Its own key derivation, so a site token can never pass as a customer or admin token.
  return createHmac('sha256', `${secret}:site`).update(payload).digest();
}

export function makeSiteToken(exp: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ exp } satisfies SiteSession), 'utf8').toString('base64url');
  return `${payload}.${sign(payload, secret).toString('base64url')}`;
}

export function verifySiteToken(token: string | undefined, secret: string, now: number): boolean {
  if (!token || token.length > MAX_TOKEN_LENGTH) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  let given: Buffer;
  try {
    given = Buffer.from(token.slice(dot + 1), 'base64url');
  } catch {
    return false;
  }
  const expected = sign(payload, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  let session: SiteSession;
  try {
    session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SiteSession;
  } catch {
    return false;
  }
  return typeof session?.exp === 'number' && session.exp > now;
}

/**
 * Where to send the visitor after the password. Only a gated catalogue PAGE qualifies — never a
 * protocol-relative address, never another host, never an API route — and the fallback is `/`.
 */
export function sanitiseSiteNext(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (/[\\\s]/.test(value)) return '/';
  let url: URL;
  try {
    url = new URL(value, 'http://site.invalid');
  } catch {
    return '/';
  }
  if (url.host !== 'site.invalid') return '/';
  if (!isGatedPath(url.pathname) || url.pathname.startsWith('/api/')) return '/';
  return `${url.pathname}${url.search}`;
}

/** The slice of Astro's APIContext the gate reads (structural, so tests pass a plain object). */
export interface SiteGateContext {
  url: URL;
  cookies: { get(name: string): { value: string } | undefined };
}

export type SiteDecision =
  /** Not a gated path, or the gate is off. */
  | { kind: 'open' }
  /** A gated path and a valid cookie. */
  | { kind: 'allowed' }
  /** A gated page without a cookie: send them to /enter and bring them back afterwards. */
  | { kind: 'login'; next: string }
  /** A gated API route without a cookie: JSON callers get a 401, not a redirect to a form. */
  | { kind: 'api-denied' };

export function siteGate(context: SiteGateContext, config: SiteGateConfig): SiteDecision {
  if (!siteGateEnabled(config)) return { kind: 'open' };
  const path = context.url.pathname;
  if (!isGatedPath(path)) return { kind: 'open' };
  const token = context.cookies.get(siteCookieName(config.isSecureSite))?.value;
  if (config.secret && verifySiteToken(token, config.secret, (config.now ?? Date.now)())) {
    return { kind: 'allowed' };
  }
  if (normalise(path).startsWith('/api/')) return { kind: 'api-denied' };
  return { kind: 'login', next: `${path}${context.url.search}` };
}
