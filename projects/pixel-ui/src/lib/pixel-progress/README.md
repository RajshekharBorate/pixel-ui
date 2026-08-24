# pixel-progress

An enterprise-grade, accessible, animated and themeable progress system for Angular 21
(standalone, signals, OnPush). It mirrors the flexibility of Angular Material's progress
components while adding multi-segment bars, threshold colors, milestones, circular gauges,
and dashboard widgets.

For multi-step workflows, use [`pixel-stepper`](../pixel-stepper/README.md) instead of a
separate progress stepper.

## Components

| Component                   | Selector                 | Purpose                                            |
| --------------------------- | ------------------------ | -------------------------------------------------- |
| `PixelProgressBarComponent` | `pixel-progress-bar`     | Linear bar: determinate, indeterminate, buffer, query, multi-segment, milestones, thresholds |
| `PixelProgressCircleComponent` | `pixel-progress-circle` | SVG circular / radial gauge with spinner |
| `PixelProgressContainerComponent` | `pixel-progress-container` | Dashboard / KPI card shell that wraps any indicator |

All components are `default` exports and re-exported from the library's `public-api`.

## Progress types

- **linear** — horizontal fill bar (the default).
- **circular / radial** — SVG ring gauge.
- **step** — use `pixel-stepper` for workflow / wizard flows.
- **buffer** — primary fill plus a secondary buffer track (streaming / preload).
- **query** — reverse indeterminate sweep used before measurable progress begins.
- **indeterminate** — animated sweep when progress is unknown.
- **multi-segment / stacked** — one bar split into themed category slices.
- **dashboard** — KPI cards built from `pixel-progress-container` + a bar/gauge.

## Progress states (`status`)

`default` · `success` · `warning` · `error` · `info` · `paused` · `loading` ·
`completed` · `cancelled`

Status drives the fill color via the shared `--pixel-progress-fill` variable and is reached
automatically at 100% (`completed`) or via `thresholds`.

## Quick start

```ts
import {
  PixelProgressBarComponent,
  PixelProgressCircleComponent,
  PixelProgressContainerComponent,
} from 'pixel-ui';
```

```html
<pixel-progress-bar [value]="75" showLabel showPercentage label="Uploading" />
<pixel-progress-circle [value]="75" size="lg" showPercentage />
```

## Inputs

### `pixel-progress-bar`

| Input | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `value` | `number` | `0` | Current value within `[min, max]`. |
| `min` / `max` | `number` | `0` / `100` | Value range bounds. |
| `buffer` | `number` | `0` | Secondary buffer value (`mode="buffer"`). |
| `mode` | `'determinate' \| 'indeterminate' \| 'buffer' \| 'query'` | `'determinate'` | Determinacy mode. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Density / thickness. |
| `variant` | `'solid' \| 'striped' \| 'pulse'` | `'solid'` | Fill treatment. |
| `status` | `PixelProgressStatus` | `'default'` | Explicit semantic status. |
| `animated` | `boolean` | `true` | Enables fill / stripe motion. |
| `striped` / `pulse` | `boolean` | `false` | Shorthand aliases for `variant="striped"` / `variant="pulse"`. |
| `showLabel` / `showPercentage` / `showValue` / `showStatus` | `boolean` | `false` | Label-row toggles. |
| `showMilestones` | `boolean` | `false` | Render milestone markers. |
| `label` | `string` | `''` | Free-text label. |
| `segments` | `PixelProgressSegment[]` | `[]` | Multi-segment slices. |
| `thresholds` | `PixelProgressThreshold[]` | `[]` | Value-band → status colors. |
| `milestones` | `PixelProgressMilestone[]` | `[]` | Track checkpoints. |
| `indeterminate` / `loading` | `boolean` | `false` | Indeterminate / loading shortcuts. |
| `color` | `string` | `''` | Custom fill color override. |
| `className` / `ariaLabel` | `string` | `''` | Extra classes / a11y label. |

### `pixel-progress-circle`

