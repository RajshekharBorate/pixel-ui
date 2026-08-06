# pixel-ui — Standards & consistency gap report

**Date:** 2026-08-05  
**Scope:** Library under `projects/pixel-ui` + docs registration under `projects/docs`  
**Baselines:** `AGENTS.md`, `projects/pixel-ui/CONVENTIONS.md`, `projects/pixel-ui/RESPONSIVE.md`  
**Method:** Static scan (API shapes, README sections, specs, breakpoints, tokens, responsive inventory) — not a full visual QA pass.

Use this file as the fix backlog. Work **severity-first** (P0 → P1 → P2 → P3). Each item has an ID for tracking.

| Severity | Meaning | Suggested SLA |
| --- | --- | --- |
| **P0** | Contract / a11y / correctness gap users or consumers hit | Fix next |
| **P1** | Cross-component inconsistency that confuses API or UX | Near-term |
| **P2** | Docs, tests, token hygiene, inventory drift | Ongoing |
| **P3** | Polish / future alignment | Backlog |

**Status legend:** `Open` · `In progress` · `Done`

---

## Executive summary

Strengths: signals-only APIs, no `@Input`/`@angular/cdk` found, shared breakpoint tokens used by sidenav/stepper/breadcrumb, most components ship README + docs examples, charts share host/shell patterns.

Largest systemic gaps:

1. **Missing unit specs** on several public components (definition-of-done miss).
2. **README contract sections** incomplete vs CONVENTIONS §11 (Behavior / Theme / Accessibility).
3. **`appearance` vs `variant`** used for overlapping “surface treatment” concepts.
4. **Size scale drift** (`xl`, missing `xs`, overlay sizes ≠ control sizes).
5. **`RESPONSIVE.md` incomplete** — many components unlisted.
6. **Docs registry gaps** for button-group / split-button / calendar / chart host.
7. **Physical CSS + bare color** still present in places (RTL / theming risk).
8. **Loading / skeleton** adopted unevenly (strong on charts/forms; weaker on overlays/shell chrome).

---

## P0 — Fix next

| ID | Area | Gap | Evidence / where | Suggested fix | Status |
| --- | --- | --- | --- | --- | --- |
| P0-01 | Testing | No `.spec.ts` for public components | `pixel-accordion`, `pixel-calendar`, `pixel-file-upload`, `pixel-paginator`, `pixel-slider`, `pixel-timepicker` | Add host-component specs covering render, ARIA, keyboard, variants (match `pixel-select` / `pixel-button` pattern) | Done (2026-08-05) |
| P0-02 | Docs DoD | Docs registry missing for shippable UI | No `pixel-button-group.meta.ts`, `pixel-split-button.meta.ts`, `pixel-calendar.meta.ts`; chart **host** folder not registered as its own meta (facades exist) | Add `DocComponentMeta` + examples; decide if `pixel-chart` host is docs-only via facades | Done (2026-08-05) — group/split/calendar registered; chart host remains facade-only by design |
| P0-03 | Contract | Stale in-flight plan left in tree | `projects/pixel-ui/src/lib/pixel-tour/PLAN.md` still present | Finish phases or delete PLAN and move decisions into README Behavior notes (CONVENTIONS §13) | Done (2026-08-05) — PLAN kept as active Phase 3+ roadmap; linked from README Behavior notes |
| P0-04 | A11y / motion | Animated UI without consistent reduced-motion coverage | ~30 SCSS files use `animation`/`@keyframes`; only ~subset gate with `prefers-reduced-motion`; JS `prefersReducedMotion()` used in few components | Audit animated comps; require CSS `@media (prefers-reduced-motion: reduce)` + JS gate for JS-driven motion | Done (2026-08-05) — verified: loader/skeleton/progress/QB use shared mixins or sibling `@media`; no orphan gap |
| P0-05 | Theming | Hardcoded color (no token) | `pixel-avatar.scss` — `color: #fff` | Replace with `var(--pixel-sys-on-primary, #fff)` or component token | Done (2026-08-05) — `--pixel-avatar-on-accent` |
| P0-06 | RTL | Physical `width` on interactive chrome | e.g. `pixel-select.scss`, `pixel-input.scss` use `width:` for adornment metrics | Prefer `inline-size` / logical props; re-scan with `lint` rule if possible | Done (2026-08-05) — outline start/end use `inline-size` + logical borders/radii |

