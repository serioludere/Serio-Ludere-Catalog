import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { I as consoleLogger, j as extractDriveId } from "./parse_CyNL3ky6.mjs";
import { c as invalidateAfterWrite, h as productFieldsToCells, i as adminPost, l as methodNotAllowed, o as auditBase, t as AdminError, v as updateRug } from "./http_friNsH5S.mjs";
import { o as noStore } from "./api_DdjGbQdl.mjs";
import { i as getClient, n as getAdminDeps } from "./runtime_BIcTruy2.mjs";
import { G as buildAuditRow, N as RugCommit } from "./read_CIiVx8tx.mjs";
import { a as fieldsOfRug, d as loadSnapshot, f as nowIso, l as freshRug } from "./_shared_jQquG5lu.mjs";
import { t as commitPhotos } from "./commit_DyX2gJaP.mjs";
import { t as scrapeRug } from "./scrape_C2aupRVG.mjs";
//#region src/pages/api/admin/rugs/[id]/retry.ts
var retry_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	POST: () => POST,
	prerender: () => false
});
var POST = adminPost(RugCommit.partial({ version: true }), async ({ context, body }) => {
	const id = context.params.id;
	if (!id) throw new AdminError(404, "not found", "no such rug");
	const client = getClient();
	const rug = (await loadSnapshot(client)).rugs.find((r) => r.id === id);
	if (!rug) throw new AdminError(404, "not found", `No rug with id "${id}".`);
	const deps = getAdminDeps();
	if (!deps.drive) throw new AdminError(409, "drive_not_authorised", "Photo import needs a Google account with Drive access.", { reason: "service_account" });
	const scope = await deps.drive.scopeStatus();
	if (!scope.driveScopeOk) throw new AdminError(409, "drive_not_authorised", `Drive is not authorised (${scope.reason ?? "unknown"}).`, { reason: scope.reason ?? null });
	if (!rug.sourceUrl) throw new AdminError(422, "no_source", "This row has no source URL, so there is nothing to fetch the photos from again. Paste Drive ids by hand instead.");
	const scraped = await scrapeRug(rug.sourceUrl, {
		jinaFallback: deps.scrape.jinaFallback,
		respectRobots: deps.scrape.respectRobots,
		convertToUsd: deps.convertToUsd,
		logger: consoleLogger
	});
	if (!scraped.ok) throw new AdminError(502, "scrape_failed", `Could not read ${rug.sourceUrl} again (${scraped.code}): ${scraped.message}`, { reason: scraped.code });
	const wanted = (scraped.data.photos ?? []).map((p) => p.url).slice(0, 12);
	if (wanted.length === 0) throw new AdminError(422, "no_photos", "The source page no longer offers any photographs.");
	const commit = await commitPhotos({
		productId: rug.id,
		productName: rug.name,
		urls: wanted,
		namePrefix: rug.slug || rug.id,
		reuseExisting: true,
		supplier: rug.supplier
	}, {
		drive: deps.drive,
		logger: consoleLogger
	});
	const uploaded = commit.photos.filter((p) => p.id && !p.reused).length;
	const photos = [...new Set([...rug.photos, ...commit.ids].map((p) => extractDriveId(p) ?? p))].slice(0, 12);
	const complete = commit.complete;
	const fields = {
		...fieldsOfRug(rug),
		photos,
		commitStatus: complete ? "complete" : "pending",
		driveFolderId: commit.folders?.productId ?? rug.driveFolderId,
		driveFolderUrl: commit.folders?.url ?? rug.driveFolderUrl
	};
	const audit = buildAuditRow({
		...auditBase(context),
		action: "photo.import",
		targetTab: "Drive",
		targetId: rug.id,
		after: {
			wanted: wanted.length,
			imported: uploaded,
			reused: commit.ids.length - uploaded,
			commitStatus: fields.commitStatus
		},
		note: `row ${rug.row}`
	});
	const result = await updateRug(client, {
		row: rug.row,
		version: body.version ?? rug.version,
		id: rug.id,
		cells: { all: productFieldsToCells({
			...fields,
			scrapedAt: rug.scrapedAt || nowIso()
		}, rug.id) },
		audit,
		logger: consoleLogger
	});
	await invalidateAfterWrite(context);
	return noStore({
		ok: true,
		rug: await freshRug(client, rug.row, rug.id),
		photos: commit.photos,
		imported: uploaded,
		reused: commit.ids.length - uploaded,
		complete,
		audit: result.audit
	});
});
var ALL = methodNotAllowed("POST");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/rugs/[id]/retry@_@ts
var page = () => retry_exports;
//#endregion
export { page };
