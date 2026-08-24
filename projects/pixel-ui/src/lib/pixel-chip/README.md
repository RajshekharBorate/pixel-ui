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

## Behavior notes

- `type` is a role/use-case label; capabilities come from booleans (`removable`, `editable`, `draggable`, `clickable`, `selected`, `loading`).
- Selectable / filter / choice chips toggle selection in a chip set (`role="option"`, `selectionChange`).
- `loading` and `disabled` suppress interaction; `readonly` blocks remove/edit/selection changes.
- Chip sets own selection mode, overflow collapse (`maxVisible` / `showOverflow`), optional chip input, and reorder when `reorderable`.
- Keyboard: Tab in/out; arrows move focus; Enter/Space activate; Delete/Backspace remove; Escape collapses overflow or cancels inline edit.

## Accessibility

- Uses list/listbox + option/button role patterns.
- Supports arrow navigation, Enter/Space selection, Delete/Backspace remove, Escape cancel.
- Emits focus/blur outputs and includes `aria-label` + `aria-describedby`.
- Keeps minimum touch target sizing and visible focus ring.

## Theme customization

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

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-chip-set` (`PixelChipSetComponent`)

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `chips` | `readonly PixelChipItem[]` | `[]` |  |
| `selectionMode` | `PixelChipSetSelectionMode` | `'multiple'` |  |
| `multiple` | `boolean` | `true` |  |
| `showSkeleton` | `boolean` | `false` |  |
| `skeletonCount` | `number` | `0` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `keyboardNavigation` | `boolean` | `true` |  |
| `layout` | `PixelChipSetLayout` | `'wrap'` |  |
| `size` | `PixelChipSize` | `'md'` |  |
| `variant` | `PixelChipVariant` | `'soft'` |  |
| `reorderable` | `boolean` | `false` |  |
| `maxVisible` | `number | null` | `null` |  |
| `showOverflow` | `boolean` | `true` |  |
| `compact` | `boolean` | `false` |  |
| `maxSelection` | `number | null` | `null` |  |
| `showSelectionCounter` | `boolean` | `true` |  |
| `chipInput` | `boolean` | `false` |  |
| `chipInputPlaceholder` | `string` | `'Add a tag'` |  |
| `separatorKeys` | `readonly string[]` | `DEFAULT_SEPARATOR_KEYS` |  |
| `preventDuplicates` | `boolean` | `true` |  |
| `inputPattern` | `string` | `''` |  |
| `ariaLabel` | `string` | `'Chip set'` |  |
| `ariaDescribedBy` | `string` | `''` |  |
| `className` | `string` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `chipClick` | `{ chip: PixelChipItem; index: number; event: MouseEvent | KeyboardEvent }` |  |
| `chipRemove` | `{ chip: PixelChipItem; index: number }` |  |
| `selectionChange` | `PixelChipSetSelectionChange` |  |
| `valueChange` | `readonly PixelChipItem[]` |  |
| `chipEdit` | `{ chip: PixelChipItem; index: number; nextLabel: string }` |  |
| `chipAdd` | `{ chip: PixelChipItem; value: string }` |  |
| `chipFocus` | `{ chip: PixelChipItem; index: number }` |  |
| `chipBlur` | `{ chip: PixelChipItem; index: number }` |  |
| `dragStart` | `{ chip: PixelChipItem; index: number }` |  |
| `dragEnd` | `{ chip: PixelChipItem; index: number | null }` |  |
| `reorder` | `PixelChipReorderEvent` |  |
| `overflowExpand` | `boolean` |  |
| `inputChange` | `string` |  |

### Component `pixel-chip` (`PixelChipComponent`)

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `label` | `string` | `''` |  |
| `value` | `string` | `''` |  |
| `type` | `PixelChipType` | `'default'` |  |
| `variant` | `PixelChipVariant` | `'soft'` |  |
| `semantic` | `PixelChipSemantic` | `'default'` |  |
| `size` | `PixelChipSize` | `'md'` |  |
| `selected` | `boolean` | `false` |  |
| `showSkeleton` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `removable` | `boolean` | `false` |  |
| `clickable` | `boolean` | `true` |  |
| `presentational` | `boolean` | `false` |  |
| `editable` | `boolean` | `false` |  |
| `draggable` | `boolean` | `false` |  |
| `icon` | `string` | `''` |  |
| `prefixIcon` | `string` | `''` |  |
| `suffixIcon` | `string` | `''` |  |
| `avatarUrl` | `string` | `''` |  |
| `avatarText` | `string` | `''` |  |
| `avatarIcon` | `string` | `''` |  |
| `statusIndicator` | `'default' | 'success' | 'error' | 'warning' | 'info'` | `'default'` |  |
| `count` | `number | null` | `null` |  |
| `tooltip` | `string` | `''` |  |
| `truncate` | `boolean` | `true` |  |
| `compact` | `boolean` | `false` |  |
| `loading` | `boolean` | `false` |  |
| `category` | `string` | `''` |  |
| `ariaLabel` | `string` | `''` |  |
| `ariaDescribedBy` | `string` | `''` |  |
| `tabIndex` | `number` | `0` |  |
| `autofocus` | `boolean` | `false` |  |
| `className` | `string` | `''` |  |
| `ngClass` | `PixelChipClassValue` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `chipClick` | `MouseEvent | KeyboardEvent` |  |
| `chipRemove` | `PixelChipRemoveEvent` |  |
| `selectionChange` | `PixelChipSelectionChange` |  |
| `valueChange` | `string` |  |
| `chipEdit` | `PixelChipEditEvent` |  |
| `chipFocus` | `FocusEvent` |  |
| `chipBlur` | `FocusEvent` |  |
| `dragStart` | `DragEvent` |  |
| `dragEnd` | `DragEvent` |  |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelChipSetLayout` | `'horizontal' | 'vertical' | 'wrap' | 'scrollable'` |
| `PixelChipSetSelectionMode` | `'single' | 'multiple'` |
| `PixelChipType` | `| 'default' | 'selectable' | 'filter' | 'input' | 'choice' | 'action' | 'status' | 'assist' | 'suggestion'` |
| `PixelChipVariant` | `'solid' | 'soft' | 'outline'` |
| `PixelChipSemantic` | `'default' | 'success' | 'error' | 'warning' | 'info'` |
| `PixelChipSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelChipClassValue` | `| string | string[] | Record<string, boolean> | null | undefined` |

