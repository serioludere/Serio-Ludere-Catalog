import { i as setOnSetGetEnv, n as getEnv$1, t as createInvalidVariablesError } from "./runtime_skv-YCY6.mjs";
import * as z from "zod";
//#region node_modules/astro/dist/env/validators.js
function getEnvFieldType(options) {
	const optional = options.optional ? options.default !== void 0 ? false : true : false;
	let type;
	if (options.type === "enum") type = options.values.map((v) => `'${v}'`).join(" | ");
	else type = options.type;
	return `${type}${optional ? " | undefined" : ""}`;
}
var stringValidator = ({ max, min, length, url, includes, startsWith, endsWith }) => (input) => {
	if (typeof input !== "string") return {
		ok: false,
		errors: ["type"]
	};
	const errors = [];
	if (max !== void 0 && !(input.length <= max)) errors.push("max");
	if (min !== void 0 && !(input.length >= min)) errors.push("min");
	if (length !== void 0 && !(input.length === length)) errors.push("length");
	if (url !== void 0 && !URL.canParse(input)) errors.push("url");
	if (includes !== void 0 && !input.includes(includes)) errors.push("includes");
	if (startsWith !== void 0 && !input.startsWith(startsWith)) errors.push("startsWith");
	if (endsWith !== void 0 && !input.endsWith(endsWith)) errors.push("endsWith");
	if (errors.length > 0) return {
		ok: false,
		errors
	};
	return {
		ok: true,
		value: input
	};
};
var numberValidator = ({ gt, min, lt, max, int }) => (input) => {
	const num = Number.parseFloat(input ?? "");
	if (isNaN(num)) return {
		ok: false,
		errors: ["type"]
	};
	const errors = [];
	if (gt !== void 0 && !(num > gt)) errors.push("gt");
	if (min !== void 0 && !(num >= min)) errors.push("min");
	if (lt !== void 0 && !(num < lt)) errors.push("lt");
	if (max !== void 0 && !(num <= max)) errors.push("max");
	if (int !== void 0) {
		const isInt = Number.isInteger(num);
		if (!(int ? isInt : !isInt)) errors.push("int");
	}
	if (errors.length > 0) return {
		ok: false,
		errors
	};
	return {
		ok: true,
		value: num
	};
};
var booleanValidator = (input) => {
	const bool = input === "true" ? true : input === "false" ? false : void 0;
	if (typeof bool !== "boolean") return {
		ok: false,
		errors: ["type"]
	};
	return {
		ok: true,
		value: bool
	};
};
var enumValidator = ({ values }) => (input) => {
	if (!(typeof input === "string" ? values.includes(input) : false)) return {
		ok: false,
		errors: ["type"]
	};
	return {
		ok: true,
		value: input
	};
};
function selectValidator(options) {
	switch (options.type) {
		case "string": return stringValidator(options);
		case "number": return numberValidator(options);
		case "boolean": return booleanValidator;
		case "enum": return enumValidator(options);
	}
}
function validateEnvVariable(value, options) {
	const isOptional = options.optional || options.default !== void 0;
	if (isOptional && value === void 0) return {
		ok: true,
		value: options.default
	};
	if (!isOptional && value === void 0) return {
		ok: false,
		errors: ["missing"]
	};
	return selectValidator(options)(value);
}
//#endregion
//#region \0virtual:astro:env/internal
var schema = {
	"GOOGLE_SHEET_ID": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"GOOGLE_AUTH_MODE": {
		"context": "server",
		"access": "secret",
		"values": ["service_account", "oauth_refresh"],
		"default": "service_account",
		"type": "enum"
	},
	"GOOGLE_SERVICE_ACCOUNT_EMAIL": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"GOOGLE_PRIVATE_KEY": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"GOOGLE_OAUTH_CLIENT_ID": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"GOOGLE_OAUTH_CLIENT_SECRET": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"GOOGLE_OAUTH_REFRESH_TOKEN": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"SHEETS_CACHE_TTL": {
		"context": "server",
		"access": "secret",
		"default": 60,
		"type": "number"
	},
	"DATA_DIR": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"CLIENT_IP_HEADER": {
		"context": "server",
		"access": "secret",
		"default": "",
		"type": "string"
	},
	"TRUSTED_PROXY_HOPS": {
		"context": "server",
		"access": "secret",
		"default": 1,
		"type": "number"
	},
	"SITE_URL": {
		"context": "server",
		"access": "secret",
		"url": true,
		"type": "string"
	},
	"REVALIDATE_SECRET": {
		"context": "server",
		"access": "secret",
		"min": 32,
		"type": "string"
	},
	"VOTE_SALT": {
		"context": "server",
		"access": "secret",
		"min": 32,
		"type": "string"
	},
	"ADMIN_PASSWORD_HASH": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"min": 80,
		"type": "string"
	},
	"ADMIN_SESSION_SECRET": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"min": 32,
		"type": "string"
	},
	"ADMIN_USER": {
		"context": "server",
		"access": "secret",
		"default": "owner",
		"type": "string"
	},
	"RETAIL_MARKUP": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "number"
	},
	"GOOGLE_DRIVE_FOLDER_ID": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"SCRAPE_JINA_FALLBACK": {
		"context": "server",
		"access": "secret",
		"default": true,
		"type": "boolean"
	},
	"SCRAPE_ECG_GRAPHQL": {
		"context": "server",
		"access": "secret",
		"default": false,
		"type": "boolean"
	},
	"SCRAPE_RESPECT_ROBOTS": {
		"context": "server",
		"access": "secret",
		"default": true,
		"type": "boolean"
	},
	"AUTH_SECRET": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"min": 32,
		"type": "string"
	},
	"PUBLIC_CATALOGUE": {
		"context": "server",
		"access": "secret",
		"default": true,
		"type": "boolean"
	},
	"SITE_PASSWORD_HASH": {
		"context": "server",
		"access": "secret",
		"optional": true,
		"type": "string"
	},
	"BASE_CURRENCY": {
		"context": "server",
		"access": "secret",
		"default": "USD",
		"type": "string"
	},
	"FX_API_URL": {
		"context": "server",
		"access": "secret",
		"default": "https://api.frankfurter.dev/v1/latest",
		"type": "string"
	},
	"FX_REFRESH_HOURS": {
		"context": "server",
		"access": "secret",
		"default": 24,
		"type": "number"
	}
};
//#endregion
//#region \0astro:env/server
/** @returns {string} */
var getEnv = (key) => {
	return getEnv$1(key);
};
var _internalGetSecret = (key) => {
	const rawVariable = getEnv(key);
	const variable = rawVariable === "" ? void 0 : rawVariable;
	const options = schema[key];
	const result = validateEnvVariable(variable, options);
	if (result.ok) return result.value;
	const type = getEnvFieldType(options);
	throw createInvalidVariablesError(key, type, result);
};
setOnSetGetEnv(() => {
	GOOGLE_SHEET_ID = _internalGetSecret("GOOGLE_SHEET_ID");
	GOOGLE_AUTH_MODE = _internalGetSecret("GOOGLE_AUTH_MODE");
	GOOGLE_SERVICE_ACCOUNT_EMAIL = _internalGetSecret("GOOGLE_SERVICE_ACCOUNT_EMAIL");
	GOOGLE_PRIVATE_KEY = _internalGetSecret("GOOGLE_PRIVATE_KEY");
	GOOGLE_OAUTH_CLIENT_ID = _internalGetSecret("GOOGLE_OAUTH_CLIENT_ID");
	GOOGLE_OAUTH_CLIENT_SECRET = _internalGetSecret("GOOGLE_OAUTH_CLIENT_SECRET");
	GOOGLE_OAUTH_REFRESH_TOKEN = _internalGetSecret("GOOGLE_OAUTH_REFRESH_TOKEN");
	SHEETS_CACHE_TTL = _internalGetSecret("SHEETS_CACHE_TTL");
	DATA_DIR = _internalGetSecret("DATA_DIR");
	CLIENT_IP_HEADER = _internalGetSecret("CLIENT_IP_HEADER");
	TRUSTED_PROXY_HOPS = _internalGetSecret("TRUSTED_PROXY_HOPS");
	SITE_URL = _internalGetSecret("SITE_URL");
	REVALIDATE_SECRET = _internalGetSecret("REVALIDATE_SECRET");
	VOTE_SALT = _internalGetSecret("VOTE_SALT");
	ADMIN_PASSWORD_HASH = _internalGetSecret("ADMIN_PASSWORD_HASH");
	ADMIN_SESSION_SECRET = _internalGetSecret("ADMIN_SESSION_SECRET");
	ADMIN_USER = _internalGetSecret("ADMIN_USER");
	RETAIL_MARKUP = _internalGetSecret("RETAIL_MARKUP");
	GOOGLE_DRIVE_FOLDER_ID = _internalGetSecret("GOOGLE_DRIVE_FOLDER_ID");
	SCRAPE_JINA_FALLBACK = _internalGetSecret("SCRAPE_JINA_FALLBACK");
	SCRAPE_ECG_GRAPHQL = _internalGetSecret("SCRAPE_ECG_GRAPHQL");
	SCRAPE_RESPECT_ROBOTS = _internalGetSecret("SCRAPE_RESPECT_ROBOTS");
	AUTH_SECRET = _internalGetSecret("AUTH_SECRET");
	PUBLIC_CATALOGUE = _internalGetSecret("PUBLIC_CATALOGUE");
	SITE_PASSWORD_HASH = _internalGetSecret("SITE_PASSWORD_HASH");
	BASE_CURRENCY = _internalGetSecret("BASE_CURRENCY");
	FX_API_URL = _internalGetSecret("FX_API_URL");
	FX_REFRESH_HOURS = _internalGetSecret("FX_REFRESH_HOURS");
});
var GOOGLE_SHEET_ID = _internalGetSecret("GOOGLE_SHEET_ID");
var GOOGLE_AUTH_MODE = _internalGetSecret("GOOGLE_AUTH_MODE");
var GOOGLE_SERVICE_ACCOUNT_EMAIL = _internalGetSecret("GOOGLE_SERVICE_ACCOUNT_EMAIL");
var GOOGLE_PRIVATE_KEY = _internalGetSecret("GOOGLE_PRIVATE_KEY");
var GOOGLE_OAUTH_CLIENT_ID = _internalGetSecret("GOOGLE_OAUTH_CLIENT_ID");
var GOOGLE_OAUTH_CLIENT_SECRET = _internalGetSecret("GOOGLE_OAUTH_CLIENT_SECRET");
var GOOGLE_OAUTH_REFRESH_TOKEN = _internalGetSecret("GOOGLE_OAUTH_REFRESH_TOKEN");
var SHEETS_CACHE_TTL = _internalGetSecret("SHEETS_CACHE_TTL");
var DATA_DIR = _internalGetSecret("DATA_DIR");
var CLIENT_IP_HEADER = _internalGetSecret("CLIENT_IP_HEADER");
var TRUSTED_PROXY_HOPS = _internalGetSecret("TRUSTED_PROXY_HOPS");
var SITE_URL = _internalGetSecret("SITE_URL");
var REVALIDATE_SECRET = _internalGetSecret("REVALIDATE_SECRET");
var VOTE_SALT = _internalGetSecret("VOTE_SALT");
var ADMIN_PASSWORD_HASH = _internalGetSecret("ADMIN_PASSWORD_HASH");
var ADMIN_SESSION_SECRET = _internalGetSecret("ADMIN_SESSION_SECRET");
var ADMIN_USER = _internalGetSecret("ADMIN_USER");
var RETAIL_MARKUP = _internalGetSecret("RETAIL_MARKUP");
var GOOGLE_DRIVE_FOLDER_ID = _internalGetSecret("GOOGLE_DRIVE_FOLDER_ID");
var SCRAPE_JINA_FALLBACK = _internalGetSecret("SCRAPE_JINA_FALLBACK");
var SCRAPE_ECG_GRAPHQL = _internalGetSecret("SCRAPE_ECG_GRAPHQL");
var SCRAPE_RESPECT_ROBOTS = _internalGetSecret("SCRAPE_RESPECT_ROBOTS");
var AUTH_SECRET = _internalGetSecret("AUTH_SECRET");
var PUBLIC_CATALOGUE = _internalGetSecret("PUBLIC_CATALOGUE");
var SITE_PASSWORD_HASH = _internalGetSecret("SITE_PASSWORD_HASH");
var BASE_CURRENCY = _internalGetSecret("BASE_CURRENCY");
var FX_API_URL = _internalGetSecret("FX_API_URL");
var FX_REFRESH_HOURS = _internalGetSecret("FX_REFRESH_HOURS");
//#endregion
//#region src/lib/sheets/errors.ts
var SheetsApiError = class extends Error {
	status;
	googleStatus;
	retryable;
	constructor(status, message, googleStatus) {
		super(message);
		this.name = "SheetsApiError";
		this.status = status;
		this.googleStatus = googleStatus;
		this.retryable = status === 429 || status === 503;
	}
};
var SheetContractError = class extends Error {
	tab;
	mismatches;
	constructor(tab, mismatches) {
		super(`Sheet contract violated in tab "${tab}": ${mismatches.join("; ")}`);
		this.name = "SheetContractError";
		this.tab = tab;
		this.mismatches = mismatches;
	}
};
var SCRUB_PATTERNS = [
	/-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END[A-Z ]*PRIVATE KEY-----|$)/g,
	/\b(refresh_token|client_secret|assertion|private_key|access_token|id_token|authorization|code_verifier)\b["']?\s*[:=]\s*["']?(?:bearer\s+)?[^\s"'&,;}]*/gi,
	/\bbearer\s+[A-Za-z0-9._~+/=-]+/gi,
	/\bya29\.[A-Za-z0-9._-]+/g,
	/\b1\/\/[A-Za-z0-9._-]+/g,
	/\bGOCSPX-[A-Za-z0-9_-]+/g,
	/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(\.[A-Za-z0-9_-]+)?/g
];
function scrub(s) {
	let out = s;
	for (const re of SCRUB_PATTERNS) out = out.replace(re, "[redacted]");
	return out.slice(0, 500);
}
function summariseCause(e) {
	const cause = e?.cause;
	if (!cause || typeof cause !== "object") return void 0;
	const c = cause;
	const parts = [
		c.name,
		c.code,
		c.message
	].filter((p) => typeof p === "string" || typeof p === "number").map(String);
	return parts.length ? scrub(parts.join(" ")) : void 0;
}
/** Allow-listed view of an error for logging; strips anything that looks like a credential. */
function serializeError(e) {
	const cause = summariseCause(e);
	if (e instanceof SheetsApiError) return {
		name: e.name,
		message: scrub(e.message),
		status: e.status,
		googleStatus: e.googleStatus,
		...cause ? { cause } : {}
	};
	if (e instanceof SheetContractError) return {
		name: e.name,
		message: scrub(e.message),
		tab: e.tab
	};
	if (e instanceof Error) return {
		name: e.name,
		message: scrub(e.message),
		...cause ? { cause } : {}
	};
	return {
		name: "UnknownError",
		message: scrub(String(e))
	};
}
var consoleLogger = {
	info: (msg, data) => console.info(`[sheets] ${msg}`, data ?? ""),
	warn: (msg, data) => console.warn(`[sheets] ${msg}`, data ?? ""),
	error: (msg, data) => console.error(`[sheets] ${msg}`, data ?? "")
};
var silentLogger = {
	info: () => {},
	warn: () => {},
	error: () => {}
};
//#endregion
//#region src/lib/images.ts
var DRIVE_ID_RE = /^[A-Za-z0-9_-]{20,128}$/;
/** Hosts an editor-supplied https image URL may point at (cover images, ADR §5). */
var IMAGE_HOSTS = ["lh3.googleusercontent.com", "drive.google.com"];
/** Extracts a Drive file id from a bare id or any common Drive / lh3 URL shape; null when none. */
function extractDriveId(input) {
	const s = input.trim();
	if (!s) return null;
	if (DRIVE_ID_RE.test(s)) return s;
	let url;
	try {
		url = new URL(s);
	} catch {
		return null;
	}
	const fromQuery = url.searchParams.get("id");
	if (fromQuery && DRIVE_ID_RE.test(fromQuery)) return fromQuery;
	return url.pathname.match(/\/(?:file\/d|d)\/([A-Za-z0-9_-]{20,128})(?:[/=]|$)/)?.[1] ?? null;
}
/**
* The direct lh3 URL. Still the upstream the proxy fetches from, and still what the admin's own
* previews use, but no longer what a visitor's browser is pointed at.
*/
function lh3Url(fileId, width = 800) {
	if (!DRIVE_ID_RE.test(fileId)) throw new Error("lh3Url: invalid Drive file id");
	return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
}
/**
* What a page renders (brief §12). Photos are served from this origin rather than from Drive: Drive
* is not a content network, lh3 is rate-limited and outside our cache and CSP control, and a file id
* addresses one immutable blob — so the proxy can mark it cacheable for a year.
*
* This is the only place an image URL is formed, so switching the upstream again later is one edit.
*/
function driveImageUrl(fileId, width = 800) {
	if (!DRIVE_ID_RE.test(fileId)) throw new Error("driveImageUrl: invalid Drive file id");
	return `/api/image/${fileId}?w=${width}`;
}
/** Normalises an editor-typed image cell: Drive id/URL → lh3, allow-listed https URL → as is, else a reason. */
function normaliseImageUrl(input) {
	const id = extractDriveId(input);
	if (id) return { url: driveImageUrl(id, 1600) };
	let url;
	try {
		url = new URL(input.trim());
	} catch {
		return { reason: "not a Drive id/URL or https URL" };
	}
	if (url.protocol !== "https:") return { reason: "only https URLs are allowed" };
	if (!IMAGE_HOSTS.includes(url.hostname)) return { reason: `host "${url.hostname}" is not allow-listed` };
	return { url: url.toString() };
}
//#endregion
//#region src/lib/sheets/contract.ts
var TABS = {
	products: "Products",
	collections: "Collections",
	customers: "Customers",
	reactions: "Reactions",
	reactionsArchive: "ReactionsArchive",
	visits: "Visits",
	tags: "Tags",
	rates: "Rates",
	auditLog: "AuditLog",
	settings: "Settings"
};
/** Shopify's product-CSV headers, in the casing the sheet and the CSV export use (brief §9). */
var PRODUCT_HEADER_LABELS = [
	"Product ID",
	"Handle",
	"Title",
	"Body (HTML)",
	"Vendor",
	"Product Category",
	"Type",
	"Tags",
	"Published",
	"Option1 Name",
	"Option1 Value",
	"Variant SKU",
	"Variant Grams",
	"Variant Inventory Qty",
	"Variant Inventory Policy",
	"Variant Price",
	"Variant Compare At Price",
	"Variant Requires Shipping",
	"Variant Taxable",
	"Image Src",
	"Image Alt Text",
	"SEO Title",
	"SEO Description",
	"Status",
	"Width CM",
	"Length CM",
	"Size Label",
	"Size Band",
	"Material",
	"Method",
	"Origin",
	"Age",
	"Pile",
	"Shape",
	"Collection",
	"Source URL",
	"Source Site",
	"Drive Folder ID",
	"Drive Folder URL",
	"Scraped At",
	"Commit Status",
	"Internal Notes"
];
/** Zero-based column index of every Products field (A..AP). */
var PRODUCT_COLS = {
	productId: 0,
	handle: 1,
	title: 2,
	bodyHtml: 3,
	vendor: 4,
	productCategory: 5,
	type: 6,
	tags: 7,
	published: 8,
	option1Name: 9,
	option1Value: 10,
	variantSku: 11,
	variantGrams: 12,
	variantInventoryQty: 13,
	variantInventoryPolicy: 14,
	variantPrice: 15,
	variantCompareAtPrice: 16,
	variantRequiresShipping: 17,
	variantTaxable: 18,
	imageSrc: 19,
	imageAltText: 20,
	seoTitle: 21,
	seoDescription: 22,
	status: 23,
	widthCm: 24,
	lengthCm: 25,
	sizeLabel: 26,
	sizeBand: 27,
	material: 28,
	method: 29,
	origin: 30,
	age: 31,
	pile: 32,
	shape: 33,
	collection: 34,
	sourceUrl: 35,
	sourceSite: 36,
	driveFolderId: 37,
	driveFolderUrl: 38,
	scrapedAt: 39,
	commitStatus: 40,
	internalNotes: 41
};
/** Number of columns a Products row occupies (A..AP). */
var PRODUCT_WIDTH = PRODUCT_HEADER_LABELS.length;
var HEADERS = {
	Products: PRODUCT_HEADER_LABELS.map((h) => h.toLowerCase()),
	Collections: [
		"id",
		"name",
		"slug",
		"description",
		"created_at",
		"cover_image_url",
		"sort_order"
	],
	Customers: [
		"slug",
		"display_name",
		"password_hash",
		"note",
		"created_at",
		"active"
	],
	Reactions: [
		"event_id",
		"customer_slug",
		"product_id",
		"reaction",
		"source",
		"created_at"
	],
	ReactionsArchive: [
		"event_id",
		"customer_slug",
		"product_id",
		"reaction",
		"source",
		"created_at"
	],
	Visits: [
		"event_id",
		"customer_slug",
		"occurred_at",
		"user_agent",
		"referrer"
	],
	Tags: [
		"id",
		"slug",
		"name",
		"color"
	],
	Rates: [
		"currency",
		"rate_to_base",
		"symbol",
		"updated_at"
	],
	AuditLog: [
		"timestamp",
		"actor",
		"action",
		"target_tab",
		"target_id",
		"before",
		"after",
		"ip_hash",
		"request_id",
		"note"
	],
	Settings: [
		"key",
		"value",
		"updated_at",
		"updated_by"
	]
};
/** Settings rows seeded by scripts/init-sheet.ts when the tab has no data rows. */
var SETTINGS_SEED = [
	["retail_markup", ""],
	["retail_markup.ecarpetgallery", ""],
	["retail_markup.karavanrug", ""],
	["price_round_step", "5"],
	["default_status", "draft"]
];
/** How many newest Reactions rows are read to rebuild the customer→product state map (brief §3). */
var REACTIONS_WINDOW_ROWS = 5e3;
/** One batchGet per refresh; order matters (parsed positionally by parseSnapshot). */
var READ_RANGES = [
	`${TABS.products}!A1:AP`,
	`${TABS.collections}!A1:G`,
	`${TABS.tags}!A1:D`,
	`${TABS.rates}!A1:D`,
	`${TABS.reactions}!A1:F5001`,
	`${TABS.customers}!A1:F`
];
/** Reference ORDER list; used only when the Collections tab is empty (ADR D10.5). */
var REFERENCE_COLLECTION_ORDER = [
	"Classics",
	"Gabbeh",
	"Modern",
	"Kilims",
	"Tulu",
	"Wabi Sabi",
	"Signed",
	"More"
];
/**
* Seed values for the Rates tab. `rate_to_base` is "how many units of this currency per 1 base unit"
* and doubles as the hardcoded fallback table when the FX API is unreachable (brief §8).
*/
var RATES_SEED = [
	[
		"USD",
		1,
		"$"
	],
	[
		"EUR",
		.92,
		"€"
	],
	[
		"GBP",
		.79,
		"£"
	],
	[
		"CAD",
		1.37,
		"$"
	],
	[
		"MXN",
		17.5,
		"$"
	],
	[
		"AED",
		3.67,
		"AED "
	],
	[
		"SAR",
		3.75,
		"SAR "
	]
];
/**
* The pre-brief Collections header. The brief reordered it (name before slug) and added
* `created_at`, so an existing spreadsheet keeps the old shape until `sheet:init` upgrades it.
*/
var LEGACY_COLLECTIONS_HEADERS = [
	"id",
	"slug",
	"name",
	"description",
	"cover_image_url",
	"sort_order"
];
//#endregion
//#region src/lib/text.ts
function slugify(input, max = 80) {
	return input.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/g, "");
}
/** Splits a pipe-separated cell into trimmed, de-duplicated (case-insensitive) parts. */
function splitPipe(cell) {
	if (!cell) return [];
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const raw of cell.split("|")) {
		const v = raw.trim();
		if (!v) continue;
		const key = v.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(v);
	}
	return out;
}
/** Import-time canonicalisation of the legacy collection spellings (ADR D10.5). */
var CANONICAL_COLLECTIONS = {
	"wabi-sabi": "Wabi Sabi",
	wabisabi: "Wabi Sabi",
	"wabi sabi": "Wabi Sabi",
	kilim: "Kilims",
	kilims: "Kilims",
	tulu: "Tulu",
	tülü: "Tulu"
};
function canonicalCollection(name) {
	const trimmed = name.trim();
	return CANONICAL_COLLECTIONS[trimmed.toLowerCase()] ?? trimmed;
}
function normaliseKey(s) {
	return s.trim().toLowerCase();
}
function displayCollection(name) {
	return name.trim() || "More";
}
/**
* Collection slug: the Collections row's slug when the name matches (case-insensitively), else the
* slugified name, never empty. Tabs, card filtering, counts and ordering all key on this one value,
* so an owner-typed spelling variant ("Wabi-sabi") lands in the same tab as "Wabi Sabi".
*/
function collectionSlug(name, collections) {
	const display = displayCollection(name);
	return collections.find((c) => normaliseKey(c.name) === normaliseKey(display))?.slug || slugify(display) || "other";
}
/**
* Splits the `Collection` cell into the names a product belongs to (owner requirement 2026-09-13).
*
* Pipe-only, deliberately unlike `splitTags`, which also accepts commas: a collection name is prose
* the owner types, and "Wabi Sabi, Vol. 2" must stay one collection. A cell with no pipe is one
* name — which is what every row written before this change already is, so no migration is needed.
*/
function splitCollections(cell) {
	return splitPipe(cell);
}
/** The inverse: the cell to write back. Trimmed, de-duplicated, pipe-joined. */
function joinCollections(names) {
	return splitPipe(names.join("|")).join(" | ");
}
/**
* Every slug a product should be reachable under, in the order the owner listed them.
*
* De-duplicated on the SLUG, not the name, because two spellings the owner typed ("Wabi-sabi" and
* "Wabi Sabi") collapse to one tab and must not make the rug appear in it twice.
*/
function collectionSlugs(names, collections) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const name of names.length ? names : [""]) {
		const slug = collectionSlug(name, collections);
		if (seen.has(slug)) continue;
		seen.add(slug);
		out.push(slug);
	}
	return out;
}
//#endregion
//#region src/lib/size.ts
/** "240 × 170 cm" (width × length), empty when a side is unknown — the brief's rendering. */
function sizeLabelOf(widthCm, lengthCm) {
	if (!widthCm || !lengthCm) return "";
	return `${round(widthCm)} × ${round(lengthCm)} cm`;
}
function round(cm) {
	return Math.round(cm * 10) / 10;
}
/** Band from the area in m²: <0.75 XS · ≤2.5 S · ≤5 M · ≤10 L · >10 XL (brief §11, boundaries inclusive). */
function sizeBandOf(widthCm, lengthCm) {
	if (!widthCm || !lengthCm) return "";
	const m2 = widthCm / 100 * (lengthCm / 100);
	if (m2 < .75) return "XS";
	if (m2 <= 2.5) return "S";
	if (m2 <= 5) return "M";
	if (m2 <= 10) return "L";
	return "XL";
}
//#endregion
//#region src/lib/sheets/parse.ts
/** Blank = null/undefined or a whitespace-only string (ADR §5: blanks → undefined). */
var blank = (v) => v === null || v === void 0 || typeof v === "string" && v.trim() === "" ? void 0 : v;
var asTrimmed = (v) => {
	const b = blank(v);
	return b === void 0 ? void 0 : String(b).trim();
};
var trimmed = z.preprocess(asTrimmed, z.string().optional());
var required = z.preprocess(asTrimmed, z.string().min(1));
var untrimmed = z.preprocess((v) => {
	const b = blank(v);
	return b === void 0 ? void 0 : String(b);
}, z.string().optional());
/** Numbers arrive as JSON numbers under UNFORMATTED_VALUE; a text cell must be a plain decimal. */
function toNumber(v) {
	const b = blank(v);
	if (b === void 0) return void 0;
	if (typeof b === "number") return b;
	if (typeof b === "boolean") return b;
	const s = String(b).trim();
	return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s;
}
var num = z.preprocess(toNumber, z.number().optional());
/** Checkbox booleans, "true"/"false" and 1/0; blank → false. */
var bool = z.preprocess((v) => {
	const b = blank(v);
	if (b === void 0) return false;
	if (typeof b === "boolean") return b;
	const t = String(b).trim().toLowerCase();
	if (t === "true" || t === "1" || t === "yes") return true;
	if (t === "false" || t === "0" || t === "no") return false;
	return b;
}, z.boolean());
var ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
var SLUG_RE = /^[a-z0-9-]{1,80}$/;
var COLOR_RE = /^#[0-9a-fA-F]{6}$/;
/** A customer slug (Reactions/Visits) uses the same alphabet as the retired client code. */
var CLIENT_RE = /^[A-Za-z0-9_-]{1,64}$/;
var id = z.preprocess(asTrimmed, z.string().regex(ID_RE, "id must be 1-64 letters, digits, \"-\" or \"_\""));
var status = z.preprocess((v) => {
	const b = blank(v);
	return b === void 0 ? "active" : String(b).trim().toLowerCase();
}, z.enum([
	"active",
	"draft",
	"archived"
]));
/** Products is index-mapped (Shopify headers contain spaces and parentheses), so the schema is flat. */
var ProductRow = z.object({
	id,
	handle: trimmed,
	title: required,
	body_html: trimmed,
	vendor: trimmed,
	product_category: trimmed,
	type: trimmed,
	tags: trimmed,
	published: bool,
	variant_sku: trimmed,
	variant_grams: num,
	variant_inventory_qty: num,
	variant_inventory_policy: trimmed,
	variant_price: num,
	variant_compare_at_price: num,
	variant_requires_shipping: bool,
	variant_taxable: bool,
	image_src: trimmed,
	image_alt_text: trimmed,
	seo_title: trimmed,
	seo_description: trimmed,
	status,
	width_cm: num,
	length_cm: num,
	size_label: trimmed,
	size_band: trimmed,
	material: trimmed,
	method: trimmed,
	origin: trimmed,
	age: trimmed,
	pile: trimmed,
	shape: trimmed,
	collection: trimmed,
	source_url: trimmed,
	source_site: trimmed,
	drive_folder_id: trimmed,
	drive_folder_url: trimmed,
	scraped_at: trimmed,
	commit_status: z.preprocess((v) => asTrimmed(v)?.toLowerCase() ?? "", z.enum([
		"pending",
		"complete",
		""
	])),
	internal_notes: trimmed
});
var CollectionRow = z.object({
	id: trimmed,
	name: required,
	slug: trimmed,
	description: trimmed,
	created_at: trimmed,
	cover_image_url: trimmed,
	sort_order: num
});
var CustomerRow = z.object({
	slug: z.preprocess(asTrimmed, z.string().regex(SLUG_RE, "slug must be lowercase url-safe")),
	display_name: required,
	password_hash: trimmed,
	note: trimmed,
	created_at: trimmed,
	active: z.preprocess((v) => blank(v) === void 0 ? true : v, bool)
});
var ReactionRowSchema = z.object({
	event_id: trimmed,
	customer_slug: z.preprocess(asTrimmed, z.string().regex(CLIENT_RE, "customer_slug is not url-safe")),
	product_id: id,
	reaction: z.preprocess((v) => asTrimmed(v)?.toLowerCase(), z.enum([
		"like",
		"dislike",
		"none"
	])),
	source: z.preprocess((v) => asTrimmed(v)?.toLowerCase() ?? "card", z.enum(["card", "detail"])),
	created_at: trimmed
});
var TagRow = z.object({
	id: trimmed,
	slug: trimmed,
	name: required,
	color: trimmed
});
var RateRow = z.object({
	currency: z.preprocess((v) => asTrimmed(v)?.toUpperCase(), z.string().regex(/^[A-Z]{3}$/)),
	rate_to_base: z.preprocess(toNumber, z.number().positive()),
	symbol: untrimmed,
	updated_at: trimmed
});
function assertHeaders(tab, headerRow) {
	const expected = HEADERS[tab];
	const actual = (headerRow ?? []).map((c) => String(c ?? "").trim().toLowerCase());
	const mismatches = [];
	expected.forEach((name, i) => {
		if (actual[i] !== name) mismatches.push(`column ${columnLetter(i)} should be "${name}" but is "${actual[i] ?? ""}"`);
	});
	if (mismatches.length) throw new SheetContractError(tab, mismatches);
}
function columnLetter(index) {
	let n = index + 1;
	let s = "";
	while (n > 0) {
		const r = (n - 1) % 26;
		s = String.fromCharCode(65 + r) + s;
		n = Math.floor((n - 1) / 26);
	}
	return s;
}
/** Validates the header row (always, even for an empty tab) and maps data rows to header-keyed objects. */
function rowsToObjects(tab, values) {
	assertHeaders(tab, values?.[0]);
	if (!values || values.length < 2) return [];
	const headers = HEADERS[tab];
	const out = [];
	for (let i = 1; i < values.length; i++) {
		const cells = values[i] ?? [];
		if (cells.every((c) => blank(c) === void 0)) continue;
		const raw = {};
		headers.forEach((h, j) => {
			raw[h] = cells[j];
		});
		out.push({
			row: i + 1,
			raw
		});
	}
	return out;
}
function issuesOf(error) {
	return error.issues.map((i) => `${i.path.join(".") || "(row)"}: ${i.message}`);
}
/** Maps a Products row (index-based) onto the flat keys of ProductRow. */
function productRaw(cells) {
	const at = (i) => cells[i];
	return {
		id: at(PRODUCT_COLS.productId),
		handle: at(PRODUCT_COLS.handle),
		title: at(PRODUCT_COLS.title),
		body_html: at(PRODUCT_COLS.bodyHtml),
		vendor: at(PRODUCT_COLS.vendor),
		product_category: at(PRODUCT_COLS.productCategory),
		type: at(PRODUCT_COLS.type),
		tags: at(PRODUCT_COLS.tags),
		published: at(PRODUCT_COLS.published),
		variant_sku: at(PRODUCT_COLS.variantSku),
		variant_grams: at(PRODUCT_COLS.variantGrams),
		variant_inventory_qty: at(PRODUCT_COLS.variantInventoryQty),
		variant_inventory_policy: at(PRODUCT_COLS.variantInventoryPolicy),
		variant_price: at(PRODUCT_COLS.variantPrice),
		variant_compare_at_price: at(PRODUCT_COLS.variantCompareAtPrice),
		variant_requires_shipping: at(PRODUCT_COLS.variantRequiresShipping),
		variant_taxable: at(PRODUCT_COLS.variantTaxable),
		image_src: at(PRODUCT_COLS.imageSrc),
		image_alt_text: at(PRODUCT_COLS.imageAltText),
		seo_title: at(PRODUCT_COLS.seoTitle),
		seo_description: at(PRODUCT_COLS.seoDescription),
		status: at(PRODUCT_COLS.status),
		width_cm: at(PRODUCT_COLS.widthCm),
		length_cm: at(PRODUCT_COLS.lengthCm),
		size_label: at(PRODUCT_COLS.sizeLabel),
		size_band: at(PRODUCT_COLS.sizeBand),
		material: at(PRODUCT_COLS.material),
		method: at(PRODUCT_COLS.method),
		origin: at(PRODUCT_COLS.origin),
		age: at(PRODUCT_COLS.age),
		pile: at(PRODUCT_COLS.pile),
		shape: at(PRODUCT_COLS.shape),
		collection: at(PRODUCT_COLS.collection),
		source_url: at(PRODUCT_COLS.sourceUrl),
		source_site: at(PRODUCT_COLS.sourceSite),
		drive_folder_id: at(PRODUCT_COLS.driveFolderId),
		drive_folder_url: at(PRODUCT_COLS.driveFolderUrl),
		scraped_at: at(PRODUCT_COLS.scrapedAt),
		commit_status: at(PRODUCT_COLS.commitStatus),
		internal_notes: at(PRODUCT_COLS.internalNotes)
	};
}
/** Shopify CSV tags are comma-separated; the pre-brief sheet used "|". Accept both. */
function splitTags(value) {
	if (!value) return [];
	return (value.includes("|") ? splitPipe(value) : value.split(",")).map((t) => t.trim()).filter(Boolean);
}
/** No column exists for these in the Shopify set, so they ride on tags (documented in ADR D15). */
function flagsFromTags(tags) {
	let featured = false;
	let rotate = "false";
	const rest = [];
	for (const t of tags) {
		const k = t.trim().toLowerCase();
		if (k === "featured") featured = true;
		else if (k === "rotate-force") rotate = "force";
		else if (k === "rotate") rotate = rotate === "force" ? "force" : "true";
		else rest.push(t);
	}
	return {
		featured,
		rotate,
		rest
	};
}
function parseProducts(values) {
	const items = [];
	const dropped = [];
	const warnings = [];
	const seenSlugs = /* @__PURE__ */ new Map();
	const seenIds = /* @__PURE__ */ new Set();
	assertHeaders(TABS.products, values?.[0]);
	const rows = values ?? [];
	for (let i = 1; i < rows.length; i++) {
		const cells = rows[i] ?? [];
		if (cells.every((c) => blank(c) === void 0)) continue;
		const row = i + 1;
		const raw = productRaw(cells);
		if (blank(raw.id) === void 0) continue;
		const parsed = ProductRow.safeParse(raw);
		if (!parsed.success) {
			dropped.push({
				tab: TABS.products,
				row,
				issues: issuesOf(parsed.error)
			});
			continue;
		}
		const p = parsed.data;
		if (seenIds.has(p.id)) {
			dropped.push({
				tab: TABS.products,
				row,
				issues: [`id: "${p.id}" duplicates an earlier row`]
			});
			continue;
		}
		seenIds.add(p.id);
		const warn = [];
		const photos = [];
		if (p.image_src) {
			const fid = extractDriveId(p.image_src);
			if (fid) photos.push(fid);
			else if (!/^https:\/\//i.test(p.image_src)) warn.push(`image src: "${p.image_src.slice(0, 40)}" is not a Drive id/URL or https URL`);
		}
		let slug;
		if (p.handle !== void 0 && !SLUG_RE.test(p.handle)) {
			warn.push(`handle: "${p.handle.slice(0, 40)}" is not a valid handle and was replaced`);
			slug = slugify(p.title);
		} else slug = p.handle ?? slugify(p.title);
		if (!slug) slug = slugify(p.id) || p.id.toLowerCase();
		const n = seenSlugs.get(slug) ?? 0;
		seenSlugs.set(slug, n + 1);
		if (n > 0) slug = `${slug}-${n + 1}`;
		if (warn.length) warnings.push({
			tab: TABS.products,
			row,
			issues: warn
		});
		const widthCm = p.width_cm && p.width_cm > 0 ? p.width_cm : void 0;
		const lengthCm = p.length_cm && p.length_cm > 0 ? p.length_cm : void 0;
		const { featured, rotate, rest } = flagsFromTags(splitTags(p.tags));
		const collections = splitCollections(p.collection);
		items.push({
			id: p.id,
			slug,
			name: p.title,
			description: p.body_html ?? "",
			collections,
			collection: collections[0] ?? "",
			tags: rest,
			photos,
			imageSrc: p.image_src ?? "",
			imageAltText: p.image_alt_text ?? "",
			widthCm,
			lengthCm,
			sizeLabel: p.size_label ?? sizeLabelOf(widthCm, lengthCm),
			sizeBand: (p.size_band ?? sizeBandOf(widthCm, lengthCm)).toUpperCase(),
			material: p.material ?? "",
			method: p.method ?? "",
			origin: p.origin ?? "",
			age: p.age ?? "",
			pile: p.pile ?? "",
			shape: p.shape ?? "",
			priceUsd: p.variant_price && p.variant_price > 0 ? p.variant_price : void 0,
			compareAtPrice: p.variant_compare_at_price && p.variant_compare_at_price > 0 ? p.variant_compare_at_price : void 0,
			vendor: p.vendor ?? "",
			productCategory: p.product_category ?? "",
			productType: p.type ?? "",
			published: p.published,
			variantSku: p.variant_sku ?? "",
			variantGrams: p.variant_grams,
			variantInventoryQty: p.variant_inventory_qty,
			variantInventoryPolicy: p.variant_inventory_policy ?? "",
			variantRequiresShipping: p.variant_requires_shipping,
			variantTaxable: p.variant_taxable,
			seoTitle: p.seo_title ?? "",
			seoDescription: p.seo_description ?? "",
			status: p.status,
			sourceUrl: p.source_url ?? "",
			sourceSite: p.source_site ?? "",
			driveFolderId: p.drive_folder_id ?? "",
			driveFolderUrl: p.drive_folder_url ?? "",
			scrapedAt: p.scraped_at ?? "",
			commitStatus: p.commit_status,
			internalNotes: p.internal_notes ?? "",
			featured,
			rotate,
			likes: 0,
			dislikes: 0,
			rating: 0
		});
	}
	return {
		items,
		dropped,
		warnings
	};
}
function parseCollections(values) {
	const items = [];
	const dropped = [];
	const warnings = [];
	for (const { row, raw } of rowsToObjects(TABS.collections, values)) {
		const parsed = CollectionRow.safeParse(raw);
		if (!parsed.success) {
			dropped.push({
				tab: TABS.collections,
				row,
				issues: issuesOf(parsed.error)
			});
			continue;
		}
		const c = parsed.data;
		const warn = [];
		let cover;
		if (c.cover_image_url) {
			const res = normaliseImageUrl(c.cover_image_url);
			if (res.url) cover = res.url;
			else warn.push(`cover_image_url: ${res.reason}; ignored`);
		}
		let slug = c.slug ?? slugify(c.name);
		if (c.slug !== void 0 && !SLUG_RE.test(c.slug)) {
			warn.push(`slug: "${c.slug.slice(0, 40)}" is not a valid slug and was replaced`);
			slug = slugify(c.name);
		}
		if (!slug) {
			slug = c.id && slugify(c.id) || `collection-${row}`;
			warn.push(`slug: derived "${slug}" because the name has no ASCII letters or digits`);
		}
		if (warn.length) warnings.push({
			tab: TABS.collections,
			row,
			issues: warn
		});
		items.push({
			id: c.id ?? slug,
			slug,
			name: c.name,
			description: c.description ?? "",
			createdAt: c.created_at,
			coverImageUrl: cover,
			sortOrder: c.sort_order
		});
	}
	return {
		items,
		dropped,
		warnings
	};
}
function parseTags(values) {
	const items = [];
	const dropped = [];
	const warnings = [];
	for (const { row, raw } of rowsToObjects(TABS.tags, values)) {
		const parsed = TagRow.safeParse(raw);
		if (!parsed.success) {
			dropped.push({
				tab: TABS.tags,
				row,
				issues: issuesOf(parsed.error)
			});
			continue;
		}
		const t = parsed.data;
		const warn = [];
		let slug = t.slug ?? slugify(t.name);
		if (t.slug !== void 0 && !SLUG_RE.test(t.slug)) {
			warn.push(`slug: "${t.slug.slice(0, 40)}" is not a valid slug and was replaced`);
			slug = slugify(t.name);
		}
		let color;
		if (t.color !== void 0) {
			if (COLOR_RE.test(t.color)) color = t.color;
			else warn.push(`color: "${t.color.slice(0, 20)}" is not #RRGGBB; ignored`);
		}
		if (warn.length) warnings.push({
			tab: TABS.tags,
			row,
			issues: warn
		});
		items.push({
			id: t.id ?? slugify(t.name),
			slug,
			name: t.name,
			color
		});
	}
	return {
		items,
		dropped,
		warnings
	};
}
function parseRates(values) {
	const items = [];
	const dropped = [];
	for (const { row, raw } of rowsToObjects(TABS.rates, values)) {
		const parsed = RateRow.safeParse(raw);
		if (!parsed.success) {
			dropped.push({
				tab: TABS.rates,
				row,
				issues: issuesOf(parsed.error)
			});
			continue;
		}
		const r = parsed.data;
		items.push({
			currency: r.currency,
			rateToBase: r.rate_to_base,
			symbol: r.symbol ?? "",
			updatedAt: r.updated_at
		});
	}
	return {
		items,
		dropped,
		warnings: []
	};
}
function parseCustomers(values) {
	const items = [];
	const dropped = [];
	const seen = /* @__PURE__ */ new Set();
	for (const { row, raw } of rowsToObjects(TABS.customers, values)) {
		if (blank(raw.slug) === void 0) continue;
		const parsed = CustomerRow.safeParse(raw);
		if (!parsed.success) {
			dropped.push({
				tab: TABS.customers,
				row,
				issues: issuesOf(parsed.error)
			});
			continue;
		}
		const c = parsed.data;
		if (seen.has(c.slug)) {
			dropped.push({
				tab: TABS.customers,
				row,
				issues: [`slug: "${c.slug}" duplicates an earlier row`]
			});
			continue;
		}
		seen.add(c.slug);
		items.push({
			slug: c.slug,
			displayName: c.display_name,
			passwordHash: c.password_hash ?? "",
			note: c.note ?? "",
			createdAt: c.created_at,
			active: c.active
		});
	}
	return {
		items,
		dropped,
		warnings: []
	};
}
/**
* Newest-first window (brief §3 rule 1): the latest event per (customer, product) wins, and a
* `none` event clears the pair. Counts are the number of distinct customers currently liking or
* disliking each product — the site never reads a stored count.
*/
function parseReactions(values) {
	const state = /* @__PURE__ */ new Map();
	const counts = /* @__PURE__ */ new Map();
	const dropped = [];
	const decided = /* @__PURE__ */ new Set();
	let rowsRead = 0;
	for (const { row, raw } of rowsToObjects(TABS.reactions, values)) {
		rowsRead++;
		const parsed = ReactionRowSchema.safeParse(raw);
		if (!parsed.success) {
			dropped.push({
				tab: TABS.reactions,
				row,
				issues: issuesOf(parsed.error)
			});
			continue;
		}
		const e = parsed.data;
		const pair = `${e.customer_slug} ${e.product_id}`;
		if (decided.has(pair)) continue;
		decided.add(pair);
		if (e.reaction === "none") continue;
		const vote = e.reaction;
		let byProduct = state.get(e.customer_slug);
		if (!byProduct) {
			byProduct = /* @__PURE__ */ new Map();
			state.set(e.customer_slug, byProduct);
		}
		byProduct.set(e.product_id, vote);
		const c = counts.get(e.product_id) ?? {
			likes: 0,
			dislikes: 0
		};
		if (vote === "like") c.likes++;
		else c.dislikes++;
		counts.set(e.product_id, c);
	}
	return {
		state,
		counts,
		rowsRead,
		dropped
	};
}
/** likes / (likes + dislikes) × 5, two decimals — the rule the retired sheet formula encoded. */
function ratingOf(likes, dislikes) {
	const n = likes + dislikes;
	return n === 0 ? 0 : Math.round(likes / n * 5 * 100) / 100;
}
/** Orders collections by sort_order then A→Z; falls back to the reference ORDER list when the tab is empty. */
function orderedCollectionNames(products, collections) {
	const present = [...new Set(products.flatMap((r) => r.collections?.length ? r.collections : [r.collection]).filter(Boolean))];
	const known = collections.slice().sort((a, b) => (a.sortOrder ?? 1e9) - (b.sortOrder ?? 1e9) || a.name.localeCompare(b.name)).map((c) => c.name);
	const order = known.length ? known : [...REFERENCE_COLLECTION_ORDER];
	const keyOf = (name) => collectionSlug(name, collections);
	const byKey = /* @__PURE__ */ new Map();
	for (const name of present) if (!byKey.has(keyOf(name))) byKey.set(keyOf(name), name);
	const out = [];
	for (const name of order) {
		const hit = byKey.get(keyOf(name));
		if (hit && !out.includes(hit)) out.push(hit);
	}
	const placed = new Set(out.map(keyOf));
	const rest = present.filter((n) => !placed.has(keyOf(n))).sort((a, b) => a.localeCompare(b));
	return out.concat(rest);
}
/** Parses the value ranges returned for READ_RANGES (positional). Throws SheetContractError on a bad header row. */
function parseSnapshot(ranges) {
	const [productsVR, collectionsVR, tagsVR, ratesVR, reactionsVR, customersVR] = ranges;
	const products = parseProducts(productsVR?.values);
	const collections = parseCollections(collectionsVR?.values);
	const tags = parseTags(tagsVR?.values);
	const rates = parseRates(ratesVR?.values);
	const reactions = parseReactions(reactionsVR?.values);
	const customers = parseCustomers(customersVR?.values);
	for (const p of products.items) {
		const c = reactions.counts.get(p.id);
		if (!c) continue;
		p.likes = c.likes;
		p.dislikes = c.dislikes;
		p.rating = ratingOf(c.likes, c.dislikes);
	}
	const stats = {
		[TABS.products]: {
			kept: products.items.length,
			dropped: products.dropped.length
		},
		[TABS.collections]: {
			kept: collections.items.length,
			dropped: collections.dropped.length
		},
		[TABS.tags]: {
			kept: tags.items.length,
			dropped: tags.dropped.length
		},
		[TABS.rates]: {
			kept: rates.items.length,
			dropped: rates.dropped.length
		},
		[TABS.reactions]: {
			kept: reactions.rowsRead - reactions.dropped.length,
			dropped: reactions.dropped.length
		},
		[TABS.customers]: {
			kept: customers.items.length,
			dropped: customers.dropped.length
		}
	};
	return {
		catalogue: {
			rugs: products.items,
			collections: collections.items,
			tags: tags.items,
			rates: rates.items,
			customers: customers.items
		},
		voteState: reactions.state,
		report: {
			dropped: [
				...products.dropped,
				...collections.dropped,
				...tags.dropped,
				...rates.dropped,
				...reactions.dropped,
				...customers.dropped
			],
			warnings: [
				...products.warnings,
				...collections.warnings,
				...tags.warnings
			],
			votesRowsRead: reactions.rowsRead,
			stats
		}
	};
}
//#endregion
export { GOOGLE_OAUTH_REFRESH_TOKEN as $, driveImageUrl as A, ADMIN_PASSWORD_HASH as B, RATES_SEED as C, SETTINGS_SEED as D, REFERENCE_COLLECTION_ORDER as E, SheetsApiError as F, CLIENT_IP_HEADER as G, ADMIN_USER as H, consoleLogger as I, FX_REFRESH_HOURS as J, DATA_DIR as K, scrub as L, lh3Url as M, normaliseImageUrl as N, TABS as O, SheetContractError as P, GOOGLE_OAUTH_CLIENT_SECRET as Q, serializeError as R, PRODUCT_WIDTH as S, READ_RANGES as T, AUTH_SECRET as U, ADMIN_SESSION_SECRET as V, BASE_CURRENCY as W, GOOGLE_DRIVE_FOLDER_ID as X, GOOGLE_AUTH_MODE as Y, GOOGLE_OAUTH_CLIENT_ID as Z, splitCollections as _, parseProducts as a, REVALIDATE_SECRET as at, PRODUCT_COLS as b, sizeBandOf as c, SHEETS_CACHE_TTL as ct, collectionSlug as d, TRUSTED_PROXY_HOPS as dt, GOOGLE_PRIVATE_KEY as et, collectionSlugs as f, VOTE_SALT as ft, slugify as g, normaliseKey as h, parseCollections as i, RETAIL_MARKUP as it, extractDriveId as j, DRIVE_ID_RE as k, sizeLabelOf as l, SITE_PASSWORD_HASH as lt, joinCollections as m, columnLetter as n, GOOGLE_SHEET_ID as nt, parseSnapshot as o, SCRAPE_JINA_FALLBACK as ot, displayCollection as p, FX_API_URL as q, orderedCollectionNames as r, PUBLIC_CATALOGUE as rt, parseTags as s, SCRAPE_RESPECT_ROBOTS as st, assertHeaders as t, GOOGLE_SERVICE_ACCOUNT_EMAIL as tt, canonicalCollection as u, SITE_URL as ut, HEADERS as v, REACTIONS_WINDOW_ROWS as w, PRODUCT_HEADER_LABELS as x, LEGACY_COLLECTIONS_HEADERS as y, silentLogger as z };
