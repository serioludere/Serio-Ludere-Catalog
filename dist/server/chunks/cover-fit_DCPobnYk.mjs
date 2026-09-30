import { ht as FEATURES } from "./runtime_ze_g5m0z.mjs";
//#region src/lib/cover-fit.ts
/**
* The supplier hosts, without `www.`. scrape/detect.ts has the scraper's own table, but importing it
* would pull the fetch guard (undici, node:dns) into every page render for one lookup.
*/
var SUPPLIER_HOSTS = {
	"karavanrug.com": "karavanrug",
	"ecarpetgallery.com": "ecarpetgallery",
	"serioludere.com": "serioludere"
};
var SUPPLIERS = new Set(Object.values(SUPPLIER_HOSTS));
/** The shop a stored product came from: its Source Site when that names one, else its link's host. */
function supplierOfRow(sourceSite, sourceUrl) {
	const named = (sourceSite ?? "").trim().toLowerCase();
	if (SUPPLIERS.has(named)) return named;
	try {
		return SUPPLIER_HOSTS[new URL(sourceUrl ?? "").hostname.toLowerCase().replace(/^www\./, "")];
	} catch {
		return;
	}
}
/** Whether this product's cover is shown at its plate's full height (features.ts `coverFullHeight`). */
function coverFillsHeight(sourceSite, sourceUrl) {
	const supplier = supplierOfRow(sourceSite, sourceUrl);
	return supplier !== void 0 && FEATURES.coverFullHeight[supplier];
}
//#endregion
export { coverFillsHeight as t };
