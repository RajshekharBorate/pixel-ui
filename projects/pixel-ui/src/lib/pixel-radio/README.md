# pixel-radio

Enterprise-grade radio button system for Angular 21 with standalone components, signal inputs, explicit outputs, accessible native radio semantics, and themeable CSS variables.

## Components

| Component | Selector | Role |
| --- | --- | --- |
| `PixelRadioGroupComponent` | `pixel-radio-group` | Manages single selection, keyboard navigation, validation, and forms integration |
| `PixelRadioComponent` | `pixel-radio` | Individual radio option (standalone or inside a group) |

## Use cases

- Single-choice questions in forms (reactive or template-driven)
- Horizontal, vertical, or grid option layouts
- Card-style selectable plans or payment methods
- Rich options with icons, images, descriptions, and badges
## Group inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | `null` | Controlled selected value |
| `options` | `PixelRadioOption[]` | `[]` | Declarative flat options |
| `optionGroups` | `PixelRadioOptionGroup[]` | `[]` | Grouped sections of options |
| `label` | `string` | `''` | Fieldset legend |
| `helperText` | `string` | `''` | Helper below the group |
| `hintText` | `string` | `''` | Hint above options |
| `descriptionText` | `string` | `''` | Description below legend |
| `disabled` | `boolean` | `false` | Disables the group |
| `readonly` | `boolean` | `false` | Prevents changes |
| `required` | `boolean` | `false` | Required validation |
| `state` | `PixelRadioVisualState` | `'default'` | Visual state |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Option size |
| `layout` | `'horizontal' \| 'vertical' \| 'grid'` | `'vertical'` | Layout mode |
| `labelPosition` | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` | Label placement |
| `name` | `string` | `''` | Native radio name |
| `gridColumns` | `string` | `repeat(auto-fit, minmax(12rem, 1fr))` | Grid template |
| `bordered` | `boolean` | `false` | Bordered options |
| `filled` | `boolean` | `false` | Filled options |
| `compact` | `boolean` | `false` | Compact density |
| `card` | `boolean` | `false` | Card-style options |
| `valueComparator` | `(a, b) => boolean` | `Object.is` | Value equality |
| `className` / `classList` | — | — | Custom classes |

## Radio inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | `null` | Option value |
| `label` | `string` | `''` | Visible label |
| `description` | `string` | `''` | Secondary text |
| `hint` | `string` | `''` | Short hint |
| `icon` | `string` | `''` | Material Symbols icon |
| `imageUrl` / `imageAlt` | `string` | `''` | Optional image |
| `badge` | `string` | `''` | Inline badge |
| `card` / `bordered` / `filled` / `compact` | `boolean` | `false` | Visual variants |
| `disabled` / `readonly` / `required` | `boolean` | `false` | State flags |
| `state` | `PixelRadioVisualState` | `'default'` | Visual override |
| `size` / `labelPosition` | — | inherits from group | Density and layout |

## Outputs

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `unknown` | Next selected value |
| `selectionChange` | `PixelRadioSelectionChangeEvent` | Rich selection payload |
| `focusChange` | `boolean` | Focus state |
| `blurChange` | `boolean` | Blur state |
| `optionClick` | `PixelRadioSelectionChangeEvent` | Option activated |
| `keyboardSelection` | `PixelRadioSelectionChangeEvent` | Keyboard selection |
| `hoverChange` | `{ value, hovered }` | Hover state |

## Radio group usage

```html
<pixel-radio-group
  label="Notification channel"
  helperText="Choose one channel."
  [value]="channel()"
  (valueChange)="channel.set($event)"
  [options]="[
    { value: 'email', label: 'Email', icon: 'mail' },
    { value: 'sms', label: 'SMS', icon: 'sms' }
  ]"
/>
```

### Projected options

```html
<pixel-radio-group label="Plan" [value]="plan()" (valueChange)="plan.set($event)">
  <pixel-radio [value]="'starter'" label="Starter" />
  <pixel-radio [value]="'pro'" label="Pro" description="Best for teams" />
</pixel-radio-group>
```

## Reactive forms

```html
<pixel-radio-group
  label="Shipping speed"
  required
  [formControl]="shippingControl"
  [options]="shippingOptions"
/>
```

```ts
shippingControl = new FormControl<string | null>(null, Validators.required);
```

## Template-driven forms

```html
<pixel-radio-group
  name="priority"
  label="Priority"
  required
  [(ngModel)]="priority"
  [options]="priorityOptions"
/>
```

## Accessibility

- Native `<input type="radio">` with custom indicator
- `fieldset` / `legend` semantics on the group
- `role="radiogroup"` on option containers
- Roving `tabIndex` within the group
- Arrow keys and Space / Enter selection
- `aria-checked`, `aria-required`, `aria-invalid`, `aria-disabled`
- Minimum 44px touch targets on card options

## Theme customization

Override CSS variables on a host or ancestor:

```scss
.my-panel {
  --pixel-radio-selected: #2962ff;
  --pixel-radio-focus-ring: #6490ff;
}
```

Supports `prefers-color-scheme: dark` and `[data-theme="dark"]` overrides.

## Keyboard interaction

| Key | Action |
| --- | --- |
| Tab | Move focus into/out of the group |
| Arrow keys | Move selection (layout-aware) |
| Space / Enter | Select focused option |

## Migration notes

- Prefer `[value]` + `(valueChange)` instead of two-way binding on the group.
- Bind `valueComparator` when option values are objects.
- Use `pixel-radio-group` as the `ControlValueAccessor` for forms, not individual radios.
