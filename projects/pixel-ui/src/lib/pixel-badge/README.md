# pixel-badge

`pixel-badge` is a standalone Angular 21 badge / notification indicator for the
`pixel-ui` library. It anchors an overlay indicator to projected content (icon,
avatar, button) or renders a standalone inline badge (status / label pill). State is driven by
signals; the public surface uses `input()` / `output()` only (no two-way binding) and the
component runs `OnPush`.

Inspired by Google Material's badge, with first-class support for notification counts, overflow
(`99+`, `999+`), dot indicators, status markers, icon/avatar badges, animated live updates, and
light/dark theming via CSS custom properties.

## 1. Component overview

```ts
import PixelBadgeComponent from 'pixel-ui';
```

```html
<!-- Count badge attached to an icon -->
<pixel-badge [value]="10" type="count" position="top-right">
  <span class="material-symbols-outlined">notifications</span>
</pixel-badge>

<!-- Standalone status pill -->
<pixel-badge type="status" state="success" label="Online" position="inline" />
```

The component renders an anchor slot (`<ng-content>`) plus an overlay/inline indicator. When
`position="inline"` it behaves as a standalone badge in normal document flow.

## 2. Badge types

| Type | Description |
| --- | --- |
| `count` | Numeric counter with overflow (`max+`). |
| `notification` | Alias of `count` tuned for red notification bubbles. |
| `dot` | Small indicator dot, no text. |
| `pulse` | Animated pulsing dot for live activity. |
| `status` | Status dot + optional label (Online / Offline / Pending). |
| `label` | Text label pill, optional leading icon. |
| `icon` | Material Symbols glyph inside the badge. |
| `avatar` | Badge overlaid on an avatar image (via `avatarUrl`). |
| `custom` | Renders count/label/icon you supply — escape hatch. |

## 3. Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` | Stable id (auto-generated fallback). |
| `value` | `number \| string \| null` | `null` | Count or label value. |
| `type` | `PixelBadgeType` | `'count'` | Content / use-case type. |
| `variant` | `'solid' \| 'outline' \| 'filled'` | `'solid'` | Visual treatment. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Density scale. |
| `shape` | `'circle' \| 'pill'` | `'pill'` | Corner shape. |
| `position` | `PixelBadgePosition` | `'top-right'` | Overlay placement; `inline` = standalone. |
| `state` | `PixelBadgeState` | `'default'` | Semantic / interaction state. |
| `max` | `number` | `99` | Overflow threshold (`100` → `99+`). |
| `showZero` | `boolean` | `false` | Keep visible when count is `0`. |
| `hidden` | `boolean` | `false` | Hard-hide the indicator. |
| `disabled` | `boolean` | `false` | Disable interaction + dim. |
| `animated` | `boolean` | `false` | Pop transition on value change. |
| `pulse` | `boolean` | `false` | Continuous pulse ring. |
| `animation` | `PixelBadgeAnimation` | `'none'` | Preset: `pulse`/`bounce`/`blink`/`scale`/`fade`/`ripple`. |
| `clickable` | `boolean` | `false` | Renders an interactive button. |
| `removable` | `boolean` | `false` | Renders a remove affordance. |
| `icon` | `string` | `''` | Material Symbols glyph. |
| `avatarUrl` | `string` | `''` | Avatar image used as anchor. |
| `label` | `string` | `''` | Text for label / status badges. |
| `color` | `string` | `''` | Custom CSS color override. |
| `ariaLabel` | `string` | `''` | Accessible label override. |
| `ariaLive` | `'off' \| 'polite' \| 'assertive'` | `'polite'` | Live-region politeness. |
| `tabIndex` | `number` | `0` | Tab order for clickable badges. |
| `className` | `string` | `''` | Extra classes on the content element. |

### Positions

`top-right` · `top-left` · `bottom-right` · `bottom-left` · `center-right` · `center-left` ·
`inline`.

### States

`default` · `active` · `disabled` · `success` · `warning` · `error` · `info` · `loading`.

## 4. Outputs

