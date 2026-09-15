# 02-layout · B · Layout & responsive

**Phase 1 audit · read-only · no code changed.** Findings verified against the files: each citation was
re-checked with `sed -n` and each claim adversarially re-judged. 9 finding(s) refuted and moved
to the bottom. Counts: **P0 0 · P1 3 · P2 10** (13 kept).

## Dimension B — Layout & Responsive

**Covered:** all 10 rendered admin routes (logout is a 303, no UI), both customer preview routes, the three public routes; all 10 stylesheets; all 23 `.astro` scoped `<style>` blocks. Every citation below was re-derived with `sed -n 'Np'` immediately before writing (see the verification passes in the transcript) — none reused from earlier context.

**Counts:** 22 findings — 3 P0, 10 P1, 9 P2. By realm: admin 12, shared 6, customer 3, public 1.

**The headline number: 75 off-grid spacing declarations** (margin/padding/gap not a multiple of 4) — **admin 25, public 44, customer 5, shared 1**. Three of those are the canonical `margin: -1px` sr-only clip, leaving **72 real**. Separately, **7 off-grid values live in the token layer itself** (modes.css:140/141/142/149/150/154/158) and are deliberate storefront-parity carries — so every button and input in all three realms is off-grid by design, and the 75 must not be read as a 75-item cleanup.

**The single worst problem** is B-01: `.filterbar` (components.css:605) is a non-wrapping flex row whose children are `flex:none` at 280px and 180px, with no media query anywhere in the repo. Minimum content width is 580px against a 272px content box at 320. **/admin/rugs scrolls the whole page horizontally at every viewport under ~628px** — 320, 360, 390, 414 and 480 all fail. Close behind: B-02, where `.pv-detail-text { flex: 0 0 620px }` plus a `.pv-spec` whose min-content is ~340px means the **customer detail page overflows horizontally across the entire 768–1100 band** — precisely the band neither drawn Figma frame (1440, 390) covers; and B-03, where **/admin/rugs renders zero products at ≤767 if JS does not run**, because `.rugtable` is `display:none` in CSS and `#grid` ships with the `hidden` attribute.

Structurally: **admin does not participate in the breakpoint system at all.** modes.css's two token breakpoints explicitly exclude it (`:not([data-mode='admin'])`, modes.css:448/457), so `--gutter` is 24px from 320 to 3840; admin.css's one media query is scoped entirely to `#clientTable`; and the six `--container-*` tokens have **zero consumers repo-wide**.

## Findings

