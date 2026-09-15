# 00 · Recon — read-only

**Date** 2026-09-15 · **Scope** detection only, zero modifications · **Phase** 0 of the UI/UX overhaul.

## Method and confidence

Six parallel readers covered one facet each; a seventh re-verified a sample of their citations against
the files. That audit failed 15 of 46 sampled citations — every `catalogue.css` and `editorial.css`
line number was off by 1–3, and five `package.json` citations pointed at the wrong dependency.

**Every `path:line` below was therefore re-derived mechanically (`grep -n`) rather than taken from an
agent.** Claims that could not be re-verified are listed under §11 as UNVERIFIED rather than stated.

---

## 1. Framework, adapter, rendering

| Thing | Value | Cited |
| --- | --- | --- |
| `astro` | `7.3.1` (exact pin) | `package.json:34` |
| `@astrojs/node` | `11.1.5`, standalone, `bodySizeLimit: 65536` | `package.json:33`, `astro.config.mjs:53-57` |
| `integrations:` | **key absent entirely** — no MDX, sitemap, Tailwind, or UI framework | `astro.config.mjs:51-156` |
| `output` | `server` — on-demand by default | `astro.config.mjs:52` |
| `compressHTML` | `true`, overriding Astro 7's `jsx` default, to preserve pixel parity with `reference/catalogue.html` | `astro.config.mjs:58-60` |
| `session` | `false` | `astro.config.mjs:61` |
| `cache.provider` | `memoryCache` with all query params dropped from the key | `astro.config.mjs:62-67` |
| `image.domains` | `[]` deliberately; `/_image` refuses remote hrefs | `astro.config.mjs:152-155` |

**Rendering strategy.** 16 page routes + 33 API routes. Every one declares `export const prerender = false`
explicitly (redundant under server output). **`getStaticPaths` is used zero times** — every dynamic
segment resolves per request. Nothing in this project is statically rendered.

| Realm | Routes | Cached | Gate |
| --- | --- | --- | --- |
| Public catalogue | `/`, `/rugs/[slug]`, `/tags/[slug]` | 60s + SWR, tagged `sheet`; disabled on 503/404 | open while `PUBLIC_CATALOGUE` (default true, `astro.config.mjs:117`) |
| Customer preview | `/[slug]`, `/[slug]/[productId]` | **never** — cache disabled + `no-store` | password gate; middleware default-denies |
| Admin | 11 routes under `/admin/*` | **never** — `src/lib/admin/gate.ts:82` | session or 303 to login; 404 when unconfigured |

**Middleware** is `sequence(securityHeaders, admin, customer)` (`src/middleware.ts:42`) — customer last
because it default-denies. It sets `nosniff`, `referrer-policy: same-origin` and `x-frame-options: DENY`
on every response (`src/middleware.ts:15-17`).

### The CSP constraint — the hardest limit on UI work

`security.csp` is hash-based (`astro.config.mjs:138-150`). Consequences for any UI change:

| Forbidden | Why |
| --- | --- |
| `style="…"` attributes | no unsafe-inline in the style directive |
| `define:vars` | compiles to an inline style/script |
| new hand-written inline `<script>` | only `src/scripts/prepaint.js` is hashed (`astro.config.mjs:12`, `astro.config.mjs:47-49`) |
| `<ClientRouter />` and `transition:*` | Astro's transition styles ship unhashed |

Per-element variation must go through `data-*` attributes, JS-added classes, or CSSOM writes
(`el.style.setProperty(...)`). **CSP is inert in `astro dev`** — a violation only appears in a built
run, so verification requires `npm run build && npm start`.

---

## 2. Styling system

No Tailwind, no CSS modules, no SCSS, no PostCSS config. Plain CSS in ten global sheets plus 23 `.astro`
files carrying scoped `<style>` blocks. Tailwind was considered and **deliberately rejected** — under the
hash-based CSP the play CDN is unusable (`docs/BRIEF_GAP.md`, "Not done, deliberately: Tailwind").

### Cascade order per realm — later import wins

