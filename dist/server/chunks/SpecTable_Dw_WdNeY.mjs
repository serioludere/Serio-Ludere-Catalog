import { F as maybeRenderHead, H as unescapeHTML, I as renderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, j as renderSlot, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_BUAFLNaU.mjs";
import { Z as SUPPORTED_CURRENCIES } from "./runtime_xH1UDnXO.mjs";
import { c as STUDIO_SITE, d as STUDIO_WHATSAPP_2, i as STUDIO_INSTAGRAM_LABEL, l as STUDIO_SITE_LABEL, n as STUDIO_EMAIL, o as STUDIO_PHONE_LABEL, r as STUDIO_INSTAGRAM, s as STUDIO_PHONE_LABEL_2, t as prepaint_default, u as STUDIO_WHATSAPP } from "./prepaint_o8VLPcue.mjs";
import { o as jsonForScript } from "./view_ElRMJZOl.mjs";
//#region src/components/customer/PreviewControls.astro
createAstro("https://astro.build");
var $$PreviewControls = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PreviewControls;
	const { rates, sort = false, placement = "page" } = Astro.props;
	const page = placement === "page";
	const fromSheet = Object.keys(rates.rates).filter((c) => c in rates.symbols);
	const currencies = fromSheet.length ? ["USD", ...fromSheet.filter((c) => c !== "USD")] : [...SUPPORTED_CURRENCIES];
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(["pv-controls", { "pv-controls--header": !page }], "class:list")} data-astro-cid-nulwyfnx> <div class="pv-seg"${addAttribute(page ? "unitTog" : void 0, "id")} data-unit-toggle role="group" aria-label="Units" data-astro-cid-nulwyfnx> <button type="button" data-u="cm" class="on" aria-pressed="true" data-astro-cid-nulwyfnx>cm</button> <button type="button" data-u="ft" aria-pressed="false" data-astro-cid-nulwyfnx>ft</button> </div> ${sort && page && renderTemplate`<div class="pv-select" data-astro-cid-nulwyfnx>  <select id="sortBy" aria-label="Sort rugs" data-astro-cid-nulwyfnx> <option value="featured" data-astro-cid-nulwyfnx>Featured</option> <option value="liked" data-astro-cid-nulwyfnx>Most liked</option> </select> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-nulwyfnx> <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-nulwyfnx></path> </svg> </div>`} <div class="pv-select" data-astro-cid-nulwyfnx> <select${addAttribute(page ? "cur" : void 0, "id")} data-cur aria-label="Currency" data-astro-cid-nulwyfnx> ${currencies.map((c) => renderTemplate`<option data-astro-cid-nulwyfnx>${c}</option>`)} </select> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-nulwyfnx> <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-nulwyfnx></path> </svg> </div> </div>  ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewControls.astro?astro&type=script&index=0&lang.ts")} ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewControls.astro?astro&type=script&index=1&lang.ts")}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewControls.astro", void 0);
//#endregion
//#region src/components/customer/PreviewFooter.astro
var $$PreviewFooter = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${maybeRenderHead($$result)}<footer class="pv-footer"> <div class="pv-footer-row"> <div class="pv-footer-brand">  <p class="pv-footer-mark pv-h4">SERIO LUDERE</p> <div class="pv-footer-contacts"> <div class="pv-contact-group"> <a class="pv-contact"${addAttribute(STUDIO_SITE, "href")} target="_blank" rel="noopener"> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false"> <circle cx="8" cy="8" r="6.2" stroke="currentColor"></circle> <path d="M1.8 8H14.2" stroke="currentColor"></path> <path d="M8 1.8C10.2 4.2 10.2 11.8 8 14.2C5.8 11.8 5.8 4.2 8 1.8Z" stroke="currentColor" stroke-linejoin="round"></path> </svg> ${STUDIO_SITE_LABEL} <span class="sr-only"> (opens in a new tab)</span> </a> <a class="pv-contact"${addAttribute(`mailto:${STUDIO_EMAIL}`, "href")}> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false"> <path d="M2.5 4.5H13.5V11.5H2.5V4.5Z" stroke="currentColor" stroke-linejoin="round"></path> <path d="M2.5 4.5L8 9L13.5 4.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path> </svg> ${STUDIO_EMAIL} </a> </div> <div class="pv-contact-group"> <a class="pv-contact"${addAttribute(`https://wa.me/${STUDIO_WHATSAPP}`, "href")} target="_blank" rel="noopener"> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false"> <path d="M8 2C4.7 2 2 4.7 2 8C2 9.2 2.3 10.3 2.9 11.3L2 14L4.8 13.1C5.8 13.6 6.9 13.9 8 13.9C11.3 13.9 14 11.2 14 7.9C14 4.6 11.3 2 8 2Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M5.8 5.4C5.9 5.2 6.1 5.1 6.3 5.1H6.7C6.9 5.1 7 5.2 7.1 5.4L7.5 6.4C7.6 6.6 7.5 6.8 7.4 6.9L6.9 7.4C6.8 7.5 6.8 7.6 6.9 7.8C7.3 8.5 7.9 9.1 8.6 9.5C8.7 9.6 8.9 9.6 9 9.5L9.5 9C9.6 8.9 9.8 8.8 10 8.9L11 9.3C11.2 9.4 11.3 9.5 11.3 9.7V10.1C11.3 10.5 10.9 10.9 10.5 10.9C8.2 10.9 5.5 8.3 5.1 6C5.1 5.8 5.1 5.6 5.8 5.4Z" fill="currentColor"></path> </svg> ${STUDIO_PHONE_LABEL} <span class="sr-only"> (opens in a new tab)</span> </a> <a class="pv-contact"${addAttribute(`https://wa.me/${STUDIO_WHATSAPP_2}`, "href")} target="_blank" rel="noopener"> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false"> <path d="M8 2C4.7 2 2 4.7 2 8C2 9.2 2.3 10.3 2.9 11.3L2 14L4.8 13.1C5.8 13.6 6.9 13.9 8 13.9C11.3 13.9 14 11.2 14 7.9C14 4.6 11.3 2 8 2Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M5.8 5.4C5.9 5.2 6.1 5.1 6.3 5.1H6.7C6.9 5.1 7 5.2 7.1 5.4L7.5 6.4C7.6 6.6 7.5 6.8 7.4 6.9L6.9 7.4C6.8 7.5 6.8 7.6 6.9 7.8C7.3 8.5 7.9 9.1 8.6 9.5C8.7 9.6 8.9 9.6 9 9.5L9.5 9C9.6 8.9 9.8 8.8 10 8.9L11 9.3C11.2 9.4 11.3 9.5 11.3 9.7V10.1C11.3 10.5 10.9 10.9 10.5 10.9C8.2 10.9 5.5 8.3 5.1 6C5.1 5.8 5.1 5.6 5.8 5.4Z" fill="currentColor"></path> </svg> ${STUDIO_PHONE_LABEL_2} <span class="sr-only"> (opens in a new tab)</span> </a> </div> <div class="pv-contact-group"> <a class="pv-contact"${addAttribute(STUDIO_INSTAGRAM, "href")} target="_blank" rel="noopener"> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false"> <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor"></rect> <circle cx="8" cy="8" r="3" stroke="currentColor"></circle> <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor"></circle> </svg> ${STUDIO_INSTAGRAM_LABEL} <span class="sr-only"> (opens in a new tab)</span> </a> </div> </div> </div> <div class="pv-footer-col pv-footer-fine"> <p>For some card/transfer payments prices are subject to 16% IVA</p> </div> </div> </footer>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewFooter.astro", void 0);
//#endregion
//#region src/components/customer/PreviewHeader.astro
createAstro("https://astro.build");
var $$PreviewHeader = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PreviewHeader;
	const { home, back } = Astro.props;
	const controls = Astro.slots.has("default");
	return renderTemplate`${maybeRenderHead($$result)}<header${addAttribute([
		"pv-header",
		back && "pv-header--detail",
		controls && "pv-header--controls"
	], "class:list")} data-astro-cid-lgr6x3gv> ${back ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <a class="pv-back"${addAttribute(back.href, "href")}${addAttribute(back.label, "aria-label")} data-astro-cid-lgr6x3gv> <span aria-hidden="true" data-astro-cid-lgr6x3gv>←</span> <span class="pv-back-long" aria-hidden="true" data-astro-cid-lgr6x3gv> ${back.label} </span> ${back.shortLabel && renderTemplate`<span class="pv-back-short" aria-hidden="true" data-astro-cid-lgr6x3gv> ${back.shortLabel} </span>`} </a> <span class="pv-spacer" aria-hidden="true" data-astro-cid-lgr6x3gv></span>  <a class="pv-wordmark pv-wordmark-trailing pv-h4"${addAttribute(home, "href")} data-astro-cid-lgr6x3gv>
SERIO LUDERE
</a> ` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <a class="pv-wordmark pv-h4"${addAttribute(home, "href")} data-astro-cid-lgr6x3gv>
SERIO LUDERE
</a> <span class="pv-spacer" aria-hidden="true" data-astro-cid-lgr6x3gv></span> ${renderSlot($$result, $$slots["default"])} ` })}`} </header>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewHeader.astro", void 0);
//#endregion
//#region src/lib/customer/share.ts
/** The card's headline. */
var SHARE_TITLE = "Private catalogue preview";
/** The line under it. */
var SHARE_DESCRIPTION = "Serio Ludere catalogue collection preview";
/** The brand line some apps show above the card. */
var SHARE_SITE_NAME = "Serio Ludere";
//#endregion
//#region src/components/customer/PreviewLayout.astro
createAstro("https://astro.build");
var $$PreviewLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PreviewLayout;
	const { title, rates, customer } = Astro.props;
	return renderTemplate`<html lang="en" data-mode="preview"${addAttribute(customer, "data-customer")}> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><title>${title}</title><meta name="description"${addAttribute(SHARE_DESCRIPTION, "content")}><meta property="og:type" content="website"><meta property="og:site_name"${addAttribute(SHARE_SITE_NAME, "content")}><meta property="og:title"${addAttribute(SHARE_TITLE, "content")}><meta property="og:description"${addAttribute(SHARE_DESCRIPTION, "content")}><meta name="twitter:card" content="summary"><meta name="twitter:title"${addAttribute(SHARE_TITLE, "content")}><meta name="twitter:description"${addAttribute(SHARE_DESCRIPTION, "content")}><link rel="icon" type="image/png" href="/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet"><link rel="expect" href="#pv-ready" blocking="render"><script type="application/json" id="sl-rates">${unescapeHTML(jsonForScript(rates))}<\/script>${renderHead($$result)}</head> <body class="pv"> ${renderSlot($$result, $$slots["default"])} <script>${unescapeHTML(prepaint_default)}<\/script><span id="pv-ready" hidden></span> </body> </html>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/PreviewLayout.astro", void 0);
//#endregion
//#region src/components/customer/Reactions.astro
createAstro("https://astro.build");
var $$Reactions = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Reactions;
	const { rugId, mode = "card" } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<div class="pv-react" data-react${addAttribute(rugId, "data-rug")} data-astro-cid-b63lxulx> <button type="button" class="pv-circle" data-vote="like"${addAttribute(mode, "data-source")}${addAttribute(rugId, "data-rug")} aria-pressed="false" data-astro-cid-b63lxulx> <span class="pv-glyph" aria-hidden="true" data-astro-cid-b63lxulx> <svg viewBox="0 0 16 16" width="32" height="32" fill="none" data-astro-cid-b63lxulx> <path d="M8 13.4C8 13.4 2.6 10.2 2.6 6.6C2.40109 5.88392 2.49479 5.11814 2.86048 4.47114C3.22618 3.82414 3.83392 3.34891 4.55 3.15C5.26608 2.95109 6.03186 3.04479 6.67886 3.41048C7.32586 3.77618 7.80109 4.38392 8 5.1C8.19891 4.38392 8.67414 3.77618 9.32114 3.41048C9.96814 3.04479 10.7339 2.95109 11.45 3.15C12.1661 3.34891 12.7738 3.82414 13.1395 4.47114C13.5052 5.11814 13.5989 5.88392 13.4 6.6C13.4 10.2 8 13.4 8 13.4Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-b63lxulx></path> </svg> </span> <span class="sr-only" data-astro-cid-b63lxulx>Like this rug</span> </button> <span class="pv-sync" data-react-sync aria-hidden="true" data-astro-cid-b63lxulx></span> <span class="pv-alert" data-react-alert aria-hidden="true" data-astro-cid-b63lxulx> <svg viewBox="0 0 12 12" width="12" height="12" fill="none" data-astro-cid-b63lxulx> <path d="M6 1.5 11 10.5H1L6 1.5Z" stroke="currentColor" stroke-linejoin="round" data-astro-cid-b63lxulx></path> <path d="M6 5v2.2" stroke="currentColor" stroke-linecap="round" data-astro-cid-b63lxulx></path> <path d="M6 8.9v.1" stroke="currentColor" stroke-linecap="round" data-astro-cid-b63lxulx></path> </svg> </span> </div> ${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/Reactions.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/Reactions.astro", void 0);
//#endregion
//#region src/components/customer/SpecTable.astro
createAstro("https://astro.build");
var $$SpecTable = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$SpecTable;
	const { rows, widthCm, lengthCm } = Astro.props;
	const hasSize = Boolean(widthCm && lengthCm);
	const shown = rows.filter((r) => r.key === "Size" ? hasSize : r.value.trim() !== "");
	return renderTemplate`${maybeRenderHead($$result)}<aside class="pv-spec" data-astro-cid-ldikxqp5> <p class="pv-h4 pv-spec-title" data-astro-cid-ldikxqp5>Specification</p> <dl class="pv-spec-list" data-astro-cid-ldikxqp5> ${shown.map((row) => renderTemplate`<div class="pv-spec-row" data-astro-cid-ldikxqp5> <dt class="pv-label pv-muted" data-astro-cid-ldikxqp5>${row.key}</dt> <dd${addAttribute(row.key === "Size" && hasSize ? "" : void 0, "data-dims")}${addAttribute(row.key === "Size" && hasSize ? widthCm : void 0, "data-w")}${addAttribute(row.key === "Size" && hasSize ? lengthCm : void 0, "data-l")}${addAttribute(row.key === "Size" && hasSize ? "·" : void 0, "data-sep")} data-astro-cid-ldikxqp5> ${row.value} </dd> </div>`)} </dl> </aside>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/customer/SpecTable.astro", void 0);
//#endregion
export { $$PreviewFooter as a, $$PreviewHeader as i, $$Reactions as n, $$PreviewControls as o, $$PreviewLayout as r, $$SpecTable as t };