| ID | Sev | Realm | Location | Observation | Why it is a problem | Proposed fix |
| --- | --- | --- | --- | --- | --- | --- |
| B-01 | P1 | shared | `src/styles/components.css:605` | .filterbar is `display:flex` with `gap: var(--stack-md)` (12) and NO `flex-wrap`. Its children are `.filterbar__search { flex:none; width:280px }` (components.css:614) and `.filterbar__select { flex:none; width:180px }` (components.css:618), then a spacer and two 36px square buttons (components.css:628-629). There is no media query for `.filterbar` anywhere in the repo — `grep -n filterbar src/styles/*.css` returns only lines 605-643 in components.css and 586-599 in admin.css, none inside an @media. | Minimum content width is 280 + 12 + 180 + 12 + 12 + 36 + 12 + 36 = 580px, and nothing can shrink (`flex:none` sets flex-shrink:0). Admin content box is `viewport - 221 (nav+border) - 48 (2x--gutter)` above 767 and `viewport - 48` below it. So /admin/rugs overflows horizontally for every viewport under ~628px — 320, 360, 390, 414, 480 all scroll the whole page sideways, including the fixed bottom tab bar's parent. This is the single worst 320px failure in the build. | Add `flex-wrap: wrap` to `.filterbar` and change `.filterbar__search` to `flex: 1 1 280px; width: auto` and `.filterbar__select` to `flex: 1 1 180px; width: auto` inside a new `@media (max-width: 767px)` block, keeping the drawn fixed widths above 768. BLAST RADIUS: components.css is shared by all three realms, but `.filterbar*` is emitted only by src/components/ui/FilterBar.astro, which is imported only by src/pages/admin/rugs/index.astro:14. Public and customer render zero `.filterbar` nodes, so the change is admin-only in practice. Verify with `grep -rn FilterBar src/pages` before landing. |
| B-02 | P1 | customer | `src/pages/[slug]/[productId].astro:266` | `.pv-body` is a flex row (productId.astro:260) with `gap: var(--space-section)` (productId.astro:262) and `padding: var(--section-gap) var(--gutter)` (productId.astro:263). Its two children are `.pv-detail-text { flex: 0 0 620px }` (non-shrinking) and `<SpecTable>`'s `.pv-spec { flex: 1 1 auto }` (SpecTable.astro:48) carrying `padding: var(--section-gap)` = 64px per side (SpecTable.astro:51) and a `dt` of `flex: 0 0 120px` (SpecTable.astro:72). The column only stacks at `@media (max-width: 767px)` (productId.astro:367). | `.pv-spec` min-content = 128 (padding) + 120 (dt) + 12 (gap) + the longest unbreakable value word (~80-100px) ≈ 340-360px, and automatic minimum sizing stops flex-shrink from going below it. Required width = 620 + gap + 340 + 2x gutter. At 768-1023: 620 + 64 + 340 + 64 = 1088 > viewport, for the whole band. At 1024-1098: 620 + 112 + 340 + 96 = 1168 > viewport. So /[slug]/[productId] scrolls horizontally for every width from 768 up to roughly 1100px. The closed 52-finding fidelity audit (docs/PREVIEW_FIDELITY.md) pins 1440 and 390 — this is exactly the band neither frame covers. | Would move the parity record: none of the three drawn frames (1440 desktop, 390 mobile) specify 768-1100, so this is an undrawn gap rather than a deviation. The minimal correction is `flex: 0 1 620px; min-width: 0` on `.pv-detail-text` plus `min-width: 0` on `.pv-spec` so the pair compresses instead of overflowing, or extending the existing 767 stack query to 1099. Confirm empirically at 768/900/1024 before proposing — my number is arithmetic, not a measured render. NO CHANGE THIS PHASE (realm=customer is fidelity-locked). |
| B-10 | P1 | admin | `src/styles/admin.css:204` | `.fields` is the product form's grid (admin.css:202-207). With `.shell__content` uncapped, the available width inside `.addform`'s 16px padding is 1651 − 32 = 1619px at 1920 and 1171 − 32 = 1139px at 1440. `gap: var(--space-field)` = 12px in admin (modes.css:369). | `auto-fit` + `minmax(220px, 1fr)` yields floor((W + 12) / 232) columns: 7 at 1920, 4 at 1440, 2 at 768, 1 at 320. A form whose column count silently doubles between the design width and a common monitor width is not a layout — the label-to-field reading order scrambles and `.f.wide { grid-column: 1 / -1 }` (admin.css:222-224) spans a 7-track row. Same failure on /admin/rugs/new and /admin/rugs/[id], the two screens where data entry accuracy matters most. | Cap the form: `.addform { max-width: var(--container-xs) }` (680px, one of the six unused container tokens) or pin the grid to `repeat(auto-fit, minmax(220px, 320px))` so tracks stop growing. Fixing B-05 alone still leaves 4 columns at 1172; the form wants an explicit cap of its own. |
| B-05 | P2 | admin | `src/styles/components.css:1313` | `.shell__content { flex: 1 1 auto; padding: var(--space-section) var(--gutter) }` (components.css:1313-1315) has no max-width. `.shell__nav` is fixed at 220px (components.css:1198). Meanwhile modes.css:155-160 declares six container sizes (440/680/980/1150/1260/1360) and modes.css:320-325 aliases them as `--container-xxs` … `--container-xl` — and `grep -rn "var(--container-" src/` returns ZERO matches. Twelve token declarations with no consumer. | Every admin page is full-bleed. Content width is 1171px at 1440 and 1651px at 1920. admin.css:436 states the card grid was tuned for "the 1172 content width" — i.e. the 1440 case — so at 1920 `.grid` (admin.css:437, `repeat(auto-fill, minmax(240px,1fr))`) renders 6 columns instead of the drawn 4, and `.fields` (admin.css:204, `minmax(220px,1fr)`) renders a 7-column form. The design system has a container scale and nothing reads it, so 1920 is an unspecified layout on all 10 rendered admin routes. | Introduce one cap: `.shell__content { max-width: calc(var(--container-md) + 2 * var(--gutter)); margin-inline: auto }` — 1150 + 48 = 1198, which reproduces the 1172 content width admin.css:436 was tuned against to within 26px, or add a `--container-admin: 1172px` alias to make it exact. This is the change that makes 1440 and 1920 render identically, which is what the admin.css comments already assume. BLAST RADIUS: `.shell__content` exists only inside AppShell.astro (admin); public and customer never render it. |
| B-06 | P2 | admin | `src/styles/admin.css:696` | This is the ONLY media query in admin.css that concerns layout (the other four are `hover:hover` at :375, :381 and reduced-motion at :666, :675). Every rule inside it is prefixed `#clientTable` (admin.css:697-767). The generic `table` rule (admin.css:325) and `.table-wrap { overflow-x: auto }` (admin.css:322-324) are the only treatment the other tables get. /admin/audit (audit.astro:51, six columns including ISO timestamps and a `<pre>` payload) and both dashboard tables (index.astro:118, :147) and the Collections list all fall back to a scroll box. | Four of the ten rendered admin routes carry wide tabular data and exactly one of them has a mobile layout. On /admin/audit at 320 the user gets a 272px-wide window onto a ~900px table with no scroll affordance, no sticky first column and a `<details><pre>` that expands inside the scroll region. The `td[data-label]::before` pattern that makes the Customers table work (admin.css:715) is already written and is applied to exactly one `<td>` in the whole repo (clients.astro:174). One media query for 11 routes is not sufficient, and the gap is not uniform — it is concentrated precisely on the data-dense screens. | Generalise the `#clientTable` stack pattern into a `.table-stack` modifier on `.table-wrap`, driven by `td[data-label]` which already exists as a convention, and apply it to the audit and dashboard tables; add `data-label` attributes to their `<td>`s (markup-only, no copy change — the labels are the existing `<th>` text). Alternatively keep the scroll box but add a visible edge-fade and `scroll-snap-type: x proximity`. Pure CSS + data-* attributes, CSP-safe. |
| B-09 | P2 | admin | `src/styles/admin.css:163` | `.hint` (admin.css:163-169) declares font-family, font-size `var(--text-xs)` = 11px, colour, `margin-top: 8px` and letter-spacing. No max-width. It is the admin realm's only long-form prose style and carries multi-sentence copy on /admin/google (google.astro:71, :77, :130, :157, :164, :187, :192, :199, :210), /admin/rugs (rugs/index.astro:183), /admin/audit (audit.astro:50) and RugFields (RugFields.astro:254). | With no cap the paragraph fills `.shell__content`, which is itself uncapped (see B-05). At 11px Inter, 1ch ≈ 6.6px, so the rendered measure is 76ch at 768, 178ch at 1440 and 250ch at 1920 — three to four times the 45-75ch band. tokens.css:52 defines `--measure: 46ch` for exactly this and the admin realm never reads it. On /admin/google, where the copy is genuinely instructional, a reader at 1920 tracks a 1651px line back to its start. | `max-width: var(--measure)` on `.hint` (46ch at 11px = 304px, which is tight but correct for caption-size text) or a dedicated `--measure-caption: 64ch`. Also apply to `.msg` (admin.css:174) and `.crow__description` (components.css:758), which have the same problem at 12px. Capping `.shell__content` per B-05 reduces the worst case but does not fix it: 1172px at 11px is still 178ch. |
| B-11 | P2 | admin | `src/styles/components.css:1296` | `.shell__topbar` (components.css:1291-1299) takes `var(--tight)` block padding, which admin mode sets to `var(--space-4)` = 4px (modes.css:368). Its only tall child is `.shell__title` at `font-size: var(--h3)` (components.css:1304), and admin remaps `--h3` to `--size-body-lg` = 15px (modes.css:359) with `--leading-heading: 1.2` (modes.css:257). | Rendered topbar height is 4 + 18 + 4 + 1 (border) = 27px, on every one of the nine nav-bearing admin routes. The bottom tab bar at ≤767 is 76px (components.css:1331) and the nav rail's own links get `padding: var(--tight)` = 4px too (components.css:1226), giving ~26px rows. A 27px application chrome band carrying the page title is below the vertical rhythm of everything under it (`.stack { margin-top: 26px }`, admin.css:419) and gives `.shell__logout` (components.css:1257-1264, `padding: 0; border: 0`) no hit height at all. | Give the topbar an explicit `min-height` on the 4pt grid (48px or 56px) and use `padding-block: var(--stack-md)` (12) instead of `var(--tight)`, which is 12 in preview mode and 4 only in admin. BLAST RADIUS: `.shell__topbar` is admin-only (AppShell.astro:85), but `--tight` itself is read in 20+ places across all three realms, so change the topbar rule, never the token. |
| B-12 | P2 | shared | `src/styles/components.css:704` | `.empty` (components.css:696-707) sets `width: 100%`, `max-width: 520px`, `align-items: center` and `text-align: center` — but no `margin-inline: auto`. `.empty__message` caps at 480px (components.css:724). EmptyState is rendered on /admin/clients (clients.astro:134), /admin/collections (collections.astro:153) and /admin/rugs (rugs/index.astro:192, :199, :203), always as a direct child of the uncapped `.shell__content`. | The block is 520px wide and hard left in a 1171px (1440) or 1651px (1920) content column, while everything inside it is centred. The result reads as a centring bug: an icon, a title and a message centred on the 260px mark of a 1651px page. This is the first thing the owner sees on a freshly provisioned sheet, which is exactly the first-run state EmptyState exists for. | Add `margin-inline: auto` to `.empty`. BLAST RADIUS: components.css is shared; `.empty` is rendered only by src/components/ui/EmptyState.astro, whose only importers are the three admin pages above (`grep -rn EmptyState src/pages` confirms). Public and customer render no `.empty` node, so this is admin-only in effect. `.empty__message` at 480px/12px = 67ch is already inside the 45-75ch band and needs nothing. |
| B-13 | P2 | customer | `src/styles/preview.css:72` | `.pv-wrap { width: 100%; padding-inline: var(--gutter) }` (preview.css:72-75) is the customer realm's only container primitive and has no max-width. `--gutter` is 48 at ≥1024, 32 at ≤1023 (modes.css:450) and 16 at ≤767 (modes.css:459); preview.css:322 re-applies 16 directly. `.pv-grid` (src/pages/[slug]/index.astro:173) uses fixed `repeat(auto-fill, 300px)` tracks with `column-gap: var(--stack-lg)` (16). | The preview page is unbounded above its 1440 design width. At 1920 the content band is 1824px, which auto-fill fills with 5 fixed 300px cards (5x300 + 4x16 = 1564px) and leaves 260px of dead right-hand gutter — the grid is left-aligned, so the whole catalogue visually drifts left of centre on a wide monitor. The header rule, the hero band and the footer all run the full 1824px while the cards stop at 1564. | Would move the parity record only above 1440, which the Figma file does not draw. `.pv-wrap { max-width: calc(var(--container-xl) + 2 * var(--gutter)); margin-inline: auto }` (1360 + 96 = 1456, i.e. the 1440 frame plus its gutters) reproduces the drawn layout exactly at 1440 and freezes it above. Alternatively `justify-content: center` on `.pv-grid` alone. NO CHANGE THIS PHASE (realm=customer is fidelity-locked). |
| B-16 | P2 | admin | `src/pages/admin/rugs/index.astro:183` | An empty `<p>` that JS fills with the result count. `.hint` has `margin-top: 8px` (admin.css:167) and no reserved height. The same empty-then-filled pattern appears at audit.astro:50, and `<td data-last-seen>—</td>` (clients.astro:174) is rewritten by script. Alongside it, `#empty-first` (rugs/index.astro:185), `#empty-none` (rugs/index.astro:202), `#grid` (rugs/index.astro:208) and `.rugtable` all change visibility after the module runs, and `.msg` blocks toggle `display:none`→`block` (admin.css:174-184). | Layout shift is not driven by images here — every `<img>` in the repo sits in a ratio box or a fixed-height plate (see the layout-shift table) — it is driven by async data. `#count` inserting one 11px line at `margin-top: 8px` pushes the entire table down ~26px on first paint of /admin/rugs and /admin/audit. On /admin/rugs the swap between `.rugtable` and `#grid` is a whole-page reflow. The QA harness asserts CLS < 0.02 (recon §10) but is run against the public site URL, so the admin routes are never measured. | Reserve the line: `.hint#count { min-height: calc(var(--text-xs) * var(--leading-body)) }`, or server-render the count into the element (it is derivable at request time — `rugs.length` is already in scope at rugs/index.astro). For the view swap, fixing B-03 removes the reflow entirely. Add the admin routes to `scripts/qa.ts`'s CLS sweep so this is measured rather than argued. |
| B-18 | P2 | admin | `src/styles/admin.css:60` | `.tabs` (admin.css:57-87) is a full flex nav block with `gap: 4px`, `margin: 28px 0 20px`, `padding: 10px 14px` on its links (admin.css:73) and `padding-bottom: 6px` on the logout (admin.css:86). `grep -rn 'class="tabs' src/` returns no matches — the six-tab strip it styles was replaced by AppShell's rail (AdminLayout.astro:2-6 documents the replacement). | 31 lines of dead layout CSS that contribute 4 of the admin realm's 25 off-grid spacing values (10, 14, 6, and 28/20 are on-grid but the block is unreachable). It inflates the off-grid headline number with values no one can see, and any future 4pt sweep will spend time normalising geometry that renders nowhere. | Delete admin.css:57-93 (`.tabs` through `.panel.on`, all part of the same retired strip — verify `.panel` is also unused before removing). Deletion-only, zero render change. Confirm with `grep -rn 'class="panel\\|class="tabs' src/` first. |
| B-20 | P2 | admin | `src/styles/admin.css:419` | `.stack { margin-top: 26px }` is the admin realm's section rhythm in practice. It coexists with `--space-section: var(--space-24)` (modes.css:364), `--section-gap: var(--space-16)` (modes.css:365), `.grid { margin-top: var(--space-form) }` = 16 (admin.css:439), `.stats { margin-top: 12px }` (admin.css:626), `table { margin-top: 16px }` (admin.css:328) and `.preview { margin-top: 24px }` (admin.css:279). | Six different vertical block gaps — 12, 16, 24, 26, 20 (`.tabs`, dead) — on the same pages, one of which (26) is off the 4pt grid and is the largest, so section headings sit at an interval no other element in the panel shares. There is no single vertical rhythm value in admin; the semantic tokens `--space-section` and `--section-gap` exist for exactly this and are read by `.shell__content` and nothing else in admin.css. | Replace `.stack { margin-top: 26px }` with `margin-top: var(--space-section)` (24, on-grid, and already the admin section token), and `.stats`/`table`/`.grid`'s margin-top with `var(--section-gap)` (16) so intra-section spacing is one value and inter-section spacing is another. Two tokens, six literals retired, one off-grid value removed. |
| B-21 | P2 | shared | `src/styles/components.css:1586` | `.page-head` (components.css:1585-1590) is a flex row whose first child `.page-head__titles` is `flex: none` (components.css:1591-1593), i.e. flex-shrink:0 at max-content width. It contains `.page-head__title` at `var(--h1)` (19.8px in admin) over `.page-head__count` at `var(--text-xs)` (components.css:1607-1612), the latter carrying strings like "412 products · 3 failed to save". Only `flex-wrap: wrap` is added at ≤767 (components.css:1624). | `flex: none` on a text block means the count line sets the block's width to its max-content — it cannot wrap to fit. At 320 the admin content box is 272px; a count string of ~34 characters at 11px is ~190px and fits, but any longer status line (the string is assembled at runtime and its length is data-dependent) pushes the header past the viewport with no shrink path. `flex-wrap: wrap` only moves the CTA to a second row; it does not let the title block narrow. | `.page-head__titles { flex: 1 1 auto; min-width: 0 }` — the flexible rule (`.page-head__rule`, components.css:1618-1621) already absorbs the slack, so the titles do not need flex:none to stay left. BLAST RADIUS: `.page-head` is emitted by admin pages only (rugs/index.astro:135, collections.astro:51); confirmed with `grep -rn page-head src/pages`. |

