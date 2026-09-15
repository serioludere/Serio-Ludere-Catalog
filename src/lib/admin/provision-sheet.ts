// Create the catalogue spreadsheet in the connected Google account (docs/ADMIN_SPEC.md; the same
// seven provisioning phases the CLI runs in src/lib/sheets/provision.ts).
//
// Shared by two callers: the OAuth callback, which creates the sheet the moment an account is
// connected and none exists (owner, 2026-09-15: "after successful integration create the sheet if
// it does not exist"), and POST /api/admin/google/provision, the retry when that did not succeed.
//
// Deliberately narrow: ONE sheet, only when there is none, only with a live connection, and only
// when the id can be stored durably — creating a second would orphan the first with the data in it.
import { SheetsClient } from '../sheets/client.ts';
import { consoleLogger } from '../sheets/errors.ts';
import { ALL_TABS, assertPeriodDecimalLocale, provisionSheet } from '../sheets/provision.ts';
import {
  getGoogleConnection,
  getSheetIdStore,
  getTokens,
  resetSheetClient,
  sheetIdIfAny,
} from '../runtime.ts';

export const DEFAULT_SHEET_TITLE = 'Serio Ludere — Catalogue';

export type ProvisionOutcome =
  | { ok: true; sheetId: string; url: string; log: string[] }
  | {
      ok: false;
      error: 'sheet exists' | 'not connected' | 'no data dir' | 'provision failed';
      /** Plain language for the owner. */
      message: string;
      status: number;
      sheetId?: string;
      log?: string[];
    };

/** Why a sheet cannot be created right now, or undefined when it can. */
export function provisionBlocker(): Extract<ProvisionOutcome, { ok: false }> | undefined {
  const existing = sheetIdIfAny();
  if (existing) {
    return {
      ok: false,
      error: 'sheet exists',
      message: 'This site already has a catalogue sheet.',
      status: 409,
      sheetId: existing,
    };
  }
  const connection = getGoogleConnection();
  if (!connection?.health().connected) {
    return {
      ok: false,
      error: 'not connected',
      message: 'Connect a Google account first — the catalogue is created in that account’s Drive.',
      status: 409,
    };
  }
  if (!getSheetIdStore().durable) {
    return {
      ok: false,
      error: 'no data dir',
      message:
        'This server cannot remember a new sheet after a restart, so one cannot be created here. Ask your developer to enable persistent storage.',
      status: 409,
    };
  }
  return undefined;
}

export async function provisionCatalogueSheet(
  title: string,
  audit: (event: {
    action: 'auth.google';
    targetTab: '-';
    targetId: string;
    after: Record<string, unknown>;
  }) => Promise<unknown>,
): Promise<ProvisionOutcome> {
  const blocked = provisionBlocker();
  if (blocked) return blocked;

  const auth = { mode: 'oauth_refresh' as const, clientId: '', clientSecret: '', refreshToken: '' };
  const spreadsheetId = await SheetsClient.createSpreadsheet(auth, title, ALL_TABS, {
    logger: consoleLogger,
    tokens: getTokens(),
  });

  const log: string[] = [];
  try {
    const client = new SheetsClient({ spreadsheetId, auth, logger: consoleLogger }, getTokens());
    const info = await client.getSpreadsheet();
    assertPeriodDecimalLocale(info);
    // 'none': nobody wants twenty demo rugs in a real catalogue. The badge tags the Signed /
    // Antique corner badge depends on are written either way — they are contract, not samples.
    await provisionSheet(client, info, { seed: 'none', log: (m) => log.push(m) });
  } catch (e) {
    // The sheet exists in Drive but is not usable. Say so, and say its id, so the studio is not left
    // with an invisible half-built spreadsheet they cannot find or finish.
    return {
      ok: false,
      error: 'provision failed',
      message:
        `The spreadsheet was created but could not be set up: ${e instanceof Error ? e.message : String(e)}. ` +
        'Delete it in Drive and try again.',
      status: 502,
      sheetId: spreadsheetId,
      log,
    };
  }

  // Stored LAST, so a failure above never points the site at a half-built sheet.
  getSheetIdStore().write({
    id: spreadsheetId,
    createdAt: new Date().toISOString(),
    createdBy: getGoogleConnection()?.health().account,
  });
  // The Sheets client and the snapshot cache were built around "no sheet"; drop them so the very
  // next request reads the new one instead of a cached failure.
  resetSheetClient();

  await audit({
    action: 'auth.google',
    targetTab: '-',
    targetId: 'sheet',
    after: { created: spreadsheetId, title },
  });

  return {
    ok: true,
    sheetId: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    log,
  };
}
