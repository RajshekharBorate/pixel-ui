# pixel-button

`pixel-button` is a standalone Angular 21 button component for the `pixel-ui` library. It is designed for reusable actions, async workflows, and controlled toggle patterns with light and dark theme support driven by Angular Material-style system tokens and CSS custom properties.

## Use cases

- Primary, secondary, and subtle action buttons
- Controlled toggle buttons with explicit `input()` and `output()` bindings
- Async submit buttons with loading feedback
- Status-aware actions for success and error states
- Theme-aware actions inside light and dark application shells

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` | Optional native id for helper text, labels, and tests. |
| `buttonType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type. |
| `name` | `string` | `''` | Optional native form field name. |
| `value` | `string` | `''` | Optional native form value. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Visual size scale. |
| `state` | `'default' \| 'disabled' \| 'error' \| 'success' \| 'loading'` | `'default'` | Semantic state and interaction mode. |
| `appearance` | `'solid' \| 'outline' \| 'text' \| 'elevated' \| 'tonal' \| 'icon' \| 'mini-fab'` | `'solid'` | Maps to Material M3 filled / outlined / text / elevated / tonal / icon-button / mini-fab. |
| `fabShape` | `'circle' \| 'square'` | `'circle'` | Corner shape for `icon` and `mini-fab` (`square` = rounded square). |
| `disabled` | `boolean` | `false` | Force-disables the control. |
| `toggleable` | `boolean` | `false` | Enables controlled toggle-button behavior. |
| `pressed` | `boolean` | `false` | Controlled pressed state when `toggleable` is enabled. |
| `fullWidth` | `boolean` | `false` | Expands the button to the container width. |
| `leadingIcon` | `string` | `''` | Decorative leading icon or glyph. |
| `trailingIcon` | `string` | `''` | Decorative trailing icon or glyph. |
| `ariaLabel` | `string` | `''` | Accessible label, especially useful for icon-only usage. |
| `ariaDescribedBy` | `string` | `''` | Space-separated ids for helper text. |
| `ariaControls` | `string` | `''` | Optional controlled element id. |
| `autofocus` | `boolean` | `false` | Applies the native `autofocus` attribute. |
| `loadingLabel` | `string` | `'Loading'` | Screen-reader text announced during loading. |
| `className` | `string` | `''` | Additional utility or theme hook classes. |
| `ngClass` | `string \| string[] \| Record<string, boolean>` | `''` | Angular-style class map input without using the `ngClass` directive. |

## Outputs

| Output | Type | Description |
| --- | --- | --- |
| `click` | `MouseEvent \| KeyboardEvent` | Fires whenever the button is activated. |
| `change` | `PixelButtonChangeEvent` | Fires with the next pressed state for controlled toggle flows. |
| `toggle` | `boolean` | Fires the next pressed value as a shorthand toggle event. |

## Examples

```html
<pixel-button>Save changes</pixel-button>
```

```html
<pixel-button size="lg" appearance="outline" leadingIcon="DL">
  Download report
</pixel-button>
```

```html
<pixel-button appearance="icon" ariaLabel="Clear filters" leadingIcon="close" />
```

```html
<pixel-button appearance="icon" fabShape="square" ariaLabel="Clear filters" leadingIcon="close" />
```

```html
<pixel-button appearance="mini-fab" ariaLabel="Compose" leadingIcon="edit" />
```

```html
<pixel-button appearance="mini-fab" fabShape="square" ariaLabel="Delete" leadingIcon="delete" />
```

```html
<pixel-button
  [toggleable]="true"
  [pressed]="notificationsEnabled()"
  ariaLabel="Enable notifications"
  (change)="notificationsEnabled.set($event.pressed)"
>
  Notifications
</pixel-button>
```

```html
<section data-theme="dark">
  <pixel-button state="loading" loadingLabel="Saving your changes">
    Saving
  </pixel-button>
</section>
```

## Accessibility

- Uses a semantic native `<button>` element
- Supports visible `:focus-visible` treatment and keyboard activation states
- Adds `aria-busy`, `aria-disabled`, `aria-pressed`, and `aria-describedby` when appropriate
- Keeps async status updates available to screen readers through a live region
- Encourages explicit `ariaLabel` usage for icon-only compositions

## Theme customization

The library now follows a shared theming model similar to Angular Material: application or component shells define system tokens once, and individual components consume those tokens through their own `--pixel-button-*` aliases.

For app-level setup, import the shared Sass entry point once:

```scss
@use 'pixel-ui' as pixel;

@include pixel.theme-root();
```

Components can opt into the same host-level token setup by including the shared mixin inside their own stylesheet:

```scss
@use 'pixel-ui' as pixel;

@include pixel.theme-host();
```

System tokens available to all components include:

- `--pixel-sys-primary`
- `--pixel-sys-on-primary`
- `--pixel-sys-surface`
- `--pixel-sys-surface-container`
- `--pixel-sys-on-surface`
- `--pixel-sys-outline`
- `--pixel-sys-error`
- `--pixel-sys-success`
- `--pixel-sys-shape-corner-full`
- `--pixel-sys-motion-duration-short4`

`pixel-button` still exposes component-specific CSS custom properties under the `--pixel-button-*` namespace. Core aliases include:

- `--pixel-button-text-primary`
- `--pixel-button-text-secondary`
- `--pixel-button-bg`
- `--pixel-button-bg-hover`
- `--pixel-button-border`
- `--pixel-button-success`
- `--pixel-button-error`
- `--pixel-button-warning`

Theme overrides can be applied on any ancestor:

```html
<section data-theme="dark">
  <pixel-button>Dark shell action</pixel-button>
</section>
```

You can also define a custom theme map in Sass and apply it at the root or host level:

```scss
@use 'pixel-ui' as pixel;

$account-theme: pixel.define-theme((
  color: (
    primary: #054f31,
    primary-hover: #043f27,
    success: #047857,
  ),
));

.account-shell {
  @include pixel.theme($account-theme);
}
```

Local component customization can still layer on top:

```scss
.account-toolbar {
  --pixel-button-bg: #054f31;
  --pixel-button-bg-hover: #043f27;
  --pixel-button-border: #054f31;
}
```

## Breaking changes

None. This is a new component addition.