## 1. Container-width table

All verified by `sed -n 'Np'` immediately before writing. Admin content box = `vw − 221 (220px rail + 1px border) − 48 (2 × --gutter)` above 767, `vw − 48` below.

| realm | selector | max-width | padding | file:line |
|---|---|---|---|---|
| shared | `--container-xxs … --container-xl` (440/680/980/1150/1260/1360) | declared | — | modes.css:155-160, aliased modes.css:320-325 — **zero consumers** (`grep -rn "var(--container-" src/` → no matches) |
| admin | `.shell` | none | 0 | components.css:1186-1191 (`min-height: 100dvh`) |
| admin | `.shell__nav` | **220px fixed, 768→∞** | `var(--space-inline)` = 8 | components.css:1198, :1199 |
| admin | `.shell__nav` ≤767 | 100% × 76px tall, fixed bottom | `--inset-tab-bar-y` 10 / `-bottom` 20 | components.css:1331, :1332 |
| admin | `.shell__topbar` | none | `var(--tight) var(--gutter)` = **4 / 24** | components.css:1296 |
| admin | `.shell__content` | **none** | `var(--space-section) var(--gutter)` = 24 / 24 | components.css:1313, :1315 |
| admin | `.bare` (login page) | none | `var(--space-section) var(--gutter)` | components.css:1278-1283 |
| admin | `.alogin` (login card) | 400px | `var(--section-gap)` = 16 | login.astro:147, :154 |
| admin | `.addform` | none | `var(--space-form)` = 16 | RugFields.astro:57 / admin.css:232 |
| admin | `.fields` grid | none — `auto-fit minmax(220px,1fr)` | gap `--space-field` = 12 | admin.css:204 |
| admin | `.grid` (cards) | none — `auto-fill minmax(240px,1fr)` | gap `--stack-lg` = 16 | admin.css:437 |
| admin | `.empty` | 520px, **no `margin-inline:auto`** | `var(--section-gap) var(--space-inline)` | components.css:704, :705 |
| admin | `.empty__message` | 480px (≈67ch) | — | components.css:724 |
| admin | `.cust__grid` | none — `auto-fill, 240px` fixed tracks | gap 16 | clients/[code].astro:280 |
| admin | `.cust__stats > *` | 200px fixed | — | clients/[code].astro:249 |
| admin | `td pre` | 60ch | — | admin.css:416 |
| admin | `.thumb` | 200px | — | admin.css:287 |
| admin | `dialog` (RugFields, global) | **420px** | 20px 24px | RugFields.astro:413, :412 |
| customer | `.pv-wrap` | **none** | `padding-inline: var(--gutter)` = 48 / 32 / 16 | preview.css:72, :74 |
| customer | `.pv-wrap` ≤767 | none | `padding-inline: var(--stack-lg)` = 16 | preview.css:322 |
| customer | `.pv-grid` | none — `auto-fill, 300px` fixed tracks | col 16 / row `--section-gap` 64 | [slug]/index.astro:173 |
| customer | `.pv-body` | none | `var(--section-gap) var(--gutter)` = 64 / 48 | [productId].astro:263 |
| customer | `.pv-detail-text` | **620px, `flex:0 0`** | — | [productId].astro:266, :267 |
| customer | `.pv-hero img` | 560 × 400 | — | [productId].astro:219, :220 |
| customer | `.pv-spec` | none — `flex:1 1 auto` | `var(--section-gap)` = 64 | SpecTable.astro:48, :51 |
| public | page bands (`.top` / `.grid-wrap` / `.foot`) | **none** | `5vw` inline | catalogue.css:17, :118, :241 |
| public | `.rug-grid` | none — `auto-fill minmax(230px,1fr)` | `34px 5vw 70px` | catalogue.css:118, :122 |
| public | editorial grid | none — `auto-fill minmax(240px,1fr)` | `34px 5vw 96px` | editorial.css:74, :77 |
| public | `.lede .lede-text` | 52ch | — | editorial.css:62 |
| public | `.desc` | `var(--measure)` = 46ch | — | editorial.css:594 |
| public | `.info h1.nm` | 22ch | — | editorial.css:552 |

