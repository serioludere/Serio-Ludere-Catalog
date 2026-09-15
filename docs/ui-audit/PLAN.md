# PLAN — Gate 1

**Date** 2026-09-15 · **Status** awaiting approval · **No UI code has been written.**

Phase 1 produced 129 verified findings across six dimensions. 21 further findings were raised and then
**refuted** on re-check and are recorded at the foot of each dimension file rather than deleted.

| Dimension | File | P0 | P1 | P2 | Kept | Refuted |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| A · Visual primitives | [01-tokens.md](01-tokens.md) | 0 | 0 | 22 | 22 | 1 |
| B · Layout & responsive | [02-layout.md](02-layout.md) | 1 | 2 | 10 | 13 | 9 |
| C · Component inventory | [03-components.md](03-components.md) | 0 | 0 | 17 | 17 | 1 |
| D · Navigation & IA | [04-navigation.md](04-navigation.md) | 1 | 3 | 18 | 22 | 2 |
| E · Forms | [05-forms.md](05-forms.md) | 2 | 1 | 19 | 22 | 3 |
| F · A11y & performance | [06-a11y-perf.md](06-a11y-perf.md) | 2 | 2 | 29 | 33 | 5 |
| **Total** | | **6** | **8** | **115** | **129** | **21** |

### Severity re-grade — disclosed

The verification pass returned **zero P0** across all 129 findings. I re-examined its calibration against
its own definition (*"P0 = actively broken or inaccessible for real users"*) and **re-graded six finding
IDs from P1 to P0** — B-01, F-28, E-04, F-23, E-03, D-07 — each after reading the code myself. E-03 and
D-07 are the same defect cross-listed in two dimensions, so those six IDs are **five distinct defects**.
The other 123 findings keep the verifier's grade.

**I did not re-grade the dark-mode contrast failures**, though §1⑤ ranks them fifth by harm. Nothing sets
`data-mode="admin-dark"` today, so they injure no current user and P2 is defensible. They become P0 the
moment the toggle in batch 4 ships, which is exactly why batch 4 carries them.

---

## 1 · The five problems actually damaging the experience

Ranked by harm done, not by ease of fix.

### ① `/admin/rugs` fails WCAG 2.2 AA Reflow (1.4.10) — and it is the main work surface

`.irow__*` columns are `flex: none` at fixed widths — 110 + 280 + 150 + 140 + 130 = **810px minimum**
(`src/styles/components.css:546-570`), inside a `.rugtable` with no `overflow-x`
(`src/styles/components.css:1522`). Add the 221px nav rail and 48px gutters and the page needs ~1090px.

Below that the **document** scrolls sideways, not the table — so the nav rail and page header scroll away
with it. **1920px at 200% zoom is 960 CSS px and lands squarely in the failing band.** So does a 1280px
laptop at 125%. The same defect hits `.filterbar` (`src/styles/components.css:605`), whose children are
also `flex: none` (280px + 180px + two 36px buttons = 580px floor), giving horizontal overflow at *every*
width under ~628px.

→ **F-28, B-01.** P0. Reflow is a conformance failure, not a preference.

### ② Every status message in admin is silent to assistive technology

`msg()` (`src/scripts/admin/msg.ts:7-13`) does three things in the wrong order: it inserts content, *then*
adds the `on` class, *then* sets `role`. The element is `display: none` until `on` arrives
(`src/styles/admin.css:174-183`) — so at the instant content is inserted the node is **not in the
accessibility tree at all**, and the role lands after the mutation a live region exists to announce.

Screen readers announce nothing. This is the single feedback channel for every save, error, retry and
scrape result in the admin.

→ **E-04.** P0. WCAG 4.1.3 Status Messages (AA).

### ③ The Products table exposes zero rows to screen readers

`src/components/admin/RugTable.astro:22` declares `role="table"`; its header div carries `role="row"` and
five `role="columnheader"` spans. But `RugRow.astro`'s root (`class="irow"`, `src/components/admin/RugRow.astro:41`)
carries **no role at all** — `grep -n 'role=' src/components/admin/RugRow.astro` returns nothing.

