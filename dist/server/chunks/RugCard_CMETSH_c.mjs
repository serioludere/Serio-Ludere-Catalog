import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_C45USqpX.mjs";
import { E as money, T as SUPPORTED_CURRENCIES, t as baseCurrency } from "./runtime_BIcTruy2.mjs";
import { a as STUDIO_NAME, n as STUDIO_EMAIL } from "./prepaint_Cst9YLzz.mjs";
import { i as badgesFor } from "./view_CcuJ6q8j.mjs";
import { t as likesText } from "./likes_Bt2PBY3j.mjs";
import { t as dims } from "./units_BFAJ7W-k.mjs";
import { t as $$Wordmark } from "./Wordmark_D-VDE6el.mjs";
//#region src/components/Footer.astro
createAstro("https://astro.build");
var $$Footer = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Footer;
	const { minimal = false } = Astro.props;
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	return renderTemplate`${maybeRenderHead($$result)}<footer> <nav class="foot-links" aria-label="Studio"> ${!minimal && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`  <a${addAttribute("https://www.serioludere.com", "href")} target="_blank" rel="noopener"> ${"serioludere.com"} <span class="sr-only"> (opens in a new tab)</span> </a> <a${addAttribute("https://www.instagram.com/serioluderestudio", "href")} target="_blank" rel="noopener"> ${"@serioluderestudio"} <span class="sr-only"> (opens in a new tab)</span> </a> <a${addAttribute(`https://wa.me/525535760978`, "href")} target="_blank" rel="noopener"> ${"+52 55 3576 0978"} <span class="sr-only"> (opens in a new tab)</span> </a> ` })}`} <a${addAttribute(`mailto:${STUDIO_EMAIL}`, "href")}>${STUDIO_EMAIL}</a> </nav> <div class="foot-meta"> <span>&copy; <span id="yr">${year}</span> ${STUDIO_NAME}</span> <span class="fx-note">Prices are indicative and convert at an approximate rate.</span> </div> </footer>`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/Footer.astro", void 0);
//#endregion
//#region src/components/Controls.astro
createAstro("https://astro.build");
var $$Controls = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Controls;
	const { rates } = Astro.props;
	const fromSheet = Object.keys(rates.rates).filter((c) => c in rates.symbols);
	const currencies = fromSheet.length ? ["USD", ...fromSheet.filter((c) => c !== "USD")] : [...SUPPORTED_CURRENCIES];
	return renderTemplate`${maybeRenderHead($$result)}<div class="controls"> <div class="toggle" id="unitTog" role="group" aria-label="Units"> <button type="button" data-u="cm" class="on" aria-pressed="true">cm</button> <button type="button" data-u="ft" aria-pressed="false">ft</button> </div> <span class="cur-wrap"> <select class="cur" id="cur" aria-label="Currency"> ${currencies.map((c) => renderTemplate`<option>${c}</option>`)} </select> <svg class="cur-chev" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"> <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </span> </div> ${renderScript($$result, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/Controls.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/Controls.astro", void 0);
//#endregion
//#region src/components/Header.astro
createAstro("https://astro.build");
var $$Header = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Header;
	const { eyebrow = "Catalogue", rates } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<header data-astro-cid-nen7h5rs> <div class="masthead" data-astro-cid-nen7h5rs> <a href="/" class="home" aria-label="Serio Ludere catalogue" data-astro-cid-nen7h5rs>${renderComponent($$result, "Wordmark", $$Wordmark, { "data-astro-cid-nen7h5rs": true })}</a> <p class="eyebrow" data-astro-cid-nen7h5rs>${eyebrow}</p> </div> ${renderComponent($$result, "Controls", $$Controls, {
		"rates": rates,
		"data-astro-cid-nen7h5rs": true
	})} </header>`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/Header.astro", void 0);
//#endregion
//#region src/components/RugPhoto.astro
createAstro("https://astro.build");
var $$RugPhoto = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RugPhoto;
	const { src, alt, rot, ar = "3-4", widthCm, lengthCm, eager = false, priority = false, hero = false, full } = Astro.props;
	const dimText = dims(widthCm, lengthCm, "cm");
	const rotClass = rot === "force" ? "rot" : void 0;
	return renderTemplate`${src && !hero && renderTemplate`${maybeRenderHead($$result)}<img${addAttribute(src, "src")}${addAttribute(alt, "alt")}${addAttribute(rotClass, "class")}${addAttribute(eager ? "eager" : "lazy", "loading")}${addAttribute(priority ? "high" : void 0, "fetchpriority")} decoding="async"${addAttribute(rot, "data-rot")} data-rug-img data-plate-img>`} ${src && hero && renderTemplate`<img${addAttribute(["hero-base", rotClass], "class:list")}${addAttribute(src, "src")}${addAttribute(alt, "alt")} loading="eager" fetchpriority="high" decoding="async"${addAttribute(rot, "data-rot")} data-rug-img data-plate-img>`} ${src && hero && full && renderTemplate`<img${addAttribute(["hero-full", rotClass], "class:list")}${addAttribute(full, "src")}${addAttribute(`${src} 800w, ${full} 1600w`, "srcset")} sizes="(min-width: 900px) 55vw, 100vw" alt="" loading="eager" fetchpriority="low" decoding="async"${addAttribute(rot, "data-rot")} data-rug-img>`} <div class="ph-art" aria-hidden="true"${addAttribute(ar, "data-ar")}> <span class="ph-rug"></span> <span class="ph-dims" data-dims${addAttribute(widthCm ?? "", "data-w")}${addAttribute(lengthCm ?? "", "data-l")}${addAttribute(!dimText, "hidden")}>${dimText}</span> </div> <div class="ph">photo to come</div> ${renderScript($$result, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/RugPhoto.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/RugPhoto.astro", void 0);
//#endregion
//#region src/components/VoteButtons.astro
createAstro("https://astro.build");
var $$VoteButtons = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$VoteButtons;
	const { rugId, mode = "card" } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(["like", { "like-detail": mode === "detail" }], "class:list")}> <button type="button" aria-pressed="false" data-vote="like"${addAttribute(mode, "data-source")}${addAttribute(rugId, "data-rug")}> <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.4 1.1 4.2 2.3C11.8 6.1 13.2 5 15.2 5c3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"></path></svg> <span class="sr-only">Like this rug</span> </button> </div> ${renderScript($$result, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/VoteButtons.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/VoteButtons.astro", void 0);