**Conclusion:** not one of the three realms caps its page container. Public uses `5vw`, customer uses an uncapped `--gutter`, admin uses an uncapped `--gutter` minus a fixed 220px rail. The container scale exists in tokens and is dead.

---

## 2. 4PT GRID AUDIT — the headline number

Method: regex over `margin | padding | gap | row-gap | column-gap` (and their `-top/-bottom/-left/-right/-block/-inline` forms) across all 10 sheets and all `.astro` scoped styles; every `px` literal whose absolute value is non-zero and not divisible by 4.

### Totals per realm

| realm | off-grid declarations | files |
|---|---|---|
| **public** | **44** | catalogue.css 20, editorial.css 24 |
| **admin** | **25** | admin.css 17, RugFields.astro 5, collections.astro 2, google.astro 1 |
| **customer** | **5** | ProductCard.astro 4, preview.css 1 |
| **shared** | **1** | controls.css 1 |
| **TOTAL** | **75** | |

Three of the 75 (`controls.css:313`, `editorial.css:22`, `preview.css:128` — all `margin: -1px`) are the canonical sr-only clip idiom and are not spacing. **Net real off-grid: 72 — admin 25, public 43, customer 4, shared 0.**

### ADMIN — every off-grid value (the realm where work lands)

| file:line | declaration | off-grid values |
|---|---|---|
| admin.css:55 | `margin-top: 6px;` | 6 |
| admin.css:73 | `padding: 10px 14px;` | 10, 14 — *dead `.tabs` block, see B-18* |
| admin.css:86 | `padding-bottom: 6px;` | 6 — *dead* |
| admin.css:177 | `padding: 10px 12px;` | 10 |
| admin.css:179 | `margin-top: 14px;` | 14 |
| admin.css:289 | `margin-top: 14px;` | 14 |
| admin.css:314 | `gap: 7px;` | 7 |
| admin.css:415 | `margin: 6px 0 0;` | 6 |
| admin.css:419 | `margin-top: 26px;` | 26 — *the section rhythm, B-20* |
| admin.css:524 | `padding: 2px 6px;` | 2, 6 |
| admin.css:546 | `padding: 2px 6px;` | 2, 6 |
| admin.css:605 | `padding: 1px 5px;` | 1, 5 |
| admin.css:630 | `padding: 12px 14px;` | 14 |
| RugFields.astro:360 | `gap: 6px;` | 6 |
| RugFields.astro:365 | `padding: 6px 10px;` | 6, 10 |
| RugFields.astro:370 | `gap: 6px;` | 6 |
| RugFields.astro:377 | `padding-left: 18px;` | 18 |
| collections.astro:274 | `padding: 6px 8px;` | 6 |
| collections.astro:282 | `margin-right: 6px;` | 6 |
| google.astro:258 | `padding-top: 2px;` | 2 |

