# pixel-select

Configurable standalone select/dropdown component for `pixel-ui` (Angular 21).

## Overview

`pixel-select` provides:

- Single and multiple selection
- Searchable panel (client or server search)
- Infinite scroll load-more signaling
- Rich option layout (icon, image/avatar, subtitle, meta)
- Signal-based `input()` / `output()` API with `ControlValueAccessor` + `Validator` (required empty selection)
- Panel search uses **`pixel-input`**; select-all uses **`pixel-checkbox`**
- Trigger typography, focus ring, and form error behavior align with **`pixel-input`**
- Theme tokens aligned with light/dark Pixel styles

## Use cases

- Reusable enterprise filters and form selectors
- Large option sets with async search and pagination
- Multi-select with chips and selected-count trigger text
- Profile/team pickers with avatars and grouped options

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `unknown \| unknown[] \| null` | `null` | Controlled value; array in `multiple` mode. |
| `options` | `readonly PixelSelectOption[]` | `[]` | Flat options source. |
| `groups` | `readonly PixelSelectGroup[]` | `[]` | Optional grouped source. |
| `mode` | `'single' \| 'multiple'` | `'single'` | Selection mode. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Density and typography scale. |
| `state` | `'default' \| 'error' \| 'loading'` | `'default'` | Visual state token (same set as `pixel-input`). |
| `label`, `labelPosition`, `placeholder`, `helperText` | `string` variants | - | Labeling and helper copy. |
| `validationMessages` | `PixelSelectValidationMessages` | `{}` | Messages when the bound control is invalid and touched/dirty (like `pixel-input`). |
| `searchable` | `boolean` | `false` | Shows search input. |
| `serverSearch` | `boolean` | `false` | Debounced `searchChange` for remote querying. |
| `searchDebounceMs` | `number` | `300` | Debounce duration. |
| `infiniteScroll`, `hasMore`, `loadingMore` | `boolean` | `false` | Infinite scroll signaling state. |
| `showSelectAll` | `boolean` | `true` | Toggle all in multi mode. |
| `showSelectedCount`, `showTags` | `boolean` | `true` | Multi trigger display controls. |
| `moreTagsLabel` | `string` | `'+{count} more'` | Multi + `showTags`: overflow summary when not every pill fits in the trigger width; `{count}` is replaced. |
| `closeOnSelect` | `boolean \| null` | `null` | `null` means single:true, multi:false. |
| `openDirection` | `'auto' \| 'top' \| 'bottom'` | `'auto'` | `auto` measures viewport space and opens the panel **above** the field when there is not enough room below (similar to Angular Material select). `top` / `bottom` pin the panel to that edge. |
| `scrollBehavior` | `'block' \| 'close' \| 'reposition'` | `'block'` | Page-scroll behaviour while the panel is open: `block` freezes page scrolling by swallowing wheel/touch input outside the panel — the page scrollbar is untouched (no layout shift / flicker) and the options list still scrolls; `close` dismisses the panel on page scroll; `reposition` keeps it glued to the field (Angular Material's default). |
| `panelWidth` | `'auto' \| 'match-trigger' \| 'custom'` | `'match-trigger'` | Width strategy. |
| `panelCustomWidth` | `string` | `'20rem'` | Used when width is custom. |
| `maxSelectedItems` | `number` | `0` | 0 = unlimited. |
| `clearable` | `boolean` | `true` | Multi-select + `showTags`: show remove control on each pill only (no trigger clear button). |
| `displayWith` | `(option) => string` | `option.label` | Trigger/tag label formatter. |
| `compareWith` | `(a, b) => boolean` | `Object.is` | Equality for object values. |

## Outputs

| Output | Payload |
| --- | --- |
| `valueChange` | `unknown \| unknown[] \| null` |
| `selectionChange` | `PixelSelectSelectionChange` |
| `searchChange` | `string` |
| `openChange` | `boolean` |
| `focusChange` / `blurChange` | `boolean` |
| `clearClick` | `void` | Fires when the value becomes empty (last pill removed, select-all cleared, etc.). There is no trigger-level clear button. |
| `removeTag` | `unknown` |
| `loadMore` | `{ query: string; selectedCount: number }` |
| `optionClick` | `PixelSelectOption` |
| `panelScrollEnd` | `void` |
| `enterPress` | `KeyboardEvent` |

## Examples

### Single select

```html
<pixel-select
  label="Country"
  [options]="countries"
  [value]="country()"
  (valueChange)="country.set($event)"
/>
```

### Multiple select + selected count

```html
<pixel-select
  label="Skills"
  mode="multiple"
  [options]="skills"
  [value]="selectedSkills()"
  [showSelectedCount]="true"
  [showTags]="true"
  (valueChange)="selectedSkills.set($event as string[])"
/>
```

### Async search + infinite scroll

```html
<pixel-select
  label="Assignee"
  [options]="userOptions()"
  [searchable]="true"
  [serverSearch]="true"
  [searchDebounceMs]="250"
  [loading]="searching()"
  [infiniteScroll]="true"
  [hasMore]="hasMoreUsers()"
  [loadingMore]="loadingNextPage()"
  (searchChange)="searchUsers($event)"
  (loadMore)="loadNextUsers($event)"
/>
```

## Reactive and template forms

`pixel-select` implements `ControlValueAccessor`.

- Reactive: `<pixel-select formControlName="country" ... />`
- Template-driven: `<pixel-select name="country" [(ngModel)]="country" ... />`

## Accessibility

- Combobox/listbox semantics with `role="combobox"`, `role="listbox"`, `role="option"`
- ARIA states for expanded, selected, required, invalid, and disabled
- Keyboard support for arrow navigation, Enter/Space selection, Escape close, Backspace tag removal
- Screen-reader label fallback and helper text wiring via `aria-describedby`

## Theme customization

The component uses CSS custom properties and follows library tokens. Common overrides:

```scss
pixel-select {
  --pixel-select-border-focus: var(--pixel-sys-primary);
  --pixel-select-focus-ring: var(--pixel-sys-focus-ring);
}
```

Dark mode is supported via `prefers-color-scheme: dark` and `[data-theme='dark']`.

## Async data guidance

- Use `serverSearch` with `searchDebounceMs` to avoid chatty APIs.
- Emit `loadMore` with `infiniteScroll` + `hasMore`.
- Preserve appended scroll by leaving `preserveScrollOnAppend` enabled.

## Migration notes

Recent/favorites pinned sections, related inputs (`showRecent`, `showFavorites`, `recentLimit`, `recentHeader`, `favoriteHeader`), and the `favoriteClick` output were removed. Use `groups` / option `group` for static sections instead.
