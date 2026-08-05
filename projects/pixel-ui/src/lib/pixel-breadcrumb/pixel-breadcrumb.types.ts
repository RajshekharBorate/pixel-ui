import type { Params } from '@angular/router';

/**
 * Public types for the Pixel breadcrumb system.
 *
 * The breadcrumb is data-driven: callers pass a strongly typed {@link PixelBreadcrumbItem} array
 * (static, dynamic, or generated from the router by {@link PixelBreadcrumbService}). A declarative
 * `<pixel-breadcrumb-item>` content-projection API maps onto the same model.
 */

/** Visual / behavioural breadcrumb presets. */
export type PixelBreadcrumbType =
  | 'default'
  | 'compact'
  | 'collapsed'
  | 'dropdown'
  | 'icon-only'
  | 'route-driven'
  | 'hierarchical';

/** Density scale. */
export type PixelBreadcrumbSize = 'xs' | 'sm' | 'md' | 'lg';

/** Surface treatment of the breadcrumb container and its links. */
export type PixelBreadcrumbVariant = 'solid' | 'minimal' | 'soft' | 'filled' | 'outline';

/**
 * How an over-long trail is handled:
 * - `dropdown` / `ellipsis` collapse the middle items (count-based via `maxVisibleItems`, plus
 *   responsive auto-collapse on narrow viewports and width-based tightening when the trail still
 *   overflows its container);
 * - `scroll` keeps every item and scrolls the trail horizontally with chevron buttons at each end
 *   (width-based, like `pixel-tab-nav`; skips auto-collapse).
 */
export type PixelBreadcrumbOverflowMode = 'dropdown' | 'ellipsis' | 'scroll';

/** Router link target — a string path or a commands array passed straight to `routerLink`. */
export type PixelBreadcrumbLink = string | readonly unknown[];

/**
 * A single breadcrumb node. Only `label` is required; everything else is optional so the same shape
 * works for static trails, router-generated trails, and entity-driven hierarchies.
 */
export interface PixelBreadcrumbItem {
  /** Visible text (and accessible name) for the node. */
  readonly label: string;
  /** Angular router target. Renders the node as a `routerLink` anchor. */
  readonly link?: PixelBreadcrumbLink;
  /** External / absolute URL. Renders the node as a plain anchor (`href`). */
  readonly href?: string;
  /** Material Symbols glyph name shown before the label. */
  readonly icon?: string;
  /** Query params forwarded to `routerLink`. */
  readonly queryParams?: Params;
  /** Router URL fragment forwarded to `routerLink`. */
  readonly fragment?: string;
  /** Marks the node as the current page (`aria-current="page"`, never a link). */
  readonly active?: boolean;
  /** Disables interaction and dims the node. */
  readonly disabled?: boolean;
  /** Optional badge value rendered after the label (e.g. a count). */
  readonly badge?: string | number;
  /** Tooltip text shown on hover / focus. Falls back to `label` when truncated. */
  readonly tooltip?: string;
  /** Stable id used for `track` and test hooks. Auto-derived from the index when omitted. */
  readonly id?: string;
  /** Arbitrary payload surfaced on click events for analytics / tracking hooks. */
  readonly data?: Readonly<Record<string, unknown>>;
}

/** Source that produced an interaction (mouse vs keyboard). */
export type PixelBreadcrumbInteractionSource = 'mouse' | 'keyboard';

/** Payload emitted when a breadcrumb node is activated. */
export interface PixelBreadcrumbClickEvent {
  /** The activated item. */
  readonly item: PixelBreadcrumbItem;
  /** Zero-based index within the full (un-collapsed) trail. */
  readonly index: number;
  /** Whether the activated node was the last / current item. */
  readonly isLast: boolean;
  /** Whether the activation came from inside the overflow dropdown. */
  readonly fromOverflow: boolean;
  /** Input device that produced the activation. */
  readonly source: PixelBreadcrumbInteractionSource;
  /** Underlying DOM event. */
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

/** Resolved, render-ready view of a breadcrumb item (internal + template use). */
export interface PixelBreadcrumbViewItem extends PixelBreadcrumbItem {
  /** Index within the full trail. */
  readonly index: number;
  /** Stable identity for `@for` tracking. */
  readonly key: string;
  /** True for the final (current-page) node. */
  readonly isLast: boolean;
  /** True when the node should render as an interactive link/button. */
  readonly interactive: boolean;
}
