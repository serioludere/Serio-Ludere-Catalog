import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { I as consoleLogger } from "./parse_CyNL3ky6.mjs";
import { l as methodNotAllowed, n as adminGet } from "./http_friNsH5S.mjs";
import { o as noStore } from "./api_DdjGbQdl.mjs";
import { i as getClient } from "./runtime_BIcTruy2.mjs";
import { c as parseAdminSnapshot, t as ADMIN_READ_RANGES } from "./read_CIiVx8tx.mjs";
import { n as buildSavesReport, t as SAVES_READ_RANGE } from "./saves_B4fgfo7f.mjs";
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
