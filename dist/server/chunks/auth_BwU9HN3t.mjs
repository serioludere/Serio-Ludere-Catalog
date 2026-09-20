import { createHmac, timingSafeEqual } from "node:crypto";
//#region src/lib/customer/auth.ts
/** Slugs the customer realm may never occupy: they are real routes or asset prefixes (brief §10). */
var RESERVED_SLUGS = [
	"admin",
	"api",
	"login",
	"logout",
	"enter",
	"_astro",
	"_image",
	"assets",
	"favicon.ico",
	"robots.txt",
	"sitemap.xml",
	"rugs",
	"tags"
];
var SLUG_RE = /^[a-z0-9](?:[a-z0-9\-_]{0,38}[a-z0-9])?$/;
function isReservedSlug(slug) {
	return RESERVED_SLUGS.includes(slug.toLowerCase());
}
/**
* Every buyer unlocks their `/{slug}` preview with this same password (owner, 2026-09-16: one
* password for the whole customer realm, so there is nothing to generate or read down a phone per
* buyer). Built in so a plain `git push` deploys it — the same pattern as the public catalogue's
* site-password constant this project used to have. To change it: hash the new password with
* `hashCustomerPassword()` and paste the result here.
*/
var CUSTOMER_SHARED_PASSWORD_HASH = "scrypt.131072.8.1._g1oMyCXpynil-UjMkRV6A.kDE0E3MbOAELEnV1TaVusK2eaqPCuAuUDNDNelCU-_0pt7QrRp6WrxyL9Tcb55vZ9xuy0gKNz_Q3-xQIqdtBGw";
/** 7 days, matching the admin's absolute window (brief §10). */
var CUSTOMER_SESSION_MS = 6048e5;
var MAX_TOKEN_LENGTH = 512;
/**
* One cookie per slug, so a cookie for `hala` is never even sent to `/nadia`. `__Host-` requires
* Secure, so plain names are used on http (local development).
*/
function customerCookieName(slug, secure) {
	return `${secure ? "__Host-" : ""}sl_c_${slug}`;
}
function sign(payload, secret, slug) {
	return createHmac("sha256", `${secret}:customer:${slug}`).update(payload).digest();
}
function makeCustomerToken(session, secret) {
	const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
	return `${payload}.${sign(payload, secret, session.slug).toString("base64url")}`;
}
function verifyCustomerToken(token, slug, secret, now) {
	if (!token || token.length > MAX_TOKEN_LENGTH) return void 0;
	const dot = token.indexOf(".");
	if (dot <= 0) return void 0;
	const payload = token.slice(0, dot);
	let given;
	try {
		given = Buffer.from(token.slice(dot + 1), "base64url");
	} catch {
		return;
	}
	const expected = sign(payload, secret, slug);
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return void 0;
	let session;
	try {
		session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
	} catch {
		return;
	}
	if (typeof session?.slug !== "string" || typeof session?.exp !== "number") return void 0;
	if (session.slug !== slug) return void 0;
	if (session.exp <= now) return void 0;
	return session;
}
function newCustomerSession(slug, now) {
	return {
		slug,
		exp: now + CUSTOMER_SESSION_MS
	};
}
//#endregion
export { makeCustomerToken as a, isReservedSlug as i, SLUG_RE as n, newCustomerSession as o, customerCookieName as r, verifyCustomerToken as s, CUSTOMER_SHARED_PASSWORD_HASH as t };
