# pixel-checkbox

Standalone Angular 21 checkbox component for enterprise forms, settings panels, table selection,
and approval workflows. It uses signal-based inputs, explicit outputs, native checkbox semantics,
and scoped CSS variables for light and dark themes.

## Use Cases

- Terms, consent, and acknowledgement fields
- Multi-select filters and table row selection
- Feature toggles where checkbox semantics are preferred
- Parent selection with an indeterminate mixed state
- Validation states for required form steps

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` | Native checkbox id. A generated id is used when omitted. |
| `label` | `string` | `''` | Visible label rendered inside the clickable area. |
| `checked` | `boolean` | `false` | Controlled checked baseline. |
| `indeterminate` | `boolean` | `false` | Controlled mixed-state baseline. |
| `disabled` | `boolean` | `false` | Prevents all interaction and marks the field unavailable. |
| `required` | `boolean` | `false` | Adds native and ARIA required semantics. |
| `readonly` | `boolean` | `false` | Keeps the checkbox focusable but prevents changes. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Controls density, box size, and label scale. |
| `state` | `'indeterminate' \| 'loading' \| undefined` | `undefined` | Applies non-value visual states. Checked and unchecked are derived from `checked`, `ngModel`, or `FormControl` values. |
| `labelPosition` | `'left' \| 'right'` | `'right'` | Places the label before or after the checkbox box. |
| `helperText` | `string` | `''` | Helper copy wired through `aria-describedby`. |
| `requiredErrorMessage` | `string` | `'This field is required.'` | Message shown when Angular forms report a touched or dirty required error. |
| `ariaLabel` | `string` | `''` | Accessible name override for label-less usage. |
| `ariaDescribedBy` | `string` | `''` | External description ids appended to generated helper ids. |
| `name` | `string` | `''` | Native form field name. |
| `value` | `string` | `'on'` | Native submitted value. |
| `tabIndex` | `number` | `0` | Native tab order. |
| `autofocus` | `boolean` | `false` | Applies the native autofocus attribute. |
| `className` | `string` | `''` | Extra class string for the root label. |
| `classList` | `string \| string[] \| Record<string, boolean> \| null \| undefined` | `''` | Normalized class binding without `ngClass`. |
| `checkedIcon` | `string` | `'✓'` | Custom checked-state glyph. |
| `indeterminateIcon` | `string` | `'–'` | Custom mixed-state glyph. |

## Outputs

| Output | Type | Description |
| --- | --- | --- |
| `checkedChange` | `boolean` | Emits the next checked value after user interaction. |
| `stateChange` | `PixelCheckboxStateChangeEvent` | Emits checked, indeterminate, state, source, and original event. |
| `focusChange` | `boolean` | Emits when the native checkbox receives focus. |
| `blurChange` | `boolean` | Emits when the native checkbox loses focus. |
| `click` | `MouseEvent \| KeyboardEvent` | Emits the original activation event. |

## Checked And Indeterminate

```html
<pixel-checkbox
  label="Receive billing alerts"
  [checked]="billingAlerts()"
  (checkedChange)="billingAlerts.set($event)"
/>

<pixel-checkbox
  label="Select all rows"
  [checked]="allRowsSelected()"
  [indeterminate]="someRowsSelected() && !allRowsSelected()"
  (checkedChange)="toggleAllRows($event)"
/>
```

## Form Usage

`pixel-checkbox` implements `ControlValueAccessor`, so it works with reactive forms and
template-driven forms. Use Angular validators for invalid/error state and disable the form control
to drive disabled state.

### Reactive Forms

```ts
readonly acceptedTerms = new FormControl(false, {
  nonNullable: true,
  validators: Validators.requiredTrue,
});
```

```html
<form>
  <pixel-checkbox
    label="I accept the terms"
    helperText="Required before account creation."
    requiredErrorMessage="Please accept the terms to continue."
    required
    [formControl]="acceptedTerms"
  />
</form>
```

```ts
acceptedTerms.disable();
```

### Template-Driven Forms

```html
<pixel-checkbox
  name="terms"
  label="I accept the terms"
  requiredErrorMessage="Please accept the terms to continue."
  [(ngModel)]="acceptedTerms"
/>
```

## Accessibility

- Uses a native `<input type="checkbox">` hidden visually but kept accessible.
- Supports Tab focus and Space or Enter activation.
- Emits explicit focus and blur outputs for focus-aware forms.
- Sets `aria-checked`, `aria-disabled`, `aria-required`, and `aria-describedby`.
- Uses Angular form classes such as `ng-invalid`, `ng-touched`, and `ng-dirty` for validation styling.
- Keeps helper text neutral during validation and renders required errors as a separate error message.
- Helper text is automatically associated with the native input.
- Focus ring and semantic colors are driven by theme tokens with WCAG-friendly contrast.

## Theme Customization

The component exposes these CSS custom properties:

```scss
pixel-checkbox {
  --pixel-checkbox-bg: var(--pixel-sys-surface);
  --pixel-checkbox-bg-hover: var(--pixel-sys-surface-container);
  --pixel-checkbox-border: var(--pixel-sys-outline);
  --pixel-checkbox-border-hover: var(--pixel-sys-primary);
  --pixel-checkbox-check: var(--pixel-sys-on-primary);
  --pixel-checkbox-label: var(--pixel-sys-on-surface);
  --pixel-checkbox-helper: var(--pixel-sys-outline);
  --pixel-checkbox-focus-ring: var(--pixel-sys-focus-ring);
  --pixel-checkbox-error: var(--pixel-sys-error);
  --pixel-checkbox-warning: var(--pixel-sys-warning);
  --pixel-checkbox-disabled-bg: var(--pixel-sys-disabled-container);
  --pixel-checkbox-disabled-border: var(--pixel-sys-on-disabled);
}
```

Automatic dark mode is handled with `prefers-color-scheme`. To force a theme for a subtree:

```html
<section data-theme="dark">
  <pixel-checkbox label="Dark scoped checkbox" />
</section>
```

## Migration And Breaking Changes

This is a new component. It does not replace any existing pixel component. The semantic `state`
input only supports `indeterminate` and `loading`; checked and unchecked are derived from the bound
value. Use Angular form disabled state and validators for disabled and error cases. Direct
`checked` / `checkedChange` usage remains available for signal-controlled non-form workflows.
