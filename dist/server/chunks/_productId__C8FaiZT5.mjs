import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_LgtEfXer.mjs";
import { Q as money, f as ratesFor, mt as driveImageUrl, t as baseCurrency, u as loadCatalogue } from "./runtime_BgX1riZH.mjs";
import { i as findCustomer } from "./http_CBfylY-0.mjs";
import { a as $$PreviewFooter, i as $$PreviewHeader, n as $$Reactions, o as $$PreviewControls, r as $$PreviewLayout, t as $$SpecTable } from "./SpecTable_miAWrgH_.mjs";
import { a as catalogueRugs, i as cardView } from "./view_BxmrstDZ.mjs";
import { t as $$Pager } from "./Pager_DL27wwLv.mjs";
import { t as dims } from "./units_BFAJ7W-k.mjs";
//#region src/pages/[slug]/[productId].astro
var _productId__exports = /* @__PURE__ */ __exportAll({
	default: () => $$ProductId,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$ProductId = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ProductId;
	const slug = (Astro.params.slug ?? "").toLowerCase();
	const productId = Astro.params.productId ?? "";
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
	const cards = customer && signedIn ? catalogueRugs(catalogue).map((r) => cardView(r, catalogue)) : [];
	const card = cards.find((c) => c.id === productId);
	Astro.cache?.set(false);
	Astro.response.headers.set("cache-control", "no-store");
	if (error || !snapshot) {
		Astro.response.status = 503;
		Astro.response.statusText = "Service Unavailable";
		Astro.response.headers.set("retry-after", "60");
	} else if (!customer) {
		Astro.response.status = 404;
		Astro.response.statusText = "Not Found";
	} else if (!signedIn) return Astro.redirect(`/${slug}`, 303);
	else if (!card) {
		Astro.response.status = 404;
		Astro.response.statusText = "Not Found";
	}
	const SLUG_RE = /^[a-z0-9-]{1,80}$/;
	const rawCollection = Astro.url.searchParams.get("collection");
	const fromCollection = rawCollection && SLUG_RE.test(rawCollection) ? rawCollection : void 0;
	const q = fromCollection ? `?collection=${encodeURIComponent(fromCollection)}` : "";
	const gridHref = `/${slug}${q}`;
	const hrefForCard = (c) => `/${slug}/${encodeURIComponent(c.id)}${q}`;
	const inCollection = (c) => fromCollection !== void 0 && c.collectionSlugs.includes(fromCollection);
	const filtered = fromCollection ? cards.filter(inCollection) : [];
	const run = card && filtered.includes(card) ? filtered : cards;
	const at = card ? run.indexOf(card) : -1;
	const sib = at >= 0 ? {
		index: at,
		total: run.length,
		prev: run[at - 1],
		next: run[at + 1]
	} : void 0;
	const priceText = card ? money(card.priceUsd, baseCurrency, rates, "en-US") : "";
	const sizeText = card ? dims(card.widthCm, card.lengthCm, "cm", "·") : "";
	const photos = card?.photoUrls?.length ? card.photoUrls : card?.photoUrl ? [card.photoUrl] : [];
	const thumbs = (card?.photoIds ?? []).map((id) => driveImageUrl(id, 400));
	const specRows = card ? [
		{
			key: "Size",
			value: sizeText
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
	] : [];
	const title = card ? `${card.name} — Serio Ludere` : "Serio Ludere";
	return renderTemplate`${renderComponent($$result, "PreviewLayout", $$PreviewLayout, {
		"title": title,
		"rates": rates,
		"customer": signedIn ? slug : void 0,
		"data-astro-cid-w72pnaip": true
	}, { "default": ($$result) => renderTemplate`${customer && renderTemplate`${renderComponent($$result, "PreviewHeader", $$PreviewHeader, {
		"home": `/${slug}`,
		"back": {
			href: gridHref,
			label: "Back to the collection",
			shortLabel: "Back"
		},
		"data-astro-cid-w72pnaip": true
	})}`}${error && renderTemplate`${maybeRenderHead($$result)}<main class="pv-state" data-astro-cid-w72pnaip> <p class="pv-h3" data-astro-cid-w72pnaip>Could not load the catalogue.</p> <p class="pv-lede" data-astro-cid-w72pnaip> <a${addAttribute(Astro.url.pathname, "href")} data-astro-cid-w72pnaip>Try again</a> </p> </main>`}${!error && !card && renderTemplate`<main class="pv-state" data-astro-cid-w72pnaip> <p class="pv-h3" data-astro-cid-w72pnaip> ${customer ? "This rug is not in your preview." : "This preview link is not active."} </p> ${customer && renderTemplate`<p class="pv-lede" data-astro-cid-w72pnaip> <a${addAttribute(gridHref, "href")} data-astro-cid-w72pnaip>Back to the collection</a> </p>`} </main>`}${card && renderTemplate`<main class="pv-main" data-astro-cid-w72pnaip> <section class="pv-hero" data-astro-cid-w72pnaip> ${photos[0] ? renderTemplate`<img${addAttribute(photos[0], "src")}${addAttribute(card.name, "alt")} data-hero-img fetchpriority="high" decoding="async" data-astro-cid-w72pnaip>` : renderTemplate`<span class="pv-hero-empty" data-astro-cid-w72pnaip>Photo to come</span>`} <div class="pv-hero-react" data-astro-cid-w72pnaip> ${renderComponent($$result, "Reactions", $$Reactions, {
		"rugId": card.id,
		"mode": "detail",
		"data-astro-cid-w72pnaip": true
	})} </div> </section> ${photos.length > 1 && renderTemplate`<section class="pv-wrap pv-thumbwrap" data-astro-cid-w72pnaip> <div class="pv-thumbs" data-thumbs role="toolbar" aria-label="Photographs" data-astro-cid-w72pnaip> ${photos.map((src, i) => renderTemplate`<button type="button"${addAttribute(["pv-thumb", { "is-on": i === 0 }], "class:list")}${addAttribute(src, "data-full")}${addAttribute(`${card.name}, photograph ${i + 1}`, "data-alt")}${addAttribute(i === 0 ? "true" : void 0, "aria-current")} data-astro-cid-w72pnaip> <img${addAttribute(thumbs[i] ?? src, "src")}${addAttribute(`Photograph ${i + 1}`, "alt")} loading="lazy" decoding="async" data-astro-cid-w72pnaip> </button>`)} </div> </section>`} <section class="pv-body" data-astro-cid-w72pnaip> <div class="pv-detail-text" data-astro-cid-w72pnaip> <h1 class="pv-h1" data-astro-cid-w72pnaip>${card.name}</h1> <div class="pv-price-row" data-astro-cid-w72pnaip> <p class="pv-price" data-price${addAttribute(card.priceUsd ?? "", "data-usd")}${addAttribute(!priceText, "hidden")} data-astro-cid-w72pnaip> ${priceText} </p> <span class="pv-spacer" aria-hidden="true" data-astro-cid-w72pnaip></span> ${renderComponent($$result, "PreviewControls", $$PreviewControls, {
		"rates": rates,
		"data-astro-cid-w72pnaip": true
	})} </div> ${card.description && renderTemplate`<p class="pv-detail-desc" data-astro-cid-w72pnaip>${card.description}</p>`} <div class="pv-react-row" data-astro-cid-w72pnaip> ${renderComponent($$result, "Reactions", $$Reactions, {
		"rugId": card.id,
		"mode": "detail",
		"data-astro-cid-w72pnaip": true
	})} <p class="pv-react-note" data-react-note aria-live="off" data-astro-cid-w72pnaip></p> </div> </div> ${renderComponent($$result, "SpecTable", $$SpecTable, {
		"rows": specRows,
		"widthCm": card.widthCm,
		"lengthCm": card.lengthCm,
		"data-astro-cid-w72pnaip": true
	})} </section>  ${sib && sib.total > 1 && renderTemplate`<nav class="pv-wrap pv-pager" aria-label="Rugs in this view" data-astro-cid-w72pnaip> ${renderComponent($$result, "Pager", $$Pager, {
		"prev": sib.prev,
		"next": sib.next,
		"index": sib.index + 1,
		"total": sib.total,
		"hrefFor": hrefForCard,
		"data-astro-cid-w72pnaip": true
	})} </nav>`} </main>`}${renderComponent($$result, "PreviewFooter", $$PreviewFooter, { "data-astro-cid-w72pnaip": true })} ` })} ${renderScript($$result, "/home/user/Serio-Ludere-Catalog/src/pages/[slug]/[productId].astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/user/Serio-Ludere-Catalog/src/pages/[slug]/[productId].astro", void 0);
var $$file = "/home/user/Serio-Ludere-Catalog/src/pages/[slug]/[productId].astro";
var $$url = "/[slug]/[productId]";
//#endregion
//#region \0virtual:astro:page:src/pages/[slug]/[productId]@_@astro
var page = () => _productId__exports;
//#endregion
export { page };
