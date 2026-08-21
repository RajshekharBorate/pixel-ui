# Performance plan — pixel-ui library

Living program for **runtime, delivery, and lab gates** of the `pixel-ui` Angular library
(`projects/pixel-ui/` only). Mechanical rules still live in `CONVENTIONS.md`; this file is
phased scope, categories, and exit criteria.

**Out of scope:** `projects/docs/` (examples, docs routing, docs Lighthouse, playground).
Consumers benefit from this work; we do not change the docs app as part of these waves.

Mark wave / component rows `✅ DONE (YYYY-MM-DD)` when that slice lands. Lasting decisions go
into the component `README.md` Behavior notes (and `CONVENTIONS.md` §3h when the virtualization
matrix changes). This file stays as the inventory (unlike per-component `PLAN.md`, which is
deleted when its phases finish).

| | |
| --- | --- |
| Status | **In progress** — datepicker/grid/editor `@defer` landed; secondary **paths** + docs; ng-packagr secondary FESM blocked; harness scaffold-only |
| First implementation slice | Wave 0 (shared + packaging + harness) + Wave 1 (grid / select) |
| Angular | 21, standalone, OnPush + signals, no `@angular/cdk` |
| `@defer` in library | datepicker / date-range calendar; data-grid columns panel; editor table toolbar + find bar |
| Secondary entries | Preferred imports `pixel-ui/charts` · `editor` · `data-grid` (tsconfig); primary still re-exports until ng-packagr secondary compiles |

---

## Goal

Make **default and closed** component usage cheap:

- fewer DOM nodes per tick
- less work per signal update
- smaller JS for unused features (charts, editor, grid)
- no leaked overlays, observers, or timers

Heavy behavior (virtual lists, charts, editor, calendars) must stay **opt-in or deferred until
that subtree is actually needed**.

`@defer` does **not** replace virtualization. A deferred 1k-row grid still explodes after it loads.

---

## How to review a component

1. Read that component’s `README.md` (behavior contract), then `*.ts` / `*.html` / `*.scss` / `*.spec.ts`.
2. Score categories 1–17 below (use **N/A** when the pattern cannot apply; say why).
3. Stress: 1k rows, 500 options, open/close overlay 50×, typeahead / filter.
4. Measure (harness, not docs): DOM node count, long tasks, listener count after close, TBT / CLS / JS bytes, timespan INP-like duration.
5. Fix without breaking documented behavior. Note virtualization, a11y, or `@defer` trade-offs in Behavior notes.

Scope **code** reads to that folder + `shared/` + `src/styles/_theming.scss`. Do not re-scan the library.

---

## Categories (all)

Run this checklist on every `pixel-*` folder and on shared overlay/theming.

| # | Category | What we look for |
| --- | --- | --- |
| 1 | **Change detection & signals** | OnPush only; `computed()` vs work in the template; `effect()` only for DOM / true side effects; host bindings that do not churn every tick |
| 2 | **List rendering** | `@for` + stable `track`; no accidental array rebuilds; empty / skeleton cost |
| 3 | **Virtualization & scale** | Windowing where CONVENTIONS §3h allows it; close the select-panel gap; tree/grid `virtualScroll` |
| 4 | **Layout & paint** | No `getBoundingClientRect` in loops; ResizeObserver debounce; `contain` / `content-visibility` where safe; no scrollbar-induced shift |
| 5 | **CSS / animation** | Token-only colors; `prefers-reduced-motion`; compositor-friendly transforms; no leaked `will-change`; expensive `color-mix` / filters on large lists |
| 6 | **Overlays & body relocation** | Dialog / drawer / menu / select / tooltip: create/destroy cost, focus trap, scroll lock, slot reparenting; closed ≈ zero work |
| 7 | **Events & observers** | Passive scroll/touch; debounce/throttle; shared `matchMedia`; IntersectionObserver cleanup; no `setInterval` polling |
| 8 | **Memory & lifecycle** | `DestroyRef` for listeners / observers / timers; reclaim moved DOM (dialog `[pixelDialogFooter]` slots) |
| 9 | **Bundle & tree-shaking** | Secondary ng-packagr entries so apps do not parse charts / editor / grid unused; fat `public-api.ts` |
| 10 | **Input pipeline** | Filter / sort / typeahead cost per key; debounce; indexes vs O(n) scans |
| 11 | **Async & I/O** | Infinite `loadMore`; file upload; push; abort stale work; no duplicate `enable()` / `refresh()` |
| 12 | **Media & fonts** | Component-owned images: `loading="lazy"` / `decoding="async"`; icon ligatures vs SVG; Material Symbols is a documented peer (measure, do not silently drop) |
| 13 | **SSR / hydration safety** | Guard `document` / `window`; no layout in constructors; overlays after `afterNextRender` |
| 14 | **A11y vs cost** | `aria-live` frequency; virtualization vs `aria-rowcount` / roving tabindex |
| 15 | **Angular delivery** | `@defer`, `@if(open)` vs JS split, `NgOptimizedImage` (static assets only), render-hook audit |
| 16 | **Composition** | App-shell + sidenav + header: always-on listeners, theme sync, tour autoplay |
| 17 | **Lighthouse & lab gates** | Dedicated **library harness** (not docs). Navigation + timespan/user-flow + snapshot. Budgets on TBT, CLS, JS transferred, timespan duration |

