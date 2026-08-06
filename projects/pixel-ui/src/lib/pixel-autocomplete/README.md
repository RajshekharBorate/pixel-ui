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
- Multi-select with removable chips (`mode="multiple"`)
- Creatable values (`creatable`) for tag-style entry
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

## Behavior notes

- **`mode="multiple"`:** value is `unknown[]`. Selected options become chips when `showChips`
  (default). Already-selected options are omitted from the panel. The panel stays open after each
  pick (until `maxSelections`). Backspace on an empty input removes the last chip.
- **`creatable`:** when the query matches no option, a Create row appears; Enter / click adds the
  query as a value and emits `optionCreated`. Prefer this for tag entry in multi mode.
- **`allowCustomValue` (single only):** still commits free text on each keystroke. In multi mode,
  keystrokes do not change the committed array — use select or creatable.
- **Focus leave:** `pixel-input` signals blur via `blurChange`; the panel closes on blur
  (deferred so option clicks still commit). Option rows use `mousedown.preventDefault` to keep
  focus on the input.
- **Long lists:** no list virtualization — filter / debounce server-side for large catalogs
  (CONVENTIONS §3h). Prefer `pixel-select` + `loadMore` when infinite scroll fits.

## Accessibility

- The input carries `role`-agnostic combobox semantics via `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`.
- The panel is `role="listbox"`; rows are `role="option"` with `aria-selected` / `aria-disabled`.
- Keyboard: `ArrowDown`/`ArrowUp` move the active option, `Home`/`End` jump to ends, `Enter` selects, `Escape` closes. Focus never leaves the input (`aria-activedescendant`).

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-autocomplete` (`PixelAutocompleteComponent`)

Text field with a typeahead suggestion list. Composes `pixel-input` for the field and the shared connected-overlay for a body-appended listbox panel (same architecture as `pixel-datepicker`), and renders suggestions like `pixel-select`'s options. Implements the WAI-ARIA combobox pattern: the input keeps focus while `aria-activedescendant` tracks the highlighted option. Implements `ControlValueAccessor` + `Validator` for reactive and template-driven forms. The form value is the selected option's `value` (or an array in `multiple` mode). With `allowCustomValue` (default, single mode) free text becomes the value when it matches no option. Use `creatable` to add unknown values as explicit selections (chips in multi mode).

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `label` | `string` | `''` |  |
| `mode` | `PixelAutocompleteMode` | `'single'` | Single-value field, or multi-value with optional chips. |
| `showChips` | `boolean` | `true` | In multiple mode, renders selected values as removable chips above the input. |
| `chipRemovable` | `boolean` | `true` | Shows a remove control on each chip when `showChips` is on. |
| `maxSelections` | `number` | `0` | Max selections in multiple mode. `0` means unlimited. |
| `creatable` | `boolean` | `false` | Shows a Create row for the current query when it matches no option; Enter adds it. |
| `createOptionLabel` | `(query: string) => string` | `defaultCreateOptionLabel` | Label for the creatable panel row. |
| `value` | `unknown` | `null` |  |
| `options` | `readonly PixelAutocompleteOption[]` | `[]` |  |
| `groups` | `readonly PixelAutocompleteGroup[]` | `[]` |  |
| `size` | `PixelAutocompleteSize` | `'md'` |  |
| `labelPosition` | `PixelAutocompleteLabelPosition` | `'top'` |  |
| `placeholder` | `string` | `''` |  |
| `showSkeleton` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `inheritParentControlErrors` | `boolean` | `true` | When false, the field does not inherit error state from an ancestor `NgControl`. |
| `required` | `boolean` | `false` |  |
| `helperText` | `string` | `''` |  |
| `validationMessages` | `PixelAutocompleteValidationMessages` | `{}` |  |
| `clearable` | `boolean` | `true` |  |
| `loading` | `boolean` | `false` |  |
| `allowCustomValue` | `boolean` | `true` |  |
| `serverSearch` | `boolean` | `false` |  |
| `searchDebounceMs` | `number` | `300` |  |
| `minChars` | `number` | `0` |  |
| `openOnFocus` | `boolean` | `true` |  |
| `grouped` | `boolean` | `false` |  |
| `highlightSearchMatches` | `boolean` | `true` |  |
| `visibleOptionCount` | `number` | `6` |  |
| `openDirection` | `PixelAutocompleteOpenDirection` | `'auto'` |  |
| `scrollBehavior` | `PixelAutocompleteScrollBehavior` | `'reposition'` |  |
| `panelWidth` | `PixelAutocompletePanelWidthMode` | `'match-trigger'` |  |
| `panelCustomWidth` | `string` | `'20rem'` |  |
| `emptyStateMessage` | `string` | `'No suggestions.'` |  |
| `noResultMessage` | `string` | `'No matching results.'` |  |
| `displayWith` | `(option: PixelAutocompleteOption) => string` | `defaultDisplayWith` |  |
| `compareWith` | `(a: unknown, b: unknown) => boolean` | `(a, b) => Object.is(a, b)` |  |
| `ariaLabel` | `string` | `''` |  |
| `chipsAriaLabel` | `string` | `'{name} values'` | Accessible name for the chips list. `{name}` resolves to the field label, `ariaLabel`, or `Selected`. |
| `suggestionsAriaLabel` | `string` | `'Suggestions'` | Fallback listbox accessible name when no field label / `ariaLabel` is set. |
| `defaultGroupLabel` | `string` | `'Suggestions'` | Default group header when `option.group` is empty and `grouped` is true. |
| `requiredMessage` | `string` | `'This field is required.'` | Default required-validation message when `validationMessages.required` is omitted. |
| `ariaDescribedBy` | `string` | `''` |  |
| `className` | `string` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `unknown` |  |
| `optionSelected` | `PixelAutocompleteSelectionChange` |  |
| `optionCreated` | `PixelAutocompleteOptionCreated` |  |
| `chipRemoved` | `PixelAutocompleteChipRemoved` |  |
| `inputChange` | `string` |  |
| `searchChange` | `string` |  |
| `openChange` | `boolean` |  |
| `focusChange` | `boolean` |  |
| `clearClick` | `void` |  |
| `enterPress` | `KeyboardEvent` |  |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelAutocompleteSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelAutocompleteMode` | `'single' | 'multiple'` |
| `PixelAutocompleteLabelPosition` | `'top' | 'left' | 'floating' | 'hidden'` |
| `PixelAutocompleteOpenDirection` | `'auto' | 'top' | 'bottom'` |
| `PixelAutocompleteScrollBehavior` | `'close' | 'reposition' | 'block'` |
| `PixelAutocompletePanelWidthMode` | `'auto' | 'match-trigger' | 'custom'` |
| `PixelAutocompleteInteractionSource` | `'mouse' | 'keyboard'` |

