# pixel-input

Accessible text field for the `pixel-ui` library. The component wraps a native
`<input>` with pill-shaped styling, lavender focus treatments, optional affixes, password
visibility, clear actions, and first-class support for reactive and template-driven forms via
`ControlValueAccessor`.

## Overview

- Standalone Angular 21 component with `ChangeDetectionStrategy.OnPush`
- Signal-based `input()` / `output()` API (no decorator inputs)
- Explicit `valueChange` stream instead of two-way binding
- Built-in validator hooks for `required`, `minLength`, `maxLength`, and `pattern`
- With `formControl` / `ngModel`, error styling, `aria-invalid`, and the `.pixel-input__error` line
  follow the bound control when it is invalid and touched or dirty; supply copy via `validationMessages`
- While the bound control is `PENDING` (async validators), a loader is shown by default; turn off with
  `showLoaderWhenPending="false"`. Sync validation messages stay hidden until async work finishes.
- CSS custom properties for every color role with automatic dark mode and `[data-theme]`
  overrides

## When to use

- Forms that need consistent Pixel styling while staying close to the platform input
- Dense tables or filters where sizes, affixes, and loading states matter
- Flows that must meet WCAG AA expectations with minimal custom wiring

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` | Optional id for the native `<input>`; a stable id is generated when omitted. |
| `label` | `string` | `''` | Visible label text; also used for floating and visually hidden layouts. |
| `value` | `string` | `''` | Controlled value when not using Angular forms. Ignored when a `FormControl` is bound. |
| `type` | `PixelInputType` | `'text'` | Native `type` (`text`, `email`, `password`, `number`, `tel`, `url`, `search`). Ignored when `multiline` is true. |
| `multiline` | `boolean` | `false` | Renders a `<textarea>` instead of `<input>` while keeping the same label / helper / validation / counter / clear-button chrome. |
| `rows` | `number` | `3` | Initial visible row count when `multiline` is true. |
| `autoResize` | `boolean` | `false` | When `multiline` is true, automatically grows the textarea to fit its content (also disables the native resize handle). |
| `resize` | `PixelInputResize` | `'vertical'` | Native textarea resize behavior (`'none'`, `'vertical'`, `'horizontal'`, `'both'`). Ignored when `autoResize` is true. |
| `name` | `string` | `''` | Native `name` attribute. |
| `placeholder` | `string` | `''` | Placeholder text; suppressed for floating labels until focus or value. |
| `disabled` | `boolean` | `false` | Disables the control. |
| `readonly` | `boolean` | `false` | Makes the field read-only. |
| `required` | `boolean` | `false` | Marks the field required and wires `Validators.required`. |
| `size` | `PixelInputSize` | `'md'` | Density token (`xs`, `sm`, `md`, `lg`). |
| `loading` | `boolean` | `false` | Shows a spinner (not inferred from the form control). |
| `disabledWhileLoading` | `boolean` | `false` | When `loading` is true, disables the native input and applies disabled styling. |
| `showLoaderWhenPending` | `boolean` | `true` | When the bound control status is `PENDING` (async validators), shows the same loader as `[loading]`. Set `false` to hide it. |
| `labelPosition` | `PixelInputLabelPosition` | `'top'` | `top`, `left`, `floating`, or `hidden`. With `left`, hint/error/counter sit below the input only (not under the label). |
| `helperText` | `string` | `''` | Non-error hint only; hidden while the bound control is invalid and touched or dirty. Newline-separated lines render as separate rows. |
| `validationMessages` | `PixelInputValidationMessages` | `{}` | Map of `ValidationErrors` keys to messages when the bound control is invalid and touched or dirty. Use `{requiredLength}` / `{actualLength}` in `minlength` / `maxlength` strings. |
| `maxLength` | `number` | `0` | Sets `maxlength` and shows a counter when greater than zero. |
| `minLength` | `number` | `0` | Adds `Validators.minLength` when greater than zero. |
| `pattern` | `string` | `''` | Adds `Validators.pattern` when non-empty. |
| `autocomplete` | `string` | `''` | Native autocomplete hint. |
| `spellcheck` | `boolean` | `true` | Native spellcheck toggle. |
| `inputmode` | `string` | `''` | Native `inputmode` hint. |
| `prefixText` | `string` | `''` | Leading affix text inside the field. |
| `suffixText` | `string` | `''` | Trailing affix text inside the field. |
| `showClear` | `boolean` | `false` | Shows a clear button when a value exists. |
| `showPasswordToggle` | `boolean` | `false` | Shows a visibility toggle when `type` is `password`. |
| `ariaLabel` | `string` | `''` | Overrides the accessible name when no visible label is desired. |
| `ariaDescribedBy` | `string` | `''` | Additional ids merged into `aria-describedby`. |
| `tabIndex` | `number` | `0` | Tab order for the native input. |
| `autofocus` | `boolean` | `false` | Applies native `autofocus`. |
| `className` | `string` | `''` | Extra classes on the root `.pixel-input` element. |
| `classList` | `PixelInputClassValue` | `''` | Structured class map support (string, array, or record). |

## Outputs

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `string` | Emits whenever the string value changes from typing, paste, or clear actions. |
| `inputChange` | `string` | Mirrors the native `input` event with the latest string. |
| `focusChange` | `boolean` | Emits `true` when the field receives focus. |
| `blurChange` | `boolean` | Emits `true` after blur (matches other Pixel form controls). |
| `enterPress` | `KeyboardEvent` | Fires when Enter is pressed. |
| `clearClick` | `MouseEvent` | Fires when the clear button is pressed. |
| `iconClick` | `PixelInputIconClickEvent` | Fires when the password visibility toggle is pressed. |

## Examples

### Controlled field

```html
<pixel-input
  label="City"
  placeholder="San Francisco"
  [value]="city()"
  (valueChange)="city.set($event)"