### Category 15 — Angular platform features (library rules)

| Feature | Use in pixel-ui? | Rule |
| --- | --- | --- |
| **`@if (open)`** | Yes | Default for overlays: skip DOM when closed. Does **not** split JS. |
| **`@defer`** (`idle` / `viewport` / `interaction` / `hover` / `timer` / `when`) | Yes, **heavy subtrees only** | Never wrap button / input / chip. OK for calendar body, inactive tab panel, collapsed accordion, chart until viewport/data, editor until interaction, grid optional chrome (detail / column menu / export). |
| **`@placeholder` / `@loading` / `@error`** | Yes when deferring | Same footprint as the real subtree (no CLS). |
| **`@prefetch`** | Rare | Hover-open overlays **only if** the deferred chunk is large (calendar, virtual select list). |
| **Incremental hydration** | No | App / SSR config. Keep DOM SSR-safe so **apps** can hydrate. |
| **Lazy routes** | No | App concern. |
| **`NgOptimizedImage`** | Only static images the **component** owns | Dynamic `<img>` stays explicit (`loading` / `decoding`). Inline base64 is unsupported by `NgOptimizedImage`. |
| **Zoneless + signals** | Keep | No Zone-only APIs. |
| **`afterNextRender` / `afterRenderEffect`** | Audit | Keep for measure / reparent; cut redundant per-tick effects. Extra render hooks are not free. |
| **Dynamic `import()`** | Where `@defer` cannot wrap `ng-content` | Chart series, map, editor, optional grid modules. |
| **Secondary ng-packagr entries** | Yes | e.g. charts / editor / data-grid so `import { PixelButton } from 'pixel-ui'` stays lean. |

Today: **datepicker / date-range** defer `pixel-calendar` until the panel opens (`@if` +
`@defer on immediate`). Overlay close still uses `@if` / hidden hosts elsewhere — that skips DOM,
not download cost. Other components: no `@defer` yet.

---

## `@defer` inventory (library)

Rules: heavy subtrees only; never wrap button/input/chip shells; sized `@placeholder`/`@loading`;
import deferred comps from their own file (not barrels); **`ng-content` cannot split consumer JS** —
tabs/accordion `[lazy]` is DOM-only.

