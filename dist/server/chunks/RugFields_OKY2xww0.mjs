import { F as maybeRenderHead, L as addAttribute, O as renderComponent, P as renderTemplate, W as createAstro, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { mt as driveImageUrl } from "./runtime_xH1UDnXO.mjs";
import { t as BADGE_TAG_NAMES } from "./view_ElRMJZOl.mjs";
//#region src/lib/terms.ts
/** What the rug is made of. */
var MATERIAL_OPTIONS = [
	"Wool",
	"Viscose",
	"Silk",
	"Cotton",
	"Bamboo"
];
/** How it was made. */
var METHOD_OPTIONS = [
	"Hand-Knotted",
	"Flatweave",
	"Hand-Woven",
	"Hand-Embroidered",
	"Jacquard Loom",
	"Aghabani - Natural Dye",
	"Vegetable Dye"
];
/**
* The supplier's words for each option, so a scrape can be read into the list (owner: "they should
* be recognized from the scrape and prefilled based on the page data").
*
* Deliberately short. Every entry is either a spelling of the option itself ("hand knotted",
* "handknotted") or a phrase the two suppliers actually print ("Handmade pile rug" for a knotted
* pile, "Kilim" for a flatweave). Guessing beyond that — "silky sheen" for Silk, "soft" for Wool —
* would fill the form with things the page never said, and the studio would have to audit every
* field instead of glancing at it. What is not recognised is simply left for them to choose.
*/
var ALIASES = {
	Wool: [
		"wool",
		"woollen",
		"woolen"
	],
	Viscose: [
		"viscose",
		"viscos",
		"rayon"
	],
	Silk: ["silk"],
	Cotton: ["cotton"],
	Bamboo: ["bamboo"],
	"Hand-Knotted": [
		"hand knotted",
		"handknotted",
		"knotted",
		"handmade pile rug",
		"pile rug"
	],
	Flatweave: [
		"flatweave",
		"flat weave",
		"flat woven",
		"flatwoven",
		"kilim",
		"dhurrie",
		"soumak"
	],
	"Hand-Woven": [
		"hand woven",
		"handwoven",
		"hand loomed",
		"handloomed",
		"handloom",
		"hand loom"
	],
	"Hand-Embroidered": [
		"hand embroidered",
		"handembroidered",
		"embroidered",
		"embroidery",
		"suzani"
	],
	"Jacquard Loom": ["jacquard loom", "jacquard"],
	"Aghabani - Natural Dye": ["aghabani", "agabani"],
	"Vegetable Dye": [
		"vegetable dye",
		"vegetal dye",
		"plant dye",
		"plant dyes",
		"natural dye"
	]
};
/** Lower case, every run of punctuation or space a single space, padded so a match has boundaries. */
function normalise(value) {
	return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}
/** "hand-knotted", "Hand Knotted" and "HANDKNOTTED" are one value spelled three ways. */
function termKey(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function canonicalOf(options) {
	const out = /* @__PURE__ */ new Map();
	for (const option of options) {
		out.set(termKey(option), option);
		for (const alias of ALIASES[option] ?? []) out.set(termKey(alias), option);
	}
	return out;
}
/**
* The values in a stored cell, canonically spelled where they are on the list.
*
* Splits on "," and "|" — the cell has been written by hand, by the scraper and by three earlier
* versions of this form — trims, drops blanks, and de-duplicates on the same key the canonical
* spelling uses, so "Hand-knotted, handknotted" is one value, not two.
*/
function splitTerms(cell, options = []) {
	const canonical = canonicalOf(options);
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (term) => {
		const id = termKey(term);
		if (!id || seen.has(id)) return;
		seen.add(id);
		out.push(term);
	};
	for (const raw of (cell ?? "").split(/[,|]/)) {
		const value = raw.trim();
		if (!value) continue;
		const exact = canonical.get(termKey(value));
		if (exact) {
			add(exact);
			continue;
		}
		const matched = matchTerms(value, options);
		if (matched.length) matched.forEach(add);
		else add(value);
	}
	return out;
}
/** The values a cell carries that are NOT on the list — the form offers them as ticked extras. */
function extraTerms(cell, options) {
	const known = new Set(options.map(termKey));
	return splitTerms(cell, options).filter((t) => !known.has(termKey(t)));
}
/**
* The options a piece of supplier text mentions, in list order.
*
* Longest alias first, and every match is consumed from the text before the shorter ones are tried,
* so overlapping names resolve the same way every time: "Aghabani - Natural Dye" is that one option
* rather than also matching "natural dye" for Vegetable Dye, and "bamboo silk" does not quietly
* become Silk alone.
*/
function matchTerms(text, options) {
	if (!text?.trim()) return [];
	let haystack = normalise(text);
	const pairs = [];
	for (const option of options) for (const alias of [option, ...ALIASES[option] ?? []]) pairs.push({
		option,
		alias
	});
	pairs.sort((a, b) => b.alias.length - a.alias.length);
	const found = /* @__PURE__ */ new Set();
	for (const { option, alias } of pairs) {
		const needle = normalise(alias);
		if (needle === "  ") continue;
		const hit = [needle, needle.endsWith("s ") ? needle : `${needle.trimEnd()}s `].find((n) => haystack.includes(n));
		if (!hit) continue;
		found.add(option);
		haystack = haystack.split(hit).join("  ");
	}
	return options.filter((o) => found.has(o));
}
//#endregion
//#region src/components/ui/Checkbox.astro
createAstro("https://astro.build");
var $$Checkbox = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Checkbox;
	const { name, id = name, label, checked = false, indeterminate = false, disabled = false, value, class: className } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<label${addAttribute(["check", className], "class:list")}${addAttribute(id, "for")}> <input class="check__box" type="checkbox"${addAttribute(id, "id")}${addAttribute(name, "name")}${addAttribute(value, "value")}${addAttribute(checked, "checked")}${addAttribute(disabled, "disabled")}${addAttribute(indeterminate ? "true" : void 0, "data-indeterminate")}> <span>${label}</span> </label>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/ui/Checkbox.astro", void 0);
//#endregion
//#region src/components/ui/MultiSelect.astro
createAstro("https://astro.build");
var $$MultiSelect = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$MultiSelect;
	const { id, name, label, options, placeholder = "Select…", required = false, class: className } = Astro.props;
	const chosen = options.filter((o) => o.selected === true);
	const summary = chosen.length === 0 ? placeholder : chosen[0].label;
	const extra = chosen.length > 1 ? `+${chosen.length - 1}` : "";
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(["msel", className], "class:list")}${addAttribute(id, "id")} data-multi-select${addAttribute(placeholder, "data-placeholder")}${addAttribute(required ? "true" : void 0, "data-required")}> <details class="msel__wrap"> <summary class="msel__trigger"> <span class="msel__label sr-only">${label}</span> <span${addAttribute(["msel__value", { "is-empty": chosen.length === 0 }], "class:list")} data-msel-value> ${summary} </span> ${extra && renderTemplate`<span class="msel__more" data-msel-more> ${extra} </span>`} <svg class="msel__chevron" viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"> <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </summary> <div class="msel__panel" role="group"${addAttribute(label, "aria-label")}> ${options.map((o) => renderTemplate`${renderComponent($$result, "Checkbox", $$Checkbox, {
		"class": "msel__opt",
		"id": `${id}__${o.value.replace(/[^A-Za-z0-9_-]+/g, "-")}`,
		"name": name,
		"value": o.value,
		"label": o.label,
		"checked": o.selected === true
	})}`)} ${options.length === 0 && renderTemplate`<p class="msel__empty">No collections yet — add one first.</p>`} </div> </details> </div>`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/ui/MultiSelect.astro", void 0);
