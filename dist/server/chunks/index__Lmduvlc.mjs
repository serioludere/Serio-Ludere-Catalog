import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { H as TABS, i as getClient } from "./runtime_xH1UDnXO.mjs";
import { c as invalidateAfterWrite, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError, v as updateRow } from "./http_DnCdSH9c.mjs";
import { o as noStore } from "./api_BA4CntA9.mjs";
import { T as ClientUpdate, V as buildAuditRow, g as clientToCells, x as CLIENT_CODE_RE } from "./read_Ya4YycGX.mjs";
import { l as loadSnapshot, n as clientView, o as freshClient } from "./_shared_CsBKEXHI.mjs";
//#region src/pages/api/admin/clients/[code]/index.ts
var _code__exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(ClientUpdate, async ({ context, body }) => {
	const code = context.params.code;
	if (!code || !CLIENT_CODE_RE.test(code)) throw new AdminError(404, "not found", "no such customer");
	const client = getClient();
	const current = (await loadSnapshot(client)).clients.find((c) => c.code.toLowerCase() === code.toLowerCase());
	if (!current) throw new AdminError(404, "not found", `customer "${code}" is not in the sheet`);
	if (current.name.trim() === body.name) return noStore({
		ok: true,
		client: clientView(current),
		unchanged: true
	});
	const audit = buildAuditRow({
		...auditBase(context),
		action: "client.update",
		targetTab: "Customers",
		targetId: current.code,
		before: { name: current.name },
		after: { name: body.name },
		note: `row ${current.row}`
	});
	const result = await updateRow(client, {
		tab: TABS.customers,
		row: current.row,
		version: body.version,
		cells: clientToCells({
			...current,
			name: body.name
		}),
		audit,
		expectFirstCell: current.code
	});
	await invalidateAfterWrite(context);
	const updated = clientView(await freshClient(client, current.row));
	return noStore({
		ok: true,
		client: updated,
		audit: result.audit
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/clients/[code]/index@_@ts
var page = () => _code__exports;
//#endregion
export { page };
