import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_D-Pj3-r2.mjs";
import { n as templateExit, t as templateEnter } from "./template-depth_DHN7yctw.mjs";
import { Q as money, _t as driveImageUrl, f as ratesFor, t as baseCurrency, u as loadCatalogue } from "./runtime_ze_g5m0z.mjs";
import { a as noteVisit, i as findCustomer } from "./http_Cj4-WIIV.mjs";
import { a as $$PreviewFooter, i as $$PreviewHeader, n as $$Reactions, o as $$PreviewControls, r as $$PreviewLayout, t as $$SpecTable } from "./SpecTable_C3blbnZb.mjs";
import { a as catalogueRugs, i as cardView, r as badgesFor, s as navTabs } from "./view_DOOWEoSU.mjs";
import { n as visibleLikes } from "./likes_Bt2PBY3j.mjs";
import { t as dims } from "./units_BFAJ7W-k.mjs";
import { t as $$PageNav } from "./PageNav_Ct1IMF9n.mjs";
//#region src/components/customer/SlMark.astro
var $$SlMark = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<svg class="sl-mark" role="img" aria-label="Serio Ludere" viewBox="0 0 150 227" xmlns="http://www.w3.org/2000/svg"><path d="M147.589 141.358C142.78 128.191 130.77 118.538 116.229 112.398C96.3758 103.771 75.4205 102.002 54.544 96.6895C53.7445 96.4842 53.2539 95.6692 53.4417 94.8663C53.7687 93.4778 54.0837 92.21 54.3986 91.1052C55.4403 87.4226 56.4094 83.7581 57.7902 80.1781C59.1711 76.5981 60.8124 73.151 62.6596 69.8004C64.4644 66.5283 66.5721 63.0811 70.212 61.6141C72.7375 60.5938 75.687 60.7629 78.1459 61.916C80.6109 63.0751 82.5853 65.176 83.73 67.6391C84.6506 69.6253 85.0442 71.8107 85.3349 73.978C85.3955 74.4489 85.4561 74.9259 85.6559 75.3545C85.8558 75.7831 86.2313 76.1574 86.6976 76.2359C87.382 76.3506 88.0301 75.7831 88.2481 75.1251C88.4661 74.467 88.3571 73.7547 88.2481 73.0664C87.1337 66.323 84.8262 58.8491 77.7765 56.1626C73.6399 54.587 69.2914 55.7883 65.9846 58.5654C61.3878 62.3386 58.5109 68.0859 55.8946 73.2536C52.8179 79.7676 50.6255 86.5714 48.754 93.4778C48.536 94.2867 47.6941 94.7637 46.8886 94.5282C41.9526 93.0673 37.0953 91.3708 32.3774 89.288C17.1818 82.762 4.68125 72.4929 8.92076 54.3938C14.8985 28.1023 57.0089 3.09676 86.4554 6.393C111.571 8.72331 124.139 27.3296 127.482 32.2498C127.875 32.8293 128.657 33.0044 129.256 32.6422C129.608 32.4309 129.807 32.0687 129.862 31.6883L129.977 31.628C129.947 31.5676 129.916 31.5133 129.886 31.4529C129.88 31.2657 129.844 31.0786 129.747 30.9035C121.655 15.5211 110.621 7.02086 96.3637 2.11875C81.7677 -2.89805 61.0244 2.5655 61.0244 2.5655C61.0244 2.5655 61.0123 2.5655 60.988 2.57757C52.3273 4.43095 43.8604 7.61853 36.1808 11.9048C23.0444 19.3486 10.6347 29.6478 4.3542 43.7444C-1.73253 56.8388 -2.15042 71.0983 7.6913 82.7076C16.885 92.9767 30.2758 99.0802 44.7568 103.403C45.5199 103.632 45.9741 104.411 45.7864 105.178C44.242 111.492 42.6915 117.795 40.7292 123.947C40.4325 124.877 39.306 125.293 38.4944 124.744C36.5806 123.458 34.4487 122.528 32.0079 122.202C22.1904 121.128 15.5768 131.753 15.6555 140.495C15.7403 149.719 25.3156 153.758 32.765 149.055C35.5025 147.431 37.8463 144.298 39.8813 140.277C40.384 139.287 41.7467 139.154 42.4129 140.042C46.6766 145.759 50.9828 151.615 57.124 155.569C67.7107 162.343 81.2287 164.462 93.2023 160.652C96.1518 159.626 98.9256 158.183 101.487 156.511C101.5 156.505 101.512 156.499 101.524 156.493C109.845 151.168 118.118 141.937 120.662 138.985C121.092 138.484 121.001 137.723 120.468 137.337C120.02 137.017 119.415 137.059 119.021 137.446C118.924 137.542 118.815 137.651 118.676 137.754C118.676 137.754 118.512 137.929 118.228 138.225C116.768 139.643 114.503 141.829 112.74 143.447C109.246 146.532 104.582 150.214 99.7614 152.768L96.8846 154.138C95.1948 154.851 93.5111 155.388 91.8759 155.66C81.156 157.459 69.8789 155.545 61.2545 149.472C54.7317 144.968 50.1652 137.047 44.8294 130.739C44.7446 130.636 44.6598 130.539 44.569 130.437C44.2359 130.044 44.1269 129.519 44.2783 129.03C46.5434 121.761 48.3179 113.648 49.8321 106.415C50.0016 105.6 50.8193 105.105 51.6308 105.316C67.1535 109.349 83.3605 111.824 96.6363 115.531C113.407 120.162 134.362 128.771 139.589 146.139C140.321 148.802 140.697 151.651 140.618 154.712C139.897 176.705 122.691 194.412 104.831 205.453C76.4925 223.045 36.2414 228.352 18.8654 193.699C18.3143 192.607 17.8177 191.49 17.3574 190.361C12.7121 178.305 16.0734 168.144 17.9751 163.943C18.5081 162.759 18.2113 161.31 17.1394 160.58C17.1272 160.568 17.1091 160.562 17.097 160.55C16.0068 159.837 14.523 160.411 14.0506 161.624C13.3722 163.363 12.2034 166.544 11.9429 168.386C11.5856 170.529 11.3797 172.702 11.307 174.888C11.307 174.954 11.2949 175.021 11.2949 175.087C11.2101 176.584 11.2464 178.081 11.3676 179.554C11.6886 184.958 12.8635 190.355 14.9106 195.462C31.6264 235.542 77.4494 232.493 109.706 213.573C130.716 201.33 149.988 180.309 150.012 154.742C150.042 149.9 149.17 145.451 147.601 141.376L147.589 141.358ZM36.847 134.361C34.4123 139.999 30.7119 146.797 24.3647 144.883L23.965 144.708C20.422 142.601 22.0209 136.951 23.9226 133.793C28.0531 127.074 32.5167 128.608 36.526 132.701C36.9561 133.141 37.0893 133.793 36.841 134.355L36.847 134.361Z" fill="currentColor"></path></svg>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/SlMark.astro", void 0);
//#endregion
//#region src/components/customer/PreviewGate.astro
createAstro("https://astro.build");
var $$PreviewGate = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PreviewGate;
	const { slug } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<main class="pv-gate" data-astro-cid-3tatj4of> <section class="pv-gate-col" data-astro-cid-3tatj4of> <div class="pv-gate-brand" data-astro-cid-3tatj4of> ${renderComponent($$result, "SlMark", $$SlMark, { "data-astro-cid-3tatj4of": true })} </div> <form class="pv-gate-form" method="post"${addAttribute(`/api/customers/${slug}/login`, "action")}${addAttribute(slug, "data-gate")} data-astro-cid-3tatj4of> <div class="pv-gate-field" data-astro-cid-3tatj4of> <label class="sr-only" for="gate-password" data-astro-cid-3tatj4of>Password</label> <div class="pv-field" data-astro-cid-3tatj4of> <input class="pv-input" id="gate-password" name="password" type="password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" required maxlength="200" placeholder="Password" data-astro-cid-3tatj4of> <button type="button" class="pv-eye" data-gate-reveal aria-pressed="false" data-astro-cid-3tatj4of> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-3tatj4of> <path d="M1.8 8C1.8 8 4.2 3.8 8 3.8C11.8 3.8 14.2 8 14.2 8C14.2 8 11.8 12.2 8 12.2C4.2 12.2 1.8 8 1.8 8Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-3tatj4of></path> <path d="M9.9 8C9.9 9.04934 9.04934 9.9 8 9.9C6.95066 9.9 6.1 9.04934 6.1 8C6.1 6.95066 6.95066 6.1 8 6.1C9.04934 6.1 9.9 6.95066 9.9 8Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-3tatj4of></path> </svg> <span class="sr-only" data-astro-cid-3tatj4of>Show password</span> </button> </div> </div> <button type="submit" class="pv-btn" data-gate-submit data-astro-cid-3tatj4of>Enter</button> <p class="pv-gate-error" data-gate-error role="alert" hidden data-astro-cid-3tatj4of></p> </form> </section> </main> ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewGate.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewGate.astro", void 0);
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
	return renderTemplate`${maybeRenderHead($$result)}<article class="pv-card" data-astro-cid-xknkw5pj> <div class="pv-card-image"${addAttribute(card.fillHeight ? "height" : void 0, "data-fit")} data-astro-cid-xknkw5pj> ${card.photoUrl ? renderTemplate`<img${addAttribute(card.photoUrl, "src")}${addAttribute(card.name, "alt")}${addAttribute(eager ? "eager" : "lazy", "loading")}${addAttribute(priority ? "high" : void 0, "fetchpriority")} decoding="async" data-astro-cid-xknkw5pj>` : renderTemplate`<span class="pv-card-empty" data-astro-cid-xknkw5pj>Photo to come</span>`} ${badges.length > 0 && renderTemplate`<ul class="pv-card-badges" data-astro-cid-xknkw5pj> ${badges.map((b) => renderTemplate`<li class="pv-badge" data-astro-cid-xknkw5pj>${b}</li>`)} </ul>`} <a class="pv-card-hit"${addAttribute(href, "href")} tabindex="-1" aria-hidden="true" data-astro-cid-xknkw5pj></a> <div class="pv-card-react" data-astro-cid-xknkw5pj>  <span class="pv-card-likes"${addAttribute(likes, "data-like-count")}${addAttribute(likes === void 0, "hidden")} data-astro-cid-xknkw5pj> ${likes ?? ""} </span> ${renderComponent($$result, "Reactions", $$Reactions, {
		"rugId": card.id,
		"mode": "card",
		"data-astro-cid-xknkw5pj": true
	})} </div> </div> <div class="pv-card-text" data-astro-cid-xknkw5pj> <p class="pv-card-name" data-astro-cid-xknkw5pj><a${addAttribute(href, "href")} data-astro-cid-xknkw5pj>${card.name}</a></p> <p class="pv-card-method"${addAttribute(!card.method, "hidden")} data-astro-cid-xknkw5pj>${card.method}</p> <p class="pv-card-size" data-dims${addAttribute(card.widthCm ?? "", "data-w")}${addAttribute(card.lengthCm ?? "", "data-l")}${addAttribute("·", "data-sep")}${addAttribute(!sizeText, "hidden")} data-astro-cid-xknkw5pj> ${sizeText} </p> <p class="pv-card-price" data-price${addAttribute(card.priceUsd ?? "", "data-usd")}${addAttribute(!priceText, "hidden")} data-astro-cid-xknkw5pj> ${priceText} </p> </div> </article>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/ProductCard.astro", void 0);
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
		return renderTemplate`<template${addAttribute(card.id, "data-detail")} data-astro-cid-nilyogtc>${templateEnter($$result)} ${maybeRenderHead($$result)}<div class="pv-modal__media" data-astro-cid-nilyogtc>  <div${addAttribute(["pv-modal__plates", { "has-texture": Boolean(card.textureUrl) }], "class:list")} data-astro-cid-nilyogtc> ${photos[0] ? renderTemplate`<img class="pv-modal__photo"${addAttribute(photos[0], "src")}${addAttribute(card.name, "alt")} data-hero-img decoding="async" data-astro-cid-nilyogtc>` : renderTemplate`<span class="pv-modal__empty" data-astro-cid-nilyogtc>Photo to come</span>`} ${card.textureUrl && renderTemplate`<figure class="pv-modal__texture" data-astro-cid-nilyogtc> <img${addAttribute(card.textureUrl, "src")}${addAttribute(`${card.name}, the weave up close`, "alt")} loading="lazy" decoding="async" data-astro-cid-nilyogtc> <figcaption class="pv-modal__texture-label" data-astro-cid-nilyogtc>texture</figcaption> </figure>`} </div> ${photos.length > 1 && renderTemplate`<div class="pv-thumbs pv-modal__thumbs" data-thumbs role="toolbar" aria-label="Photographs" data-astro-cid-nilyogtc> ${photos.map((src, i) => renderTemplate`<button type="button"${addAttribute(["pv-thumb", { "is-on": i === 0 }], "class:list")}${addAttribute(src, "data-full")}${addAttribute(`${card.name}, photograph ${i + 1}`, "data-alt")}${addAttribute(i === 0 ? "true" : void 0, "aria-current")} data-astro-cid-nilyogtc> <img${addAttribute(thumbs[i] ?? src, "src")}${addAttribute(`Photograph ${i + 1}`, "alt")} loading="lazy" decoding="async" data-astro-cid-nilyogtc> </button>`)} </div>`} </div> <div class="pv-modal__info" data-astro-cid-nilyogtc>  <h2 class="pv-h1 pv-modal__name" data-astro-cid-nilyogtc>${card.name}</h2> <p class="pv-price" data-price${addAttribute(card.priceUsd ?? "", "data-usd")}${addAttribute(!priceText, "hidden")} data-astro-cid-nilyogtc> ${priceText} </p> ${badgesFor(card.tags.map((t) => t.name)).length > 0 && renderTemplate`<ul class="pv-modal__markers" data-astro-cid-nilyogtc> ${badgesFor(card.tags.map((t) => t.name)).map((b) => renderTemplate`<li class="pv-modal__marker" data-astro-cid-nilyogtc>${b}</li>`)} </ul>`} ${card.description && renderTemplate`<p class="pv-modal__desc" data-astro-cid-nilyogtc>${card.description}</p>`} <div class="pv-modal__react" data-astro-cid-nilyogtc>  ${renderComponent($$result, "Reactions", $$Reactions, {
			"rugId": card.id,
			"mode": "detail",
			"data-astro-cid-nilyogtc": true
		})} </div> ${renderComponent($$result, "SpecTable", $$SpecTable, {
			"rows": specRowsOf(card),
			"widthCm": card.widthCm,
			"lengthCm": card.lengthCm,
			"data-astro-cid-nilyogtc": true
		})} </div> ${templateExit($$result)}</template>`;
	})} <dialog class="pv-modal" data-product-dialog aria-label="Rug" data-astro-cid-nilyogtc> <button type="button" class="pv-modal__close" data-product-close aria-label="Close" data-astro-cid-nilyogtc> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-nilyogtc> <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-linecap="round" data-astro-cid-nilyogtc></path> </svg> </button> <div class="pv-modal__body" data-product-body data-astro-cid-nilyogtc></div> </dialog> ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/ProductDialog.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/ProductDialog.astro", void 0);
//#endregion
//#region src/components/customer/StudioNote.astro
var $$StudioNote = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<aside class="pv-note" data-studio-note aria-label="A note from the studio" hidden data-astro-cid-2w6nfhr2> <div class="pv-note__inner" data-astro-cid-2w6nfhr2> <div class="pv-note__copy" data-astro-cid-2w6nfhr2> <p class="pv-note__text" data-astro-cid-2w6nfhr2>
Almost every piece in our collection is one of a kind, made once and never repeated. If you love
        something but need a different size or color palette, just ask. What you see here is only part of our
        inventory, and we're happy to help you find a close match. And if you've fallen for something or have
        an idea of your own, we can have it made for you.
</p> <p class="pv-note__hint" data-astro-cid-2w6nfhr2>Click any carpet for more details.</p> </div> <button type="button" class="pv-btn pv-note__close" data-studio-note-close data-astro-cid-2w6nfhr2>Close</button> </div> </aside> ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/StudioNote.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/StudioNote.astro", void 0);
//#endregion
//#region src/components/customer/CollectionFilters.astro
createAstro("https://astro.build");
var $$CollectionFilters = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$CollectionFilters;
	const { collections, active } = Astro.props;
	const activeName = collections.find((c) => c.slug === active)?.name ?? "All";
	return renderTemplate` ${maybeRenderHead($$result)}<nav class="pv-filters" aria-label="Filter by collection" data-astro-cid-hbgmxqev> ${collections.map((c) => renderTemplate`<button type="button"${addAttribute(["pv-chip", { "is-on": c.slug === active }], "class:list")}${addAttribute(c.slug, "data-filter")}${addAttribute(c.description || void 0, "data-description")}${addAttribute(c.slug === active ? "true" : "false", "aria-pressed")} data-astro-cid-hbgmxqev> ${c.name} </button>`)} <button type="button"${addAttribute(["pv-chip", { "is-on": active === "all" }], "class:list")} data-filter="all"${addAttribute(active === "all" ? "true" : "false", "aria-pressed")} data-astro-cid-hbgmxqev>
