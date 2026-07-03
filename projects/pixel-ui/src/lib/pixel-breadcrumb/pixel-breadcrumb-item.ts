import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import type { Params } from '@angular/router';
import type { PixelBreadcrumbItem, PixelBreadcrumbLink } from './pixel-breadcrumb.types';

/**
 * Declarative, content-projected breadcrumb node. An alternative to the data-driven `[items]` input:
 * author the trail in markup and the parent `pixel-breadcrumb` collects each item's
 * {@link PixelBreadcrumbItemComponent.snapshot} into the same {@link PixelBreadcrumbItem} model
 * (so collapsing, overflow, and router integration all keep working).
 *
 * The component itself renders nothing — it is a typed configuration carrier read via
 * `contentChildren`.
 *
 * @example
 * ```html
 * <pixel-breadcrumb>
 *   <pixel-breadcrumb-item label="Home" link="/" icon="home" />
 *   <pixel-breadcrumb-item label="Products" link="/products" />
 *   <pixel-breadcrumb-item label="Laptops" active />
 * </pixel-breadcrumb>
 * ```
 */
@Component({
  selector: 'pixel-breadcrumb-item',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: none' },
})
export default class PixelBreadcrumbItemComponent {
  /**
   * @component Visible text and accessible name for the node.
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component Angular router target. Renders the node as a `routerLink` anchor.
   * @type {PixelBreadcrumbLink | undefined}
   */
  readonly link = input<PixelBreadcrumbLink | undefined>(undefined);

  /**
   * @component External / absolute URL. Renders the node as a plain `href` anchor.
   * @type {string | undefined}
   */
  readonly href = input<string | undefined>(undefined);

  /**
   * @component Material Symbols glyph rendered before the label.
   * @type {string}
   * @default ''
   */
  readonly icon = input('');

  /**
   * @component Query params forwarded to `routerLink`.
   * @type {Params | undefined}
   */
  readonly queryParams = input<Params | undefined>(undefined);

  /**
   * @component Router URL fragment forwarded to `routerLink`.
   * @type {string | undefined}
   */
  readonly fragment = input<string | undefined>(undefined);

  /**
   * @component Marks the node as the current page (`aria-current="page"`, never a link).
   * @type {boolean}
   * @default false
   */
  readonly active = input(false, { transform: booleanAttribute });

  /**
   * @component Disables interaction and dims the node.
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component Badge value rendered after the label (e.g. a count).
   * @type {string | number | undefined}
   */
  readonly badge = input<string | number | undefined>(undefined);

  /**
   * @component Tooltip text shown on hover / focus.
   * @type {string | undefined}
   */
  readonly tooltip = input<string | undefined>(undefined);

  /**
   * @component Stable id used for tracking and test hooks.
   * @type {string | undefined}
   */
  readonly itemId = input<string | undefined>(undefined);

  /**
   * @component Arbitrary payload surfaced on click events for analytics / tracking hooks.
   * @type {Record<string, unknown> | undefined}
   */
  readonly data = input<Readonly<Record<string, unknown>> | undefined>(undefined);

  /** Render-ready item assembled from the declared inputs; read by the parent breadcrumb. */
  readonly snapshot: Signal<PixelBreadcrumbItem> = computed(() => ({
    label: this.label(),
    link: this.link(),
    href: this.href(),
    icon: this.icon() || undefined,
    queryParams: this.queryParams(),
    fragment: this.fragment(),
    active: this.active(),
    disabled: this.disabled(),
    badge: this.badge(),
    tooltip: this.tooltip(),
    id: this.itemId(),
    data: this.data(),
  }));
}
