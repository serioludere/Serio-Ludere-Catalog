// POST /api/admin/collections/[id]/delete — collection.delete (owner, 2026-09-16).
//
// Deletes the definition AND detaches it from every product that named it (owner, 2026-09-18).
//
// This has now been all three ways round, so the reasoning is worth keeping. It first REFUSED while
// any product referenced the collection. Then it deleted the row alone and left the products holding
// the name — which is survivable on the buyer's side (`orderedCollectionNames` gives an undefined
// name its own tab) but wrong in the admin: the studio deleted a collection and still saw it bound to
// products in the edit form, because the binding is the product's own text, not a reference.
//
// So the delete cascades. For every product filed under the collection, that name is removed from the
// product's `Collection` cell — the cell is pipe-separated, so the other collections on that product
// survive untouched. A product left with nothing falls back to the same blank the sheet already
// treats as "More". The products themselves are never deleted.
//
// Two writes, not one transaction: the row delete (version-guarded) and then the cascade. If the
// cascade fails, the collection is gone and some products still name it — the same state the previous
// behaviour left on purpose, which the buyer's side tolerates and a re-run of nothing is needed to
// fix, since the name simply stops matching a definition. Worth knowing, not worth a two-phase commit.
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
import { deleteRow, updateProductCell } from '../../../../../lib/admin/write.ts';
import { getClient } from '../../../../../lib/runtime.ts';
import { PRODUCT_COLS, TABS } from '../../../../../lib/sheets/contract.ts';
import { joinCollections } from '../../../../../lib/text.ts';
import { loadSnapshot } from '../../_shared.ts';

export const POST = adminPost(DeleteRequest, async ({ context, body }) => {
  const id = context.params.id;
  if (!id || !ID_RE.test(id)) throw new AdminError(404, 'not found', 'no such collection');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  const current = snapshot.collections.find((c) => c.id.toLowerCase() === id.toLowerCase());
  if (!current) throw new AdminError(404, 'not found', `collection "${id}" is not in the sheet`);

  const key = current.name.trim().toLowerCase();
  // Every product that names it, with the name already taken out of its list.
  const detach = snapshot.rugs
    .filter((r) => r.collections.some((name) => name.trim().toLowerCase() === key))
    .map((r) => ({
      row: r.row,
      expectFirstCell: r.id,
      value: joinCollections(r.collections.filter((name) => name.trim().toLowerCase() !== key)),
    }));

  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'collection.delete',
    targetTab: 'Collections',
    targetId: current.id,
    before: { id: current.id, name: current.name, slug: current.slug, products: detach.length },
    note: `row ${current.row}${detach.length > 0 ? `, detached from ${detach.length} product(s)` : ''}`,
  });
  const result = await deleteRow(client, {
    tab: TABS.collections,
    row: current.row,
    expectFirstCell: current.id,
    version: body.version,
    audit,
  });

  if (detach.length > 0) {
    await updateProductCell(client, {
      columnIndex: PRODUCT_COLS.collection,
      updates: detach,
      audit: buildAuditRow({
        ...auditBase(context),
        action: 'collection.detach',
        targetTab: 'Products',
        targetId: current.id,
        before: { collection: current.name, products: detach.map((d) => d.expectFirstCell) },
        note: `"${current.name}" removed from ${detach.length} product(s)`,
      }),
    });
  }

  await invalidateAfterWrite(context);
  return noStore({ ok: true, id: current.id, detached: detach.length, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
