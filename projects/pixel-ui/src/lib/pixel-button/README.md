# pixel-button

`pixel-button` is a standalone Angular 21 button component for the `pixel-ui` library. It is designed for reusable actions, async workflows, and controlled toggle patterns with light and dark theme support driven by Angular Material-style system tokens and CSS custom properties.

## Use cases

- Primary, secondary, and subtle action buttons
- Controlled toggle buttons with explicit `input()` and `output()` bindings
- Async submit buttons with loading feedback
- Status-aware actions for success and error states
- Theme-aware actions inside light and dark application shells
- Joined action clusters via `pixel-button-group`
- Primary + menu via `pixel-split-button`

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

## Behavior notes

- **Analytics (opt-in):** when `PIXEL_UI_ANALYTICS` is provided and `analyticsAction` is set,
  emits `ui.button.click` with `action` (always wins over `analyticsProperties`), plus
  `appearance`, `size`, and interaction `source`. No tracking when the action is empty or the
  token is absent — keeps Pixel UI free of a hard `pixel-analytics` dependency.
- Semantic `state` (`disabled` / `error` / `success` / `loading`) plus `disabled` input; loading sets `aria-busy` and announces via `loadingLabel`.
- `toggleable` + `pressed` is controlled-only — emit `change` / `toggle`; parent owns the next pressed value.
- Appearances map to M3-style filled / outlined / text / elevated / tonal / icon / mini-fab; `fabShape` applies to icon and mini-fab.
- Icons are decorative; icon-only usage requires `ariaLabel`.
- Compose joined clusters with `pixel-button-group` and primary+menu with `pixel-split-button`.

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

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-button` (`PixelButtonComponent`)

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` | Optional element id applied to the native button. Supplies a stable id for labels, descriptions, and end-to-end selectors. |
| `buttonType` | `PixelButtonType` | `'button'` | Native button type. Controls the native button submission behavior inside forms. |
| `name` | `string` | `''` | Optional form field name. Passes a name through when the button participates in native form submission. |
| `value` | `string` | `''` | Optional form submission value. Sets the native button value for form posts. |
| `size` | `PixelButtonSize` | `'md'` | Visual size variant. Adjusts padding, height, icon size, and font sizing. |
| `showSkeleton` | `boolean` | `false` | When true, replaces the button with a skeleton placeholder sized to match the current size and appearance. |
| `state` | `PixelButtonState` | `'default'` | Semantic state variant. Applies accessible state styling and interaction rules. |
| `appearance` | `PixelButtonAppearance` | `'solid'` | Visual appearance style (aligned with Angular Material M3 buttons). `solid` = filled, `outline` = outlined, `text` = text, `elevated` = protected, `tonal` = tonal. |
| `iconColor` | `PixelButtonIconColor` | `'default'` | Glyph colour for the `icon` appearance. `default` = neutral on-surface (e.g. toolbar / calendar navigation icons), `primary` = brand colour, `error` = destructive / error colour. Ignored by all other appearances. |
| `fabShape` | `PixelButtonFabShape` | `'circle'` | Corner shape when `appearance` is `icon` or `mini-fab`. `circle` matches Material icon / mini FAB; `square` uses the standard button corner radius. |
| `disabled` | `boolean` | `false` | Disables interaction regardless of the semantic state value. Prevents pointer and keyboard activation and marks the control as unavailable. |
| `toggleable` | `boolean` | `false` | Enables a controlled toggle-button pattern. Adds `aria-pressed` and emits `change` and `toggle` events with the next pressed state. |
| `pressed` | `boolean` | `false` | Controlled pressed value used when `toggleable` is enabled. Lets parent components own the toggle state explicitly. |
| `fullWidth` | `boolean` | `false` | Makes the button stretch to the width of its container. Useful for stacked mobile actions and full-width form layouts. |
| `leadingIcon` | `string` | `''` | Optional leading icon text or glyph. Renders a decorative leading icon before projected content. |
| `trailingIcon` | `string` | `''` | Optional trailing icon text or glyph. Renders a decorative trailing icon after projected content. |
| `ariaLabel` | `string` | `''` | Accessible name for icon-only or context-light buttons. Maps directly to `aria-label` on the native button. |
| `ariaDescribedBy` | `string` | `''` | Space-separated ids describing supporting helper text. Extends the computed accessibility description with external helper content. |
| `ariaControls` | `string` | `''` | Optional id of the controlled element. Passes through to `aria-controls` for menus, drawers, and disclosure patterns. |
| `ariaExpanded` | `boolean` | — | Optional expanded state for disclosure controls (`aria-expanded`). Omit when the button is not a disclosure trigger. |
| `autofocus` | `boolean` | `false` | Automatically focuses the button on initial render. Uses the native `autofocus` attribute when a focused primary action is appropriate. |
| `loadingLabel` | `string` | `'Loading'` | Screen-reader copy announced while loading. Keeps async feedback understandable for assistive technologies. |
| `analyticsAction` | `string` | `''` | Semantic analytics action id. When set and `PIXEL_UI_ANALYTICS` is provided, emits `ui.button.click` on activation (does not require the `pixelAnalyticsTrack` directive). Opt-in product action label (e.g. `save`, `cancel`). Empty disables tracking. |
| `analyticsProperties` | `Record<string, unknown>` | `{}` | Extra analytics properties merged into the click event when `analyticsAction` is set. |
| `className` | `string` | `''` | Extra CSS classes appended to the native button. Supports quick one-off utility classes or theme hooks. |
| `ngClass` | `PixelButtonClassValue` | `''` | Angular-style class map input for advanced custom styling. Normalizes string, array, and object class declarations without relying on `ngClass`. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `click` | `MouseEvent | KeyboardEvent` | Emits whenever the button is activated by mouse or keyboard. |
| `change` | `PixelButtonChangeEvent` | Emits the next controlled pressed state for toggle-button interactions. |
| `toggle` | `boolean` | Emits a shorthand boolean pressed value for toggle-button interactions. |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelButtonSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelButtonState` | `'default' | 'disabled' | 'error' | 'success' | 'loading'` |
| `PixelButtonAppearance` | `| 'solid' | 'outline' | 'text' | 'elevated' | 'tonal' | 'icon' | 'mini-fab'` |
| `PixelButtonType` | `'button' | 'submit' | 'reset'` |
| `PixelButtonIconColor` | `'primary' | 'default' | 'error'` |
| `PixelButtonFabShape` | `'circle' | 'square'` |
| `PixelButtonInteractionSource` | `'mouse' | 'keyboard'` |
| `PixelButtonClassValue` | `| string | string[] | Record<string, boolean> | null | undefined` |

### Exported interfaces

**`PixelButtonChangeEvent`**

```ts
interface PixelButtonChangeEvent {
  pressed: boolean;
  state: PixelButtonState;
  source: PixelButtonInteractionSource;
  originalEvent: MouseEvent | KeyboardEvent;
}
```

<!-- API-CONTRACT:END -->
