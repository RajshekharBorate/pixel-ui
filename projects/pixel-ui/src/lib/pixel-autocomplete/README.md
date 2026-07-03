# pixel-autocomplete

Typeahead text field with a suggestion dropdown for `pixel-ui` (Angular 21).

## Overview

`pixel-autocomplete` provides:

- A `pixel-input` field paired with a body-appended, auto-positioned suggestion panel (the shared connected-overlay, same architecture as `pixel-datepicker` / `pixel-select`)
- Client-side filtering or debounced `serverSearch` (parent supplies `options`)
- Free-text entry (`allowCustomValue`, default) or strict selection (`requireSelection`-style revert on blur)
- Rich option layout (icon, image/avatar, subtitle, meta) and optional grouping
- Highlighted query matches inside option labels
- WAI-ARIA combobox pattern: focus stays on the input while `aria-activedescendant` tracks the highlighted option
- Signal-based `input()` / `output()` API with `ControlValueAccessor` + `Validator` (required)
- Theme tokens aligned with light/dark Pixel styles; field chrome, focus ring, and error behavior inherited from `pixel-input`

## Use cases

- Search-as-you-type pickers (locations, users, products, tags)
- Remote/async suggestion fetch with debounced queries
- Combo fields that accept either a known option or arbitrary text

## Usage

```html
<pixel-autocomplete
  label="Fruit"
  [options]="fruits"
  [(value)]="selected"
  placeholder="Start typing…"
/>
```

### Reactive forms

```html
<pixel-autocomplete
  label="Assignee"
  [options]="users"
  formControlName="assignee"
  [required]="true"
  [validationMessages]="{ required: 'Pick an assignee.' }"
/>
```

### Server-side search

```html
<pixel-autocomplete
  label="City"
  [options]="results()"
  [serverSearch]="true"
  [loading]="loading()"
  (searchChange)="fetch($event)"
/>
```

## Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `unknown` | `null` | Controlled value: an option `value`, or the raw text when `allowCustomValue`. |
| `options` | `readonly PixelAutocompleteOption[]` | `[]` | Flat suggestion source. |
| `groups` | `readonly PixelAutocompleteGroup[]` | `[]` | Optional grouped source (with `grouped`). |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Density and typography scale. |
| `label`, `labelPosition`, `placeholder`, `helperText` | `string` variants | – | Labeling and helper copy. |
| `disabled`, `readonly`, `required` | `boolean` | `false` | Field state. |
| `validationMessages` | `PixelAutocompleteValidationMessages` | `{}` | Messages when the bound control is invalid and touched/dirty. |
| `clearable` | `boolean` | `true` | Shows a clear affordance when the field has text. |
| `loading` | `boolean` | `false` | Shows the input loader and a "Searching…" panel row. |
| `allowCustomValue` | `boolean` | `true` | Commit free text that matches no option; otherwise reverts on blur. |
| `serverSearch` | `boolean` | `false` | Skips local filtering and emits debounced `searchChange`. |
| `searchDebounceMs` | `number` | `300` | Debounce for `searchChange`. |
| `minChars` | `number` | `0` | Minimum characters before opening / searching. |
| `openOnFocus` | `boolean` | `true` | Open the panel on focus when suggestions exist. |
| `grouped` | `boolean` | `false` | Group via `groups` or `option.group`. |
| `highlightSearchMatches` | `boolean` | `true` | Highlight the matched substring in labels. |
| `visibleOptionCount` | `number` | `6` | Rows visible before the panel scrolls. |
| `openDirection` | `'auto' \| 'top' \| 'bottom'` | `'auto'` | Preferred placement. |
| `scrollBehavior` | `'close' \| 'reposition' \| 'block'` | `'reposition'` | Page-scroll behaviour while open. |
| `panelWidth` | `'auto' \| 'match-trigger' \| 'custom'` | `'match-trigger'` | Panel width strategy. |
| `panelCustomWidth` | `string` | `'20rem'` | Width when `panelWidth` is `custom`. |
| `emptyStateMessage`, `noResultMessage` | `string` | – | Empty / no-match panel copy. |
| `displayWith` | `(option) => string` | `option.label` | Field text after selecting an option. |
| `compareWith` | `(a, b) => boolean` | `Object.is` | Equality for object values. |
| `ariaLabel`, `ariaDescribedBy`, `className` | `string` | `''` | Accessibility / styling hooks. |

## Outputs

| Output | Payload | Notes |
| --- | --- | --- |
| `valueChange` | `unknown` | Committed value changed. |
| `optionSelected` | `PixelAutocompleteSelectionChange` | An option was chosen (mouse/keyboard). |
| `inputChange` | `string` | Raw field text changed. |
| `searchChange` | `string` | Debounced query (with `serverSearch`). |
| `openChange` | `boolean` | Panel opened/closed. |
| `focusChange` | `boolean` | Field focus changed. |
| `clearClick` | `void` | Clear affordance activated. |
| `enterPress` | `KeyboardEvent` | Enter pressed in the field. |

## Accessibility

- The input carries `role`-agnostic combobox semantics via `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`.
- The panel is `role="listbox"`; rows are `role="option"` with `aria-selected` / `aria-disabled`.
- Keyboard: `ArrowDown`/`ArrowUp` move the active option, `Home`/`End` jump to ends, `Enter` selects, `Escape` closes. Focus never leaves the input (`aria-activedescendant`).