| Input | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `value` / `min` / `max` | `number` | `0` / `0` / `100` | Value + range. |
| `size` | `PixelProgressSize` | `'md'` | Sets the diameter. |
| `diameter` | `number` (px) | `0` | Explicit diameter override. |
| `strokeWidth` | `number` (px) | `8` | Ring thickness. |
| `status` | `PixelProgressStatus` | `'default'` | Explicit semantic status. |
| `thresholds` | `PixelProgressThreshold[]` | `[]` | Value-band colors. |
| `showLabel` / `showPercentage` | `boolean` | `true` / `false` | Centered text. |
| `label` | `string` | `''` | Centered caption. |
| `indeterminate` | `boolean` | `false` | Spinner mode. |
| `color` / `className` / `ariaLabel` | `string` | `''` | Overrides. |

### `pixel-progress-container`

`title`, `subtitle`, `icon`, `value`, `status`, `showStatus`,
`layout` (`'card' \| 'inline' \| 'tile'`), `className`. Projects any indicator via `<ng-content>`.

## Outputs

| Component | Output | Payload | Fires when |
| --------- | ------ | ------- | ---------- |
| bar | `completed` | `PixelProgressCompleteEvent` | Value first reaches 100%. |
| bar | `valueChange` | `PixelProgressChangeEvent` | Value changes. |
| bar | `statusChange` | `PixelProgressStatus` | Resolved status changes. |
| bar | `milestoneReached` | `PixelProgressMilestoneEvent` | Each milestone is first crossed. |

The bar also exposes imperative methods: `setValue`, `increment`, `decrement`, `reset`, `complete`.

## Upload progress example

```html
<pixel-progress-container
  title="project-assets.zip"
  icon="folder_zip"
  [value]="percent() + '%'"
  [status]="status()"
  showStatus
>
  <pixel-progress-bar
    [value]="percent()"
    [status]="status()"
    variant="striped"
    showPercentage
  />
</pixel-progress-container>
```

Compose upload-specific meta (speed, ETA, elapsed) in your template — use the exported
`formatProgressBytes()` / `formatProgressDuration()` helpers when needed.

Drive progress from your own state or an `XMLHttpRequest`:

```ts
xhr.upload.onprogress = (e) => {
  this.percent.set((e.loaded / e.total) * 100);
};
xhr.onload = () => this.status.set('completed');
```

## Circular progress example

```html
<pixel-progress-circle
  [value]="usage()"
  size="lg"
  [strokeWidth]="10"
  [thresholds]="[
    { from: 0, status: 'success' },
    { from: 61, status: 'warning' },
    { from: 81, status: 'error' }
  ]"
  showPercentage
  label="Storage"
/>

<!-- Indeterminate spinner -->
<pixel-progress-circle indeterminate ariaLabel="Loading" />
```

## Behavior notes

- Status drives fill via `--pixel-progress-fill`; 100% resolves to `completed`, or use `thresholds` for value-band colors.
- Modes: determinate / indeterminate / buffer / query; multi-segment bars size slices proportionally to `max`.
- `striped` / `pulse` and `animated` control motion; all motion disables under `prefers-reduced-motion`.
- Workflow / wizard steps belong on `pixel-stepper`, not progress.
- Bar emits `completed` once at 100%, plus `valueChange`, `statusChange`, and `milestoneReached`.

## Accessibility

- Every bar/gauge renders `role="progressbar"` with `aria-valuemin`, `aria-valuemax`,
  `aria-valuenow` and a descriptive `aria-valuetext` (e.g. _"75 percent, Completed"_).
- Indeterminate / query modes drop `aria-valuenow` and set `aria-busy="true"`.
- All decorative glyphs and markers are `aria-hidden`. Colors resolve from the design tokens,
  which meet ≥ 4.5:1 contrast in both light and dark schemes — status is never color-only
  (icons + text labels accompany it).

## Theme customization

Override any `--pixel-progress-*` custom property on the host or an ancestor — colors are
never hardcoded and default to the global `--pixel-sys-*` tokens:

```css
--pixel-progress-track
--pixel-progress-fill
--pixel-progress-buffer
--pixel-progress-success | --pixel-progress-warning | --pixel-progress-error | --pixel-progress-info
--pixel-progress-text | --pixel-progress-label | --pixel-progress-muted
--pixel-progress-border | --pixel-progress-shadow | --pixel-progress-focus-ring
--pixel-progress-thickness | --pixel-progress-radius
```