**25 values across 20 declarations. Four of them (admin.css:73 ×2, :86) are in the dead `.tabs` block.**

### CUSTOMER (4 real)

| file:line | declaration |
|---|---|
| ProductCard.astro:145 | `padding: 2px 6px;` |
| ProductCard.astro:165 | `padding: 2px 6px;` |
| preview.css:128 | `margin: -1px;` — *sr-only clip, excusable* |

### PUBLIC (43 real) — fidelity-locked, reported not actioned

catalogue.css:17, :27, :46, :65, :80, :91, :98, :114, :118, :123, :128, :186, :193, :228, :241, :243, :264 (20 values) · editorial.css:22*, :59, :74, :92, :139, :151, :227, :270, :289, :347, :429, :430, :433, :543, :561, :572, :580, :585, :596, :602, :606, :623, :651 (24 values, one excusable). Any normalisation here **would move the parity record** — catalogue.css is the byte-for-byte record of `reference/catalogue.html`.

### Off-grid at the TOKEN layer (deliberate, do not touch)

| file:line | token | value |
|---|---|---|
| modes.css:140 | `--space-deviation-input-y` | 10.4px → `--control-y`, `--input-y` |
| modes.css:141 | `--space-deviation-input-x` | 12.8px → `--input-x` |
| modes.css:142 | `--space-deviation-control-gap` | 10px → `--control-gap` |
| modes.css:149 | `--ios-home-indicator` | 34px |
| modes.css:150 | `--ios-tab-bar-y` | 10px |
| modes.css:154 | `--size-checkbox` | 14px |
| modes.css:158 | `--size-container-md` | 1150px — off-grid **and** unused |

These are aliased mode-invariantly at modes.css:298-302, so **every button and input in all three realms is off-grid by design**. modes.css:137-142 documents why.

### Off-grid positional offsets (not counted above)

admin.css:518, :519, :531, :532 (`6px` badge corners) · components.css:129 (`left: 2px`) · editorial.css:696 (`inset: -6px`) · PreviewGate.astro:138 (`inset: -14px`) · Reactions.astro:191 (`inset: -6px`). Nine more.

---

## 3. ADMIN BREAKPOINT BEHAVIOUR — 320 / 768 / 1440 / 1920

`admin.css` has exactly one layout media query: `@media (max-width: 767px)` at **admin.css:696**, and every rule inside it is prefixed `#clientTable` (admin.css:697-767). The only other admin-reaching layout queries are in the shared sheet: components.css:1319 (`.shell` → bottom tab bar), :1577 (`.rugtable { display:none }`), :1623 (`.page-head` wrap), :1704 (`.crow` columns), :984/:1125/:1935 (drawer/fetch/modal). The token breakpoints at modes.css:447 and :456 **exclude admin by selector** (modes.css:448, :457), so `--gutter` stays 24 and `--space-section` stays 24 at every width.

Content box: **320 → 272px** · **768 → 499px** · **1440 → 1171px** · **1920 → 1651px**.

| route | 320 | 768 | 1440 (design width) | 1920 |
|---|---|---|---|---|
| `/admin` (dashboard) | tab bar; `.stats` `minmax(160px,1fr)` (admin.css:624) → 1 col; both `.table-wrap` boxes scroll with no affordance | rail 220 eats 29%; stats 3 col; tables scroll inside 499px | stats 6 col; tables fit | **content 1651px, uncapped**; stats spread to 6 × 275px; `.msg` warnings run 229ch |
| `/admin/login` | `.bare` centres a 400px card capped to 272 by `max-width:100%` (login.astro:148) — **OK** | OK, centred | OK | card centred in 1920 — **OK** (the one route that behaves at every width) |
| `/admin/rugs` | **BROKEN ×2**: `.filterbar` overflows page by ~308px (B-01); `.rugtable` hidden + `#grid[hidden]` → **blank without JS** (B-03) | `.filterbar` fits (580 < 719 available at the pre-rail width… **but content is 499px → still overflows by ~81px**); `.rugtable` needs 898px in a 499px box, **no `overflow-x`** (B-17) | designed case, 1172 ≈ the 1172 admin.css:436 assumes | `.grid` renders **6 cards** where admin.css:436 tuned for 4; `.rugtable` rows leave 741px of dead `.irow__spacer` |
| `/admin/rugs/new` | `.grow` min-width 260 in a 240px box → **overflow 20px** (B-07); `dialog` max-width 420 → **overflow 100px** (B-08) | `.fields` 2 col | `.fields` 4 col | `.fields` **7 col** — form column count nearly doubles vs design (B-10) |
| `/admin/rugs/[id]` | same as `/new` | same | same | same |
| `/admin/collections` | `.crow__name`/`.crow__count` go `width:auto` and `.crow__head` wraps (components.css:1704-1713) — **handled**; `td input{min-width:120px}` (collections.astro:276) fits | 240 + 12 + 110 = 362 in 499 — fits, rule absorbs 127 | fits | `.crow__rule` absorbs 1281px; `.crow__description` unclamped on expand runs 163ch |
| `/admin/clients` | **the only well-handled narrow route** — table restacks to cards (admin.css:696-767) with `[data-label]::before` (admin.css:715) and `overflow-wrap:anywhere` on the URL cell (admin.css:749) | 7-column table + full URLs in a 499px `.table-wrap` scroll box | fits | table stretches to 1651; URL column takes the slack |
| `/admin/clients/[code]` | 2×2 stats + 2-col gallery via its own 767 query (clients/[code].astro:353-383) — **handled** | `.cust__grid` 240px tracks → **1 column**, 259px dead | 4 columns | 6 columns, 147px dead (B-14) |
| `/admin/audit` | 6-col table incl. ISO timestamps, **scroll box only** (admin.css:322); `#count` line inserts after JS | scroll box in 499px | fits | 1651px table; `<pre>` capped at 60ch, rest unbounded |
| `/admin/google` | `.row`/`.grow` 260px min in 272 — fits bare, overflows in any padded parent; `.kv dt` `flex:0 0 140px` (google.astro:252) leaves 132px for values | fits | fits | `.hint` instructional copy runs **250ch** (B-09) |

**Assessment: one media query is not sufficient.** It covers one of ten routes. The three that most need narrow treatment — `/admin/rugs` (filter bar + products table), `/admin/audit` (6-col table), `/admin/rugs/new` (fixed-min form fields) — have none, and `/admin/rugs` is actively broken below 628px on two independent counts. The 768–1023 band is worse than 320 in one respect: the desktop table is live there while the content column is only 499px, and nothing wraps it in `overflow-x`.

---

## 4. READING MEASURE

`--measure: 46ch` is declared at **tokens.css:52** and read at **exactly one place in the repo**: `editorial.css:594` (`.desc`, the public rug-detail description). `grep -rn "var(--measure)" src/` returns that single line.

Assuming Inter's `0` advance ≈ 0.6em (so 1ch ≈ 0.6 × font-size):