| Output | Payload | Description |
| --- | --- | --- |
| `badgeClick` | `PixelBadgeClickEvent` | Interactive badge activated (mouse/keyboard). |
| `badgeRemove` | `PixelBadgeRemoveEvent` | Remove affordance triggered. |
| `badgeHover` | `MouseEvent` | Pointer entered the badge. |
| `valueChange` | `PixelBadgeValue` | Value changed via the public mutation API. |
| `animationComplete` | `void` | An entrance / update animation finished. |

### Public methods

| Method | Description |
| --- | --- |
| `setValue(next)` | Replace the value and emit `valueChange`. |
| `increment(step = 1)` | Add to a numeric value. |
| `decrement(step = 1)` | Subtract (clamped to `0`). |
| `reset()` | Restore the bound `value` input. |

## 5. Notification examples

```html
<pixel-badge [value]="1" />            <!-- 1 -->
<pixel-badge [value]="10" />           <!-- 10 -->
<pixel-badge [value]="120" />          <!-- 99+ -->
<pixel-badge [value]="1000" [max]="999" type="notification" /> <!-- 999+ -->

<!-- Navigation badge -->
<nav>
  <a>Mail <pixel-badge [value]="1200" [max]="999" position="inline" /></a>
  <a>Chat <pixel-badge [value]="10" position="inline" /></a>
  <a>Meet <pixel-badge [value]="3" position="inline" /></a>
</nav>
```

## 6. Status examples

```html
<pixel-badge type="status" state="success" label="Completed" position="inline" />
<pixel-badge type="status" state="warning" label="Pending" position="inline" />
<pixel-badge type="status" state="error" label="Failed" position="inline" />
<pixel-badge type="label" label="Draft" position="inline" />

<!-- Avatar online indicator -->
<pixel-badge type="dot" state="success" position="bottom-right"
  avatarUrl="/avatars/ada.png" />
```

## 7. Accessibility guide

- Non-interactive badges render `role="status"` with `aria-live` so screen readers announce
  count changes; politeness is configurable via `ariaLive`.
- A sensible `aria-label` is derived from the value/type (e.g. "10 notifications",
  "More than 99 notifications") and can be overridden with `ariaLabel`.
- Clickable badges are real `<button>` elements (or `role="button"` with keyboard handling when
  also removable) and support Tab / Enter / Space.
- Decorative dots, icons and pulse rings are `aria-hidden`.
- Focus shows a visible ring (`--pixel-badge-focus-ring`). Default color pairings target a
  contrast ratio of ≥ 4.5:1.

## 8. Theme customization

Consumes shared `--pixel-sys-*` tokens and never hardcodes colors. Override any of:

- `--pixel-badge-bg`, `--pixel-badge-bg-hover`, `--pixel-badge-border`
- `--pixel-badge-text`, `--pixel-badge-icon`, `--pixel-badge-shadow`
- `--pixel-badge-success`, `--pixel-badge-warning`, `--pixel-badge-error`, `--pixel-badge-info`
- `--pixel-badge-active`, `--pixel-badge-focus-ring`

Dark mode is supported automatically via `@media (prefers-color-scheme: dark)` and the
`[data-theme="dark"]` / `[data-theme="enterprise-dark"]` attributes.

```css
.my-scope {
  --pixel-badge-bg: #6750a4;
  --pixel-badge-text: #ffffff;
}
```

You can also pass a one-off color: `<pixel-badge [value]="3" color="#6750a4" />`.

## 9. Animation customization

- `animated` triggers a one-shot **pop** when the displayed value changes (great with
  `increment()` / live data) and emits `animationComplete`.
- `pulse` adds a continuous ring; `animation` selects a named preset
  (`pulse` / `bounce` / `blink` / `scale` / `fade` / `ripple`).
- All motion is disabled under `@media (prefers-reduced-motion: reduce)`.

## 10. Migration notes

New component — no breaking changes. Compared to Angular Material's `matBadge` directive,
`pixel-badge` is a component you wrap around the anchored content:

```html
<!-- Material -->
<button matBadge="8" matBadgePosition="before">Action</button>

<!-- pixel-badge -->
<pixel-badge [value]="8" position="top-left">
  <button>Action</button>
</pixel-badge>
```
