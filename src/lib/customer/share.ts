// What a pasted preview link says when a chat app unfurls it (owner, 2026-09-21).
//
// A buyer is sent `${SITE_URL}/{slug}`, and the first thing they often do is paste it into WhatsApp,
// iMessage or a group thread. The app fetches the URL to build its card — with no cookie, so it
// always lands on the password gate, never on anyone's catalogue. Product deep links redirect there
// too (src/pages/[slug]/[productId].astro), so these four lines cover every shape of preview link.
//
// The card is read by EVERYONE in the thread the link was pasted into, which is a wider audience
// than the link itself: a forwarded link is one tap, and the card travels with it. So it carries no
// buyer name, no slug, no rug, no photo and no count — the same reasoning that keeps the buyer's
// name out of the tab title (src/pages/[slug]/index.astro). It says a private thing exists and that
// a password opens it, and nothing a stranger could use.
//
// One string each, in one place, because this is copy: the owner changes it here and nowhere else.

/** The card's headline. */
export const SHARE_TITLE = 'Private catalogue preview';

/** The line under it. */
export const SHARE_DESCRIPTION = 'Serio Ludere catalogue collection preview';

/** The brand line some apps show above the card. */
export const SHARE_SITE_NAME = 'Serio Ludere';
