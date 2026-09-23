import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { mt as driveImageUrl, u as loadCatalogue } from "./runtime_BXWQfypp.mjs";
import { a as catalogueRugs } from "./view_BkscShQy.mjs";
import { n as visibleLikes } from "./likes_Bt2PBY3j.mjs";
//#region src/lib/votes/dto.ts
function catalogueDto(snapshot) {
	const c = snapshot.catalogue;
	return {
		ok: true,
		fetchedAt: new Date(snapshot.fetchedAt).toISOString(),
		count: catalogueRugs(c).length,
		rugs: catalogueRugs(c).map((r) => ({
			id: r.id,
			slug: r.slug,
			name: r.name,
			description: r.description,
			collection: r.collection,
			tags: r.tags,
			photos: r.photos.map((id) => driveImageUrl(id, 1600)),
			widthCm: r.widthCm ?? null,
			lengthCm: r.lengthCm ?? null,
			material: r.material,
			age: r.age,
			origin: r.origin,
			method: r.method,
			priceUsd: r.priceUsd ?? null,
			rotate: r.rotate,
			featured: r.featured,
			likes: visibleLikes(r.likes) ?? null,
			dislikes: visibleLikes(r.likes) === void 0 ? null : r.dislikes,
			rating: visibleLikes(r.likes) === void 0 ? null : r.rating
		})),
		collections: c.collections.map((x) => ({
			slug: x.slug,
			name: x.name,
			description: x.description,
			sortOrder: x.sortOrder ?? null
		})),
		tags: c.tags.map((t) => ({
			slug: t.slug,
			name: t.name,
			color: t.color ?? null
		})),
		rates: c.rates.map((r) => ({
			currency: r.currency,
			rateToBase: r.rateToBase,
			symbol: r.symbol
		}))
	};
}
//#endregion
//#region src/pages/api/catalogue.ts
var catalogue_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async (context) => {
	context.cache.set(false);
	const { snapshot, error } = await loadCatalogue();
	if (!snapshot) {
		context.cache.set(false);
		return new Response(JSON.stringify({
			ok: false,
			error: error ?? "could not load the catalogue"
		}), {
			status: 503,
			headers: {
				"content-type": "application/json; charset=utf-8",
				"cache-control": "no-store",
				"retry-after": "60"
			}
		});
	}
	return new Response(JSON.stringify(catalogueDto(snapshot)), {
		status: 200,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"x-content-type-options": "nosniff"
		}
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/catalogue@_@ts
var page = () => catalogue_exports;
//#endregion
export { page };
