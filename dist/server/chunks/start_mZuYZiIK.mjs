import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { Z as GOOGLE_OAUTH_CLIENT_ID } from "./parse_CyNL3ky6.mjs";
import { a as adminRuntime, d as requireSession, l as methodNotAllowed } from "./http_friNsH5S.mjs";
import { o as noStore } from "./api_DdjGbQdl.mjs";
import { A as createState, F as redirectUriFor, O as buildAuthUrl, k as createPkce } from "./runtime_BIcTruy2.mjs";
import { i as sanitiseNext, n as HANDSHAKE_COOKIE, r as HANDSHAKE_TTL_MS, t as handshakes } from "./runtime_DN2CDJRW.mjs";
//#region src/pages/api/admin/google/start.ts
var start_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	prerender: () => false
});
var GET = async (context) => {
	requireSession(context);
	if (!GOOGLE_OAUTH_CLIENT_ID) return noStore({
		ok: false,
		error: "not configured",
		message: "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set before connecting."
	}, 503);
	const redirectUri = redirectUriFor(adminRuntime.siteUrl);
	const { verifier, challenge } = createPkce();
	const state = createState();
	const id = handshakes.create({
		state,
		verifier,
		redirectUri,
		next: sanitiseNext(context.url.searchParams.get("next"))
	});
	context.cookies.set(HANDSHAKE_COOKIE, id, {
		httpOnly: true,
		secure: adminRuntime.isSecureSite,
		sameSite: "lax",
		path: "/",
		maxAge: Math.floor(HANDSHAKE_TTL_MS / 1e3)
	});
	return context.redirect(buildAuthUrl({
		clientId: GOOGLE_OAUTH_CLIENT_ID,
		redirectUri,
		state,
		challenge
	}), 302);
};
var ALL = methodNotAllowed("GET");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/google/start@_@ts
var page = () => start_exports;
//#endregion
export { page };
