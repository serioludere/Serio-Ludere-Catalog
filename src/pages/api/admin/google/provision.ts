// POST /api/admin/google/provision — create the catalogue spreadsheet from the admin.
//
// Normally unnecessary: the OAuth callback creates the sheet the moment an account is connected and
// none exists (owner, 2026-09-15). This is the retry for when that could not happen. The logic
// itself lives in src/lib/admin/provision-sheet.ts and is shared with the callback.
export const prerender = false;

import * as z from 'zod';
import { noStore } from '../../../../lib/api.ts';
import {
  adminPost,
  adminRuntime,
  auditBase,
  methodNotAllowed,
  recordAuditEvent,
} from '../../../../lib/admin/http.ts';
import { DEFAULT_SHEET_TITLE, provisionCatalogueSheet } from '../../../../lib/admin/provision-sheet.ts';

const Body = z.object({
  /** Shown on the spreadsheet in Drive. The studio sees it there, so it is worth getting right. */
  title: z.string().trim().min(1).max(120).default(DEFAULT_SHEET_TITLE),
});

export const POST = adminPost(Body, async ({ context, body }) => {
  const result = await provisionCatalogueSheet(body.title, (event) =>
    recordAuditEvent({ ...auditBase(context), ...event }),
  );
  if (!result.ok) {
    return noStore(
      {
        ok: false,
        error: result.error,
        message: result.message,
        ...(result.sheetId ? { sheetId: result.sheetId } : {}),
        ...(result.log ? { log: result.log } : {}),
      },
      result.status,
    );
  }
  return noStore({
    ok: true,
    sheetId: result.sheetId,
    url: result.url,
    siteUrl: adminRuntime.siteUrl,
    log: result.log,
  });
});

export const ALL = methodNotAllowed('POST');
