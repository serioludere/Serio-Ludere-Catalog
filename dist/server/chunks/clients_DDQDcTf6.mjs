import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, H as unescapeHTML, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_BUAFLNaU.mjs";
import { n as templateExit, t as templateEnter } from "./template-depth_DHN7yctw.mjs";
import { i as getClient, vt as consoleLogger, yt as serializeError } from "./runtime_BSzjHQXl.mjs";
import { a as adminRuntime } from "./http_CvlaKNqx.mjs";
import { h as clientLink, i as fetchAdminSnapshot, u as syncLabel, y as withoutSecrets } from "./read_3DJW8o0r.mjs";
import { o as jsonForScript } from "./view_CMarAg1H.mjs";
import { n as $$Icon, t as $$AdminLayout } from "./AdminLayout_4LOaUeJu.mjs";
import { t as $$CopyButton } from "./CopyButton_R2a6usqL.mjs";
import { t as $$Button } from "./Button_D7csSVX1.mjs";
import { n as $$Modal, t as $$EmptyState } from "./EmptyState_CMPkBFH5.mjs";
//#region src/components/ui/CredentialPanel.astro
createAstro("https://astro.build");
var $$CredentialPanel = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$CredentialPanel;
	const { url, title = "Link created", class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<section${addAttribute(["credential", className], "class:list")}${addAttribute(title, "aria-label")}> <div class="credential__head"> <h2 class="credential__title">${title}</h2> <p class="credential__note">Send this to the buyer; they sign in with the catalogue password.</p> </div> <div class="credential__field"> <span class="credential__label" id="cred-url-label">Preview URL</span> <div class="credential__value"> <span data-credential-url>${url}</span> <button type="button" class="credential__copy"${addAttribute(url, "data-copy")} data-copy-what="url" aria-describedby="cred-url-label"> ${renderComponent($$result, "Icon", $$Icon, { "name": "copy" })} <span class="sr-only">Copy preview URL</span> </button> </div> </div> ${renderComponent($$result, "Button", $$Button, {
		"style": "primary",
		"data-copy": url,
		"data-copy-what": "both",
		"class": "credential__both"
	}, { "default": ($$result) => renderTemplate` Copy link ` })} </section>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/ui/CredentialPanel.astro", void 0);
//#endregion
//#region src/pages/admin/clients.astro
var clients_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Clients,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Clients = createComponent(async ($$result, $$props, $$slots) => {
	let snapshot;
	let error;
	try {
		snapshot = await fetchAdminSnapshot(getClient(), { logger: consoleLogger });
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("admin clients read failed", { error: safe });
		error = safe.message;
	}
	const clients = (snapshot?.clients ?? []).map((c) => ({
		...withoutSecrets(c),
		link: clientLink(adminRuntime.siteUrl, c.code)
	}));
	const data = {
		clients,
		siteOrigin: new URL(adminRuntime.siteUrl).origin
	};
	const day = (iso) => {
		const t = Date.parse(iso);
		return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric"
		}) : iso;
	};
	const syncLabel_ = snapshot ? syncLabel(snapshot.fetchedAt) : void 0;
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Customers",
		"active": "clients",
		"meta": syncLabel_
	}, { "default": ($$result) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result)}<div class="msg err on">Could not read the sheet: ${error}</div>`}${renderComponent($$result, "Modal", $$Modal, {
		"id": "new-client",
		"title": "New customer link"
	}, { "default": ($$result) => renderTemplate` <p>Enter the customer's name. We create a private link for them, shown right after.</p> <div class="modal__fields">  <div class="row"> <div class="grow field"> <label class="field__label" for="cl_name">Client name</label> <input class="input" id="cl_name" placeholder="e.g. Nadia" autocomplete="off" required> </div> <button class="btn btn--primary" id="btnGenerate" type="button">Generate link</button> </div>  <p class="hint">The buyer opens this link and signs in with the studio's catalogue password.</p> <div id="m8" class="msg"></div> <div id="linkOut" class="stack" hidden> ${renderComponent($$result, "CredentialPanel", $$CredentialPanel, { "url": "" })} <p class="hint">
