# pixel-container

`pixel-container` is a standalone Angular 21 layout primitive for the `pixel-ui` library. It centers
content and caps its width per breakpoint, with consistent responsive inline padding, replacing
hand-rolled `max-inline-size` + `margin-inline: auto` on every page.

## Use cases

- Wrapping a page or section's main content so its line length stays readable on wide screens.
- Consistent page gutters (inline padding) that widen at larger breakpoints.
- A `fluid` escape hatch for full-width sections (hero banners, dashboards) that still need the
  shared padding scale.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `maxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'` | Width cap preset. |
| `fluid` | `boolean` | `false` | Bypasses `maxWidth` entirely (100% width). |
| `padded` | `boolean` | `true` | Responsive inline padding using the shared spacing scale. |

## Examples

```html
<pixel-container>
  <h1>Dashboard</h1>
</pixel-container>

<pixel-container maxWidth="xl">
  <p>Wider content column.</p>
</pixel-container>

<pixel-container fluid [padded]="false">
  <img src="hero.jpg" alt="" />
</pixel-container>
```

## Accessibility

Purely presentational — no ARIA role. Landmark semantics belong to whatever real content (e.g.
`<main>`) is projected inside it.

## Theme customization

Width steps are fixed presets (not overridable via CSS custom property); padding uses the shared
`--pixel-sys-space-md` / `--pixel-sys-space-xl` tokens directly, so overriding those tokens at a
`[data-theme]` ancestor adjusts every container's padding consistently.

## Breaking changes

None. This is a new component addition.
