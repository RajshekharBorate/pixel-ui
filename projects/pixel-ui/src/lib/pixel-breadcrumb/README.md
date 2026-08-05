# Pixel Breadcrumb

An enterprise-grade, accessible, themeable breadcrumb navigation system for Angular 21. Built with
standalone components, signals, `input()` / `output()`, and `OnPush` change detection.

## Overview

`pixel-breadcrumb` renders a semantic `<nav><ol>` trail that can be driven three ways:

1. **Data-driven** — pass a strongly typed `PixelBreadcrumbItem[]` to `[items]`.
2. **Declarative** — author nodes with `<pixel-breadcrumb-item>` child components.
3. **Router-driven** — auto-generate from the Angular Router via `PixelBreadcrumbService`.

It supports icons, badges, tooltips, custom separators, custom templates, sizes, variants, smart
overflow collapsing (interactive dropdown or static ellipsis), full keyboard accessibility, and
light / dark theming through CSS custom properties.

```ts
import {
  PixelBreadcrumbComponent,
  PixelBreadcrumbItemComponent,
  PixelBreadcrumbService,
} from 'pixel-ui';
```

## Breadcrumb types (`type`)

| Type           | Behaviour                                                            |
| -------------- | ------------------------------------------------------------------- |
| `default`      | Full trail.                                                         |
| `compact`      | Tighter spacing.                                                    |
| `collapsed`    | Forces a static `…` ellipsis for the middle (auto threshold of 4).  |
| `dropdown`     | Forces an interactive overflow dropdown (auto threshold of 4).      |
| `icon-only`    | Shows icons only; labels stay available to screen readers.         |
| `route-driven` | Sources the trail from `PixelBreadcrumbService`.                   |
| `hierarchical` | Semantic alias of `default` for deep hierarchies.                  |

## Data model

```ts
interface PixelBreadcrumbItem {
  label: string;                 // required — visible + accessible name
  link?: string | unknown[];     // routerLink target
  href?: string;                 // external link
  icon?: string;                 // Material Symbols glyph
  queryParams?: Params;
  fragment?: string;
  active?: boolean;              // current page (aria-current)
  disabled?: boolean;
  badge?: string | number;
  tooltip?: string;
  id?: string;                   // stable track / test id
  data?: Record<string, unknown>; // analytics payload
}
```

## Inputs

| Input                 | Type                            | Default                        | Description                                                            |
| --------------------- | ------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `items`               | `PixelBreadcrumbItem[] \| null` | `null`                         | The trail. Source of truth when set (ignores projection / router).     |
| `type`                | `PixelBreadcrumbType`           | `'default'`                    | Visual / behavioural preset.                                           |
| `size`                | `'xs' \| 'sm' \| 'md' \| 'lg'`  | `'md'`                         | Density scale.                                                         |
| `variant`             | `PixelBreadcrumbVariant`        | `'minimal'`                    | `minimal` / `soft` / `solid` / `filled` / `outline`.                   |
| `separator`           | `string`                        | `'/'`                          | Separator text.                                                        |
| `separatorIcon`       | `string`                        | `''`                           | Material glyph separator (overrides `separator`).                      |
| `separatorTemplate`   | `TemplateRef \| null`           | `null`                         | Custom separator template (overrides both above).                      |
| `itemTemplate`        | `TemplateRef \| null`           | `null`                         | Custom per-item template `{ $implicit, index, isLast }`.               |
| `showHomeIcon`        | `boolean`                       | `false`                        | Render the first node with `homeIcon`.                                 |
| `homeIcon`            | `string`                        | `'home'`                       | Glyph for the home node.                                               |
| `maxVisibleItems`     | `number`                        | `0`                            | Collapse threshold. `0` disables collapsing.                           |
| `itemsBeforeCollapse` | `number`                        | `1`                            | Leading nodes kept visible when collapsed.                            |
| `itemsAfterCollapse`  | `number`                        | `0`                            | Trailing nodes kept visible (`0` derives from `maxVisibleItems`).      |
| `collapsible`         | `boolean`                       | `true`                         | Master switch for collapsing.                                          |
| `overflowMode`        | `'dropdown' \| 'ellipsis' \| 'scroll'` | `'dropdown'`            | How an over-long trail is handled (see Overflow handling).             |
| `clickable`           | `boolean`                       | `true`                         | Whether nodes are interactive.                                         |
| `showLastAsLink`      | `boolean`                       | `false`                        | Render the current node as a link when it has one.                     |
| `iconOnly`            | `boolean`                       | `false`                        | Hide labels (kept for screen readers).                                 |
| `responsive`         | `boolean`                       | `true`                         | Auto-collapse on narrow viewports / tight containers; tighter label truncation. |
| `tooltips`            | `boolean`                       | `true`                         | Show item tooltips on hover / focus.                                   |
| `preserveQueryParams` | `boolean`                       | `false`                        | `queryParamsHandling="preserve"` on router links.                      |
| `routeDriven`         | `boolean`                       | `false`                        | Source the trail from `PixelBreadcrumbService`.                        |
| `ariaLabel`           | `string`                        | `'Breadcrumb'`                 | Label for the `<nav>` landmark.                                        |
| `overflowAriaLabel`   | `string`                        | `'Show collapsed breadcrumbs'` | Label for the overflow trigger / menu.                                 |
| `animated`            | `boolean`                       | `true`                         | Fade / slide entrance (auto-off under reduced motion).                 |
| `className`           | `string`                        | `''`                           | Extra host classes.                                                    |

