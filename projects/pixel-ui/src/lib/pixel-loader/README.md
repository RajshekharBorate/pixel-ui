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
| `preset`    | `PixelSkeletonPreset`   | `'custom'` | `text`/`avatar`/`card`/`table`/`form`/`dashboard`/`list`. |
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