/>
```

### Reactive form

```typescript
readonly cityControl = new FormControl('', { nonNullable: true, validators: Validators.required });
```

```html
<pixel-input label="City" helperText="Where do you live?" [formControl]="cityControl" />
```

### Template-driven form

Import `FormsModule` in the parent standalone component, then bind explicitly:

```html
<pixel-input
  label="Nickname"
  name="nickname"
  required
  [ngModel]="nickname"
  (ngModelChange)="nickname = $event"
/>
```

### Password visibility

```html
<pixel-input
  label="Password"
  type="password"
  [showPasswordToggle]="true"
  [value]="password()"
  (valueChange)="password.set($event)"
/>
```

### Character counter

```html
<pixel-input
  label="Bio"
  [maxLength]="160"
  [value]="bio()"
  helperText="Share a short introduction."
  (valueChange)="bio.set($event)"
/>
```

### Textarea (multiline)

The same component renders a `<textarea>` when `multiline` is set. All form integration,
validation, helper, counter, and clear-button behavior is preserved.

```html
<pixel-input
  label="Notes"
  helperText="Use multiple lines to describe the change."
  [multiline]="true"
  [rows]="4"
  [maxLength]="500"
  [value]="notes()"
  (valueChange)="notes.set($event)"
/>
```

Use `autoResize` to grow the textarea with its content (the native resize handle is hidden):

```html
<pixel-input
  label="Description"
  [multiline]="true"
  [autoResize]="true"
  [(ngModel)]="description"
/>
```

## Accessibility

- Native `<label for>` wiring for every layout variant, including visually hidden labels
- `aria-describedby` combines helper text, optional counter ids, and external ids
- `aria-invalid`, `aria-required`, `aria-disabled`, and `aria-readonly` reflect the latest state
- Focus-visible treatments mirror checkbox focus rings for predictable keyboard navigation
- Enter emits `enterPress`; Escape clears the field when `showClear` is enabled

## Theming

All colors resolve through CSS variables on `:host`. Override tokens locally when you need a
one-off treatment:

```scss
pixel-input.hero-field {
  --pixel-input-border-focus: var(--pixel-sys-primary);
  --pixel-input-focus-ring: var(--pixel-sys-secondary-container);
}
```

Light tokens are defined by default. Dark mode follows `prefers-color-scheme: dark` and
`[data-theme='dark']` on any ancestor, mirroring `_theming.scss`.

## Testing

`pixel-input.spec.ts` exercises controlled updates, outputs, password toggles, counters, ARIA,
and theme variables using the Angular `TestBed` runner with Vitest globals.

## Migration / breaking changes

This is the initial release of `pixel-input`. Future breaking changes will be listed here when
they ship.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-input` (`PixelInputComponent`)