An ARIA `table` owns `row` and `rowgroup`. A roleless `div` is not a row, so the catalogue is announced as
a table containing one header row and no data — whether it holds 4 products or 400. Table navigation mode
is dead.

→ **F-23.** P0. WCAG 1.3.1 Info and Relationships (A). The irony: this markup exists *because* someone
reached for ARIA. A real `<table>` would have been correct for free.

### ④ Resetting a client password silently discards it

`src/pages/admin/clients.astro:236` opens `<form method="dialog">` containing exactly one text input
(`:242`) and **no submit button** — both buttons are `type="button"` (`:251-252`).

HTML implicit submission fires when a form has no submit button and exactly one field that blocks it.
So typing a new password and pressing **Enter** submits the `method="dialog"` form, which closes the
dialog with an empty `returnValue` and never runs the confirm handler. The password is discarded with no
error. Enter is the expected key in a one-field dialog.

→ **E-03 / D-07.** P0. A functional defect in a credential flow.

### ⑤ Admin dark mode has nine contrast failures, not the two it documents

`src/styles/modes.css:405-409` names success and danger at 3.18:1 and blocks the mode on them. That figure
is exactly right — and incomplete. Independently computed (method and workings in
[06-a11y-perf.md](06-a11y-perf.md) Table 3):

| Token | Ground | Ratio | Needs | |
| --- | --- | ---: | ---: | --- |
| `--success` #307a07 | surface / raised | 3.18 / 1.96 | 4.5 | documented |
| `--danger` #cb2b2b | surface / raised | 3.18 / 1.97 | 4.5 | documented |
| `--ink-muted` #8c8b84 | raised, subtle | 3.08 | 4.5 | **missed** |
| `--warning` #ed8a00 | raised, subtle | 4.13 | 4.5 | **missed** |
| `--brand` / `--accent` #b80d09 | all grounds | 2.72 / 2.52 / 1.55 | 4.5 | **missed** |
| `--text-on-action` #000000 | on `--action-primary-hover` | 3.10 | 4.5 | **missed** |
| `--text-on-action` #000000 | on `--action-primary-active` | 2.46 | 4.5 | **missed** |
| `--rule` #403f3c | on raised, subtle | **1.00** | — | **missed** |

`--rule` resolving identical to the surface it divides is the notable one: the hairline is not
low-contrast, it is **invisible**. See §3 for why the root cause is `--surface-raised`, and for the
decision I need from you.

→ **F-01…F-06.** P0 for the mode as shipped — which is precisely why it is currently dormant.

---

### Runners-up, for the record

| | Finding | Why it nearly made the list |
| --- | --- | --- |
| ⑥ | **F-31** — every thumbnail on the customer detail page is fetched at `w=1600` (`src/lib/view.ts:146`) to paint a 96×120 box | ~16× the needed pixels, ×5 thumbs, on a buyer-facing page that is never cached. The worst pure-performance defect found. **Customer realm — findings-only.** |
| ⑦ | **D-01** — below 767px, `.shell__brand` and `.shell__link--secondary` are hidden (`src/styles/components.css:1337`, `:1359`), removing the only links to `/admin`, `/admin/audit` and `/admin/google` with no replacement | Google is where a broken Drive connection is repaired, and a phone is where you discover it is broken. `AppShell.astro:12` explicitly warns that dropping these "would strand them". |
| ⑧ | **E-02** — only 2 of ~18 admin submit paths work without JavaScript, and both are login | A project whose stated identity is zero islands and progressive enhancement. The 27-control rug form is a bare `<div>`. |
| ⑨ | **D-03** — the only sign-out control in admin is a 16×16 icon button (`src/styles/components.css:1257-1260`, default `size=16` at `src/components/ui/Icon.astro:40`) | 13% of the 44×44 minimum, unchanged on mobile. |

---

## 2 · Findings consolidated by severity

Full detail, with `path:line` evidence and a proposed fix per finding, lives in the six dimension files.
Every citation in those files was re-checked with `sed -n` against the file before being written.

