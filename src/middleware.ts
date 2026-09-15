// Security headers on every response (docs/ADR.md D1), then the admin gate (docs/ADMIN_SPEC.md
// §2.2), then the customer realm gate (brief §10). Cached responses keep the headers they were
// rendered with, so cache hits carry them too; admin and customer responses are never cached at all.
//
// The customer gate is last because it default-denies: anything that is neither an allowlisted
// public path nor a well-formed `/{slug}` is a 404 before a page runs. It never reads the sheet.
import { defineMiddleware, sequence } from 'astro:middleware';
import { adminGate } from './lib/admin/gate.ts';
import { gateConfig } from './lib/admin/http.ts';
import { customerGate } from './lib/customer/gate.ts';
import { customerGateConfig } from './lib/customer/http.ts';
import { ENTER_PATH, siteGate } from './lib/site/gate.ts';
import { siteGateConfig } from './lib/site/http.ts';

const securityHeaders = defineMiddleware(async (_context, next) => {
  const response = await next();
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'same-origin');
  response.headers.set('x-frame-options', 'DENY');
  return response;
});

const admin = defineMiddleware((context, next) => adminGate(context, () => next(), gateConfig()));

// The site password (owner, 2026-09-15): the public catalogue opens only to a visitor who entered
// it on /enter. The pages themselves switch the route cache off while the gate is on (a cache HIT
// bypasses middleware, docs/ADR.md), so a page rendered for one visitor is never handed to another.
const site = defineMiddleware(async (context, next) => {
  const decision = siteGate(context, siteGateConfig());
  if (decision.kind === 'login') {
    return context.redirect(`${ENTER_PATH}?next=${encodeURIComponent(decision.next)}`, 303);
  }
  if (decision.kind === 'api-denied') {
    return new Response(JSON.stringify({ ok: false, error: 'password required' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  if (decision.kind === 'allowed') {
    const response = await next();
    response.headers.set('cache-control', 'private, no-store');
    response.headers.set('x-robots-tag', 'noindex, nofollow');
    return response;
  }
  return next();
});

const customer = defineMiddleware(async (context, next) => {
  const { route } = customerGate(context, customerGateConfig());
  if (route.kind === 'deny') {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex, nofollow' },
    });
  }
  if (route.kind === 'customer') {
    // A private preview is never cached and never indexed, signed in or not.
    context.cache.set(false);
    const response = await next();
    response.headers.set('cache-control', 'no-store');
    response.headers.set('x-robots-tag', 'noindex, nofollow');
    return response;
  }
  return next();
});

export const onRequest = sequence(securityHeaders, admin, site, customer);
