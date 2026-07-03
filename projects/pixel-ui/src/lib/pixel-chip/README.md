# Pixel Chip Components

`pixel-chip` and `pixel-chip-set` provide a standalone Angular 21 chip/tag system for display, filters, multi-select, input-driven tags, and draggable sets.

## Component Overview

- `pixel-chip`: single chip with selectable, removable, editable, icon/avatar, status, and loading support.
- `pixel-chip-set`: listbox/list wrapper for selection management, overflow collapsing, keyboard navigation, and chip input.
- Built with `input()`/`output()`, `signal()`, `computed()`, immutable event payloads, and `OnPush`.

## Chip types

Supported `type` values (Material-like **role labels**):

| Type | Built-in behavior |
| --- | --- |
| `selectable`, `filter`, `choice` | Toggle selection in a chip set (`role="option"`, `selectionChange`) |
| `input` | No extra behavior — convention for removable tags added via chip input |
| `default`, `action`, `status`, `assist`, `suggestion` | No extra behavior — use for app logic, events, or styling hooks |

Use boolean inputs for capabilities: `removable`, `editable`, `draggable`, `clickable`.

## Inputs at a glance

| Input | Purpose |
| --- | --- |
| `type` | Role / use-case label (`filter`, `input`, `status`, …) |
| `semantic` | Color meaning (`success`, `error`, `warning`, `info`) |
| `variant` | Visual style (`soft`, `solid`, `outline`) |
| `selected` | Selected appearance and `aria-selected` in selectable sets |
| `disabled` | Non-interactive; native button disabled |
| `readonly` | Visible but cannot remove, edit, or toggle selection |
| `loading` | Spinner; also disables interaction |

```html
<pixel-chip label="Blocked" type="filter" semantic="warning" [selected]="true" />
<pixel-chip label="Healthy" type="status" semantic="success" variant="soft" prefixIcon="check_circle" />
<pixel-chip label="Syncing" [loading]="true" />
```

## Variants & semantic colors

Visual variants mirror toast semantic tokens:

- `soft` — container + on-container tokens (light) / filled chroma (dark)
- `solid` — filled semantic foreground (light) / container panel (dark)
- `outline` — tinted surface, semantic border, colored icon

Set `semantic` to `success`, `error`, `warning`, or `info` for toast-aligned colors.

## Inputs

### `pixel-chip` (core)

| Input | Type | Default |
| --- | --- | --- |
| `label` | `string` | `''` |
| `value` | `string` | `''` |
| `type` | `PixelChipType` | `'default'` |
| `variant` | `PixelChipVariant` | `'soft'` |
| `semantic` | `PixelChipSemantic` | `'default'` |
| `size` | `PixelChipSize` | `'md'` |
| `selected` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `readonly` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `removable` | `boolean` | `false` |
| `clickable` | `boolean` | `true` |
| `editable` | `boolean` | `false` |
| `draggable` | `boolean` | `false` |
| `prefixIcon`/`icon`/`suffixIcon` | `string` | `''` |
| `avatarUrl`/`avatarText` | `string` | `''` |
| `count` | `number \| null` | `null` |
| `tooltip` | `string` | `''` |
| `truncate` | `boolean` | `true` |
| `compact` | `boolean` | `false` |

### `pixel-chip-set` (core)

| Input | Type | Default |
| --- | --- | --- |
| `chips` | `readonly PixelChipItem[]` | `[]` |
| `selectionMode` | `'single' \| 'multiple'` | `'multiple'` |
| `layout` | `PixelChipSetLayout` | `'wrap'` |
| `reorderable` | `boolean` | `false` |
| `maxVisible` | `number \| null` | `null` |
| `showOverflow` | `boolean` | `true` |
| `maxSelection` | `number \| null` | `null` |
| `chipInput` | `boolean` | `false` |
| `separatorKeys` | `readonly string[]` | `['Enter', ',', ';']` |
| `preventDuplicates` | `boolean` | `true` |
| `inputPattern` | `string` | `''` |

## Outputs

- `chipClick`
- `chipRemove`
- `selectionChange`
- `valueChange`
- `chipEdit`
- `chipAdd`
- `chipFocus`
- `chipBlur`
- `dragStart`
- `dragEnd`
- `reorder`
- `overflowExpand`
- `inputChange`

## Selectable Chips Usage

```html
<pixel-chip-set
  [chips]="filters()"
  selectionMode="multiple"
  (selectionChange)="onFilterSelection($event.values)"
  (valueChange)="filters.set($event)"
/>
```

## Chip Input Example

```html
<pixel-chip-set
  [chips]="tags()"
  chipInput
  [separatorKeys]="['Enter', ',', ';']"
  [preventDuplicates]="true"
  (valueChange)="tags.set($event)"
/>
```

## Accessibility Features

- Uses list/listbox + option/button role patterns.
- Supports arrow navigation, Enter/Space selection, Delete/Backspace remove, Escape cancel.
- Emits focus/blur outputs and includes `aria-label` + `aria-describedby`.
- Keeps minimum touch target sizing and visible focus ring.

## Theme Customization

Override CSS variables:

- `--pixel-chip-bg`
- `--pixel-chip-bg-hover`
- `--pixel-chip-border`
- `--pixel-chip-border-hover`
- `--pixel-chip-border-focus`
- `--pixel-chip-text`
- `--pixel-chip-icon`
- `--pixel-chip-avatar-bg`
- `--pixel-chip-selected`
- `--pixel-chip-selected-text`
- `--pixel-chip-focus-ring`
- `--pixel-chip-remove`
- `--pixel-chip-remove-hover`
- `--pixel-chip-success`
- `--pixel-chip-error`
- `--pixel-chip-warning`
- `--pixel-chip-disabled-bg`
- `--pixel-chip-disabled-text`

Dark mode is supported through both `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`.

## Keyboard Interaction Guide

- `Tab`: move focus in/out of chip set.
- `Arrow keys`: move focused chip index in the set.
- `Enter`/`Space`: trigger chip click/select.
- `Delete`/`Backspace`: remove focused removable chip.
- `Escape`: collapse overflow or cancel inline edit.

## Migration Notes

- Replace legacy `[(ngModel)]` chip patterns with `selectionChange` + immutable `chips` updates.
- Prefer `selectionMode` and `multiple` for explicit select intent.
- Use `valueChange` as the source of truth for chip list mutation and CVA integration.
- Use boolean inputs (`selected`, `disabled`, `readonly`, `loading`) — not a combined `state` string.
