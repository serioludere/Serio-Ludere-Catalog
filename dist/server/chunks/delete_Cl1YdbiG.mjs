import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { H as TABS, i as getClient, n as getAdminDeps, vt as consoleLogger } from "./runtime_DeI95MAO.mjs";
import { c as invalidateAfterWrite, f as deleteRow, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError } from "./http_DExJbM5o.mjs";
import { o as noStore } from "./api_Bc7pzPJK.mjs";
import { A as ID_RE, V as buildAuditRow, k as DeleteRequest } from "./read_D-x4Tjt2.mjs";
import { l as loadSnapshot } from "./_shared_eGBTwHhQ.mjs";
//#region src/pages/api/admin/rugs/[id]/delete.ts
var delete_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(DeleteRequest, async ({ context, body }) => {
	const id = context.params.id;
	if (!id || !ID_RE.test(id)) throw new AdminError(404, "not found", "no such product");
	const client = getClient();
	const current = (await loadSnapshot(client)).rugs.find((r) => r.id.toLowerCase() === id.toLowerCase());
	if (!current) throw new AdminError(404, "not found", `product "${id}" is not in the sheet`);
	const drive = getAdminDeps().drive;
	const photosFailed = [];
	let photosDeleted = 0;
	if (drive) {
		const targets = [...current.driveFolderId ? [current.driveFolderId] : [], ...current.photos];
		for (const fileId of targets) {
			const r = await drive.deleteFile(fileId);
			if ("ok" in r) {
				if (!r.alreadyGone) photosDeleted += 1;
			} else photosFailed.push({
				fileId,
				...r.detail ? { detail: r.detail } : {}
			});
		}
		if (photosFailed.length) consoleLogger.warn("rug delete: some Drive files were left behind", {
			id: current.id,
			failed: photosFailed.map((f) => f.fileId)
		});
	}
	const audit = buildAuditRow({
		...auditBase(context),
		action: "rug.delete",
		targetTab: "Products",
		targetId: current.id,
		before: {
			id: current.id,
			name: current.name,
			slug: current.slug,
			priceUsd: current.priceUsd,
			collections: current.collections,
			tags: current.tags,
			photos: current.photos,
			driveFolderId: current.driveFolderId
		},
		note: `row ${current.row}` + (drive ? `, ${photosDeleted} Drive item(s) deleted` + (photosFailed.length ? `, ${photosFailed.length} left behind` : "") : ", Drive not connected — photos left in place")
	});
	const result = await deleteRow(client, {
		tab: TABS.products,
		row: current.row,
		expectFirstCell: current.id,
		version: body.version,
		audit
	});
	await invalidateAfterWrite(context);
	return noStore({
		ok: true,
		id: current.id,
		photosDeleted,
		...photosFailed.length ? { photosFailed } : {},
		audit: result.audit
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/rugs/[id]/delete@_@ts
var page = () => delete_exports;
//#endregion
export { page };
