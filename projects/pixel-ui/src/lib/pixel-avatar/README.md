# pixel-avatar

`pixel-avatar` and `pixel-avatar-group` are standalone Angular 21 components for the
`pixel-ui` library. They render user avatars with a robust content fallback chain,
presence status, notification badges (via `pixel-badge`), deterministic initials colors, loading
skeletons, and overlapping / grid groups. State is signal-driven and the public surface uses
`input()` / `output()` only (no two-way binding); both run `OnPush`.

Comparable in flexibility to Material Avatar, Fluent UI Persona, and Ant Design Avatar.

## 1. Component overview

```ts
import PixelAvatarComponent, { PixelAvatarGroupComponent } from 'pixel-ui';
```

```html
<pixel-avatar name="Raj Borate" status="online" [badgeCount]="6" />
<pixel-avatar imageUrl="/u/ada.png" name="Ada Lovelace" [clickable]="true" />
<pixel-avatar icon="support_agent" variant="soft" />
<pixel-avatar-group [avatars]="team" [max]="4" />
```

## 2. Avatar types (content resolution)

There is no `type` input — content is resolved automatically through a fallback chain:

```txt
imageUrl → initials (explicit or derived from name) → icon → placeholder (fallbackIcon)
```

`loading` overrides everything with a shimmer skeleton, and a broken image falls through to the
next step.

| Mode | When |
| --- | --- |
| `image` | `imageUrl` set and loads successfully |
| `initials` | `initials` set, or derivable from `name` |
| `icon` | `icon` glyph supplied |
| `placeholder` | nothing else available (`fallbackIcon`, default `person`) |
| `skeleton` | `loading` is `true` |

## 3. Inputs (`pixel-avatar`)

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` | Stable id (auto-generated fallback). |
| `name` | `string` | `''` | Display name; drives label, initials, color. |
| `imageUrl` | `string` | `''` | Profile image URL. |
| `initials` | `string` | `''` | Explicit initials (else derived from name). |
| `icon` | `string` | `''` | Material Symbols glyph. |
| `fallbackIcon` | `string` | `'person'` | Final placeholder glyph. |
| `status` | `PixelAvatarStatus` | `'none'` | Presence indicator. |
| `statusColor` | `string` | `''` | Color for `status="custom"`. |
| `badgeCount` | `number \| null` | `null` | Notification count. |
| `badgeMax` | `number` | `99` | Badge overflow threshold. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Density scale. |
| `shape` | `'circle' \| 'rounded'` | `'circle'` | Corner shape. |
| `variant` | `'solid' \| 'outline' \| 'soft'` | `'soft'` | Fill treatment. |
| `clickable` | `boolean` | `false` | Render as a button. |
| `disabled` | `boolean` | `false` | Disable + dim. |
| `loading` | `boolean` | `false` | Show skeleton. |
| `showStatus` | `boolean` | `true` | Render the status dot. |
| `showBadge` | `boolean` | `true` | Render the badge. |
| `badgePosition` | `top-right \| top-left \| bottom-right \| bottom-left` | `'top-right'` | Badge corner. |
| `statusPosition` | same as above | `'bottom-right'` | Status corner. |
| `lazyLoad` | `boolean` | `true` | `loading="lazy"` + async decode. |
| `maxInitials` | `number` | `2` | Max derived-initial characters. |
| `color` | `string` | `''` | Custom accent color (overrides deterministic). |
| `tooltip` | `string` | `''` | Tooltip text shown on hover/focus via the `pixel-tooltip` directive. |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Preferred tooltip placement (auto-flips at viewport edges). |
| `grouped` | `boolean` | `false` | Adds a separating ring. |
| `overlap` | `boolean` | `false` | Overlap spacing within a group. |
| `ariaLabel` | `string` | `''` | Accessible label override. |
| `tabIndex` | `number` | `0` | Tab order when clickable. |
| `className` | `string` | `''` | Extra classes on the frame. |

### Status values

`online` · `offline` · `away` · `busy` · `dnd` · `invisible` · `custom` · `none`.

## 4. Outputs

| Output | Payload | Description |
| --- | --- | --- |
| `avatarClick` | `PixelAvatarClickEvent` | Interactive avatar activated. |
| `avatarFocus` | `FocusEvent` | Focus gained. |
| `avatarBlur` | `FocusEvent` | Focus lost. |
| `statusClick` | `MouseEvent` | Status dot clicked. |
| `badgeClick` | `MouseEvent \| KeyboardEvent` | Badge clicked. |
| `imageLoad` | `Event` | Image loaded. |
| `imageError` | `Event` | Image failed (before fallback). |

## 5. Avatar group examples

```html
<!-- Overlapping stack with overflow -->
<pixel-avatar-group [avatars]="team" [max]="4" layout="stack" [expandable]="true" />

