import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_LgtEfXer.mjs";
import { n as templateExit, t as templateEnter } from "./template-depth_DHN7yctw.mjs";
import { Q as money, f as ratesFor, mt as driveImageUrl, t as baseCurrency, u as loadCatalogue } from "./runtime_BgX1riZH.mjs";
import { a as noteVisit, i as findCustomer } from "./http_CBfylY-0.mjs";
import { a as $$PreviewFooter, i as $$PreviewHeader, n as $$Reactions, o as $$PreviewControls, r as $$PreviewLayout, t as $$SpecTable } from "./SpecTable_miAWrgH_.mjs";
import { a as catalogueRugs, i as cardView, r as badgesFor, s as navTabs } from "./view_BxmrstDZ.mjs";
import { n as visibleLikes } from "./likes_Bt2PBY3j.mjs";
import { t as dims } from "./units_BFAJ7W-k.mjs";
import { t as $$AdminLogo } from "./AdminLogo_DIUT_sr6.mjs";
import { t as $$PageNav } from "./PageNav_Cvw3NuwJ.mjs";
//#region src/components/customer/PreviewGate.astro
createAstro("https://astro.build");
var $$PreviewGate = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PreviewGate;
	const { slug } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<main class="pv-gate" data-astro-cid-3tatj4of> <section class="pv-gate-col" data-astro-cid-3tatj4of> <div class="pv-gate-brand" data-astro-cid-3tatj4of> ${renderComponent($$result, "AdminLogo", $$AdminLogo, { "data-astro-cid-3tatj4of": true })} </div> <form class="pv-gate-form" method="post"${addAttribute(`/api/customers/${slug}/login`, "action")}${addAttribute(slug, "data-gate")} data-astro-cid-3tatj4of> <div class="pv-gate-field" data-astro-cid-3tatj4of> <label class="sr-only" for="gate-password" data-astro-cid-3tatj4of>Password</label> <div class="pv-field" data-astro-cid-3tatj4of> <input class="pv-input" id="gate-password" name="password" type="password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" required maxlength="200" placeholder="Password" data-astro-cid-3tatj4of> <button type="button" class="pv-eye" data-gate-reveal aria-pressed="false" data-astro-cid-3tatj4of> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-3tatj4of> <path d="M1.8 8C1.8 8 4.2 3.8 8 3.8C11.8 3.8 14.2 8 14.2 8C14.2 8 11.8 12.2 8 12.2C4.2 12.2 1.8 8 1.8 8Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-3tatj4of></path> <path d="M9.9 8C9.9 9.04934 9.04934 9.9 8 9.9C6.95066 9.9 6.1 9.04934 6.1 8C6.1 6.95066 6.95066 6.1 8 6.1C9.04934 6.1 9.9 6.95066 9.9 8Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-3tatj4of></path> </svg> <span class="sr-only" data-astro-cid-3tatj4of>Show password</span> </button> </div> </div> <button type="submit" class="pv-btn" data-gate-submit data-astro-cid-3tatj4of>Enter</button> <p class="pv-gate-error" data-gate-error role="alert" hidden data-astro-cid-3tatj4of></p> </form> </section> </main> ${renderScript($$result, "/home/user/Serio-Ludere-Catalog/src/components/customer/PreviewGate.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/user/Serio-Ludere-Catalog/src/components/customer/PreviewGate.astro", void 0);
//#endregion
//#region src/components/customer/ProductCard.astro
createAstro("https://astro.build");
var $$ProductCard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ProductCard;
	const { card, rates, baseCurrency, href, eager = false, priority = false } = Astro.props;
	const sizeText = dims(card.widthCm, card.lengthCm, "cm", "·");
	const priceText = money(card.priceUsd, baseCurrency, rates, "en-US");
	const badges = badgesFor(card.tags.map((t) => t.name));
	const likes = visibleLikes(card.likes);
	return renderTemplate`${maybeRenderHead($$result)}<article class="pv-card" data-astro-cid-xknkw5pj> <div class="pv-card-image" data-astro-cid-xknkw5pj> ${card.photoUrl ? renderTemplate`<img${addAttribute(card.photoUrl, "src")}${addAttribute(card.name, "alt")}${addAttribute(eager ? "eager" : "lazy", "loading")}${addAttribute(priority ? "high" : void 0, "fetchpriority")} decoding="async" data-astro-cid-xknkw5pj>` : renderTemplate`<span class="pv-card-empty" data-astro-cid-xknkw5pj>Photo to come</span>`} ${badges.length > 0 && renderTemplate`<ul class="pv-card-badges" data-astro-cid-xknkw5pj> ${badges.map((b) => renderTemplate`<li class="pv-badge" data-astro-cid-xknkw5pj>${b}</li>`)} </ul>`} <a class="pv-card-hit"${addAttribute(href, "href")} tabindex="-1" aria-hidden="true" data-astro-cid-xknkw5pj></a> <div class="pv-card-react" data-astro-cid-xknkw5pj>  <span class="pv-card-likes"${addAttribute(likes, "data-like-count")}${addAttribute(likes === void 0, "hidden")} data-astro-cid-xknkw5pj> ${likes ?? ""} </span> ${renderComponent($$result, "Reactions", $$Reactions, {
		"rugId": card.id,
		"mode": "card",
		"data-astro-cid-xknkw5pj": true
	})} </div> </div> <div class="pv-card-text" data-astro-cid-xknkw5pj> <p class="pv-card-name" data-astro-cid-xknkw5pj><a${addAttribute(href, "href")} data-astro-cid-xknkw5pj>${card.name}</a></p> <p class="pv-card-method"${addAttribute(!card.method, "hidden")} data-astro-cid-xknkw5pj>${card.method}</p> <p class="pv-card-size" data-dims${addAttribute(card.widthCm ?? "", "data-w")}${addAttribute(card.lengthCm ?? "", "data-l")}${addAttribute("·", "data-sep")}${addAttribute(!sizeText, "hidden")} data-astro-cid-xknkw5pj> ${sizeText} </p> <p class="pv-card-price" data-price${addAttribute(card.priceUsd ?? "", "data-usd")}${addAttribute(!priceText, "hidden")} data-astro-cid-xknkw5pj> ${priceText} </p> </div> </article>`;
}, "/home/user/Serio-Ludere-Catalog/src/components/customer/ProductCard.astro", void 0);
//#endregion
//#region src/components/customer/ProductDialog.astro
createAstro("https://astro.build");
var $$ProductDialog = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ProductDialog;
	const { cards, rates, baseCurrency } = Astro.props;
	const photosOf = (card) => card.photoUrls?.length ? card.photoUrls : card.photoUrl ? [card.photoUrl] : [];
	const specRowsOf = (card) => [
		{
			key: "Size",
			value: dims(card.widthCm, card.lengthCm, "cm", "·")
		},
		{
			key: "Material",
			value: card.material
		},
		{
			key: "Method",
			value: card.method
		},
		{
			key: "Origin",
			value: card.origin
		},
		{
			key: "Pile",
			value: card.pile
		},
		{
			key: "Age",
			value: card.age
		}
	];
	return renderTemplate`${cards.map((card) => {
		const photos = photosOf(card);
		const thumbs = (card.photoIds ?? []).map((id) => driveImageUrl(id, 400));
		const priceText = money(card.priceUsd, baseCurrency, rates, "en-US");
		return renderTemplate`<template${addAttribute(card.id, "data-detail")} data-astro-cid-nilyogtc>${templateEnter($$result)} ${maybeRenderHead($$result)}<div class="pv-modal__media" data-astro-cid-nilyogtc>  <div${addAttribute(["pv-modal__plates", { "has-texture": Boolean(card.textureUrl) }], "class:list")} data-astro-cid-nilyogtc> ${photos[0] ? renderTemplate`<img class="pv-modal__photo"${addAttribute(photos[0], "src")}${addAttribute(card.name, "alt")} data-hero-img decoding="async" data-astro-cid-nilyogtc>` : renderTemplate`<span class="pv-modal__empty" data-astro-cid-nilyogtc>Photo to come</span>`} ${card.textureUrl && renderTemplate`<figure class="pv-modal__texture" data-astro-cid-nilyogtc> <img${addAttribute(card.textureUrl, "src")}${addAttribute(`${card.name}, the weave up close`, "alt")} loading="lazy" decoding="async" data-astro-cid-nilyogtc> <figcaption class="pv-modal__texture-label" data-astro-cid-nilyogtc>texture</figcaption> </figure>`} </div> ${photos.length > 1 && renderTemplate`<div class="pv-thumbs pv-modal__thumbs" data-thumbs role="toolbar" aria-label="Photographs" data-astro-cid-nilyogtc> ${photos.map((src, i) => renderTemplate`<button type="button"${addAttribute(["pv-thumb", { "is-on": i === 0 }], "class:list")}${addAttribute(src, "data-full")}${addAttribute(`${card.name}, photograph ${i + 1}`, "data-alt")}${addAttribute(i === 0 ? "true" : void 0, "aria-current")} data-astro-cid-nilyogtc> <img${addAttribute(thumbs[i] ?? src, "src")}${addAttribute(`Photograph ${i + 1}`, "alt")} loading="lazy" decoding="async" data-astro-cid-nilyogtc> </button>`)} </div>`} </div> <div class="pv-modal__info" data-astro-cid-nilyogtc>  <h2 class="pv-h1 pv-modal__name" data-astro-cid-nilyogtc>${card.name}</h2> <p class="pv-price" data-price${addAttribute(card.priceUsd ?? "", "data-usd")}${addAttribute(!priceText, "hidden")} data-astro-cid-nilyogtc> ${priceText} </p> ${badgesFor(card.tags.map((t) => t.name)).length > 0 && renderTemplate`<ul class="pv-modal__markers" data-astro-cid-nilyogtc> ${badgesFor(card.tags.map((t) => t.name)).map((b) => renderTemplate`<li class="pv-modal__marker" data-astro-cid-nilyogtc>${b}</li>`)} </ul>`} ${card.description && renderTemplate`<p class="pv-modal__desc" data-astro-cid-nilyogtc>${card.description}</p>`} <div class="pv-modal__react" data-astro-cid-nilyogtc> ${renderComponent($$result, "Reactions", $$Reactions, {
			"rugId": card.id,
			"mode": "detail",
			"data-astro-cid-nilyogtc": true
		})}  <span class="pv-modal__react-label" aria-hidden="true" data-astro-cid-nilyogtc>