| Realm | Order | Cited |
| --- | --- | --- |
| Public | tokens → modes → controls → components → motion-spec → **catalogue → editorial → motion** | `src/components/Layout.astro:8-15` |
| Customer | tokens → modes → controls → components → motion-spec → **preview** | `src/components/customer/PreviewLayout.astro:13-18` |
| Admin | tokens → modes → controls → components → motion-spec → **admin** | `src/components/admin/AdminLayout.astro:14-19` |

Five sheets are shared by all three realms. **A change to `components.css` or `controls.css` lands in
every realm simultaneously**, including the two that are fidelity-locked (§9).

### `!important` — 11 declarations

`display: none !important` is duplicated in six places: `src/styles/admin.css:18`,
`src/components/admin/RugFields.astro:348`, `src/pages/admin/audit.astro:102`,
`src/pages/admin/clients.astro:280`, `src/pages/admin/collections.astro:265`,
`src/pages/admin/rugs/index.astro:260`. The remaining five are reduced-motion overrides
(`src/styles/admin.css:679-680`, `src/styles/preview.css:365-367`).

---

## 3. Breakpoints — two incompatible systems

The largest structural finding in recon. Widths, verified exhaustively:

| Width | Occurrences | Owner |
| --- | --- | --- |
| `767px` | 21 | token layer + preview + admin + components |
| `1023px` | 1 | token layer (`src/styles/modes.css:447`) |
| `899px` / `900px` | 2 / 2 | **`editorial.css` only** |
| `700px` | 2 | **`editorial.css` only** |
| `480px` | 1 | **`editorial.css` only** |

- The **token system** steps at 1023 and 767 (`src/styles/modes.css:447`, `src/styles/modes.css:456`).
- The **public catalogue's design pass** ignores both and steps at 480, 700, 899/900
  (`src/styles/editorial.css:80`, `:317`, `:353`, `:368`, `:375`, `:661`), including one compound
  `min-width: 900px and (min-height: 680px)` at `src/styles/editorial.css:375`.
- `src/styles/catalogue.css` contains **zero** media queries — the byte-parity record of the reference
  page is not responsive; all of its responsiveness is added by `editorial.css`.

Four different "mobile" thresholds (480 / 700 / 767 / 899) are in force depending on which sheet wins.

---

## 4. Islands and hydration

| Question | Answer | Evidence |
| --- | --- | --- |
| `client:*` directives | **zero** | `grep -rn "client:load\|client:idle\|client:visible\|client:media\|client:only" src/` → no matches |
| React/Vue/Svelte/Solid/Preact | **none** in deps or config | `package.json:32-57`, `astro.config.mjs:51-156` |
| Content collections | **none** — `astro:content` never imported | `grep -rn "astro:content" src/` → no matches |

There are no islands to audit. Client behaviour is 32 plain modules under `src/scripts/`, loaded by
bundled `<script>` tags. GSAP **is** used, but only on the public catalogue and only via dynamic import
for tab transitions (`src/scripts/tabs.ts:45-48`) — it is not in the initial bundle.

The baseline to preserve in Phase 5 is therefore **zero hydrated components**; the metric is bundle
count and weight, not island count.

---

## 5. Tokens and theming

Two sheets define tokens, and the second overrides the first.

| Sheet | Role | Reality |
| --- | --- | --- |
| `src/styles/tokens.css` | 8 palette values from `reference/catalogue.html`, marked *"Do not edit values"* (`src/styles/tokens.css:1`), plus ~25 additive tokens from the Folio pass | **values largely shadowed** by `modes.css`, which loads after it in all three layouts |
| `src/styles/modes.css` | three-tier system: primitives → semantic → per-mode | the live source of truth |

`modes.css` is already a genuine three-tier architecture: primitives at `:root` (`src/styles/modes.css:21`)
marked **"Never read these from a component"** (`src/styles/modes.css:19`), then semantic aliases per mode.

### Modes

| Selector | Realm | Cited |
| --- | --- | --- |
| `:root, [data-mode=preview]` | public catalogue **and** customer preview | `src/styles/modes.css:192-193` |
| `[data-mode=admin]` | admin | `src/styles/modes.css:348` |
| `[data-mode=admin-dark]` | admin dark — **dormant by design** | `src/styles/modes.css:381`, `:490` |

