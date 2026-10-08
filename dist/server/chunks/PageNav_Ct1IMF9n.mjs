import { F as maybeRenderHead, L as addAttribute, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
//#region src/components/ui/PageNav.astro
createAstro("https://astro.build");
var $$PageNav = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PageNav;
	const { id, label, class: className, arrows = false } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<nav${addAttribute(["pagenav", className], "class:list")}${addAttribute(id, "id")}${addAttribute(`${label} pages`, "aria-label")} hidden data-astro-cid-cl2lhtif> ${arrows ? renderTemplate`<button type="button" class="pagenav__arrow" data-page="prev" aria-label="Previous page" data-astro-cid-cl2lhtif> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-cl2lhtif> <path d="M13 8H3M7 4L3 8L7 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-cl2lhtif></path> </svg> </button>` : renderTemplate`<button type="button" class="btn btn--secondary" data-page="prev" data-astro-cid-cl2lhtif>
Previous
</button>`} <p class="pagenav__label" data-page="label" role="status" aria-live="polite" data-astro-cid-cl2lhtif></p> ${arrows ? renderTemplate`<button type="button" class="pagenav__arrow" data-page="next" aria-label="Next page" data-astro-cid-cl2lhtif> <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false" data-astro-cid-cl2lhtif> <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-cl2lhtif></path> </svg> </button>` : renderTemplate`<button type="button" class="btn btn--secondary" data-page="next" data-astro-cid-cl2lhtif>
Next
</button>`} </nav>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/ui/PageNav.astro", void 0);
//#endregion
export { $$PageNav as t };
