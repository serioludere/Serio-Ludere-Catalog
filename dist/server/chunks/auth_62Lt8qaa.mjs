import { i as hashPassword } from "./auth_Dq6XU5lm.mjs";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
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
* Readable over the phone, pasteable into WhatsApp, no ambiguous characters: three lowercase words
* plus two digits, e.g. `amber-loom-serai-47` (brief §10).
*/
var WORDS = [
	"amber",
	"anchor",
	"arbor",
	"aspen",
	"basalt",
	"bazaar",
	"cedar",
	"cinnabar",
	"cobalt",
	"copper",
	"cotton",
	"damask",
	"dune",
	"ember",
	"fennel",
	"flint",
	"garnet",
	"harvest",
	"heather",
	"indigo",
	"ivory",
	"jasper",
	"juniper",
	"kilim",
	"lantern",
	"linen",
	"loom",
	"madder",
	"marble",
	"meadow",
	"mulberry",
	"nomad",
	"ochre",
	"olive",
	"orchard",
	"papyrus",
	"pebble",
	"pergola",
	"pomegranate",
	"quarry",
	"quince",
	"reed",
	"saffron",
	"sandal",
	"serai",
	"sienna",
	"silk",
	"sorrel",
	"sumac",
	"tallow",
	"terrace",
	"thistle",
	"tulip",
	"umber",
	"vellum",
	"walnut",
	"willow",
	"yarrow"
];
/** Hashes a buyer's password under the customer realm's own minimum. */
function hashCustomerPassword(password) {
	return hashPassword(password.trim(), { minLength: 8 });
}
function generatePassword() {
	const pick = () => WORDS[randomInt(WORDS.length)];
	const a = pick();
	let b = pick();
	while (b === a) b = pick();
	let c = pick();
	while (c === a || c === b) c = pick();
	return `${a}-${b}-${c}-${String(randomInt(10, 100))}`;
}
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
export { isReservedSlug as a, verifyCustomerToken as c, hashCustomerPassword as i, customerCookieName as n, makeCustomerToken as o, generatePassword as r, newCustomerSession as s, SLUG_RE as t };
