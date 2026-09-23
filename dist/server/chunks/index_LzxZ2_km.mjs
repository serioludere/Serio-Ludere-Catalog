import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, H as unescapeHTML, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, j as renderSlot } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_BUAFLNaU.mjs";
import { E as collectionSlugs, T as collectionSlug, i as getClient, mt as driveImageUrl, v as orderedCollectionNames, vt as consoleLogger, yt as serializeError } from "./runtime_xH1UDnXO.mjs";
import { a as adminRuntime } from "./http_DnCdSH9c.mjs";
import { m as roundStepOf, u as syncLabel } from "./read_Ya4YycGX.mjs";
import { f as dataRot, o as jsonForScript, r as badgesFor } from "./view_ElRMJZOl.mjs";
import { t as dims } from "./units_BFAJ7W-k.mjs";
import { t as $$PageNav } from "./PageNav_B-pEwqJa.mjs";
import { n as $$Icon, t as $$AdminLayout } from "./AdminLayout_4LOaUeJu.mjs";
import { t as $$Button } from "./Button_D7csSVX1.mjs";
import { n as $$Modal, t as $$EmptyState } from "./EmptyState_CMPkBFH5.mjs";
import { t as $$RugFields } from "./RugFields_OKY2xww0.mjs";
import { t as fetchAdminSnapshotWithLikes } from "./likes_CCcGUz6V.mjs";
import { t as $$FetchModal } from "./FetchModal_CitF8pwa.mjs";
import { n as nextRugId } from "./ids_BwgQcJe5.mjs";
import { f as reservedIds, r as driveScope } from "./_shared_CsBKEXHI.mjs";
//#region src/components/admin/Chips.astro
createAstro("https://astro.build");
var $$Chips = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Chips;
	const { id, label, chips, multi = false, class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(["chips", className], "class:list")}${addAttribute(id, "id")} role="group"${addAttribute(label, "aria-label")}${addAttribute(multi ? "true" : "false", "data-multi")}> ${chips.map((c) => renderTemplate`<button type="button"${addAttribute(["chip", { on: c.pressed === true }], "class:list")}${addAttribute(c.value, "data-value")}${addAttribute(c.pressed ? "true" : "false", "aria-pressed")}> ${c.label} ${c.count !== void 0 && ` ${c.count}`} </button>`)} </div>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/admin/Chips.astro", void 0);
//#endregion
//#region src/components/admin/RugCardAdmin.astro
createAstro("https://astro.build");
var $$RugCardAdmin = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RugCardAdmin;
	const { rug, collections, likes = 0 } = Astro.props;
	const photo = rug.photos[0] ? driveImageUrl(rug.photos[0], 800) : void 0;
	const meta = [dims(rug.widthCm, rug.lengthCm, "cm")].filter(Boolean);
	const price = rug.priceUsd ? `$${rug.priceUsd.toLocaleString("en-US")}` : "";
	const slug = rug.collection.trim() ? collectionSlug(rug.collection, collections) : "";
	const slugs = rug.collections.length ? collectionSlugs(rug.collections, collections).join(" ") : "";
	const search = [
		rug.name,
		rug.id,
		rug.supplierRef,
		rug.slug,
		rug.supplier
	].join(" ").toLowerCase().replace(/[<>]/g, " ");
	const badges = badgesFor(rug.tags);
	return renderTemplate`${maybeRenderHead($$result)}<a${addAttribute(`/admin/rugs/${encodeURIComponent(rug.id)}`, "href")} class="card" data-card${addAttribute(rug.id, "data-id")}${addAttribute(slug, "data-collection")}${addAttribute(slugs, "data-collections")}${addAttribute(rug.commitStatus === "pending" ? "photos" : "", "data-attention")}${addAttribute(search, "data-search")} data-astro-cid-lzhbdev7> <div class="ph" data-astro-cid-lzhbdev7> ${photo ? renderTemplate`<img${addAttribute(photo, "src")} alt="" loading="lazy"${addAttribute(dataRot(rug.rotate), "data-rot")} data-astro-cid-lzhbdev7>` : renderTemplate`<span data-astro-cid-lzhbdev7>no photo</span>`} ${rug.photos.length > 1 && renderTemplate`<span class="cnt" data-astro-cid-lzhbdev7>${rug.photos.length}</span>`} ${likes > 0 && renderTemplate`<span class="lk" data-astro-cid-lzhbdev7>♥ ${likes}</span>`} ${badges.length > 0 && renderTemplate`<ul class="badges" data-astro-cid-lzhbdev7> ${badges.map((b) => renderTemplate`<li class="badge-corner" data-astro-cid-lzhbdev7>${b}</li>`)} </ul>`} </div> <div class="nm" data-astro-cid-lzhbdev7>${rug.name}</div> <div class="mt" data-astro-cid-lzhbdev7> <span class="mono" data-astro-cid-lzhbdev7>${rug.id}</span> ${meta.map((m) => renderTemplate`<span class="line" data-astro-cid-lzhbdev7>${m}</span>`)} </div> ${price && renderTemplate`<div class="pr" data-astro-cid-lzhbdev7>${price}</div>`} ${rug.commitStatus === "pending" && renderTemplate`<div class="pending" data-astro-cid-lzhbdev7> <span class="status revoked" data-astro-cid-lzhbdev7>photos pending</span> </div>`} </a> ${rug.commitStatus === "pending" && renderTemplate`<button type="button" class="chip retry"${addAttribute(rug.id, "data-retry")} data-astro-cid-lzhbdev7>
