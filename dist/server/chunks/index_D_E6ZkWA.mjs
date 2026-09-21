import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { A as slugify, H as TABS, i as getClient } from "./runtime_BSzjHQXl.mjs";
import { c as invalidateAfterWrite, i as adminPost, l as methodNotAllowed, n as adminGet, o as auditBase, p as insertRowAtBottom, t as AdminError } from "./http_CvlaKNqx.mjs";
import { o as noStore } from "./api_BVj6xXfj.mjs";
import { E as CollectionInput, V as buildAuditRow } from "./read_3DJW8o0r.mjs";
import { l as loadSnapshot, s as freshCollection, u as nowIso } from "./_shared_Cc9TG5cJ.mjs";
//#region src/pages/api/admin/collections/index.ts
var collections_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var GET = adminGet(async () => {
	const snapshot = await loadSnapshot();
	return noStore({
		ok: true,
		collections: snapshot.collections
	});
});
var POST = adminPost(CollectionInput, async ({ context, body }) => {
	const client = getClient();
	const snapshot = await loadSnapshot(client);
	const slug = slugify(body.name);
	if (!slug) throw new AdminError(422, "bad name", "The name needs at least one letter or digit.");
	const clash = snapshot.collections.find((c) => c.slug === slug || c.name.trim().toLowerCase() === body.name.toLowerCase());
	if (clash) throw new AdminError(409, "slug exists", `Collection "${clash.name}" already exists (${clash.slug}).`, { slug });
	const cover = "";
	const sortOrder = Math.max(0, ...snapshot.collections.map((c) => c.sortOrder ?? 0)) + 1;
	const audit = buildAuditRow({
		...auditBase(context),
		action: "collection.create",
		targetTab: "Collections",
		targetId: slug,
		after: {
			id: slug,
			slug,
			name: body.name,
			description: body.description,
			coverImageUrl: cover,
			sortOrder
		}
	});
	const result = await insertRowAtBottom(client, {
		tab: TABS.collections,
		cells: [
			slug,
			body.name,
			slug,
			body.description,
			nowIso(),
			cover,
			sortOrder
		],
		audit
	});
	await invalidateAfterWrite(context);
	const collection = await freshCollection(client, result.row);
	return noStore({
		ok: true,
		collection,
		audit: result.audit
	}, 201);
});
var ALL = methodNotAllowed("GET, POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/collections/index@_@ts
var page = () => collections_exports;
//#endregion
export { page };