**P0 (6 IDs, 5 distinct defects)** — F-28 + B-01 (reflow / horizontal overflow) · E-04 (live region) ·
F-23 (ARIA table) · E-03 + D-07 (dialog Enter, cross-listed).

**P1 (8)** — B-02 (customer detail overflows 768–1100px) · B-10 (`.fields` grid reaches 7 columns at
1920px, `src/styles/admin.css:204`) · D-01, D-03, D-15 (mobile nav, logout target, public pager at
8×35px) · E-02 (no-JS) · F-31 (thumbnail weight) · F-16 (two of three public routes have no `<h1>`).

**P2 (115)** — dominated by three themes:
- **~40** hardcoded values that should be tokens (dimension A), concentrated in `admin.css` and scoped blocks.
- **~35** missing component states — the state matrix in [03-components.md](03-components.md) marks every
  gap; `focus-visible`, `disabled`, `loading` and `empty` are the most frequently absent.
- **9** dark-mode contrast failures (F-01…F-06) — P2 only because the mode is dormant; see the re-grade note above.
- **~25** off-4pt-grid spacing values in admin. Note the token layer's own off-grid values
  (`--input-y: 10.4px`, `--input-x: 12.8px`) are **deliberate**, carried from the Figma handoff and
  explicitly flagged "off-grid, carried not rounded" — they are not defects and must not be "corrected".

---

## 3 · Proposed token system — concrete values

### What already exists, and is good

The semantic tier is **already built and machine-enforced**: `src/styles/modes.css` defines primitives at
`:root` (`:21`, marked *"Never read these from a component"*) and 63 semantic tokens across three modes,
pinned value-by-value in `tests/unit/styles/token-cascade.test.ts`. Its a11y deviations from the Figma
handoff are documented with measured ratios.

**I am not rebuilding this.** Phase 2 as briefed ("implement the token layer") is largely already done.
What follows is only what is genuinely missing.

### 3.1 Resolve the `tokens.css` / `modes.css` duplication — P1

`src/styles/tokens.css:1` says *"Do not edit values"*, but `modes.css` loads after it in all three layouts
and shadows most of them. `--mono` is the clearest casualty: `tokens.css:11` names JetBrains Mono,
`modes.css:93` and `:248` override to IBM Plex Mono, and no layout ever loads JetBrains Mono.

**Proposal:** keep `tokens.css` as the byte-parity record for the public catalogue *only* (it is cited by
`catalogue.css`), and annotate every property in it that never wins with a one-line comment naming the
`modes.css` line that beats it. No value changes. This makes the freeze honest instead of misleading.

### 3.2 Add the missing third tier — component tokens (admin only)

Tier 3 does not exist. Components currently read semantic tokens directly, which is why every variant
needs a new rule rather than a new value. Proposed, in `admin.css`, consuming semantic tokens only:

```
--table-row-h, --table-cell-x, --table-head-bg, --table-row-hover-bg, --table-rule
--field-h, --field-x, --field-border, --field-border-focus, --field-invalid
--btn-h, --btn-x, --btn-bg, --btn-fg, --btn-bg-hover, --btn-bg-active
--dialog-w, --dialog-pad, --dialog-backdrop
```

### 3.3 Add a z-index scale — currently absent entirely

No scale exists; `<dialog>`, `::backdrop`, the drawer, the progress bar and sticky headers coexist on ad-hoc
values. Proposed:

```
--z-base: 0;  --z-sticky: 100;  --z-drawer: 200;  --z-dialog: 300;  --z-toast: 400;
```

### 3.4 Add breakpoint tokens and 320px support

Per your decision, admin + preview + `components.css` unify on the token steps; `editorial.css` keeps
480/700/899/900 untouched. Custom properties cannot be used in `@media` conditions, so these are
documentation constants plus a container scale that *is* usable:

```
/* breakpoints (documentation — @media cannot read custom properties) */
--bp-sm: 320px;  --bp-md: 768px;  --bp-lg: 1024px;  --bp-xl: 1440px;
```

`320px` support is currently absent everywhere: the narrowest query in the build is 480px, and admin's is
767px.

### 3.5 Dark mode — a decision I need from you

