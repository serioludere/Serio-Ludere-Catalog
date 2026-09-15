// GET /api/admin/google/callback — where Google returns the owner after they consent.
//
// Everything that could go wrong here is a security question, so each is checked before the code is
// spent: the handshake must exist (it is single-use, so a replayed callback finds nothing), the
// returned `state` must match in constant time, and the redirect URI sent to the token endpoint must
// be the one the handshake was started with.
//
// On success the refresh token is written to the store and the cached access token is dropped, so
// the very next sheet request uses the new authorisation. No restart, no editing `.env`.
export const prerender = false;

import type { APIRoute } from 'astro';
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from 'astro:env/server';
import {
  adminRuntime,
  auditBase,
  methodNotAllowed,
  recordAuditEvent,
  requireSession,
} from '../../../../lib/admin/http.ts';
import { HANDSHAKE_COOKIE } from '../../../../lib/google/handshake.ts';
import { handshakes } from '../../../../lib/google/runtime.ts';
import { describeToken, exchangeCode, GoogleAuthError, sameState } from '../../../../lib/google/oauth.ts';
import {
  DEFAULT_SHEET_TITLE,
  provisionBlocker,
  provisionCatalogueSheet,
} from '../../../../lib/admin/provision-sheet.ts';
import { getGoogleConnection, getGoogleStore, sheetIdIfAny } from '../../../../lib/runtime.ts';
import { consoleLogger, serializeError } from '../../../../lib/sheets/errors.ts';

/** Sends the owner back to the status page with a message rather than showing raw JSON. */
function back(context: Parameters<APIRoute>[0], next: string, params: Record<string, string>): Response {
  const url = new URL(next, adminRuntime.siteUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return context.redirect(`${url.pathname}${url.search}`, 303);
}

/**
 * The catalogue sheet, created the moment an account is connected and none exists (owner,
 * 2026-09-15: "after successful integration create the sheet if it does not exist" — not behind a
 * second button). Returns the query parameters the status page turns into a sentence. A server
 * that cannot keep the sheet id (no DATA_DIR) skips rather than creating a sheet it would forget.
 */
async function autoProvision(context: Parameters<APIRoute>[0]): Promise<Record<string, string>> {
  if (sheetIdIfAny()) return {};
  const blocked = provisionBlocker();
  if (blocked) return { sheet: 'skipped', detail: blocked.message.slice(0, 200) };
  try {
    const result = await provisionCatalogueSheet(DEFAULT_SHEET_TITLE, (event) =>
      recordAuditEvent({ ...auditBase(context), ...event }),
    );
    return result.ok ? { sheet: 'created' } : { sheet: 'failed', detail: result.message.slice(0, 200) };
  } catch (e) {
    consoleLogger.error('automatic sheet creation failed', { error: serializeError(e) });
    return { sheet: 'failed', detail: (e instanceof Error ? e.message : String(e)).slice(0, 200) };
  }
}

export const GET: APIRoute = async (context) => {
  requireSession(context);
  const handshake = handshakes.take(context.cookies.get(HANDSHAKE_COOKIE)?.value);
  context.cookies.delete(HANDSHAKE_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax' });
  const next = handshake?.next ?? '/admin/google';

  // The owner pressed Cancel, or Google refused.
  const denied = context.url.searchParams.get('error');
  if (denied) return back(context, next, { google: 'denied', detail: denied.slice(0, 80) });

  if (!handshake) {
    return back(context, next, {
      google: 'expired',
      detail: 'That authorisation was already used or took too long. Start it again.',
    });
  }
  const state = context.url.searchParams.get('state') ?? '';
  if (!sameState(state, handshake.state)) {
    return back(context, next, { google: 'bad_state', detail: 'The reply did not match the request.' });
  }
  const code = context.url.searchParams.get('code');
  if (!code) return back(context, next, { google: 'no_code', detail: 'Google returned no code.' });
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
    return back(context, next, { google: 'not_configured', detail: 'The OAuth client is not set.' });
  }

  try {
    const tokens = await exchangeCode({
      clientId: GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: handshake.redirectUri,
      code,
      verifier: handshake.verifier,
    });
    // Best effort: knowing which account consented is worth one extra call, and its failure is not
    // a reason to reject a working token.
    const info = await describeToken(tokens.accessToken).catch(() => ({ scopes: tokens.scopes }));

    getGoogleStore().write({
      refreshToken: tokens.refreshToken!,
      scopes: info.scopes.length ? info.scopes : tokens.scopes,
      account: 'email' in info ? info.email : undefined,
      connectedAt: new Date().toISOString(),
      lastRefreshAt: new Date().toISOString(),
    });
    // Drop the cached access token so the next request mints one from the new grant.
    getGoogleConnection()?.invalidate();

    await recordAuditEvent({
      ...auditBase(context),
      action: 'auth.google',
      targetTab: '-',
      targetId: 'google',
      // The account and the scopes, never the token.
      after: { account: ('email' in info && info.email) || 'unknown', scopes: info.scopes },
    });

    return back(context, next, { google: 'connected', ...(await autoProvision(context)) });
  } catch (e) {
    consoleLogger.error('google authorisation failed', { error: serializeError(e) });
    const detail =
      e instanceof GoogleAuthError ? e.message : 'The exchange failed. Check the redirect URI and try again.';
    return back(context, next, { google: 'failed', detail: detail.slice(0, 200) });
  }
};

export const ALL = methodNotAllowed('GET');