| Component | Strategy | Trigger | Status |
| --- | --- | --- | --- |
| **datepicker** | Defer `pixel-calendar` + actions inside open panel | `@if (isOpen())` + `@defer (on immediate)`; prefetch `@defer (when false; prefetch on hover(field))` | ✅ DONE |
| **date-range-picker** | Same | Same | ✅ DONE |
| **datetime-picker** | Inherits via inner datepicker | — | Inherited |
| **data-grid** | Defer column chooser panel body | `@if (columnsPanelOpen())` + `@defer (on immediate)` | ✅ DONE (panel); export menu skipped (light `pixel-menu` items) |
| **editor** | Defer floating table toolbar + find bar | `@if` + `@defer (on immediate)` | ✅ DONE (toolbar + find) |
| **chart-\*** | Prefer app `@defer on viewport`; import from `pixel-ui/charts` | `viewport` | Path alias ✅; ng-packagr secondary FESM blocked; app guidance ✅ |
| **tabs / accordion** | Keep `[lazy]` DOM gate; document consumer `@defer` for heavy projected content | — | Docs ✅ |
| **select / menu** | Prefer panel virtualization over defer | — | Wave 1 |
| **Wave 5 primitives** | Do not defer | — | N/A |

**Packaging:** prefer `pixel-ui/charts` · `editor` · `data-grid` (tsconfig paths). Primary
`public-api.ts` still re-exports those surfaces until ng-packagr secondary FESM builds succeed.

### Category 17 — Lighthouse (library harness)

Lighthouse scores a **URL**, not `pixel-button.ts`. Docs Lighthouse is **out of scope**.

**Harness (Wave 0):** a minimal app or routes that only mount pixel-ui, e.g. `/perf/button`, `/perf/select-500`, `/perf/grid-1k`, `/perf/dialog`, `/perf/chart-line`, `/perf/overlay-closed`. No docs chrome, no markdown, no example registry. This is instrumentation, not a product.

| Mode | Use for |
| --- | --- |
| **Navigation** | First load, unused JS, TBT, LCP of that route, CLS |
| **Timespan / user flow** | Open select, scroll virtual grid, open/close dialog 10× |
| **Snapshot** | A11y + DOM after a state (grid scrolled, dialog open) |

**Library-owned audits (fix in `projects/pixel-ui/`):** unused JS, bootup time, long tasks / TBT, CLS (skeletons, placeholders, dialog/drawer, image dimensions), component-owned images, a11y slice (contrast, names, dialog labels), console errors from library code.

**Not library-owned (ignore):** TTFB, CDN, cache headers, SEO, PWA, robots, host CSS, consumer `NgOptimizedImage` for *their* assets.

**Gates:** before/after on the same harness route. Track TBT, CLS, JS transferred, timespan duration — not only the composite Performance score (noisy). Fail CI if those regress past a budget.

**Other lab tools (also required):** Chrome Performance panel, `performance.measure`, node counts, listener counts after overlay close. Lighthouse is the regression gate, not the only profiler.

---

## Waves

### Wave 0 — Shared infrastructure

Unlocks every later wave. **Do first.**

| Surface | Work | Status |
| --- | --- | --- |
| `shared/overlay` + `overlay-utils` | Closed overlay = no trap / lock / rAF; one shared `prefersReducedMotion` / `matchMedia` probe | Not started |
| `PixelDialogService` slot redistribute | Cheap, leak-free reparent; reclaim nodes before destroy (NG0953) | Not started |
| Theme / `matchMedia` | Share instead of N independent subscriptions | Not started |
| Packaging | Secondary **import paths** (`pixel-ui/charts`, `pixel-ui/editor`, `pixel-ui/data-grid`) via tsconfig; primary barrel still re-exports. **ng-packagr secondary entries blocked** by Angular compiler bug (`referencedFiles[index]` undefined) — revisit when packagr/compiler fixes | ⚠️ Partial (2026-08-20) — path aliases + docs; no separate FESM yet |
| Perf harness + Lighthouse CI | Routes + budgets (TBT, CLS, JS, timespan) | Scaffold README in `projects/perf/` — app not wired yet |

**Exit:** overlay open/close is cheap and leak-free; a button-only consumer does not parse chart/editor/grid JS; harness can fail CI on budget regression.

### Wave 1 — High-cardinality lists

Largest FPS / INP wins.

