# CHANGELOG — admin refactor

**Date** 2026-09-15 · **Scope** `/admin/*` only. The public catalogue and the customer preview were
audited but **not modified** — both are fidelity-locked (see [00-recon.md](00-recon.md) §9).

**Verified after every batch:** `npm run build` (includes `astro check`) — 0 errors ·
`npm test` — 123 files, **1095 tests passing** (1094 before; one added).

---

## Correction to the Gate 1 framing

[PLAN.md](PLAN.md) called admin "the realm with no drawn design", citing
[docs/BRIEF_GAP.md](../BRIEF_GAP.md). **That document is dated 2026-09-08 and is stale.** Admin has
since been drawn and largely built: Figma P1/P2/P3, App Shell `25:200`, Drawer `73:237`, Fetch Modal
`78:241`, Filter Bar `23:183`, Products table `79:1439`, Credential Panel `20:91`, Button `12:122`,
plus a `161:*` revision pass. The Sep 9 screenshots in `docs/screenshots/admin/` predate `AppShell`
entirely and show a top tab bar that no longer exists.

So this was not "design the admin". It was **finish a migration already under way** — from the
`reference/admin.html` vocabulary (`.go`, `.tabs`, `.panel`, `.sub`) onto the drawn design system in
`controls.css` and `src/components/ui/*`. `admin.css`'s own header comment and
`tests/unit/styles/admin-typography.test.ts` both document that migration in progress.

---

## What changed

### Correctness — the P0s from [PLAN.md §1](PLAN.md)

| ID  | Was                                                                                                                                                                                                                                          | Now                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ①   | `.rugtable`'s 810px of `flex: none` columns had no scroll container, so the **document** scrolled sideways between 768–1090px, taking the nav rail with it. 1920px at 200% zoom (960 CSS px) landed inside that band — a WCAG 1.4.10 failure | The existing `#table` div became the scroll container, with `tabindex`/`role="region"` so it is keyboard-operable (2.1.1). `src/styles/components.css`, `src/pages/admin/rugs/index.astro` |
| ①   | `.filterbar` floors at ~580px and never wrapped                                                                                                                                                                                              | Wraps unconditionally. The first attempt gated this at 767px, which was wrong: with the 220px rail the bar overflows below ~848px, so 768–847 was still broken                             |
| ②   | `msg()` inserted content into a `display:none` node, **then** set the role. Nothing in admin was ever announced — no save, no error, no retry                                                                                                | Role → visibility → forced layout read → content. `src/scripts/admin/msg.ts`                                                                                                               |
| ③   | `role="table"` with rows carrying **no role at all**: the catalogue announced as a table with headers and zero data rows, at any size                                                                                                        | Row/cell roles on `RugRow`, and the header's roleless spacer and action spans fixed too, so head and body agree at six columns                                                             |
| ④   | The password dialog was `<form method="dialog">` with one field and no submit button — Enter triggered implicit submission, closed the dialog and **discarded the typed password**                                                           | Real submit button; handler moved to the form with `preventDefault`. Covered by a new regression test, mutation-tested to confirm it fails without the fix                                 |

### Design — completing the migration

- **20 legacy `.go` buttons → `.btn`** across 5 files. The old class had _no_ `:hover`, _no_
  `:active`, _no_ `:focus-visible`, a blanket `opacity: 0.45` disabled state, a hardcoded `1px`
  border using the decorative hairline, and `color: var(--paper)` — a public-catalogue token — inside
  admin. Destructive actions (Revoke, Archive, Disconnect, the reset confirm) now take
  `.btn--destructive`; previously they were indistinguishable from benign ones.
- **`#confirmYes` variant is now runtime-toggled** (`rug-form.ts`). It is shared by Archive _and_
  Restore, so a static destructive class painted _"Restore to active?"_ in warning red.
