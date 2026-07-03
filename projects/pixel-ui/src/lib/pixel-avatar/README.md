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

## 7. Accessibility guide

- Non-interactive avatars are `role="img"` with a derived `aria-label` (name + presence). Clickable
  avatars are real `<button>`s with Tab / Enter / Space support and a visible focus ring.
- Initials, icons, placeholders, and the status dot are `aria-hidden` (their meaning is folded into
  the host label); the status dot also exposes its own `aria-label` for presence.
- Default color pairings target a contrast ratio of ≥ 4.5:1; `soft` initials use the on-surface
  token deepened toward the accent.
- The group is `role="group"` with an optional `aria-label`; the overflow chip is labelled
  "N more".

## 8. Theme customization

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
