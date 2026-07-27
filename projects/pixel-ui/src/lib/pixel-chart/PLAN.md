# PLAN — `pixel-ui/charts` (enterprise chart system)

> Living plan for Pixel chart components. Mark phases `✅ DONE (YYYY-MM-DD)` as they land.
> When **all** phases are complete, **delete this file** and keep lasting decisions in each
> component README’s Behavior notes (AGENTS.md lifecycle).

**Status:** Phase 1c ✅ DONE (2026-07-27) — Phase 1 complete (v1 chart set experimental). Next: Phase 2  
**Engine:** Apache ECharts 6.x (Apache-2.0) via **tree-shaken** `echarts/core` registrations  
**Package shape:** Editor-style path alias `pixel-ui/charts` + optional peer `echarts` (ng-packagr secondary entry deferred — see §0 packaging record)  
**UX source:** Phase‑1 mockups (workspace assets / ChatGPT Image Jul 26 2026 — bar, column, line, area, pie, gauge, scatter, bubble, radar)  
**Non‑goals (v1):** Map/geo, graph/network, 3D, realtime websocket adapters, paid BI embeds, sparklines (Phase 3+), CVA/forms  

---

## 0. Goals & success criteria

### Product goals
- Enterprise‑ready charts that look like **Pixel**, not stock ECharts.
- Shared chrome from the mockups: card shell, actions (export / expand / more), legend,
  optional data table, theme + palette + “show values”.
- Accessible by default: keyboard, screen‑reader summary, high contrast, data‑table fallback.
- **Minimum install cost:** apps that never import charts never pay for ECharts.
- **Minimum runtime cost:** apps that use only `pixel-chart-bar` do not load radar/gauge code.

### Success metrics (exit for “v1 shippable”)
| Metric | Target | Phase 0 measured |
|--------|--------|------------------|
| Main `pixel-ui` bundle impact when charts unused | Tree-shake unused exports (same as editor) | Charts exported from root barrel for publish until secondary entry works; prefer `pixel-ui/charts` import |
| Modular **bar** register only (esbuild minify) | Aim &lt; 180 KB gzip | **~171 KB gzip** (504 KB raw) |
| Modular **line** register only | Aim &lt; 180 KB gzip | **~173 KB gzip** (509 KB raw) |
| Full `echarts` entry | Avoid | **~375 KB gzip** (1.1 MB raw) — ~2.2× larger than modular bar |
| Resize / theme switch | No full page jank; dispose + resize correctly | Host implements debounce resize + dispose |
| Docs | Every shipped type has examples matching mockup variants | Phase 1a+ |
| A11y | Data table or accessible summary for every interactive chart | Phase 1a+ |

### Packaging record (Phase 0)

| Decision | Result |
|----------|--------|
| Path | **`pixel-ui/charts`** → `projects/pixel-ui/charts/public-api.ts` (tsconfig paths) |
| ng-packagr secondary entry | **Deferred** — `charts/ng-package.json` failed with `referencedFiles[index] undefined` (cross-folder / packagr 21) |
| Publish path | Symbols also on root `public-api.ts` (like TipTap editor) so npm consumers get charts in the FESM until a true secondary entry ships |
| Peer | `echarts` `^6` optional in `peerDependenciesMeta` |
| Renderer | **Canvas** default; SVG export later |
| ECharts version | **6.1.0** (workspace) |

---

## 1. Architecture decisions (locked unless revisited)

### 1.1 Same monorepo, **not** on the default barrel
```
import { PixelButtonComponent } from 'pixel-ui';           // never pulls charts
import { PixelChartBarComponent } from 'pixel-ui/charts'; // optional peer: echarts
```

Mirror TipTap: `echarts` (+ maybe `zrender` transitive) as **optional peerDependencies**.

### 1.2 Engine: ECharts with **modular registration** (not full `import * as echarts`)
```ts
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
```
Each chart family file registers **only** what it needs. Never `import 'echarts'` (full build).

**SVG renderer:** optional later for crisp export; default **Canvas** for performance.

### 1.3 Component model: one folder per public chart (+ shared core)
Charts follow the **same layout as other Pixel components**: each public chart is its own
folder with its own `.ts` / `.html` / `.scss` / `.spec.ts` / `README.md`. Shared engine
pieces live in a small core folder — not one mega-folder for every chart.

```
projects/pixel-ui/src/lib/
  pixel-chart/                   # SHARED CORE only (not a consumer-facing “god” component)
    PLAN.md                      # this system plan (delete when all phases done)
    README.md                    # core/host/theme contract + install (`pixel-ui/charts`)
    pixel-chart-host.*           # ECharts lifecycle
    pixel-chart-theme.ts
    pixel-chart.types.ts
    register/                    # optional shared register helpers
    builders/chart-option.utils.ts
    export/chart-image-export.ts
    a11y/chart-summary.ts

  pixel-chart-shell/             # card chrome (title, actions, legend, table)
    pixel-chart-shell.ts|.html|.scss|.spec.ts
    README.md

  pixel-chart-bar/
    pixel-chart-bar.ts|.html|.scss|.spec.ts
    README.md                    # behavior contract for bar/column

  pixel-chart-line/
  pixel-chart-area/
  pixel-chart-pie/
  pixel-chart-gauge/
  pixel-chart-scatter/
  pixel-chart-bubble/
  pixel-chart-radar/
    … same file set each …

  # charts secondary entry barrel (path TBD in Phase 0):
  # e.g. src/charts-public-api.ts or pixel-chart/public-api.ts re-exporting all above
```