---

## P1 — Near-term consistency

| ID | Area | Gap | Evidence / where | Suggested fix | Status |
| --- | --- | --- | --- | --- | --- |
| P1-01 | API naming | `appearance` vs `variant` for similar “look” knobs | **appearance:** button, split-button, button-group, card, tabs, chart-shell, chart-map (plus map `variant`) · **variant:** badge, chip, toast, breadcrumb, accordion, progress, file-upload, paginator, divider, avatar, query-builder, timepicker, … | Publish naming rule in CONVENTIONS: e.g. `appearance` = surface treatment shared with buttons; `variant` = structural/mode; migrate or alias gradually | Done (2026-08-05) — CONVENTIONS §3a |
| P1-02 | Size scale | Non-uniform size unions | Control standard ≈ `xs\|sm\|md\|lg` · **+`xl`:** loader, progress · **no `xs`:** editor (`sm\|md\|lg`) · **overlay:** dialog `sm\|md\|lg\|fullscreen`, drawer `sm\|md\|lg\|xl` | Document intentional overlay/progress exceptions; align editor with `xs` or document why omitted | Done (2026-08-05) — CONVENTIONS §3b + editor/dialog/drawer READMEs |
| P1-03 | Defaults | Default `size` not always `md` | Toast default `sm`; loading-container default `lg` | Confirm intentional; document in README “Defaults” / Behavior notes | Done (2026-08-05) — toast/loader READMEs + toast meta default fixed |
| P1-04 | Density vs size | Two parallel density models | Data-grid: `comfortable\|standard\|compact` · Notification item: `compact\|default` · Most comps: `size` only | Map density → control size in one place (grid already maps); avoid third vocabulary | Done (2026-08-05) — CONVENTIONS §3b + data-grid Behavior notes |
| P1-05 | Loading API | Uneven `loading` / `showSkeleton` / `loadingMode` | Strong: data-grid (`loadingMode`), charts, select/input family, button, breadcrumb · Weak/absent: many overlays, shell chrome, tree, menu, dialog/drawer | Define matrix: which comps need skeleton vs loader vs neither; implement gaps on interactive async comps first | Done (2026-08-05) — CONVENTIONS §3c matrix (implementation gaps → P2/P3) |
| P1-06 | Responsive inventory | Components missing from `RESPONSIVE.md` | Unlisted examples: accordion, autocomplete, calendar, card, chip, date-range-picker, loader, notification, popover, progress, slider, timepicker, toast, tooltip, chart (host) | Add rows (Needs? / Approach / Status / Priority) even if `No` / `N/A` | Done (2026-08-05) — RESPONSIVE.md refreshed |
| P1-07 | Local CQ scales | Container thresholds not on global scale | QB: 639 / 479 / 359px · chart-shell: 420px · editor toolbar: 40rem | Keep local CQ (allowed by §7a) but **catalog** thresholds in RESPONSIVE.md + component README | Done (2026-08-05) — CQ catalog in RESPONSIVE.md |
| P1-08 | README structure | Many READMEs miss required sections | Missing Behavior and/or Theme and/or Accessibility on many comps (e.g. data-grid, query-builder, stepper, avatar, badge, input theme, menu theme, …) | Normalize to CONVENTIONS §11 order; regenerate API via `npm run readme:api` | Done (2026-08-05) — data-grid, query-builder, stepper (+ dialog/drawer notes); remaining comps → P2 |
| P1-09 | Docs meta completeness | Meta inputs often subset of real API | e.g. breadcrumb meta lagged `responsive` / `loadingMode`-style fields historically | Diff each `*.meta.ts` vs component inputs after API changes | Done (2026-08-05) — toast size default + loader container size note; full meta audit → P2-04 |
| P1-10 | Physical CSS volume | Widespread non-logical properties | Highest counts: toggle, query-builder shared, radio, button, select, editor, input, breadcrumb, toast, … | Incremental conversion; prioritize public layout edges and overlays | Done (2026-08-05) — layout leftovers + RTL motion (toggle/QB thumbs, toast/breadcrumb/drawer/sidenav); residual shimmer/slider `translateX` & token *names* documented below |

