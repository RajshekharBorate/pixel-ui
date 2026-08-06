# pixel-loader

An enterprise-grade, accessible, animated loading system for Angular 21 (standalone, signals,
`OnPush`). It ships three components, a global loading service, an HTTP interceptor and a router
integration helper — all themed through CSS custom properties with full light/dark support.

## Components

| Selector                   | Export                            | Purpose                                            |
| -------------------------- | --------------------------------- | -------------------------------------------------- |
| `pixel-loader`             | `PixelLoaderComponent`            | Animated indicator + text/description              |
| `pixel-skeleton`           | `PixelSkeletonComponent`          | Content placeholders & layout presets              |
| `pixel-loading-container`  | `PixelLoadingContainerComponent`  | Section / overlay / fullscreen loading wrapper     |

Supporting API: `PixelLoadingService`, `pixelLoadingInterceptor` (+ `PIXEL_LOADING_CONFIG`),
`providePixelRouteLoading`, plus helpers (`smartLoaderType`, …).

## Loader types

`spinner` · `dots` · `pulse` · `ring` · `wave` · `bars` · `bounce` ·
`skeleton` · `shimmer` · `overlay` · `custom`

## `pixel-loader` inputs

| Input          | Type                 | Default     | Description                                            |
| -------------- | -------------------- | ----------- | ----------------------------------------------------- |
| `loading`      | `boolean`            | `true`      | Active flag; honours `showDelay` / `minDuration`.     |
| `type`         | `PixelLoaderType`    | `'spinner'` | Animated indicator style.                             |
| `size`         | `PixelLoaderSize`    | `'md'`      | `xs`–`xl` density scale.                              |
| `text`         | `string`             | `''`        | Primary loading label (announced).                    |
| `description`  | `string`             | `''`        | Secondary description.                                |
| `centered`     | `boolean`            | `false`     | Center within the container.                          |
| `animated`     | `boolean`            | `true`      | Animate the indicator.                                |
| `showDelay`    | `number`             | `0`         | ms before appearing (anti-flash).                     |
| `minDuration`  | `number`             | `0`         | ms to stay visible once shown (anti-flicker).         |
| `ariaLabel`    | `string`             | `''`        | Accessible label override.                            |
| `className`    | `string`             | `''`        | Extra static classes.                                 |

### `pixel-loader` outputs

| Output             | Payload                       | Fires when…                              |
| ------------------ | ----------------------------- | ---------------------------------------- |
| `visibilityChange` | `PixelLoaderVisibilityEvent`  | Resolved visibility flips.               |

## `pixel-skeleton` inputs

| Input       | Type                    | Default    | Description                                   |
| ----------- | ----------------------- | ---------- | --------------------------------------------- |
| `preset`    | `PixelSkeletonPreset`   | `'custom'` | `text`/`avatar`/`card`/`chart`/`table`/`form`/`dashboard`/`list`. |
| `shape`     | `PixelSkeletonShape`    | `'text'`   | Geometry for `custom` blocks.                 |
| `animation` | `PixelSkeletonAnimation`| `'shimmer'`| `shimmer`/`pulse`/`wave`/`none`.              |
| `lines`     | `number`                | `0`        | Repeat count for text/custom.                 |
| `width`/`height` | `string`           | `''`       | Explicit block dimensions.                    |
| `rows`/`columns` | `number`           | `4`        | Grid size for `table`/`dashboard`/`list`.     |
| `rounded`   | `boolean`               | `false`    | Round custom rect corners.                    |

> `pixel-skeleton` is `aria-hidden` — pair it with a `role="status"` region/`pixel-loader`.

## `pixel-loading-container` inputs

`loading`, `scope` (`inline`/`section`/`overlay`/`fullscreen`), `type`, `size`,
`text`, `description`, `blur`, `dim`, `lockInteraction`,
`showDelay`, `minDuration`, `className`. Fullscreen mode locks `body` scroll.

**Defaults:** `pixel-loader` size defaults to `md`; **`pixel-loading-container` size defaults to
`lg`** so section/overlay chrome reads as primary busy state. Both accept `xl` in addition to the
control scale (CONVENTIONS §3b).

## Loading service

```ts
private loading = inject(PixelLoadingService);

const id = this.loading.start({ message: 'Saving…', scope: 'http' });
// … later
this.loading.stop(id);

// Or auto start/stop around a promise:
await this.loading.track(this.api.load(), { message: 'Loading' });
```

Signals: `active()`, `count()`, `progress()` (aggregate determinate %), `message()`,
`activeTasks()`, `isLoading(scope?)`. Duplicate ids are reference-counted; `setProgress(id, %)`
drives determinate bars; `onChange(cb)` is an analytics hook; `reset()` clears everything.

## HTTP interceptor

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { pixelLoadingInterceptor, PIXEL_LOADING_CONFIG } from 'pixel-ui';

