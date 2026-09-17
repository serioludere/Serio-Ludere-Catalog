// POST /api/admin/clients/[code]/delete — client.delete (owner, 2026-09-16). The customer's row
// leaves the sheet and their preview link stops resolving.
//
// Their reactions and visits stay: both are append-only event logs, and the studio's read of which
// rugs were liked is worth more than tidiness. The saves report shows the orphaned code rather than
// dropping the likes.
export const prerender = false;

import { noStore } from '../../../../../lib/api.ts';
import { buildAuditRow } from '../../../../../lib/admin/audit.ts';
import { CLIENT_CODE_RE, DeleteRequest } from '../../../../../lib/admin/dto.ts';
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
  const code = context.params.code;
  if (!code || !CLIENT_CODE_RE.test(code)) throw new AdminError(404, 'not found', 'no such customer');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  const current = snapshot.clients.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!current) throw new AdminError(404, 'not found', `customer "${code}" is not in the sheet`);
  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'client.delete',
    targetTab: 'Customers',
    targetId: current.code,
    // Never the password hash: an audit row is readable by anyone with the sheet.
    before: { code: current.code, name: current.name, status: current.status },
    note: `row ${current.row}`,
  });
  const result = await deleteRow(client, {
    tab: TABS.customers,
    row: current.row,
    expectFirstCell: current.code,
    version: body.version,
    audit,
  });
  await invalidateAfterWrite(context);
  return noStore({ ok: true, code: current.code, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
