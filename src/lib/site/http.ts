// Astro glue for the site password gate: the runtime read from astro:env, the login throttle, and
// the gate configuration for src/middleware.ts and src/pages/enter.astro. The logic is in ./gate.ts.
import { ADMIN_SESSION_SECRET, AUTH_SECRET, PUBLIC_CATALOGUE, SITE_PASSWORD_HASH } from 'astro:env/server';
import { LoginThrottle } from '../admin/login.ts';
import { isSecureSite } from '../api.ts';
import { RateLimiter } from '../votes/ratelimit.ts';
import { siteGateEnabled, type SiteGateConfig } from './gate.ts';

const usable = (value: string | undefined): string | undefined =>
  value && value.length >= 32 ? value : undefined;

/**
 * The studio's catalogue password as a scrypt hash, built in so a plain `git push` deploys it (owner,
 * 2026-09-15: "it should be pushed on the server like that"). `SITE_PASSWORD_HASH` in the environment
 * overrides it; `SITE_PASSWORD_HASH=none` switches the gate off. To change the password, run
 * `npm run admin:password -- --site` and paste the printed hash here.
 */
export const DEFAULT_SITE_PASSWORD_HASH =
  'scrypt.131072.8.1.IMHvboVJfSuxiYytvCqofg.DFOwDF8d9KvJ9soupOt_3W1ThAmeay1CLslAc57Km3SQDeXmnCJRNBvJxQ2wTBT9Uo-jomZmlLWaH0LYhDQz8w';

const passwordHash =
  SITE_PASSWORD_HASH === 'none' ? undefined : SITE_PASSWORD_HASH || DEFAULT_SITE_PASSWORD_HASH;
// The customer realm's secret signs it; the admin's is the fallback so a deployment without a
// customer realm can still lock its home page.
const secret = usable(AUTH_SECRET) ?? usable(ADMIN_SESSION_SECRET);
// Repeated from the schema rather than inferred from falsiness, as customer/http.ts does: a dev
// process older than a newly added variable exports `undefined` for it.
const publicCatalogue = PUBLIC_CATALOGUE ?? true;

export const siteRuntime = {
  passwordHash,
  secret,
  publicCatalogue,
  isSecureSite,
  /** True when the public catalogue asks for the site password. */
  enabled: siteGateEnabled({ passwordHash, publicCatalogue }),
  /** Its own limiter: a visitor's failed guesses can never lock the owner out of /admin. */
  throttle: new LoginThrottle(new RateLimiter({ maxKeys: 2000 })),
};

if (siteRuntime.enabled && !secret) {
  console.warn(
    '[site] SITE_PASSWORD_HASH is set but neither AUTH_SECRET nor ADMIN_SESSION_SECRET (≥ 32 characters) is: nobody can enter the catalogue until one is set.',
  );
}

export function siteGateConfig(): SiteGateConfig {
  return {
    passwordHash: siteRuntime.passwordHash,
    secret: siteRuntime.secret,
    publicCatalogue: siteRuntime.publicCatalogue,
    isSecureSite: siteRuntime.isSecureSite,
  };
}

/**
 * The route-cache policy for a public catalogue page. A cache HIT bypasses the middleware
 * (docs/ADR.md), so a cached `/` would be handed to anyone once one visitor had entered the
 * password. With the gate on, the public pages are simply not cached.
 */
export function publicCachePolicy(): false | { maxAge: number; swr: number; tags: string[] } {
  return siteRuntime.enabled ? false : { maxAge: 60, swr: 60, tags: ['sheet'] };
}
