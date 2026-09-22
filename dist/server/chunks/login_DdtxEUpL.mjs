import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { a as newSession, c as verifyPassword, s as setSessionCookie } from "./auth_BsQZppy5.mjs";
import { a as adminRuntime, u as recordAuditEvent } from "./http_CvlaKNqx.mjs";
import { c as requestIpHash, u as socketAddressOf } from "./api_BVj6xXfj.mjs";
import { t as $$AdminLogo } from "./AdminLogo_C8kWy55S.mjs";
import { t as $$AdminLayout } from "./AdminLayout_4LOaUeJu.mjs";
import { t as $$Button } from "./Button_D7csSVX1.mjs";
import { t as $$Input } from "./Input_CV0MlJh-.mjs";
//#region src/lib/admin/login.ts
/** Only `/admin`, `/admin/...` with url-safe segments may be a post-login destination. */
var NEXT_RE = /^\/admin(\/[A-Za-z0-9_\-/]*)?$/;
function sanitiseNext(value, fallback = "/admin") {
	if (typeof value !== "string") return fallback;
	const v = value.trim();
	if (!NEXT_RE.test(v) || v.startsWith("//") || v === "/admin/login" || v === "/admin/logout") return fallback;
	return v;
}
//#endregion
//#region src/pages/admin/login.astro
var login_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Login,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Login = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Login;
	const { request, cookies, locals, url } = Astro;
	if (!adminRuntime.configured) return new Response("Not found", {
		status: 404,
		headers: { "cache-control": "no-store" }
	});
	let next = sanitiseNext(url.searchParams.get("next"));
	if (locals.admin) return Astro.redirect(next, 303);
	let message = "";
	let status = 200;
	if (request.method === "POST") {
		let form;
		try {
			form = await request.formData();
		} catch {
			form = void 0;
		}
		const password = String(form?.get("password") ?? "");
		next = sanitiseNext(form?.get("next") ?? next);
		if (verifyPassword(adminRuntime.passwordHash, password)) {
			const now = Date.now();
			const session = newSession(adminRuntime.user, now);
			setSessionCookie(cookies, session, adminRuntime.secret, adminRuntime.isSecureSite, now);
			await recordAuditEvent({
				action: "auth.login",
				targetTab: "-",
				targetId: adminRuntime.user,
				ipHash: requestIpHash(request, socketAddressOf(Astro)),
				requestId: locals.requestId ?? "none",
				after: {
					user: adminRuntime.user,
					absoluteExpiry: new Date(session.abs).toISOString()
				}
			});
			return Astro.redirect(next, 303);
		}
		status = 401;
		message = "That password is not correct.";
	}
	Astro.response.status = status;
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Admin login",
		"nav": false,
		"sub": "Admin — sign in",
		"mode": "admin-dark",
		"data-astro-cid-xeimgta2": true
	}, { "default": ($$result) => renderTemplate`  ${maybeRenderHead($$result)}<form method="post" action="/admin/login" class="alogin" data-astro-cid-xeimgta2> <input type="hidden" name="next"${addAttribute(next, "value")} data-astro-cid-xeimgta2> <div class="alogin__brand" data-astro-cid-xeimgta2> ${renderComponent($$result, "AdminLogo", $$AdminLogo, { "data-astro-cid-xeimgta2": true })} </div> ${renderComponent($$result, "Input", $$Input, {
		"type": "password",
		"name": "password",
		"label": "Password",
		"hideLabel": true,
		"placeholder": "Password",
		"autocomplete": "current-password",
		"required": true,
		"error": message || void 0,
		"data-astro-cid-xeimgta2": true
	})} ${renderComponent($$result, "Button", $$Button, {
		"type": "submit",
		"style": "primary",
		"class": "alogin__go",
		"data-astro-cid-xeimgta2": true
	}, { "default": ($$result) => renderTemplate`Enter` })} </form> ` })}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/login.astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/login.astro";
var $$url = "/admin/login";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/login@_@astro
var page = () => login_exports;
//#endregion
export { page };
