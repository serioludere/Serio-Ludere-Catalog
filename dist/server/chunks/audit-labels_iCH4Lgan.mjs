//#region src/lib/admin/audit-labels.ts
var AUDIT_LABELS = {
	"rug.create": "Product added",
	"rug.update": "Product updated",
	"rug.status": "Product archived or restored",
	"collection.create": "Collection added",
	"collection.update": "Collection updated",
	"collection.reorder": "Collections reordered",
	"tag.create": "Tag added",
	"tag.update": "Tag updated",
	"client.create": "Customer link created",
	"client.status": "Customer link paused or resumed",
	"client.password": "Customer password reset",
	"settings.update": "Settings changed",
	"photo.import": "Photos imported",
	"scrape.fetch": "Supplier page fetched",
	"reactions.compact": "Reactions archived",
	"auth.login": "Signed in",
	"auth.logout": "Signed out",
	"auth.lockout": "Sign-in locked",
	"auth.google": "Google connected"
};
/** The label for an action key; an unknown key reads as words rather than as code. */
function auditLabel(action) {
	return AUDIT_LABELS[action] ?? action.replace(/[._]+/g, " ");
}
//#endregion
export { auditLabel as t };
