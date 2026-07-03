# pixel-menu

An accessible overlay menu system for the `pixel-ui` library, composed of three standalone pieces:

- `PixelMenuComponent` (`<pixel-menu>`) — the menu panel.
- `PixelMenuItemComponent` (`<pixel-menu-item>`) — an actionable row.
- `PixelMenuTriggerDirective` (`[pixelMenuTriggerFor]`) — opens a menu from a trigger.

The panel is relocated to `document.body` while open so it is never clipped by `overflow` ancestors, and it restores trigger focus on close.

## Features

- Nested submenus (apply `[pixelMenuTriggerFor]` to a `pixel-menu-item`)
- Full keyboard support: Up/Down/Home/End, Enter/Space, Escape, ArrowRight/Left for submenus, Tab closes
- Viewport-aware positioning with flipping and clamping
- Outside-click + scroll/resize aware
- Token-driven theming (light/dark/enterprise)

## Example

```html
<button [pixelMenuTriggerFor]="actions">Actions</button>

<pixel-menu #actions ariaLabel="Policy actions">
  <pixel-menu-item icon="visibility" (selected)="view()">View</pixel-menu-item>
  <pixel-menu-item icon="edit" (selected)="edit()">Edit</pixel-menu-item>
  <pixel-menu-item [pixelMenuTriggerFor]="more" icon="more_horiz">More</pixel-menu-item>
  <pixel-menu-item icon="delete" variant="danger" (selected)="remove()">Delete</pixel-menu-item>
</pixel-menu>

<pixel-menu #more>
  <pixel-menu-item (selected)="duplicate()">Duplicate</pixel-menu-item>
  <pixel-menu-item (selected)="history()">Execution history</pixel-menu-item>
</pixel-menu>
```

## PixelMenuComponent inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `xPosition` | `'before' \| 'after'` | `'after'` | Horizontal alignment vs. the trigger. |
| `yPosition` | `'above' \| 'below'` | `'below'` | Vertical alignment vs. the trigger. |
| `panelClass` | `string` | `''` | Extra class(es) on the panel. |
| `ariaLabel` | `string` | `''` | Accessible label for the menu. |

Outputs: `openedChange: boolean`, `closed: void`.

## PixelMenuItemComponent

| Member | Type | Description |
| --- | --- | --- |
| `icon` | `string` | Leading Material Symbols glyph. |
| `iconColor` | `'default' \| 'primary'` | Leading icon colour (`primary` = brand tint). |
| `disabled` | `boolean` | Disables the item. |
| `variant` | `'default' \| 'danger'` | Destructive styling. |
| `selected` | `output<MouseEvent \| KeyboardEvent>` | Activation event. |

## Styling

The panel mounts to `document.body` and the items are projected from your template, so the menu's
CSS cannot be component-scoped — it ships in the shared `styles/_menu.scss` partial (re-forwarded from
`styles/_index.scss`, alongside the tooltip). Import it once from your app's global styles:

```scss
@use 'pixel-ui/src/styles/menu';
// …or pull in everything (theming, scrollbar, tooltip, menu):
@use 'pixel-ui/src/styles' as pixel;
```

Override with `--pixel-menu-bg`, `--pixel-menu-text`, `--pixel-menu-border`, `--pixel-menu-hover`,
and per-item `--pixel-menu-item-icon`.

## Accessibility

`role="menu"` / `role="menuitem"`, `aria-haspopup`, `aria-expanded`, `aria-disabled`, roving focus, and Escape-to-close are wired in.

## Breaking changes

None. This is a new component addition.
