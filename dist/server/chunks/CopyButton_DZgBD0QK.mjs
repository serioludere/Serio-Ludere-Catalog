import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro } from "./runtime_WX5sVh1w.mjs";
import { t as createComponent } from "./compiler_3FReP4Oe.mjs";
import { n as $$Icon } from "./AdminLayout_DiLsTrDB.mjs";
//#region src/components/ui/CopyButton.astro
createAstro("https://astro.build");
var $$CopyButton = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$CopyButton;
	const { value, label = "Copy link", copiedLabel = "Copied", class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<button type="button"${addAttribute(["copy", className], "class:list")}${addAttribute(value, "data-copy")}${addAttribute(copiedLabel, "data-copied-label")}${addAttribute(label, "data-label")}> ${renderComponent($$result, "Icon", $$Icon, {
		"name": "copy",
		"class": "copy__icon--default"
	})} ${renderComponent($$result, "Icon", $$Icon, {
		"name": "check",
		"class": "copy__icon--copied"
	})} <span data-copy-label>${label}</span> </button>`;
}, "C:/Users/Ramez/AppData/Local/Temp/claude/c--Users-Ramez-Desktop-Serio-Ludere-Catalog/781863b0-abca-4a3a-b14c-2221c863305d/scratchpad/commit-wt/src/components/ui/CopyButton.astro", void 0);
//#endregion
export { $$CopyButton as t };
