import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, H as unescapeHTML, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_C45USqpX.mjs";
import { n as templateEnter, r as templateExit, t as $$Modal } from "./Modal_CD4in7gJ.mjs";
import { I as consoleLogger, R as serializeError } from "./parse_CyNL3ky6.mjs";
import { a as adminRuntime } from "./http_friNsH5S.mjs";
import { i as getClient } from "./runtime_BIcTruy2.mjs";
import { _ as clientLink, d as syncLabel, i as fetchAdminSnapshot, x as withoutSecrets } from "./read_CIiVx8tx.mjs";
import { o as jsonForScript } from "./view_CcuJ6q8j.mjs";
import { n as $$Icon, t as $$AdminLayout } from "./AdminLayout_BIeV2zIG.mjs";
import { t as $$CopyButton } from "./CopyButton_PtVdBAqe.mjs";
import { t as $$Button } from "./Button_YI1J549D.mjs";
import { t as $$EmptyState } from "./EmptyState_CyUUQi_h.mjs";
//#region src/components/ui/CredentialPanel.astro
createAstro("https://astro.build");
var $$CredentialPanel = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$CredentialPanel;
	const { url, password, title = "Link created", class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<section${addAttribute(["credential", className], "class:list")}${addAttribute(title, "aria-label")}> <div class="credential__head"> <h2 class="credential__title">${title}</h2> <p class="credential__note">This is the only time the password is shown.</p> </div> <div class="credential__field"> <span class="credential__label" id="cred-url-label">Preview URL</span> <div class="credential__value"> <span data-credential-url>${url}</span> <button type="button" class="credential__copy"${addAttribute(url, "data-copy")} data-copy-what="url" aria-describedby="cred-url-label"> ${renderComponent($$result, "Icon", $$Icon, { "name": "copy" })} <span class="sr-only">Copy preview URL</span> </button> </div> </div> <div class="credential__field"> <span class="credential__label" id="cred-pw-label">Password</span> <div class="credential__value"> <span data-credential-password>${password}</span> <button type="button" class="credential__copy"${addAttribute(password, "data-copy")} data-copy-what="password" aria-describedby="cred-pw-label"> ${renderComponent($$result, "Icon", $$Icon, { "name": "copy" })} <span class="sr-only">Copy password</span> </button> </div> </div> <p class="credential__warning"> ${renderComponent($$result, "Icon", $$Icon, { "name": "alert" })} <span>
Once you close this, the password can only be regenerated — which stops the old one working.
</span> </p> ${renderComponent($$result, "Button", $$Button, {
		"style": "primary",
		"data-copy": `${url}\n${password}`,
		"class": "credential__both"
	}, { "default": ($$result) => renderTemplate`
Copy link and password
` })} </section>`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/ui/CredentialPanel.astro", void 0);
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
	}, { "default": ($$result) => renderTemplate` <p>
Enter the customer's name. We create a private link and a password for them; the password is shown once,
      right after.
</p> <div class="modal__fields">  <div class="row"> <div class="grow field"> <label class="field__label" for="cl_name">Client name</label> <input class="input" id="cl_name" placeholder="e.g. Nadia" autocomplete="off" required> </div> <div class="grow field"> <label class="field__label" for="cl_note">Note (optional)</label> <input class="input" id="cl_note" autocomplete="off"> </div> <div class="grow field"> <label class="field__label" for="cl_pw">Password (optional)</label> <input class="input" id="cl_pw" autocomplete="off" maxlength="200"> </div> <button class="btn btn--primary" id="btnGenerate" type="button">Generate link</button> </div> <p class="hint">
Leave the password blank and one is generated that is easy to read out. If you type your own, use at
        least eight characters.
</p> <div id="m8" class="msg"></div>  <div id="linkOut" class="stack" hidden> ${renderComponent($$result, "CredentialPanel", $$CredentialPanel, {
		"url": "",
		"password": ""
	})} <p class="hint">
Code <span class="mono" id="linkCode"></span> — <span id="linkNote"></span> </p> </div> </div> ` })} <section class="stack" aria-labelledby="h-clients"> <div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Customers</h1> <p class="page-head__count"> ${clients.length} ${clients.length === 1 ? "link" : "links"} </p> </div> <span class="page-head__rule"></span> ${renderComponent($$result, "Button", $$Button, {
		"icon": "plus",
		"data-open": "new-client"
	}, { "default": ($$result) => renderTemplate`New customer link` })} </div> <div id="m9" class="msg"></div> ${clients.length === 0 && renderTemplate`${renderComponent($$result, "EmptyState", $$EmptyState, {
		"type": "first-run",
		"title": "No customer links yet",
		"message": "A customer link is a private preview of the catalogue, opened with a password you give them."
	})}`} <div class="table-wrap"${addAttribute(clients.length === 0, "hidden")}> <table id="clientTable"> <thead> <tr> <th>Customer</th> <th>Link</th> <th>Created</th> <th>Visited</th> <th>Last seen</th> <th>Active</th> <th></th> </tr> </thead> <tbody> ${clients.map((c) => renderTemplate`<tr${addAttribute(c.code, "data-code")}${addAttribute(c.version, "data-version")}${addAttribute(c.status, "data-status")}>  <td> <a${addAttribute(`/admin/clients/${encodeURIComponent(c.code)}`, "href")}>${c.name}</a> </td> <td class="mono"> <a${addAttribute(c.link, "href")} target="_blank" rel="noopener"> ${c.link} <span class="sr-only"> (opens in a new tab)</span> </a> </td> <td>${day(c.createdAt)}</td> <td> <span class="badge" data-visits>
Not visited
</span> </td> <td data-last-seen data-label="Last seen">
—
</td> <td> <label class="toggle"> <input type="checkbox" role="switch" class="toggle__track" data-act="toggle"${addAttribute(c.status === "active", "checked")}${addAttribute(`Link active for ${c.name}`, "aria-label")}> </label> </td> <td class="acts"> ${renderComponent($$result, "CopyButton", $$CopyButton, {
		"value": c.link,
		"label": "Copy link"
	})} <button type="button" class="btn btn--secondary" data-act="password">
Reset password
</button> </td> </tr>`)} </tbody> </table> </div>  ${clients.length > 0 && renderTemplate`<p class="hint">
Send the link together with the password. Use the switch to pause a link, and Reset password if a
          customer loses theirs.
</p>`} </section> <section class="stack" aria-labelledby="h-access"> <h3 id="h-access">Visits</h3> <p class="hint">Every time a customer opens their link. Repeat visits within half an hour count once.</p> <div class="actions"> <button class="btn btn--secondary" id="btnVisits" type="button">Refresh</button> </div> <div id="m11" class="msg"></div> <div id="visitsOut"></div> </section> <section class="stack" aria-labelledby="h-report"> <h3 id="h-report">Likes and dislikes</h3> <div class="actions"> <button class="btn btn--secondary" id="btnReport" type="button">Refresh</button> </div> <div id="m10" class="msg"></div> <div id="reportOut"></div> </section> <dialog id="pwDialog">  <form id="pwDialogForm" class="stack"> <h3 id="pwDialogTitle">Reset password</h3> <p class="hint" id="pwDialogHint">
Leave blank to generate one. The new password replaces the old one straight away and is shown once.
</p>  <label class="field__label" for="pwDialogInput">New password (optional)</label> <input class="input" id="pwDialogInput" type="text" autocomplete="off" aria-describedby="pwDialogHint" maxlength="200"> <p class="msg err" id="pwDialogErr" hidden></p> <div class="actions"> <button class="btn btn--destructive" id="pwDialogOk" type="submit">Set password</button> <button class="btn btn--secondary" id="pwDialogCancel" type="button">Cancel</button> </div> </form> </dialog> <template id="copyTpl">${templateEnter($$result)}${renderComponent($$result, "CopyButton", $$CopyButton, {
		"value": "",
		"label": "Copy link"
	})}${templateExit($$result)}</template> <script type="application/json" id="admin-data">${unescapeHTML(jsonForScript(data))}<\/script>${renderScript($$result, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients.astro", void 0);
var $$file = "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients.astro";
var $$url = "/admin/clients";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/clients@_@astro
var page = () => clients_exports;
//#endregion
export { page };
