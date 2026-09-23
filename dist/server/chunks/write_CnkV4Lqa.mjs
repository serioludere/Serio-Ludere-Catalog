import { H as TABS, _t as SheetsApiError } from "./runtime_BXWQfypp.mjs";
//#region src/lib/sheets/write.ts
/** Literal cell: numbers as numberValue, booleans as boolValue, everything else as stringValue. */
function cell(v) {
	if (typeof v === "number") return { userEnteredValue: { numberValue: v } };
	if (typeof v === "boolean") return { userEnteredValue: { boolValue: v } };
	return { userEnteredValue: { stringValue: v } };
}
/**
* Admin writes (docs/ADMIN_SPEC.md §3.4): a blank field is sent as `{}` — an empty CellData inside the
* `userEnteredValue` field mask clears the cell — so an update can erase a value, not only overwrite it.
*/
function cellOrClear(v) {
	if (v === void 0 || v === null || typeof v === "string" && v === "") return {};
	return cell(v);
}
function reactionRowToCells(row) {
	return [
		row.eventId,
		row.customerSlug,
		row.productId,
		row.reaction,
		row.source,
		row.createdAt
	];
}
/**
* Generalised newest-first insert (any tab, ADMIN_SPEC §3.4): inserts `cells.length` rows at
* zero-based `rowIndex` (1 = sheet row 2) and fills them with literal values in the same batch.
* `cells[0]` lands on the inserted row closest to the top.
*/
function buildInsertRows(sheetId, rowIndex, cells) {
	return [{ insertDimension: {
		range: {
			sheetId,
			dimension: "ROWS",
			startIndex: rowIndex,
			endIndex: rowIndex + cells.length
		},
		inheritFromBefore: false
	} }, { updateCells: {
		start: {
			sheetId,
			rowIndex,
			columnIndex: 0
		},
		rows: cells.map((r) => ({ values: r.map(cellOrClear) })),
		fields: "userEnteredValue"
	} }];
}
/**
* Builds the two requests; exported for tests and for the Phase-5 concurrency harness.
* rows[0] lands on sheet row 2 (newest); the parser is order-independent within a batch (ADR D4).
*/
function buildInsertRequests(sheetId, rows) {
	return buildInsertRows(sheetId, 1, rows.map(reactionRowToCells));
}
/**
* Inserts `rows` as the newest rows (row 2 onwards) of the Reactions tab. Atomic per call.
* Retries a stale sheetId once (a recreated tab gets a new random id).
*/
async function insertReactionRows(client, rows) {
	if (rows.length === 0) return;
	const attempt = async () => {
		const sheetId = await client.sheetIdByTitle(TABS.reactions);
		await client.batchUpdate(buildInsertRequests(sheetId, rows));
	};
	try {
		await attempt();
	} catch (e) {
		if (e instanceof SheetsApiError && e.status === 400 && /sheetId|No grid with id/i.test(e.message)) {
			client.forgetSheetIds();
			await attempt();
			return;
		}
		throw e;
	}
}
function visitRowToCells(row) {
	return [
		row.eventId,
		row.customerSlug,
		row.occurredAt,
		row.userAgent,
		row.referrer
	];
}
/**
* Inserts `rows` as the newest rows of the Visits tab, with the same atomic insert+fill the
* Reactions log uses. Visits are append-only and never read back by the catalogue, so a failure
* here is logged by the caller and never fails a render.
*/
async function insertVisitRows(client, rows) {
	if (rows.length === 0) return;
	const attempt = async () => {
		const sheetId = await client.sheetIdByTitle(TABS.visits);
		await client.batchUpdate(buildInsertRows(sheetId, 1, rows.map(visitRowToCells)));
	};
	try {
		await attempt();
	} catch (e) {
		if (e instanceof SheetsApiError && e.status === 400 && /sheetId|No grid with id/i.test(e.message)) {
			client.forgetSheetIds();
			await attempt();
			return;
		}
		throw e;
	}
}
//#endregion
export { insertVisitRows as i, cellOrClear as n, insertReactionRows as r, buildInsertRows as t };
