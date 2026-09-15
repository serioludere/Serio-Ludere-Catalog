import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { l as verifyPassword } from "./auth_Dq6XU5lm.mjs";
import { c as requestIpHash, u as socketAddressOf } from "./api_DdjGbQdl.mjs";
import { a as SITE_SESSION_MS, c as siteCookieName, i as ENTER_PATH, o as makeSiteToken, r as siteRuntime, s as sanitiseSiteNext, u as verifySiteToken } from "./http_CLyIjNV4.mjs";
import { a as STUDIO_NAME, n as STUDIO_EMAIL } from "./prepaint_Cst9YLzz.mjs";
import { n as $$Layout, t as $$Wordmark } from "./Wordmark_D-VDE6el.mjs";
//#region src/pages/enter.astro
var enter_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Enter,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Enter = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Enter;
	Astro.cache?.set(false);
	Astro.response.headers.set("cache-control", "no-store");
	Astro.response.headers.set("x-robots-tag", "noindex, nofollow");
	if (!siteRuntime.enabled) return Astro.redirect("/", 303);
	const { request, cookies, url } = Astro;
	let next = sanitiseSiteNext(url.searchParams.get("next"));
	const cookieName = siteCookieName(siteRuntime.isSecureSite);
	if (siteRuntime.secret !== void 0 && verifySiteToken(cookies.get(cookieName)?.value, siteRuntime.secret, Date.now()) && request.method !== "POST") return Astro.redirect(next, 303);
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
		next = sanitiseSiteNext(form?.get("next") ?? next);
		const ip = requestIpHash(request, socketAddressOf(Astro));
		const check = siteRuntime.throttle.check(ip);
		if (!check.ok) {
			status = 429;
			Astro.response.headers.set("retry-after", String(Math.max(1, check.retryAfterSec)));
			message = `Too many attempts. Wait ${check.retryAfterSec} seconds and try again.`;
		} else if (!siteRuntime.secret) {
			status = 503;
			message = "The catalogue password is not fully set up on this server yet. Please contact the studio.";
		} else if (password && verifyPassword(siteRuntime.passwordHash, password)) {
			siteRuntime.throttle.succeed(ip);
			const now = Date.now();
			cookies.set(cookieName, makeSiteToken(now + SITE_SESSION_MS, siteRuntime.secret), {
				httpOnly: true,
				secure: siteRuntime.isSecureSite,
				sameSite: "lax",
				path: "/",
				maxAge: Math.floor(SITE_SESSION_MS / 1e3)
			});
			return Astro.redirect(next, 303);
		} else {
			const failure = siteRuntime.throttle.fail(ip);
			status = 401;
			if (failure.retryAfterSec) Astro.response.headers.set("retry-after", String(failure.retryAfterSec));
			message = failure.retryAfterSec ? `That password is not correct. Try again in ${failure.retryAfterSec} seconds.` : "That password is not correct.";
		}
	}
	Astro.response.status = status;
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": `${STUDIO_NAME} — Private catalogue`,
		"rates": {
			rates: { USD: 1 },
			symbols: { USD: "$" }
		},
		"data-astro-cid-7zvllphg": true
	}, { "default": ($$result) => renderTemplate` ${maybeRenderHead($$result)}<main class="gate" data-astro-cid-7zvllphg> <div class="gate-card" data-astro-cid-7zvllphg> <a href="/" class="gate-home"${addAttribute(`${STUDIO_NAME} catalogue`, "aria-label")} data-astro-cid-7zvllphg>${renderComponent($$result, "Wordmark", $$Wordmark, { "data-astro-cid-7zvllphg": true })}</a> <p class="eyebrow" data-astro-cid-7zvllphg>Private catalogue</p> <h1 class="gate-title" data-astro-cid-7zvllphg>Enter the password to view the collection</h1> <form method="post"${addAttribute(ENTER_PATH, "action")} class="gate-form" data-astro-cid-7zvllphg> <input type="hidden" name="next"${addAttribute(next, "value")} data-astro-cid-7zvllphg> <label class="sr-only" for="site-password" data-astro-cid-7zvllphg>Password</label> <input class="gate-input" id="site-password" name="password" type="password" placeholder="Password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" required maxlength="200" autofocus data-astro-cid-7zvllphg> <button type="submit" class="gate-go" data-astro-cid-7zvllphg>View the catalogue</button> ${message && renderTemplate`<p class="gate-error" role="alert" data-astro-cid-7zvllphg> ${message} </p>`} </form> <p class="gate-fine" data-astro-cid-7zvllphg>
The password was sent to you by the studio. Questions?${" "} <a${addAttribute(`mailto:${STUDIO_EMAIL}`, "href")} data-astro-cid-7zvllphg>${STUDIO_EMAIL}</a> </p> </div> </main> ` })}`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/enter.astro", void 0);
var $$file = "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/pages/enter.astro";
var $$url = "/enter";
//#endregion
//#region \0virtual:astro:page:src/pages/enter@_@astro
var page = () => enter_exports;
//#endregion
export { page };