**API style (signals, CONVENTIONS):**
```html
<pixel-chart-bar
  [series]="series()"
  [categories]="cats()"
  mode="stacked"
  orientation="vertical"
  showValues="auto"
  [palette]="paletteId()"
  ariaLabel="Quarterly sales"
  (pointClick)="onPoint($event)"
/>
```

**Locked:** one **public component** per family + `mode` / `variant` / `orientation` — not 40 micro-components, and **not** all charts stuffed into one folder.  
**Locked:** no separate `pixel-chart-column` — use `pixel-chart-bar` + `orientation="vertical"`.  
**Locked:** area-line mockup → `pixel-chart-area`; do not dual-implement as line `fill`.  
**Locked:** each public chart folder owns its README + spec + docs meta/examples (same DoD as `pixel-button`, `pixel-select`, …).

### 1.4 Separate “presentation chrome” from “plot”
Mockups show **dashboard cards**. Split:

| Piece | Responsibility |
|-------|----------------|
| `pixel-chart-shell` | Title, description, download/expand/more, legend layout, optional table, loading/empty |
| `pixel-chart-*` | Plot only (can be used bare in a grid cell) |

Apps that already have `pixel-card` can skip the shell; shell may compose `pixel-card` tokens/look if it matches without fighting card API.

### 1.5 Improvements beyond the mockups (Pixel UX upgrades)
| Mockup | Improve | Phase |
|--------|---------|-------|
| Global theme/palette only in docs | Per-chart overrides + inherit `[data-theme]` | 0–1a |
| “Show values” always on | `showValues="auto" \| true \| false` (collide-safe) | 1a |
| Data table under every chart | Collapsed on narrow containers; “View as table” | 1a |
| Export icons | PNG/SVG via ECharts + `saveAs`; table via `PixelExportService` | 1a–1c |
| PDF | Optional peer / print SVG — not core | 2 |
| Packed bubble | `layout="pack"` | 2 |
| Streamgraph | `mode="stream"` experimental | 2 |
| Radar “stacked” | Document as multi-series overlay; no false “stack” API | 1c |
| Scatter stats (r, R²) | `showStats`; document N limit | 1c |
| Expand | `pixel-dialog` + `copyPixelThemeContext` | 1a |
| More / download menus | `pixel-menu` | 1a |
| High contrast | Thicker strokes; patterns Phase 2 | 1a / 2 |
| Touch targets | Shell actions ≥ 44×44px effective | 1a |
| Configurable copy | `loadingLabel`, `emptyHeading`, `emptyDescription`, export menu labels | 1a |

### 1.6 Library compliance — AGENTS.md + CONVENTIONS.md

Phase‑0 architecture covered product/size goals; this section locks **existing Pixel
practices** so charts do not invent a parallel style.

### Mechanical (CONVENTIONS) — must follow

| Rule | Chart application |
|------|-------------------|
| Standalone + `OnPush`; never write `standalone: true` | All chart components |
| `export default class`; one component per file; `selector: 'pixel-chart-*'` | Family facades + shell + host |
| Signals-only: `input` / `output` / `computed` / `signal`; `effect` only for init/resize/reparent/theme observe | Host owns ECharts lifecycle in `effect` + `DestroyRef` cleanup |
| `booleanAttribute` / `numberAttribute` on booleans/numbers | `showTable`, `loading`, `showSkeleton`, `disabled`, … |
| Every input: JSDoc `@type` / `@default` / `@description` | Feeds `npm run readme:api` |
| Named exported types — no anonymous public unions | `PixelChartBarMode`, `PixelChartImageExportFormat`, event payloads |
| Typed outputs: `PixelChartPointClickEvent { …; source; originalEvent }` | Never bare `number` / `any` for multi-field events |
| Interaction `source: 'mouse' \| 'keyboard'` on interactive events | Match button/select pattern |
| Generics unconstrained `<T = any>` if series row typing is exposed | Cast internally for field access |
| Host `host: {}` for ARIA / `data-mode` / `data-orientation` | Test hooks + styling |
| Module id counter + `id` input | `pixel-chart-bar-${++nextId}` |
| `className` / class-map input + normalize (no `NgClass`) | Match `pixel-button` |
| `protected` template / `private` internals / `readonly` | Match library |
| BEM + Material Symbols (`aria-hidden`) for shell actions | Download / expand / more |
| Logical properties only; no hardcoded colors — `var(--pixel-sys-*, fallback)` | Chart SCSS + shell |
| Breakpoints only via `pixel.breakpoint-*` / `PIXEL_BREAKPOINT_PX` | Shell density; **chart plot fills container** (RESPONSIVE “neither / fill”) |
| Container queries for shell toolbar in variable-width cards | Like query-builder; document in `RESPONSIVE.md` |
| `prefers-reduced-motion` CSS + `prefersReducedMotion()` for ECharts `animation` | Theme bridge |
| Dark scheme via tokens / `dark-scheme-*` mixins — never hardcode theme ids | Theme bridge reads CSS vars at runtime |
| Expand / menus: reuse `pixel-dialog`, `pixel-menu`, `connected-overlay`, `copyPixelThemeContext` | Body-relocated expand inherits theme (§9) |
| **No `@angular/cdk`** | Never pull CDK chart/overlay helpers |
| Compose `pixel-loader` / `pixel-skeleton` / `pixel-empty-state` / `pixel-button` / `pixel-paginator` / `pixel-menu` / `pixel-dialog` | Shell; document decorative embed if any |
| **One folder per public chart** + `pixel-chart/` shared core | Same as `pixel-button`, `pixel-select`, … — not a single mega-folder |
| README + `npm run readme:api` **per public chart folder** | Plus core README for host/theme/install |
| Docs: `DocComponentMeta` + `createDocExample()` **per chart** | Category: **`data-display`** |
| Status start as `experimental` → `beta` → `stable` | Same as editor |
| Specs: host-with-signals + `[data-theme]` shell; mock `ResizeObserver` / `matchMedia` | §12 |
| New runtime deps need explicit approval | `echarts` as **optional peer** only (approved with this PLAN) |
| SSR-safe DOM | Chart init only in `afterNextRender` / browser guards (start Phase 0, not deferred to P3) |

