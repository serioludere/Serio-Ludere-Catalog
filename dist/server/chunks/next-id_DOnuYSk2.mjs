import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { l as methodNotAllowed, n as adminGet } from "./http_DznDUKEW.mjs";
import { o as noStore } from "./api_Bu8ggPtp.mjs";
import { n as nextRugId } from "./ids_C29T7Z6O.mjs";
import { f as reservedIds, l as loadSnapshot } from "./_shared_BASW0WEg.mjs";
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