**Coupling warning.** `src/components/Layout.astro:33` (public) and
`src/components/customer/PreviewLayout.astro:32` (customer) both emit `data-mode="preview"`. Because
`src/styles/modes.css:192-193` binds `:root` and the preview attribute in one rule, **every preview-token
edit moves the public catalogue too**, and vice versa. The two realms cannot be retokenised
independently without first splitting that selector.

### Dark mode

It exists in CSS and is deliberately unreachable. Nothing sets `data-mode="admin-dark"`; the sheet says
why: *"success and danger are 3.18:1 on surface today, which is why nothing should set
data-mode=admin-dark until they exist"* (`src/styles/modes.css:405-409`). Dark mode is blocked on a
known contrast failure, not on effort. No `prefers-color-scheme` query exists anywhere in `src/`.

`prefers-contrast` and `forced-colors` are handled **nowhere** (grep over `src/` → no matches).

### The resolved scale already exists

`tests/unit/styles/token-cascade.test.ts` (368 lines) pins **63 semantic tokens × 3 modes** of exact
resolved values as its `EXPECTED` fixture. That fixture is the design system, written down and machine-
enforced. Any token change must update it or the suite fails.

---

## 6. View Transitions, i18n, images, fonts

| Item | Finding |
| --- | --- |
| **View Transitions** | `<ClientRouter />`, `<ViewTransitions />` and every `transition:*` directive: **zero occurrences** in `src/`. Dropped as CSP-infeasible (`docs/DESIGN.md`). A hand-rolled equivalent lives in `src/scripts/transitions.ts` + `src/scripts/prepaint.js`, driving `view-transition-name` via `el.style.setProperty(...)`, which is CSP-legal. |
| **i18n** | No `i18n` key in `astro.config.mjs`. All three layouts hardcode `lang="en"`. No hreflang, no switcher. RTL/Arabic is a known unbuilt brief item (`docs/BRIEF_GAP.md`, "not drawn"). User-facing localisation is limited to currency (`src/lib/currency.ts`, `src/lib/rates.ts`) and cm/ft units (`src/lib/units.ts`). |
| **Images** | `astro:assets` is used **zero** times; no `<Image>` or `<Picture>`. All 14 raw `<img>` (public 5 / customer 3 / admin 6) are served through `/api/image/[fileId]` (ADR D6). `image.domains: []` makes the built-in optimiser unusable for remote rug photos by design. |
| **Fonts** | Google Fonts `<link>`, `display=swap`, no self-hosting, no preload. **Weights differ per realm** — see defect D2. |
| **`public/`** | **Does not exist.** `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/assets` are allowlisted in `src/lib/customer/gate.ts:35-38` but all four currently 404. |
| **404 page** | `src/pages/404.astro` does not exist. Gate 404s return bare `text/plain` with no stylesheet. |

---

## 7. Verified defects found during recon

Not an audit — these surfaced while confirming citations, and each is re-verified.

| ID | Sev | Defect | Evidence |
| --- | --- | --- | --- |
| **D1** | P1 | `--mono` resolves to **IBM Plex Mono** (`src/styles/modes.css:93`, `:248`), but `PreviewLayout.astro:40` loads Inter only. `ProductCard.astro:142` and `src/pages/[slug]/[productId].astro:342` render `var(--mono)` on customer-facing pages → falls back to system mono. Public and admin load it correctly. | cited |
| **D2** | P2 | Font weights differ by realm: preview requests `400;700`, public and admin request `400;500;600;700`. Any 500/600 rule in a shared sheet synthesises in the preview realm. | `PreviewLayout.astro:40` vs `Layout.astro:41` |
| **D3** | P2 | `src/styles/tokens.css:11` declares JetBrains Mono. No layout ever loads it and `modes.css:248` shadows it. The token is dead. | cited |
| **D4** | P2 | Four allowlisted static paths 404 because `public/` does not exist. | `src/lib/customer/gate.ts:35-38` |
| **D5** | P2 | Reduced-motion is implemented **nine separate times** across six sheets with three different strategies, rather than once globally. | `admin.css:675`, `preview.css:363`, `motion-spec.css:175`, `motion.css:286`, `:321`, `components.css:1025`, `:1114`, `:1830`, `:1989`, `controls.css:158` |

