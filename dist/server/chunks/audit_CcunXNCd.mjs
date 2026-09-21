import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { H as TABS, i as getClient } from "./runtime_DeI95MAO.mjs";
import { l as methodNotAllowed, n as adminGet } from "./http_YuZl1CQP.mjs";
import { o as noStore } from "./api_Bc7pzPJK.mjs";
import { L as issuesOf, U as parseAuditRows, b as AuditQuery } from "./read_D-x4Tjt2.mjs";
//#region src/pages/api/admin/audit.ts
var audit_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	prerender: () => false
});
var GET = adminGet(async ({ context }) => {
	const parsed = AuditQuery.safeParse(Object.fromEntries(context.url.searchParams));
	if (!parsed.success) return noStore({
		ok: false,
		error: "invalid query",
		issues: issuesOf(parsed.error)
	}, 400);
	const { offset, limit } = parsed.data;
	const first = 2 + offset;
	const last = first + limit - 1;
	const [header, page, colA] = await getClient().batchGet([
		`${TABS.auditLog}!A1:J1`,
		`${TABS.auditLog}!A${first}:J${last}`,
		`${TABS.auditLog}!A2:A`
	]);
	const rows = parseAuditRows([header?.values?.[0] ?? [], ...page?.values ?? []]).map((r) => ({
		...r,
		row: r.row + offset
	}));
	const total = colA?.values?.length ?? 0;
	return noStore({
		ok: true,
		rows,
		offset,
		limit,
		total
	});
});
var ALL = methodNotAllowed("GET");
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/audit@_@ts
var page = () => audit_exports;
//#endregion
export { page };