### UX architect checklist (AGENTS) — per family before ship

Run the full checklist; charts-specific notes:

1. **State matrix:** default, hover (tooltip), focus-visible on legend/actions, disabled (non-interactive + muted), loading (`pixel-loader` / `aria-busy`), skeleton (`showSkeleton` sized to chart footprint), empty (`pixel-empty-state`), overflow (truncate long category labels; collide-safe value labels), reduced motion, light/dark, high-contrast denser strokes.
2. **Keyboard:** Tab to shell actions + legend toggles + “view as table”; Escape closes expand; document ECharts focus vs table as primary a11y path.
3. **SR:** `ariaLabel` required for meaningful name; live summary on data refresh; table sync; `aria-describedby` merge.
4. **API vocabulary:** `size`, `disabled`, `ariaLabel`, `id`, class-map; controlled data via `input` + `output`s; `model()` only for genuine two-way (e.g. `highlightedSeriesIds` if needed).
5. **Responsive:** plot = fill container + `ResizeObserver`; shell CQ + viewport fallbacks; `RESPONSIVE.md` rows.
6. **Performance:** OnPush, pure builders in `computed`, `@for track` on tables, dispose chart, no `setInterval`, progressive for large N.
7. **Edge cases:** null/gap points, 0 series, 1 point, huge N (labels off), rapid theme toggle, destroy while animating, SSR, simultaneous loading+disabled (loading → `aria-busy`; disabled → no interaction).

### Definition of done (every phase that ships a public component)

1. `npm run build` green  
2. `npm test` green + updated `.spec.ts`  
3. README verified; `npm run readme:api`; Behavior notes + Breaking changes as needed  
4. Docs meta + examples (`data-display`, `experimental`)  
5. Charts entry exports component + `export type { … }` — root `public-api.ts` stays chart-free  
6. Dark + reduced motion + keyboard walkthrough via `npm run docs`  
7. Mark PLAN phase `✅ DONE (date)`; delete PLAN only when **all** phases done  

### Reuse existing services

| Concern | Use existing | Do not reinvent |
|---------|--------------|-----------------|
| Download chart **image** blob | ECharts → **`saveAs`** | New download util |
| Export **data table** | `PixelExportService.exportTable` | Parallel serializer |
| Chart PNG/SVG/PDF image formats | Chart-local helper + `saveAs` | Overload tabular `PixelExportFormat` |
| Global HTTP/route loading | N/A unless dashboard asks later | `PixelLoadingService` for local charts |

### Packaging note vs editor today

**Phase 0 shipped editor-style:** `pixel-ui/charts` path alias + optional `echarts` peer;
symbols also exported from root `public-api.ts` (same as TipTap editor) so the npm
package includes them. A dedicated ng-packagr secondary entry failed under packagr 21
(`referencedFiles[index]` undefined) and is deferred.

Preferred consumer import remains `from 'pixel-ui/charts'`.

### Explicitly out of scope (OK)

- Forms / CVA — not form controls in v1.  
- Date adapter — only when time-series axis needs locale; then `PixelDateAdapter`.  
- Map / 3D / network / websockets / paid BI.

### 1.7 Locked decisions (was open)

| Topic | Decision |
|-------|----------|
| Folder layout | **Separate folder per chart** (`pixel-chart-bar/`, …) + `pixel-chart/` shared core + `pixel-chart-shell/` |
| README | **One README per public chart folder** (and core + shell READMEs); each is a behavior contract |
| Docs / meta | One `pixel-chart-<name>.meta.ts` + examples folder per chart |
| Column vs bar | Single `pixel-chart-bar` + `orientation` |
| Area vs line fill | Dedicated `pixel-chart-area`; docs cross-link “area line” |
| Docs category | `data-display` only |
| Image export type name | `PixelChartImageExportFormat = 'png' \| 'svg' \| 'pdf'` (distinct from tabular export) |
| Host vs facade | Facades live in their folders and compose core host; host exported for advanced use |

### 1.8 Shared public inputs (all plot facades) — pending implement

Draft shared surface (exact JSDoc in code):

