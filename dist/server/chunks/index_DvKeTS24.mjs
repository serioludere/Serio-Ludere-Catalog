import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { H as TABS, i as getClient } from "./runtime_BXWQfypp.mjs";
import { a as adminRuntime, c as invalidateAfterWrite, h as insertTopRow, i as adminPost, l as methodNotAllowed, n as adminGet, o as auditBase, t as AdminError } from "./http_CCcm1Cpb.mjs";
import { o as noStore } from "./api_DDsG4LqK.mjs";
import { C as ClientInput, V as buildAuditRow, _ as newClientCode, g as clientToCells, h as clientLink } from "./read_B9paZIxY.mjs";
import { l as loadSnapshot, n as clientView, o as freshClient, u as nowIso } from "./_shared_4QBBP7AX.mjs";
//#region src/pages/api/admin/clients/index.ts
var clients_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var GET = adminGet(async () => {
	const snapshot = await loadSnapshot();
	return noStore({
		ok: true,
		clients: snapshot.clients.map(clientView)
	});
});
var POST = adminPost(ClientInput, async ({ context, body, actor }) => {
	const client = getClient();
	const snapshot = await loadSnapshot(client);
	const code = newClientCode(body.name, snapshot.clients.map((c) => c.code));
	const link = clientLink(adminRuntime.siteUrl, code);
	const audit = buildAuditRow({
		...auditBase(context),
		action: "client.create",
		targetTab: "Customers",
		targetId: code,
		after: {
			code,
			name: body.name
		}
	});
	const result = await insertTopRow(client, {
		precheck: async () => {
			if ((await loadSnapshot(client)).clients.some((c) => c.code.trim().toLowerCase() === code.toLowerCase())) throw new AdminError(409, "code taken", "That preview link was just taken by another customer — press Add again to get a new one.", { code });
		},
		tab: TABS.customers,
		cells: clientToCells({
			code,
			name: body.name,
			note: "",
			status: "active",
			createdAt: nowIso(),
			createdBy: actor,
			link,
			passwordHash: ""
		}),
		audit
	});
	const created = clientView(await freshClient(client, result.row));
	await invalidateAfterWrite(context, { wait: true });
	return noStore({
		ok: true,
		client: created,
		audit: result.audit
	}, 201);
});
var ALL = methodNotAllowed("GET, POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/clients/index@_@ts
var page = () => clients_exports;
//#endregion
export { page };