Finish photo import
</button>`}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/admin/RugCardAdmin.astro", void 0);
//#endregion
//#region src/components/admin/RugRow.astro
createAstro("https://astro.build");
var $$RugRow = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RugRow;
	const { rug, collections, likes = 0 } = Astro.props;
	const slug = rug.collection.trim() ? collectionSlug(rug.collection, collections) : "";
	const slugs = rug.collections.length ? collectionSlugs(rug.collections, collections).join(" ") : "";
	const size = dims(rug.widthCm, rug.lengthCm, "cm");
	const price = rug.priceUsd ? `$${rug.priceUsd.toLocaleString("en-US")}` : "";
	const search = [
		rug.name,
		rug.id,
		rug.supplierRef,
		rug.slug,
		rug.supplier
	].join(" ").toLowerCase().replace(/[<>]/g, " ");
	return renderTemplate` ${maybeRenderHead($$result)}<div class="irow" role="row" data-card data-row${addAttribute(rug.id, "data-id")}${addAttribute(slug, "data-collection")}${addAttribute(slugs, "data-collections")}${addAttribute(rug.commitStatus === "pending" ? "photos" : "", "data-attention")}${addAttribute(search, "data-search")}> <div class="irow__line" role="presentation"> <span class="irow__id" role="cell">${rug.id}</span> <span class="irow__title" role="cell" data-cell="name">${rug.name}</span> <span class="irow__collection" role="cell">${rug.collection}</span> <span class="irow__size" role="cell">${size}</span> <span class="irow__price" role="cell">${price}</span> <span class="irow__likes" role="cell">${likes > 0 ? likes : "—"}</span> <span class="irow__spacer" role="presentation"></span> <span class="irow__action" role="cell"> ${rug.commitStatus === "pending" && renderTemplate`<button type="button" class="chip retry"${addAttribute(rug.id, "data-retry")}>
Finish photo import
</button>`} <a${addAttribute(`/admin/rugs/${encodeURIComponent(rug.id)}`, "href")}>Open</a> <button type="button"${addAttribute(rug.id, "data-edit")}>Edit</button> </span> </div>  <p class="irow__message" role="cell" aria-live="polite" hidden></p> </div>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/admin/RugRow.astro", void 0);
//#endregion
//#region src/components/admin/RugTable.astro
createAstro("https://astro.build");
var $$RugTable = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RugTable;
	const { rugs, collections, likesById } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div class="rugtable" role="table" aria-label="Products"> <div class="rugtable__head" role="row"> <span class="irow__id" role="columnheader">ID</span> <span class="irow__title" role="columnheader">Title</span> <span class="irow__collection" role="columnheader">Collection</span> <span class="irow__size" role="columnheader">Size</span> <span class="irow__price" role="columnheader">Price</span> <span class="irow__likes" role="columnheader">Likes</span>  <span class="irow__spacer" role="presentation"></span> <span class="irow__action" role="columnheader"><span class="sr-only">Actions</span></span> </div> ${rugs.map((rug) => renderTemplate`${renderComponent($$result, "RugRow", $$RugRow, {
		"rug": rug,
		"collections": collections,
		"likes": likesById?.get(rug.id) ?? 0
	})}`)} </div>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/admin/RugTable.astro", void 0);
