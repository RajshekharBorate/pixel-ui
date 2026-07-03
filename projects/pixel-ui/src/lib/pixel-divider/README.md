# pixel-divider

`pixel-divider` is a standalone Angular 21 separator for the `pixel-ui` library. It draws a token-driven rule between content groups, list/menu sections, or toolbar items, and supports an optional centered label.

## Use cases

- Horizontal section breaks in cards, forms, and menus
- Vertical separators between toolbar / action-bar items
- Labeled dividers ("OR", "Section") for grouped content

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Line direction. Vertical needs a parent with height. |
| `variant` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | Stroke style. |
| `inset` | `boolean` | `false` | Adds symmetric margin so the rule does not touch edges. |
| `labeled` | `boolean` | `false` | Switches to the line — label — line layout (horizontal only). |
| `labelAlign` | `'start' \| 'center' \| 'end'` | `'center'` | Label alignment when `labeled`. |

## Examples

```html
<pixel-divider />
<pixel-divider variant="dashed" inset />
<pixel-divider orientation="vertical" />
<pixel-divider [labeled]="true">OR</pixel-divider>
```

## Accessibility

- Renders `role="separator"` with `aria-orientation` reflecting the orientation.
- Decorative lines around a label are marked `aria-hidden`.

## Theme customization

Consumes shared system tokens and exposes `--pixel-divider-*` overrides:

- `--pixel-divider-color`
- `--pixel-divider-thickness`
- `--pixel-divider-inset`
- `--pixel-divider-label-color`
- `--pixel-divider-label-gap`

## Breaking changes

None. This is a new component addition.
