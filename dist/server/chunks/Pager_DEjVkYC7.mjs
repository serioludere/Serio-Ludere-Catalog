import { F as maybeRenderHead, L as addAttribute, P as renderTemplate, W as createAstro } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
//#region src/components/Pager.astro
createAstro("https://astro.build");
var $$Pager = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Pager;
	const { prev, next, index, total, hrefFor } = Astro.props;
	const href = (c) => hrefFor ? hrefFor(c) : `/rugs/${c.slug}`;
	return renderTemplate`${maybeRenderHead($$result)}<div class="pager"> ${prev ? renderTemplate`<a rel="prev"${addAttribute(href(prev), "href")}${addAttribute(`Previous: ${prev.name}`, "aria-label")}>
‹ <span class="word">Prev</span> </a>` : renderTemplate`<span class="is-off" aria-hidden="true">
‹ <span class="word">Prev</span> </span>`} <span class="pos"> ${index} / ${total} </span> ${next ? renderTemplate`<a rel="next"${addAttribute(href(next), "href")}${addAttribute(`Next: ${next.name}`, "aria-label")}> <span class="word">Next</span> ›
</a>` : renderTemplate`<span class="is-off" aria-hidden="true"> <span class="word">Next</span> ›
</span>`} </div>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/Pager.astro", void 0);
//#endregion
export { $$Pager as t };
