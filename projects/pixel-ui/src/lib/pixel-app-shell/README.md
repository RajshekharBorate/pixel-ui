# pixel-app-shell

`pixel-app-shell` is a standalone Angular 21 composing layout root for the `pixel-ui` library. It
arranges a header, sidenav, main content, and footer into a full responsive CSS Grid page layout,
reactively sizing its grid column to match the projected `pixel-sidenav`'s docked/open state — no
imperative wiring required.

The sidenav spans the full block-size of the shell (top to bottom, alongside the header, content,
*and* footer rows) — it is not confined to the middle row. Header and footer only occupy the
remaining column, starting to the right of the sidenav. Put your brand mark and any nav
collapse/expand control inside `pixel-sidenav` itself (see Examples) rather than the header, since
the sidenav is the one region that's always present at full height regardless of scroll position.

## Use cases

- The top-level layout of an admin dashboard / back-office application.
- Any page that needs a persistent header + collapsible side navigation + footer arrangement.

> `pixel-app-shell` uses the classic CSS Grid "sticky footer" pattern: **use a `min-block-size`, not
> a fixed `block-size`**, on both the shell and its ancestor chain (e.g.
> `.my-shell-wrapper { min-block-size: 100vh; }`). This is a floor, not a ceiling — when content is
> short, the `1fr` content row expands to fill it, pushing the footer to the bottom of the viewport;
> when content is long, the grid grows taller than the floor instead of clipping, so the **whole
> page scrolls** and the footer lands at the true end of the content. `pixel-header`'s `sticky` input
> and the sidenav's own `position: sticky` (capped to `100vh`) keep both pinned to the viewport
> through that page-level scroll — nothing scrolls internally inside the shell itself anymore.

## Inputs

None. Layout is entirely driven by composition (see Examples) and the projected `pixel-sidenav`'s
own state.

## Examples

```html
<pixel-app-shell>
  <pixel-header sticky>
    <h1>Dashboard</h1>
    <pixel-button pixelHeaderActions appearance="icon" leadingIcon="notifications" />
  </pixel-header>

  <pixel-sidenav [(opened)]="sidenavOpen">
    <nav aria-label="Primary">
      <a routerLink="/overview">Overview</a>
      <a routerLink="/reports">Reports</a>
    </nav>
  </pixel-sidenav>

  <pixel-footer>
    <span>© 2026 Acme Inc.</span>
  </pixel-footer>

  <pixel-container>
    <router-outlet />
  </pixel-container>
</pixel-app-shell>
```

Only `pixel-header`, `pixel-sidenav`, and `pixel-footer` are matched by tag name into their grid
regions — every other projected child (typically wrapped in `pixel-container`) falls into the main
content region, which is rendered as a real `<main>` element.

When a `pixel-header` is present, `pixel-app-shell` draws a single full-width divider line at the
toolbar-height boundary (`--pixel-sys-toolbar-block-size`), spanning both the header and the
sidenav's `pixelSidenavBrand` region. This isn't just decoration — it exists because two
independently-painted elements (the header's own border and the sidenav brand's own border) can
land on different physical pixels at non-integer `devicePixelRatio` (e.g. 125% Windows display
scaling) even when their logical CSS positions are byte-identical, producing a visible hairline
misalignment. Drawing one shared line sidesteps that class of rendering artifact entirely.

The shell provides this fact — via an injected `PixelAppShellContext`, the same
`InjectionToken`-based parent/child pattern `pixel-radio-group` and `pixel-tab-nav` already use — so
the composed `pixel-header` and `pixel-sidenav` can automatically suppress their own now-redundant
`bordered`/`brandBordered`/`sticky` behavior. No manual `[bordered]="false"` coordination is needed
on your part; it happens automatically the moment they're detected inside a `pixel-app-shell`.

## Accessibility

- Renders the content region as a native `<main>` element (one landmark, no consumer setup needed).
- Landmark roles for the other regions come from the projected components themselves
  (`pixel-header`'s `<header>`, `pixel-footer`'s `<footer>`); add your own `<nav>` inside
  `pixel-sidenav` for a navigation landmark.
- Respects `prefers-reduced-motion` for the grid-column collapse transition.

## Theme customization

Purely structural — no component-local tokens. The grid column width tracks
`pixel-sidenav`'s `size` input directly.

## Breaking changes

None. This is a new component addition.
