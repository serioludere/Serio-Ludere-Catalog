import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, H as unescapeHTML, O as renderComponent, P as renderTemplate, W as createAstro, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_LgtEfXer.mjs";
import { i as getClient, vt as consoleLogger, yt as serializeError } from "./runtime_BgX1riZH.mjs";
import { A as ID_RE, m as roundStepOf, o as findRugById } from "./read_Cjj8wrWx.mjs";
import { o as jsonForScript } from "./view_BxmrstDZ.mjs";
import { t as $$AdminLayout } from "./AdminLayout_DYiEsf8i.mjs";
import { t as $$RugFields } from "./RugFields_DHbAk64H.mjs";
import { t as fetchAdminSnapshotWithLikes } from "./likes_B-e_A2YC.mjs";
//#region src/pages/admin/rugs/[id].astro
var _id__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Id,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Id = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Id;
	const id = Astro.params.id ?? "";
	let snapshot;
	let likesById = /* @__PURE__ */ new Map();
	let error;
	let rug;
	if (ID_RE.test(id)) try {
		const read = await fetchAdminSnapshotWithLikes(getClient(), { logger: consoleLogger });
		snapshot = read.snapshot;
		likesById = read.likesById;
		rug = findRugById(snapshot, id);
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("admin edit-rug read failed", { error: safe });
		error = safe.message;
	}
	if (!rug && !error) Astro.response.status = 404;
	const collections = snapshot?.collections ?? [];
	const tags = snapshot?.tags ?? [];
	const roundStep = snapshot ? roundStepOf(snapshot.settings) : 5;
	const data = rug ? {
		mode: "edit",
		rug,
		collections: collections.map((c) => ({
			id: c.id,
			slug: c.slug,
			name: c.name
		})),
		tags: tags.map((t) => ({
			id: t.id,
			slug: t.slug,
			name: t.name,
			color: t.color ?? ""
		})),
		roundStep,
		driveScopeOk: null
	} : null;
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": rug ? `Serio Ludere — ${rug.name}` : "Serio Ludere — Rug not found",
		"active": "rugs"
	}, { "default": ($$result) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result)}<div class="msg err on">Could not read the sheet: ${error}</div>`}${!rug && !error && renderTemplate`<div class="msg err on">
No rug with id "${id}". <a href="/admin/rugs">Back to the catalogue</a> </div>`}${rug && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">${rug.name}</h1> <p class="page-head__count"> <span class="mono">${rug.id}</span> </p> </div> <span class="page-head__rule"></span> <a class="btn btn--secondary page-head__back" href="/admin/rugs">
Back to products
</a> </div> ${renderComponent($$result, "RugFields", $$RugFields, {
		"mode": "edit",
		"rug": rug,
		"collections": collections,
		"tags": tags,
		"roundStep": roundStep,
		"driveScopeOk": null,
		"likes": likesById.get(rug.id) ?? 0
	})} <script type="application/json" id="admin-data">${unescapeHTML(jsonForScript(data))}<\/script>${renderScript($$result, "/home/user/Serio-Ludere-Catalog/src/pages/admin/rugs/[id].astro?astro&type=script&index=0&lang.ts")}` })}`}` })}`;
}, "/home/user/Serio-Ludere-Catalog/src/pages/admin/rugs/[id].astro", void 0);
var $$file = "/home/user/Serio-Ludere-Catalog/src/pages/admin/rugs/[id].astro";
var $$url = "/admin/rugs/[id]";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/rugs/[id]@_@astro
var page = () => _id__exports;
//#endregion
export { page };
