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

## Behavior notes

- **Analytics (opt-in):** when `PIXEL_UI_ANALYTICS` is provided on `pixel-radio-group`, selection
  emits `ui.radio.select` with `groupId` / `hasValue` (no option labels). Set `analyticsEmitValue`
  to include primitive string/number `value`.
- `pixel-radio-group` owns single selection, keyboard navigation, validation, and CVA; options via `options` / `optionGroups` or projected `pixel-radio`.
- Layout: horizontal / vertical / grid; visual variants via `card` / `bordered` / `filled` / `compact`.
- `readonly` prevents changes while keeping focus; `disabled` disables the group or option.
- `valueComparator` defaults to `Object.is` for object values.

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

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-radio-group` (`PixelRadioGroupComponent`)

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | `null` | Baseline selection when not bound to Angular forms. |
| `options` | `readonly PixelRadioOption[]` | `[]` | Declarative options API; projected `pixel-radio` children are also supported. |
| `optionGroups` | `readonly PixelRadioOptionGroup[]` | `[]` | Renders titled sections of options. |
| `label` | `string` | `''` |  |
| `helperText` | `string` | `''` |  |
| `hintText` | `string` | `''` |  |
| `descriptionText` | `string` | `''` |  |
| `showSkeleton` | `boolean` | `false` |  |
| `skeletonRows` | `number` | `0` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `required` | `boolean` | `false` |  |
| `state` | `PixelRadioVisualState` | `'default'` |  |
| `size` | `PixelRadioSize` | `'md'` |  |
| `layout` | `PixelRadioLayout` | `'vertical'` |  |
| `labelPosition` | `PixelRadioLabelPosition` | `'right'` |  |
| `name` | `string` | `''` |  |
| `analyticsId` | `string` | `''` | Stable analytics id for this radio group. When `PIXEL_UI_ANALYTICS` is provided, selection emits `ui.radio.select` without option labels. Primitive string/number values are included only when `analyticsEmitValue` is true. |
| `analyticsEmitValue` | `boolean` | `false` | When true, include the selected primitive value in analytics (string/number only). |
| `analyticsProperties` | `Record<string, unknown>` | `{}` | Extra analytics properties (reserved keys win). |
| `gridColumns` | `string` | `'repeat(auto-fit, minmax(12rem, 1fr))'` |  |
| `bordered` | `boolean` | `false` |  |
| `filled` | `boolean` | `false` |  |
| `compact` | `boolean` | `false` |  |
| `card` | `boolean` | `false` |  |
| `requiredErrorMessage` | `string` | `'Please select an option.'` |  |
| `className` | `string` | `''` |  |
| `classList` | `PixelRadioClassValue` | `''` |  |
| `valueComparator` | `(a: unknown, b: unknown) => boolean` | `(a, b) => Object.is(a, b)` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `unknown` | Emits the next selected value. |
| `selectionChange` | `PixelRadioSelectionChangeEvent` | Emits a rich selection payload. |
| `focusChange` | `boolean` | Emits when group focus state changes. |
| `blurChange` | `boolean` | Emits when the group is blurred. |
| `optionClick` | `PixelRadioSelectionChangeEvent` | Emits when an option is clicked. |
| `keyboardSelection` | `PixelRadioSelectionChangeEvent` | Emits when keyboard changes selection. |
| `hoverChange` | `{ value: unknown; hovered: boolean }` | Emits hover state for an option value. |

### Component `pixel-radio` (`PixelRadioComponent`)

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | `null` |  |
| `label` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `hint` | `string` | `''` |  |
| `helperText` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `required` | `boolean` | `false` |  |
| `state` | `PixelRadioVisualState` | `'default'` |  |
| `size` | `PixelRadioSize` | `'md'` |  |
| `labelPosition` | `PixelRadioLabelPosition` | `'right'` |  |
| `icon` | `string` | `''` |  |
| `imageUrl` | `string` | `''` |  |
| `imageAlt` | `string` | `''` |  |
| `badge` | `string` | `''` |  |
| `card` | `boolean` | `false` |  |
| `bordered` | `boolean` | `false` |  |
| `filled` | `boolean` | `false` |  |
| `compact` | `boolean` | `false` |  |
| `id` | `string` | `''` |  |
| `name` | `string` | `''` |  |
| `ariaLabel` | `string` | `''` |  |
| `className` | `string` | `''` |  |
| `classList` | `PixelRadioClassValue` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `unknown` | Emits when this option becomes selected. |
| `selectionChange` | `PixelRadioSelectionChangeEvent` | Emits a rich selection payload. |
| `focusChange` | `boolean` | Emits focus state. |
| `blurChange` | `boolean` | Emits blur state. |
| `optionClick` | `PixelRadioSelectionChangeEvent` | Emits when the option is activated. |
| `keyboardSelection` | `PixelRadioSelectionChangeEvent` | Emits keyboard-driven selection. |
| `hoverChange` | `{ value: unknown; hovered: boolean }` | Emits hover state. |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelRadioSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelRadioVisualState` | `'default' | 'disabled' | 'readonly' | 'error'` |
| `PixelRadioLayout` | `'horizontal' | 'vertical' | 'grid'` |
| `PixelRadioLabelPosition` | `'right' | 'left' | 'top' | 'bottom'` |
| `PixelRadioClassValue` | `| string | string[] | Record<string, boolean> | null | undefined` |
| `PixelRadioInteractionSource` | `'mouse' | 'keyboard'` |

### Exported interfaces

**`PixelRadioOption`**

```ts
interface PixelRadioOption {
  readonly value: T;
  readonly label?: string;
  readonly description?: string;
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly icon?: string;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  readonly badge?: string;
  readonly metadata?: Record<string, unknown>;
  readonly card?: boolean;
}
```

**`PixelRadioOptionGroup`**

```ts
interface PixelRadioOptionGroup {
  readonly label: string;
  readonly options: readonly PixelRadioOption<T>[];
}
```

**`PixelRadioSelectionChangeEvent`**

```ts
interface PixelRadioSelectionChangeEvent {
  readonly value: T;
  readonly previousValue: T | null;
  readonly source: PixelRadioInteractionSource;
  readonly originalEvent?: Event;
}
```

<!-- API-CONTRACT:END -->