Like
</span> </div> ${renderComponent($$result, "SpecTable", $$SpecTable, {
			"rows": specRowsOf(card),
			"widthCm": card.widthCm,
			"lengthCm": card.lengthCm,
			"data-astro-cid-nilyogtc": true
		})} </div> ${templateExit($$result)}</template>`;
	})} <dialog class="pv-modal" data-product-dialog aria-label="Rug" data-astro-cid-nilyogtc> <button type="button" class="pv-modal__close" data-product-close aria-label="Close" data-astro-cid-nilyogtc> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-nilyogtc> <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-linecap="round" data-astro-cid-nilyogtc></path> </svg> </button> <div class="pv-modal__body" data-product-body data-astro-cid-nilyogtc></div> </dialog> ${renderScript($$result, "/home/user/Serio-Ludere-Catalog/src/components/customer/ProductDialog.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/user/Serio-Ludere-Catalog/src/components/customer/ProductDialog.astro", void 0);
//#endregion
//#region src/components/customer/CollectionFilters.astro
createAstro("https://astro.build");
var $$CollectionFilters = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$CollectionFilters;
	const { collections, active } = Astro.props;
	return renderTemplate` ${maybeRenderHead($$result)}<nav class="pv-filters" aria-label="Filter by collection" data-astro-cid-hbgmxqev> ${collections.map((c) => renderTemplate`<button type="button"${addAttribute(["pv-chip", { "is-on": c.slug === active }], "class:list")}${addAttribute(c.slug, "data-filter")}${addAttribute(c.description || void 0, "data-description")}${addAttribute(c.slug === active ? "true" : "false", "aria-pressed")} data-astro-cid-hbgmxqev> ${c.name} </button>`)} <button type="button"${addAttribute(["pv-chip", { "is-on": active === "all" }], "class:list")} data-filter="all"${addAttribute(active === "all" ? "true" : "false", "aria-pressed")} data-astro-cid-hbgmxqev>