### Exported interfaces

**`PixelAutocompleteOption`** — A selectable suggestion rendered in the dropdown.

```ts
interface PixelAutocompleteOption {
  readonly value: unknown;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
  readonly subtitle?: string;
  readonly meta?: string;
  readonly icon?: string;
  readonly imageSrc?: string;
  readonly avatarText?: string;
}
```

**`PixelAutocompleteGroup`** — Pre-grouped options, mirroring `pixel-select`'s grouped shape.

```ts
interface PixelAutocompleteGroup {
  readonly id: string;
  readonly label: string;
  readonly options: readonly PixelAutocompleteOption[];
}
```

**`PixelAutocompleteSelectionChange`**

```ts
interface PixelAutocompleteSelectionChange {
  readonly value: unknown;
  readonly option: PixelAutocompleteOption | null;
  readonly source: PixelAutocompleteInteractionSource;
}
```

**`PixelAutocompleteOptionCreated`** — Emitted when `creatable` adds a value that was not in `options`.

```ts
interface PixelAutocompleteOptionCreated {
  readonly value: unknown;
  readonly label: string;
  readonly source: PixelAutocompleteInteractionSource;
}
```

**`PixelAutocompleteChipRemoved`** — Emitted when a multi-select chip is removed.

```ts
interface PixelAutocompleteChipRemoved {
  readonly value: unknown;
}
```

**`PixelAutocompleteChipEntry`** — Chip row entry (known option or synthetic creatable value).

```ts
interface PixelAutocompleteChipEntry {
  readonly value: unknown;
  readonly label: string;
  readonly option: PixelAutocompleteOption | null;
}
```

**`PixelAutocompleteValidationMessages`** — Maps `AbstractControl` error keys to user-visible copy (same shape as `pixel-input`).

```ts
interface PixelAutocompleteValidationMessages {
  required?: string;
  [errorCode: string]: string | undefined;
}
```

<!-- API-CONTRACT:END -->
