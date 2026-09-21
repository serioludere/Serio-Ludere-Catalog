import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, j as renderSlot } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { n as $$Icon } from "./AdminLayout_Bzl8NmWf.mjs";
import { t as $$Button } from "./Button_COMnZ16d.mjs";
//#region src/components/ui/Modal.astro
createAstro("https://astro.build");
var $$Modal = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Modal;
	const { id, title, class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<dialog${addAttribute(id, "id")}${addAttribute(["modal", className], "class:list")}${addAttribute(`${id}-title`, "aria-labelledby")}> <div class="modal__header"> <h2 class="modal__title"${addAttribute(`${id}-title`, "id")}>${title}</h2> <button type="button" class="modal__close"${addAttribute(id, "data-close")}> ${renderComponent($$result, "Icon", $$Icon, { "name": "close" })} <span class="sr-only">Close</span> </button> </div> <div class="modal__body">${renderSlot($$result, $$slots["default"])}</div> <div class="modal__footer">${renderSlot($$result, $$slots["footer"])}</div> </dialog>`;
}, "/home/user/Serio-Ludere-Catalog/src/components/ui/Modal.astro", void 0);
//#endregion
//#region src/components/ui/EmptyState.astro
createAstro("https://astro.build");
var $$EmptyState = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$EmptyState;
	const PRESET = {
		"first-run": {
			icon: "plus",
			title: "No products yet",
			message: "",
			action: "Add your first product",
			primary: true
		},
		"no-results": {
			icon: "search",
			title: "Nothing matches those filters",
			message: "Try a different collection, or clear the search on ID and title.",
			action: "Clear filters",
			primary: false
		},
		"sheet-unreachable": {
			icon: "alert",
			title: "Can't reach the sheet",
			message: "The catalogue is stored in Google Sheets and the connection failed. Nothing has been lost — retry when you're ready.",
			action: "Retry",
			primary: false
		},
		"failed-commits": {
			icon: "refresh",
			title: "3 products didn't finish saving",
			message: "Their Drive folders exist but no sheet row was written. Retry each one, or open the folder to check.",
			action: "Retry all",
			primary: false
		}
	};
	const { type, title, message, href, class: className } = Astro.props;
	const preset = PRESET[type];
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(["empty", className], "class:list")}> ${renderComponent($$result, "Icon", $$Icon, {
		"name": preset.icon,
		"size": 24,
		"class": "empty__icon"
	})} <h2 class="empty__title">${title ?? preset.title}</h2> ${(message ?? preset.message) && renderTemplate`<p class="empty__message">${message ?? preset.message}</p>`} ${renderComponent($$result, "Button", $$Button, {
		"style": preset.primary ? "primary" : "secondary",
		"href": href,
		"data-empty-action": type
	}, { "default": ($$result) => renderTemplate`${preset.action}` })} </div>`;
}, "/home/user/Serio-Ludere-Catalog/src/components/ui/EmptyState.astro", void 0);
//#endregion
export { $$Modal as n, $$EmptyState as t };