## Outputs

| Output           | Payload                      | Description                                       |
| ---------------- | ---------------------------- | ------------------------------------------------- |
| `itemClick`      | `PixelBreadcrumbClickEvent`  | A node was activated (mouse / keyboard).          |
| `overflowToggle` | `boolean`                    | Overflow dropdown opened (`true`) / closed.       |

`PixelBreadcrumbClickEvent` carries `{ item, index, isLast, fromOverflow, source, originalEvent }` —
ideal for analytics / tracking hooks. The full item `data` payload travels along on `event.item.data`.

## Router integration

Add a `breadcrumb` value to each route's `data`:

```ts
export const routes: Routes = [
  {
    path: 'users',
    data: { breadcrumb: 'Users' },
    children: [
      // String with :param interpolation
      { path: ':id', data: { breadcrumb: 'User :id' } },
      // Or a resolver reading the snapshot (params, resolved data, etc.)
      { path: ':id/edit', data: { breadcrumb: (r) => `Edit ${r.data['user']?.name}` } },
    ],
  },
];
```

```html
<pixel-breadcrumb routeDriven showHomeIcon separatorIcon="chevron_right" />
```

The `breadcrumb` value can be:

- a **string** (supports `:param` and `{{dataKey}}` interpolation),
- a **partial `PixelBreadcrumbItem`** (add icons, badges, etc.),
- or a **`PixelBreadcrumbResolver`** `(route) => string | Partial<PixelBreadcrumbItem>`.

For micro-frontends / entity-driven naming, register a global resolver consulted before route data:

```ts
inject(PixelBreadcrumbService).registerResolver((route) =>
  route.routeConfig?.path === 'orders/:id' ? store.orderName(route.params['id']) : null,
);
```

Lazy-loaded routes work automatically — the trail rebuilds on every `NavigationEnd`.

## Dynamic breadcrumbs

State is immutable and signal-based, so runtime updates are a simple `signal.set`:

```ts
trail = signal<PixelBreadcrumbItem[]>([{ label: 'Home', link: '/' }]);
push(node: PixelBreadcrumbItem) {
  this.trail.set([...this.trail(), node]); // immutable update
}
```

```html
<pixel-breadcrumb [items]="trail()" [maxVisibleItems]="5" />
```

## Overflow handling

```html
<!-- Home > … (dropdown) > Laptops > Gaming -->
<pixel-breadcrumb [items]="deepTrail" [maxVisibleItems]="4" overflowMode="dropdown" />
```

