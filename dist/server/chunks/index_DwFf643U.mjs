import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_C45USqpX.mjs";
import { I as consoleLogger, R as serializeError } from "./parse_CyNL3ky6.mjs";
import { r as adminHealth } from "./http_friNsH5S.mjs";
import { i as getClient, r as getCache } from "./runtime_BIcTruy2.mjs";
import { i as fetchAdminSnapshot, n as adminCounts } from "./read_CIiVx8tx.mjs";
import { t as $$AdminLayout } from "./AdminLayout_BIeV2zIG.mjs";
import { t as auditLabel } from "./audit-labels_iCH4Lgan.mjs";
import { t as $$Button } from "./Button_YI1J549D.mjs";
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
	let snapshotAgeSec = null;
	let lastRefreshOk = null;
	try {
		const h = getCache().health();
		snapshotAgeSec = h.snapshotAgeSec;
		lastRefreshOk = h.lastRefreshOk;
	} catch {}
	const health = adminHealth();
	const audit = snapshot?.audit.slice(0, 10) ?? [];
	const droppedRows = snapshot?.report.dropped.length ?? 0;
	const settingsWarnings = snapshot?.settings.warnings ?? [];
	const drive = health.driveScopeOk === null ? "not checked" : health.driveScopeOk ? "connected" : "not connected";
	const links = [
		["/admin/rugs/new", "Add product"],
		["/admin/rugs", "Products"],
		["/admin/collections", "Collections & tags"],
		["/admin/clients", "Customers"],
		["/admin/audit", "Activity log"]
	];
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Admin",
		"active": "dashboard"
	}, { "default": ($$result) => renderTemplate` ${maybeRenderHead($$result)}<div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Dashboard</h1> <p class="page-head__count">What is live, what needs attention, and what changed last.</p> </div> <span class="page-head__rule"></span> ${renderComponent($$result, "Button", $$Button, {
		"href": "/admin/rugs/new",
		"icon": "plus"
	}, { "default": ($$result) => renderTemplate`Add product` })} </div> ${error && renderTemplate`<div class="msg err on">Could not read the sheet: ${error}</div>`}${snapshot?.report.adminHeaders === "missing" && renderTemplate`<div class="msg err on">
The catalogue sheet is missing its admin columns, so products cannot be edited yet. Ask your developer
        to run the sheet setup.
</div>`}${settingsWarnings.map((w) => renderTemplate`<div class="msg busy on">${w}</div>`)}<section class="stack" aria-labelledby="h-counts"> <h3 id="h-counts">Catalogue</h3> <div class="stats"> <div class="stat"> <div class="k">Active products</div> <div class="v">${counts ? counts.rugs.active : "—"}</div> </div> <div class="stat"> <div class="k">Drafts</div> <div class="v">${counts ? counts.rugs.draft : "—"}</div> </div> <div class="stat"> <div class="k">Archived</div> <div class="v">${counts ? counts.rugs.archived : "—"}</div> </div> <div class="stat"> <div class="k">Collections</div> <div class="v">${counts ? counts.collections : "—"}</div> </div> <div class="stat"> <div class="k">Tags</div> <div class="v">${counts ? counts.tags : "—"}</div> </div> <div class="stat"> <div class="k">Customers</div> <div class="v"> ${counts ? counts.clients.active : "—"} ${counts && counts.clients.revoked > 0 && renderTemplate`<small>+${counts.clients.revoked} paused</small>`} </div> </div> </div> </section> <section class="stack" aria-labelledby="h-health"> <h3 id="h-health">Site health</h3> <div class="stats"> <div class="stat"> <div class="k">Catalogue refreshed</div> <div class="v"> ${snapshotAgeSec === null ? "—" : `${snapshotAgeSec} s ago`} ${lastRefreshOk === false && renderTemplate`<small>last refresh failed</small>`} </div> </div> <div class="stat"> <div class="k">Photo storage</div> <div class="v">${drive}</div> </div> <div class="stat"> <div class="k">Failed saves</div> <div class="v">${health.adminWriteFailures}</div> </div> <div class="stat"> <div class="k">Rows skipped by the sheet</div> <div class="v">${snapshot ? droppedRows : "—"}</div> </div> </div> ${snapshot && droppedRows > 0 && renderTemplate`<div class="table-wrap"> <table> <thead> <tr> <th>Tab</th> <th>Row</th> <th>Issues</th> </tr> </thead> <tbody> ${snapshot.report.dropped.slice(0, 10).map((d) => renderTemplate`<tr> <td>${d.tab}</td> <td class="mono">${d.row}</td> <td class="mono">${d.issues.join("; ")}</td> </tr>`)} </tbody> </table> </div>`} </section> <section class="stack" aria-labelledby="h-audit"> <h3 id="h-audit">Recent activity</h3> ${audit.length === 0 && renderTemplate`<div class="msg busy on">Nothing has changed yet.</div>`} ${audit.length > 0 && renderTemplate`<div class="table-wrap"> <table> <thead> <tr> <th>Time</th> <th>Who</th> <th>What</th> <th>Item</th> <th>Note</th> </tr> </thead> <tbody> ${audit.map((a) => renderTemplate`<tr> <td class="mono"${addAttribute(a.timestamp, "data-ts")}> ${a.timestamp} </td> <td>${a.actor}</td> <td>${auditLabel(a.action)}</td> <td class="mono"> ${a.targetTab} ${a.targetId} </td> <td class="mono">${a.note}</td> </tr>`)} </tbody> </table> </div>`} <p class="hint"> <a href="/admin/audit">See all activity</a> </p> </section> <section class="stack links" aria-labelledby="h-links"> <h3 id="h-links">Quick links</h3> <p>${links.map(([href, label]) => renderTemplate`<a${addAttribute(href, "href")}>${label}</a>`)}</p> </section> ${renderScript($$result, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/admin/index.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/admin/index.astro", void 0);
var $$file = "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/admin/index.astro";
var $$url = "/admin";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/index@_@astro
var page = () => admin_exports;
//#endregion
export { page };
