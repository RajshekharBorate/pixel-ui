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

## Theming

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
