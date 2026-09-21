import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_CUaH0lGr.mjs";
import { i as getClient, vt as consoleLogger, yt as serializeError } from "./runtime_DeI95MAO.mjs";
import { R as AUDIT_ACTIONS, i as fetchAdminSnapshot } from "./read_D-x4Tjt2.mjs";
import { t as $$AdminLayout } from "./AdminLayout_Bzl8NmWf.mjs";
//#region src/lib/admin/audit-labels.ts
var AUDIT_LABELS = {
	"rug.create": "Product added",
	"rug.update": "Product updated",
	"rug.delete": "Product deleted",
	"collection.create": "Collection added",
	"collection.update": "Collection updated",
	"collection.delete": "Collection deleted",
	"collection.detach": "Collection removed from products",
	"collection.reorder": "Collections reordered",
	"tag.create": "Tag added",
	"tag.update": "Tag updated",
	"tag.delete": "Tag deleted",
	"client.create": "Customer link created",
	"client.update": "Customer renamed",
	"client.delete": "Customer deleted",
	"client.status": "Customer link paused or resumed",
	"client.password": "Customer password reset",
	"settings.update": "Settings changed",
	"photo.import": "Photos imported",
	"scrape.fetch": "Supplier page fetched",
	"reactions.compact": "Reactions archived",
	"auth.login": "Signed in",
	"auth.logout": "Signed out",
	"auth.lockout": "Sign-in locked",
	"auth.google": "Google connected"
};
/** The label for an action key; an unknown key reads as words rather than as code. */
function auditLabel(action) {
	return AUDIT_LABELS[action] ?? action.replace(/[._]+/g, " ");
}
//#endregion
//#region src/pages/admin/audit.astro
var audit_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Audit,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Audit = createComponent(async ($$result, $$props, $$slots) => {
	let snapshot;
	let error;
	try {
		snapshot = await fetchAdminSnapshot(getClient(), { logger: consoleLogger });
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("admin audit read failed", { error: safe });
		error = safe.message;
	}
	const rows = snapshot?.audit ?? [];
	const pretty = (s) => {
		if (!s) return "";
		try {
			return JSON.stringify(JSON.parse(s), null, 2);
		} catch {
			return s;
		}
	};
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Activity log",
		"active": "audit"
	}, { "default": ($$result) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result)}<div class="msg err on">Could not read the sheet: ${error}</div>`}<div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Activity log</h1> <p class="page-head__count">
The newest ${rows.length} ${rows.length === 1 ? "change" : "changes"} made in this admin, latest first
</p> </div> </div> <div class="row">  <div class="narrow field"> <label class="field__label" for="f_action">Show</label> <select id="f_action"> <option value="">Everything</option> ${AUDIT_ACTIONS.map((a) => renderTemplate`<option${addAttribute(a, "value")}>${auditLabel(a)}</option>`)} </select> </div> <div class="grow field"> <label class="field__label" for="f_target">Product or customer</label> <input id="f_target" placeholder="e.g. SL-021" autocomplete="off"> </div> </div> <p class="hint" id="count" role="status" aria-live="polite"></p> <div class="table-wrap"> <table id="auditTable"> <thead> <tr> <th>Time</th> <th>Who</th> <th>What</th> <th>Item</th> <th>Changes</th> <th>Note</th> </tr> </thead> <tbody> ${rows.map((a) => renderTemplate`<tr${addAttribute(a.action, "data-action")}${addAttribute(a.targetId.toLowerCase(), "data-target")}${addAttribute(a.row, "data-row")}> <td class="mono"${addAttribute(a.timestamp, "data-ts")}> ${a.timestamp} </td> <td>${a.actor}</td> <td>${auditLabel(a.action)}</td> <td class="mono"> ${a.targetTab} ${a.targetId} </td> <td> ${(a.before || a.after) && renderTemplate`<details> <summary>Show changes</summary> ${a.before && renderTemplate`<pre>${pretty(a.before)}</pre>`} ${a.after && renderTemplate`<pre>${pretty(a.after)}</pre>`} </details>`} </td> <td class="mono">${a.note}</td> </tr>`)} </tbody> </table> </div> ${rows.length === 0 && renderTemplate`<div class="msg busy on">Nothing has changed yet.</div>`}<div class="actions"> <button class="btn btn--secondary" id="btnMore" type="button"${addAttribute(rows.length, "data-offset")}>Load more</button> </div> <div id="m11" class="msg"></div> ${renderScript($$result, "/home/user/Serio-Ludere-Catalog/src/pages/admin/audit.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "/home/user/Serio-Ludere-Catalog/src/pages/admin/audit.astro", void 0);
var $$file = "/home/user/Serio-Ludere-Catalog/src/pages/admin/audit.astro";
var $$url = "/admin/audit";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/audit@_@astro
var page = () => audit_exports;
//#endregion
export { page };