| Component | Focus | Status |
| --- | --- | --- |
| **data-grid** | `virtualScroll` defaults/guidance; store `effect()` fan-out; cell templates; `loadMore` + virtual together; `@defer` detail / column menu / export | **columns panel `@defer` ✅ DONE (2026-08-20)**; export menu skipped (light); virtualScroll / select-style gaps remain |
| **tree** | Windowing; expand/collapse; icon rows | Not started |
| **select** | Panel **DOM windowing** (CONVENTIONS §3h: all *loaded* options currently render); keep IntersectionObserver `loadMore` | Not started |
| **autocomplete** | Typeahead debounce + list cost | Not started |
| **menu** | 100+ items (contract: modest lists); defer panel internals only if justified | Not started |
| **notification panel / item** | Long inbox; live-region rate; toast stack | Not started |
| **query-builder** | Nested groups; many conditions | Not started |

**Exit:** 1k-row grid and 500-option select stay interactive on the harness (timespan INP-like budget). Update `CONVENTIONS.md` §3h if select virtualization ships.

### Wave 2 — Overlays & chrome

| Component | Focus | Status |
| --- | --- | --- |
| dialog / confirm | Relocate, focus trap, footer slots, panel class | Not started |
| drawer | Same + size animation | Not started |
| popover / tooltip | Delay, detach when closed, rAF | Not started |
| datepicker / date-range / calendar / timepicker | Month grids; `@defer` calendar body if chunk is large; `@prefetch` on hover only if justified | **datepicker + date-range ✅ DONE (2026-08-20)** — `@if (isOpen())` + `@defer (on immediate)` + `prefetch on hover` via `@defer (when false; prefetch on hover(field))`. Timepicker / standalone calendar: not started |
| tour | `setInterval` autoplay; spotlight measure | Not started |
| notification push-prompt + scheduler | Delayed timer, dialog, cooldown I/O, slot redistribute on view change | Not started |

**Exit:** closed overlay ≈ no observers; open is one layout pass. `@if (open)` remains the default; `@defer` only for heavy panel children.

### Wave 3 — Charts, editor, media

| Component | Focus | Status |
| --- | --- | --- |
| chart-shell + bar / line / area / pie / gauge / scatter / bubble / radar / sparkline | `@defer on viewport` or lazy `import()` of series; resize debounce; SVG/canvas node count | Import path `pixel-ui/charts` ✅; ng-packagr secondary FESM blocked — primary still exports; app `@defer on viewport` documented |
| chart-map | Geo payload / tiles; ResizeObserver | Same as charts packaging |
| editor | Init cost; defer until focus / interaction | Import path `pixel-ui/editor` ✅; **table toolbar + find bar `@defer` ✅ DONE (2026-08-20)** |
| file-upload | Chunking; preview thumbnails; `revokeObjectURL` | Not started |
| avatar / component images | lazy / async; `NgOptimizedImage` only for static assets the component owns | Not started |

**Exit:** unused series not parsed by a non-chart consumer; resize does not redraw every frame.

### Wave 4 — Forms & density

| Component | Focus | Status |
| --- | --- | --- |
| input, checkbox, radio, toggle, slider | CVA churn; host class thrash | Not started |
| chip / chip-set | `@for` track | Not started |
| paginator, stepper | Chrome cost | Not started |
| tabs / tab-nav | **`@defer` inactive tab panels** | **Docs ✅** — `[lazy]` is DOM-only; apps `@defer` heavy projected content |
| accordion | **`@defer` collapsed panel bodies** | **Docs ✅** — same as tabs (`[lazy]` + consumer `@defer`) |
| autocomplete | Follow-up from Wave 1 | — |

**Exit:** inactive tab / collapsed accordion do not ship or run their heavy body until opened (JS split and/or skipped DOM, documented in README).

### Wave 5 — Primitives (leaks / always-on only)

No `@defer`. Hunt listeners and extra CD.

| Component | Focus | Status |
| --- | --- | --- |
| button, split-button, button-group | `keyboardActive` without extra CD | Not started |
| badge, card, divider, loader, skeleton, empty-state, progress | Trivial; confirm no timers | Not started |
| header, footer, container, breadcrumb | ResizeObserver / matchMedia | Not started |
| sidenav, app-shell | Always-on listeners; collapse breakpoint | Not started |