<!-- Evenly spaced grid -->
<pixel-avatar-group [avatars]="team" layout="grid" size="lg" />
```

```ts
team: PixelAvatarData[] = [
  { name: 'Ada Lovelace', status: 'online' },
  { name: 'Grace Hopper', imageUrl: '/u/grace.png' },
  { name: 'Alan Turing' },
  { name: 'Katherine Johnson' },
  { name: 'Linus Torvalds' },
];
```

Group inputs: `avatars`, `max` (default 4), `layout` (`stack` / `grid`), `reverse`, `expandable`,
`size`, `shape`, `variant`, `showStatus`, `clickable`, `ariaLabel`.
Group outputs: `avatarClick` (`{ avatar, index, originalEvent }`), `groupExpand` (hidden avatars).

## 6. Status examples

```html
<pixel-avatar name="Ada" status="online" />   <!-- green -->
<pixel-avatar name="Grace" status="away" />    <!-- amber -->
<pixel-avatar name="Alan" status="busy" />     <!-- red -->
<pixel-avatar name="Linus" status="offline" /> <!-- grey -->
<pixel-avatar name="Margaret" status="custom" statusColor="#6750a4" />
```

## Behavior notes

- Content resolution order: image → initials from `name` → `icon` → placeholder glyph.
- Clickable avatars render a real `<button>` (keyboard: Tab / Enter / Space); decorative
  avatars use `role="img"`.
- Loading uses `showSkeleton` sized to the avatar footprint (not a full chrome replace).
- Group overflow chip is part of `pixel-avatar-group`, not a separate empty-state.

## Accessibility

- Non-interactive avatars are `role="img"` with a derived `aria-label` (name + presence). Clickable
  avatars are real `<button>`s with Tab / Enter / Space support and a visible focus ring.
- Initials, icons, placeholders, and the status dot are `aria-hidden` (their meaning is folded into
  the host label); the status dot also exposes its own `aria-label` for presence.
- Default color pairings target a contrast ratio of ≥ 4.5:1; `soft` initials use the on-surface
  token deepened toward the accent.
- The group is `role="group"` with an optional `aria-label`; the overflow chip is labelled
  "N more".

## Theme customization

Consumes shared `--pixel-sys-*` tokens; override any avatar variable:

- `--pixel-avatar-bg`, `--pixel-avatar-border`, `--pixel-avatar-text`, `--pixel-avatar-shadow`
- `--pixel-avatar-placeholder`, `--pixel-avatar-focus-ring`, `--pixel-avatar-ring`
- `--pixel-avatar-online`, `--pixel-avatar-away`, `--pixel-avatar-busy`, `--pixel-avatar-offline`
- `--pixel-avatar-badge-bg`, `--pixel-avatar-badge-text`, `--pixel-avatar-accent`

Dark mode is automatic via `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]` /
`[data-theme="enterprise-dark"]`.

```css
.my-scope pixel-avatar {
  --pixel-avatar-accent: #6750a4;
}
```

## 9. Badge integration guide

The notification badge is a `pixel-badge` (`type="count"`) overlaid on the frame:

```html
<pixel-avatar name="Gita H" [badgeCount]="1000" [badgeMax]="999" badgePosition="top-right" />
<!-- renders 999+ -->
```

Badge colors map to `--pixel-avatar-badge-bg` / `--pixel-avatar-badge-text`, and overflow follows
`badgeMax`. Set `[showBadge]="false"` to suppress it.

## 10. Migration notes

New components — no breaking changes. Mapping from common libraries:

| Concept | Material / Fluent / Ant | pixel-avatar |
| --- | --- | --- |
| Image | `mat-card-avatar` / `Persona.image` / `Avatar.src` | `imageUrl` |
| Initials | `Persona.initials` / `Avatar` text | `name` / `initials` |
| Presence | `Persona.presence` | `status` |
| Count badge | `matBadge` | `badgeCount` |
| Group | `Avatar.Group` | `pixel-avatar-group` |

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-avatar-group` (`PixelAvatarGroupComponent`)

Renders a collection of avatars as an overlapping stack or a spaced grid, with a `+N` overflow indicator when the set exceeds `max`. Sizing / shape / variant are pushed onto each child avatar for a consistent look. Signal-driven; uses `input()` / `output()` only.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `avatars` | `readonly PixelAvatarData[]` | `[]` |  |
| `showSkeleton` | `boolean` | `false` | When true, renders skeleton circle placeholders instead of avatars. |
| `max` | `number` | `4` |  |
| `layout` | `PixelAvatarGroupLayout` | `'stack'` |  |
| `reverse` | `boolean` | `false` |  |
| `expandable` | `boolean` | `false` |  |
| `paginated` | `boolean` | `false` |  |
| `size` | `PixelAvatarSize` | `'md'` |  |
| `shape` | `PixelAvatarShape` | `'circle'` |  |
| `variant` | `PixelAvatarVariant` | `'soft'` |  |
| `showStatus` | `boolean` | `false` |  |
| `clickable` | `boolean` | `false` |  |
| `ariaLabel` | `string` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `avatarClick` | `PixelAvatarGroupClickEvent` | Emitted when a child avatar is activated. |
| `groupExpand` | `readonly PixelAvatarData[]` | Emitted when the `+N` overflow indicator is activated (non-paginated mode). |
| `pageChange` | `number` | Emitted with the new zero-based page index whenever the paginated window changes. |

