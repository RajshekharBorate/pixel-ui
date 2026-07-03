import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  Data,
  NavigationEnd,
  Params,
  Router,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import type { PixelBreadcrumbItem } from './pixel-breadcrumb.types';

/**
 * Resolver signature for a dynamic route label. Receives the matched route snapshot (so you can read
 * `params`, `data`, resolved values, etc.) and returns the label — or a fully-formed partial item.
 *
 * @example
 * ```ts
 * { path: 'users/:id', data: { breadcrumb: (r: ActivatedRouteSnapshot) => r.data['user']?.name } }
 * ```
 */
export type PixelBreadcrumbResolver = (
  route: ActivatedRouteSnapshot,
) => string | Partial<PixelBreadcrumbItem> | null | undefined;

/**
 * The accepted shapes for the `breadcrumb` value on a route's `data`:
 * - a static `string` label,
 * - a partial {@link PixelBreadcrumbItem} (icon, badge, etc.),
 * - or a {@link PixelBreadcrumbResolver} for async / param-driven labels.
 */
export type PixelBreadcrumbRouteData =
  | string
  | Partial<PixelBreadcrumbItem>
  | PixelBreadcrumbResolver;

/** The `data` key the service reads when walking the route tree. */
export const PIXEL_BREADCRUMB_DATA_KEY = 'breadcrumb';

/**
 * Generates breadcrumb trails from the Angular Router. Walks the activated route tree on every
 * `NavigationEnd`, accumulating URL segments and reading each route's `data.breadcrumb`
 * ({@link PixelBreadcrumbRouteData}). Exposes the trail as a signal so a `pixel-breadcrumb` can bind
 * to it directly (or it can be driven automatically via the component's `routeDriven` input).
 *
 * Provided in root — inject it anywhere. Supports static labels, dynamic / async resolvers, lazy
 * routes, and deeply nested trees. A custom resolver registered with {@link registerResolver} runs
 * first, enabling micro-frontend and entity-driven scenarios without touching route definitions.
 *
 * @example
 * ```ts
 * const items = inject(PixelBreadcrumbService).items; // Signal<PixelBreadcrumbItem[]>
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PixelBreadcrumbService {
  private readonly router = inject(Router);

  /** Optional global resolver consulted before route `data.breadcrumb`. */
  private readonly customResolver = signal<PixelBreadcrumbResolver | null>(null);

  private readonly trail = signal<readonly PixelBreadcrumbItem[]>([]);

  /** The current router-generated breadcrumb trail. */
  readonly items: Signal<readonly PixelBreadcrumbItem[]> = this.trail.asReadonly();

  /** The label of the current (last) breadcrumb, or `''` when the trail is empty. */
  readonly currentLabel = computed(() => this.trail().at(-1)?.label ?? '');

  constructor() {
    this.rebuild();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.rebuild());
  }

  /**
   * Register a global resolver consulted for every route before its static `data.breadcrumb`.
   * Return `null`/`undefined` to fall through to the route data. Useful for entity-driven labels
   * and micro-frontend hosts that own naming centrally.
   */
  registerResolver(resolver: PixelBreadcrumbResolver | null): void {
    this.customResolver.set(resolver);
    this.rebuild();
  }

  /** Force a re-computation of the trail (e.g. after an async label resolves). */
  refresh(): void {
    this.rebuild();
  }

  private rebuild(): void {
    const root = this.router.routerState.snapshot.root;
    this.trail.set(this.build(root, '', []));
  }

  private build(
    route: ActivatedRouteSnapshot,
    parentUrl: string,
    acc: PixelBreadcrumbItem[],
  ): PixelBreadcrumbItem[] {
    const segment = route.url.map((s) => s.path).join('/');
    const url = segment ? `${parentUrl}/${segment}` : parentUrl;

    const resolved = this.resolveItem(route, url);
    if (resolved) {
      // De-dupe identical consecutive links (empty-path / pathless wrapper routes).
      const previous = acc.at(-1);
      if (!previous || previous.label !== resolved.label || previous.link !== resolved.link) {
        acc.push(resolved);
      }
    }

    const child = route.firstChild;
    return child ? this.build(child, url, acc) : acc;
  }

  private resolveItem(
    route: ActivatedRouteSnapshot,
    url: string,
  ): PixelBreadcrumbItem | null {
    const link = url || '/';

    const custom = this.customResolver()?.(route);
    const fromCustom = this.normalize(custom, link, route.params, route.data);
    if (fromCustom) {
      return fromCustom;
    }

    const raw = route.data[PIXEL_BREADCRUMB_DATA_KEY] as PixelBreadcrumbRouteData | undefined;
    if (raw == null) {
      return null;
    }
    const value = typeof raw === 'function' ? raw(route) : raw;
    return this.normalize(value, link, route.params, route.data);
  }

  private normalize(
    value: string | Partial<PixelBreadcrumbItem> | null | undefined,
    link: string,
    params: Params,
    data: Data,
  ): PixelBreadcrumbItem | null {
    if (value == null) {
      return null;
    }
    if (typeof value === 'string') {
      const label = this.interpolate(value, params, data);
      return label ? { label, link } : null;
    }
    const label = value.label ? this.interpolate(value.label, params, data) : '';
    if (!label) {
      return null;
    }
    return { link, ...value, label };
  }

  /** Replaces `:param` / `{{data}}` tokens in a label with route params / data values. */
  private interpolate(label: string, params: Params, data: Data): string {
    return label
      .replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => String(params[key] ?? `:${key}`))
      .replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key: string) => String(data[key] ?? ''));
  }
}