| realm | block | file:line | font-size | container | **rendered measure** | verdict |
|---|---|---|---|---|---|---|
| public | `.desc` | editorial.css:594 | 15px | `var(--measure)` | **46ch** | ✅ in band (the only token consumer) |
| public | `.lede .lede-text` | editorial.css:62 | 15px | `52ch` hardcoded | **52ch** | ✅ in band, but **bypasses the token** |
| public | `.info h1.nm` | editorial.css:552 | clamp 20-26px | `22ch` | 22ch | ✅ heading, deliberate |
| customer | `.pv-detail-desc` | [productId].astro:283-287 | `--text-lg` = 15px | `.pv-detail-text` 620px | **69ch** @ ≥768 · **37ch** @ 320 | ⚠️ top of band at desktop, under it on phone. **No cap of its own** — it inherits the 620px flex-basis |
| customer | `.pv-spec` dd | SpecTable.astro:74-79 | 13px | flexible remainder | 612px ≈ **78ch** @ 1440 | ⚠️ short values in practice, but unconstrained |
| admin | **`.hint`** | **admin.css:163-169** | `--text-xs` = 11px | **uncapped `.shell__content`** | **41ch @320 · 76ch @768 · 178ch @1440 · 250ch @1920** | ❌ **the worst measure failure in the build** (B-09) |
| admin | `.msg` | admin.css:174-181 | `--text-sm` = 12px | uncapped | 163ch @1440 · **229ch @1920** | ❌ unconstrained |
| admin | `.crow__description` | components.css:758-768 | 12px | uncapped, `-webkit-line-clamp:1` at rest | 1 line at rest; **163ch @1440 when expanded** | ❌ the clamp hides it until the user expands it |
| admin | `.empty__message` | components.css:724 | 12px | 480px | **67ch** | ✅ in band |
| admin | `.alogin__fine` | login.astro:184-188 | 11px | 400 − 32 = 368px | **56ch** | ✅ in band |
| admin | `td pre` | admin.css:416 | `--text-xs` 11px | `60ch` | 60ch | ✅ code, not prose — correct as-is |
| admin | `.card .mt` | admin.css:503-508 | 12px | card track ~240px | ~33ch | ✅ caption |

**Where long text runs unconstrained:** every `.hint` on `/admin/google` (google.astro:71, :77, :130, :157, :164, :187, :192, :199, :210 — nine instructional paragraphs), `/admin/rugs` (rugs/index.astro:183), `/admin/audit` (audit.astro:50), RugFields (RugFields.astro:254); every `.msg` on the dashboard (index.astro:58 settings warnings); every expanded `.crow__description` on `/admin/collections`.

`/admin/google` is the single worst case: it is the most prose-heavy screen in the product and its copy renders at 250ch on a 1920 monitor.

---

## 5. HORIZONTAL OVERFLOW AT 320px

Narrowest query anywhere is 480px (editorial.css:353, public only); admin's is 767px (admin.css:696). Admin content box at 320 = **272px**.

### Will overflow at 320 (confirmed by arithmetic against verified declarations)

| element | file:line | fixed width | available | overflow | finding |
|---|---|---|---|---|---|
| `.filterbar` row (`.filterbar__search` 280 + `.filterbar__select` 180, both `flex:none`, **no wrap**) | components.css:605, :614, :618 | ≥580px | 272 | **~308px — scrolls the page** | B-01 |
| `.grow` inside `.addform` | admin.css:133 / admin.css:232 | min 260 | 240 | 20px | B-07 |
| `.grow` inside Drawer + `.addform` | admin.css:133 / components.css:962 | min 260 | 256 | 4px | B-07 |
| `dialog` (RugFields global) | RugFields.astro:413 | max 420 | 320 viewport | **100px, position:fixed** | B-08 |
| `.rugtable__head` + `.irow__line` fixed columns (110+280+150+140+130 + 4×16 gaps + 24 pad = 898) | components.css:548, :555, :559, :563, :567, :1531 | 898px | 272 | hidden at ≤767 by components.css:1578 — **but that is why the page goes blank (B-03)** | B-03/B-17 |
| `.page-head__titles` `flex:none` with a runtime-length count string | components.css:1591-1593 | max-content | 272 | data-dependent | B-21 |

### Long unbroken strings

| content | rendered at | protection | verdict |
|---|---|---|---|
| Full customer preview URLs | clients.astro:163-166 (`<td class="mono">`) | `.table-wrap{overflow-x:auto}` (admin.css:322) desktop; `overflow-wrap:anywhere` at ≤767 (admin.css:749) | ✅ **handled** |
| ISO timestamps | audit.astro:71 (`<td class="mono">{a.timestamp}`) | `.table-wrap` scroll only — no `overflow-wrap`, no ≤767 restack | ⚠️ contained in the scroll box, contributes to its width |
| JSON payloads | audit.astro:78-82 `<pre>` | `white-space:pre-wrap` + `word-break:break-word` + `max-width:60ch` (admin.css:413-416) | ✅ **handled** |
| Drive photo ids (slug-like) | RugFields.astro:247-248 `.mt` | `word-break: break-all` (RugFields.astro:389) | ✅ **handled** |
| Rug ids / target ids | audit.astro:73-75, `.trow__id`/`.irow__id` | mono, short (`SL-021`) | ✅ |
| `GOOGLE_OAUTH_CLIENT_SECRET`-class env names | google.astro:78-80 `<span class="mono">` | none — no `overflow-wrap` on `.mono` (admin.css:399-403) | ⚠️ 26-char unbreakable token at 11px ≈ 172px, fits 272 but leaves nothing |
| Collection/rug slugs in `td input` | collections.astro:276 | `min-width: 120px` | ✅ fits |

### Does **not** overflow at 320 (verified, for the record)

`.fields` `minmax(220px,1fr)` (admin.css:204) · `.grid` `minmax(240px,1fr)` (admin.css:437) · `.stats` `minmax(160px,1fr)` (admin.css:624) · `.photos` `minmax(120px,1fr)` (RugFields.astro:380) · `.cust__grid`/`.cust__stats` (restacked to `minmax(0,1fr)` at clients/[code].astro:367, :375) · `.crow__head` (restacked at components.css:1704-1713) · `.modal` `min(520px, 100vw − 2×gutter)` (components.css:818) · `.drawer` `min(480px,100vw)` → `100vw` at ≤767 (components.css:892, :986) · `.fetch` → `100vw` at ≤767 (components.css:1036, :1126) · `.alogin` `max-width:100%` (login.astro:148) · `.shell__nav` tab bar `box-sizing:border-box; width:100%` (components.css:1193, :1330) · public grids `minmax(230/240px,1fr)` in 288px (catalogue.css:122, editorial.css:77) · preview `.pv-grid` → `1fr` at ≤767 ([slug]/index.astro:198).

---

## 6. LAYOUT SHIFT

### Every `<img>` in the repo (14 total) and its height reservation

