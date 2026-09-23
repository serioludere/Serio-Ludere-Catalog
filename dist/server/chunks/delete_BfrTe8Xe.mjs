import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as PRODUCT_COLS, H as TABS, O as joinCollections, i as getClient } from "./runtime_xH1UDnXO.mjs";
import { _ as updateProductCell, c as invalidateAfterWrite, f as deleteRow, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError } from "./http_DnCdSH9c.mjs";
import { o as noStore } from "./api_BA4CntA9.mjs";
import { A as ID_RE, V as buildAuditRow, k as DeleteRequest } from "./read_Ya4YycGX.mjs";
import { l as loadSnapshot } from "./_shared_CsBKEXHI.mjs";
//#region src/pages/api/admin/collections/[id]/delete.ts
var delete_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(DeleteRequest, async ({ context, body }) => {
	const id = context.params.id;
	if (!id || !ID_RE.test(id)) throw new AdminError(404, "not found", "no such collection");
	const client = getClient();
	const snapshot = await loadSnapshot(client);
	const current = snapshot.collections.find((c) => c.id.toLowerCase() === id.toLowerCase());
	if (!current) throw new AdminError(404, "not found", `collection "${id}" is not in the sheet`);
	const key = current.name.trim().toLowerCase();
	const detach = snapshot.rugs.filter((r) => r.collections.some((name) => name.trim().toLowerCase() === key)).map((r) => ({
		row: r.row,
		expectFirstCell: r.id,
		value: joinCollections(r.collections.filter((name) => name.trim().toLowerCase() !== key))
	}));
	const audit = buildAuditRow({
		...auditBase(context),
		action: "collection.delete",
		targetTab: "Collections",
		targetId: current.id,
		before: {
			id: current.id,
			name: current.name,
			slug: current.slug,
			products: detach.length
		},
		note: `row ${current.row}${detach.length > 0 ? `, detached from ${detach.length} product(s)` : ""}`
	});
	const result = await deleteRow(client, {
		tab: TABS.collections,
		row: current.row,
		expectFirstCell: current.id,
		version: body.version,
		audit
	});
	if (detach.length > 0) await updateProductCell(client, {
		columnIndex: PRODUCT_COLS.collection,
		updates: detach,
		audit: buildAuditRow({
			...auditBase(context),
			action: "collection.detach",
			targetTab: "Products",
			targetId: current.id,
			before: {
				collection: current.name,
				products: detach.map((d) => d.expectFirstCell)
			},
			note: `"${current.name}" removed from ${detach.length} product(s)`
		})
	});
	await invalidateAfterWrite(context);
	return noStore({
		ok: true,
		id: current.id,
		detached: detach.length,
		audit: result.audit
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/collections/[id]/delete@_@ts
var page = () => delete_exports;
//#endregion
export { page };