//#endregion
//#region src/components/admin/RugFields.astro
createAstro("https://astro.build");
var $$RugFields = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RugFields;
	const { mode, rug, collections, tags, roundStep, driveScopeOk, nextId, fetchButton = true, likes = 0 } = Astro.props;
	const edit = mode === "edit";
	const day = (iso) => {
		const t = iso ? Date.parse(iso) : NaN;
		return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric"
		}) : "—";
	};
	const metaLine = rug ? `${likes} ${likes === 1 ? "like" : "likes"} · added ${day(rug.scrapedAt)}` : "";
	const v = (s) => s === void 0 ? "" : String(s);
	const allTags = rug?.tags.filter((t) => t.trim()) ?? [];
	const isMarker = (tag) => BADGE_TAG_NAMES.some((m) => m.toLowerCase() === tag.trim().toLowerCase());
	const ownTags = allTags.filter((t) => !isMarker(t));
	const PRESET_TAGS = BADGE_TAG_NAMES;
	const chosenCollections = new Set((rug?.collections ?? []).map((c) => c.trim().toLowerCase()));
	const termOptions = (cell, options) => {
		const chosen = new Set(splitTerms(cell, options).map((t) => t.toLowerCase()));
		return [...options, ...extraTerms(cell, options)].map((value) => ({
			value,
			label: value,
			selected: chosen.has(value.toLowerCase())
		}));
	};
	const materialOptions = termOptions(rug?.material, MATERIAL_OPTIONS);
	const methodOptions = termOptions(rug?.method, METHOD_OPTIONS);
	return renderTemplate` ${maybeRenderHead($$result)}<div class="addform"> ${edit ? renderTemplate`<div class="f"> <label for="f_id">Product number</label> <input id="f_id"${addAttribute(rug?.id ?? "", "value")} readonly autocomplete="off"> <p class="hint">Must be unique — it becomes the product's reference number.</p> </div>` : renderTemplate`<input type="hidden" id="f_id"${addAttribute(nextId ?? "", "value")}>`} ${!edit && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <div class="f"> <label for="url">Supplier product link</label> <div class="row"> <div class="grow"> <input id="url" placeholder="ecarpetgallery.com, karavanrug.com or serioludere.com" inputmode="url" autocomplete="off"> </div> ${fetchButton && renderTemplate`<button class="btn btn--primary" id="btnFetch" type="button">
