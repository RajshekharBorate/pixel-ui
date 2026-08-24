# pixel-toggle

Accessible, themeable toggle switch and segmented control for Angular 21. Signal-powered
inputs/outputs, `ControlValueAccessor` integration, keyboard support, and CSS-variable theming.

## Modes

| Mode        | Use case                                      | Value type        |
| ----------- | --------------------------------------------- | ----------------- |
| `switch`    | Boolean on/off with sliding thumb             | `boolean`         |
| `segmented` | Mutually exclusive pill selector (2+ options) | `string \| number` |

## Quick start

### Switch with label and thumb icons

Project Material Symbols via `pixel-toggle-thumb-icon`, or any custom SVG / component via
`ng-template` directives (same pattern as `pixelStepIcon`):

```html
<pixel-toggle
  label="Enable Wifi"
  [checked]="wifiEnabled()"
  (checkedChange)="wifiEnabled.set($event)"
>
  <ng-template pixelToggleCheckedIcon>
    <pixel-toggle-thumb-icon icon="check" />
  </ng-template>
  <ng-template pixelToggleUncheckedIcon>
    <pixel-toggle-thumb-icon icon="remove" />
  </ng-template>
</pixel-toggle>
```

Import `PixelToggleCheckedIconDirective`, `PixelToggleUncheckedIconDirective`, and
`PixelToggleThumbIconComponent` in the consuming standalone component.

For custom glyphs (inline SVG, images), project them directly — the toggle applies thumb sizing
via encapsulated projection styles.

### Labeled track with thumb icons

```html
<pixel-toggle
  switchAppearance="labeled"
  onLabel="ON"
  offLabel="OFF"
  [checked]="powerOn()"
  (checkedChange)="powerOn.set($event)"
>
  <ng-template pixelToggleCheckedIcon>
    <pixel-toggle-thumb-icon icon="check" />
  </ng-template>
  <ng-template pixelToggleUncheckedIcon>
    <pixel-toggle-thumb-icon icon="close" />
  </ng-template>
</pixel-toggle>
```

### Segmented — contained (colored track, light indicator)

```html
<pixel-toggle
  mode="segmented"
  segmentedAppearance="contained"
  segmentedShape="pill"
  [options]="[
    { value: 'hotels', label: 'Hotels' },
    { value: 'apartments', label: 'Apartments' },
  ]"
  [value]="stayType()"
  (valueChange)="stayType.set($event)"
/>
```

### Segmented — rounded (pixel-button corners)

```html
<pixel-toggle
  mode="segmented"
  segmentedAppearance="surface"
  segmentedShape="rounded"
  segmentedAriaLabel="Logical operator"
  [options]="[
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ]"
  [value]="operator()"
  (valueChange)="operator.set($event)"
/>
```

### Reactive form

```html
<pixel-toggle label="Accept terms" required [formControl]="termsControl" />
```

## Key inputs

| Input                  | Default       | Description                                      |
| ---------------------- | ------------- | ------------------------------------------------ |
| `mode`                 | `switch`      | `switch` or `segmented`                          |
| `checked`              | `false`       | Switch checked state                             |
| `value`                | `null`        | Segmented selected value                         |
| `options`              | `[]`          | Segmented option list                            |
| `size`                 | `md`          | `xs` \| `sm` \| `md` \| `lg` — segmented reuses full `pixel-button` tokens |
| `switchAppearance`     | `default`     | `default` \| `labeled` (uses `pixel-button` height & typography) |
| `segmentedAppearance`  | `contained`   | `contained` \| `surface`                         |
| `segmentedShape`       | `rounded`     | `rounded` (button corners) \| `pill` (capsule) |
| `label`                | `''`          | External label                                   |
| `labelPosition`        | `right`       | `left` \| `right`                                |
| `onLabel` / `offLabel` | `ON` / `OFF`  | In-track labels for `labeled` switch; track width fits the longer label |
| `disabled`             | `false`       | Disables interaction                             |
| `readonly`             | `false`       | Prevents value changes                           |
| `required`             | `false`       | Form + UI required state                         |

