import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { H as TABS, i as getClient } from "./runtime_BSzjHQXl.mjs";
import { c as invalidateAfterWrite, f as deleteRow, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError } from "./http_CvlaKNqx.mjs";
import { o as noStore } from "./api_BVj6xXfj.mjs";
import { V as buildAuditRow, k as DeleteRequest, x as CLIENT_CODE_RE } from "./read_3DJW8o0r.mjs";
import { l as loadSnapshot } from "./_shared_Cc9TG5cJ.mjs";
//#region src/pages/api/admin/clients/[code]/delete.ts
var delete_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(DeleteRequest, async ({ context, body }) => {
	const code = context.params.code;
	if (!code || !CLIENT_CODE_RE.test(code)) throw new AdminError(404, "not found", "no such customer");
	const client = getClient();
	const current = (await loadSnapshot(client)).clients.find((c) => c.code.toLowerCase() === code.toLowerCase());
	if (!current) throw new AdminError(404, "not found", `customer "${code}" is not in the sheet`);
	const audit = buildAuditRow({
		...auditBase(context),
		action: "client.delete",
		targetTab: "Customers",
		targetId: current.code,
		before: {
			code: current.code,
			name: current.name,
			status: current.status
		},
		note: `row ${current.row}`
	});
	const result = await deleteRow(client, {
		tab: TABS.customers,
		row: current.row,
		expectFirstCell: current.code,
		version: body.version,
		audit
	});
	await invalidateAfterWrite(context);
	return noStore({
		ok: true,
		code: current.code,
		audit: result.audit
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/clients/[code]/delete@_@ts
var page = () => delete_exports;
//#endregion
export { page };
