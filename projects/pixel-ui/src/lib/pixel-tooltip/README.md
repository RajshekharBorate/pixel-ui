# pixel-tooltip

`pixelTooltip` is a standalone Angular 21 directive for the `pixel-ui` library. It shows an accessible floating label on hover/focus with viewport-aware positioning.

## Use cases

- Explaining icon-only buttons and truncated text
- Help hints on disabled or restricted actions
- Short contextual labels without taking layout space

## Selector

`[pixelTooltip]`

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `pixelTooltip` | `string` | `''` | Tooltip text. Empty disables it. |
| `pixelTooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Preferred position; flips on overflow. |
| `pixelTooltipTrigger` | `'hover' \| 'focus' \| 'both'` | `'both'` | Interaction(s) that reveal the tooltip. |
| `pixelTooltipTheme` | `'inverse' \| 'surface' \| 'primary'` | `'inverse'` | Visual style of the label. |
| `pixelTooltipDisabled` | `boolean` | `false` | Disables without removing the directive. |
| `pixelTooltipShowDelay` | `number` | `150` | Delay (ms) before showing. |
| `pixelTooltipHideDelay` | `number` | `0` | Delay (ms) before hiding. |
| `pixelTooltipMaxWidth` | `string` | `'16rem'` | Max inline size of the label. |
| `pixelTooltipArrow` | `boolean` | `false` | Opt in to a tail/arrow pointing at the host. |

The tooltip dismisses when the host is clicked or when a drag operation starts on the host (useful for draggable reorder handles).

## Types

The tooltip ships in two styles:

- **Type 1 — plain (default):** a floating label with no tail. This is the default; nothing to set.
- **Type 2 — arrow:** add `pixelTooltipArrow` to grow a tail that points at the host. It is a CSS
  border-triangle that connects flush to the body and points cleanly in all four directions, on
  every theme (including the bordered `surface` theme).

```html
<button pixelTooltip="Saved">Save</button>             <!-- plain -->
<button pixelTooltip="Saved" pixelTooltipArrow>Save</button> <!-- with arrow -->
```

## Examples

```html
<button pixelTooltip="Delete policy" pixelTooltipPosition="bottom">
  <span class="material-symbols-outlined">delete</span>
</button>

<span pixelTooltip="Read-only in this role" pixelTooltipTheme="surface">Status</span>
```

## Accessibility

- Sets `aria-describedby` on the host while visible and `role="tooltip"` on the label.
- Reveals on keyboard focus (not just hover) by default.
- Dismisses on host click and respects `prefers-reduced-motion`.

## Styling

The floating element mounts to `document.body`, so its CSS ships in the shared
`styles/_tooltip.scss` partial (re-forwarded from `styles/_index.scss`). Override with:

- `--pixel-tooltip-bg`
- `--pixel-tooltip-text`

## Breaking changes

None. This is a new directive addition.
