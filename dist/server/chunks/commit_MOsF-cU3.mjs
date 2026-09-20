import { yt as serializeError } from "./runtime_DeI95MAO.mjs";
//#region src/lib/drive/commit.ts
/** `01-primary`, `02`, `03`… so the folder sorts in the order the studio chose. */
function photoName(prefix, index, primary) {
	const n = String(index + 1).padStart(2, "0");
	return primary ? `${n}-primary` : `${prefix}-${n}`;
}
/**
* Creates the rug's folders, uploads the photos into `All Images`, and copies the first one up into
* the rug folder as `01-primary`.
*
* Four at a time (owner, 2026-09-17: a ten-photo save took ~30 s one by one). Order is not lost: every
* result is written back to its own index, and the filenames carry the position (`01-primary`,
* `<prefix>-02`…), so the row and the Drive folder read in the studio's order either way. A failure
* part-way still leaves a set the retry can finish, because the retry skips names already present.
*/
async function commitPhotos(input, deps) {
	const photos = new Array(input.urls.length);
	let folders;
	try {
		folders = await deps.drive.ensureProductFolders(input.productId, input.productName);
	} catch (e) {
		const safe = serializeError(e);
		deps.logger?.error("photo commit: folders unavailable", { error: safe });
		return {
			photos: input.urls.map((url) => ({
				url,
				error: "folder_failed",
				detail: safe.message
			})),
			ids: [],
			complete: false,
			folderError: safe.message
		};
	}
	let existing = /* @__PURE__ */ new Map();
	if (input.reuseExisting) try {
		existing = await deps.drive.listFolder(folders.allImagesId);
	} catch (e) {
		deps.logger?.warn("photo commit: could not list All Images", { error: serializeError(e) });
	}
	let primaryCopy;
	const one = async (i) => {
		const url = input.urls[i];
		const name = photoName(input.namePrefix, i, i === 0);
		const already = existing.get(name);
		if (already) {
			photos[i] = {
				url,
				id: already,
				name,
				reused: true
			};
			return;
		}
		const result = await deps.drive.uploadFromUrl(url, name, folders.allImagesId, {
			supplier: input.supplier ?? "",
			index: i
		});
		if ("error" in result) {
			photos[i] = {
				url,
				error: result.error,
				detail: result.detail
			};
			return;
		}
		photos[i] = {
			url,
			id: result.id,
			name: result.name
		};
		if (i === 0) primaryCopy = deps.drive.copyFile(result.id, `01-primary`, folders.productId).then((copy) => {
			if ("error" in copy) deps.logger?.warn("photo commit: primary not duplicated", { detail: copy.detail });
		});
	};
	let next = 0;
	const worker = async () => {
		while (next < input.urls.length) await one(next++);
	};
	await Promise.all(Array.from({ length: Math.min(4, input.urls.length) }, worker));
	await primaryCopy;
	const ids = photos.filter((p) => p.id && !p.error).map((p) => p.id);
	return {
		photos,
		ids,
		folders,
		complete: ids.length === input.urls.length && input.urls.length > 0
	};
}
//#endregion
export { commitPhotos as t };