- **Dead CSS removed**: `.sub`, the `.tabs` group, `.panel`, `button.go` and its reduced-motion and
  focus-visible remnants — all superseded by `AppShell` and `.btn`, all verified unreferenced
  including `class:list` object syntax and runtime `classList` writes.
- **Layout caps** using the six container tokens at `modes.css:320-325`, which had **zero
  consumers**: `.shell__content` at `--container-lg`, `.addform` at `--container-sm`. The product
  form's `auto-fit` grid previously reached seven columns at 1920px.
- **Scroll lock** for admin overlays (`html:has(dialog[open])`), which only the public realm had,
  plus `scrollbar-gutter: stable` so the lock does not jolt the layout sideways.

### Accessibility

- **Every bare admin control's border** moved from `var(--rule)` — the _decorative_ hairline at
  **1.27–1.46:1** — to `var(--border-control)` at **3.01–3.46:1**. One line in `admin.css`; fixes
  every legacy input, select and textarea against WCAG 1.4.11.
- **7 controls off placeholder-as-label**: `cl_name`, `cl_note`, `cl_pw`, `pwDialogInput`,
  `f_action`, `f_target`, `redirectUri` — real `<label for>` in the design-system `.field` wrapper,
  with the now-redundant `aria-label`s removed so the two cannot drift apart. `cl_name` also gained
  `required`, which **no admin data field carried**.
- **`/admin` reachable on mobile.** `AppShell.astro:53` was the only link to it anywhere in the
  codebase, and `.shell__brand` is `display: none` below 767px — while `login.ts:188` sends you to
  `/admin` by default. A mobile-only topbar link, rather than a fourth cell in a tab bar Figma draws
  as exactly three.
- **Logout target 16×16 → 44×44**, via a centred `::after` rather than padding, which would have
  pushed the topbar ~24px taller than it is drawn.
- **`showMessage()` reordered** (`inline-row.ts`) so the per-row live region actually announces —
  both inline-rename failures were previously silent.
- **`#pwDialogErr` can now be seen.** It is `class="msg err" hidden`, and `.msg` is `display: none`
  until `.on`; `clients.ts` only cleared `hidden`, so the password-policy error had **never** been
  visible — a too-short password simply did nothing. Pre-existing; fixed because it sits inside the
  dialog this pass rebuilt.

---

## Review, and what it caught in this work

Four independent reviewers (regression, accessibility, CSS blast radius, design coherence), each
followed by an adversarial verifier instructed to refute by default: **18 confirmed, 25 refuted.**

Findings against this refactor, all now fixed:

| Severity | What I got wrong                                                                                                                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BLOCKER  | `margin-inline: auto` on `.shell__content` **cancels flex cross-axis stretch** (Flexbox §9.6), so the content column shrink-wrapped to its widest child instead of filling the width — the opposite of what the rule's own comment claimed. Now `width: 100%` + `box-sizing`, left-aligned so it shares an edge with the full-bleed topbar |
| MAJOR    | `.sr-only` inside the new header cell had no positioned ancestor within the scroll container                                                                                                                                                                                                                                               |
| MINOR    | `aria-colspan="6"` on the row-status cell described columns 7–12 of a six-column table — there is no `aria-colindex` to anchor it. Removed                                                                                                                                                                                                 |
| MINOR    | The `aria-live` I added to `.irow__message` was inert, because its writer set text before un-hiding — the exact bug `msg()` was rewritten to fix                                                                                                                                                                                           |
| MINOR    | My `msg()` comment claimed the forced reflow rebuilds the accessibility tree. It does not — `offsetHeight` flushes layout only. Comment corrected to state the real limitation                                                                                                                                                             |
| MINOR    | The `#table` scroll region was a tab stop at phone widths where its content is hidden by CSS                                                                                                                                                                                                                                               |
| MINOR    | The filterbar breakpoint was ~80px too low (see ① above)                                                                                                                                                                                                                                                                                   |

---

## Not done, and why