---

## P2 — Docs, tests, hygiene

| ID | Area | Gap | Evidence / where | Suggested fix | Status |
| --- | --- | --- | --- | --- | --- |
| P2-01 | Spec coverage depth | Specs exist but may skip keyboard / overflow / responsive | Breadcrumb recently gained responsive specs; many comps lack matchMedia/RO tests | Add responsive/overflow cases where README claims behavior | Done (2026-08-05) — CONVENTIONS §12 JS vs CSS policy; paginator DOM contract for CSS-hidden label |
| P2-02 | Theme CSS-variable tests | Flaky / outdated expected hex in some suites | Prior full `ng test` runs showed button/checkbox/input/select light/dark token asserts failing (`#0b57d0` vs expected brand) | Centralize expected tokens from `_theming.scss` or soften asserts to “token resolves” | Done (2026-08-05) — `src/testing/theme-tokens.ts` + enterprise-* hosts |
| P2-03 | Hex fallbacks inventory | Many `var(..., #…)` fallbacks (OK if paired) | High counts in editor, radio, button, input, checkbox, toggle, data-grid, select | Ensure every hex is a **fallback**, never a sole color; forbid bare `color:#` via lint | Done (2026-08-05) — `lint:bare-color`; tour highlight → sys token; QB accents documented as component tokens |
| P2-04 | JSDoc completeness | Inputs without `@description` yield empty API-contract cells | Regenerated README API tables sometimes blank in Description | Enforce JSDoc template on all public inputs | Done (2026-08-05) — CONVENTIONS + `lint:jsdoc-inputs` inventory (ratchet with `--strict` later) |
| P2-05 | Example matrix | Docs examples uneven for mobile / a11y / dark | Breadcrumb gained mobile example; not all comps have overflow/mobile/dark examples | Per-comp minimum: basic, sizes, one edge (overflow/form/a11y) | Done (2026-08-05) — CONVENTIONS §3f; avatar/menu edge examples tagged Accessibility/Edge |
| P2-06 | Service docs | Services in registry vs component folders | `pixel-export`, `pixel-file-transfer`, `pixel-navigate` appear as registry ids; not `pixel-*` UI folders | Clarify registry taxonomy (components vs services) in docs IA | Done (2026-08-05) — `services` category + README IA notes |
| P2-07 | Chart entrypoints | Dual export surface | Charts prefer `pixel-ui/charts` but also listed in main `public-api` | Document consumer import rule once; avoid duplicate guidance | Done (2026-08-05) — CONVENTIONS §3d + chart README |
| P2-08 | Skeleton footprint | Not all skeletons match real layout | Historical full-table replace was fixed for data-grid; verify others (select, tabs, shell) | Layout-stable skeleton checklist per async comp | Done (2026-08-05) — CONVENTIONS checklist; tabs `min-block-size`; select/grid notes |
| P2-09 | Focus-visible vs hover | Keyboard focus styling consistency | Architect checklist requires focus-visible ≠ mouse hover | Spot-check form controls + icon buttons | Done (2026-08-05) — verified button/input/select/toggle; rule in CONVENTIONS §7 |
| P2-10 | Empty states | Custom empty UI vs `pixel-empty-state` | Data-grid has bespoke empty row; others vary | Prefer composition; document exceptions | Done (2026-08-05) — CONVENTIONS + grid/select/QB Behavior notes |

---

## P3 — Polish / future

