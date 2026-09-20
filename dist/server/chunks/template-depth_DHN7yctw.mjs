import { R as createRenderInstruction } from "./runtime_skv-YCY6.mjs";
//#region node_modules/astro/dist/runtime/server/render/template-depth.js
function templateEnter(_result) {
	return createRenderInstruction({ type: "template-enter" });
}
function templateExit(_result) {
	return createRenderInstruction({ type: "template-exit" });
}
//#endregion
export { templateExit as n, templateEnter as t };