### Component `pixel-avatar` (`PixelAvatarComponent`)

Enterprise-grade, accessible, themeable avatar. Resolves content through a fallback chain (image → initials → icon → placeholder), supports presence status, a notification badge (via `pixel-badge`), deterministic initials colors, loading skeletons, and click/keyboard interaction. State is signal-driven and the public surface uses `input()` / `output()` only.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `name` | `string` | `''` |  |
| `imageUrl` | `string` | `''` |  |
| `initials` | `string` | `''` |  |
| `icon` | `string` | `''` |  |
| `fallbackIcon` | `string` | `'person'` |  |
| `status` | `PixelAvatarStatus` | `'none'` |  |
| `statusColor` | `string` | `''` |  |
| `badgeCount` | `number | null` | `null` |  |
| `badgeMax` | `number` | `99` |  |
| `size` | `PixelAvatarSize` | `'md'` |  |
| `shape` | `PixelAvatarShape` | `'circle'` |  |
| `variant` | `PixelAvatarVariant` | `'soft'` |  |
| `clickable` | `boolean` | `false` |  |
| `showSkeleton` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `loading` | `boolean` | `false` |  |
| `showStatus` | `boolean` | `true` |  |
| `showBadge` | `boolean` | `true` |  |
| `badgePosition` | `PixelAvatarBadgePosition` | `'top-right'` |  |
| `statusPosition` | `PixelAvatarBadgePosition` | `'bottom-right'` |  |
| `lazyLoad` | `boolean` | `true` |  |
| `maxInitials` | `number` | `2` |  |
| `color` | `string` | `''` |  |
| `tooltip` | `string` | `''` |  |
| `tooltipPosition` | `PixelTooltipPosition` | `'top'` |  |
| `grouped` | `boolean` | `false` |  |
| `overlap` | `boolean` | `false` |  |
| `ariaLabel` | `string` | `''` |  |
| `tabIndex` | `number` | `0` |  |
| `className` | `string` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `avatarClick` | `PixelAvatarClickEvent` | Emitted when an interactive avatar is activated (mouse / keyboard). |
| `avatarFocus` | `FocusEvent` | Emitted when the avatar receives focus. |
| `avatarBlur` | `FocusEvent` | Emitted when the avatar loses focus. |
| `statusClick` | `MouseEvent` | Emitted when the presence status dot is clicked. |
| `badgeClick` | `MouseEvent | KeyboardEvent` | Emitted when the notification badge is clicked. |
| `imageLoad` | `Event` | Emitted when the image finishes loading. |
| `imageError` | `Event` | Emitted when the image fails to load (before falling back). |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelAvatarGroupLayout` | `'stack' | 'grid'` |
| `PixelAvatarVariant` | `'solid' | 'outline' | 'soft'` |
| `PixelAvatarSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelAvatarShape` | `'circle' | 'rounded'` |
| `PixelAvatarStatus` | `| 'none' | 'online' | 'offline' | 'away' | 'busy' | 'dnd' | 'invisible' | 'custom'` |
| `PixelAvatarDisplayMode` | `'image' | 'initials' | 'icon' | 'placeholder' | 'skeleton'` |
| `PixelAvatarBadgePosition` | `'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'` |

### Exported interfaces

**`PixelAvatarGroupClickEvent`** — Payload emitted when an avatar within the group is activated.

```ts
interface PixelAvatarGroupClickEvent {
  readonly avatar: PixelAvatarData;
  readonly index: number;
  readonly originalEvent: PixelAvatarClickEvent;
}
```

**`PixelAvatarData`** — Strongly-typed avatar descriptor used by `pixel-avatar-group`.

```ts
interface PixelAvatarData {
  id?: string;
  name?: string;
  imageUrl?: string;
  initials?: string;
  icon?: string;
  status?: PixelAvatarStatus;
  statusColor?: string;
  color?: string;
  tooltip?: string;
  badgeCount?: number | null;
}
```

**`PixelAvatarClickEvent`** — Payload emitted when an interactive avatar is activated.

```ts
interface PixelAvatarClickEvent {
  readonly id: string;
  readonly name: string;
  readonly source: 'mouse' | 'keyboard';
  readonly originalEvent: MouseEvent | KeyboardEvent;
}
```

<!-- API-CONTRACT:END -->
