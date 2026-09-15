import { U as AUTH_SECRET, V as ADMIN_SESSION_SECRET, lt as SITE_PASSWORD_HASH, rt as PUBLIC_CATALOGUE } from "./parse_CyNL3ky6.mjs";
import { f as RateLimiter, i as isSecureSite } from "./api_DdjGbQdl.mjs";
import { t as LoginThrottle } from "./login_DZT9bjRi.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
//#region src/lib/site/gate.ts
/** 30 days: long enough that a client who bookmarked the catalogue is not asked again every visit. */
var SITE_SESSION_MS = 2592e6;
var ENTER_PATH = "/enter";
var MAX_TOKEN_LENGTH = 256;
/** The public catalogue's prefixes; `/` itself is matched separately. */
var GATED_PREFIXES = [
	"/rugs",
	"/tags",
	"/api/catalogue"
];
function siteGateEnabled(config) {
	return Boolean(config.passwordHash) && config.publicCatalogue;
}
/** `/rugs/x/` and `/rugs/x` are the same path. */
function normalise(pathname) {
	return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}
/** Is this one of the public catalogue's own paths? Everything else is another gate's business. */
function isGatedPath(pathname) {
	const path = normalise(pathname);
	if (path === "" || path === "/") return true;
	return GATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
/** `__Host-` requires Secure, so the plain name is used on http (local development). */
function siteCookieName(secure) {
	return `${secure ? "__Host-" : ""}sl_site`;
}
function sign(payload, secret) {
	return createHmac("sha256", `${secret}:site`).update(payload).digest();
}
function makeSiteToken(exp, secret) {
	const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
	return `${payload}.${sign(payload, secret).toString("base64url")}`;
}
function verifySiteToken(token, secret, now) {
	if (!token || token.length > MAX_TOKEN_LENGTH) return false;
	const dot = token.indexOf(".");
	if (dot <= 0) return false;
	const payload = token.slice(0, dot);
	let given;
	try {
		given = Buffer.from(token.slice(dot + 1), "base64url");
	} catch {
		return false;
	}
	const expected = sign(payload, secret);
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
	let session;
	try {
		session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
	} catch {
		return false;
	}
	return typeof session?.exp === "number" && session.exp > now;
}
/**
* Where to send the visitor after the password. Only a gated catalogue PAGE qualifies — never a
* protocol-relative address, never another host, never an API route — and the fallback is `/`.
*/
function sanitiseSiteNext(value) {
	if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
	if (/[\\\s]/.test(value)) return "/";
	let url;
	try {
		url = new URL(value, "http://site.invalid");
	} catch {
		return "/";
	}
	if (url.host !== "site.invalid") return "/";
	if (!isGatedPath(url.pathname) || url.pathname.startsWith("/api/")) return "/";
	return `${url.pathname}${url.search}`;
}
function siteGate(context, config) {
	if (!siteGateEnabled(config)) return { kind: "open" };
	const path = context.url.pathname;
	if (!isGatedPath(path)) return { kind: "open" };
	const token = context.cookies.get(siteCookieName(config.isSecureSite))?.value;
	if (config.secret && verifySiteToken(token, config.secret, (config.now ?? Date.now)())) return { kind: "allowed" };
	if (normalise(path).startsWith("/api/")) return { kind: "api-denied" };
	return {
		kind: "login",
		next: `${path}${context.url.search}`
	};
}
//#endregion
//#region src/lib/site/http.ts
var usable = (value) => value && value.length >= 32 ? value : void 0;
var passwordHash = SITE_PASSWORD_HASH === "none" ? void 0 : SITE_PASSWORD_HASH || "scrypt.131072.8.1.IMHvboVJfSuxiYytvCqofg.DFOwDF8d9KvJ9soupOt_3W1ThAmeay1CLslAc57Km3SQDeXmnCJRNBvJxQ2wTBT9Uo-jomZmlLWaH0LYhDQz8w";
var secret = usable(AUTH_SECRET) ?? usable(ADMIN_SESSION_SECRET);
var publicCatalogue = PUBLIC_CATALOGUE ?? true;
var siteRuntime = {
	passwordHash,
	secret,
	publicCatalogue,
	isSecureSite,
	/** True when the public catalogue asks for the site password. */
	enabled: siteGateEnabled({
		passwordHash,
		publicCatalogue
	}),
	/** Its own limiter: a visitor's failed guesses can never lock the owner out of /admin. */
	throttle: new LoginThrottle(new RateLimiter({ maxKeys: 2e3 }))
};
if (siteRuntime.enabled && !secret) console.warn("[site] SITE_PASSWORD_HASH is set but neither AUTH_SECRET nor ADMIN_SESSION_SECRET (≥ 32 characters) is: nobody can enter the catalogue until one is set.");
function siteGateConfig() {
	return {
		passwordHash: siteRuntime.passwordHash,
		secret: siteRuntime.secret,
		publicCatalogue: siteRuntime.publicCatalogue,
		isSecureSite: siteRuntime.isSecureSite
	};
}
/**
* The route-cache policy for a public catalogue page. A cache HIT bypasses the middleware
* (docs/ADR.md), so a cached `/` would be handed to anyone once one visitor had entered the
* password. With the gate on, the public pages are simply not cached.
*/
function publicCachePolicy() {
	return siteRuntime.enabled ? false : {
		maxAge: 60,
		swr: 60,
		tags: ["sheet"]
	};
}
//#endregion
export { SITE_SESSION_MS as a, siteCookieName as c, ENTER_PATH as i, siteGate as l, siteGateConfig as n, makeSiteToken as o, siteRuntime as r, sanitiseSiteNext as s, publicCachePolicy as t, verifySiteToken as u };