- **Dark mode.** Option A values are derived and ready in [PLAN.md §3.5](PLAN.md) — `--surface-raised`
  collapsing to `--surface` with elevation carried on a border, which fixes all nine failures
  including `--rule` at 1.00:1. **Deferred deliberately**: it collides with uncommitted work in
  `modes.css` and `token-cascade.test.ts`, whose own comment records that Admin Dark keeps the
  handoff values on purpose. That is the author's call, not mine to overwrite.
- **Three findings belong to in-flight work, not this refactor** — the `beforeunload` dirty-guard in
  `rug-form.ts` is never disarmed when the Add-product drawer closes (so `/admin/rugs` prompts
  _"Leave site?"_ on every later navigation), and a server-reported `unchanged` save leaves `dirty`
  set. Reported, not touched.
- **Two label sites left alone on purpose**: the collections inline row editors (column headers serve
  as the labels) and the products search box (placeholder is the convention for search, and it
  already carries an `aria-label`).
- **`required` on the remaining fields.** Only `cl_name` was marked. A visible required marker means
  new copy, which needs sign-off.

---

## Forms, selects and control alignment (2026-09-15)

Diagnosed by rendering the real stylesheets, in the real cascade order, against faithful copies of the
admin form structures, then **measuring** — not by reading CSS and guessing. Every claim below was seen
and then verified numerically before and after.

**The root of it:** 44 of the panel's 50 controls are bare `<input>`/`<select>`/`<textarea>` rather than
the drawn `Input` component (`RugFields.astro` alone has 19 + 3 + 3 and uses the component **zero**
times). The two kinds sit in the same forms, and four differences were visible:

