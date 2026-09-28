import { K as hostnameProblem } from "./runtime_BQokt-w9.mjs";
//#region src/lib/scrape/detect.ts
var ECG_HOSTS = ["ecarpetgallery.com", "www.ecarpetgallery.com"];
/** The Shopify shops, each with the host its canonical product URL is rebuilt on. */
var SHOPIFY_HOSTS = {
	"karavanrug.com": "karavanrug",
	"www.karavanrug.com": "karavanrug",
	"serioludere.com": "serioludere",
	"www.serioludere.com": "serioludere"
};
/** Where each Shopify shop's canonical product URL lives. */
var SHOPIFY_BASE = {
	karavanrug: "https://karavanrug.com/products/",
	serioludere: "https://serioludere.com/products/"
};
/** ECG's store codes, which lead a product path when the link was copied from one of those stores. */
var ECG_STORES = [
	"us_en",
	"ca_en",
	"eu_en",
	"ca_fr"
];
/** The ECG url key, wherever it sits: the last path segment ending in a 4+ digit sku. */
var ECG_KEY_RE = /^([a-z0-9-]+?-(\d{4,}))(?:\.html)?$/;
/** The Shopify handle: whatever follows a `products` segment, wherever that segment sits. */
var KV_HANDLE_RE = /^[a-z0-9-]+$/;
/** Path segments, lowercased, with the empty ones a leading/trailing/double slash leaves behind. */
function segmentsOf(path) {
	return path.toLowerCase().split("/").filter((s) => s !== "");
}
var ECG_BASE = "https://ecarpetgallery.com/us_en/";
SHOPIFY_BASE.karavanrug;
function supplierForHost(hostname) {
	const h = hostname.toLowerCase();
	if (ECG_HOSTS.includes(h)) return "ecarpetgallery";
	return SHOPIFY_HOSTS[h];
}
/**
* The shop a stored product came from: its Source Site cell when that names one, else the host of
* its Source URL (owner, 2026-09-28). An older row can carry a supplier link with that cell blank,
* and "Re-fetch cover" has to know it is a Karavan rug to turn and crop the cover like one.
*/
function supplierOfRow(sourceSite, sourceUrl) {
	const named = sourceSite.trim().toLowerCase();
	if (named === "karavanrug" || named === "ecarpetgallery" || named === "serioludere") return named;
	try {
		return supplierForHost(new URL(sourceUrl).hostname);
	} catch {
		return;
	}
}
/**
* Parses a pasted supplier link. http is rewritten to https; userinfo, ports, tracking query/hash
* and anything off the allow-list are refused. Paths are compared lowercased ([assumption]: Magento
* url keys and Shopify handles are lowercase).
*/
function detectSupplier(input) {
	const raw = input.trim();
	if (!raw) return { error: "invalid_url" };
	let url;
	try {
		url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
	} catch {
		return { error: "invalid_url" };
	}
	if (url.protocol === "http:") url.protocol = "https:";
	if (url.protocol !== "https:") return { error: "invalid_url" };
	if (url.username || url.password || url.port) return { error: "invalid_url" };
	if (hostnameProblem(url.hostname)) return { error: "invalid_url" };
	const supplier = supplierForHost(url.hostname);
	if (!supplier) return { error: "unsupported_host" };
	const segments = segmentsOf(url.pathname);
	if (supplier === "ecarpetgallery") {
		let urlKey;
		let sku;
		for (const segment of segments) {
			const m = ECG_KEY_RE.exec(segment);
			if (m) {
				urlKey = m[1];
				sku = m[2];
			}
		}
		if (!urlKey || !sku) return { error: "invalid_url" };
		const sourceUrl = `${ECG_BASE}${urlKey}`;
		const store = segments[0];
		const pastedUrl = store && ECG_STORES.includes(store) && store !== "us_en" ? `https://ecarpetgallery.com/${store}/${urlKey}` : void 0;
		return {
			supplier,
			urlKey,
			sku,
			supplierRef: sku,
			sourceUrl,
			htmlUrl: sourceUrl,
			pastedUrl
		};
	}
	const at = segments.lastIndexOf("products");
	const next = at === -1 ? void 0 : segments[at + 1];
	const handle = next && KV_HANDLE_RE.test(next) ? next : void 0;
	if (!handle) return { error: "invalid_url" };
	const sourceUrl = `${SHOPIFY_BASE[supplier]}${handle}`;
	return {
		supplier,
		handle,
		supplierRef: handle,
		sourceUrl,
		jsUrl: `${sourceUrl}.js`,
		jsonUrl: `${sourceUrl}.json`,
		htmlUrl: sourceUrl
	};
}
/**
* Manual-entry pre-fill (§4.8): supplier and reference from the pasted URL alone — the last 4+ digit
* run for ECG, the handle for KV — even when the link is not a product page. Undefined for other hosts.
*/
function manualFallback(input) {
	const raw = input.trim();
	if (!raw) return void 0;
	let url;
	try {
		url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
	} catch {
		return;
	}
	const host = url.hostname.toLowerCase();
	const supplier = supplierForHost(host) ?? supplierForHost(host.replace(/^www\./, ""));
	if (!supplier) return void 0;
	if (url.protocol === "http:") url.protocol = "https:";
	url.search = "";
	url.hash = "";
	url.username = "";
	url.password = "";
	const path = url.pathname;
	return {
		supplier,
		supplierRef: supplier === "ecarpetgallery" ? [...path.matchAll(/\d{4,}/g)].at(-1)?.[0] ?? "" : /\/products\/([a-z0-9-]+)/i.exec(path)?.[1]?.toLowerCase() ?? "",
		sourceUrl: url.toString()
	};
}
/** The manual pre-fill for a successfully detected link. */
function manualFromDetected(det) {
	return {
		supplier: det.supplier,
		supplierRef: det.supplierRef,
		sourceUrl: det.sourceUrl
	};
}
//#endregion
export { manualFromDetected as a, manualFallback as i, SHOPIFY_BASE as n, supplierOfRow as o, detectSupplier as r, ECG_BASE as t };