| Input | Type (named alias) | Default | Notes |
|-------|--------------------|---------|-------|
| `series` | `readonly PixelChartSeries[]` | `[]` | Required for meaningful chart |
| `categories` | `readonly string[]` | `[]` | Cartesian |
| `palette` | `PixelChartPalette` | `'brand'` | id or `string[]` |
| `showValues` | `PixelChartShowValues` | `'auto'` | `true \| false \| 'auto'` |
| `loading` | `boolean` | `false` | |
| `showSkeleton` | `boolean` | `false` | |
| `disabled` | `boolean` | `false` | |
| `ariaLabel` | `string` | `''` | Required for a11y when no visible title |
| `ariaDescribedBy` | `string` | `''` | Merged with internal ids |
| `id` | `string` | `''` | |
| `className` | class map / string | `''` | |
| `animation` | `boolean \| 'auto'` | `'auto'` | Respects reduced motion |
| `height` | `string \| number` | `'280px'` | Fill width; height explicit |
| `emptyHeading` / `emptyDescription` / `loadingLabel` | `string` | Pixel defaults | Overridable copy |

Shared outputs: `pointClick`, `seriesClick`, `chartReady`, `exportRequest`.

Shell-only: `title`, `description`, `showTable`, `tableCollapsed`, `showExpand`, `showExport`, `exportFormats`, footer projection.

---

## 2. Package & build (minimum size)

### 2.1 Entry points
| Entry | Contents |
|-------|----------|
| `pixel-ui` | Unchanged — **no** chart exports |
| `pixel-ui/charts` | Public chart API + shell + theme |
| Future (optional) | `pixel-ui/charts/bar` deep imports if ng-packagr secondary entries allow further split |

Phase 0 must implement packaging (secondary entry **or** alias) + `exports` / peer metadata for `charts`.

### 2.2 Tree‑shaking rules (enforced in CI / review)
1. No `import echarts from 'echarts'` / no `echarts/dist/echarts.js`.
2. Each chart file owns its `echarts.use([...])` list; document it in README.
3. Shared host imports only `echarts/core` + resize/dispose helpers.
4. `sideEffects: false` preserved; chart registration side effects isolated to chart modules.
5. Docs examples import **named** chart components, never a mega barrel that re‑exports all families if that defeats shaking (prefer explicit public‑api sections).

### 2.3 Lazy registration pattern
```ts
// pixel-chart-bar.ts — side-effect register once
import { ensureBarChart } from './register/bar.register';
ensureBarChart(); // idempotent echarts.use
```
Keep register modules tiny and family‑scoped.

### 2.4 Renderer policy
| Use case | Renderer |
|----------|----------|
| Default dashboards | Canvas |
| Export SVG / print | Temporary SVG renderer or ECharts `getDataURL` / `renderToSVGString` where available |
| Sparklines (later) | Consider tiny custom SVG **without** ECharts to save weight |

### 2.5 Scalability
- Document **max points** per type (e.g. line 5k canvas OK; labels off above N).
- `progressive` / sampling options exposed for large series.
- `ResizeObserver` on host; debounce ~100ms; `chart.resize()`.
- `Dispose` on destroy; no leaked listeners.
- OnPush + signals; `setOption(opts, { notMerge })` only when data identity changes; shallow compare builders.
- Virtualize **data tables**, not canvases.

---

## 3. Shared design tokens & theming

Map Pixel system tokens → ECharts theme object:

| Pixel token | Chart use |
|-------------|-----------|
| `--pixel-sys-primary` + derived series ramp | Series colors |
| `--pixel-sys-secondary` / tertiary accents | Multi-series fallbacks |
| `--pixel-sys-surface` / `on-surface` / `on-surface-variant` | Background / labels |
| `--pixel-sys-outline` / `outline-variant` | Axis / split lines |
| `--pixel-sys-success` / `warning` / `error` / `info` | Thresholds, gauges |
| `--pixel-sys-shape-corner-*` | Tooltip / card radius |
| `--pixel-sys-motion-duration-*` | Animation; honor reduced motion |
| `--pixel-sys-elevation-*` | Shell / tooltip shadow if any |
| `--pixel-sys-label-*` typography | Axis / value labels |

**Palette input:** `PixelChartPalette = 'brand' | 'vibrant' | 'cool' | 'warm' | readonly string[]` matching mockup swatches.  
Dark mode: rebuild theme when `[data-theme]` / `data-color-scheme` changes (`MutationObserver` or `matchMedia` + theme root; `copyPixelThemeContext` on expand).

### Component tokens (document in README Theme customization) — pending define

| Token | Purpose |
|-------|---------|
| `--pixel-chart-plot-min-block-size` | Default plot height |
| `--pixel-chart-grid` | Grid line color |
| `--pixel-chart-axis-label` | Axis text |
| `--pixel-chart-tooltip-bg` / `fg` / `border` | Tooltip |
| `--pixel-chart-series-1` … `--pixel-chart-series-8` | Optional series overrides |
| `--pixel-chart-track` | Gauge / leftover track |
| `--pixel-chart-threshold-low` / `mid` / `high` | Gauge / radar zones |
| `--pixel-chart-marker-size` | Scatter / line symbols |
| `--pixel-chart-focus-ring` | Legend / action focus |

---

## 4. Accessibility contract (all charts)