Fetch
</button>`} </div> </div> <div id="m1" class="msg"></div> ` })}`} </div> <div id="preview"${addAttribute(["preview", { on: edit }], "class:list")}>  <div class="stack"> <h3>Photos <span class="cnt-inline" id="photoCount"></span></h3>  <p class="hint">Tick the close-up of the weave: the customer sees it in the product popup.</p> <div id="photoStrip" class="grid photos"> ${rug?.photos.map((id, i) => renderTemplate`<label class="card tile"> <div class="ph"> <img${addAttribute(driveImageUrl(id, 800), "src")} alt="" loading="lazy"> </div> <div class="mt"> <input type="radio" name="texture" data-texture${addAttribute(id, "value")}${addAttribute(rug?.textureId === id, "checked")}${addAttribute(`Photo ${i + 1} is the texture photo`, "aria-label")}>
texture · ${i + 1} </div> </label>`)} </div> <label class="chk" id="textureNone"> <input type="radio" name="texture" data-texture value=""${addAttribute(!rug?.textureId, "checked")}>
No texture photo
</label> <p class="hint" id="photoHint" hidden>
Photo storage is not connected, so photos cannot be uploaded. Paste Google Drive links below instead.
</p> <div class="f wide"> <label for="f_photos">Photo links (Google Drive) — one per line; the first is the card image</label> <textarea id="f_photos" rows="3">${rug?.photos.join("\n") ?? ""}</textarea> </div> </div> <div class="fields"> <div class="f">  <label for="f_name">Product name</label> <input id="f_name"${addAttribute(rug?.name ?? "", "value")} placeholder="e.g. Khal Mohammadi" autocomplete="off"> </div> <div class="f"> <span class="f__legend">Collections</span> ${renderComponent($$result, "MultiSelect", $$MultiSelect, {
		"id": "f_collection",
		"name": "collection",
		"label": "Collections",
		"placeholder": "Choose collections…",
		"required": true,
		"options": collections.map((c) => ({
			value: c.name,
			label: c.name,
			selected: chosenCollections.has(c.name.trim().toLowerCase())
		}))
	})} </div>   <div class="f wide"> <span class="f__legend">Markers</span> <p class="hint">Shown to the customer on the card and in the product popup.</p> <div class="tagpresets"> ${PRESET_TAGS.map((t) => renderTemplate`<button type="button" class="chip tagpreset"${addAttribute(t, "data-preset")}${addAttribute(allTags.some((own) => own.trim().toLowerCase() === t.toLowerCase()) ? "true" : "false", "aria-pressed")}> ${t} </button>`)} </div> </div> <div class="f wide"> <span class="f__legend">Tags</span> <p class="hint">The studio's own filing. Never shown to the customer.</p> <div class="tagrow"> <div class="tagtokens" id="tagChips" role="list" aria-label="Tags on this product"> ${ownTags.map((t) => renderTemplate`<span class="tagtoken"${addAttribute(t, "data-tag")} role="listitem"> <span class="tagtoken__label">${t}</span> <button type="button" class="tagtoken__x"${addAttribute(t, "data-remove")}${addAttribute(`Remove ${t}`, "aria-label")}>
