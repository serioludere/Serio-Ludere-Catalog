// POST /api/admin/clients/[code] — client.update (owner, 2026-09-16): renames a customer.
//
// The code is the link, so it is deliberately NOT derived from the new name — a customer the studio
// renames keeps the URL already shared with them.
export const prerender = false;

import { noStore } from '../../../../../lib/api.ts';
import { buildAuditRow } from '../../../../../lib/admin/audit.ts';
import { clientToCells } from '../../../../../lib/admin/clients.ts';
import { CLIENT_CODE_RE, ClientUpdate } from '../../../../../lib/admin/dto.ts';
import {
  AdminError,
  adminPost,
  auditBase,
  invalidateAfterWrite,
  methodNotAllowed,
} from '../../../../../lib/admin/http.ts';
import { updateRow } from '../../../../../lib/admin/write.ts';
import { getClient } from '../../../../../lib/runtime.ts';
import { TABS } from '../../../../../lib/sheets/contract.ts';
import { clientView, freshClient, loadSnapshot } from '../../_shared.ts';

export const POST = adminPost(ClientUpdate, async ({ context, body }) => {
  const code = context.params.code;
  if (!code || !CLIENT_CODE_RE.test(code)) throw new AdminError(404, 'not found', 'no such customer');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  const current = snapshot.clients.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!current) throw new AdminError(404, 'not found', `customer "${code}" is not in the sheet`);
  if (current.name.trim() === body.name) {
    return noStore({ ok: true, client: clientView(current), unchanged: true });
  }
  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'client.update',
    targetTab: 'Customers',
    targetId: current.code,
    before: { name: current.name },
    after: { name: body.name },
    note: `row ${current.row}`,
  });
  const result = await updateRow(client, {
    tab: TABS.customers,
    row: current.row,
    version: body.version,
    cells: clientToCells({ ...current, name: body.name }),
    audit,
    expectFirstCell: current.code,
  });
  await invalidateAfterWrite(context);
  const updated = clientView(await freshClient(client, current.row));
  return noStore({ ok: true, client: updated, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