1. Host: `role="img"` **or** `figure` + `figcaption`; always `ariaLabel` / `ariaDescribedBy`.
2. Visually hidden **summary** (`aria-live="polite"` + `aria-atomic`) — series count, min/max, trend if cheap.
3. **Data table** synced with chart data; keyboard reachable; optional collapse; “View as table” control.
4. Legend items focusable when interactive (toggle series); announce visibility change.
5. Keyboard: Tab to shell actions + legend + table; Escape closes expand; arrows only where reliable — else table is primary path.
6. High contrast: thicker strokes / larger markers; no color-only encoding for critical thresholds (patterns in Phase 2).
7. Reduced motion: ECharts `animation: false` when `prefersReducedMotion()`.
8. Touch: shell icon buttons ≥ 44×44px effective hit area.
9. Contrast: verify series colors against surface in light + dark (docs checklist).

---

## 5. Data & API contracts (draft)

```ts
export type PixelChartPoint = {
  readonly x: string | number | Date;
  readonly y: number | null;       // null = gap
  readonly size?: number;          // bubble
  readonly label?: string;
};

export type PixelChartSeries = {
  readonly id: string;
  readonly name: string;
  readonly data: readonly PixelChartPoint[] | readonly number[];
  readonly color?: string;
};

export type PixelChartShowValues = boolean | 'auto';
export type PixelChartPalette = 'brand' | 'vibrant' | 'cool' | 'warm' | readonly string[];
export type PixelChartImageExportFormat = 'png' | 'svg' | 'pdf';

export type PixelChartPointClickEvent = {
  readonly seriesId: string;
  readonly seriesName: string;
  readonly pointIndex: number;
  readonly x: string | number | Date;
  readonly y: number | null;
  readonly source: 'mouse' | 'keyboard';
  readonly originalEvent: Event;
};
```

Named mode aliases (export each):  
`PixelChartBarMode`, `PixelChartBarOrientation`, `PixelChartLineMode`, `PixelChartAreaMode`,  
`PixelChartPieMode`, `PixelChartGaugeVariant`, `PixelChartRadarMode`, `PixelChartBubbleLayout`.

Events: `pointClick`, `seriesClick`, `chartReady`, `exportRequest`; `brushEnd` (Phase 2).

Loading / empty: compose `pixel-skeleton`, `pixel-loader`, `pixel-empty-state`.

---

## 6. Mapping mockups → components & variants

### 6.1 Bar / Column (unify)
**Component:** `pixel-chart-bar`  
**Inputs:** `orientation: PixelChartBarOrientation`, `mode: PixelChartBarMode`  
(`'vertical' | 'horizontal'`, `'single' | 'grouped' | 'stacked' | 'percent'`)

| Mockup | Mapping |
|--------|---------|
| Vertical / column single | `orientation="vertical" mode="single"` |
| Horizontal bar | `orientation="horizontal"` |
| Grouped | `mode="grouped"` |
| Stacked | `mode="stacked"` |
| 100% stacked | `mode="percent"` |

### 6.2 Line
**Component:** `pixel-chart-line`  
**Inputs:** `mode: 'straight' | 'smooth' | 'step'`  
Area-under-line mockup → document redirect to `pixel-chart-area`.

| Mockup | Mapping |
|--------|---------|
| Line / multi | default + multi series |
| Smooth | `mode="smooth"` |
| Step | `mode="step"` |
| Area line | `pixel-chart-area` |

### 6.3 Area
**Component:** `pixel-chart-area`  
**Inputs:** `mode: 'overlay' | 'stacked' | 'percent' | 'stream'`

Streamgraph = Phase 2 (`experimental` until validated).

### 6.4 Pie / Donut
**Component:** `pixel-chart-pie`  
**Inputs:** `mode: 'pie' | 'donut' | 'semi'`, `showCenterLabel`, `showValues`

### 6.5 Gauge
**Component:** `pixel-chart-gauge`  

| Variant | Phase | Notes |
|---------|-------|--------|
| `radial` | 1b | Semi-circular thick progress |
| `semi` | 1b | Thinner track + progress |
| `linear` | 1b | Horizontal bar gauge |
| `donut` | 1b | Full ring + center KPI |
| `bullet` | 1b | Ranges + target + actual |
| `solid` | 2 | Thick minimal arc |
| `multi-range` | 2 | Zones + needle |
| `dual` | 2 | Actual vs target arcs |
| `tick` | 2 | Dense ticks + needle |
| `vertical` | 2 | Vertical bar gauge |

### 6.6 Scatter
**Component:** `pixel-chart-scatter`  
**Inputs:** `series`, `showTrendline`, `showStats` (r, R²; document max N)

### 6.7 Bubble
**Component:** `pixel-chart-bubble`  
**Inputs:** x/y/size encodings; legend; table + `pixel-paginator`  
**Packed:** Phase 2 `layout="pack"`.

### 6.8 Radar
**Component:** `pixel-chart-radar`  

| Mode | Phase |
|------|-------|
| `line` (basic / multi) | 1c |
| `filled` | 1c |
| `markers` | 1c |
| `target` | 1c |
| `range` | 2 |
| `threshold` | 2 |
| `polar-area` | 2 |
| multi-level axis labels | 2 |

---

## 7. Shared shell features (from every mockup card)