- Collapse triggers when `items.length > maxVisibleItems`.
- `itemsBeforeCollapse` leading nodes stay; the remainder fills from the end so the **current page is
  always visible**.
There are two overflow strategies, selected by `overflowMode`:

**Collapse (count-based, via `maxVisibleItems`)**

- `overflowMode="dropdown"` reuses the shared `pixel-menu` (via `[pixelMenuTriggerFor]`): an
  accessible `role="menu"` panel, relocated to the body overlay so it is never clipped, with built-in
  Arrow / Home / End / Escape keyboard navigation and focus management. Each collapsed row is a
  **real navigational `<a>`** (so middle-click / Ctrl-click open in a new tab). `overflowMode="ellipsis"`
  renders a static `…`.
- Programmatic control: `openOverflow()`, `closeOverflow()`, `toggleOverflow()`, and the
  `collapsed()` signal.

**Responsive auto-collapse (default `responsive`, Phase 1 + 2)**

- Below the `sm` viewport breakpoint, when `maxVisibleItems` is left at `0` and mode is not
  `scroll`, the trail auto-collapses to **3** visible nodes (`Home` + last two → parent + current)
  with a dropdown for the middle.
- If the trail is still wider than its host (long labels or a tight header), width measurement
  tightens the visible count down to a floor of **2** (`Home` … `Current`).
- Density steps down one size on narrow viewports (`lg→md`, `md→sm`); labels truncate more
  tightly; the current page is scrolled into view if anything still overflows.
- Opt out with `[responsive]="false"`, force scroll with `overflowMode="scroll"`, or set an
  explicit `maxVisibleItems`.

**Scroll (width-based)**

```html
<!-- Keeps every node; scrolls horizontally with chevrons when it overflows -->
<pixel-breadcrumb [items]="deepTrail" overflowMode="scroll" />
```

- `overflowMode="scroll"` keeps the entire trail and makes it horizontally scrollable, with chevron
  buttons at each end (`pixel-button`s, mirroring `pixel-tab-nav`). The buttons appear only when the
  track actually overflows its container, disable at the respective end, and scroll by ~70% of the
  visible width. A `ResizeObserver` keeps the affordances in sync on resize / font load, and edge
  fade masks hint at clipped content. Collapsing is disabled in this mode (`maxVisibleItems` is
  ignored).

## Accessibility

- Semantic `<nav aria-label>` › `<ol>` › `<li>` structure; separators are `aria-hidden`.
- Current page uses `aria-current="page"` and is not a link.
- Overflow trigger exposes `aria-haspopup="menu"` / `aria-expanded`; the panel is `role="menu"` with
  `role="menuitem"` items.
- **Keyboard**: Tab between nodes, Enter / Space to activate, the overflow menu supports
  Arrow Up/Down, Home/End roving focus, Escape to close (restoring focus to the trigger), and Tab to
  dismiss.
- Icon-only labels remain in the DOM (visually hidden) and surface as tooltips.
- Focus-visible rings, ≥ 4.5:1 contrast via system tokens, and `prefers-reduced-motion` support.

## Theme customization

All colors come from CSS custom properties (never hardcoded). Override per instance or globally:

```css
.pixel-breadcrumb {
  --pixel-breadcrumb-bg: transparent;
  --pixel-breadcrumb-text: …;
  --pixel-breadcrumb-active: …;
  --pixel-breadcrumb-hover: …;
  --pixel-breadcrumb-separator: …;
  --pixel-breadcrumb-icon: …;
  --pixel-breadcrumb-focus-ring: …;
  --pixel-breadcrumb-disabled: …;
  --pixel-breadcrumb-overflow-bg: …;
  --pixel-breadcrumb-overflow-hover: …;
}
```

