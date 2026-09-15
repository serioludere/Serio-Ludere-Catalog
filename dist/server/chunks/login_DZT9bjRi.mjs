//#region src/lib/admin/login.ts
var LOGIN_LIMITS = {
	perIp: {
		limit: 5,
		windowMs: 9e5
	},
	global: {
		limit: 20,
		windowMs: 9e5
	}
};
var FAIL_PREFIX = "admin-fail:";
var GLOBAL_KEY = `${FAIL_PREFIX}global`;
/** Seconds a caller must wait after `failures` consecutive failures: 0, 0, 1, 2, 4, … ≤ 900. */
function retryAfterSec(failures) {
	if (failures < 3) return 0;
	return Math.min(900, 2 ** (failures - 3));
}
var LoginThrottle = class {
	limiter;
	now;
	ips = /* @__PURE__ */ new Map();
	lockoutAudited = /* @__PURE__ */ new Map();
	maxKeys;
	constructor(limiter, options = {}) {
		this.limiter = limiter;
		this.now = options.now ?? Date.now;
		this.maxKeys = options.maxKeys ?? 2e3;
	}
	ipKey(ipHash) {
		return `${FAIL_PREFIX}${ipHash}`;
	}
	/** Per-ip bookkeeping, reset when the limiter's window for that ip has rolled over. */
	state(ipHash) {
		const t = this.now();
		const key = this.ipKey(ipHash);
		const fresh = this.limiter.wouldAllow(key, LOGIN_LIMITS.perIp.limit, LOGIN_LIMITS.perIp.windowMs);
		let s = this.ips.get(ipHash);
		if (!s || fresh.ok && fresh.remaining === LOGIN_LIMITS.perIp.limit) {
			s = {
				failures: 0,
				notBefore: 0,
				windowStart: t
			};
			this.ips.set(ipHash, s);
			if (this.ips.size > this.maxKeys) this.prune(t);
		}
		return s;
	}
	prune(t) {
		for (const [k, s] of this.ips) if (t - s.windowStart >= LOGIN_LIMITS.perIp.windowMs && t >= s.notBefore) this.ips.delete(k);
		for (const [k, end] of this.lockoutAudited) if (t >= end) this.lockoutAudited.delete(k);
	}
	/**
	* Marks the lockout as audited for the window that ends in `retryAfterSec`; true the first time
	* only (successive checks in the same window compute the same end, give or take a second).
	*/
	firstLockout(key, retryAfterSec) {
		const end = this.now() + retryAfterSec * 1e3;
		const prior = this.lockoutAudited.get(key);
		if (prior !== void 0 && Math.abs(prior - end) < 2e3) return false;
		this.lockoutAudited.set(key, end);
		return true;
	}
	/** Call before verifying a password. Consumes nothing. */
	check(ipHash) {
		const t = this.now();
		const s = this.state(ipHash);
		const global = this.limiter.wouldAllow(GLOBAL_KEY, LOGIN_LIMITS.global.limit, LOGIN_LIMITS.global.windowMs);
		if (!global.ok) return {
			ok: false,
			reason: "locked",
			retryAfterSec: global.retryAfterSec,
			auditLockout: this.firstLockout(GLOBAL_KEY, global.retryAfterSec),
			scope: "global"
		};
		const ip = this.limiter.wouldAllow(this.ipKey(ipHash), LOGIN_LIMITS.perIp.limit, LOGIN_LIMITS.perIp.windowMs);
		if (!ip.ok) return {
			ok: false,
			reason: "locked",
			retryAfterSec: ip.retryAfterSec,
			auditLockout: this.firstLockout(this.ipKey(ipHash), ip.retryAfterSec),
			scope: "ip"
		};
		if (t < s.notBefore) return {
			ok: false,
			reason: "backoff",
			retryAfterSec: Math.max(1, Math.ceil((s.notBefore - t) / 1e3)),
			auditLockout: false,
			scope: "ip"
		};
		return { ok: true };
	}
	/** Records a failed verification: consumes one unit from both windows, sets the backoff. */
	fail(ipHash) {
		const t = this.now();
		const s = this.state(ipHash);
		const ip = this.limiter.allow(this.ipKey(ipHash), LOGIN_LIMITS.perIp.limit, LOGIN_LIMITS.perIp.windowMs);
		const global = this.limiter.allow(GLOBAL_KEY, LOGIN_LIMITS.global.limit, LOGIN_LIMITS.global.windowMs);
		s.failures += 1;
		let retry = retryAfterSec(s.failures);
		let scope = "ip";
		let auditLockout = false;
		if (ip.ok && ip.remaining === 0) {
			const remaining = this.limiter.wouldAllow(this.ipKey(ipHash), LOGIN_LIMITS.perIp.limit, LOGIN_LIMITS.perIp.windowMs);
			retry = Math.max(retry, remaining.retryAfterSec);
			auditLockout = this.firstLockout(this.ipKey(ipHash), remaining.retryAfterSec);
		}
		if (global.ok && global.remaining === 0) {
			const remaining = this.limiter.wouldAllow(GLOBAL_KEY, LOGIN_LIMITS.global.limit, LOGIN_LIMITS.global.windowMs);
			retry = Math.max(retry, remaining.retryAfterSec);
			scope = "global";
			auditLockout = this.firstLockout(GLOBAL_KEY, remaining.retryAfterSec) || auditLockout;
		}
		s.notBefore = t + retry * 1e3;
		return {
			retryAfterSec: retry,
			auditLockout,
			scope,
			failures: s.failures
		};
	}
	/** A successful login refunds the ip's window and clears its backoff (the global window is kept). */
	succeed(ipHash) {
		const s = this.ips.get(ipHash);
		if (s) {
			for (let i = 0; i < s.failures; i++) this.limiter.refund(this.ipKey(ipHash));
			this.ips.delete(ipHash);
		}
	}
};
/** Only `/admin`, `/admin/...` with url-safe segments may be a post-login destination. */
var NEXT_RE = /^\/admin(\/[A-Za-z0-9_\-/]*)?$/;
function sanitiseNext(value, fallback = "/admin") {
	if (typeof value !== "string") return fallback;
	const v = value.trim();
	if (!NEXT_RE.test(v) || v.startsWith("//") || v === "/admin/login" || v === "/admin/logout") return fallback;
	return v;
}
//#endregion
export { sanitiseNext as n, LoginThrottle as t };