## Thumb icon projection

| Directive                    | Slot                         |
| ---------------------------- | ---------------------------- |
| `pixelToggleCheckedIcon`     | Thumb content when checked   |
| `pixelToggleUncheckedIcon`   | Thumb content when unchecked |
| `pixel-toggle-thumb-icon`    | Material Symbols glyph helper (`icon` input) |

## Outputs

| Output               | Payload                         |
| -------------------- | ------------------------------- |
| `checkedChange`      | `boolean`                       |
| `valueChange`        | `string \| number`              |
| `checkedStateChange` | `PixelToggleCheckedChangeEvent` |
| `valueStateChange`   | `PixelToggleValueChangeEvent`   |
| `focusChange`        | `boolean`                       |
| `blurChange`         | `boolean`                       |
| `activated`          | `MouseEvent \| KeyboardEvent`   |

## Behavior notes

- `mode="switch"` is boolean (`checked` / `checkedChange`); `mode="segmented"` selects among `options` (`value` / `valueChange`).
- Implements CVA for reactive and template-driven forms; `required` / `readonly` / `disabled` apply to both modes.
- Segmented appearance/shape reuse pixel-button density tokens; labeled switches size the track to the longer of `onLabel` / `offLabel`.
- Thumb icons project via `pixelToggleCheckedIcon` / `pixelToggleUncheckedIcon` (optional `pixel-toggle-thumb-icon`).

## Theme customization

Segmented mode (`contained` / `surface`) inherits **`pixel-button` tokens** — radius, typography,
padding, colors, motion, and focus ring. Override the same CSS variables used by buttons:

```css
pixel-toggle {
  --pixel-button-bg-filled: var(--pixel-sys-primary);
  --pixel-button-surface: var(--pixel-sys-surface-container-low);
  --pixel-button-radius: 0.75rem;
}
```

Switch mode uses toggle-specific variables:

```css
pixel-toggle {
  --pixel-toggle-track-off: var(--pixel-sys-surface-container);
  --pixel-toggle-track-on: var(--pixel-sys-primary);
  --pixel-toggle-thumb-off: var(--pixel-sys-outline);
  --pixel-toggle-thumb-on: var(--pixel-sys-on-primary);
  --pixel-toggle-disabled-track: var(--pixel-sys-disabled-surface-layer);
  --pixel-toggle-disabled-thumb-on: var(--pixel-sys-surface);
  --pixel-toggle-disabled-thumb-icon: var(--pixel-sys-disabled-content);
}
```

Disabled checked switches use explicit muted track/thumb/icon colors (Material slide-toggle
pattern) instead of fading the whole control. The same disabled tokens apply to segmented mode:

- **Track / shell:** `--pixel-toggle-disabled-track`
- **Selected thumb / indicator:** `--pixel-toggle-disabled-thumb-on`
- **Labels & segment text:** `--pixel-toggle-disabled-thumb-icon`

## Accessibility

