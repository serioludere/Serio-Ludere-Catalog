import { a as sequence, mt as defineMiddleware } from "./chunks/runtime_skv-YCY6.mjs";
import { s as gateConfig, y as adminGate } from "./chunks/http_friNsH5S.mjs";
import { o as customerGate, t as customerGateConfig } from "./chunks/http_CzR8U5Kz.mjs";
import { i as ENTER_PATH, l as siteGate, n as siteGateConfig } from "./chunks/http_CLyIjNV4.mjs";
//#region src/middleware.ts
var securityHeaders = defineMiddleware(async (_context, next) => {
	const response = await next();
	response.headers.set("x-content-type-options", "nosniff");
	response.headers.set("referrer-policy", "same-origin");
	response.headers.set("x-frame-options", "DENY");
	return response;
});
var admin = defineMiddleware((context, next) => adminGate(context, () => next(), gateConfig()));
var site = defineMiddleware(async (context, next) => {
	const decision = siteGate(context, siteGateConfig());
	if (decision.kind === "login") return context.redirect(`${ENTER_PATH}?next=${encodeURIComponent(decision.next)}`, 303);
	if (decision.kind === "api-denied") return new Response(JSON.stringify({
		ok: false,
		error: "password required"
	}), {
		status: 401,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
	if (decision.kind === "allowed") {
		const response = await next();
		response.headers.set("cache-control", "private, no-store");
		response.headers.set("x-robots-tag", "noindex, nofollow");
		return response;
	}
	return next();
});
var customer = defineMiddleware(async (context, next) => {
	const { route } = customerGate(context, customerGateConfig());
	if (route.kind === "deny") return new Response("Not found", {
		status: 404,
		headers: {
			"content-type": "text/plain; charset=utf-8",
			"x-robots-tag": "noindex, nofollow"
		}
	});
	if (route.kind === "customer") {
		context.cache.set(false);
		const response = await next();
		response.headers.set("cache-control", "no-store");
		response.headers.set("x-robots-tag", "noindex, nofollow");
		return response;
	}
	return next();
});
var onRequest$1 = sequence(securityHeaders, admin, site, customer);
//#endregion
//#region \0virtual:astro:middleware
var onRequest = sequence(onRequest$1);
//#endregion
export { onRequest };
