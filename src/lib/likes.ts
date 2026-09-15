// Like counts as a buyer sees them (owner, 2026-09-13 and 2026-09-15): the number appears only once a
// rug has five likes. Node-free on purpose — the browser bundle (src/scripts/votes.ts) paints the
// same threshold the server applies, so a card never shows "3 likes" for a second after a tap.

/**
 * "The like count should be only visible on the products that has 5 likes count or more."
 *
 * Below the threshold the number is hidden rather than shown as zero — "1 like" on a private preview
 * tells a buyer who else has been looking, and an empty heart says everything a lone like would.
 */
export const MIN_VISIBLE_LIKES = 5;

/** The like count to display, or undefined when it has not yet earned its place on the card. */
export function visibleLikes(likes: number | undefined): number | undefined {
  return likes !== undefined && likes >= MIN_VISIBLE_LIKES ? likes : undefined;
}

/** "7 likes" for a card or a detail page; null below the threshold, so the line is hidden. */
export function likesText(likes: number | undefined): string | null {
  const shown = visibleLikes(likes);
  return shown === undefined ? null : `${shown} ${shown === 1 ? 'like' : 'likes'}`;
}
