// POST /api/admin/rugs/[id]/delete — rug.delete (owner, 2026-09-16), a HARD delete since 2026-09-18.
//
// Everything the product owns goes:
//   - the Products row, for good (the audit row rides in the same batch, so the trail outlives it);
//   - its collection and tag bindings, which need no separate work — both are text in the row's own
//     cells, so deleting the row deletes them;
//   - its photos in Drive, PERMANENTLY (`files.delete`, not the bin — the owner's explicit choice).
//     The rug's own folder goes first, which takes the "All Images" child and the duplicated primary
//     with it, and then any photo id on the row that was not inside it (older imports landed in the
//     flat root). A file that is already gone counts as done.
//
// Drive first, sheet second, and Drive failures do NOT abort the delete. The row is the record of
// what exists; a photo that refused to delete would otherwise leave the studio unable to remove the
// product at all. What could not be deleted comes back in `photosFailed` and is on the audit row, so
// an orphan in Drive is something you can find rather than something you never hear about.
//
// Reactions are NOT cascaded. They are an append-only event log and the buyer's history is the
// record: the saves report already names an id it can no longer resolve (`known: false`) rather than
// pretending the like never happened.
export const prerender = false;

import { noStore } from '../../../../../lib/api.ts';
import { buildAuditRow } from '../../../../../lib/admin/audit.ts';
import { DeleteRequest, ID_RE } from '../../../../../lib/admin/dto.ts';
import {
  AdminError,
  adminPost,
  auditBase,
  invalidateAfterWrite,
  methodNotAllowed,
} from '../../../../../lib/admin/http.ts';
import { deleteRow } from '../../../../../lib/admin/write.ts';
import { getAdminDeps, getClient } from '../../../../../lib/runtime.ts';
import { TABS } from '../../../../../lib/sheets/contract.ts';
import { consoleLogger } from '../../../../../lib/sheets/errors.ts';
import { loadSnapshot } from '../../_shared.ts';

export const POST = adminPost(DeleteRequest, async ({ context, body }) => {
  const id = context.params.id;
  if (!id || !ID_RE.test(id)) throw new AdminError(404, 'not found', 'no such product');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  const current = snapshot.rugs.find((r) => r.id.toLowerCase() === id.toLowerCase());
  if (!current) throw new AdminError(404, 'not found', `product "${id}" is not in the sheet`);

  /* ---------- Drive ---------- */
  const drive = getAdminDeps().drive;
  const photosFailed: Array<{ fileId: string; detail?: string }> = [];
  let photosDeleted = 0;
  if (drive) {
    // The folder first: deleting it removes everything inside, so the per-photo pass below then finds
    // most ids already gone and simply agrees.
    const targets = [...(current.driveFolderId ? [current.driveFolderId] : []), ...current.photos];
    for (const fileId of targets) {
      const r = await drive.deleteFile(fileId);
      if ('ok' in r) {
        if (!r.alreadyGone) photosDeleted += 1;
      } else {
        photosFailed.push({ fileId, ...(r.detail ? { detail: r.detail } : {}) });
      }
    }
    if (photosFailed.length) {
      consoleLogger.warn('rug delete: some Drive files were left behind', {
        id: current.id,
        failed: photosFailed.map((f) => f.fileId),
      });
    }
  }

  /* ---------- the row ---------- */
  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'rug.delete',
    targetTab: 'Products',
    targetId: current.id,
    // The whole row as it was, so the audit log is the only copy left of what was removed — now with
    // what happened in Drive, which is the only record that those files ever existed.
    before: {
      id: current.id,
      name: current.name,
      slug: current.slug,
      priceUsd: current.priceUsd,
      collections: current.collections,
      tags: current.tags,
      photos: current.photos,
      driveFolderId: current.driveFolderId,
    },
    note:
      `row ${current.row}` +
      (drive
        ? `, ${photosDeleted} Drive item(s) deleted` +
          (photosFailed.length ? `, ${photosFailed.length} left behind` : '')
        : ', Drive not connected — photos left in place'),
  });
  const result = await deleteRow(client, {
    tab: TABS.products,
    row: current.row,
    expectFirstCell: current.id,
    version: body.version,
    audit,
  });
  await invalidateAfterWrite(context);
  return noStore({
    ok: true,
    id: current.id,
    photosDeleted,
    ...(photosFailed.length ? { photosFailed } : {}),
    audit: result.audit,
  });
});

export const ALL = methodNotAllowed('POST');