Dark mode is automatic via `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.
Per-instance overrides:

```html
<pixel-progress-bar [value]="60" color="#7c3aed" />
<pixel-progress-bar [value]="60" style="--pixel-progress-track: #1f2937" />
```

## Animation customization

Built-in motion: fill transitions, striped scroll, luminous `pulse` shimmer, indeterminate / query
sweeps and circular rotation. Toggle with `animated`, `variant`, `striped`, or `pulse`.
All motion is disabled under `@media (prefers-reduced-motion: reduce)`.

## Migration notes

Coming from Angular Material's `mat-progress-bar` / `mat-progress-spinner`:

- `mode` maps 1:1 (`determinate` / `indeterminate` / `buffer` / `query`).
- `<mat-progress-bar [value]>` → `<pixel-progress-bar [value]>` (add `[max]` if not 100).
- `<mat-progress-spinner [value] [diameter] [strokeWidth]>` →
  `<pixel-progress-circle [value] [diameter] [strokeWidth] showPercentage>`.
- `mat-step` flows → `pixel-stepper` with projected `pixel-step` children.
- New capabilities with no Material equivalent: `segments`, `thresholds`, `milestones`.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-progress-bar` (`PixelProgressBarComponent`)

Enterprise-grade, accessible, animated linear progress bar. Covers the full Angular-Material-style mode matrix (determinate, indeterminate, buffer, query) plus multi-segment/stacked fills, threshold-driven status colors, milestone markers, striped/pulse variants. State is derived entirely from signals; the public API uses `input()` / `output()` only — no two-way binding, no `ngOnChanges`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | `0` |  |
| `min` | `number` | `0` |  |
| `max` | `number` | `100` |  |
| `buffer` | `number` | `0` |  |
| `mode` | `PixelProgressMode` | `'determinate'` |  |
| `size` | `PixelProgressSize` | `'md'` |  |
| `variant` | `PixelProgressVariant` | `'solid'` |  |
| `status` | `PixelProgressStatus` | `'default'` |  |
| `animated` | `boolean` | `true` |  |
| `striped` | `boolean` | `false` |  |
| `pulse` | `boolean` | `false` |  |
| `showLabel` | `boolean` | `false` |  |
| `showPercentage` | `boolean` | `false` |  |
| `showValue` | `boolean` | `false` |  |
| `showStatus` | `boolean` | `false` |  |
| `showMilestones` | `boolean` | `false` |  |
| `label` | `string` | `''` |  |
| `segments` | `readonly PixelProgressSegment[]` | `[]` |  |
| `thresholds` | `readonly PixelProgressThreshold[]` | `[]` |  |
| `milestones` | `readonly PixelProgressMilestone[]` | `[]` |  |
| `indeterminate` | `boolean` | `false` |  |
| `showSkeleton` | `boolean` | `false` | When true, replaces the bar with a skeleton placeholder. |
| `loading` | `boolean` | `false` |  |
| `color` | `string` | `''` |  |
| `className` | `string` | `''` |  |
| `ariaLabel` | `string` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `completed` | `PixelProgressCompleteEvent` | Emitted once when progress first reaches 100%. |
| `valueChange` | `PixelProgressChangeEvent` | Emitted on every value change. |
| `milestoneReached` | `PixelProgressMilestoneEvent` | Emitted the first time each milestone is reached. |
| `statusChange` | `PixelProgressStatus` | Emitted when the resolved status changes. |

### Component `pixel-progress-circle` (`PixelProgressCircleComponent`)

SVG-based circular / radial progress indicator (gauge). Renders a determinate ring driven by stroke-dasharray, an indeterminate spinner and a centered percentage / custom label. Sizing is token-driven and the geometry is fully derived from signals. Public API is `input()`-only.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | `0` |  |
| `min` | `number` | `0` |  |
| `max` | `number` | `100` |  |
| `showSkeleton` | `boolean` | `false` | When true, replaces the circle with a skeleton ring placeholder. |
| `size` | `PixelProgressSize` | `'md'` |  |
| `diameter` | `number` | `0` |  |
| `strokeWidth` | `number` | `8` |  |
| `status` | `PixelProgressStatus` | `'default'` |  |
| `thresholds` | `readonly PixelProgressThreshold[]` | `[]` |  |
| `showLabel` | `boolean` | `true` |  |
| `showPercentage` | `boolean` | `false` |  |
| `label` | `string` | `''` |  |
| `indeterminate` | `boolean` | `false` |  |
| `color` | `string` | `''` |  |
| `className` | `string` | `''` |  |
| `ariaLabel` | `string` | `''` |  |