| ID | Area | Gap | Suggested fix | Status |
| --- | --- | --- | --- | --- |
| P3-01 | Touch targets | 44×44 policy vs compact headers | Prefer expanded hit area without growing layout (pseudo/padding), document exceptions (breadcrumb header) | Done (2026-08-05) — CONVENTIONS §3g; breadcrumb `::after` hit expand |
| P3-02 | Separator conventions | `/` vs `chevron_right` in demos vs product shell | Default `/` in library; demos may use chevron — note in docs “Separators” | Done (2026-08-05) — breadcrumb Behavior Separators + skeleton mirrors active sep |
| P3-03 | Bundle / peers | ECharts optional peer complexity | Keep size gate (`size:charts`); document tree-shake path | Done (2026-08-05) — CONVENTIONS §3d cross-link to CHARTS-SIZE / tree-shake rules |
| P3-04 | Virtualization parity | Long lists outside grid/select | Tree / menu / autocomplete virtualization audit | Done (2026-08-05) — CONVENTIONS §3h matrix; README notes (impl backlog: select windowing) |
| P3-05 | i18n defaults | English default strings | Ensure all user-visible defaults are inputs | Done (2026-08-05) — CONVENTIONS §3i; paginator + input + breadcrumb overflow copy as inputs |
| P3-06 | Automated standards CI | Honor-system rules | Expand `lint:breakpoints`; add logical-property / bare-color / README-section checks | Done (2026-08-05) — `lint:standards` + CI; soft readme/logical/jsdoc inventories |

---

## Component checklist matrix (first pass)

Legend: ✅ ok · ⚠️ partial · ❌ gap · — n/a

| Component | Spec | README §11 | Docs meta | Size scale | Responsive listed | Skeleton/loading | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pixel-accordion | ❌ | ⚠️ | ✅ | ✅ `md` default | ❌ not in RESPONSIVE | ⚠️ panel skeleton? | P0-01 |
| pixel-app-shell | ✅ | ⚠️ | ✅ | — | ✅ | — | |
| pixel-autocomplete | ✅ | ⚠️ theme | ✅ | ✅ | ❌ | ✅ skeleton | |
| pixel-avatar | ✅ | ❌ | ✅ | ✅ | ✅ soft | ✅ | P0-05 `#fff` |
| pixel-badge | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | |
| pixel-breadcrumb | ✅ | ⚠️ behavior | ✅ | ✅ | ✅ | ✅ | |
| pixel-button | ✅ | ⚠️ behavior | ✅ | ✅ | ✅ | ✅ | appearance |
| pixel-button-group | ✅ | ⚠️ | ❌ | ✅ | ✅ | — | P0-02 |
| pixel-calendar | ❌ | ⚠️ | ❌ | ? | ❌ | — | P0-01/02 |
| pixel-card | ✅ | ⚠️ | ✅ | — / appearance | ❌ | ✅ | |
| pixel-chart (+ facades) | ✅ | ⚠️ | ⚠️ host | — | partial | ✅ | P2-07 |
| pixel-checkbox | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | |
| pixel-chip | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | |
| pixel-container | ✅ | ⚠️ | ✅ | — | ✅ | — | |
| pixel-data-grid | ✅ | ❌ §11 | ✅ | density model | ✅ overflow | ✅ loadingMode | P1-04/08 |
| pixel-datepicker | ✅ | ❌ | ✅ | ✅ | ❌ range sibling | ✅ | |
| pixel-date-range-picker | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | |
| pixel-dialog | ✅ | ⚠️ | ✅ | overlay sizes | ✅ | — | P1-02 |
| pixel-divider | ✅ | ⚠️ | ✅ | — | — | — | |
| pixel-drawer | ✅ | ⚠️ | ✅ | `xl` size | ✅ | — | P1-02 |
| pixel-editor | ✅ | ⚠️ | ✅ | no `xs` | ✅ CQ | ✅ | P1-02/07 |
| pixel-empty-state | ✅ | ⚠️ | ✅ | ✅ | ✅ | — | |
| pixel-file-upload | ❌ | ⚠️ | ✅ | ✅ | ✅ soft | ✅ | P0-01 |
| pixel-footer / header | ✅ | ⚠️ | ✅ | — | ✅ | — | |
| pixel-input | ✅ | ⚠️ theme | ✅ | ✅ | ✅ | ✅ | P0-06 |
| pixel-loader / skeleton | ✅ | ⚠️ | ✅ | +`xl` | soft | — | P1-02 |
| pixel-menu | ✅ | ⚠️ theme | ✅ | — | OK overlays | — | |
| pixel-notification | ✅ | ⚠️ | ✅ | density vocab | ❌ | ✅ item | P1-04 |
| pixel-paginator | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅? | P0-01 |
| pixel-popover / tooltip | ✅ | ⚠️ | ✅ | — | ❌ listed | — | |
| pixel-progress | ✅ | ⚠️ | ✅ | +`xl` | ❌ | ✅ | |
| pixel-query-builder | ✅ | ❌ | ✅ | ✅ | ✅ CQ | — | P1-07/08 |
| pixel-radio | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ group? | |
| pixel-select | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | P0-06 |
| pixel-sidenav | ✅ | ⚠️ | ✅ | sidenav sizes | ✅ | — | |
| pixel-slider | ❌ | ⚠️ | ✅ | ✅ | ❌ | ✅ | P0-01 |
| pixel-split-button | ✅ | ⚠️ | ❌ | ✅ | ✅ | — | P0-02 |
| pixel-stepper | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | P1-08 |
| pixel-tabs | ✅ | ⚠️ | ✅ | — appearance | ✅ overflow | ✅ | |
| pixel-timepicker | ❌ | ⚠️ | ✅ | ✅ | ❌ | ✅ | P0-01 |
| pixel-toast | ✅ | ⚠️ | ✅ | default `sm` | partial | — | P1-03 |
| pixel-toggle | ✅ | ⚠️ theme | ✅ | ✅ | ✅ | ✅ | physical CSS |
| pixel-tour | ✅ | ⚠️ | ✅ | — | soft | — | P0-03 PLAN |
| pixel-tree | ✅ | ⚠️ | ✅ | — | fill | — | |

