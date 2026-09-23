import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { H as TABS, i as getClient } from "./runtime_BXWQfypp.mjs";
import { c as invalidateAfterWrite, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError, v as updateRow } from "./http_CCcm1Cpb.mjs";
import { o as noStore } from "./api_DDsG4LqK.mjs";
import { A as ID_RE, D as CollectionUpdate, H as diffFields, V as buildAuditRow } from "./read_B9paZIxY.mjs";
import { l as loadSnapshot, s as freshCollection } from "./_shared_4QBBP7AX.mjs";
//#region src/pages/api/admin/collections/[id].ts
var _id__exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(CollectionUpdate, async ({ context, body }) => {
	const id = context.params.id;
	if (!id || !ID_RE.test(id)) throw new AdminError(404, "not found", "no such collection");
	const client = getClient();
	const snapshot = await loadSnapshot(client);
	const current = snapshot.collections.find((c) => c.id.toLowerCase() === id.toLowerCase());
	if (!current) throw new AdminError(404, "not found", `collection "${id}" is not in the sheet`);
	const clash = snapshot.collections.find((c) => c.id !== current.id && c.name.trim().toLowerCase() === body.name.toLowerCase());
	if (clash) throw new AdminError(409, "name exists", `Another collection is already called "${clash.name}".`);
	const cover = current.coverImageUrl ?? "";
	const before = {
		name: current.name,
		description: current.description
	};
	const after = {
		name: body.name,
		description: body.description
	};
	const diff = diffFields(before, after);
	if (diff.changed.length === 0) return noStore({
		ok: true,
		collection: current,
		unchanged: true
	});
	const audit = buildAuditRow({
		...auditBase(context),
		action: "collection.update",
		targetTab: "Collections",
		targetId: current.id,
		before: diff.before,
		after: diff.after,
		note: `row ${current.row}`
	});
	const result = await updateRow(client, {
		tab: TABS.collections,
		row: current.row,
		version: body.version,
		cells: [
			current.id,
			body.name,
			current.slug,
			body.description,
			current.createdAt ?? "",
			cover,
			current.sortOrder
		],
		audit
	});
	await invalidateAfterWrite(context);
	const collection = await freshCollection(client, current.row);
	const detached = body.name.trim().toLowerCase() === current.name.trim().toLowerCase() ? 0 : snapshot.rugs.filter((r) => r.collection.trim().toLowerCase() === current.name.trim().toLowerCase()).length;
	return noStore({
		ok: true,
		collection,
		audit: result.audit,
		detached
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/collections/[id]@_@ts
var page = () => _id__exports;
//#endregion
export { page };
