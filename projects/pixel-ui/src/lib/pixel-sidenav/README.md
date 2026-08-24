# pixel-sidenav

`pixel-sidenav` is a standalone Angular 21 collapsible side-navigation panel for the `pixel-ui`
library. It declares a preferred `mode` — docked (`'side'`, in-flow, reserves layout space) or
overlay (`'over'`, scrim + focus trap) — but automatically switches to `'over'` below
`autoCollapseBreakpoint` regardless of `mode`, so a desktop-docked sidenav becomes a mobile drawer
with zero extra wiring. Mode switches never destroy projected content — the same `<nav>` (or
whatever you project) stays mounted and keeps its own component state across a resize.

## Use cases

- The primary navigation of an application shell (composed inside `pixel-app-shell`).
- A filter/settings panel that should dock on desktop but overlay on mobile.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'side' \| 'over'` | `'side'` | Preferred mode; may be overridden — see `effectiveMode`. |
| `position` | `'start' \| 'end'` | `'start'` | Edge the panel is docked to / slides in from. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Width when docked — 14 / 16 / 20 rem. |
| `collapseTo` | `'hidden' \| 'rail'` | `'hidden'` | What a docked-and-closed sidenav looks like — vanish entirely, or shrink to a persistent icon-only rail. |
| `railWidth` | `number` (rem) | `4.5` | Width of the icon rail when `collapseTo="rail"`. |
| `autoCollapseBreakpoint` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'none'` | `'md'` | Below this width, `effectiveMode` is forced to `'over'`. `'none'` disables auto-collapse. |
| `dismissable` | `boolean` | `true` | Allows closing via scrim click / Escape while in overlay mode. |
| `brandBordered` | `boolean` | `true` | Bottom border on the `pixelSidenavBrand` region. Automatically suppressed when composed inside `pixel-app-shell` with a `pixel-header` present — its shared toolbar-divider already draws that line. Only takes effect for standalone usage. |
| `ariaLabel` | `string` | `''` | Accessible label (useful if the page has more than one landmark). |
| `opened` | `boolean` (two-way) | `true` | Open state. |

## Outputs

| Output | Type | Description |
| --- | --- | --- |
| `modeChange` | `output<'side' \| 'over'>` | Emits whenever the effective mode changes (e.g. crossing the breakpoint). |
| `opened` | `model<boolean>` | Two-way; also emits on every open/close. |

## Examples

```html
<pixel-sidenav mode="side" size="md" [(opened)]="navOpen">
  <nav aria-label="Primary">
    <a routerLink="/dashboard">Dashboard</a>
    <a routerLink="/settings">Settings</a>
  </nav>
</pixel-sidenav>
```

```ts
protected readonly navOpen = signal(true);
```

## Icon-rail collapse

Set `collapseTo="rail"` to keep a docked-and-closed sidenav visible as a narrow, clickable icon
strip instead of vanishing. `pixel-sidenav` only owns the panel's width — hiding your own label text
inside the rail is a CSS-only hook via the `[data-rail]` attribute it sets on its own host element
while collapsed-to-a-rail (no JS coordination, no directive to import):

```html
<pixel-sidenav collapseTo="rail" [(opened)]="navOpen">
  <a class="nav-link">
    <span class="material-symbols-outlined">dashboard</span>
    <span class="nav-link__label">Dashboard</span>
  </a>
</pixel-sidenav>
```

```scss
// In your own stylesheet:
pixel-sidenav[data-rail] .nav-link__label {
  display: none;
}
```

`pixel-app-shell` reads the sidenav's `effectiveExtentRem()` directly, so a docked rail-collapsed
sidenav still gets exactly the right amount of grid column space — no extra wiring needed there
either.

## Brand region

Project a `pixelSidenavBrand`-marked element to get a dedicated, non-scrolling header row (the
same `4rem` height and bottom border as `pixel-header`, so the two lines stay aligned when composed
inside `pixel-app-shell`) for a logo/brand mark plus an expand/collapse control. Everything else
projected (the default slot) becomes the scrolling nav/items region below it. Omit
`pixelSidenavBrand` entirely and nothing changes — no extra height or border is added.

```html
<pixel-sidenav [(opened)]="navOpen">
  <div pixelSidenavBrand>
    <span class="brand-mark">Acme</span>
    <pixel-button appearance="icon" leadingIcon="menu" (click)="navOpen.set(!navOpen())" />
  </div>
  <nav aria-label="Primary">
    <a routerLink="/dashboard">Dashboard</a>
  </nav>
</pixel-sidenav>
```

The expand/collapse toggle is not built into `pixel-sidenav` — project your own `pixel-button` (or
any element) calling `.set()` on your `opened` signal, or the component's `toggle()` method via a
template reference variable. This keeps the component free of an opinionated icon dependency.

`brandBordered` is **automatically suppressed when composed inside `pixel-app-shell` alongside a
`pixel-header`** — the shell detects both and draws a single shared divider across the header and
brand region instead, so no manual flag is needed:

```html
<pixel-app-shell>
  <pixel-header>…</pixel-header>
  <pixel-sidenav>
    <div pixelSidenavBrand>…</div>
  </pixel-sidenav>
</pixel-app-shell>
```

## Behavior notes

- Preferred `mode` (`side` / `over`) may be forced to `over` below `autoCollapseBreakpoint`; projected content stays mounted across mode switches.
- Docked closed: `collapseTo="hidden"` or `rail` (width from `railWidth`); consumers hide rail labels via `[data-rail]`.
- Overlay: scrim, focus trap, Escape/scrim dismiss when `dismissable`; reuses shared overlay primitives.
- Optional `pixelSidenavBrand` is a non-scrolling header row; expand/collapse is consumer-owned (project a button).
- `brandBordered` is suppressed automatically inside `pixel-app-shell` when a header is present.

