// POST /api/customers/[slug]/login — the buyer's side of the gate (brief §10, §14).
//
// Body: `{ "password": "amorfati-1314" }`. On success the response sets that slug's session
// cookie and answers `{ ok: true, redirect: "/<slug>" }`; the form posts with fetch and follows it.
//
// Every buyer unlocks with the same CUSTOMER_SHARED_PASSWORD_HASH (../../../../lib/customer/auth.ts);
// the slug only selects whose catalogue and session the visitor gets. The response is deliberately
// identical for "no such customer", "inactive customer" and "wrong password": one `invalid
// credentials`, one 401, after the same amount of work — verification runs against the fixed shared
// hash either way, so a slug that does not exist still pays the same scrypt cost and the timing does
// not leak which slugs are real.
//
// No attempt limit (owner, 2026-09-17): a buyer who mistypes the studio's password a few times
// should be able to keep trying, not be told to wait.
export const prerender = false;

import type { APIRoute } from 'astro';
import * as z from 'zod';
import { noStore, rejectCrossSite } from '../../../../lib/api.ts';
import {
  CUSTOMER_SHARED_PASSWORD_HASH,
  makeCustomerToken,
  newCustomerSession,
  verifyPassword,
} from '../../../../lib/customer/auth.ts';
import { customerCookieName } from '../../../../lib/customer/auth.ts';
import { customerRuntime, findCustomer } from '../../../../lib/customer/http.ts';
import { isReservedSlug, SLUG_RE } from '../../../../lib/customer/auth.ts';
import { loadCatalogue } from '../../../../lib/runtime.ts';

const Body = z.object({ password: z.string().min(1).max(200) });

export const POST: APIRoute = async (context) => {
  // NOT destructured: `clientAddress` is a getter that throws when the adapter cannot supply a peer
  // address, and destructuring would evaluate it eagerly, outside `socketAddressOf`'s try/catch.
  const { request, cookies, params } = context;
  const rejected = rejectCrossSite(request);
  if (rejected) return rejected;
  if (!customerRuntime.configured) return noStore({ ok: false, error: 'not found' }, 404);

  const slug = (params.slug ?? '').toLowerCase();
  if (!SLUG_RE.test(slug) || isReservedSlug(slug)) return noStore({ ok: false, error: 'not found' }, 404);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStore({ ok: false, error: 'bad request' }, 400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return noStore({ ok: false, error: 'bad request' }, 400);

  const { snapshot } = await loadCatalogue();
  if (!snapshot) return noStore({ ok: false, error: 'unavailable' }, 503, { 'retry-after': '30' });

  const customer = findCustomer(snapshot.catalogue.customers, slug);
  const ok = verifyPassword(CUSTOMER_SHARED_PASSWORD_HASH, parsed.data.password) && Boolean(customer);
  if (!ok) return noStore({ ok: false, error: 'invalid credentials' }, 401);

  const now = Date.now();
  const session = newCustomerSession(slug, now);
  cookies.set(
    customerCookieName(slug, customerRuntime.isSecureSite),
    makeCustomerToken(session, customerRuntime.secret!),
    {
      httpOnly: true,
      secure: customerRuntime.isSecureSite,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.max(1, Math.floor((session.exp - now) / 1000)),
    },
  );
  return noStore({ ok: true, redirect: `/${slug}` });
};

export const ALL: APIRoute = () =>
  noStore({ ok: false, error: 'method not allowed' }, 405, { allow: 'POST' });
