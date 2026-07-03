# pixel-footer

`pixel-footer` is a standalone Angular 21 app-level footer for the `pixel-ui` library. It renders a
real `<footer>` element for correct landmark semantics.

## Use cases

- The bottom bar of an application shell (copyright, links, version info).
- Composed inside `pixel-app-shell` as its footer region, pinned via the shell's grid row rather
  than its own `position: sticky`.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `bordered` | `boolean` | `true` | Top divider separating the footer from page content. |

## Examples

```html
<pixel-footer>
  <span>© 2026 Acme Inc.</span>
</pixel-footer>
```

## Accessibility

Renders a native `<footer>` element — browsers expose it as a `contentinfo` landmark automatically
(only when it isn't a descendant of `<article>`/`<aside>`/`<main>`/`<nav>`/`<section>`; no explicit
`role` needed for the top-level app footer).

## Theme customization

Consumes shared system tokens directly (`--pixel-sys-surface-container-low`,
`--pixel-sys-on-surface`, `--pixel-sys-outline`, `--pixel-sys-space-*`, `--pixel-sys-label-sm-size`)
— override those tokens at a `[data-theme]` ancestor rather than per-instance.

## Breaking changes

None. This is a new component addition.
