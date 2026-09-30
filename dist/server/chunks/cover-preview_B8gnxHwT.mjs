import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { mt as applyTransforms, n as getAdminDeps, pt as DownloadError, xt as consoleLogger } from "./runtime_CDQUPEGE.mjs";
import { l as methodNotAllowed, n as adminGet, t as AdminError } from "./http_BTz_tJmk.mjs";
import { k as CoverPreviewQuery } from "./read_By9ZobhQ.mjs";
//#region src/pages/api/admin/cover-preview.ts
var cover_preview_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	prerender: () => false
});
/** Status for a download that failed: the caller's mistake (4xx) or the supplier's (502). */
var DOWNLOAD_STATUS = {
	unsupported_host: 400,
	not_image: 415,
	too_large: 413,
	download_failed: 502
};
var GET = adminGet(async ({ context }) => {
	const query = CoverPreviewQuery.safeParse({
		url: context.url.searchParams.get("url") ?? "",
		supplier: context.url.searchParams.get("supplier") ?? ""
	});
	if (!query.success) throw new AdminError(400, "invalid query", "url (https) and supplier are required");
	const { url, supplier } = query.data;
	let downloaded;
	try {
		downloaded = await getAdminDeps().downloadImage(url);
	} catch (e) {
		const code = e instanceof DownloadError ? e.code : "download_failed";
		throw new AdminError(DOWNLOAD_STATUS[code], code, e instanceof Error ? e.message : void 0);
	}
	const fixed = await applyTransforms(downloaded, {
		supplier,
		index: 0
	});
	if (fixed.skipped) consoleLogger.warn("cover preview: transform skipped", { detail: fixed.skipped });
	return new Response(new Uint8Array(fixed.bytes), {
		status: 200,
		headers: {
			"content-type": fixed.contentType,
			"cache-control": "no-store",
			"x-content-type-options": "nosniff",
			"x-cover-transforms": fixed.applied.join(",") || "none"
		}
	});
}, "preview");
var ALL = methodNotAllowed("GET");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/cover-preview@_@ts
var page = () => cover_preview_exports;
//#endregion
export { page };
