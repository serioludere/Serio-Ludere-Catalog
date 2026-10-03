import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { l as methodNotAllowed, n as adminGet } from "./http_BM_MA3wM.mjs";
import { o as noStore } from "./api_BjVL12_Q.mjs";
import { n as nextRugId } from "./ids_BcKhPSck.mjs";
import { f as reservedIds, l as loadSnapshot } from "./_shared_DaCDSoV1.mjs";
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