---

## 8. Working-tree state at recon time

**The tree is dirty.** 19 modified files, one staged deletion
(`src/components/customer/Gate.astro`), 372 insertions — including four of the stylesheets under audit
(`modes.css`, `admin.css`, `controls.css`, `preview.css`), the QA harness (`scripts/qa.ts`) and the token
contract test (`token-cascade.test.ts`). Findings describe the working tree, not `HEAD`.

---

## 9. The constraint map

| Realm | Design source of truth | Latitude |
| --- | --- | --- |
| Public catalogue | `reference/catalogue.html` byte-parity record in `catalogue.css`; sanctioned design layer is `editorial.css` (`docs/DESIGN.md`, ADR D18) | **Low** |
| Customer preview | Figma `Zzv9aXvSad5NTZc9rFRFxx` → "05 · Customer Preview"; 52-finding fidelity audit closed 2026-09-14 (`docs/PREVIEW_FIDELITY.md`); guarded by `tests/integration/preview-header.test.ts` | **Low** |
| Admin | **none — "the admin's visual design is still not drawn anywhere"** (`docs/BRIEF_GAP.md`); the §6 IA rework is listed as still unbuilt | **High** |

Shared sheets (`components.css`, `controls.css`, `modes.css`) cut across all three, so "low latitude"
is not "no work" — it constrains *how*, not *whether*.

---

## 10. Verification loop

`npm run build` (runs `astro check` first) · `npm start` · `npm run qa -- --site=http://127.0.0.1:4321`
(Playwright: CSP violations, console errors, CLS < 0.02, cache MISS→HIT, no inline styles, reduced-motion
path, keyboard reach) · `npm test` (125 test files). CSP and the route cache are **only** observable in a
built run.

No automated contrast or a11y assertion exists anywhere in the suite — the only style test is
`tests/unit/styles/token-cascade.test.ts`.

---

## 11. UNVERIFIED

- **CSP delivery — answered, and the answer is worse than either option.** An earlier revision of this
  document recorded "RESOLVED: meta tag", quoting Astro's config typings
  (`node_modules/astro/dist/types/public/config.d.ts:759`). That prose describes the *prerendered* case only.
  The runtime picks per route: `node_modules/astro/dist/core/fetch/fetch-state.js:335` resolves
  `cspDestination` to `"meta"` when `routeData.prerender` is true and **`"header"` otherwise** — and every
  route in this project is `prerender = false`.

  **Measured against a production build served by the real adapter (`npm run build && npm start`): no CSP is
  delivered at all.** No `content-security-policy` response header and no `<meta http-equiv>` in the HTML, on
  both a cached route (`/`) and an uncached one (`/admin/login`). `scripts/qa.ts`'s "served HTML has no
  inline styles" check asserts `!/<meta http-equiv/` and passes, which corroborates the absent meta.

  The configuration itself looks correct: `csp` is the right key under `security` (typings line 606), and the
  built SSR manifest carries both `"csp":{"algorithm":"SHA-256",...}` with all six directives and
  `shouldInjectCspMetaTags:true`. Root cause not established — it is somewhere between the manifest and
  `renderPage` (`node_modules/astro/dist/runtime/server/render/page.js:29,61`), which is where the header
  would be set. **This needs the project's own decision and is recorded in CHANGELOG.md**, because the
  design system pays real costs for this CSP — no `style=""`, no `define:vars`, no inline scripts, and a
  hand-rolled view-transition layer instead of `<ClientRouter />`.
- Per-component prop contracts for `src/components/ui/*` (21 components) were reported but not
  re-verified line by line; Phase 1C will establish them.
- Dead-component claims (`ui/ProgressStep`, `ui/SteppedProgress`, `ui/Toast`, `ui/Toggle`) are contested —
  they are referenced by `tests/unit/styles/a11y-components.test.ts`. Do not delete on this evidence.