Dark mode is handled automatically via `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.

## Migration notes

- **From Angular Material `MatBreadcrumb` / community libs**: map your item array onto
  `PixelBreadcrumbItem`. `routerLink` → `link`, external URLs → `href`, current page → `active` (or
  just make it the last item).
- **From a custom `*ngFor` trail**: drop the manual separators (the component renders them) and move
  collapsing logic to `maxVisibleItems` + `overflowMode`.
- No `NgModule` import is needed — the components are standalone and tree-shakeable. Two-way binding
  is intentionally not supported; react to `itemClick` and drive `[items]` from a signal.
```

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-breadcrumb-item` (`PixelBreadcrumbItemComponent`)

Declarative, content-projected breadcrumb node. An alternative to the data-driven `[items]` input: author the trail in markup and the parent `pixel-breadcrumb` collects each item's `PixelBreadcrumbItemComponent.snapshot` into the same `PixelBreadcrumbItem` model (so collapsing, overflow, and router integration all keep working). The component itself renders nothing — it is a typed configuration carrier read via `contentChildren`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `''` |  |
| `link` | `PixelBreadcrumbLink | undefined` | `undefined` |  |
| `href` | `string | undefined` | `undefined` |  |
| `icon` | `string` | `''` |  |
| `queryParams` | `Params | undefined` | `undefined` |  |
| `fragment` | `string | undefined` | `undefined` |  |
| `active` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `badge` | `string | number | undefined` | `undefined` |  |
| `tooltip` | `string | undefined` | `undefined` |  |
| `itemId` | `string | undefined` | `undefined` |  |
| `data` | `Readonly<Record<string, unknown>> | undefined` | `undefined` |  |

### Component `pixel-breadcrumb` (`PixelBreadcrumbComponent`)

Enterprise-grade, accessible, themeable breadcrumb navigation. Renders a semantic `<nav><ol>` trail that is fully data-driven: pass a strongly typed `PixelBreadcrumbItem` array via `[items]`, author nodes declaratively with `<pixel-breadcrumb-item>`, or let it auto-generate from the Angular Router (`routeDriven` / `PixelBreadcrumbService`). Supports icons, custom separators, badges, tooltips, smart overflow collapsing with an interactive dropdown, multi-level hierarchies, sizes, variants, and light / dark theming. State is driven entirely by signals; the public API uses `input()` / `output()` only — no two-way binding.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `showSkeleton` | `boolean` | `false` | When true, replaces the breadcrumb trail with skeleton pill placeholders. |
| `skeletonCount` | `number` | `0` | Number of skeleton breadcrumb items. Defaults to items array length, otherwise 3. |
| `items` | `readonly PixelBreadcrumbItem[] | null` | `null` |  |
| `type` | `PixelBreadcrumbType` | `'default'` |  |
| `size` | `PixelBreadcrumbSize` | `'md'` |  |
| `variant` | `PixelBreadcrumbVariant` | `'minimal'` |  |
| `separator` | `string` | `'/'` |  |
| `separatorIcon` | `string` | `''` |  |
| `separatorTemplate` | `TemplateRef<unknown> | null` | `null` |  |
| `itemTemplate` | `TemplateRef<{ $implicit: PixelBreadcrumbViewItem; index: number; isLast: boolean; }> | null` | `null` |  |
| `showHomeIcon` | `boolean` | `false` |  |
| `homeIcon` | `string` | `'home'` |  |
| `maxVisibleItems` | `number` | `0` |  |
| `itemsBeforeCollapse` | `number` | `1` |  |
| `itemsAfterCollapse` | `number` | `0` |  |
| `collapsible` | `boolean` | `true` |  |
| `overflowMode` | `PixelBreadcrumbOverflowMode` | `'dropdown'` |  |
| `clickable` | `boolean` | `true` |  |
| `showLastAsLink` | `boolean` | `false` |  |
| `iconOnly` | `boolean` | `false` |  |
| `responsive` | `boolean` | `true` | On narrow viewports (and when the trail is wider than its container) the middle collapses into a dropdown, density steps down one size, labels truncate more tightly, and the current page stays scrolled into view. Set `false` to opt out. Ignored when `overflowMode="scroll"`. |
| `tooltips` | `boolean` | `true` |  |
| `preserveQueryParams` | `boolean` | `false` |  |
| `routeDriven` | `boolean` | `false` |  |
| `ariaLabel` | `string` | `'Breadcrumb'` |  |
| `overflowAriaLabel` | `string` | `'Show collapsed breadcrumbs'` |  |
| `animated` | `boolean` | `true` |  |
| `className` | `string` | `''` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `itemClick` | `PixelBreadcrumbClickEvent` | Emitted when a node is activated (mouse or keyboard). Carries the item, index, and source. |
| `overflowToggle` | `boolean` | Emitted when the overflow dropdown opens (`true`) or closes (`false`). |

### Service `PixelBreadcrumbService`

Generates breadcrumb trails from the Angular Router. Walks the activated route tree on every `NavigationEnd`, accumulating URL segments and reading each route's `data.breadcrumb` (`PixelBreadcrumbRouteData`). Exposes the trail as a signal so a `pixel-breadcrumb` can bind to it directly (or it can be driven automatically via the component's `routeDriven` input). Provided in root — inject it anywhere. Supports static labels, dynamic / async resolvers, lazy routes, and deeply nested trees. A custom resolver registered with `registerResolver` runs first, enabling micro-frontend and entity-driven scenarios without touching route definitions.

| Method | Signature | Description |
| --- | --- | --- |
| `registerResolver` | `registerResolver(resolver: PixelBreadcrumbResolver | null): void` | Register a global resolver consulted for every route before its static `data.breadcrumb`. Return `null`/`undefined` to fall through to the route data. Useful for entity-driven labels and micro-frontend hosts that own naming centrally. |
| `refresh` | `refresh(): void` | Force a re-computation of the trail (e.g. after an async label resolves). |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelBreadcrumbResolver` | `( route: ActivatedRouteSnapshot, ) => string | Partial<PixelBreadcrumbItem> | null | undefined` |
| `PixelBreadcrumbRouteData` | `| string | Partial<PixelBreadcrumbItem> | PixelBreadcrumbResolver` |
| `PixelBreadcrumbType` | `| 'default' | 'compact' | 'collapsed' | 'dropdown' | 'icon-only' | 'route-driven' | 'hierarchical'` |
| `PixelBreadcrumbSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelBreadcrumbVariant` | `'solid' | 'minimal' | 'soft' | 'filled' | 'outline'` |
| `PixelBreadcrumbOverflowMode` | `'dropdown' | 'ellipsis' | 'scroll'` |
| `PixelBreadcrumbLink` | `string | readonly unknown[]` |
| `PixelBreadcrumbInteractionSource` | `'mouse' | 'keyboard'` |