//#endregion
//#region src/components/ui/FilterBar.astro
createAstro("https://astro.build");
var $$FilterBar = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$FilterBar;
	const { view = "list", class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(["filterbar", className], "class:list")} role="search"> ${renderSlot($$result, $$slots["search"])} ${renderSlot($$result, $$slots["filters"])} <span class="filterbar__spacer"></span> <button type="button" class="filterbar__view"${addAttribute(view === "list" ? "true" : "false", "aria-pressed")} data-view="list"> ${renderComponent($$result, "Icon", $$Icon, { "name": "list" })} <span class="sr-only">Table view</span> </button> <button type="button" class="filterbar__view"${addAttribute(view === "grid" ? "true" : "false", "aria-pressed")} data-view="grid"> ${renderComponent($$result, "Icon", $$Icon, { "name": "grid" })} <span class="sr-only">Gallery view</span> </button> </div>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/ui/FilterBar.astro", void 0);
//#endregion
//#region src/pages/admin/rugs/index.astro
var rugs_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	Astro.csp?.insertDirective("img-src 'self' https://lh3.googleusercontent.com https://cdn.shopify.com https://images.ecarpetwholesale.com data:");
	let snapshot;
	let likesById = /* @__PURE__ */ new Map();
	let error;
	try {
		const read = await fetchAdminSnapshotWithLikes(getClient(), { logger: consoleLogger });
		snapshot = read.snapshot;
		likesById = read.likesById;
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("admin rugs read failed", { error: safe });
		error = safe.message;
	}
	const rugs = snapshot?.rugs ?? [];
	const collections = snapshot?.collections ?? [];
	const counts = /* @__PURE__ */ new Map();
	for (const r of rugs) {
		const slugs = r.collections.length ? collectionSlugs(r.collections, collections) : [""];
		for (const key of slugs) counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const names = orderedCollectionNames(rugs.filter((r) => r.collections.length > 0), collections);
	const seen = /* @__PURE__ */ new Set();
	const collectionChips = [{
		value: "*",
		label: "All",
		count: rugs.length,
		pressed: true
	}];
	for (const name of [...collections.map((c) => c.name), ...names]) {
		const slug = collectionSlug(name, collections);
		if (seen.has(slug)) continue;
		seen.add(slug);
		const canonical = collections.find((c) => c.slug === slug)?.name ?? name;
		collectionChips.push({
			value: slug,
			label: canonical,
			count: counts.get(slug) ?? 0
		});
	}
	if (counts.get("")) collectionChips.push({
		value: "__none",
		label: "No collection",
		count: counts.get("")
	});
	const pendingCount = rugs.filter((r) => r.commitStatus === "pending").length;
	await driveScope();
	const driveScopeOk = adminRuntime.driveScopeOk ?? null;
	const tags = snapshot?.tags ?? [];
	const settings = snapshot?.settings;
	const roundStep = settings ? roundStepOf(settings) : 5;
	const nextId = snapshot ? nextRugId(snapshot.rugs.map((r) => r.id), reservedIds(snapshot)) : "";
	const addData = {
		mode: "add",
		collections: collections.map((c) => ({
			id: c.id,
			slug: c.slug,
			name: c.name
		})),
		tags: tags.map((t) => ({
			id: t.id,
			slug: t.slug,
			name: t.name,
			color: t.color ?? ""
		})),
		nextId,
		roundStep,
		driveScopeOk,
		adminHeaders: snapshot?.report.adminHeaders ?? "ok"
	};
	const syncLabel_ = snapshot ? syncLabel(snapshot.fetchedAt) : void 0;
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Products",
		"active": "rugs",
		"meta": syncLabel_
	}, { "default": ($$result) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result)}<div class="msg err on">Could not read the sheet: ${error}</div>`}<div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Products</h1> <p class="page-head__count"> ${rugs.length} ${rugs.length === 1 ? "product" : "products"}${pendingCount > 0 && ` · ${pendingCount} failed to save`} </p> </div> <span class="page-head__rule"></span> ${renderComponent($$result, "Button", $$Button, {
		"href": "/admin/rugs/new",
		"icon": "plus",
		"data-open": "add-rug"
	}, { "default": ($$result) => renderTemplate`Add product` })} </div> ${renderComponent($$result, "FilterBar", $$FilterBar, {}, { "search": ($$result) => renderTemplate`<input id="q" class="input filterbar__search" type="search" placeholder="Search ID or title" autocomplete="off" aria-label="Search products">` })} ${renderComponent($$result, "Chips", $$Chips, {
		"id": "collectionChips",
		"label": "Filter by collection",
		"chips": collectionChips,
		"class": "rugfilters"
	})} <p class="hint" id="count" role="status" aria-live="polite"></p> <div id="m-retry" class="msg"></div> <div id="empty-first"${addAttribute(rugs.length !== 0, "hidden")}>  ${collections.length === 0 ? renderTemplate`${renderComponent($$result, "EmptyState", $$EmptyState, {
		"type": "first-run",
		"title": "Start with a collection",
		"message": "Collections group the catalogue for the buyer, and every product belongs to at least one — so the first one comes before the first rug.",
		"href": "/admin/collections"
	})}` : renderTemplate`${renderComponent($$result, "EmptyState", $$EmptyState, {
		"type": "first-run",
		"href": "/admin/rugs/new"
	})}`} </div> <div id="empty-none" hidden> ${renderComponent($$result, "EmptyState", $$EmptyState, { "type": "no-results" })} </div> <div id="table" class="rugtable-scroll" tabindex="0" role="region" aria-label="Products table"> ${renderComponent($$result, "RugTable", $$RugTable, {
		"rugs": rugs,
		"collections": collections,
		"likesById": likesById
	})} </div> <div id="grid" class="grid" hidden> ${rugs.map((rug) => renderTemplate`${renderComponent($$result, "RugCardAdmin", $$RugCardAdmin, {
		"rug": rug,
		"collections": collections,
		"likes": likesById.get(rug.id) ?? 0
	})}`)} </div> ${renderComponent($$result, "PageNav", $$PageNav, {
		"id": "rugPager",
		"label": "Products"
	})} ${renderComponent($$result, "Modal", $$Modal, {
		"id": "add-rug",
		"title": "Add product",
		"class": "modal--wide"
	}, {
		"default": ($$result) => renderTemplate` ${renderComponent($$result, "RugFields", $$RugFields, {
			"mode": "add",
			"collections": collections,
			"tags": tags,
			"roundStep": roundStep,
			"driveScopeOk": driveScopeOk,
			"nextId": nextId,
			"fetchButton": false
		})}    `,
		"footer": ($$result) => renderTemplate`${renderComponent($$result, "Button", $$Button, {
			"slot": "footer",
			"style": "ghost",
			"data-close": "add-rug"
		}, { "default": ($$result) => renderTemplate`Cancel` })}<span class="overlay__spacer"></span>${renderComponent($$result, "Button", $$Button, {
			"slot": "footer",
			"style": "primary",
			"id": "btnFetch"
		}, { "default": ($$result) => renderTemplate`Fetch` })}`
	})} <script type="application/json" id="admin-data">${unescapeHTML(jsonForScript(addData))}<\/script>${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/rugs/index.astro?astro&type=script&index=0&lang.ts")}${renderComponent($$result, "FetchModal", $$FetchModal, {
		"id": "fetch-result",
		"title": "Fetching"
	})} ` })}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/rugs/index.astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/rugs/index.astro";
var $$url = "/admin/rugs";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/rugs/index@_@astro
var page = () => rugs_exports;
//#endregion
export { page };