| img | file:line | `width`/`height` attrs | ratio box / fixed height | CLS risk |
|---|---|---|---|---|
| admin product card | RugCardAdmin.astro:51 | ✗ | `.card .ph { aspect-ratio: 3/4 }` **admin.css:464** | ✅ none |
| admin photo tile | RugFields.astro:244 | ✗ | `.photos .tile .ph { aspect-ratio: 3/4 }` **RugFields.astro:386** | ✅ none |
| customer saved-rug card | clients/[code].astro:151 | ✗ | `.gcard__image { height: 300px }` **clients/[code].astro:297** | ✅ none (but fixed, see B-14) |
| customer disliked-rug card | clients/[code].astro:188 | ✗ | same | ✅ none |
| preview product card | ProductCard.astro:39-44 | ✗ | `aspect-ratio: 4/5` **ProductCard.astro:100** | ✅ none |
| preview hero | [productId].astro:137 | ✗ | `.pv-hero { min-height: 620px }` **[productId].astro:215** | ✅ band reserved |
| preview thumb | [productId].astro:157 | ✗ | `.pv-thumb { width:96px; height:120px }` **[productId].astro:239-240** | ✅ none |
| public gallery | Gallery.astro:63-67 | ✗ | `[data-ar]` → `aspect-ratio: var(--plate)` **Gallery.astro:26 / editorial.css:389** | ✅ none |
| public lightbox stage | Gallery.astro:81 | n/a (div) | `[data-ar]` **Gallery.astro:81 / editorial.css:484** | ✅ none |
| public rug photo ×3 | RugPhoto.astro:41, :56, :71 | ✗ | `[data-ar]` **RugPhoto.astro:85 / editorial.css:236** | ✅ none |
| ui/ImageGallery primary | ImageGallery.astro:21 | **✓ 520×640** | `aspect-ratio: 520/640` components.css:1152 | ✅ none — *component is unreferenced* |
| ui/ImageGallery thumb | ImageGallery.astro:34 | **✓ 72×90** | `aspect-ratio: 4/5` components.css:1166 | ✅ none — *unreferenced* |

**Only 2 of 14 `<img>` carry `width`/`height`, and both are in a component nothing imports** (`grep -rn ImageGallery src/pages src/components` → no consumers). The other 12 are saved by their ratio boxes. **Image CLS is effectively zero — the real shift is elsewhere.**

### Height depends on async data (the actual CLS source)

| element | file:line | shift |
|---|---|---|
| `#count` result line (empty `<p class="hint">`, filled by JS) | rugs/index.astro:183 | +1 line @ 11px + `margin-top:8px` (admin.css:167) ≈ **26px push on the whole table** |
| `#count` result line | audit.astro:50 | same ≈ 26px |
| `.rugtable` ⇄ `#grid` view swap | rugs/index.astro:208 + components.css:1578 | **whole-list reflow on every page load** (B-03) |
| `#empty-first` / `#empty-none` toggles | rugs/index.astro:185, :202 | a 520px `.empty` block appears/disappears |
| `.msg` blocks `display:none`→`block` | admin.css:174, :182 | each inserts a padded banner above content |
| `<td data-last-seen>—</td>` rewritten | clients.astro:174 | negligible width-only |
| `.pv-price` `hidden={!priceText}` + currency conversion | [productId].astro:169-171 | price row height appears after rates resolve |
| `.crow__description` line-clamp release | components.css:769-772 | documented as "rows below shift once, not twice" — accepted |

`scripts/qa.ts` asserts CLS < 0.02 but is invoked against the public site (`npm run qa -- --site=…`), so **none of the admin routes above are measured**.

### `[data-ar]` plate-ratio system — where it IS and IS NOT applied

Declared: **tokens.css:57-84** (7 buckets). Consumed: `aspect-ratio: var(--plate)` at **editorial.css:236, :389, :484** — public sheet only.

| realm | emits `data-ar`? | evidence |
|---|---|---|
| **public** | ✅ **yes, 4 files** | Gallery.astro:26, Gallery.astro:81, RugGrid.astro:39, RugGrid.astro:40, RugPhoto.astro:85, rugs/[slug].astro:90, rugs/[slug].astro:91 |
| **customer preview** | ❌ **zero** | hardcodes `aspect-ratio: 4/5` (ProductCard.astro:100) and `min-height: 620px` (…/[productId].astro:215) |
| **admin** | ❌ **zero** | hardcodes `aspect-ratio: 3/4` twice (admin.css:464, RugFields.astro:386) and `height: 300px` (clients/[code].astro:297) |

`grep -rn "data-ar" src/` returns 7 emitting lines, all public. See B-15.


## Rejected by verification

Raised by the auditor, refuted on re-check. Kept for the record.