### Exported interfaces

**`PixelBreadcrumbItem`** — A single breadcrumb node. Only `label` is required; everything else is optional so the same shape works for static trails, router-generated trails, and entity-driven hierarchies.

```ts
interface PixelBreadcrumbItem {
  readonly label: string;
  readonly link?: PixelBreadcrumbLink;
  readonly href?: string;
  readonly icon?: string;
  readonly queryParams?: Params;
  readonly fragment?: string;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly badge?: string | number;
  readonly tooltip?: string;
  readonly id?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}
```

**`PixelBreadcrumbClickEvent`** — Payload emitted when a breadcrumb node is activated.

```ts
interface PixelBreadcrumbClickEvent {
  readonly item: PixelBreadcrumbItem;
  readonly index: number;
  readonly isLast: boolean;
  readonly fromOverflow: boolean;
  readonly source: PixelBreadcrumbInteractionSource;
  readonly originalEvent: MouseEvent | KeyboardEvent;
}
```

**`PixelBreadcrumbViewItem`** — Resolved, render-ready view of a breadcrumb item (internal + template use).

```ts
interface PixelBreadcrumbViewItem {
  readonly index: number;
  readonly key: string;
  readonly isLast: boolean;
  readonly interactive: boolean;
}
```

<!-- API-CONTRACT:END -->