×
</button> </span>`)} </div> <div class="newtag"> <label class="sr-only" for="newTag">New tags, separated by commas</label> <input id="newTag" placeholder="New tags, separated by commas" autocomplete="off"> <button class="chip" id="btnNewTag" type="button"> Add tags </button> </div> </div> </div> <div class="f wide"> <label for="f_description">Description</label>  <textarea id="f_description" rows="6">${rug?.description ?? ""}</textarea> </div> <div class="f wide"> <label for="f_sourceUrl">Supplier link</label> <input id="f_sourceUrl" inputmode="url"${addAttribute(rug?.sourceUrl ?? "", "value")} autocomplete="off"> </div> <div class="f"> <label for="f_width">Width (cm)</label> <input id="f_width" inputmode="numeric"${addAttribute(v(rug?.widthCm), "value")}> </div> <div class="f"> <label for="f_length">Length (cm)</label> <div class="pair"> <input id="f_length" inputmode="numeric"${addAttribute(v(rug?.lengthCm), "value")}> <button class="chip" id="btnSwap" type="button" title="Swap width and length">⇄</button> </div> </div> <div class="f"> <span class="f__legend">Material</span> ${renderComponent($$result, "MultiSelect", $$MultiSelect, {
		"id": "f_material",
		"name": "material",
		"label": "Material",
		"placeholder": "Choose materials…",
		"options": materialOptions
	})} </div> <div class="f"> <span class="f__legend">Method</span> ${renderComponent($$result, "MultiSelect", $$MultiSelect, {
		"id": "f_method",
		"name": "method",
		"label": "Method",
		"placeholder": "Choose methods…",
		"options": methodOptions
	})} </div> <div class="f"> <label for="f_age">Age</label> <input id="f_age"${addAttribute(rug?.age ?? "", "value")}> </div> <div class="f"> <label for="f_origin">Origin</label> <input id="f_origin"${addAttribute(rug?.origin ?? "", "value")}> </div>  <div class="f"> <label for="f_pile">Pile</label> <input id="f_pile"${addAttribute(rug?.pile ?? "", "value")} placeholder="Thick Pile, No Pile…"> </div> <div class="f"> <label for="f_shape">Shape</label> <input id="f_shape"${addAttribute(rug?.shape ?? "", "value")} placeholder="Rectangular, Round…"> </div> <div class="f"> <label for="f_price">Retail price (USD)</label> <div class="pair"> <input id="f_price" inputmode="decimal"${addAttribute(v(rug?.priceUsd), "value")}> <button class="chip" id="btnRound" type="button">Round to ${roundStep}</button> </div> </div> <div class="f"> <label for="f_supplier">Supplier</label> <select id="f_supplier"> <option value=""${addAttribute(!rug?.supplier, "selected")}>Owned / other</option> <option value="ecarpetgallery"${addAttribute(rug?.supplier === "ecarpetgallery", "selected")}>ECG</option> <option value="karavanrug"${addAttribute(rug?.supplier === "karavanrug", "selected")}>KV</option> <option value="serioludere"${addAttribute(rug?.supplier === "serioludere", "selected")}>Serio Ludere</option> </select> </div> ${edit ? renderTemplate`<div class="f"> <label for="f_slug">Web address</label> <div class="pair"> <input id="f_slug"${addAttribute(rug?.slug ?? "", "value")} autocomplete="off"> <button class="chip" id="btnSlug" type="button" title="Regenerate from the name">