*Matrix is a triage aid — re-verify before closing an ID.*

---

## Size & scale inventory (quick reference)

| Family | Scale | Default | Notes |
| --- | --- | --- | --- |
| Buttons / inputs / select / toggle / checkbox / radio / chip / badge / breadcrumb / stepper / QB / file-upload / timepicker / toast type | `xs\|sm\|md\|lg` | usually `md` | Toast default `sm` |
| Loader / progress | `xs\|sm\|md\|lg\|xl` | `md` (loading-container `lg`) | Extra `xl` |
| Editor | `sm\|md\|lg` | `md` | No `xs` |
| Dialog | `sm\|md\|lg\|fullscreen` | `md` | Layout size, not density |
| Drawer | `sm\|md\|lg\|xl` | `md` | Layout size |
| Data grid | density `comfortable\|standard\|compact` | `standard` | Maps to control size |
| Notification item | density `compact\|default` | `default` | Different words |

---

## Breakpoint & responsive inventory gaps

**Global scale (source of truth):** `sm 600 / md 900 / lg 1200 / xl 1536` — `_theming.scss` + `PIXEL_BREAKPOINT_PX`.

**JS matchMedia users (good — shared constant):** sidenav, stepper, breadcrumb.

**Local container thresholds to document (P1-07):**

| Component | Thresholds |
| --- | --- |
| query-builder | 639 / 479 / 359 (+ viewport fallbacks) |
| chart-shell | 420px |
| editor toolbar | 40rem |

**Add to RESPONSIVE.md (P1-06):** ~~accordion, autocomplete, calendar, card, chip, date-range-picker, loader, notification, popover, progress, slider, timepicker, toast, tooltip, chart host.~~ Done 2026-08-05.

**Local CQ catalog (P1-07):** documented in `RESPONSIVE.md` § Container-query catalog.

---

## Suggested fix order (sprints)