`pixel-chart-shell`:
- Title + description
- Actions: download → export menu (`pixel-menu`); expand → `pixel-dialog` / fullscreen; more → `pixel-menu`
- Optional legend (or auto from series)
- Optional data table (`showTable`) + collapse on narrow `@container`
- Footer slots (stats / definitions for scatter/bubble)
- Inputs: `loading`, `showSkeleton`, `emptyHeading`, `emptyDescription`, `loadingLabel`, `ariaLabel`
- Compose: `pixel-button` (icon), `pixel-loader`, `pixel-skeleton`, `pixel-empty-state`, `pixel-paginator` (bubble table)

Export pipeline:
1. PNG via ECharts `getDataURL` → `saveAs` — Phase 1a  
2. SVG via SVG renderer / helper → `saveAs` — Phase 1c  
3. Data table → `PixelExportService.exportTable` — Phase 1a (shell)  
4. PDF optional peer / print — Phase 2  

---

## 8. Phased delivery (detailed pending checklists)

### Phase 0 — Foundation spike ✅ DONE (2026-07-26)
**Goal:** Prove packaging + size + host/theme without shipping full UX.

**Pending:**
- [x] Add optional peer `echarts` (+ `peerDependenciesMeta.optional`) to `projects/pixel-ui/package.json`
- [x] Spike packaging path A: ng-packagr secondary entry `charts` **or** path B: alias like editor → **B (alias)**; secondary deferred
- [x] Record chosen path in this PLAN + library README install blurb
- [x] Wire `pixel-chart/public-api.ts` + `charts/public-api.ts` alias
- [x] Root barrel exports charts (publish) — prefer consumer import from `pixel-ui/charts`
- [x] Implement `pixel-chart-host` (init / `setOption` / resize / dispose) with `afterNextRender`
- [x] Implement `pixel-chart-theme` reading `--pixel-sys-*` (light + dark)
- [x] Modular register spike: bar + line only (`echarts/core` + charts + components + CanvasRenderer)
- [x] Measure gzip: full `echarts` vs modular bar-only vs modular line-only; fill §0 success metrics
- [x] Decision record: Canvas default; SVG for export only
- [x] Host unit tests (dispose, resize mock, no leak)
- [x] Document tree-shake rules in README draft
- [x] `npm run build` green for spike

**Exit:** packaging choice recorded; size numbers in §0; host + theme tests green.

### Phase 1a — Host + shell + cartesian core ✅ DONE (2026-07-27)
**Ship:** `pixel-chart-shell`, `pixel-chart-bar`, `pixel-chart-line`, `pixel-chart-area` (`overlay` | `stacked` | `percent`)

**Pending — infrastructure:**
- [x] Types in `pixel-chart.types.ts` (§5) exported
- [x] Shared builders + register for bar / line / area
- [x] `export/chart-image-export.ts` PNG → `saveAs`
- [x] `a11y/chart-summary.ts` + table adapter
- [x] Component tokens on shell `:host` + READMEs
- [x] `RESPONSIVE.md` rows for shell + bar + line + area
- [x] README per shipped folder
- [x] Specs + docs meta/examples for shell + bar + line + area
- [x] Full §1.6 DoD for shipped folders

**Pending — shell:** (complete — see prior checklist)

**Pending — bar:** (complete)

**Pending — line:**
- [x] Modes: straight, smooth, step
- [x] Multi-series + markers
- [x] `showValues` auto
- [x] Docs example

**Pending — area:**
- [x] Modes: overlay, stacked, percent
- [x] Smooth fill (token/palette colors)
- [x] Docs example; streamgraph deferred → Phase 2

**Exit:** §1.6 DoD for shell + bar + line + area; PNG + table export working.

### Phase 1b — Part-to-whole + KPI ✅ DONE (2026-07-27)
**Ship:** `pixel-chart-pie`, `pixel-chart-gauge` (radial, semi, linear, donut, bullet)

**Done:**
- [x] Pie modes: pie, donut, semi; center label; legend + table helpers
- [x] Gauge variants above; min/max/value footer (mockup)
- [x] Bullet range defaults use error / warning / success fallbacks
- [x] Register only pie/gauge ECharts modules (`ensurePieChart` / `ensureGaugeChart`)
- [x] Specs + docs examples matching mockups
- [x] README Behavior notes + `readme:api`
- [x] `RESPONSIVE.md` updates
- [x] Full §1.6 DoD (experimental)

**Exit:** pie + 5 gauges shippable experimental.

### Phase 1c — Correlation + multivariate ✅ DONE (2026-07-27)
**Ship:** `pixel-chart-scatter`, `pixel-chart-bubble` (cartesian), `pixel-chart-radar` (line, filled, markers, target)

**Done:**
- [x] Scatter: single + multi-series; optional trendline; `showStats` (r, R²) with N limit docs
- [x] Scatter stats footer
- [x] Bubble: x/y/size; legend helpers; table + `pixel-paginator` + “View all”
- [x] Radar: indicators API; modes line/filled/markers/target; multi-series overlay (not “stack”)
- [x] SVG image export path (`exportChartSvg` + shell menu)
- [x] Specs + docs for all three families
- [x] README + `readme:api` + `RESPONSIVE.md`
- [x] Full §1.6 DoD (experimental)
- [x] **v1 gate:** Appendix A P1 items marked done; status remains `experimental`

**Exit:** v1 chart set complete per §12.

