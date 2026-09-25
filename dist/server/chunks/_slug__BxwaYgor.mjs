import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { f as ratesFor, u as loadCatalogue } from "./runtime_BgX1riZH.mjs";
import { a as catalogueRugs, i as cardView, l as rugsWithTag, n as SLUG_PARAM_RE } from "./view_BxmrstDZ.mjs";
import { i as $$Header, o as $$Footer, r as $$Layout, t as $$RugCard } from "./RugCard_jn0hjRLQ.mjs";
//#region src/components/RugGrid.astro
createAstro("https://astro.build");
var $$RugGrid = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RugGrid;
	const { cards, rates, active, state, error = false, eager = 0, hrefFor, heading } = Astro.props;
	let left = eager;
	const loadMode = cards.map((c) => {
		if (!(active === void 0 || c.collectionSlugs.includes(active)) || left <= 0) return "lazy";
		left -= 1;
		return left === eager - 1 ? "priority" : "eager";
	});
	const retry = Astro.url.pathname + Astro.url.search;
	const ghosts = Array.from({ length: 8 }, (_, i) => i);
	return renderTemplate`${maybeRenderHead($$result)}<main> ${heading && renderTemplate`<h1 class="sr-only">${heading}</h1>`} ${state && !error && cards.length === 0 && renderTemplate`<div class="plate-empty" data-plate data-empty data-ar="3-4" aria-hidden="true"> <div class="ph-art" data-ar="3-4"> <span class="ph-rug"></span> </div> <div class="ph">photo to come</div> </div>`} ${state && renderTemplate`<div id="state" class="state"${addAttribute(error ? "status" : void 0, "role")}> ${state} ${error && renderTemplate`<a class="retry"${addAttribute(retry, "href")}>
Try again
</a>`} </div>`} ${error && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <p class="sr-only">Loading catalogue</p> <div class="grid ghost" aria-hidden="true"> ${ghosts.map(() => renderTemplate`<div class="card"> <div class="sk sk-plate"></div> <div class="sk sk-line w60"></div> <div class="sk sk-line w40"></div> <div class="sk sk-line w30"></div> <div class="sk sk-line w20"></div> </div>`)} </div> ` })}`} <p id="grid-live" class="sr-only" aria-live="polite"></p> ${cards.length > 0 && renderTemplate`<div id="grid" class="grid" role="tabpanel" aria-label="Rugs"> ${cards.map((card, i) => renderTemplate`${renderComponent($$result, "RugCard", $$RugCard, {
		"card": card,
		"rates": rates,
		"hidden": active !== void 0 && !card.collectionSlugs.includes(active),
		"eager": loadMode[i] !== "lazy",
		"priority": loadMode[i] === "priority",
		"href": hrefFor ? hrefFor(card) : void 0
	})}`)} </div>`} </main>`;
}, "/home/user/Serio-Ludere-Catalog/src/components/RugGrid.astro", void 0);
//#endregion
//#region src/pages/tags/[slug].astro
var _slug__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Slug,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Slug = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Slug;
	const slug = Astro.params.slug ?? "";
	const { snapshot, error } = await loadCatalogue();
	const catalogue = snapshot?.catalogue ?? {
		rugs: [],
		collections: [],
		tags: [],
		rates: [],
		customers: []
	};
	const rates = ratesFor(catalogue);
	const found = snapshot && SLUG_PARAM_RE.test(slug) ? rugsWithTag(catalogueRugs(catalogue), slug, catalogue) : void 0;
	if (error || !snapshot) {
		Astro.cache.set(false);
		Astro.response.status = 503;
		Astro.response.statusText = "Service Unavailable";
		Astro.response.headers.set("retry-after", "60");
		Astro.response.headers.set("cache-control", "no-store");
	} else if (!found) {
		Astro.cache.set(false);
		Astro.response.status = 404;
		Astro.response.statusText = "Not Found";
	} else Astro.cache.set(false);
	const cards = found ? found.rugs.map((r) => cardView(r, catalogue)) : [];
	const state = error ?? (!found ? "No such tag." : cards.length === 0 ? "No rugs carry this tag yet." : void 0);
	const n = cards.length;
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": found ? `${found.name} — Serio Ludere` : "Serio Ludere — Catalogue",
		"rates": rates
	}, { "default": ($$result) => renderTemplate` ${renderComponent($$result, "Header", $$Header, { "rates": rates })} ${maybeRenderHead($$result)}<nav id="nav" class="nav-detail" aria-label="Breadcrumb"> <a class="back" href="/">← Catalogue</a> </nav> ${found && renderTemplate`<section class="lede"> <div class="standfirst"> <p class="eyebrow">
Tag · ${found.name} · ${n} ${n === 1 ? "rug" : "rugs"} </p> </div> </section>`}${renderComponent($$result, "RugGrid", $$RugGrid, {
		"cards": cards,
		"rates": rates,
		"state": state,
		"error": Boolean(error),
		"eager": 4,
		"heading": found ? `Tag · ${found.name}` : "Catalogue"
	})} ${renderComponent($$result, "Footer", $$Footer, {})} ` })}`;
}, "/home/user/Serio-Ludere-Catalog/src/pages/tags/[slug].astro", void 0);
var $$file = "/home/user/Serio-Ludere-Catalog/src/pages/tags/[slug].astro";
var $$url = "/tags/[slug]";
//#endregion
//#region \0virtual:astro:page:src/pages/tags/[slug]@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