↻
</button> </div> </div>` : renderTemplate`<input type="hidden" id="f_slug" value="">`} <div class="f"> <label for="f_supplierRef">Supplier ref</label> <input id="f_supplierRef"${addAttribute(rug?.supplierRef ?? "", "value")} autocomplete="off"> </div> <div class="f wide"> <label for="f_notes">Notes (internal)</label> <textarea id="f_notes" rows="2">${rug?.notes ?? ""}</textarea> </div>  <select id="f_rotate" hidden> <option value="false"${addAttribute((rug?.rotate ?? "false") === "false", "selected")}>No</option> <option value="true"${addAttribute(rug?.rotate === "true", "selected")}>Turn to portrait</option> <option value="force"${addAttribute(rug?.rotate === "force", "selected")}>Always turn</option> </select>  <input type="checkbox" id="f_featured"${addAttribute(rug?.featured === true, "checked")} hidden> </div>  <p class="hint" id="ftHint" hidden></p> <p class="hint" id="priceHint" hidden></p> <p class="hint" id="tagHint" hidden></p> <ul class="hint warnings" id="warnings" hidden></ul> <div class="actions"> ${!edit && renderTemplate`<label class="chk"> <input type="checkbox" id="savePhotos"${addAttribute(driveScopeOk === true, "checked")}${addAttribute(driveScopeOk !== true, "disabled")}>
Save photos to Google Drive
</label>`} <label class="chk"> <input type="checkbox" id="roundOnSave"${addAttribute(!edit, "checked")}>
Round price to ${roundStep} on save
</label> ${!edit && renderTemplate`<div class="actions__bar">  <button class="btn btn--secondary" id="btnClear" type="button">
Cancel
</button> <button class="btn btn--primary" id="btnAdd" type="button">
Save product
</button> </div>`} ${edit && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` <button class="btn btn--primary" id="btnSave" type="button">
Save
</button>  <button class="btn btn--destructive" id="btnDelete" type="button">
Delete product
</button> ` })}`} </div> <div id="m2" class="msg"></div> <input type="hidden" id="f_version"${addAttribute(rug?.version ?? "", "value")}> ${edit && rug && renderTemplate`<p class="hint mono">${metaLine}</p>`} </div> ${edit && renderTemplate`<dialog id="confirm"> <p id="confirmText"></p> <div class="actions">  <button class="btn btn--primary" id="confirmYes" type="button">
Yes
</button> <button class="btn btn--secondary" id="confirmNo" type="button">
Cancel
</button> </div> </dialog>`}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/components/admin/RugFields.astro", void 0);
//#endregion
export { $$RugFields as t };