Code <span class="mono" id="linkCode"></span> — <span id="linkNote"></span> </p> </div> </div> ` })} <section class="stack" aria-labelledby="h-clients"> <div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Customers</h1> <p class="page-head__count"> ${clients.length} ${clients.length === 1 ? "link" : "links"} </p> </div> <span class="page-head__rule"></span> ${renderComponent($$result, "Button", $$Button, {
		"icon": "plus",
		"data-open": "new-client"
	}, { "default": ($$result) => renderTemplate`New customer link` })} </div> <div id="m9" class="msg"></div> ${clients.length === 0 && renderTemplate`${renderComponent($$result, "EmptyState", $$EmptyState, {
		"type": "first-run",
		"title": "No customer links yet",
		"message": "A customer link is a private preview of the catalogue, opened with a password you give them."
	})}`} <div class="table-wrap"${addAttribute(clients.length === 0, "hidden")}> <table id="clientTable"> <thead> <tr> <th>Customer</th> <th>Link</th> <th>Created</th> <th>Active</th> <th></th> </tr> </thead> <tbody> ${clients.map((c) => renderTemplate`<tr${addAttribute(c.code, "data-code")}${addAttribute(c.version, "data-version")}${addAttribute(c.status, "data-status")}>  <td> <a${addAttribute(`/admin/clients/${encodeURIComponent(c.code)}`, "href")}>${c.name}</a> </td> <td class="mono"> <a${addAttribute(c.link, "href")} target="_blank" rel="noopener"> ${c.link} <span class="sr-only"> (opens in a new tab)</span> </a> </td> <td>${day(c.createdAt)}</td> <td> <label class="toggle"> <input type="checkbox" role="switch" class="toggle__track" data-act="toggle"${addAttribute(c.status === "active", "checked")}${addAttribute(`Link active for ${c.name}`, "aria-label")}> </label> </td> <td class="acts"> ${renderComponent($$result, "CopyButton", $$CopyButton, {
		"value": c.link,
		"label": "Copy link"
	})} <button type="button" class="btn btn--secondary" data-act="rename">
Rename
</button> <button type="button" class="btn btn--destructive" data-act="delete">
Delete
</button> </td> </tr>`)} </tbody> </table> </div>  ${clients.length > 0 && renderTemplate`<p class="hint">
Send the buyer their link. Use the switch to pause one without removing it; Delete takes the row out
          of the sheet for good.
</p>`} </section> <section class="stack" aria-labelledby="h-report"> <h3 id="h-report">Likes and dislikes</h3> <div class="actions"> <button class="btn btn--secondary" id="btnReport" type="button">Refresh</button> </div> <div id="m10" class="msg"></div> <div id="reportOut"></div> </section> <dialog id="renameDialog"> <form id="renameDialogForm" class="stack"> <h3 id="renameDialogTitle">Rename customer</h3> <p class="hint" id="renameDialogHint">
The preview link never changes, so a rename costs the buyer nothing.
</p> <label class="field__label" for="renameDialogInput">Client name</label> <input class="input" id="renameDialogInput" type="text" autocomplete="off" aria-describedby="renameDialogHint" maxlength="60" required> <p class="msg err" id="renameDialogErr" hidden></p> <div class="actions"> <button class="btn btn--primary" id="renameDialogOk" type="submit">Save name</button> <button class="btn btn--secondary" id="renameDialogCancel" type="button">Cancel</button> </div> </form> </dialog> <template id="copyTpl">${templateEnter($$result)}${renderComponent($$result, "CopyButton", $$CopyButton, {
		"value": "",
		"label": "Copy link"
	})}${templateExit($$result)}</template> <script type="application/json" id="admin-data">${unescapeHTML(jsonForScript(data))}<\/script>${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients.astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients.astro";
var $$url = "/admin/clients";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/clients@_@astro
var page = () => clients_exports;
//#endregion
export { page };
