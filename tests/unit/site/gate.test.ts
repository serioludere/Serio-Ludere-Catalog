// The site password gate (owner, 2026-09-15): the public catalogue opens only to a visitor who has
// entered the shared password; everything else — admin, the customer realm, the APIs the pages
// call, the assets — is untouched. Pure module, so the middleware's decisions are tested directly.
import { describe, expect, it } from 'vitest';
import {
  isGatedPath,
  makeSiteToken,
  sanitiseSiteNext,
  siteCookieName,
  siteGate,
  siteGateEnabled,
  verifySiteToken,
} from '../../../src/lib/site/gate.ts';

const SECRET = 's'.repeat(40);
const HASH = 'scrypt.4096.8.1.' + 'a'.repeat(22) + '.' + 'b'.repeat(86);
const NOW = 1_700_000_000_000;

const config = (over: Partial<Parameters<typeof siteGate>[1]> = {}) => ({
  passwordHash: HASH,
  secret: SECRET,
  publicCatalogue: true,
  isSecureSite: false,
  now: () => NOW,
  ...over,
});

const ctx = (path: string, cookie?: string) => ({
  url: new URL(`http://site.test${path}`),
  cookies: {
    get: (name: string) =>
      cookie !== undefined && name === siteCookieName(false) ? { value: cookie } : undefined,
  },
});

describe('site gate · which paths it covers', () => {
  it('gates the public catalogue and nothing else', () => {
    for (const p of ['/', '/rugs/winks', '/rugs/winks/', '/tags/kilim', '/api/catalogue']) {
      expect(isGatedPath(p), p).toBe(true);
    }
    for (const p of [
      '/admin',
      '/admin/login',
      '/hala',
      '/hala/SL-021',
      '/enter',
      '/api/reactions',
      '/_astro/x.css',
    ]) {
      expect(isGatedPath(p), p).toBe(false);
    }
  });

  it('is off without a password hash, and off when the public catalogue itself is off', () => {
    expect(siteGateEnabled({ passwordHash: undefined, publicCatalogue: true })).toBe(false);
    expect(siteGateEnabled({ passwordHash: HASH, publicCatalogue: false })).toBe(false);
    expect(siteGate(ctx('/'), config({ passwordHash: undefined }))).toEqual({ kind: 'open' });
  });
});

describe('site gate · decisions', () => {
  it('sends a page to the password with its own path, and answers an API route with a denial', () => {
    expect(siteGate(ctx('/rugs/winks?x=1'), config())).toEqual({ kind: 'login', next: '/rugs/winks?x=1' });
    expect(siteGate(ctx('/api/catalogue'), config())).toEqual({ kind: 'api-denied' });
    expect(siteGate(ctx('/admin'), config())).toEqual({ kind: 'open' });
  });

  it('lets a valid cookie through and rejects an expired, tampered or foreign one', () => {
    const good = makeSiteToken(NOW + 60_000, SECRET);
    expect(siteGate(ctx('/', good), config())).toEqual({ kind: 'allowed' });
    expect(verifySiteToken(makeSiteToken(NOW - 1, SECRET), SECRET, NOW)).toBe(false);
    expect(verifySiteToken(`${good}x`, SECRET, NOW)).toBe(false);
    expect(verifySiteToken(good, 'o'.repeat(40), NOW)).toBe(false);
    expect(verifySiteToken(undefined, SECRET, NOW)).toBe(false);
    expect(verifySiteToken('not.a.token', SECRET, NOW)).toBe(false);
  });

  it('fails closed without a signing secret: a valid-looking cookie is still refused', () => {
    const good = makeSiteToken(NOW + 60_000, SECRET);
    expect(siteGate(ctx('/', good), config({ secret: undefined }))).toEqual({ kind: 'login', next: '/' });
  });

  it('names the cookie __Host- only on https', () => {
    expect(siteCookieName(true)).toBe('__Host-sl_site');
    expect(siteCookieName(false)).toBe('sl_site');
  });
});

describe('site gate · where the visitor goes afterwards', () => {
  it('only ever returns to a catalogue page', () => {
    expect(sanitiseSiteNext('/rugs/winks?collection=kilims')).toBe('/rugs/winks?collection=kilims');
    expect(sanitiseSiteNext('/tags/kilim')).toBe('/tags/kilim');
    for (const bad of [
      undefined,
      '',
      'rugs',
      '//evil.test/',
      'https://evil.test/',
      '/admin',
      '/hala',
      '/api/catalogue',
      '/rugs/x\\y',
    ]) {
      expect(sanitiseSiteNext(bad), String(bad)).toBe('/');
    }
  });
});
