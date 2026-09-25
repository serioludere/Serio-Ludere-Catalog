import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as PRODUCT_COLS, i as getClient, vt as consoleLogger } from "./runtime_BgX1riZH.mjs";
import { _ as updateProductCell, c as invalidateAfterWrite, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError } from "./http_DfO61_B-.mjs";
import { o as noStore } from "./api_B6hDsvkQ.mjs";
import { A as ID_RE, P as RugShopify, U as buildAuditRow } from "./read_Cjj8wrWx.mjs";
import { c as freshRug, d as requireAdminHeaders, l as loadSnapshot } from "./_shared_CWxqYMt_.mjs";
//#region src/pages/api/admin/rugs/[id]/shopify.ts
var shopify_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(RugShopify, async ({ context, body }) => {
	const id = context.params.id;
	if (!id || !ID_RE.test(id)) throw new AdminError(404, "not found", "no such product");
	const client = getClient();
	const snapshot = await loadSnapshot(client);
	requireAdminHeaders(snapshot);
	const rug = snapshot.rugs.find((r) => r.id.toLowerCase() === id.toLowerCase());
	if (!rug) throw new AdminError(404, "not found", `product "${id}" is not in the sheet`);
	if (rug.shopify === body.shopify) return noStore({
		ok: true,
		rug,
		unchanged: true
	});
	const audit = buildAuditRow({
		...auditBase(context),
		action: "rug.update",
		targetTab: "Products",
		targetId: rug.id,
		before: { shopify: rug.shopify },
		after: { shopify: body.shopify },
		note: `row ${rug.row}`
	});
	const result = await updateProductCell(client, {
		columnIndex: PRODUCT_COLS.shopify,
		updates: [{
			row: rug.row,
			expectFirstCell: rug.id,
			value: body.shopify
		}],
		audit,
		logger: consoleLogger
	});
	await invalidateAfterWrite(context);
	const fresh = await freshRug(client, rug.row, rug.id);
	return noStore({
		ok: true,
		rug: fresh,
		audit: result.audit
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/rugs/[id]/shopify@_@ts
var page = () => shopify_exports;
//#endregion
export { page };
