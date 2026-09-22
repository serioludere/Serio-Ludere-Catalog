import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_BvvdUsTx.mjs";
import { Dt as GOOGLE_OAUTH_CLIENT_ID, Et as GOOGLE_AUTH_MODE, a as getGoogleConnection, at as googleAuthAdvice, c as getSheetIdStore, m as sheetIdIfAny, o as getGoogleStore, ot as missingScopes, st as redirectUriFor } from "./runtime_BSzjHQXl.mjs";
import { a as adminRuntime } from "./http_CvlaKNqx.mjs";
import { t as $$AdminLayout } from "./AdminLayout_D0uOZ6fo.mjs";
import { t as $$Button } from "./Button_fKkBf3B1.mjs";
import { t as $$Input } from "./Input_Be4hbiSh.mjs";
//#region src/pages/admin/google.astro
var google_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Google,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Google = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Google;
	const mode = GOOGLE_AUTH_MODE;
	const health = getGoogleConnection()?.health();
	const store = getGoogleStore();
	const redirectUri = redirectUriFor(adminRuntime.siteUrl);
	const configured = Boolean(GOOGLE_OAUTH_CLIENT_ID);
	const scopesKnown = health?.source === "stored";
	const missing = scopesKnown ? missingScopes(health.scopes) : [];
	const advice = health?.connected ? googleAuthAdvice(health.scopes, { scopesKnown }) : [];
	const outcome = Astro.url.searchParams.get("google");
	const detail = (Astro.url.searchParams.get("detail") ?? "").slice(0, 200);
	const message = outcome ? {
		connected: "Connected. The site will keep itself signed in from here.",
		denied: "You cancelled, or Google refused the request.",
		expired: "That authorisation took too long or was already used.",
		bad_state: "The reply did not match the request, so it was rejected.",
		no_code: "Google sent no authorisation code.",
		not_configured: "The OAuth client id and secret are not set.",
		failed: "The exchange with Google failed."
	}[outcome] ?? "Something went wrong." : void 0;
	const sheetOutcome = Astro.url.searchParams.get("sheet");
	const sheetMessage = sheetOutcome ? {
		created: "Your catalogue sheet was created in your Google Drive, and the site is reading it.",
		failed: "The catalogue sheet could not be created automatically.",
		skipped: "The catalogue sheet was not created automatically."
	}[sheetOutcome] ?? void 0 : void 0;
	const sheetId = sheetIdIfAny();
	const sheetStore = getSheetIdStore();
	const storedSheet = sheetStore.read();
	const sheetFromEnv = Boolean(sheetId && !storedSheet);
	Boolean(health?.connected) && !sheetId && sheetStore.durable;
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Google",
		"active": "google"
	}, { "default": ($$result) => renderTemplate` ${maybeRenderHead($$result)}<div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Google</h1> <p class="page-head__count">
The account this site reads the sheet and Drive with, and the catalogue sheet itself.
</p> </div> </div> ${message && renderTemplate`<div${addAttribute([
		"msg",
		"on",
		outcome === "connected" ? "ok" : "err"
	], "class:list")}> ${message} ${sheetOutcome ? "" : detail} </div>`}${sheetMessage && renderTemplate`<div${addAttribute([
		"msg",
		"on",
		sheetOutcome === "created" ? "ok" : "err"
	], "class:list")}> ${sheetMessage} ${detail} </div>`}<section class="stack" aria-labelledby="h-google"> <h3 id="h-google">Google account</h3> ${mode === "service_account" ? renderTemplate`<p class="hint">
This site signs in to Google with a server key, so there is nothing to connect here.
</p>` : !configured ? renderTemplate`<p class="hint">
Google sign-in has not been set up on this server yet. Ask your developer to add the Google client
          details.
</p>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <dl class="kv"> <div> <dt>Status</dt> <dd${addAttribute(["status", health?.connected ? "active" : "revoked"], "class:list")}> ${health?.connected ? "connected" : "not connected"} </dd> </div> ${health?.account && renderTemplate`<div> <dt>Account</dt> <dd class="mono">${health.account}</dd> </div>`} <div> <dt>Permissions</dt> <dd class="mono"> ${health?.scopes.length ? health.scopes.join(" ") : scopesKnown ? "—" : "not recorded (connected on the server)"} </dd> </div> <div> <dt>Connected</dt> <dd class="mono">${health?.connectedAt ?? "—"}</dd> </div> <div> <dt>Last used</dt> <dd class="mono">${health?.lastRefreshAt ?? "never"}</dd> </div> <div> <dt>Connected via</dt> <dd>${health?.source === "stored" ? "this page" : "the server"}</dd> </div> </dl> ${health?.lastError && renderTemplate`<div class="msg err on">Last problem: ${health.lastError}</div>`} ${missing.length > 0 && renderTemplate`<div class="msg err on">
Google did not grant everything the site needs. Connect again and approve both permissions.
</div>`} ${health?.connected && !scopesKnown && renderTemplate`<p class="hint">
This connection was set up on the server, so the site cannot show which permissions it has.
              Press Reconnect to connect from here instead.
</p>`} ${!store.durable && renderTemplate`<div class="msg busy on">
This server cannot keep the connection after a restart. Ask your developer to enable persistent
              storage.
</div>`} <div class="actions"> <a class="btn btn--primary" href="/api/admin/google/start?next=/admin/google"> ${health?.connected ? "Reconnect" : "Connect Google account"} </a> ${health?.connected && renderTemplate`<button class="btn btn--destructive" id="btnDisconnect" type="button">
Disconnect
</button>`} </div> <div id="m12" class="msg"></div> <h4>How long it lasts</h4> <ul class="hint"> ${(advice.length ? advice : googleAuthAdvice([], { scopesKnown: false })).map((line) => renderTemplate`<li>${line}</li>`)} </ul> <h4>First-time setup</h4> <p class="hint">
Before connecting for the first time, your developer must register this address with Google:
</p> <div class="row">  <div class="grow field"> <label class="field__label" for="redirectUri">
Authorised redirect URI
</label> <input id="redirectUri" readonly${addAttribute(redirectUri, "value")}> </div> <button class="btn btn--secondary" id="btnCopyRedirect" type="button">
Copy
</button> </div> ` })}`} </section> <section class="stack" aria-labelledby="h-sheet"> <h3 id="h-sheet">Catalogue sheet</h3> ${sheetId ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <p class="hint"> ${sheetFromEnv ? "The catalogue sheet is configured on the server." : `Created ${storedSheet?.createdAt?.slice(0, 10) ?? ""}${storedSheet?.createdBy ? ` in ${storedSheet.createdBy}` : ""}.`} </p> <p class="hint"> <a${addAttribute(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`, "href")} target="_blank" rel="noopener">
Open the sheet in Google Sheets
</a> </p> ` })}` : !health?.connected ? renderTemplate`<p class="hint">Connect a Google account first — the catalogue is created in that account’s Drive.</p>` : !sheetStore.durable ? renderTemplate`<div class="msg err on">
This server cannot remember a new sheet after a restart, so one cannot be created here. Ask your
          developer to enable persistent storage.
</div>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <p class="hint">
No catalogue sheet yet. One is normally created the moment a Google account is connected; if that
            did not happen, create it now. It starts empty.
</p> <div class="row"> <div class="grow"> ${renderComponent($$result, "Input", $$Input, {
		"type": "text",
		"id": "sheetTitle",
		"name": "title",
		"label": "Name it in your Drive",
		"value": "Serio Ludere — Catalogue"
	})} </div> </div> <div class="actions"> ${renderComponent($$result, "Button", $$Button, {
		"id": "btnCreateSheet",
		"style": "primary"
	}, { "default": ($$result) => renderTemplate`
Create the catalogue sheet
` })} </div> <div id="mSheet" class="msg"></div> ` })}`} </section> ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/google.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/google.astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/google.astro";
var $$url = "/admin/google";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/google@_@astro
var page = () => google_exports;
//#endregion
export { page };
