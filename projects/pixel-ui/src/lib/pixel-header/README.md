# pixel-header

`pixel-header` is a standalone Angular 21 app-level top bar for the `pixel-ui` library. It renders a
real `<header>` element for correct landmark semantics, with a default leading/title region and a
trailing `pixelHeaderActions` slot that's automatically pushed to the end of the row.

## Use cases

- The top bar of an application shell (title/logo + trailing action icons).
- A sticky page header that stays visible while the page content scrolls.
- Composed inside `pixel-app-shell` as its header region.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `sticky` | `boolean` | `false` | Pins the header to the top of its nearest scrolling ancestor. |
| `bordered` | `boolean` | `true` | Bottom divider separating the header from page content. |

Both inputs are **automatically suppressed when composed inside `pixel-app-shell`** — the shell
detects the projected header and provides its own wrapper-level `position: sticky` (since a plain
`position: sticky` on the header itself has no room to matter confined to its single-row grid cell)
and a single shared toolbar-divider (avoiding two independently-painted borders visibly doubling up
at non-integer `devicePixelRatio`). No manual coordination needed — just set `sticky`/`bordered` as
normal and the shell takes over automatically. They still apply as documented for standalone
(non-app-shell) usage.

## Examples

```html
<pixel-header sticky>
  <h1>Dashboard</h1>
  <pixel-button pixelHeaderActions appearance="icon" leadingIcon="notifications" />
  <pixel-button pixelHeaderActions appearance="icon" leadingIcon="account_circle" />
</pixel-header>
```

## Accessibility

Renders a native `<header>` element — browsers expose it as a `banner` landmark automatically
(only when it isn't a descendant of `<article>`/`<aside>`/`<main>`/`<nav>`/`<section>`; no explicit
`role` needed for the top-level app header).

## Theme customization

Consumes shared system tokens directly (`--pixel-sys-surface-container-low`,
`--pixel-sys-on-surface`, `--pixel-sys-outline`, `--pixel-sys-space-*`) — override those tokens at a
`[data-theme]` ancestor rather than per-instance. The bar's height reads
`--pixel-sys-toolbar-block-size` (default `4rem`) — `pixel-sidenav`'s `pixelSidenavBrand` region
reads the same token, so overriding it keeps the two in sync when composed inside `pixel-app-shell`.

## Breaking changes

None. This is a new component addition.
