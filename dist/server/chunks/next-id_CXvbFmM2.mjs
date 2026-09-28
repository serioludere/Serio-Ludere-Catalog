import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { l as methodNotAllowed, n as adminGet } from "./http_CC6UBzyR.mjs";
import { o as noStore } from "./api_B7FUyMAq.mjs";
import { n as nextRugId } from "./ids_dhhYwNKI.mjs";
import { f as reservedIds, l as loadSnapshot } from "./_shared_D1bjIG1K.mjs";
//#region src/pages/api/admin/rugs/next-id.ts
var next_id_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	prerender: () => false
});
var GET = adminGet(async () => {
	const snapshot = await loadSnapshot();
	return noStore({
		ok: true,
		id: nextRugId(snapshot.rugs.map((r) => r.id), reservedIds(snapshot))
	});
});
var ALL = methodNotAllowed("GET");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/rugs/next-id@_@ts
var page = () => next_id_exports;
//#endregion
export { page };