The nine failures in §1⑤ share one root cause: **`--surface-raised` is `#403f3c` in dark mode**, inherited
from the light-mode neutral ramp. It is far too light for a dark canvas, and it is also the value of
`--subtle` and `--rule` — which is why the hairline vanishes.

Fixing only the hues does not work, because `.modal`, `.fetch`, `.credential` and `.msel__panel` all fill
with `--surface-raised` (`src/styles/components.css:823`, `:1042`, `:1440`, `:1816`) and *do* render status
text. I solved for both constraints:

| | Option A — elevation by border | Option B — keep the lighter fill |
| --- | --- | --- |
| `--surface-raised` | `#1c1c1c` (= surface) + 1px `--border-strong` edge | `#2a2a2a` |
| `--success` | `#5b963b` | `#74a659` |
| `--danger` | `#d96262` | `#dc7171` |
| `--ink-muted` | `#afaea9` | `#afaea9` |
| `--rule` | `#3a3936` (separated from surface-raised) | `#3a3936` |
| Feedback contrast | 4.76–5.15 on every ground | 4.54–5.02 on every ground |
| Raised panel legibility | carried by a visible 1px edge | **1.19:1** against surface — barely perceptible |
| Hue fidelity | holds saturation; reads as success/danger | 33% white-mix; `#dc7171` reads pink |

**Recommendation: Option A.** Carrying elevation on a border rather than a lighter fill is standard in dark
UI, it keeps the feedback hues saturated enough to still *mean* success and danger, and it fixes `--rule`
as a side effect. Option B forces a choice between pastel feedback colours and an invisible raised panel.

Either way `--text-on-action` must be overridden inside the dark block — it currently inherits `#000000`
onto red buttons at 3.10 and 2.46.

---

## 4 · Sequenced fix plan

Admin-only for code changes, per your scope decision. Each batch is independently reviewable and
independently revertible. **Blast radius is stated per batch and was verified by grepping for every
consumer of each selector touched.**

| # | Batch | Addresses | Files | Blast radius | Risk |
| --- | --- | --- | --- | --- | --- |
| **1** | **Correctness P0s** — reorder `msg()` so role and visibility precede content; give `RugRow` `role="row"` and its cells `role="cell"`; add a real submit button to the password dialog | E-04, F-23, E-03/D-07 | `src/scripts/admin/msg.ts`, `src/components/admin/RugRow.astro`, `src/pages/admin/clients.astro` | **admin only.** `msg.ts` is imported by 9 admin scripts and nothing else; `RugRow` by `RugTable` only | Low. No visual change. |
| **2** | **Reflow P0** — `overflow-x: auto` on `.rugtable` with a focusable scroll container; `flex-wrap` + `flex: 1 1 <basis>` on `.filterbar` children below 768 | F-28, B-01 | `src/styles/components.css` | `.rugtable*`/`.irow__*`/`.filterbar*` are rendered **only** by `RugTable`/`FilterBar`, imported only by `src/pages/admin/rugs/index.astro`. Public and customer render zero such nodes — verified by grep | Low-Med. Shared file, admin-only selectors. |
| **3** | **Token tiers** — annotate shadowed `tokens.css` properties; add component tier, z-index scale, breakpoint constants; cap `.fields` and `.shell__content` | §3.1–3.4, B-10 | `src/styles/tokens.css` (comments only), `src/styles/admin.css` | admin; `tokens.css` edits are comments, zero computed change | Low. `token-cascade.test.ts` must stay green. |
| **4** | **Dark mode** — apply the chosen option, override `--text-on-action`, add the toggle | §3.5, F-01…F-06 | `src/styles/modes.css`, `AdminLayout.astro`, one small script | admin only (`[data-mode='admin-dark']` block). **Updates `token-cascade.test.ts` EXPECTED — by design** | Med. Needs contrast re-verification of all three modes. |
| **5** | **Component states** — `focus-visible`, `disabled`, `loading`, `empty` across `src/components/ui/*` per the state matrix | ~35 P2s | `src/components/ui/*`, `src/styles/components.css` | `ui/*` is **admin-only** — confirmed: no public or customer page imports it | Med. Largest batch; split if review is slow. |
| **6** | **Nav & targets** — restore mobile access to `/admin`, `/admin/audit`, `/admin/google`; bring logout and row actions to 44×44 | D-01, D-03 | `src/styles/components.css`, `AppShell.astro` | admin (`.shell__*` rendered only by `AppShell`, imported only by `AdminLayout`) | Med. No JS drawer — CSS-only or a link to the dashboard. |
| **7** | **Motion** — collapse ten reduced-motion implementations into one global block | F-table-4, D5 | all six sheets | **all three realms.** Behaviour-preserving, but must be verified against the locked surfaces | Med-High. Touches locked realms — do last, verify with `npm run qa`. |
| **8** | **Forms** — real `<label>`s, `autocomplete`, `inputmode`, error placement; native `<form action>` where the endpoint already exists | ~19 P2s, E-02 | `src/components/ui/Input.astro`, `RugFields.astro`, admin pages | admin | Med. Full no-JS parity is a larger project — see §5. |

