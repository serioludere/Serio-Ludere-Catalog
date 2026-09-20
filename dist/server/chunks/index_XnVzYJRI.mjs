import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, O as renderComponent, P as renderTemplate } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { i as getClient, vt as consoleLogger, yt as serializeError } from "./runtime_DeI95MAO.mjs";
import { i as fetchAdminSnapshot, n as adminCounts } from "./read_D-x4Tjt2.mjs";
import { t as $$AdminLayout } from "./AdminLayout_DwEWQHde.mjs";
//#region src/pages/admin/index.astro
var admin_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	let snapshot;
	let error;
	try {
		snapshot = await fetchAdminSnapshot(getClient(), { logger: consoleLogger });
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("admin dashboard read failed", { error: safe });
		error = safe.message;
	}
	const counts = snapshot ? adminCounts(snapshot) : void 0;
	const settingsWarnings = snapshot?.settings.warnings ?? [];
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Admin",
		"active": "dashboard"
	}, { "default": ($$result) => renderTemplate` ${maybeRenderHead($$result)}<div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Dashboard</h1> <p class="page-head__count">What is live, what needs attention, and what changed last.</p> </div> <span class="page-head__rule"></span> </div> ${error && renderTemplate`<div class="msg err on">Could not read the sheet: ${error}</div>`}${snapshot?.report.adminHeaders === "missing" && renderTemplate`<div class="msg err on">
The catalogue sheet is missing its admin columns, so products cannot be edited yet. Ask your developer
        to run the sheet setup.
</div>`}${settingsWarnings.map((w) => renderTemplate`<div class="msg busy on">${w}</div>`)}<section class="stack" aria-labelledby="h-counts"> <h3 id="h-counts">Catalogue</h3> <div class="stats"> <div class="stat"> <div class="k">Products</div> <div class="v">${counts ? counts.rugs : "—"}</div> </div> <div class="stat"> <div class="k">Collections</div> <div class="v">${counts ? counts.collections : "—"}</div> </div> <div class="stat"> <div class="k">Tags</div> <div class="v">${counts ? counts.tags : "—"}</div> </div> <div class="stat"> <div class="k">Customers</div> <div class="v"> ${counts ? counts.clients.active : "—"} ${counts && counts.clients.revoked > 0 && renderTemplate`<small>+${counts.clients.revoked} paused</small>`} </div> </div> </div> </section> ` })}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/index.astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/index.astro";
var $$url = "/admin";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/index@_@astro
var page = () => admin_exports;
//#endregion
export { page };
