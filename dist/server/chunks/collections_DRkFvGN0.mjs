import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { F as maybeRenderHead, H as unescapeHTML, L as addAttribute, O as renderComponent, P as renderTemplate, k as Fragment } from "./runtime_skv-YCY6.mjs";
import { t as createComponent } from "./compiler_CXPqD_v7.mjs";
import { t as renderScript } from "./motion-spec_BUAFLNaU.mjs";
import { i as getClient, vt as consoleLogger, yt as serializeError } from "./runtime_BXWQfypp.mjs";
import { S as COLLECTION_DESCRIPTION_MAX, i as fetchAdminSnapshot, u as syncLabel } from "./read_B9paZIxY.mjs";
import { o as jsonForScript } from "./view_BkscShQy.mjs";
import { t as $$AdminLayout } from "./AdminLayout_4LOaUeJu.mjs";
import { t as $$Button } from "./Button_D7csSVX1.mjs";
import { n as $$Modal, t as $$EmptyState } from "./EmptyState_CMPkBFH5.mjs";
import { t as $$Input } from "./Input_CV0MlJh-.mjs";
//#region src/pages/admin/collections.astro
var collections_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Collections,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Collections = createComponent(async ($$result, $$props, $$slots) => {
	let snapshot;
	let error;
	try {
		snapshot = await fetchAdminSnapshot(getClient(), { logger: consoleLogger });
	} catch (e) {
		const safe = serializeError(e);
		consoleLogger.error("admin collections read failed", { error: safe });
		error = safe.message;
	}
	const rugs = snapshot?.rugs ?? [];
	const rugCount = (name) => rugs.filter((r) => r.collection.trim().toLowerCase() === name.trim().toLowerCase()).length;
	const collections = (snapshot?.collections ?? []).slice().sort((a, b) => (a.sortOrder ?? 1e9) - (b.sortOrder ?? 1e9) || a.name.localeCompare(b.name));
	const data = { collections: collections.map((c) => ({
		...c,
		rugs: rugCount(c.name)
	})) };
	const syncLabel_ = snapshot ? syncLabel(snapshot.fetchedAt) : void 0;
	return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, {
		"title": "Serio Ludere — Collections",
		"active": "collections",
		"meta": syncLabel_
	}, { "default": ($$result) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result)}<div class="msg err on">Could not read the sheet: ${error}</div>`}<section class="stack" aria-labelledby="h-collections"> <div class="page-head"> <div class="page-head__titles"> <h1 class="page-head__title">Collections</h1> <p class="page-head__count" id="collectionCount"> ${collections.length} ${collections.length === 1 ? "collection" : "collections"} </p> </div> <span class="page-head__rule"></span> ${renderComponent($$result, "Button", $$Button, {
		"icon": "plus",
		"data-open": "new-collection"
	}, { "default": ($$result) => renderTemplate`New collection` })} </div> <div id="m5" class="msg"></div> <div class="crow__columns" aria-hidden="true"> <span class="crow__col-name">Collection</span> <span class="crow__rule"></span> <span class="crow__col-count">Products</span> </div> <ul class="crow-list" id="collectionList" aria-labelledby="h-collections"> ${collections.map((c, i) => renderTemplate`<li class="crow"${addAttribute(c.id, "data-id")}${addAttribute(c.version, "data-version")}${addAttribute(c.name, "data-name")}${addAttribute(String(c.sortOrder ?? i + 1), "data-order")}${addAttribute(c.slug, "data-slug")}> <div class="crow__head"> <span class="crow__name">${c.name}</span> <span class="crow__rule"></span> <span class="crow__count"> ${rugCount(c.name)} ${rugCount(c.name) === 1 ? "product" : "products"} </span> <button type="button" class="btn btn--secondary" data-act="edit">
Edit
</button> </div> ${c.description && renderTemplate`<p class="crow__description">${c.description}</p>`} ${c.description && renderTemplate`<button type="button" class="crow__more" data-act="expand">
See more
</button>`} <div class="crow__edit" hidden> <input class="input" data-field="name"${addAttribute(c.name, "value")}${addAttribute(`Name of ${c.name}`, "aria-label")}>  <div class="crow__desc"> <textarea class="input crow__desc-box" data-field="description" rows="4"${addAttribute(COLLECTION_DESCRIPTION_MAX, "maxlength")}${addAttribute(`Description of ${c.name}`, "aria-label")}>${c.description}</textarea> <p class="hint crow__desc-count" data-desc-count></p> </div> <button type="button" class="btn btn--primary" data-act="save">
Save
</button> <button type="button" class="btn btn--ghost" data-act="cancel">
Cancel
</button> <button type="button" class="btn btn--destructive" data-act="delete">
Delete
</button> </div> </li>`)} </ul> ${collections.length === 0 && renderTemplate`${renderComponent($$result, "EmptyState", $$EmptyState, {
		"type": "first-run",
		"title": "No collections yet",
		"message": "Collections group the catalogue for the buyer. A rug can sit in several at once."
	})}`} ${renderComponent($$result, "Modal", $$Modal, {
		"id": "new-collection",
		"title": "New collection"
	}, {
		"default": ($$result) => renderTemplate` <p>Collections group the catalogue for the buyer. A rug can sit in several at once.</p> <div class="modal__fields"> ${renderComponent($$result, "Input", $$Input, {
			"name": "c_name",
			"label": "Name",
			"placeholder": "Shiraz",
			"hint": "Required, and must be unique."
		})} ${renderComponent($$result, "Input", $$Input, {
			"type": "textarea",
			"name": "c_description",
			"label": "Description",
			"hint": "Shown to customers under the collection name."
		})} </div>  `,
		"footer": ($$result) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "slot": "footer" }, { "default": ($$result) => renderTemplate` ${renderComponent($$result, "Button", $$Button, {
			"style": "ghost",
			"data-close": "new-collection"
		}, { "default": ($$result) => renderTemplate`Cancel` })} ${renderComponent($$result, "Button", $$Button, {
			"id": "btnAddCollection",
			"icon": "plus"
		}, { "default": ($$result) => renderTemplate`Create collection` })} ` })}`
	})} <div id="m6" class="msg"></div> </section> <script type="application/json" id="admin-data">${unescapeHTML(jsonForScript(data))}<\/script>${renderScript($$result, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/collections.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/collections.astro", void 0);
var $$file = "C:/Users/Ramez/Desktop/Serio-Ludere-Catalog/src/pages/admin/collections.astro";
var $$url = "/admin/collections";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/collections@_@astro
var page = () => collections_exports;
//#endregion
export { page };
