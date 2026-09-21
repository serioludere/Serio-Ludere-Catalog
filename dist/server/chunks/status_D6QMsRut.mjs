import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { H as TABS, i as getClient } from "./runtime_DeI95MAO.mjs";
import { i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError, v as updateRow } from "./http_YuZl1CQP.mjs";
import { o as noStore } from "./api_Bc7pzPJK.mjs";
import { V as buildAuditRow, g as clientToCells, w as ClientStatus, x as CLIENT_CODE_RE } from "./read_D-x4Tjt2.mjs";
import { l as loadSnapshot, n as clientView, o as freshClient } from "./_shared_Be6KMbAz.mjs";
//#region src/pages/api/admin/clients/[code]/status.ts
var status_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(ClientStatus, async ({ context, body }) => {
	const code = context.params.code;
	if (!code || !CLIENT_CODE_RE.test(code)) throw new AdminError(404, "not found", "no such client");
	const client = getClient();
	const current = (await loadSnapshot(client)).clients.find((c) => c.code.toLowerCase() === code.toLowerCase());
	if (!current) throw new AdminError(404, "not found", `client "${code}" is not in the sheet`);
	if (current.status === body.status) return noStore({
		ok: true,
		client: clientView(current),
		unchanged: true
	});
	const audit = buildAuditRow({
		...auditBase(context),
		action: "client.status",
		targetTab: "Customers",
		targetId: current.code,
		before: { status: current.status },
		after: { status: body.status },
		note: `row ${current.row}`
	});
	const result = await updateRow(client, {
		tab: TABS.customers,
		row: current.row,
		version: body.version,
		cells: clientToCells({
			...current,
			status: body.status
		}),
		audit,
		expectFirstCell: current.code
	});
	const updated = clientView(await freshClient(client, current.row));
	return noStore({
		ok: true,
		client: updated,
		audit: result.audit
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/clients/[code]/status@_@ts
var page = () => status_exports;
//#endregion
export { page };