Accessible text field with labels, affixes, form-derived error styling, and theming hooks. Implements `ControlValueAccessor` for reactive and template-driven forms. Prefer `valueChange` and explicit `[value]` bindings when not using Angular forms.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `label` | `string` | `''` |  |
| `value` | `string` | `''` |  |
| `type` | `PixelInputType` | `'text'` |  |
| `multiline` | `boolean` | `false` |  |
| `rows` | `number` | `3` |  |
| `autoResize` | `boolean` | `false` |  |
| `resize` | `PixelInputResize` | `'vertical'` |  |
| `name` | `string` | `''` |  |
| `placeholder` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `inheritParentControlErrors` | `boolean` | `true` | When false, the field does not inherit error state from an ancestor `NgControl` (e.g. value-only fields nested inside another `ControlValueAccessor`). |
| `required` | `boolean` | `false` |  |
| `size` | `PixelInputSize` | `'md'` |  |
| `loading` | `boolean` | `false` |  |
| `disabledWhileLoading` | `boolean` | `false` |  |
| `showLoaderWhenPending` | `boolean` | `true` |  |
| `labelPosition` | `PixelInputLabelPosition` | `'top'` |  |
| `helperText` | `string` | `''` |  |
| `validationMessages` | `PixelInputValidationMessages` | `{}` |  |
| `errorOverride` | `string` | `''` |  |
| `maxLength` | `number` | `0` |  |
| `minLength` | `number` | `0` |  |
| `pattern` | `string` | `''` |  |
| `autocomplete` | `string` | `''` |  |
| `spellcheck` | `boolean` | `true` |  |
| `inputmode` | `string` | `''` |  |
| `prefixText` | `string` | `''` |  |
| `suffixText` | `string` | `''` |  |
| `showClear` | `boolean` | `false` |  |
| `showPasswordToggle` | `boolean` | `false` |  |
| `trailingIcon` | `string` | `''` |  |
| `trailingIconLabel` | `string` | `''` |  |
| `trailingIconTabIndex` | `number` | `-1` |  |
| `trailingIconDisabled` | `boolean` | `false` |  |
| `ariaLabel` | `string` | `''` |  |
| `ariaHasPopup` | `string | boolean | null` | `null` |  |
| `ariaExpanded` | `string | boolean | null` | `null` |  |
| `ariaControls` | `string` | `''` |  |
| `ariaDescribedBy` | `string` | `''` |  |
| `tabIndex` | `number` | `0` |  |
| `autofocus` | `boolean` | `false` |  |
| `showSkeleton` | `boolean` | `false` |  |
| `suppressFocusChrome` | `boolean` | `false` |  |
| `focusedChrome` | `boolean` | `false` |  |
| `className` | `string` | `''` |  |
| `classList` | `PixelInputClassValue` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `string` | Emits the full string whenever the value changes from user input or clear actions. |
| `inputChange` | `string` | Emits on each native `input` event with the latest string. |
| `focusChange` | `boolean` | Emits `true` on focus and `false` on blur. |
| `blurChange` | `boolean` | Emits `true` after blur (mirrors checkbox output shape for consistency). |
| `enterPress` | `KeyboardEvent` | Emits when Enter is pressed inside the field. |
| `clearClick` | `MouseEvent | KeyboardEvent` | Emits when the clear button is activated. |
| `iconClick` | `PixelInputIconClickEvent` | Emits when an integrated icon control is activated (password visibility or trailing action). |
| `trailingIconClick` | `MouseEvent | KeyboardEvent` | Emits when the trailing icon button is activated. |
| `nativeKeydown` | `KeyboardEvent` | Emits native keydown events from the field (after built-in handling). |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelInputSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelInputType` | `'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'` |
| `PixelInputLabelPosition` | `'top' | 'left' | 'floating' | 'hidden'` |
| `PixelInputResize` | `'none' | 'vertical' | 'horizontal' | 'both'` |
| `PixelInputClassValue` | `| string | string[] | Record<string, boolean> | null | undefined` |

### Exported interfaces

**`PixelInputIconClickEvent`**

```ts
interface PixelInputIconClickEvent {
  readonly side: 'prefix' | 'suffix';
  readonly role: 'password-toggle' | 'trailing-action';
  readonly originalEvent: MouseEvent | KeyboardEvent;
}
```

**`PixelInputValidationMessages`** — Maps `AbstractControl` error keys (e.g. `required`, `email`) to user-visible copy. Use `{requiredLength}` / `{actualLength}` placeholders for `minlength` / `maxlength` details.

```ts
interface PixelInputValidationMessages {
  required?: string;
  email?: string;
  minlength?: string;
  maxlength?: string;
  pattern?: string;
  [errorCode: string]: string | undefined;
}
```

<!-- API-CONTRACT:END -->
