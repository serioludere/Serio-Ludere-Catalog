import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { I as consoleLogger } from "./parse_CyNL3ky6.mjs";
import { B as coerceWidth, R as driveImageResponse, n as getAdminDeps, z as imageMethodNotAllowed } from "./runtime_BIcTruy2.mjs";
//#region src/pages/api/image/[fileId].ts
var _fileId__exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ params, url }) => {
	let drive;
	let readPublic;
	try {
		const deps = getAdminDeps();
		drive = deps.drive;
		readPublic = deps.publicImages;
	} catch {
		drive = void 0;
		readPublic = void 0;
	}
	return driveImageResponse(params.fileId, {
		...readPublic ? { readPublic } : {},
		...drive ? { readMedia: (fileId) => drive.getMedia(fileId) } : {},
		logger: consoleLogger
	}, coerceWidth(url.searchParams.get("w")));
};
var ALL = () => imageMethodNotAllowed();
//#endregion
//#region \0virtual:astro:page:src/pages/api/image/[fileId]@_@ts
var page = () => _fileId__exports;
//#endregion
export { page };