providers: [
  provideHttpClient(withInterceptors([pixelLoadingInterceptor])),
  { provide: PIXEL_LOADING_CONFIG, useValue: { exclude: ['/api/heartbeat'] } },
]
```

Shows/hides the global loader per request and forwards upload/download progress. Opt a single
request out with the skip header: `req.clone({ setHeaders: { 'X-Pixel-Skip-Loading': '1' } })`.

## Router integration

```ts
providers: [provideRouter(routes), providePixelRouteLoading({ message: 'Loading page…' })]
```

Drives the loader on `NavigationStart` → `NavigationEnd`/`Cancel`/`Error` (covers lazy modules).
Bind a global overlay to `loading.isLoading('route')`.

## Accessibility (WCAG AA)

- `pixel-loader` is `role="status"` with `aria-live="polite"` and `aria-busy` while loading.
- Animations honour `@media (prefers-reduced-motion: reduce)`.
- Skeletons are hidden from assistive tech; the live region carries the announcement.
- All colors come from theme tokens (contrast ≥ 4.5:1 against their surfaces).

## Theme customization

Override any `--pixel-loader-*` custom property on a host or ancestor (overlay defaults match
`--pixel-sys-scrim` — the same scrim dialog and drawer use):

```css
.brand-loader {
  --pixel-loader-spinner: var(--pixel-sys-primary);
  --pixel-loader-overlay: color-mix(in srgb, #000 56%, transparent);
}
```

Tokens: `--pixel-loader-bg`, `-overlay`, `-spinner`, `-track`, `-text`, `-description`,
`-skeleton`, `-shimmer`, `-focus-ring`, `-surface`, `-border`,
plus density tokens. Dark mode is automatic via `@media (prefers-color-scheme: dark)`
and `[data-theme="dark"]`.

## Migration notes

- Replaces ad-hoc spinners and `*ngIf="loading"` blocks. Swap a manual spinner for
  `<pixel-loader type="spinner" text="…" />`; wrap a card in `<pixel-loading-container>` instead
  of toggling a bespoke overlay.
- Coming from Angular Material `MatProgressSpinner`: `mode="indeterminate"` maps to the default
  `spinner` type. For determinate linear progress use `pixel-progress-bar` instead.
  The `PixelLoadingService` replaces hand-rolled boolean loading flags and centralizes
  multi-request tracking.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-loader` (`PixelLoaderComponent`)

Enterprise-grade animated loading indicator. A single signal-driven, `OnPush`, standalone component that renders animated loader styles (`spinner`, `dots`, `pulse`, `ring`, `wave`, `bars`, `bounce`, …), five sizes. It supports anti-flicker display logic (`showDelay` + `minDuration`), optional loading text/description and full WCAG-AA `role="status"` / `aria-live` semantics. Colors come entirely from the `--pixel-loader-*` theme contract — nothing is hardcoded. For full-screen / section overlays compose it inside `pixel-loading-container`; for skeleton placeholders use `pixel-skeleton`; for app-wide HTTP/route loading wire up `PixelLoadingService` + `pixelLoadingInterceptor`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `loading` | `boolean` | `true` |  |
| `type` | `PixelLoaderType` | `'spinner'` |  |
| `size` | `PixelLoaderSize` | `'md'` |  |
| `text` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `centered` | `boolean` | `false` |  |
| `animated` | `boolean` | `true` |  |
| `showDelay` | `number` | `0` |  |
| `minDuration` | `number` | `0` |  |
| `ariaLabel` | `string` | `''` |  |
| `className` | `string` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `visibilityChange` | `PixelLoaderVisibilityEvent` | Emits whenever the resolved visibility changes (after delay / min-duration are applied). |

### Component `pixel-loading-container` (`PixelLoadingContainerComponent`)

Overlay / section / fullscreen loading wrapper. Wraps projected content and, while `loading` is true, draws a themed backdrop with a centered `PixelLoaderComponent` on top. Choose the `scope` to control footprint (`inline` ▸ `section` ▸ `overlay` ▸ `fullscreen`), optionally `blur` / `dim` the content behind it and `lockScroll` to block interaction. Composes the base loader rather than re-implementing it, so every loader `type` and the anti-flicker `showDelay` / `minDuration` logic are available here too. Fullscreen mode locks `body` scrolling for as long as it is shown.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `loading` | `boolean` | `false` |  |
| `scope` | `PixelLoaderScope` | `'section'` |  |
| `type` | `PixelLoaderType` | `'spinner'` |  |
| `size` | `PixelLoaderSize` | `'lg'` |  |
| `text` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `blur` | `boolean` | `false` |  |
| `dim` | `boolean` | `true` |  |
| `lockInteraction` | `boolean` | `true` |  |
| `showDelay` | `number` | `0` |  |
| `minDuration` | `number` | `0` |  |
| `className` | `string` | `''` |  |

### Component `pixel-skeleton` (`PixelSkeletonComponent`)

Content-placeholder (skeleton) loader. Renders shimmer/pulse/wave placeholder surfaces while real content streams in. Drive it with a low-level `shape` + `lines` configuration, or pick a high-level `preset` (`text`, `avatar`, `card`, `chart`, `table`, `form`, `dashboard`, `list`) to stamp out a ready-made layout. For `preset="chart"`, set `chartVariant` to match the plot family (`bar`, `line`, `pie`, …). Geometry is fully signal-derived and colors come from the `--pixel-loader-*` theme contract. Honors `prefers-reduced-motion` and is hidden from assistive tech (`aria-hidden`) since the surrounding region already exposes a `role="status"` loader.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `preset` | `PixelSkeletonPreset` | `'custom'` |  |
| `chartVariant` | `PixelSkeletonChartVariant` | `'bar'` |  |
| `chartBarMode` | `PixelSkeletonChartBarMode` | `'grouped'` |  |
| `chartBarOrientation` | `PixelSkeletonChartBarOrientation` | `'vertical'` |  |
| `chartBarLayout` | `PixelSkeletonBarLayout | null` | `null` |  |
| `chartPieMode` | `PixelSkeletonChartPieMode` | `'donut'` |  |
| `chartBubbleLayout` | `'cartesian' | 'pack'` | `'cartesian'` |  |
| `chartPathMode` | `'straight' | 'smooth' | 'step'` | `'straight'` |  |
| `chartPathLayout` | `PixelSkeletonPathLayout | null` | `null` |  |
| `chartPieLayout` | `PixelSkeletonPieLayout | null` | `null` |  |
| `chartPointsLayout` | `PixelSkeletonPointsLayout | null` | `null` |  |
| `chartRadarLayout` | `PixelSkeletonRadarLayout | null` | `null` |  |
| `chartMapLayout` | `PixelSkeletonMapLayout | null` | `null` |  |
| `shape` | `PixelSkeletonShape` | `'text'` |  |
| `animation` | `PixelSkeletonAnimation` | `'shimmer'` |  |
| `lines` | `number` | `0` |  |
| `width` | `string` | `''` |  |
| `height` | `string` | `''` |  |
| `rows` | `number` | `4` |  |
| `columns` | `number` | `4` |  |
| `rounded` | `boolean` | `false` |  |
| `className` | `string` | `''` |  |
| `borderRadius` | `string` | `''` |  |

### Service `PixelLoadingService`

Global, signal-based loading state coordinator — the backbone for app-wide HTTP, route, upload/download and feature loading. Designed to be consumed by `PixelLoadingInterceptor`, router event handlers and feature code alike. Tracks any number of concurrent tasks keyed by id; the derived `active` / `count` / `progress` signals stay correct as tasks start and finish in any order. Reference-counts duplicate ids so overlapping requests to the same key don't end loading prematurely. Inject it anywhere (`providedIn: 'root'`): ```ts private loading = inject(PixelLoadingService); async save() { const id = this.loading.start({ message: 'Saving…', scope: 'http' }); try { await this.api.save(); } finally { this.loading.stop(id); } } ``` Or wrap a promise so start/stop are automatic: ```ts const result = await this.loading.track(this.api.load(), { message: 'Loading' }); ```

| Method | Signature | Description |
| --- | --- | --- |
| `isLoading` | `isLoading(scope?: string): boolean` | Per-scope active flag, e.g. `isLoading('upload')`. Omit the scope for the global flag. |
| `start` | `start(options: PixelLoadingStartOptions = {}, id?: string): string` | Register a loading task. Returns the resolved id (generated when not supplied) which must be passed to `stop`. Calling `start` again with the same id increments a reference count instead of duplicating the task. |
| `setProgress` | `setProgress(id: string, progress: number): void` | Update the determinate progress (0–100) of an in-flight task. No-op for unknown ids. Used by upload/download handlers to drive a determinate bar. |
| `setMessage` | `setMessage(id: string, message: string): void` | Update the message of an in-flight task. No-op for unknown ids. |
| `stop` | `stop(id: string): void` | Mark a task finished. Decrements the reference count; the task is only removed once every matching `start` has been stopped. No-op for unknown ids. |
| `reset` | `reset(): void` | Force-clear every task (e.g. on navigation cancel / global reset). |
| `track` | `track(work: Promise<T>, options: PixelLoadingStartOptions = {}): Promise<T>` | Wrap a promise so the loading task is started before it runs and stopped when it settles (resolve *or* reject). Returns the original promise's result. |
| `onChange` | `onChange(hook: (snapshot: PixelLoadingSnapshot) => void): void` | Register an analytics hook fired with a fresh snapshot on every change. |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelLoaderType` | `| 'spinner' | 'dots' | 'pulse' | 'ring' | 'wave' | 'bars' | 'bounce' | 'skeleton' | 'shimmer' | 'overlay' | 'custom'` |
| `PixelLoaderSize` | `'xs' | 'sm' | 'md' | 'lg' | 'xl'` |
| `PixelLoaderScope` | `'inline' | 'section' | 'overlay' | 'fullscreen'` |
| `PixelSkeletonPreset` | `| 'text' | 'avatar' | 'card' | 'chart' | 'table' | 'form' | 'dashboard' | 'list' | 'custom'` |
| `PixelSkeletonChartVariant` | `| 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'bubble' | 'radar' | 'gauge' | 'map'` |
| `PixelSkeletonChartBarMode` | `'single' | 'grouped' | 'stacked' | 'percent'` |
| `PixelSkeletonChartBarOrientation` | `'vertical' | 'horizontal'` |
| `PixelSkeletonBarCategoryLayout` | `{ /** Per visible-series size, or stack segment weights. */ readonly sizes: readonly number[]; /** Stack extent % of the value axis (`stacked` / `percent` only). */ readonly extentPercent?: number; }` |
| `PixelSkeletonBarLayout` | `{ readonly categories: readonly PixelSkeletonBarCategoryLayout[]; /** Matches facade `barMaxWidth` (px). */ readonly barMaxWidthPx: number; }` |
| `PixelSkeletonPathPoint` | `{ readonly x: number; readonly y: number; }` |
| `PixelSkeletonPathSeries` | `{ readonly points: readonly PixelSkeletonPathPoint[]; }` |
| `PixelSkeletonPathLayout` | `{ readonly series: readonly PixelSkeletonPathSeries[]; /** When true, close each path to the baseline (area fill). */ readonly filled: boolean; /** Line interpolation (`step` draws horizontal–vertical elbows). */ readonly mode?: 'straight' | 'smooth' | 'step'; }` |
| `PixelSkeletonChartPieMode` | `'pie' | 'donut' | 'semi'` |
| `PixelSkeletonPieLayout` | `{ readonly segments: readonly number[]; readonly mode: PixelSkeletonChartPieMode; }` |
| `PixelSkeletonPointMarker` | `{ /** 0–100 along the category / X axis (or pack canvas). */ readonly x: number; /** 0–100 from the top of the plot (CSS inset). */ readonly y: number; /** Bubble diameter as 0–100 of max size (scatter omits → fixed). */ readonly size?: number; }` |
| `PixelSkeletonPointsLayout` | `{ readonly points: readonly PixelSkeletonPointMarker[]; readonly kind: 'scatter' | 'bubble' | 'pack'; }` |
| `PixelSkeletonRadarLayout` | `{ readonly series: readonly { readonly radii: readonly number[] }[]; readonly indicatorCount: number; }` |
| `PixelSkeletonMapLayout` | `{ readonly intensities: readonly number[]; }` |
| `PixelSkeletonShape` | `'text' | 'circle' | 'rect' | 'rounded'` |
| `PixelSkeletonAnimation` | `'shimmer' | 'pulse' | 'wave' | 'none'` |

### Exported interfaces

**`PixelLoaderVisibilityEvent`** — Emitted by `pixel-loader` whenever its resolved visibility flips (after delay/min-duration).

```ts
interface PixelLoaderVisibilityEvent {
  readonly visible: boolean;
}
```

**`PixelLoadingTask`** — A single tracked async/HTTP operation inside the `PixelLoadingService`.

```ts
interface PixelLoadingTask {
  readonly id: string;
  readonly message?: string;
  readonly progress: number | null;
  readonly startedAt: number;
  readonly scope?: string;
}
```

**`PixelRouteLoadingOptions`** — Options for `providePixelRouteLoading`.

```ts
interface PixelRouteLoadingOptions {
  readonly message?: string;
  readonly scope?: string;
}
```

**`PixelLoadingInterceptorConfig`** — Configuration for `pixelLoadingInterceptor`, provided via `PIXEL_LOADING_CONFIG`.

```ts
interface PixelLoadingInterceptorConfig {
  readonly exclude?: readonly (string | RegExp)[];
  readonly skipHeader?: string;
  readonly scope?: string;
  readonly trackProgress?: boolean;
}
```

**`PixelLoadingStartOptions`** — Options accepted when registering a task with `PixelLoadingService.start`.

```ts
interface PixelLoadingStartOptions {
  readonly message?: string;
  readonly progress?: number;
  readonly scope?: string;
}
```

**`PixelLoadingSnapshot`** — Snapshot consumed by analytics hooks whenever the active task set changes.

```ts
interface PixelLoadingSnapshot {
  readonly active: boolean;
  readonly count: number;
  readonly progress: number | null;
}
```

<!-- API-CONTRACT:END -->