All
</button> </nav> ${renderScript($$result, "/home/user/Serio-Ludere-Catalog/src/components/customer/CollectionFilters.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/user/Serio-Ludere-Catalog/src/components/customer/CollectionFilters.astro", void 0);
//#endregion
//#region src/pages/[slug]/index.astro
var _slug__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const slug = (Astro.params.slug ?? "").toLowerCase();
	const { snapshot, error } = await loadCatalogue();
	const catalogue = snapshot?.catalogue ?? {
		rugs: [],
		collections: [],
		tags: [],
		rates: [],
		customers: []
	};
	const rates = ratesFor(catalogue);
	const customer = snapshot ? findCustomer(catalogue.customers, slug) : void 0;
	const signedIn = Astro.locals.customer === slug;
	Astro.cache?.set(false);
	Astro.response.headers.set("cache-control", "no-store");
	if (error || !snapshot) {
		Astro.response.status = 503;
		Astro.response.statusText = "Service Unavailable";
		Astro.response.headers.set("retry-after", "60");
	} else if (!customer) {
		Astro.response.status = 404;
		Astro.response.statusText = "Not Found";
	}
	if (customer && signedIn) noteVisit(slug, Astro.request);
	const rugs = customer && signedIn ? catalogueRugs(catalogue) : [];
	const cards = rugs.map((r) => cardView(r, catalogue));
	const collections = navTabs(rugs, catalogue).filter((t) => t.count > 0);
	const wanted = Astro.url.searchParams.get("collection");
	const activeFilter = wanted && (wanted === "all" || collections.some((c) => c.slug === wanted)) ? wanted : collections[0]?.slug ?? "all";
	const shownFirst = (card) => activeFilter === "all" || card.collectionSlugs.includes(activeFilter);
	const firstShown = new Map(cards.filter(shownFirst).map((card, i) => [card.id, i]));
	const intro = collections.find((c) => c.slug === activeFilter)?.description ?? "";
	return renderTemplate`${renderComponent($$result, "PreviewLayout", $$PreviewLayout, {
		"title": "Serio Ludere",
		"rates": rates,
		"customer": signedIn ? slug : void 0,
		"data-astro-cid-z2nrcivh": true
	}, { "default": ($$result) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result)}<main class="pv-state" data-astro-cid-z2nrcivh> <p class="pv-h3" data-astro-cid-z2nrcivh>Could not load the catalogue.</p> <p class="pv-lede" data-astro-cid-z2nrcivh> <a${addAttribute(`/${slug}`, "href")} data-astro-cid-z2nrcivh>Try again</a> </p> </main>`}${!error && !customer && renderTemplate`<main class="pv-state" data-astro-cid-z2nrcivh> <p class="pv-h3" data-astro-cid-z2nrcivh>This preview link is not active.</p> <p class="pv-lede" data-astro-cid-z2nrcivh>Ask the studio for a new one.</p> </main>`}${!error && customer && !signedIn && renderTemplate`${renderComponent($$result, "PreviewGate", $$PreviewGate, {
		"slug": slug,
		"data-astro-cid-z2nrcivh": true
	})}`}${!error && customer && signedIn && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`  ${renderComponent($$result, "PreviewHeader", $$PreviewHeader, {
		"home": `/${slug}`,
		"data-astro-cid-z2nrcivh": true
	}, { "default": ($$result) => renderTemplate` ${renderComponent($$result, "PreviewControls", $$PreviewControls, {
		"rates": rates,
		"placement": "header",
		"data-astro-cid-z2nrcivh": true
	})} ` })} <main class="pv-main" data-astro-cid-z2nrcivh> <section class="pv-wrap pv-title" data-astro-cid-z2nrcivh> <div class="pv-title-row" data-astro-cid-z2nrcivh> ${collections.length > 0 && renderTemplate`${renderComponent($$result, "CollectionFilters", $$CollectionFilters, {
		"collections": collections,
		"active": activeFilter,
		"data-astro-cid-z2nrcivh": true
	})}`} <span class="pv-spacer" aria-hidden="true" data-astro-cid-z2nrcivh></span> ${renderComponent($$result, "PreviewControls", $$PreviewControls, {
		"rates": rates,
		"data-astro-cid-z2nrcivh": true
	})} </div>  <p class="pv-lede pv-collection-intro" data-collection-intro${addAttribute(!intro, "hidden")} data-astro-cid-z2nrcivh> ${intro} </p> <button class="pv-intro-more" type="button" data-intro-more aria-expanded="false" hidden data-astro-cid-z2nrcivh>
read more
</button> </section> <section class="pv-wrap" data-astro-cid-z2nrcivh> ${cards.length > 0 ? renderTemplate`<div class="pv-grid" data-astro-cid-z2nrcivh> ${cards.map((card) => renderTemplate`<div data-card${addAttribute(card.id, "data-rug")}${addAttribute(card.collectionSlugs.join(" "), "data-collections")}${addAttribute(visibleLikes(card.likes), "data-likes")}${addAttribute(!shownFirst(card), "hidden")} data-astro-cid-z2nrcivh> ${renderComponent($$result, "ProductCard", $$ProductCard, {
		"card": card,
		"rates": rates,
		"baseCurrency": baseCurrency,
		"href": `/${slug}/${encodeURIComponent(card.id)}`,
		"eager": (firstShown.get(card.id) ?? Infinity) < 4,
		"priority": firstShown.get(card.id) === 0,
		"data-astro-cid-z2nrcivh": true
	})} </div>`)} </div>` : renderTemplate`<p class="pv-lede" data-astro-cid-z2nrcivh>No rugs published yet.</p>`}   ${renderComponent($$result, "ProductDialog", $$ProductDialog, {
		"cards": cards,
		"rates": rates,
		"baseCurrency": baseCurrency,
		"data-astro-cid-z2nrcivh": true
	})} ${renderComponent($$result, "PageNav", $$PageNav, {
		"id": "gridPager",
		"label": "Rugs",
		"data-astro-cid-z2nrcivh": true
	})} <p class="pv-lede" data-grid-empty hidden data-astro-cid-z2nrcivh>
Nothing matches that filter yet.
</p>  <p class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-grid-live data-astro-cid-z2nrcivh></p> </section> </main> ${renderComponent($$result, "PreviewFooter", $$PreviewFooter, { "data-astro-cid-z2nrcivh": true })} ` })}`}${(error || !customer) && renderTemplate`${renderComponent($$result, "PreviewFooter", $$PreviewFooter, { "data-astro-cid-z2nrcivh": true })}`}` })}`;
}, "/home/user/Serio-Ludere-Catalog/src/pages/[slug]/index.astro", void 0);
var $$file = "/home/user/Serio-Ludere-Catalog/src/pages/[slug]/index.astro";
var $$url = "/[slug]";
//#endregion
//#region \0virtual:astro:page:src/pages/[slug]/index@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
