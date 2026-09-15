import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { O as TABS, g as slugify } from "./parse_CyNL3ky6.mjs";
import { c as invalidateAfterWrite, f as insertRowAtBottom, i as adminPost, l as methodNotAllowed, n as adminGet, o as auditBase, t as AdminError } from "./http_friNsH5S.mjs";
import { o as noStore } from "./api_DdjGbQdl.mjs";
import { i as getClient } from "./runtime_BIcTruy2.mjs";
import { G as buildAuditRow, z as TagInput } from "./read_CIiVx8tx.mjs";
import { d as loadSnapshot, u as freshTag } from "./_shared_jQquG5lu.mjs";
//#region src/pages/api/admin/tags/index.ts
var tags_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var GET = adminGet(async () => {
	const snapshot = await loadSnapshot();
	return noStore({
		ok: true,
		tags: snapshot.tags
	});
});
var POST = adminPost(TagInput, async ({ context, body }) => {
	const client = getClient();
	const snapshot = await loadSnapshot(client);
	const slug = slugify(body.name);
	if (!slug) throw new AdminError(422, "bad name", "The name needs at least one letter or digit.");
	const clash = snapshot.tags.find((t) => t.slug === slug || t.name.trim().toLowerCase() === body.name.toLowerCase());
	if (clash) throw new AdminError(409, "slug exists", `Tag "${clash.name}" already exists (${clash.slug}).`, { slug });
	const color = body.color ?? "";
	const audit = buildAuditRow({
		...auditBase(context),
		action: "tag.create",
		targetTab: "Tags",
		targetId: slug,
		after: {
			id: slug,
			slug,
			name: body.name,
			color
		}
	});
	const result = await insertRowAtBottom(client, {
		tab: TABS.tags,
		cells: [
			slug,
			slug,
			body.name,
			color
		],
		audit
	});
	await invalidateAfterWrite(context);
	const tag = await freshTag(client, result.row);
	return noStore({
		ok: true,
		tag,
		audit: result.audit
	}, 201);
});
var ALL = methodNotAllowed("GET, POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/tags/index@_@ts
var page = () => tags_exports;
//#endregion
export { page };
