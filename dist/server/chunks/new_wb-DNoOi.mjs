import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, H as unescapeHTML, O as renderComponent, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_LgtEfXer.mjs";
import { i as getClient, vt as consoleLogger, yt as serializeError } from "./runtime_BgX1riZH.mjs";
import { a as adminRuntime } from "./http_DfO61_B-.mjs";
import { i as fetchAdminSnapshot, m as roundStepOf } from "./read_Cjj8wrWx.mjs";
import { o as jsonForScript } from "./view_BxmrstDZ.mjs";
import { t as $$AdminLayout } from "./AdminLayout_DYiEsf8i.mjs";
import { t as $$RugFields } from "./RugFields_DHbAk64H.mjs";
import { t as $$FetchModal } from "./FetchModal_D7WnPSmF.mjs";
import { n as nextRugId } from "./ids_BfhGaCRx.mjs";
import { f as reservedIds, r as driveScope } from "./_shared_CWxqYMt_.mjs";
//#region src/pages/admin/rugs/new.astro
var new_exports = /* @__PURE__ */ __exportAll({
	default: () => $$New,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$New = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$New;
	Astro.csp?.insertDirective("img-src 'self' https://lh3.googleusercontent.com https://cdn.shopify.com https://images.ecarpetwholesale.com data:");
	let snapshot;
	let error;
	try {
		snapshot = await fetchAdminSnapshot(getClient(), { logger: consoleLogger });
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("admin add-rug read failed", { error: safe });
		error = safe.message;
	}
	await driveScope();
	const driveScopeOk = adminRuntime.driveScopeOk ?? null;
	const collections = snapshot?.collections ?? [];
	const tags = snapshot?.tags ?? [];
	const settings = snapshot?.settings;
	const roundStep = settings ? roundStepOf(settings) : 5;
	const nextId = snapshot ? nextRugId(snapshot.rugs.map((r) => r.id), reservedIds(snapshot)) : "";
	const data = {
		mode: "add",
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
		nextId,
		roundStep,
		driveScopeOk,
		adminHeaders: snapshot?.report.adminHeaders ?? "ok"
	};
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Add rug",
		"active": "add"
	}, { "default": ($$result) => renderTemplate` ${maybeRenderHead($$result)}<div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Add product</h1> <p class="page-head__count">
Paste a supplier link and fetch, or fill the fields by hand; nothing is written until you save.
</p> </div> <span class="page-head__rule"></span> <a class="btn btn--secondary page-head__back" href="/admin/rugs">Back to products</a> </div> ${error && renderTemplate`<div class="msg err on">Could not read the sheet: ${error}</div>`}${snapshot?.report.adminHeaders === "missing" && renderTemplate`<div class="msg err on">
The catalogue sheet is missing its admin columns, so products cannot be added yet. Ask your developer
        to run the sheet setup.
</div>`}${renderComponent($$result, "RugFields", $$RugFields, {
		"mode": "add",
		"collections": collections,
		"tags": tags,
		"roundStep": roundStep,
		"driveScopeOk": driveScopeOk,
		"nextId": nextId
	})} <script type="application/json" id="admin-data">${unescapeHTML(jsonForScript(data))}<\/script>${renderScript($$result, "/home/user/Serio-Ludere-Catalog/src/pages/admin/rugs/new.astro?astro&type=script&index=0&lang.ts")}${renderComponent($$result, "FetchModal", $$FetchModal, {
		"id": "fetch-result",
		"title": "Fetching"
	})} ` })}`;
}, "/home/user/Serio-Ludere-Catalog/src/pages/admin/rugs/new.astro", void 0);
var $$file = "/home/user/Serio-Ludere-Catalog/src/pages/admin/rugs/new.astro";
var $$url = "/admin/rugs/new";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/rugs/new@_@astro
var page = () => new_exports;
//#endregion
export { page };
