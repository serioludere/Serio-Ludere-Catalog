// POST /api/admin/rugs/[id]/cover — "Re-fetch cover" on the edit page (owner, 2026-09-28).
//
// A product imported before today's cover fixes keeps the cover it was imported with: square, and
// the older it is, still on its side or still on the supplier's white sweep. This fetches the
// product's first photo from its supplier again and stores it exactly as an import does now —
// through `uploadFromUrl` with the supplier and index 0, so src/lib/drive/transform.ts turns it,
// cuts it out and crops it to 2:3 by the same rules as every new product — and makes it the cover.
//
// What changes is one cell, Image Src, written the way the Shopify dropdown writes its cell: the row's
// id is re-read first, and the write carries an AuditLog row. The new file is a new id and so a new
// URL, which the year-long image cache cannot confuse with the old one. The previous cover is not
// deleted: it stays in Drive, and pasting its id back into "Photo links" restores it.
//
// It can only fetch what the supplier still shows. A sold rug is often gone from the supplier's site,
// and then this says so and changes nothing.
export const prerender = false;

import { noStore } from '../../../../../lib/api.ts';
import { buildAuditRow } from '../../../../../lib/admin/audit.ts';
import { CoverRefetch, ID_RE } from '../../../../../lib/admin/dto.ts';
import {
  AdminError,
  adminPost,
  auditBase,
  invalidateAfterWrite,
  methodNotAllowed,
} from '../../../../../lib/admin/http.ts';
import { updateProductCell } from '../../../../../lib/admin/write.ts';
import { getAdminDeps, getClient } from '../../../../../lib/runtime.ts';
import { supplierOfRow } from '../../../../../lib/scrape/detect.ts';
import { scrapeRug } from '../../../../../lib/scrape/index.ts';
import { PRODUCT_COLS } from '../../../../../lib/sheets/contract.ts';
import { consoleLogger, serializeError } from '../../../../../lib/sheets/errors.ts';
import { freshRug, loadSnapshot, nowIso, requireAdminHeaders } from '../../_shared.ts';

/** `karavanrug.com` for the messages; the link itself when it will not parse. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export const POST = adminPost(
  CoverRefetch,
  async ({ context }) => {
    const id = context.params.id;
    if (!id || !ID_RE.test(id)) throw new AdminError(404, 'not found', 'no such product');
    const client = getClient();
    const snapshot = await loadSnapshot(client);
    requireAdminHeaders(snapshot);
    const rug = snapshot.rugs.find((r) => r.id === id);
    if (!rug) throw new AdminError(404, 'not found', `No product with id "${id}".`);
    // From the link when an older row left Source Site blank: the fixes depend on who the supplier is.
    const supplier = rug.sourceUrl ? supplierOfRow(rug.supplier, rug.sourceUrl) : undefined;
    if (!supplier) {
      throw new AdminError(
        422,
        'no_source',
        'This product has no supplier link, so there is nowhere to fetch its cover from.',
      );
    }

    const deps = getAdminDeps();
    if (!deps.drive) {
      throw new AdminError(
        409,
        'drive_not_authorised',
        'Saving a photo needs a Google account with Drive access.',
        {
          reason: 'service_account',
        },
      );
    }
    const scope = await deps.drive.scopeStatus();
    if (!scope.driveScopeOk) {
      throw new AdminError(
        409,
        'drive_not_authorised',
        `Drive is not authorised (${scope.reason ?? 'unknown'}).`,
        {
          reason: scope.reason ?? null,
        },
      );
    }

    const host = hostOf(rug.sourceUrl);
    const scraped = await scrapeRug(rug.sourceUrl, {
      jinaFallback: deps.scrape.jinaFallback,
      respectRobots: deps.scrape.respectRobots,
      convertToUsd: deps.convertToUsd,
      logger: consoleLogger,
    });
    if (!scraped.ok) {
      // Gone is the common case for an old product — the rug sold — and it is not a fault to retry.
      if (scraped.code === 'not_found') {
        throw new AdminError(
          422,
          'source_gone',
          `${host} no longer has this product's page (it may have sold), so its cover cannot be fetched again.`,
        );
      }
      throw new AdminError(
        502,
        'scrape_failed',
        `Could not read ${host} (${scraped.code}): ${scraped.message}`,
        {
          reason: scraped.code,
        },
      );
    }
    const photo = scraped.data.photos[0]?.url;
    if (!photo) throw new AdminError(422, 'no_photos', `${host} no longer shows any photographs of it.`);

    let allImagesId: string;
    try {
      allImagesId = (await deps.drive.ensureProductFolders(rug.id, rug.name)).allImagesId;
    } catch (e) {
      throw new AdminError(
        502,
        'folder_failed',
        `Could not reach the product's Drive folder: ${serializeError(e).message}`,
      );
    }
    // Index 0 and the supplier: the cover's fixes, exactly as an import applies them.
    const uploaded = await deps.drive.uploadFromUrl(
      photo,
      `01-primary-${nowIso().slice(0, 10)}`,
      allImagesId,
      {
        supplier,
        index: 0,
      },
    );
    if ('error' in uploaded) {
      throw new AdminError(
        502,
        uploaded.error,
        `The new cover could not be saved to Drive (${uploaded.error}).`,
        {
          detail: uploaded.detail ?? null,
        },
      );
    }

    const previous = rug.photos[0] ?? '';
    const audit = buildAuditRow({
      ...auditBase(context),
      action: 'rug.update',
      targetTab: 'Products',
      targetId: rug.id,
      before: { cover: previous },
      after: { cover: uploaded.id, from: photo },
      note: `row ${rug.row} · cover re-fetched from ${host}`,
    });
    const result = await updateProductCell(client, {
      columnIndex: PRODUCT_COLS.imageSrc,
      updates: [{ row: rug.row, expectFirstCell: rug.id, value: uploaded.id }],
      audit,
      logger: consoleLogger,
    });
    await invalidateAfterWrite(context);

    return noStore({
      ok: true,
      rug: await freshRug(client, rug.row, rug.id),
      cover: { id: uploaded.id, previous, source: photo, host },
      audit: result.audit,
    });
  },
  'photos',
);

export const ALL = methodNotAllowed('POST');