| Defect                                                                                                                                                                                                                                                                                                                                                                                                                     | Measured                          | Fix                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Bare `<select>` drew the native OS arrow** while `.input--select` sets `appearance: none` and draws the 16px chevron from the icon set — two different dropdown affordances in one panel                                                                                                                                                                                                                                 | `appearance: normal` vs `none`    | `appearance: none` + the same `chevron-down` path (11:21) as a data URI, at the same geometry (`padding-right: calc(var(--input-x) * 2 + var(--size-icon))`). `img-src` allows `data:`, so it stays inside the CSP |
| **Disabled controls had no treatment at all** — a bare disabled field was indistinguishable from an editable one                                                                                                                                                                                                                                                                                                           | bare `#fff` vs `.input` `#efefef` | `--subtle` / `--ink-muted`, matching `.input:disabled`                                                                                                                                                             |
| **Readonly used `--paper-deep`** (the public catalogue's bridged surface) where `.input[readonly]` uses `--subtle` — two different greys                                                                                                                                                                                                                                                                                   | —                                 | matched to `--subtle`                                                                                                                                                                                              |
| **Buttons were 1.65px shorter than the fields beside them.** `modes.css:298` claims "buttons and inputs share a height" and gives `--control-y`/`--input-y` the same value — but `.btn` sets `--size-label` (12px) and a field sets `--text-base` (13px), and at `--leading-body` 1.65 that is exactly the gap. `.row` is `align-items: flex-end`, so bottoms matched and every button sat below the top edge of its field | 40.6px vs 42.2px                  | `min-height` pinned to the field's computed height, in `admin.css` so the fidelity-locked realms cannot be touched                                                                                                 |

Also: `.chk` checkbox labels were 13px tall bottom-aligned against 40px buttons, and the `MultiSelect`
trigger and the filter-bar view toggle both drew their edge in the decorative `--rule` (~1.4:1) rather
than `--border-control` (3.01–3.46:1) — a WCAG 1.4.11 failure on the one boundary that marks them as
controls.

**Result, measured across four real form layouts:** top and bottom spread **0px** on every row, every
control 42.2–42.3px. Every select carries exactly one affordance — bare ones the background chevron,
component ones the real `.input__affordance` element, both at 41.6px padding-right. Verified at 320px
(no overflow) and in `admin-dark` (chevron swaps to `#d8d6cc` on `#1c1c1c`).

One fragility caught only by looking at the render: written as a bare `select` selector, the chevron
rule lost to `.input`, whose `background: var(--surface)` **shorthand** resets `background-image` — so
any select carrying `.input` rendered with no affordance at all. Now `select:not(.input--select)`,
which both excludes the component's own select (it would have drawn a second chevron) and outranks
`.input` on specificity.

**Not done:** the underlying duplication. The right end state is for those 44 bare controls to use the
`Input` component, which is what makes the states, the labelling and the affordance correct by
construction. This pass made the two kinds render identically; it did not remove the fork. `.copy` and
`.gallery__thumb` also still carry `--rule` edges and are arguably controls — left alone because they
were not examined in a browser.

---

## Browser verification (2026-09-15)

Run against a production build served by the real adapter — `npm run build && npm start` — not `astro dev`.

**`npm run qa` — 22 / 24.** Both failures are the route-cache assertions
(`scripts/qa.ts:50`), which read an `x-astro-cache` response header that the server does not emit at
all. Nothing in this refactor touches caching. Everything else passed, including no CSP violations, CLS
0.0006 on the index and 0.0000 on a detail page, the full keyboard path, the reduced-motion path, and
"390px: / does not scroll sideways".

**Widths — 8 / 8 with no horizontal overflow**, measured as `document.scrollWidth` against
`clientWidth` at 320 / 768 / 1440 / 1920 on `/` and `/admin/login`.

That pass found and fixed one real defect it was written to catch: **`/admin/login` overflowed at
320px** — 424px of document in a 320px viewport. Two causes, both in `.bare`
(`src/styles/components.css`): the implicit grid column was `auto` so it sized to the card's literal
400px, and `place-items: center` made the `<main>` grid item fit-content, so it carried that 400px and
bled off _both_ edges even once the track was capped. Now `grid-template-columns: minmax(0, 1fr)` with
`align-items: center`, which lets `.alogin`'s existing `max-width: 100%` and `margin-inline: auto` do
what they were written to do. Pre-existing, not introduced here.

**Still not verified in a browser:** every authenticated `/admin/*` screen — the Products table and its
new scroll container, the filter bar wrap, the shell caps, the migrated buttons, the new labels. See
below.

---

## What still needs a decision

1. **The CSP is not being delivered.** Measured on the production build: no
   `content-security-policy` header and no `<meta http-equiv>`, on both a cached and an uncached route.
   Astro resolves `cspDestination` to `"header"` for on-demand routes
   (`core/fetch/fetch-state.js:335`) and every route here is `prerender = false`; the built manifest
   does carry the directives and `shouldInjectCspMetaTags:true`, so the configuration looks right and
   the break is downstream of it. Root cause not established. **This matters disproportionately**: the
   whole design system pays for this CSP — no `style=""`, no `define:vars`, no inline scripts, and a
   hand-rolled view-transition layer instead of `<ClientRouter />` (`docs/DESIGN.md`). Those costs are
   currently buying nothing. Worth an Astro issue or a `security.csp` review before any further design
   work is constrained by it.
2. **Authenticated admin screens are unverified.** Minting a session token from
   `ADMIN_SESSION_SECRET` was refused by this environment's credential guard, correctly. To verify
   them, either sign in yourself at `/admin/login` and leave the browser open, or re-run the width
   script with a session cookie you provide.
3. **The Google OAuth token is being rejected** — `SheetsApiError: Google rejected the stored
authorisation`, so the catalogue reads 503 and the public pages render their ghost state. Unrelated
   to this work, but it blocks any data-backed verification until reconnected at `/admin/google`.
4. **Nothing is committed.** The tree interleaves this refactor with the in-flight accessibility pass
   across ~20 files. Committing them separately will be easier now than later.
5. **Button labels are now uppercase.** `button.go` set `text-transform: none`; `.btn` sets
   `uppercase`, matching the drawn Button and the six `.btn` already in `collections.astro`.
   Consistent — but it is a visible change to every button in the panel.
6. **Dark mode** — ship Option A, or leave dormant.

---

## UI refresh — all three realms (2026-09-15)

**Scope** the public catalogue (`/`, `/rugs/*`, `/tags/*`), the customer preview (`/{slug}`) and
`/admin/*`. Same page layouts, same palette: `tokens.css` and the `modes.css` semantic table are
byte-for-byte what they were (the token-cascade test still pins every value), and `catalogue.css`
remains the untouched parity record. What changed is rhythm, hierarchy, component states, touch
targets and a handful of markup fixes.

**Verified** `npm run typecheck` 0 errors · `npm test` 123 files / 1095 tests · `npm run lint` clean
· a production build into a scratch directory · full-page Playwright screenshots of every screen at
1440 and 390 against a fixture-backed dev server (see _Harness_ below), with no console or page
errors.

### Public catalogue (`editorial.css`, `Controls.astro`, `Footer.astro`, `RugGrid.astro`)

- **Controls.** The cm/ft toggle and the currency select are one 34px family with the same hairline
  and corner; the select draws its own chevron (native menu kept). Hover states on both.
- **Tabs.** Sticky bar now sits on translucent paper with a blur, scrollbar hidden on overflow, the
  active tab's count in the accent, 44px-tall hit areas.
- **Cards.** The plate carries a faint inset edge so it reads as mount board; the meta list runs on
  one line with trailing middle dots (a wrapped line never starts with a separator) instead of four
  ragged mono rows, which is what let every second grid row drift; the name steps to 15/500 with
  balanced wrapping; price and rating use tabular figures.
- **Detail page.** Back link and pager are 44px targets (D-15); tags are 32px chips; the hero plate
  and caption are centred; the spec grid widened its key column.
- **Footer.** Two rows — studio links, then copyright and the FX disclaimer — so the disclaimer no
  longer reads as a link.
- **Headings.** `/` and `/tags/*` gain a visually hidden `<h1>` (F-16).

### Customer preview (`preview.css`, `ProductCard.astro`, page styles)

- **Cards.** A hairline on the image box (surface on canvas is 1.02:1 — the grid had nothing to
  align to), a gentle 4% photo zoom on hover at the storefront's own 600ms, name at the lead size in
  medium weight, tabular figures. The grid fills its row from a 280px floor instead of leaving up to
  96px dead at the right edge.
- **Detail.** The hero photo may take up to 760×520 in the band it already reserves (was capped at
  560×400 and floated small); the hero band gets a bottom hairline; the spec panel a hairline edge.
  The fixed 620 text column can now shrink and the body stacks at ≤1023px, which closes B-02 (the
  768–1100px horizontal scroll). Thumbnails request the 400px tier instead of 1600 (F-31).
- **Controls and chips.** Hover states on the unit toggle, the select and the filter chips; chips
  are 36px minimum. The back link on the detail header grows a 44px coarse-pointer target.
- **Buttons and inputs.** `.pv-btn` gains an `:active` step and a 44px minimum; inputs hover.

### Admin (`admin.css`, `components.css`, pages)

- **Every page has a page head.** Dashboard, Add product, the edit page (rug name, id · status, a
  Back-to-products button), Audit log and Google — Products, Collections and Customers already had
  one.
- **Dashboard tiles** share the Stat Block anatomy (label over a heading-face figure); quick links
  are secondary buttons instead of a run of brand-red text.
- **Banners** (`.msg`) take a 3px tone edge so a stack of them can be told apart from table rows.
- **Tables**: heavier head rule, uppercase label heads, quieter JSON blocks, hover on disclosures.
- **Dialogs**: the two page-owned `<dialog>`s (`#confirm`, `#pwDialog`) take the Modal's surface,
  edge, scrim and padding instead of the browser default box.
- **Shell**: nav links are 40px tall with real padding, the topbar 52px, table rows 40px minimum.
- **Closed drawer bug (pre-existing, fixed).** `.drawer { display: flex }` out-ranked the UA's
  `dialog:not([open]) { display: none }`, so the Add-product drawer was laid out off-screen while
  closed — every one of its controls in the tab order and the accessibility tree. `.drawer:not([open])
{ display: none }`; the `allow-discrete` display transition keeps the slide-out animated.
- **Literals → tokens** in `admin.css` and the page-scoped blocks that carried px spacing.

### Not changed

- Palette, token values, `catalogue.css`, `tokens.css`, `modes.css`.
- Dark mode stays dormant (see _Not done_ above).
- `format:check` still fails on files this pass did not touch (`AdminLayout.astro`, `login.astro`,
  several `api/` routes and the in-flight files listed by `prettier --check`); every file this pass
  edited is formatted.

### Harness

`scratchpad/harness/` (git-ignored) runs the site against an in-memory sheet with 18 fixture rugs,
three customers, visits and audit rows, and a synthetic image proxy — no Google needed:

```
npx astro dev --config scratchpad/harness/astro.config.mjs --mode harness --port 4399 --ignore-lock
node scratchpad/harness/shoot.ts http://127.0.0.1:4399 <outDir> both
```

It needs a `.env.harness` with `ADMIN_PASSWORD_HASH` (password `harness-password-2026`),
`ADMIN_SESSION_SECRET`, `AUTH_SECRET`, `SITE_URL=http://127.0.0.1:4399` and `GOOGLE_AUTH_MODE=service_account`;
the customer `hala` signs in with `amber-loom-serai-47`. Astro refuses `--ignore-lock` when it detects
an agent environment, so unset `CLAUDE*`/`AI_AGENT` first if you are one.

### Width pass (2026-09-15, later the same day)

Owner: "give it the full width and the sizes respected for all". Verified with the harness at 1920, 1440,
1280, 820 and 390.

- **Public grid** — explicit columns instead of `auto-fill`: 5 at ≥1600, 4 at desktop, 3 at ≤1199, 2 at
  ≤899, 1 at ≤599, sharing the row equally; the lead card still spans two. `auto-fill` had packed 236px
  cards at the left of a 1440 screen and left the rest of the row empty. Page gutters are one token,
  `--page-x: clamp(20px, 5vw, 96px)`.
- **Public detail** — the plate takes the remaining width; the spec column stops at 520px instead of
  stretching every hairline row across half a wide monitor.
- **Preview grid** — the same explicit ladder (5 at ≥1800, 4, 3 at ≤1199, 2 at ≤899, 1 at ≤767). The
  detail text column grows to 760px and the panel takes the rest.
- **Admin** — `.shell__content` is no longer capped at 1260px: tables, the products grid and the customer
  gallery (now `minmax(240px, 1fr)`, test updated) fill a wide monitor. Only the product form is capped,
  at `--container-lg`, with the add strip and the field grid sharing that edge.

### Admin pass (2026-09-15, evening)

Owner: close the gap on the right of the admin, make the dropdowns full width and working, make forms,
buttons, dropdowns and tables consistent, and remove technical wording from the panel.

- **The right-hand gap.** `html { scrollbar-gutter: stable }` reserved a scrollbar gutter on every
  admin page; on Windows any screen too short to scroll showed it as an empty grey strip beside the
  white topbar. Removed. The dialog scroll lock now pads the root by the scrollbar width it measured
  while the page could still scroll (`src/scripts/ui/scroll-lock.ts`, wired from `AdminLayout`), so the
  open/close jolt it was preventing stays prevented.
- **Dropdowns.** The filter bar search and collection select are fluid (`flex: 1 1` with ceilings)
  instead of the drawn 280/180; the collections field (`.narrow`) fills its row so the multi-select is
  as wide as the inputs above it; the "All (n)" duplicate of "All collections" is gone from the
  select. Pre-existing bug fixed: `.f label` also matched the Checkbox labels nested inside the
  multi-select, stacking every option under its box in uppercase — the rule is now `.f > label`.
- **Consistency.** Chips and the Copy control share the field height with buttons; Copy takes the
  control edge; row actions in Customers and Collections are Secondary buttons rather than a mix of
  ghost and bordered; products-table row links step up to body-small in ink-soft.
- **Copy.** Every screen reads in plain language: page heads, dashboard tiles (Active products,
  Customers +n paused, Catalogue refreshed, Photo storage, Failed saves, Rows skipped by the sheet),
  Recent activity with humanised action names (`src/lib/admin/audit-labels.ts`, also used by the
  Activity log page and its Load-more rows), quick links, the product form labels and hints, the
  customers and collections guidance, the Google page, every script-side banner (no more audit row
  numbers, sheet rows, Drive ids or env-variable names), friendly dates for Created and the product
  footer, and relative times on the Activity log. "Audit log" is "Activity log" in the nav.
- Tests that pinned the old wording were updated; 1096 tests pass, typecheck and lint are clean.

## Feature pass — 2026-09-15

Owner's request: remove dislikes; show like counts (admin always, customers from 5); create the
catalogue sheet automatically after connecting Google; Antique / Signed badge on the public card;
a password in front of the public catalogue.

### Dislikes removed

- `VoteButtons.astro` and `customer/Reactions.astro` render one Like control. The reactions API
  refuses `dislike` with 400 (`lib/votes/handler.ts`); rows that already carry it still parse.
- Public card and detail page show `N likes` from 5 (`lib/likes.ts`, shared with the browser bundle
  via `scripts/votes.ts`), instead of the old `3.9 · 23 votes` rating line.
- Admin customer page: no "Disliked" stat or grid; "Not yet reviewed" = active − liked. Saves report:
  "Most liked", Likes column only.

### Like counts in the admin

- `lib/admin/likes.ts` reads the Reactions tab alongside the admin ranges and returns a
  `likesById` map (distinct customers currently liking). Products table has a Likes column
  (`.irow__likes`), the grid card a `♥ n` chip (`.card .lk`), the edit page footer `n likes · added …`.

### Google: sheet created on connect

- `lib/admin/provision-sheet.ts` holds the create-and-set-up logic; the OAuth callback calls it when
  no sheet exists and redirects with `sheet=created|failed|skipped` (+ plain-language detail).
  `POST /api/admin/google/provision` remains as the retry, with the form copy changed to say so.

### Antique / Signed on the public card

- `RugCard.astro` renders `badgesFor(tags)` as `<ul class="card-badges">` top-left of the plate
  (pointer-events none), styled in `editorial.css` like the preview badge.

### Site password (`SITE_PASSWORD_HASH`)

- `lib/site/gate.ts` (pure) + `lib/site/http.ts` (env) + `middleware.ts` `site` step: `/`, `/rugs/*`,
  `/tags/*` redirect to `/enter?next=…`; `/api/catalogue` answers 401. Cookie `__Host-sl_site`
  (30 days, HMAC over expiry, signed with `AUTH_SECRET` or `ADMIN_SESSION_SECRET`).
- Gated pages switch the route cache off (`publicCachePolicy()`) and send `private, no-store` +
  `noindex`: a cache HIT would bypass the middleware.
- `/enter` is reserved as a customer slug and always public. `npm run admin:password -- --site`
  prints/writes the hash. Unset = catalogue open, as before.
- Harness: `.env.harness` has a site hash for `harness-site-2026`; `shoot.ts` logs in at `/enter`
  before the public shots.

Verification: typecheck 0 errors, 1103 tests pass, lint clean, harness screenshots at five sizes
with no browser errors (`scratchpad/shots-features/`).
