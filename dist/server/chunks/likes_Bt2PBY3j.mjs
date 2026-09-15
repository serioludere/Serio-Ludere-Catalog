/** The like count to display, or undefined when it has not yet earned its place on the card. */
function visibleLikes(likes) {
	return likes !== void 0 && likes >= 5 ? likes : void 0;
}
/** "7 likes" for a card or a detail page; null below the threshold, so the line is hidden. */
function likesText(likes) {
	const shown = visibleLikes(likes);
	return shown === void 0 ? null : `${shown} ${shown === 1 ? "like" : "likes"}`;
}
//#endregion
export { visibleLikes as n, likesText as t };