- Switch mode uses `role="switch"` with native checkbox semantics.
- Segmented mode uses `role="radiogroup"` / `role="radio"`.
- Arrow keys move selection; Space/Enter activate.
- Focus ring follows system focus tokens.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-toggle-thumb-icon` (`PixelToggleThumbIconComponent`)

Material Symbols glyph sized for a `pixel-toggle` switch thumb. Use inside `<ng-template pixelToggleCheckedIcon>` / `pixelToggleUncheckedIcon>`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `string` | *required* | Material Symbols glyph name (ligature text). |

### Component `pixel-toggle` (`PixelToggleComponent`)

Accessible, themeable toggle switch and segmented control. `switch` mode is a boolean sliding switch with optional thumb icons and in-track ON/OFF labels. `segmented` mode is a pill selector for two or more mutually exclusive options. Implements `ControlValueAccessor` for reactive and template-driven forms.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `PixelToggleMode` | `'switch'` |  |
| `id` | `string` | `''` |  |
| `label` | `string` | `''` |  |
| `checked` | `boolean` | `false` |  |
| `value` | `string | number | null` | `null` |  |
| `options` | `readonly PixelToggleOption[]` | `[]` |  |
| `showSkeleton` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `required` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `size` | `PixelToggleSize` | `'md'` |  |
| `switchAppearance` | `PixelToggleSwitchAppearance` | `'default'` |  |
| `segmentedAppearance` | `PixelToggleSegmentedAppearance` | `'contained'` |  |
| `segmentedShape` | `PixelToggleSegmentedShape` | `'rounded'` |  |
| `labelPosition` | `PixelToggleLabelPosition` | `'right'` |  |
| `onLabel` | `string` | `'ON'` |  |
| `offLabel` | `string` | `'OFF'` |  |
| `helperText` | `string` | `''` |  |
| `requiredErrorMessage` | `string` | `'This field is required.'` |  |
| `ariaLabel` | `string` | `''` |  |
| `segmentedAriaLabel` | `string` | `'Toggle options'` |  |
| `ariaDescribedBy` | `string` | `''` |  |
| `name` | `string` | `''` |  |
| `tabIndex` | `number` | `0` |  |
| `autofocus` | `boolean` | `false` |  |
| `className` | `string` | `''` |  |
| `classList` | `PixelToggleClassValue` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `checkedChange` | `boolean` | Emits the next checked value after user interaction (switch mode). |
| `valueChange` | `string | number` | Emits the next selected value after user interaction (segmented mode). |
| `checkedStateChange` | `PixelToggleCheckedChangeEvent` | Emits a rich payload after switch interaction. |
| `valueStateChange` | `PixelToggleValueChangeEvent<string | number>` | Emits a rich payload after segmented interaction. |
| `focusChange` | `boolean` | Emits true when the control receives focus. |
| `blurChange` | `boolean` | Emits true when the control loses focus. |
| `activated` | `MouseEvent | KeyboardEvent` | Emits the original pointer or keyboard activation event. |

### Directive `[pixelToggleCheckedIcon]` (`PixelToggleCheckedIconDirective`)

Marks an `<ng-template>` as the thumb icon shown when the switch is checked. Project SVG, Material Symbols, images, or any component in place of a string input.

### Directive `[pixelToggleUncheckedIcon]` (`PixelToggleUncheckedIconDirective`)

Marks an `<ng-template>` as the thumb icon shown when the switch is unchecked. Pair with `pixelToggleCheckedIcon` for state-specific thumb glyphs.

### Exported types

| Type | Definition |
| --- | --- |
| `PixelToggleMode` | `'switch' | 'segmented'` |
| `PixelToggleSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelToggleLabelPosition` | `'left' | 'right'` |
| `PixelToggleSwitchAppearance` | `'default' | 'labeled'` |
| `PixelToggleSegmentedAppearance` | `'contained' | 'surface'` |
| `PixelToggleSegmentedShape` | `'rounded' | 'pill'` |
| `PixelToggleClassValue` | `| string | string[] | Record<string, boolean> | null | undefined` |
| `PixelToggleInteractionSource` | `'mouse' | 'keyboard'` |

### Exported interfaces

**`PixelToggleOption`**

```ts
interface PixelToggleOption {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly icon?: string;
  readonly ariaLabel?: string;
}
```

**`PixelToggleCheckedChangeEvent`**

```ts
interface PixelToggleCheckedChangeEvent {
  readonly checked: boolean;
  readonly source: PixelToggleInteractionSource;
  readonly originalEvent: MouseEvent | KeyboardEvent;
}
```

**`PixelToggleValueChangeEvent`**

```ts
interface PixelToggleValueChangeEvent {
  readonly value: T;
  readonly source: PixelToggleInteractionSource;
  readonly originalEvent: MouseEvent | KeyboardEvent;
}
```

<!-- API-CONTRACT:END -->
