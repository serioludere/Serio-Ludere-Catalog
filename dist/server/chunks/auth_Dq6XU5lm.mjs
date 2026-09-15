import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
//#region src/lib/admin/auth.ts
var HASH_RE = /^scrypt\.(\d{1,9})\.(\d{1,3})\.(\d{1,3})\.([A-Za-z0-9_-]{16,})\.([A-Za-z0-9_-]{80,})$/;
/** OWASP parameters; the default `maxmem` throws at N = 2^17, so it is always passed explicitly. */
var SCRYPT_DEFAULTS = {
	N: 2 ** 17,
	r: 8,
	p: 1
};
/** Upper bounds so a corrupt or hostile hash string can never make verification allocate gigabytes. */
var MAX_N = 2 ** 20;
var MAX_R = 32;
var MAX_P = 16;
function maxmem(N, r) {
	return Math.max(33554432, 128 * N * r * 2);
}
function parseHash(str) {
	if (!str) return void 0;
	const m = HASH_RE.exec(str.trim());
	if (!m) return void 0;
	const N = Number(m[1]);
	const r = Number(m[2]);
	const p = Number(m[3]);
	if (!Number.isInteger(N) || N < 2 || N > MAX_N || (N & N - 1) !== 0) return void 0;
	if (r < 1 || r > MAX_R || p < 1 || p > MAX_P) return void 0;
	const salt = Buffer.from(m[4], "base64url");
	const key = Buffer.from(m[5], "base64url");
	if (salt.length < 8 || key.length !== 64) return void 0;
	return {
		N,
		r,
		p,
		salt,
		key
	};
}
/**
* Derives a new hash string for `password` (scripts/admin-password.ts). Small `N` only for tests.
* `minLength` lets the customer realm apply its own, shorter floor without a second implementation.
*/
function hashPassword(password, params = {}) {
	const min = params.minLength ?? 12;
	if (typeof password !== "string" || password.length < min) throw new Error(`password must be at least ${min} characters`);
	const N = params.N ?? SCRYPT_DEFAULTS.N;
	const r = params.r ?? SCRYPT_DEFAULTS.r;
	const p = params.p ?? SCRYPT_DEFAULTS.p;
	const salt = randomBytes(16);
	const key = scryptSync(password, salt, 64, {
		N,
		r,
		p,
		maxmem: maxmem(N, r)
	});
	return `scrypt.${N}.${r}.${p}.${salt.toString("base64url")}.${key.toString("base64url")}`;
}
/** Re-derives with the parameters carried by the hash and compares the 64-byte keys in constant time. */
function verifyPassword(hash, password) {
	const parsed = parseHash(hash);
	if (!parsed || typeof password !== "string" || password.length === 0) return false;
	const derived = scryptSync(password, parsed.salt, 64, {
		N: parsed.N,
		r: parsed.r,
		p: parsed.p,
		maxmem: maxmem(parsed.N, parsed.r)
	});
	return derived.length === parsed.key.length && timingSafeEqual(derived, parsed.key);
}
var IDLE_MS = 432e5;
var ABSOLUTE_MS = 6048e5;
/** A token older than this is re-issued on the next request (sliding idle window). */
var REISSUE_AFTER_MS = 36e5;
var SID_RE = /^[a-f0-9]{32}$/;
var MAX_TOKEN_LENGTH = 1024;
var MAX_USER_LENGTH = 64;
/** Tolerated clock skew for `iat` in the future (ms). */
var SKEW_MS = 6e4;
function sign(payload, secret) {
	return createHmac("sha256", secret).update(payload).digest();
}
function makeToken(session, secret) {
	if (!secret) throw new Error("makeToken: empty secret");
	const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
	return `${payload}.${sign(payload, secret).toString("base64url")}`;
}
/**
* Verifies the signature (constant time, on the two 32-byte digests), the shape, the idle and
* absolute expiries and the revocation list. Returns the session or undefined; never throws.
*/
function verifyToken(token, secret, now, revoked) {
	if (!token || !secret || token.length > MAX_TOKEN_LENGTH) return void 0;
	const dot = token.indexOf(".");
	if (dot <= 0 || dot === token.length - 1) return void 0;
	const payload = token.slice(0, dot);
	const given = Buffer.from(token.slice(dot + 1), "base64url");
	const expected = sign(payload, secret);
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return void 0;
	let parsed;
	try {
		parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
	} catch {
		return;
	}
	if (!parsed || typeof parsed !== "object") return void 0;
	const s = parsed;
	if (typeof s.sid !== "string" || !SID_RE.test(s.sid)) return void 0;
	if (typeof s.user !== "string" || s.user.length === 0 || s.user.length > MAX_USER_LENGTH) return void 0;
	if (![
		s.iat,
		s.exp,
		s.abs
	].every((n) => typeof n === "number" && Number.isFinite(n))) return void 0;
	const session = {
		sid: s.sid,
		user: s.user,
		iat: s.iat,
		exp: s.exp,
		abs: s.abs
	};
	if (session.iat > now + SKEW_MS) return void 0;
	if (now >= session.exp || now >= session.abs) return void 0;
	if (revoked?.isRevoked(session.sid, now)) return void 0;
	return session;
}
function newSession(user, now) {
	const abs = now + ABSOLUTE_MS;
	return {
		sid: randomBytes(16).toString("hex"),
		user,
		iat: now,
		exp: Math.min(now + IDLE_MS, abs),
		abs
	};
}
/** Sliding window: fresh `iat`/`exp`, same `sid` and `abs`. */
function refreshSession(session, now) {
	return {
		...session,
		iat: now,
		exp: Math.min(now + IDLE_MS, session.abs)
	};
}
function needsReissue(session, now) {
	return now - session.iat >= REISSUE_AFTER_MS;
}
/** In-process revocation list: a logged-out `sid` stays refused until its absolute expiry. */
var Revocations = class {
	until = /* @__PURE__ */ new Map();
	maxSize;
	constructor(maxSize = 1e4) {
		this.maxSize = maxSize;
	}
	revoke(sid, absMs) {
		this.until.set(sid, absMs);
		if (this.until.size > this.maxSize) this.prune(Date.now());
	}
	isRevoked(sid, now) {
		const t = this.until.get(sid);
		if (t === void 0) return false;
		if (now >= t) {
			this.until.delete(sid);
			return false;
		}
		return true;
	}
	get size() {
		return this.until.size;
	}
	prune(now) {
		for (const [sid, t] of this.until) if (now >= t) this.until.delete(sid);
	}
};
function adminCookieName(isSecureSite) {
	return isSecureSite ? "__Host-sl_admin" : "sl_admin";
}
function setSessionCookie(cookies, session, secret, isSecureSite, now) {
	cookies.set(adminCookieName(isSecureSite), makeToken(session, secret), {
		httpOnly: true,
		secure: isSecureSite,
		sameSite: "lax",
		path: "/",
		maxAge: Math.max(1, Math.floor((session.exp - now) / 1e3))
	});
}
function clearSessionCookie(cookies, isSecureSite) {
	cookies.delete(adminCookieName(isSecureSite), {
		path: "/",
		secure: isSecureSite,
		httpOnly: true,
		sameSite: "lax"
	});
}
//#endregion
export { needsReissue as a, setSessionCookie as c, hashPassword as i, verifyPassword as l, adminCookieName as n, newSession as o, clearSessionCookie as r, refreshSession as s, Revocations as t, verifyToken as u };