## Accessibility

- Renders a real `<aside>` element; add your own `<nav>`/`role="navigation"` inside if the content is
  navigation (not forced, since a sidenav can hold non-nav content too).
- Overlay mode: focus moves into the panel on open, Tab cycles within it (focus trap), Escape closes
  it (when `dismissable`), and focus returns to the previously focused element on close.
- The panel gets `inert` whenever `opened` is `false` (docked-collapsed with `collapseTo="hidden"`,
  or overlay-closed), removing it from the tab order and accessibility tree without unmounting it.
  The one exception is `collapseTo="rail"`: the panel stays visible and interactive while closed, so
  its icons — and any toggle projected into `pixelSidenavBrand` — remain focusable and clickable.
- Respects `prefers-reduced-motion` (skips the slide/fade transitions).

## Theme customization

Consumes shared system tokens directly (`--pixel-sys-surface-container-low`, `--pixel-sys-on-surface`,
`--pixel-sys-outline`, `--pixel-sys-scrim`, `--pixel-sys-elevation-level1`)
— override those tokens at a `[data-theme]` ancestor rather than per-instance. `--pixel-sidenav-rail-width`
is set per-instance from the `railWidth` input. The `pixelSidenavBrand` region's border reuses the
same `color-mix(--pixel-sys-outline)` formula as the panel's own border and `pixel-divider`, so lines
stay visually consistent throughout. Its height reads `--pixel-sys-toolbar-block-size` (default
`4rem`) — the same token `pixel-header`'s bar uses — so the two always line up when composed inside
`pixel-app-shell`, even if you override the token.

## Breaking changes

None. This is a new component addition.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-sidenav` (`PixelSidenavComponent`)

Collapsible/dockable side-navigation panel. Declares a preferred `mode` — `'side'` (docked, in-flow, pushes/reserves layout space) or `'over'` (overlay, scrim, focus-trapped) — but automatically switches to `'over'` below `autoCollapseBreakpoint` regardless of `mode`, so a desktop-docked sidenav becomes a mobile drawer without any consumer wiring. Unlike `pixel-drawer` (which always relocates to `document.body` on open and never moves back), this component keeps ONE persistent template — including any projected nav content — and instead reparents its own root node between an in-flow position (docked) and the shared overlay layer (overlay), so switching modes on viewport resize never destroys/recreates projected content or its component state. It reuses the same shared overlay primitives as `pixel-drawer` (`getOverlayContainer()`, focus trap, body scroll lock) for the overlay mode. Optionally projects a `pixelSidenavBrand` slot — a non-scrolling header region (matching `pixel-header`'s 4rem height and bottom border, so the two lines align when composed inside `pixel-app-shell`) for a logo/brand mark and an expand/collapse toggle. Everything else projected (the default slot) becomes the scrolling nav/items region below it. Omitting `pixelSidenavBrand` entirely renders no extra height or border — existing simple usages are unaffected.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `PixelSidenavMode` | `'side'` | Author's declared preference; may be overridden by `autoCollapseBreakpoint` — see `effectiveMode`. |
| `position` | `PixelSidenavPosition` | `'start'` | Edge the panel is docked to / slides in from. |
| `size` | `PixelSidenavSize` | `'md'` | Width preset when docked (`'side'` / effective) — sm 14rem, md 16rem, lg 20rem. |
| `autoCollapseBreakpoint` | `PixelSidenavAutoCollapse` | `'md'` | Below this breakpoint, `effectiveMode` is forced to `'over'`. `'none'` disables auto-collapse. |
| `collapseTo` | `PixelSidenavCollapseTo` | `'hidden'` | What a docked-and-closed sidenav looks like. `'hidden'` (default) collapses to zero width. `'rail'` collapses to `railWidth` instead — a persistent icon-only rail. Purely visual: hiding label text inside the rail is the consumer's responsibility via the `[data-rail]` host attribute this component sets (e.g. `pixel-sidenav[data-rail] .my-label { display: none; }`). |
| `railWidth` | `number` | `4.5` | Width, in rem, of the icon rail when `collapseTo="rail"`. |
| `dismissable` | `boolean` | `true` | Allows closing via scrim click and Escape while in overlay mode. |
| `brandBordered` | `boolean` | `true` | Bottom border on the `pixelSidenavBrand` region (mirrors `pixel-header`'s `bordered` input). Automatically suppressed when composed inside a `pixel-app-shell` with a `pixel-header` present — its single shared toolbar-divider already draws that line, so this one would just be redundant (and can visibly double up at non-integer devicePixelRatio, where two independently-painted borders land on slightly different physical pixels). Only takes effect for standalone (non-app-shell) usage; see `effectiveBrandBordered`. |
| `ariaLabel` | `string` | `''` | Accessible label for the panel (only meaningful if the page has more than one landmark). |

**Two-way (model)**

| Model | Type | Default | Description |
| --- | --- | --- | --- |
| `opened` | `boolean` | `true` | Two-way open state. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `modeChange` | `PixelSidenavMode` | Emits whenever the effective mode changes (e.g. crossing the auto-collapse breakpoint). |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelSidenavMode` | `'side' | 'over'` |
| `PixelSidenavPosition` | `'start' | 'end'` |
| `PixelSidenavSize` | `'sm' | 'md' | 'lg'` |
| `PixelSidenavAutoCollapse` | `'sm' | 'md' | 'lg' | 'xl' | 'none'` |

<!-- API-CONTRACT:END -->
