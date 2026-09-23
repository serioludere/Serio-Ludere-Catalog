import { a as sequence, mt as defineMiddleware } from "./chunks/runtime_skv-YCY6.mjs";
import { b as adminGate, s as gateConfig } from "./chunks/http_CCcm1Cpb.mjs";
import { o as customerGate, t as customerGateConfig } from "./chunks/http_BnN60VSd.mjs";
//#region src/middleware.ts
var securityHeaders = defineMiddleware(async (_context, next) => {
	const response = await next();
	response.headers.set("x-content-type-options", "nosniff");
	response.headers.set("referrer-policy", "same-origin");
	response.headers.set("x-frame-options", "DENY");
	return response;
});
/**
* `/` → `/admin`. It runs BEFORE the customer gate on purpose: with the public catalogue off, that
* gate default-denies `/` and would answer 404 instead of sending the studio to its login.
*/
var root = defineMiddleware((context, next) => {
	if (context.url.pathname === "/") return context.redirect("/admin", 303);
	return next();
});
var admin = defineMiddleware((context, next) => adminGate(context, () => next(), gateConfig()));
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
var onRequest$1 = sequence(securityHeaders, root, admin, customer);
//#endregion
//#region \0virtual:astro:middleware
var onRequest = sequence(onRequest$1);
//#endregion
export { onRequest };
