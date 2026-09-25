import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { i as getClient, vt as consoleLogger } from "./runtime_BgX1riZH.mjs";
import { l as methodNotAllowed, n as adminGet } from "./http_DfO61_B-.mjs";
import { o as noStore } from "./api_B6hDsvkQ.mjs";
import { s as parseAdminSnapshot, t as ADMIN_READ_RANGES } from "./read_Cjj8wrWx.mjs";
import { n as buildSavesReport, t as SAVES_READ_RANGE } from "./saves_xx2iCjEa.mjs";
//#region src/pages/api/admin/clients/report.ts
var report_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	prerender: () => false
});
var GET = adminGet(async () => {
	const ranges = await getClient().batchGet([...ADMIN_READ_RANGES, SAVES_READ_RANGE]);
	const snapshot = parseAdminSnapshot(ranges.slice(0, ADMIN_READ_RANGES.length), { logger: consoleLogger });
	const votes = ranges[ADMIN_READ_RANGES.length]?.values;
	const report = buildSavesReport(votes, snapshot.rugs, snapshot.clients);
	return noStore({
		ok: true,
		...report
	});
});
var ALL = methodNotAllowed("GET");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/clients/report@_@ts
var page = () => report_exports;
//#endregion
export { page };
