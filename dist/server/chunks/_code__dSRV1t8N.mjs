import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, j as renderSlot } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_BvvdUsTx.mjs";
import { H as TABS, g as assertHeaders, i as getClient, mt as driveImageUrl, vt as consoleLogger, yt as serializeError } from "./runtime_BSzjHQXl.mjs";
import { a as adminRuntime } from "./http_CvlaKNqx.mjs";
import { h as clientLink, s as parseAdminSnapshot, t as ADMIN_READ_RANGES, x as CLIENT_CODE_RE } from "./read_3DJW8o0r.mjs";
import { t as dims } from "./units_BFAJ7W-k.mjs";
import { t as $$AdminLayout } from "./AdminLayout_D0uOZ6fo.mjs";
import { t as $$CopyButton } from "./CopyButton_B-A-r5f2.mjs";
import { n as buildSavesReport, t as SAVES_READ_RANGE } from "./saves_BmDpQFWd.mjs";
//#region src/components/ui/Badge.astro
createAstro("https://astro.build");
var $$Badge = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Badge;
	const { tone = "neutral", class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<span${addAttribute([
		"badge",
		tone !== "neutral" && `badge--${tone}`,
		className
	], "class:list")}>${renderSlot($$result, $$slots["default"])}</span>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/ui/Badge.astro", void 0);
//#endregion
//#region src/components/ui/StatBlock.astro
createAstro("https://astro.build");
var $$StatBlock = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$StatBlock;
	const { label, value, tone = "default", class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute([
		"statblock",
		tone !== "default" && `statblock--${tone}`,
		className
	], "class:list")}> <span class="statblock__label">${label}</span> <span class="statblock__value">${value}</span> </div>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/ui/StatBlock.astro", void 0);
//#endregion
//#region src/lib/admin/visits.ts
/** Bounded like the saves report: the same growth breaker governs both append-only logs. */
var VISITS_READ_RANGE = `${TABS.visits}!A1:E200001`;
var SLUG_RE = /^[A-Za-z0-9_-]{1,64}$/;
/** Anything that is not a plausible ISO timestamp is treated as unknown rather than sorted wrongly. */
var ISO_RE = /^\d{4}-\d{2}-\d{2}T/;
var text = (v) => v === void 0 || v === null ? "" : String(v).trim();
/** Parses the tab into entries, newest first, dropping anything malformed. */
function parseVisits(values) {
	assertHeaders(TABS.visits, values?.[0]);
	const entries = [];
	let dropped = 0;
	if (!values) return {
		entries,
		dropped
	};
	for (let i = 1; i < values.length; i++) {
		const cells = values[i] ?? [];
		if (cells.every((c) => text(c) === "")) continue;
		const customerSlug = text(cells[1]);
		if (!SLUG_RE.test(customerSlug)) {
			dropped++;
			continue;
		}
		const occurredAt = text(cells[2]);
		entries.push({
			customerSlug,
			occurredAt: ISO_RE.test(occurredAt) ? occurredAt : "",
			userAgent: text(cells[3]),
			referrer: text(cells[4])
		});
	}
	return {
		entries,
		dropped
	};
}
function buildVisitsReport(values, clients, now = Date.now) {
	const { entries, dropped } = parseVisits(values);
	const known = new Map(clients.map((c) => [c.code.toLowerCase(), c]));
	const byCode = /* @__PURE__ */ new Map();
	for (const e of entries) {
		const key = e.customerSlug.toLowerCase();
		const client = known.get(key);
		let row = byCode.get(key);
		if (!row) {
			row = {
				code: e.customerSlug,
				name: client?.name || e.customerSlug,
				known: Boolean(client),
				...client ? { status: client.status } : {},
				visits: 0,
				firstSeen: "",
				lastSeen: "",
				devices: []
			};
			byCode.set(key, row);
		}
		row.visits += 1;
		if (e.occurredAt) {
			if (!row.lastSeen || e.occurredAt > row.lastSeen) row.lastSeen = e.occurredAt;
			if (!row.firstSeen || e.occurredAt < row.firstSeen) row.firstSeen = e.occurredAt;
		}
		if (e.userAgent && !row.devices.includes(e.userAgent)) row.devices.push(e.userAgent);
	}
	for (const c of clients) {
		if (byCode.has(c.code.toLowerCase())) continue;
		byCode.set(c.code.toLowerCase(), {
			code: c.code,
			name: c.name,
			known: true,
			status: c.status,
			visits: 0,
			firstSeen: "",
			lastSeen: "",
			devices: []
		});
	}
	const byClient = [...byCode.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen) || a.name.localeCompare(b.name));
	const recent = entries.slice(0, 25).map((e) => {
		const client = known.get(e.customerSlug.toLowerCase());
		return {
			...e,
			name: client?.name || e.customerSlug,
			known: Boolean(client)
		};
	});
	return {
		generatedAt: new Date(now()).toISOString(),
		byClient,
		recent,
		rowsRead: entries.length,
		rowsDropped: dropped
	};
}
//#endregion
//#region src/pages/admin/clients/[code].astro
var _code__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Code,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Code = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Code;
	const code = Astro.params.code ?? "";
	if (!CLIENT_CODE_RE.test(code)) return new Response("Not found", {
		status: 404,
		headers: { "cache-control": "no-store" }
	});
	let error = "";
	let saves;
	let visits;
	let name = code;
	let status;
	let notReviewed = 0;
	let photoOf = /* @__PURE__ */ new Map();
	let sizeOf = /* @__PURE__ */ new Map();
	try {
		const ranges = await getClient().batchGet([
			...ADMIN_READ_RANGES,
			SAVES_READ_RANGE,
			VISITS_READ_RANGE
		]);
		const snapshot = parseAdminSnapshot(ranges.slice(0, ADMIN_READ_RANGES.length), { logger: consoleLogger });
		const savesReport = buildSavesReport(ranges[ADMIN_READ_RANGES.length]?.values, snapshot.rugs, snapshot.clients);
		const visitsReport = buildVisitsReport(ranges[ADMIN_READ_RANGES.length + 1]?.values, snapshot.clients);
		const key = code.toLowerCase();
		saves = savesReport.byClient.find((c) => c.code.toLowerCase() === key);
		visits = visitsReport.byClient.find((c) => c.code.toLowerCase() === key);
		const row = snapshot.clients.find((c) => c.code.toLowerCase() === key);
		if (!row && !saves && !visits) return new Response("Not found", {
			status: 404,
			headers: { "cache-control": "no-store" }
		});
		name = row?.name || saves?.name || visits?.name || code;
		status = row?.status ?? saves?.status ?? visits?.status;
		const active = snapshot.rugs;
		notReviewed = Math.max(0, active.length - (saves?.liked.length ?? 0));
		photoOf = new Map(active.map((r) => [r.id, r.photos[0] ? driveImageUrl(r.photos[0], 800) : void 0]));
		sizeOf = new Map(active.map((r) => [r.id, dims(r.widthCm, r.lengthCm, "cm")]));
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("customer detail read failed", { error: safe });
		error = safe.message;
	}
	const liked = saves?.liked ?? [];
	const link = clientLink(adminRuntime.siteUrl, code);
	const day = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short"
	}) : "";
	const sessions = visits?.visits ?? 0;
	const opened = visits?.firstSeen ? `First opened ${day(visits.firstSeen)}` : "Never opened";
	const lastSeen = visits?.lastSeen ? `last seen ${day(visits.lastSeen)}` : "";
	const metaShort = [opened, lastSeen].filter(Boolean).join(" · ");
	const metaLong = [
		link.replace(/^https?:\/\//, ""),
		opened.toLowerCase(),
		lastSeen,
		`${sessions} ${sessions === 1 ? "session" : "sessions"}`
	].filter(Boolean).join(" · ");
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": `Serio Ludere — ${name}`,
		"active": "clients",
		"sub": name,
		"data-astro-cid-kxbmmqbw": true
	}, { "default": ($$result) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result)}<div class="msg err on" data-astro-cid-kxbmmqbw>Could not read the sheet: ${error}</div>`}<section class="cust" aria-labelledby="cust-name" data-astro-cid-kxbmmqbw> <div class="cust__head" data-astro-cid-kxbmmqbw> <h2 class="cust__name" id="cust-name" data-astro-cid-kxbmmqbw>${name}</h2> <p class="cust__meta" data-astro-cid-kxbmmqbw> <span class="cust__meta-long" data-astro-cid-kxbmmqbw>${metaLong}</span> <span class="cust__meta-short" data-astro-cid-kxbmmqbw>${metaShort}</span> </p> </div>  <div class="cust__stats" data-astro-cid-kxbmmqbw> ${renderComponent($$result, "StatBlock", $$StatBlock, {
		"label": "Sessions",
		"value": sessions,
		"data-astro-cid-kxbmmqbw": true
	})} ${renderComponent($$result, "StatBlock", $$StatBlock, {
		"label": "Liked",
		"value": liked.length,
		"tone": "positive",
		"data-astro-cid-kxbmmqbw": true
	})} ${renderComponent($$result, "StatBlock", $$StatBlock, {
		"label": "Not yet reviewed",
		"value": notReviewed,
		"tone": "muted",
		"data-astro-cid-kxbmmqbw": true
	})} </div> <div class="cust__sec" data-astro-cid-kxbmmqbw> <h3 class="cust__sectitle" data-astro-cid-kxbmmqbw>
Liked<span class="cust__sec-long" data-astro-cid-kxbmmqbw> — most recent first</span> </h3> <span class="cust__rule" aria-hidden="true" data-astro-cid-kxbmmqbw></span> ${renderComponent($$result, "CopyButton", $$CopyButton, {
		"value": liked.map((r) => r.rugId).join("\n"),
		"label": `Copy ${liked.length} product ${liked.length === 1 ? "ID" : "IDs"}`,
		"data-astro-cid-kxbmmqbw": true
	})} </div> ${liked.length > 0 ? renderTemplate`<div class="cust__grid" data-astro-cid-kxbmmqbw> ${liked.map((r) => renderTemplate`<article class="gcard" data-astro-cid-kxbmmqbw> <div class="gcard__image" data-astro-cid-kxbmmqbw> ${photoOf.get(r.rugId) ? renderTemplate`<img${addAttribute(photoOf.get(r.rugId), "src")} alt="" loading="lazy" data-astro-cid-kxbmmqbw>` : renderTemplate`<span class="gcard__empty" data-astro-cid-kxbmmqbw>no photo</span>`} ${renderComponent($$result, "Badge", $$Badge, {
		"class": "gcard__badge",
		"data-astro-cid-kxbmmqbw": true
	}, { "default": ($$result) => renderTemplate`Saved` })} </div> <p class="gcard__id mono" data-astro-cid-kxbmmqbw>${r.rugId}</p> <p class="gcard__name" data-astro-cid-kxbmmqbw>${r.name}</p> <p class="gcard__size" data-astro-cid-kxbmmqbw>${sizeOf.get(r.rugId) ?? ""}</p> </article>`)} </div>` : renderTemplate`<p class="hint" data-astro-cid-kxbmmqbw>Nothing liked yet.</p>`} <p class="hint" data-astro-cid-kxbmmqbw>
Copy the product numbers to share this shortlist with a supplier.
${status === "revoked" && " This link has been revoked; the buyer can no longer sign in."} </p> </section> ` })} ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients/[code].astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients/[code].astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/clients/[code].astro";
var $$url = "/admin/clients/[code]";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/clients/[code]@_@astro
var page = () => _code__exports;
//#endregion
export { page };