**Gate after each batch:** `npm run build` (runs `astro check`), `npm test`, and for batches 2, 4, 6, 7
a built run plus `npm run qa`, since **CSP and the route cache are inert in `astro dev`**.

Batches 1–2 are the ones I would ship first regardless of what else is approved.

---

## 5 · Things I think are wrong that you did not ask about

1. **`RugTable` should be a real `<table>`.** The ARIA scaffolding at `src/components/admin/RugTable.astro:22`
   reimplements, incorrectly, what HTML gives for free. Fixing the roles (batch 1) makes it conformant;
   replacing the divs with `<table><thead><tbody>` would make it *correct*, and delete the ARIA entirely.
   Larger diff, better outcome. **Your call — I have planned the conformant fix, not the rewrite.**

2. **No-JS parity is claimed more than it is practised.** Only 2 of ~18 admin submit paths work without
   JavaScript, and both are login (`src/pages/admin/login.astro:115`, `PreviewGate.astro:33`). The API
   endpoints already exist and accept POST; most forms could be native `<form action method>` progressively
   enhanced. That is a genuine project, not a batch — flagging it, not scheduling it.

3. **Admin renders raw ISO timestamps next to friendly ones** — `2026-09-09T10:58:18.519Z` in *Created*
   beside `Sep 9, 11:31 AM` in *Last seen*, in the same table. Formatting is presentation, so it is mine to
   fix; the inconsistency reads as unfinished. **FLAG — confirm before I touch it**, as it borders on content.

4. **Tag names are inconsistently capitalised** in the customer filter rail — `Kilim`, `Denizli`,
   `Plant Dyes`, `hand-spun wool`, `modern`, `natural dyes`, `Antique`, `boho`. These come from the Google
   Sheet, so this is **content, and Rule 1 says flag not act**. It is visible on every buyer's screen.

5. **`public/` does not exist**, yet `/favicon.ico`, `/robots.txt`, `/sitemap.xml` and `/assets` are
   allowlisted at `src/lib/customer/gate.ts:35-38`. All four 404 today. There is nowhere to put a favicon
   or an OG image.

6. **There is no `404.astro`.** Gate rejections return bare `text/plain` with no stylesheet. Three unstyled
   error surfaces on a site this considered is a conspicuous gap.

7. **The working tree is dirty** — 19 modified files and one staged deletion, including four audited
   stylesheets, `scripts/qa.ts` and `token-cascade.test.ts`. I audited the working tree, not `HEAD`.
   **I would rather this were committed or stashed before Phase 2**, so the batches above produce reviewable
   diffs instead of tangling with work already in flight.

---

## 6 · What I need from you

1. **Approve or amend the batch sequence** in §4. Nothing is written until you do.
2. **Choose Option A or Option B** for dark mode (§3.5). A is my recommendation.
3. **`RugTable`: conformant fix or real `<table>`** (§5.1).
4. **Confirm the dirty tree** (§5.7) — commit, stash, or proceed on top of it.
5. **Item 3 in §5** (timestamp formatting) — confirm it is mine to fix, or I leave it.