### Component `pixel-progress-container` (`PixelProgressContainerComponent`)

Dashboard / KPI widget shell for a progress indicator. Provides themed card chrome (title, subtitle, icon, optional trailing value + status pill) around any projected progress component — a `pixel-progress-bar`, `pixel-progress-circle` or custom content. Purely presentational and signal-driven; compose it to build storage cards, upload panels and workflow widgets.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `''` |  |
| `subtitle` | `string` | `''` |  |
| `icon` | `string` | `''` |  |
| `value` | `string` | `''` |  |
| `status` | `PixelProgressStatus` | `'default'` |  |
| `showStatus` | `boolean` | `false` |  |
| `layout` | `PixelProgressContainerLayout` | `'card'` |  |
| `className` | `string` | `''` |  |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelProgressContainerLayout` | `'card' | 'inline' | 'tile'` |
| `PixelProgressType` | `| 'linear' | 'circular' | 'step' | 'buffer' | 'query' | 'indeterminate' | 'multi-segment' | 'stacked' | 'dashboard' | 'radial'` |
| `PixelProgressMode` | `'determinate' | 'indeterminate' | 'buffer' | 'query'` |
| `PixelProgressStatus` | `| 'default' | 'success' | 'warning' | 'error' | 'info' | 'paused' | 'loading' | 'completed' | 'cancelled'` |
| `PixelProgressSize` | `'xs' | 'sm' | 'md' | 'lg' | 'xl'` |
| `PixelProgressVariant` | `'solid' | 'striped' | 'pulse'` |
| `PixelProgressOrientation` | `'horizontal' | 'vertical'` |

### Exported interfaces

**`PixelProgressSegment`** — One slice of a multi-segment (stacked) progress bar. Segment values are summed and each slice is sized proportionally to the bar's `max`.

```ts
interface PixelProgressSegment {
  readonly label: string;
  readonly value: number;
  readonly color?: string;
  readonly status?: PixelProgressStatus;
  readonly tooltip?: string;
}
```

**`PixelProgressSegmentView`** — A precomputed, render-ready segment (internal view-model).

```ts
interface PixelProgressSegmentView {
  readonly percent: number;
  readonly offset: number;
  readonly resolvedColor: string;
}
```

**`PixelProgressThreshold`** — Threshold band mapping a value range to a status color. When `thresholds` are supplied the bar's active color is derived from the band the current value falls into, e.g. `[{ from: 0, status: 'success' }, { from: 61, status: 'warning' }, { from: 81, status: 'error' }]`.

```ts
interface PixelProgressThreshold {
  readonly from: number;
  readonly status: PixelProgressStatus;
  readonly color?: string;
  readonly label?: string;
}
```

**`PixelProgressMilestone`** — A marker rendered along the track at a fixed percentage (e.g. `\|25%\|50%\|75%\|`).

```ts
interface PixelProgressMilestone {
  readonly at: number;
  readonly label?: string;
  readonly tooltip?: string;
}
```

**`PixelProgressMilestoneView`** — A milestone augmented with its reached/unreached state (internal view-model).

```ts
interface PixelProgressMilestoneView {
  readonly reached: boolean;
}
```

**`PixelProgressCompleteEvent`** — Payload emitted when progress reaches 100% (`completed` output).

```ts
interface PixelProgressCompleteEvent {
  readonly value: number;
  readonly percentage: number;
}
```

**`PixelProgressChangeEvent`** — Payload emitted on every value change (`valueChange` output).

```ts
interface PixelProgressChangeEvent {
  readonly value: number;
  readonly percentage: number;
  readonly status: PixelProgressStatus;
}
```

**`PixelProgressMilestoneEvent`** — Payload emitted the first time a milestone is reached (`milestoneReached` output).

```ts
interface PixelProgressMilestoneEvent {
  readonly at: number;
  readonly label?: string;
}
```

<!-- API-CONTRACT:END -->
