// POST /api/admin/collections/[id]/delete — collection.delete (owner, 2026-09-16).
//
// Deletes the DEFINITION only, never the products (owner, 2026-09-18). This used to refuse with a 409
// while any product was still filed under the collection; the studio wants to retire a grouping
// without first moving every rug out of it.
//
// Nothing is orphaned by that. Products store the collection's display NAME as text, and the buyer's
// side keys on the name, not on this row: `orderedCollectionNames` (sheets/parse.ts) appends any name
// a product claims but the Collections tab does not define, and `collectionSlug` falls back to
// slugifying it. So the rugs keep their label and still group under it — what the row was carrying,
// and what deleting it drops, is the collection's sort position and its description.
//
// The count of affected products still goes into the audit row, because "23 rugs lost their
// description" is the kind of thing worth being able to look up afterwards.
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

  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'collection.delete',
    targetTab: 'Collections',
    targetId: current.id,
    before: { id: current.id, name: current.name, slug: current.slug, products: inUse },
    note: `row ${current.row}${inUse > 0 ? `, ${inUse} product(s) keep the name "${current.name}"` : ''}`,
  });
  const result = await deleteRow(client, {
    tab: TABS.collections,
    row: current.row,
    expectFirstCell: current.id,
    version: body.version,
    audit,
  });
  await invalidateAfterWrite(context);
  return noStore({ ok: true, id: current.id, products: inUse, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
