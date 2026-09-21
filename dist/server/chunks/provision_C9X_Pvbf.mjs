import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { a as adminRuntime, i as adminPost, l as methodNotAllowed, o as auditBase, u as recordAuditEvent } from "./http_YuZl1CQP.mjs";
import { o as noStore } from "./api_Bc7pzPJK.mjs";
import { r as provisionCatalogueSheet, t as DEFAULT_SHEET_TITLE } from "./provision-sheet_DkZGWK7r.mjs";
import * as z from "zod";
//#region src/pages/api/admin/google/provision.ts
var provision_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var Body = z.object({ 
/** Shown on the spreadsheet in Drive. The studio sees it there, so it is worth getting right. */
title: z.string().trim().min(1).max(120).default(DEFAULT_SHEET_TITLE) });
var POST = adminPost(Body, async ({ context, body }) => {
	const result = await provisionCatalogueSheet(body.title, (event) => recordAuditEvent({
		...auditBase(context),
		...event
	}));
	if (!result.ok) return noStore({
		ok: false,
		error: result.error,
		message: result.message,
		...result.sheetId ? { sheetId: result.sheetId } : {},
		...result.log ? { log: result.log } : {}
	}, result.status);
	return noStore({
		ok: true,
		sheetId: result.sheetId,
		url: result.url,
		siteUrl: adminRuntime.siteUrl,
		log: result.log
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/google/provision@_@ts
var page = () => provision_exports;
//#endregion
export { page };
