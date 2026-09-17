// POST /api/admin/rugs/[id]/delete — rug.delete (owner, 2026-09-16). The row leaves the Products
// tab for good; the audit row rides in the same batch, so the trail outlives it.
//
// Reactions are NOT cascaded. They are an append-only event log and the buyer's history is the
// record: the saves report already names an id it can no longer resolve (`known: false`) rather than
// pretending the like never happened. Drive photos are left alone too — the drawer says so.
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
import { getClient } from '../../../../../lib/runtime.ts';
import { TABS } from '../../../../../lib/sheets/contract.ts';
import { loadSnapshot } from '../../_shared.ts';

export const POST = adminPost(DeleteRequest, async ({ context, body }) => {
  const id = context.params.id;
  if (!id || !ID_RE.test(id)) throw new AdminError(404, 'not found', 'no such product');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  const current = snapshot.rugs.find((r) => r.id.toLowerCase() === id.toLowerCase());
  if (!current) throw new AdminError(404, 'not found', `product "${id}" is not in the sheet`);
  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'rug.delete',
    targetTab: 'Products',
    targetId: current.id,
    // The whole row as it was, so the audit log is the only copy left of what was removed.
    before: { id: current.id, name: current.name, slug: current.slug, priceUsd: current.priceUsd },
    note: `row ${current.row}`,
  });
  const result = await deleteRow(client, {
    tab: TABS.products,
    row: current.row,
    expectFirstCell: current.id,
    version: body.version,
    audit,
  });
  await invalidateAfterWrite(context);
  return noStore({ ok: true, id: current.id, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