All
</button>  <div class="pv-picker" data-collection-picker data-astro-cid-hbgmxqev> <button type="button" class="pv-picker-box" data-picker-toggle aria-expanded="false" aria-controls="pvPickerMenu" data-astro-cid-hbgmxqev> <span class="sr-only" data-astro-cid-hbgmxqev>Collection:</span> <span class="pv-picker-name" data-picker-name data-astro-cid-hbgmxqev>${activeName}</span> <svg class="pv-picker-chevron" viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-hbgmxqev> <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-hbgmxqev></path> </svg> </button> <div class="pv-picker-scrim" data-picker-scrim hidden data-astro-cid-hbgmxqev></div> <ul class="pv-picker-menu" id="pvPickerMenu" data-picker-menu hidden data-astro-cid-hbgmxqev> ${[...collections, {
		slug: "all",
		name: "All"
	}].map((c) => renderTemplate`<li data-astro-cid-hbgmxqev> <button type="button" class="pv-picker-option"${addAttribute(c.slug, "data-pick")}${addAttribute(c.slug === active ? "true" : void 0, "aria-current")} data-astro-cid-hbgmxqev> <span data-astro-cid-hbgmxqev>${c.name}</span> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-hbgmxqev> <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-hbgmxqev></path> </svg> </button> </li>`)} </ul> </div> </nav> ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/CollectionFilters.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/CollectionFilters.astro", void 0);
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
	const searchable = collections.length > 0;
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
		"search": searchable,
		"data-astro-cid-z2nrcivh": true
	})} ` })} <main class="pv-main" data-astro-cid-z2nrcivh>  <span class="pv-tabbar-anchor" data-tabbar-anchor aria-hidden="true" data-astro-cid-z2nrcivh></span> <div class="pv-tabbar" data-tabbar data-astro-cid-z2nrcivh> <div class="pv-wrap pv-title-row" data-astro-cid-z2nrcivh> ${collections.length > 0 && renderTemplate`${renderComponent($$result, "CollectionFilters", $$CollectionFilters, {
		"collections": collections,
		"active": activeFilter,
		"data-astro-cid-z2nrcivh": true
	})}`} <span class="pv-spacer" aria-hidden="true" data-astro-cid-z2nrcivh></span> ${renderComponent($$result, "PreviewControls", $$PreviewControls, {
		"rates": rates,
		"search": searchable,
		"data-astro-cid-z2nrcivh": true
	})} </div> </div> <section class="pv-wrap pv-title" data-astro-cid-z2nrcivh>  <p class="pv-lede pv-collection-intro" data-collection-intro${addAttribute(!intro, "hidden")} data-astro-cid-z2nrcivh> ${intro} </p> <button class="pv-intro-more" type="button" data-intro-more aria-expanded="false" hidden data-astro-cid-z2nrcivh>
read more
</button> </section> <section class="pv-wrap pv-results" data-astro-cid-z2nrcivh> ${cards.length > 0 ? renderTemplate`<div class="pv-grid" data-astro-cid-z2nrcivh> ${cards.map((card) => renderTemplate`<div data-card${addAttribute(card.id, "data-rug")}${addAttribute(card.name, "data-name")}${addAttribute(card.collectionSlugs.join(" "), "data-collections")}${addAttribute(visibleLikes(card.likes), "data-likes")}${addAttribute(!shownFirst(card), "hidden")} data-astro-cid-z2nrcivh> ${renderComponent($$result, "ProductCard", $$ProductCard, {
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
	})}  ${renderComponent($$result, "PageNav", $$PageNav, {
		"id": "gridPager",
		"label": "Rugs",
		"arrows": true,
		"data-astro-cid-z2nrcivh": true
	})}  <div class="pv-next" data-next-collection hidden data-astro-cid-z2nrcivh> <p class="pv-next-label" id="pvNextLabel" data-astro-cid-z2nrcivh>
Next collection
</p> <button type="button" class="pv-btn pv-next-btn" data-next-filter aria-describedby="pvNextLabel" data-astro-cid-z2nrcivh> <span data-next-name data-astro-cid-z2nrcivh></span> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-z2nrcivh> <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-z2nrcivh></path> </svg> </button> </div> <p class="pv-lede" data-grid-empty hidden data-astro-cid-z2nrcivh>
Nothing matches that filter yet.
</p>  <p class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-grid-live data-astro-cid-z2nrcivh></p> </section> </main> ${renderComponent($$result, "PreviewFooter", $$PreviewFooter, { "data-astro-cid-z2nrcivh": true })}  ${renderComponent($$result, "StudioNote", $$StudioNote, { "data-astro-cid-z2nrcivh": true })} ` })}`}${(error || !customer) && renderTemplate`${renderComponent($$result, "PreviewFooter", $$PreviewFooter, { "data-astro-cid-z2nrcivh": true })}`}` })}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/[slug]/index.astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/[slug]/index.astro";
var $$url = "/[slug]";
//#endregion
//#region \0virtual:astro:page:src/pages/[slug]/index@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