### Phase 2 — Advanced variants & polish
**Pending:**
- [ ] Gauge: `solid`, `multi-range`, `dual`, `tick`, `vertical`
- [ ] Radar: `range`, `threshold`, `polar-area`, multi-level labels
- [ ] Area: `stream` (streamgraph) experimental
- [ ] Bubble: `layout="pack"` hierarchy
- [ ] Brush / dataZoom (line, area, scatter)
- [ ] Cross-chart sync helper / token (dashboard)
- [ ] PDF export (optional peer or print-SVG path) — no forced `jspdf` in core
- [ ] Pattern fills / textures for color-blind / high-contrast mode
- [ ] `brushEnd` event + docs
- [ ] Lint rule or CI grep: ban `from 'echarts'` full build
- [ ] Full §1.6 DoD per newly shipped variant
- [ ] Consider promoting docs status `beta` → `stable` when A11y + size budgets met

**Exit:** advanced mockup parity; PDF optional; a11y patterns.

### Phase 3 — Performance, DX, micro-charts
**Pending:**
- [ ] Progressive / sampling presets per family; document max points in README
- [ ] Docs performance page (1k / 10k points)
- [ ] Bundle size CI budgets per family (fail PR over budget)
- [ ] `source-map-explorer` / size-limit script documented
- [ ] Sparkline evaluation: custom SVG **without** ECharts vs tiny ECharts subset
- [ ] Time-series axis + `PixelDateAdapter` if needed
- [ ] Virtualized large data tables (if not done earlier)
- [ ] Optional deep entries `pixel-ui/charts/bar` if packagr supports and size wins
- [ ] Delete this `PLAN.md` when Phases 0–3 all `✅ DONE`; move lasting notes to README

**Exit:** budgets enforced; PLAN deleted.

---

## 9. Folder & docs layout

```
projects/pixel-ui/src/lib/
  pixel-chart/                    # shared core + PLAN.md
    PLAN.md
    README.md                     # install, host, theme, tree-shake rules
    pixel-chart-host.*
    pixel-chart-theme.ts
    pixel-chart.types.ts
    register/ | builders/ | export/ | a11y/

  pixel-chart-shell/
    pixel-chart-shell.ts|html|scss|spec.ts
    README.md

  pixel-chart-bar/                # …same pattern for each family…
    pixel-chart-bar.ts|html|scss|spec.ts
    README.md
  pixel-chart-line/
  pixel-chart-area/
  pixel-chart-pie/
  pixel-chart-gauge/
  pixel-chart-scatter/
  pixel-chart-bubble/
  pixel-chart-radar/

projects/docs/src/app/examples/pixel-chart-bar/   # per chart
projects/docs/src/app/registry/components/pixel-chart-bar.meta.ts
# …repeat per chart family…
```

- Charts entry (`pixel-ui/charts`) re-exports core types + shell + each chart component/types  
- Docs category: **`data-display`**; status starts **`experimental`**  
- Global theme/palette/showValues controls: **docs examples only**  
- Update `RESPONSIVE.md` **per chart** (and shell) when shipped  
- Mockup reference images stay in workspace assets — not in npm package  
- Why not one mega-folder? Tabs/stepper are tightly coupled sub-parts of one widget. Bar vs pie are **independent public components** with separate APIs, docs, and tree-shake boundaries — same as `pixel-button` vs `pixel-select`.

---

## 10. Testing strategy

| Layer | What | Phase |
|-------|------|-------|
| Unit | Pure option builders — option shape snapshots | 0+ |
| Component | Host resize/dispose/SSR guard; aria; loading/empty/skeleton | 0–1a |
| Shell | Export menus, expand focus restore, table collapse | 1a |
| Keyboard | Tab order, Escape on expand, legend toggle | 1a+ |
| A11y | Summary live region; table when `showTable`; label | 1a+ |
| Theme | Light/dark option rebuild | 0–1a |
| Visual | Docs manual vs mockups | each |
| Bundle | Size measurement → CI budgets | 0 then 3 |

Mock `ResizeObserver` / `matchMedia` / canvas if needed (vitest/jsdom).

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| ECharts full import | Review checklist + Phase 2 CI grep/lint |
| Stock ECharts look | Strict theme bridge; custom tooltip; Pixel type tokens |
| A11y gaps | Table + summary mandatory; keyboard map in README |
| API explosion | Family + mode (locked) |
| PDF weight | Optional peer; PNG/SVG first |
| Packed bubble / stream | Phase 2 only |
| Secondary entry fails in packagr | Fallback alias path (Phase 0) |
| Editor/charts peer confusion | Clear install docs per entry |
| Canvas SSR crash | `afterNextRender` only |
| Token leakage on expand | `copyPixelThemeContext` + theme-host |

---

## 12. Recommended v1 scope

**Include (Phases 0–1c):** bar/column (all modes), line (straight/smooth/step), area (overlay/stacked/percent), pie/donut/semi, gauge (radial/semi/linear/donut/bullet), scatter (+ optional stats), bubble (cartesian), radar (line/filled/markers/target), shell, PNG + table export, SVG by 1c, theme/palette/showValues, a11y table/summary.

**Defer (Phase 2+):** packed bubble, streamgraph, advanced gauges, radar range/threshold/polar-area, PDF, brush sync, pattern fills, sparklines, deep secondary entries, CI size budgets.

---

## 13. Master pending backlog (all open work)

Use this as the single checklist of **everything still pending**. Check items when done; keep phase sections (§8) as the detailed breakdown.

