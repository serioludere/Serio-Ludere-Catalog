// POST /api/admin/collections/[id]/delete — collection.delete (owner, 2026-09-16).
//
// Refused while any product is still filed under it. Products store the collection's DISPLAY NAME as
// text, matched case-insensitively, so deleting the definition would not detach anything — it would
// silently relabel every one of those rugs to the fallback collection on the buyer's side. Telling
// the owner how many rugs are in the way is more useful than a cascade they did not ask for.
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
  if (!id || !ID_RE.test(id)) throw new AdminError(404, 'not found', 'no such collection');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  const current = snapshot.collections.find((c) => c.id.toLowerCase() === id.toLowerCase());
  if (!current) throw new AdminError(404, 'not found', `collection "${id}" is not in the sheet`);

  const key = current.name.trim().toLowerCase();
  const inUse = snapshot.rugs.filter((r) =>
    r.collections.some((name) => name.trim().toLowerCase() === key),
  ).length;
  if (inUse > 0) {
    throw new AdminError(
      409,
      'collection in use',
      `${inUse} ${inUse === 1 ? 'product is' : 'products are'} still in "${current.name}". Move them to another collection first.`,
      { inUse },
    );
  }

  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'collection.delete',
    targetTab: 'Collections',
    targetId: current.id,
    before: { id: current.id, name: current.name, slug: current.slug },
    note: `row ${current.row}`,
  });
  const result = await deleteRow(client, {
    tab: TABS.collections,
    row: current.row,
    expectFirstCell: current.id,
    version: body.version,
    audit,
  });
  await invalidateAfterWrite(context);
  return noStore({ ok: true, id: current.id, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
