import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as PRODUCT_COLS, bt as consoleLogger, i as getClient, n as getAdminDeps, xt as serializeError } from "./runtime_BQokt-w9.mjs";
import { _ as updateProductCell, c as invalidateAfterWrite, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError } from "./http_D66oxYBo.mjs";
import { o as noStore } from "./api_B7FUyMAq.mjs";
import { A as CoverRefetch, G as buildAuditRow, M as ID_RE } from "./read_bYkleUqE.mjs";
import { o as supplierOfRow } from "./detect_BmTzn_Xv.mjs";
import { c as freshRug, d as requireAdminHeaders, l as loadSnapshot, u as nowIso } from "./_shared_E-UjVRRS.mjs";
import { t as scrapeRug } from "./scrape_DGFbiWVo.mjs";
//#region src/pages/api/admin/rugs/[id]/cover.ts
var cover_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
/** `karavanrug.com` for the messages; the link itself when it will not parse. */
function hostOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}
var POST = adminPost(CoverRefetch, async ({ context }) => {
	const id = context.params.id;
	if (!id || !ID_RE.test(id)) throw new AdminError(404, "not found", "no such product");
	const client = getClient();
	const snapshot = await loadSnapshot(client);
	requireAdminHeaders(snapshot);
	const rug = snapshot.rugs.find((r) => r.id === id);
	if (!rug) throw new AdminError(404, "not found", `No product with id "${id}".`);
	const supplier = rug.sourceUrl ? supplierOfRow(rug.supplier, rug.sourceUrl) : void 0;
	if (!supplier) throw new AdminError(422, "no_source", "This product has no supplier link, so there is nowhere to fetch its cover from.");
	const deps = getAdminDeps();
	if (!deps.drive) throw new AdminError(409, "drive_not_authorised", "Saving a photo needs a Google account with Drive access.", { reason: "service_account" });
	const scope = await deps.drive.scopeStatus();
	if (!scope.driveScopeOk) throw new AdminError(409, "drive_not_authorised", `Drive is not authorised (${scope.reason ?? "unknown"}).`, { reason: scope.reason ?? null });
	const host = hostOf(rug.sourceUrl);
	const scraped = await scrapeRug(rug.sourceUrl, {
		jinaFallback: deps.scrape.jinaFallback,
		respectRobots: deps.scrape.respectRobots,
		convertToUsd: deps.convertToUsd,
		logger: consoleLogger
	});
	if (!scraped.ok) {
		if (scraped.code === "not_found") throw new AdminError(422, "source_gone", `${host} no longer has this product's page (it may have sold), so its cover cannot be fetched again.`);
		throw new AdminError(502, "scrape_failed", `Could not read ${host} (${scraped.code}): ${scraped.message}`, { reason: scraped.code });
	}
	const photo = scraped.data.photos[0]?.url;
	if (!photo) throw new AdminError(422, "no_photos", `${host} no longer shows any photographs of it.`);
	let allImagesId;
	try {
		allImagesId = (await deps.drive.ensureProductFolders(rug.id, rug.name)).allImagesId;
	} catch (e) {
		throw new AdminError(502, "folder_failed", `Could not reach the product's Drive folder: ${serializeError(e).message}`);
	}
	const uploaded = await deps.drive.uploadFromUrl(photo, `01-primary-${nowIso().slice(0, 10)}`, allImagesId, {
		supplier,
		index: 0
	});
	if ("error" in uploaded) throw new AdminError(502, uploaded.error, `The new cover could not be saved to Drive (${uploaded.error}).`, { detail: uploaded.detail ?? null });
	const previous = rug.photos[0] ?? "";
	const audit = buildAuditRow({
		...auditBase(context),
		action: "rug.update",
		targetTab: "Products",
		targetId: rug.id,
		before: { cover: previous },
		after: {
			cover: uploaded.id,
			from: photo
		},
		note: `row ${rug.row} · cover re-fetched from ${host}`
	});
	const result = await updateProductCell(client, {
		columnIndex: PRODUCT_COLS.imageSrc,
		updates: [{
			row: rug.row,
			expectFirstCell: rug.id,
			value: uploaded.id
		}],
		audit,
		logger: consoleLogger
	});
	await invalidateAfterWrite(context);
	return noStore({
		ok: true,
		rug: await freshRug(client, rug.row, rug.id),
		cover: {
			id: uploaded.id,
			previous,
			source: photo,
			host
		},
		audit: result.audit
	});
}, "photos");
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/rugs/[id]/cover@_@ts
var page = () => cover_exports;
//#endregion
export { page };
