// POST /api/admin/rugs/[id]/shopify — the Shopify dropdown in the admin products table (owner,
// 2026-09-25). Yes / No / TA, or blank, saved the moment it changes.
//
// It writes the product's `Shopify` cell and nothing else. The full update route replaces the WHOLE
// row from what the browser sends, so a dropdown built on it would have to carry every column through
// the page, and any column it forgot would be cleared. One cell cannot clobber anything beside it.
export const prerender = false;

import { noStore } from '../../../../../lib/api.ts';
import { buildAuditRow } from '../../../../../lib/admin/audit.ts';
import { ID_RE, RugShopify } from '../../../../../lib/admin/dto.ts';
import {
  AdminError,
  adminPost,
  auditBase,
  invalidateAfterWrite,
  methodNotAllowed,
} from '../../../../../lib/admin/http.ts';
import { updateProductCell } from '../../../../../lib/admin/write.ts';
import { getClient } from '../../../../../lib/runtime.ts';
import { PRODUCT_COLS } from '../../../../../lib/sheets/contract.ts';
import { consoleLogger } from '../../../../../lib/sheets/errors.ts';
import { freshRug, loadSnapshot, requireAdminHeaders } from '../../_shared.ts';

export const POST = adminPost(RugShopify, async ({ context, body }) => {
  const id = context.params.id;
  if (!id || !ID_RE.test(id)) throw new AdminError(404, 'not found', 'no such product');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  requireAdminHeaders(snapshot);
  const rug = snapshot.rugs.find((r) => r.id.toLowerCase() === id.toLowerCase());
  if (!rug) throw new AdminError(404, 'not found', `product "${id}" is not in the sheet`);
  if (rug.shopify === body.shopify) return noStore({ ok: true, rug, unchanged: true });

  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'rug.update',
    targetTab: 'Products',
    targetId: rug.id,
    before: { shopify: rug.shopify },
    after: { shopify: body.shopify },
    note: `row ${rug.row}`,
  });
  // The row's id is re-read under the lock before the write, so a row that moved since the snapshot
  // answers 409 instead of landing on someone else's product.
  const result = await updateProductCell(client, {
    columnIndex: PRODUCT_COLS.shopify,
    updates: [{ row: rug.row, expectFirstCell: rug.id, value: body.shopify }],
    audit,
    logger: consoleLogger,
  });
  await invalidateAfterWrite(context);
  const fresh = await freshRug(client, rug.row, rug.id);
  return noStore({ ok: true, rug: fresh, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