**Exit:** app-shell + sidenav idle listener count documented and justified; no stray intervals.

---

## What we will not do

- Optimize color tokens / dark mode (free if we never hardcode).
- Micro-inline templates on trivial components for “speed.”
- Menu virtualization **before** select panel virtualization (CONVENTIONS §3h rank).
- New runtime dependencies or `@angular/cdk`.
- Docs-site `@defer`, lazy docs routes, or Lighthouse on `/docs`.
- App routing, consumer SSR hydration config, or consumer image CDNs.
- Worship Lighthouse Performance **score** without TBT / CLS / JS / timespan budgets.

---

## Cadence

1. **Wave 0** — harness + Lighthouse CI + overlay utilities + secondary entries.
2. **Wave 1** — data-grid + select (highest stall risk in real apps).
3. Wave 2 overlays → Wave 3 charts/editor → Wave 4 form defer → Wave 5 leak sweep.
4. After each wave: update this file (status dates), component README Behavior notes, §3h if list strategy changed.

### Suggested harness routes (Wave 0)

| Route | Stress |
| --- | --- |
| `/perf/button` | Baseline JS (must stay small) |
| `/perf/overlay-closed` | Dialog/select/menu constructed but closed |
| `/perf/dialog` | Open/close 10× (timespan) |
| `/perf/select-500` | 500 options, open + typeahead |
| `/perf/grid-1k` | 1000 rows, virtual on vs off |
| `/perf/chart-line` | First paint + resize |
| `/perf/editor` | Init vs idle |

Exact project location (`projects/perf` vs a test harness) is a Wave 0 decision; it must **not** be `projects/docs`.

---

## Per-component scorecard (copy per folder when a wave starts)

```md
## Performance notes — pixel-<name>

| Cat | Score (1–5 or N/A) | Notes |
| --- | --- | --- |
| 1 CD / signals | | |
| 2 Lists | | |
| 3 Virtualization | | |
| 4 Layout / paint | | |
| 5 CSS / motion | | |
| 6 Overlays | | |
| 7 Events | | |
| 8 Memory | | |
| 9 Bundle | | |
| 10 Input pipeline | | |
| 11 Async | | |
| 12 Media | | |
| 13 SSR | | |
| 14 A11y vs cost | | |
| 15 Angular delivery | | |
| 16 Composition | | |
| 17 Harness / LH | | |

Stress case:
Baseline (date): TBT / CLS / JS / timespan /
Follow-ups:
```

Do **not** leave a long-lived `PLAN.md` in a component folder for this program unless that component also has unrelated feature phases. Use this file + README Behavior notes.

---

## Known baseline (as of plan authoring)

- OnPush + signals + `@for` `track` are already required (`AGENTS.md` / `CONVENTIONS.md`).
- Grid and tree already expose `virtualScroll`; select `loadMore` is **not** DOM windowing (§3h).
- `afterNextRender` / `afterRenderEffect` already used in select, chart, dialog slots, tabs, editor, etc. — Wave 0/2 should **audit overuse**.
- **No `@defer`** in most of `projects/pixel-ui` — **exceptions (2026-08-20):** datepicker /
  date-range calendar panels (+ hover prefetch), data-grid columns panel, editor table toolbar.
- Secondary entries: `pixel-ui/charts`, `pixel-ui/editor`, `pixel-ui/data-grid`.
- Dialog imperative `[pixelDialogFooter]` redistribution exists (push-prompt); reclaim-on-destroy is part of Wave 0 overlay work.
- Material Symbols is a peer/font cost; Lighthouse will see it on any harness that loads the font — document, don’t surprise-remove.

---

## Related docs

- `CONVENTIONS.md` — architecture, overlays, §3h virtualization, testing
- `RESPONSIVE.md` — viewport / container-query inventory (layout, not perf budgets)
- Component `README.md` — behavior contract (do not break)
- `AGENTS.md` — UI/UX checklist §6 Performance
