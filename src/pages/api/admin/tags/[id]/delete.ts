// POST /api/admin/tags/[id]/delete — tag.delete (owner, 2026-09-16). Refused while any product
// still carries the tag, for the same reason collections are: products store the tag's display name
// as text, so removing the definition would leave orphan labels rather than clean rows.
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
  if (!id || !ID_RE.test(id)) throw new AdminError(404, 'not found', 'no such tag');
  const client = getClient();
  const snapshot = await loadSnapshot(client);
  const current = snapshot.tags.find((t) => t.id.toLowerCase() === id.toLowerCase());
  if (!current) throw new AdminError(404, 'not found', `tag "${id}" is not in the sheet`);

  const key = current.name.trim().toLowerCase();
  const inUse = snapshot.rugs.filter((r) => r.tags.some((t) => t.trim().toLowerCase() === key)).length;
  if (inUse > 0) {
    throw new AdminError(
      409,
      'tag in use',
      `${inUse} ${inUse === 1 ? 'product carries' : 'products carry'} "${current.name}". Remove it from them first.`,
      { inUse },
    );
  }

  const audit = buildAuditRow({
    ...auditBase(context),
    action: 'tag.delete',
    targetTab: 'Tags',
    targetId: current.id,
    before: { id: current.id, name: current.name, slug: current.slug },
    note: `row ${current.row}`,
  });
  const result = await deleteRow(client, {
    tab: TABS.tags,
    row: current.row,
    expectFirstCell: current.id,
    version: body.version,
    audit,
  });
  await invalidateAfterWrite(context);
  return noStore({ ok: true, id: current.id, audit: result.audit });
});

export const ALL = methodNotAllowed('POST');
