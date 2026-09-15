import { R as serializeError } from "./parse_CyNL3ky6.mjs";
import { c as parseAdminSnapshot, t as ADMIN_READ_RANGES } from "./read_CIiVx8tx.mjs";
import { n as buildSavesReport, t as SAVES_READ_RANGE } from "./saves_B4fgfo7f.mjs";
//#region src/lib/admin/likes.ts
async function fetchAdminSnapshotWithLikes(client, opts = {}) {
	const ranges = await client.batchGet([...ADMIN_READ_RANGES, SAVES_READ_RANGE]);
	const snapshot = parseAdminSnapshot(ranges.slice(0, ADMIN_READ_RANGES.length), opts);
	const likesById = /* @__PURE__ */ new Map();
	try {
		const report = buildSavesReport(ranges[ADMIN_READ_RANGES.length]?.values, snapshot.rugs, snapshot.clients);
		for (const entry of report.mostSaved) if (entry.saves > 0) likesById.set(entry.rugId, entry.saves);
	} catch (e) {
		opts.logger?.warn("like counts unavailable", { error: serializeError(e) });
	}
	return {
		snapshot,
		likesById
	};
}
//#endregion
export { fetchAdminSnapshotWithLikes as t };
