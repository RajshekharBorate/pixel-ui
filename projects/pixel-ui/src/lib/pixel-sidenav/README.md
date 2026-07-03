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
`--pixel-sys-outline`, `--pixel-sys-scrim`, `--pixel-sys-scrim-blur`, `--pixel-sys-elevation-level1`)
— override those tokens at a `[data-theme]` ancestor rather than per-instance. `--pixel-sidenav-rail-width`
is set per-instance from the `railWidth` input. The `pixelSidenavBrand` region's border reuses the
same `color-mix(--pixel-sys-outline)` formula as the panel's own border and `pixel-divider`, so lines
stay visually consistent throughout. Its height reads `--pixel-sys-toolbar-block-size` (default
`4rem`) — the same token `pixel-header`'s bar uses — so the two always line up when composed inside
`pixel-app-shell`, even if you override the token.

## Breaking changes

None. This is a new component addition.