### Meta / process
- [ ] Approve PLAN (engine, packaging preference, family+mode API, phase cuts)
- [ ] User-approved optional peer `echarts` (this PLAN = approval)
- [ ] Phase markers `✅ DONE (date)` as each phase exits
- [ ] Delete `PLAN.md` only after Phase 3 complete

### Phase 0
- [x] Packaging spike + peerDeps + size table in §0
- [x] Host + theme + modular bar/line register
- [x] SSR-safe init + host tests + build green

### Phase 1a
- [x] Shell (actions, expand, legend, table, loading/empty/skeleton)
- [x] Bar + line + area (modes above)
- [x] PNG + tabular export; tokens; RESPONSIVE; docs; specs; README

### Phase 1b ✅
- [x] Pie (3 modes) + gauge (5 variants)
- [x] Docs/specs/README/DoD

### Phase 1c ✅
- [x] Scatter + bubble (cartesian) + radar (4 modes)
- [x] SVG export; stats/paginator; v1 gate

### Phase 2
- [ ] Remaining gauge (5) + radar (4) + stream + packed bubble
- [ ] Brush/zoom, cross-chart sync, PDF optional, pattern fills, CI import ban

### Phase 3
- [ ] Progressive presets, perf docs, size CI budgets, sparkline decision, date adapter if needed
- [ ] PLAN deletion + README lasting decisions

### Compliance (track across phases — do not skip)
- [ ] All §1.6 mechanical rules on every public component
- [ ] AGENTS UX checklist per family
- [ ] `readme:api` after API changes
- [ ] No chart symbols on root `public-api.ts`
- [ ] No hardcoded colors/spacing; logical properties; reduced motion; dark scheme
- [ ] Reuse `saveAs` / `PixelExportService` / dialog / menu / loader / skeleton / empty-state / paginator

---

## 14. Immediate next actions (after plan approval)

1. Confirm PLAN approval (or note deltas).  
2. Start **Phase 0** pending list (packaging + size + host/theme).  
3. Fill §0 size metrics from spike.  
4. Only then begin Phase 1a implementation.

---

## Appendix A — Mockup inventory checklist

### Bar / column (Phase 1a)
- [ ] Vertical single  
- [ ] Horizontal  
- [ ] Grouped  
- [ ] Stacked  
- [ ] 100% stacked  
- [ ] Column single / grouped / stacked / 100% *(same component, vertical)*  

### Line (Phase 1a)
- [ ] Single series  
- [ ] Multi-series  
- [ ] Smooth  
- [ ] Step  
- [ ] Area-line *(via area component)*  

### Area (Phase 1a / stream P2)
- [ ] Overlay  
- [ ] Stacked  
- [ ] 100% stacked  
- [ ] Streamgraph *(P2)*  

### Pie (Phase 1b) ✅
- [x] Pie
- [x] Donut
- [x] Semi-donut

### Gauge (Phase 1b / 2)
- [x] Radial *(1b)*
- [x] Semi *(1b)*
- [x] Linear *(1b)*
- [x] Donut *(1b)*
- [x] Bullet *(1b)*
- [ ] Solid *(P2)*
- [ ] Multi-range *(P2)*
- [ ] Dual *(P2)*
- [ ] Tick *(P2)*
- [ ] Vertical *(P2)*

### Scatter (Phase 1c) ✅
- [x] Simple
- [x] Multi-series
- [x] Stats footer (r, R², trend)

### Bubble (Phase 1c / 2)
- [x] Cartesian x/y/size
- [ ] Packed hierarchy *(P2)*

### Radar (Phase 1c / 2)
- [x] Basic
- [x] Multi-series
- [x] Filled
- [x] Markers
- [x] Target
- [ ] Range *(P2)*
- [ ] Thresholds *(P2)*
- [ ] Multi-level *(P2)*
- [x] Stacked-as-overlay *(document)*
- [ ] Polar area *(P2)*

### Shared chrome (Phase 1a+) ✅
- [x] Theme toggle (docs)
- [x] Palette picker (docs + input)
- [x] Show values
- [x] Download / export (PNG + SVG + CSV)
- [x] Expand
- [x] More menu
- [x] Legend
- [x] Data table
- [x] A11y footer claims verified in docs
- [x] High contrast support
- [x] Keyboard navigable
- [x] Screen reader friendly
- [x] Fully responsive

## Appendix B — Why not Plot/D3 for this UX set
Mockups require brush-ready dashboards, many gauge/radar variants, and export toolbars. ECharts delivers that with modular imports. Plot would recreate most interaction chrome. Revisit Plot only for future **sparkline** micro-charts (Phase 3) if ECharts remains too heavy for that niche.

## Appendix C — Phase 0 decisions + remaining opens
| Open item | Options | Status |
|-----------|---------|--------|
| Packaging | Secondary entry vs editor-style alias | **Alias** (secondary deferred) |
| Exact gzip budgets | Fill after measurement | **Filled** (~171 KB bar modular gzip) |
| ECharts version pin | Latest 6.x | **6.1.0** |
| Tooltip implementation | ECharts DOM tooltip styled vs custom Pixel overlay | Open → 1a |
| Legend | ECharts legend vs Pixel custom legend in shell | Open → 1a |
| True secondary entry | Revisit packagr layout | Open → Phase 2/3 |