| ID | Claim | Why rejected |
| --- | --- | --- |
| B-03 | `src/pages/admin/rugs/index.astro:208` The server HTML ships the card grid with the `hidden` attribute set, and `@media (max-width: 767px) { .rugtable { display: none } }` (components.css:1578) hides the row list at phone width. Which of the two is shown is decided entirely in JS by src/scripts/admin/view-switch.ts, whose own docblock states the reasoning. The page also sets `[hidden] { display: none !important }` (rugs/index.astro:259), so no stylesheet can un-hide the grid. | Every fact is right (rugs/index.astro:208, components.css:1577-1581, rugs/index.astro:258-261) but this is precisely the intended, documented design. view-switch.ts carries a 9-line docblock explaining that the choice must be made in JS because `[hidden]{display:none!important}` outranks any stylesheet, and ADR.md:1104-1110 records the regression, the fix, and the matchMedia change listener added so rotation cannot strand the catalogue; two unit tests drive an injectable matchMedia. The only residual is a no-JS admin, and the panel is JS-dependent by design (ADMIN_SPEC §8.2). Finding describes documented behaviour. |
| B-04 | `src/styles/modes.css:448` Both token-layer breakpoints — `@media (max-width: 1023px)` (modes.css:447) and `@media (max-width: 767px)` (modes.css:456) — scope their overrides with this selector plus `[data-mode='preview']` (modes.css:449, :458). Admin and admin-dark are explicitly excluded. Admin's spacing block (modes.css:364-371) and admin-dark's (modes.css:427-434) therefore hold `--gutter: var(--space-24)` and `--space-section: var(--space-24)` at every viewport width from 320px to 3840px. | Facts verified exactly (modes.css:447/448/449, :456/458, admin block 364-371, admin-dark 427-434). But the exclusion is explicit and labelled, not an oversight: the section header at modes.css:439-442 scopes the whole block to 'the handoff's responsive intent', each query is commented 'Preview at 810' / 'Preview at 390', and the admin mode block at :363 states 'spacing compresses — this is what makes the tool dense'. No concrete breakage follows either: a 24px gutter is a sane value at 320 and at 3840. Intended, documented behaviour; at most a P2 note. |
| B-07 | `src/styles/admin.css:133` `.grow { flex: 1; min-width: 260px }` (admin.css:131-134). It is used inside `.addform` (RugFields.astro:57 wraps RugFields.astro:112-113), and `.addform` carries `padding: var(--space-form)` = 16px per side in admin mode (admin.css:232, modes.css:370). `.addform` renders both full-page on /admin/rugs/new and inside a Drawer whose `.drawer__body` adds another `padding: var(--stack-lg)` = 16px per side (components.css:960-963) and which goes `width: 100%` at ≤767 (components.css:986). | Citation and usage are right (admin.css:131-134, RugFields.astro:112-113 inside .addform at :57), but the mechanism is wrong. components.css:970-974 sets `.drawer .addform { padding: 0 }` precisely so the padding does not double inside a drawer, so the drawer case is 375-32 = 343 > 260 and fits. Full-page /admin/rugs/new is 375-48-32 = 295 > 260, also fits. .row is flex-wrap:wrap (admin.css:94-99), so the field wraps rather than overflowing. Overflow only begins below a ~340px viewport, narrower than any current phone. Claim does not hold. |
| B-08 | `src/components/admin/RugFields.astro:413` A bare `dialog` element selector inside `<style is:global>` sets `padding: 20px 24px` (RugFields.astro:412) and `max-width: 420px` (RugFields.astro:413) with no `width` and no `box-sizing` reset reaching it (admin.css:5-9 sets `box-sizing: border-box` on `*`, so 420 includes the 48px padding). | Lines 408-415 match, but the claim is self-contradictory and wrong on the substance: admin.css:5-9 DOES set box-sizing:border-box on *, ::before and ::after, and it does reach this dialog (AdminLayout imports admin.css for every admin route), so nothing is unaccounted for. A dialog also inherits the UA max-width of calc(100% - 6px - 2em), so 420 cannot overflow a 375 phone. The dialog renders only when edit=true and holds one line of text plus two buttons. The only residual is a bare element selector in is:global, which is hygiene, not layout. |
| B-14 | `src/pages/admin/clients/[code].astro:280` `.cust__grid` uses fixed 240px tracks with no `1fr` and no `justify-content`, `gap: var(--stack-lg)` (16). At ≤767 it is replaced by `repeat(2, minmax(0, 1fr))` (clients/[code].astro:375). Sibling `.cust__stats > * { width: 200px }` (clients/[code].astro:249) is fixed the same way, wrapped in a plain `flex-wrap: wrap` row (clients/[code].astro:240-244). | Citation correct; one sub-citation off by one (`.cust__stats > * { width: 200px }` is at [code].astro:248, not :249 — :249 is the closing brace). The claim is refuted on substance: both fixed sizes are the drawn design and are commented as such — ':240-wide cards, gap 16, wrapping (52:1292)' at :278 and '200 is the drawn width (52:1265)' at :245-246 — and the identical idiom on the customer grid is documented as deliberate ('the design is explicit that the cards do not flex', index.astro:167-170). Both also have real ≤767 overrides ([code].astro:370-377). Intended, documented behaviour. |
| B-15 | `src/styles/tokens.css:57` The plate-ratio system (tokens.css:57-84, seven buckets driving `--plate` and `--plate-n`) is consumed by `aspect-ratio: var(--plate)` at editorial.css:236, :389 and :484 only. `grep -rn "data-ar" src/` returns exactly four emitting files, all public: Gallery.astro:26 and :81, RugGrid.astro:39-40, RugPhoto.astro:85, and rugs/[slug].astro:90-91. ZERO occurrences in src/components/admin/, src/components/customer/, src/pages/admin/ or src/pages/[slug]/. | Every fact verified: tokens.css:57-84 holds the seven buckets, var(--plate)/var(--plate-n) is consumed only by editorial.css (235-236, 259-260, 387-389, 483-484), and data-ar is emitted only by Gallery.astro:26/:81, RugGrid.astro:39-40, RugPhoto.astro:85 and rugs/[slug].astro:90-91. But no defect follows: the plate system belongs to the public editorial realm, and the other two realms carry their own drawn ratios (ProductCard.astro:100 4/5, components.css:269/:1152/:1166, admin.css:464 and RugFields.astro:386 3/4). Realms differing deliberately is not a finding. |
| B-17 | `src/styles/components.css:1198` `.shell__nav { flex: none; width: 220px }` with `padding: var(--space-inline)` = 8px in admin (components.css:1199, modes.css:367) and a 1px right border (components.css:1200). It becomes a 76px fixed bottom bar only at ≤767 (components.css:1324-1336). | Every cited value is exact (components.css:1192-1201, --space-inline = 8 in admin per modes.css:367, bottom-bar conversion at 1324-1336), but the finding states no defect — and 220px is the drawn, documented nav width: AppShell.astro:2 'Figma 25:200. The admin chrome: 220px nav, topbar, content' and :17-18 documents the 390 bottom bar as the intended single breakpoint. A fixed-width rail with one collapse point is standard and here it is specified. Nothing to fix. |
| B-19 | `src/styles/modes.css:140` Three off-grid spacing primitives are declared deliberately (modes.css:140 10.4px, modes.css:141 12.8px, modes.css:142 10px) and aliased mode-invariantly as `--control-y`, `--input-y`, `--input-x`, `--control-gap` (modes.css:298-301). Four more off-grid primitives sit in the iOS and control groups: `--ios-home-indicator: 34px` (modes.css:149), `--ios-tab-bar-y: 10px` (modes.css:150), `--size-checkbox: 14px` (modes.css:154), `--size-container-md: 1150px` (modes.css:158). | Values verified (modes.css:140-142, :149, :150, :154, :158); the alias range is off by one — --control-y/--input-y/--input-x/--control-gap are at :299-302, not :298-301. Refuted because the finding documents its own refutation: every one of these is commented as a deliberate carry. modes.css:137-139 'Carried, never rounded: rounding input-y to 12 would make every input 3.2px taller than the storefront's and break the visual match on the preview'; :144-147 'NO PRESTIGE SOURCE... Snapping them to 4pt would be a lie dressed as consistency'; :154 and :158 'OFF 4pt GRID — carried, not rounded'. Intended, documented behaviour. |
| B-22 | `src/styles/editorial.css:353` The narrowest breakpoint anywhere in the repo. Public steps at 480/700/899/900 (editorial.css:80, :317, :353, :368, :375, :661); catalogue.css contains zero media queries and uses `5vw` inline padding on every band (catalogue.css:17, :118, :241). No public rule addresses widths below 480. | Facts check out — editorial.css queries at 80 (min-700), 317, 353, 368, 375 (min-900 + min-height), 661, plus 692 pointer:coarse; catalogue.css has zero @media and uses 5vw at :17, :88, :118, :233, :241. But the conclusion is wrong: a `max-width: 480px` query applies at every width BELOW 480, so widths under 480 are addressed — by that query, by modes.css's ≤767 token block, and by catalogue.css's viewport-relative padding, which is fluid by construction and needs no breakpoint. 'The narrowest breakpoint in the repo' is an observation, not a defect. |
