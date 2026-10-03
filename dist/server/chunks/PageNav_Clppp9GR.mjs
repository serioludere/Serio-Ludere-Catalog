import { F as maybeRenderHead, L as addAttribute, P as renderTemplate, W as createAstro } from "./runtime_WX5sVh1w.mjs";
import { t as createComponent } from "./compiler_3FReP4Oe.mjs";
//#region src/components/ui/PageNav.astro
createAstro("https://astro.build");
var $$PageNav = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PageNav;
	const { id, label, class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<nav${addAttribute(["pagenav", className], "class:list")}${addAttribute(id, "id")}${addAttribute(`${label} pages`, "aria-label")} hidden data-astro-cid-cl2lhtif> <button type="button" class="btn btn--secondary" data-page="prev" data-astro-cid-cl2lhtif>Previous</button> <p class="pagenav__label" data-page="label" role="status" aria-live="polite" data-astro-cid-cl2lhtif></p> <button type="button" class="btn btn--secondary" data-page="next" data-astro-cid-cl2lhtif>Next</button> </nav>`;
}, "C:/Users/Ramez/AppData/Local/Temp/claude/c--Users-Ramez-Desktop-Serio-Ludere-Catalog/781863b0-abca-4a3a-b14c-2221c863305d/scratchpad/commit-wt/src/components/ui/PageNav.astro", void 0);
//#endregion
export { $$PageNav as t };