//#endregion
//#region src/components/RugCard.astro
createAstro("https://astro.build");
var $$RugCard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RugCard;
	const { card, rates, hidden = false, eager = false, priority = false, related = false, href: hrefProp } = Astro.props;
	const dimText = dims(card.widthCm, card.lengthCm, "cm");
	const priceText = money(card.priceUsd, baseCurrency, rates, "en-US");
	const likes = likesText(card.likes);
	const badges = badgesFor(card.tags.map((t) => t.name));
	const hasMeta = Boolean(dimText || card.material || card.age || card.origin);
	const href = hrefProp ?? `/rugs/${card.slug}`;
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(["card", { lead: card.lead === true }], "class:list")}${addAttribute(related ? void 0 : "", "data-card")}${addAttribute(card.collectionSlug, "data-collection")}${addAttribute(card.collectionSlugs.join(" "), "data-collections")}${addAttribute(card.slug, "data-slug")}${addAttribute(hidden, "hidden")} data-astro-cid-4ej4vgoa> <div class="photo" data-plate${addAttribute(card.photoUrl ? void 0 : "", "data-empty")}${addAttribute(card.altPhotoUrl, "data-alt")} data-astro-cid-4ej4vgoa> ${renderComponent($$result, "RugPhoto", $$RugPhoto, {
		"src": card.photoUrl,
		"alt": card.name,
		"rot": card.rot,
		"ar": card.ar,
		"widthCm": card.widthCm,
		"lengthCm": card.lengthCm,
		"eager": eager,
		"priority": priority,
		"data-astro-cid-4ej4vgoa": true
	})} <a class="photo-link"${addAttribute(href, "href")} tabindex="-1" aria-hidden="true" data-astro-cid-4ej4vgoa></a> ${renderComponent($$result, "VoteButtons", $$VoteButtons, {
		"rugId": card.id,
		"data-astro-cid-4ej4vgoa": true
	})} ${badges.length > 0 && renderTemplate`<ul class="card-badges" aria-label="Provenance" data-astro-cid-4ej4vgoa> ${badges.map((b) => renderTemplate`<li class="card-badge" data-astro-cid-4ej4vgoa>${b}</li>`)} </ul>`} </div> <div class="nm" data-astro-cid-4ej4vgoa><a class="nm-link"${addAttribute(href, "href")} data-astro-cid-4ej4vgoa>${card.name}</a></div> ${hasMeta && renderTemplate`<ul class="meta" data-astro-cid-4ej4vgoa> <li data-dims${addAttribute(card.widthCm ?? "", "data-w")}${addAttribute(card.lengthCm ?? "", "data-l")}${addAttribute(!dimText, "hidden")} data-astro-cid-4ej4vgoa> ${dimText} </li> ${card.material && renderTemplate`<li data-astro-cid-4ej4vgoa>${card.material}</li>`} ${card.age && renderTemplate`<li data-astro-cid-4ej4vgoa>${card.age}</li>`} ${card.origin && renderTemplate`<li data-astro-cid-4ej4vgoa>${card.origin}</li>`} </ul>`} <div class="price-row" data-astro-cid-4ej4vgoa> <div class="price" data-price${addAttribute(card.priceUsd ?? "", "data-usd")}${addAttribute(!priceText, "hidden")} data-astro-cid-4ej4vgoa>${priceText}</div> <div class="rating"${addAttribute(card.id, "data-rating-for")}${addAttribute(!likes, "hidden")} data-astro-cid-4ej4vgoa>${likes}</div> </div> </div>`;
}, "C:/Users/MD/Desktop/Serio-Ludere-Catalog/src/components/RugCard.astro", void 0);
//#endregion
export { $$Footer as a, $$Header as i, $$VoteButtons as n, $$RugPhoto as r, $$RugCard as t };