### Exported interfaces

**`PixelChipSetSelectionChange`**

```ts
interface PixelChipSetSelectionChange {
  values: readonly string[];
  selectedCount: number;
}
```

**`PixelChipReorderEvent`**

```ts
interface PixelChipReorderEvent {
  fromIndex: number;
  toIndex: number;
  chips: readonly PixelChipItem[];
}
```

**`PixelChipItem`**

```ts
interface PixelChipItem {
  id?: string;
  label: string;
  value?: string;
  type?: PixelChipType;
  variant?: PixelChipVariant;
  semantic?: PixelChipSemantic;
  size?: PixelChipSize;
  selected?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  removable?: boolean;
  clickable?: boolean;
  editable?: boolean;
  draggable?: boolean;
  icon?: string;
  prefixIcon?: string;
  suffixIcon?: string;
  avatarUrl?: string;
  avatarText?: string;
  statusIndicator?: 'default' | 'success' | 'error' | 'warning' | 'info';
  count?: number;
  tooltip?: string;
  loading?: boolean;
  truncate?: boolean;
  category?: string;
  className?: string;
}
```

**`PixelChipSelectionChange`**

```ts
interface PixelChipSelectionChange {
  selected: boolean;
  value: string;
  type: PixelChipType;
  source: 'mouse' | 'keyboard' | 'programmatic';
  originalEvent?: MouseEvent | KeyboardEvent;
}
```

**`PixelChipRemoveEvent`**

```ts
interface PixelChipRemoveEvent {
  value: string;
  label: string;
  source: 'mouse' | 'keyboard';
  originalEvent: MouseEvent | KeyboardEvent;
}
```

**`PixelChipEditEvent`**

```ts
interface PixelChipEditEvent {
  value: string;
  label: string;
}
```

<!-- API-CONTRACT:END -->