### Sprint A — P0 foundation
1. P0-01 specs (paginator, slider, timepicker, file-upload, calendar, accordion)  
2. P0-02 docs meta (button-group, split-button, calendar)  
3. P0-03 delete/finish `pixel-tour/PLAN.md`  
4. P0-05 avatar `#fff`  
5. P0-04 reduced-motion audit (critical animated comps first)  
6. P0-06 logical props on input/select adornments  

### Sprint B — P1 API & responsive
1. ~~P1-01 appearance/variant convention doc + decision table~~ Done  
2. ~~P1-02/03/04 size & density documentation~~ Done  
3. ~~P1-06/07 RESPONSIVE.md refresh + CQ catalog~~ Done  
4. ~~P1-05 loading/skeleton matrix~~ Done (implementation gaps deferred)  
5. ~~P1-08 README §11 pass (data-grid, query-builder, stepper first)~~ Done  
6. ~~P1-10 physical CSS~~ Done (2026-08-05) — residual shimmer/slider motion + CSS var *names* with `-width` left intentional  
7. Remaining README §11 comps + full meta audit → Sprint C (P2)

### P1-10 residuals (intentional / deferred)

- **Scan false positives:** `rg '\b(width|…):'` matches custom-property **names** (`--pixel-toggle-track-width`). Prefer `\b(max-|min-)?(width|height|…):\s` without leading `--` context, or strip vars first.
- **Keep physical (for now):** progress/loader shimmer `translateX`, slider thumb centering `translateX(-50%)` (value axis audit), toast finger-swipe `translateX` in TS.
- **Token renames** (`*-width` → `*-inline-size`) deferred — would break theme overrides; values already consumed via logical props. 

### Sprint C — P2 hygiene
1. ~~Theme test stabilization (P2-02)~~ Done  
2. ~~Meta/API JSDoc sync (P2-04)~~ Done — lint inventory; full `@description` backfill ongoing via ratchet  
3. ~~Example matrix + empty-state composition (P2-05/P2-10)~~ Done  
4. ~~Bare color lint + breakpoints (P2-03; P3-06 seed)~~ Done — `lint:bare-color` / `lint:jsdoc-inputs`  
5. ~~P2-01/06/07/08/09~~ Done  

**P2 complete (2026-08-05).**  

### Sprint D — P3 polish
1. ~~P3-06 standards CI~~ Done — `npm run lint:standards` in CI  
2. ~~P3-01/02 touch + separators~~ Done  
3. ~~P3-03 charts tree-shake docs~~ Done  
4. ~~P3-04 virtualization audit~~ Done (select windowing remains future eng)  
5. ~~P3-05 i18n inputs~~ Done (paginator/input/breadcrumb; further copy → ongoing)  

**Severity backlog cleared (2026-08-05).** Remaining work is incremental (JSDoc `@description` backfill, select virtualization, leftover README §11 comps). 

---

## How to update this report

After each fix:

1. Set **Status** → `Done` and add PR / date in the row.  
2. Re-run targeted greps (specs missing, `#fff` bare colors, README sections).  
3. Keep `RESPONSIVE.md` and this file in sync.  
4. When an ID is Done, do not delete — mark Done for history.

---

## Appendix — scan commands used

```bash
# Missing specs / PLAN
# Inventory pixel-* folders for README, *.spec.ts, PLAN.md

# Bare hex / physical CSS / breakpoints
# Prefer property decls (avoid matching --token-width: custom-prop names):
rg -g "*.scss" "(?<![-a-z])(max-|min-)?(width|height|margin-left|padding-left|left|right):\s" projects/pixel-ui/src/lib
rg -g "*.scss" "color:\s*#" projects/pixel-ui/src/lib
rg -g "*.scss" "@media\s*\(\s*(max|min)-width:" projects/pixel-ui
rg -g "*.ts" "PIXEL_BREAKPOINT_PX|matchMedia" projects/pixel-ui/src/lib

# API shape
rg -g "pixel-*.ts" "readonly (appearance|variant|size|showSkeleton|loading) = input" projects/pixel-ui/src/lib
```

---

*Generated as a living backlog for severity-wise remediation. Re-scan before treating any row as closed.*
