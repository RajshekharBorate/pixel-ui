import {
  DestroyRef,
  Injectable,
  Injector,
  type Signal,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import type { PixelBreadcrumbItem } from '../../pixel-breadcrumb/pixel-breadcrumb.types';
import {
  PIXEL_TITLE_CONFIG,
  type PixelTitleErrorKind,
  type PixelTitleParts,
  type PixelTitleSetOptions,
  type ResolvedPixelTitleConfig,
  resolvePixelTitleConfig,
} from './title.config';
import { formatPixelTitle, sanitizeTitleText } from './title.format';

function isCountOnlyChange(previous: PixelTitleParts, next: PixelTitleParts): boolean {
  return (
    (previous.page ?? '') === (next.page ?? '') &&
    (previous.section ?? '') === (next.section ?? '') &&
    (previous.count ?? null) !== (next.count ?? null)
  );
}

function toParts(input: string | PixelTitleParts): PixelTitleParts {
  return typeof input === 'string' ? { page: input } : { ...input };
}

/**
 * Formats and writes `document.title` through Angular {@link Title}. Adds product rules
 * Angular does not: brand prefix/suffix, unread count, truncation, sanitization, and an
 * opt-in {@link PixelTitleStrategy} for route titles.
 *
 * This is **not** a Meta / Open Graph helper (SEO is out of scope). Dialogs and drawers
 * must not call {@link set} — overlays are not navigations.
 */
@Injectable({ providedIn: 'root' })
export class PixelTitleService {
  private readonly title = inject(Title);
  /** Lazy Router lookup — injecting Router here cycles with `TitleStrategy` (NG0200). */
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly resolved: ResolvedPixelTitleConfig = resolvePixelTitleConfig(
    inject(PIXEL_TITLE_CONFIG, { optional: true }),
  );

  private readonly valueSignal = signal(this.title.getTitle());
  private lastParts: PixelTitleParts = {};
  private writeGeneration = 0;
  private countTimer: ReturnType<typeof setTimeout> | null = null;

  /** Current resolved document title (same string passed to Angular `Title`). */
  readonly value: Signal<string> = this.valueSignal.asReadonly();

  /** Merged defaults from {@link PIXEL_TITLE_CONFIG} / {@link providePixelTitle}. */
  get config(): ResolvedPixelTitleConfig {
    return this.resolved;
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.clearCountTimer());
  }

  /**
   * Replace the document title. A string is treated as `page`. Each call replaces
   * parts (it does not merge with the previous `count` / `section`). Count-only
   * updates are debounced; every other change is last-write-wins immediately.
   */
  set(input: string | PixelTitleParts, options?: PixelTitleSetOptions): void {
    if (this.isStaleNavigation(options)) {
      return;
    }
    const parts = toParts(input);
    const countOnly = isCountOnlyChange(this.lastParts, parts);
    this.lastParts = parts;
    this.writeGeneration += 1;

    if (countOnly && this.resolved.countDebounceMs > 0) {
      const generation = this.writeGeneration;
      this.clearCountTimer();
      this.countTimer = setTimeout(() => {
        this.countTimer = null;
        if (generation !== this.writeGeneration) {
          return;
        }
        this.commit(this.lastParts);
      }, this.resolved.countDebounceMs);
      return;
    }

    this.clearCountTimer();
    this.commit(parts);
  }

  /** Restore `defaultTitle` (plus prefix / suffix). */
  reset(options?: PixelTitleSetOptions): void {
    this.set({ page: this.resolved.defaultTitle }, options);
  }

  /**
   * Apply a localized error title (`not-found` / `forbidden` / `error`).
   * Does not change the URL; pair with the app's error route.
   */
  setError(kind: PixelTitleErrorKind, options?: PixelTitleSetOptions): void {
    const labels = this.resolved.labels;
    const page =
      kind === 'not-found' ? labels.notFound : kind === 'forbidden' ? labels.forbidden : labels.error;
    this.set({ page }, options);
  }

  /**
   * Use the last breadcrumb label as `page`. Route `title` (via
   * {@link PixelTitleStrategy}) wins unless the app calls this explicitly instead.
   */
  fromTrail(
    items: readonly Pick<PixelBreadcrumbItem, 'label'>[] | null | undefined,
    options?: PixelTitleSetOptions,
  ): void {
    this.set({ page: items?.at(-1)?.label ?? '' }, options);
  }

  /**
   * Used by {@link PixelTitleStrategy} after a successful navigation (leaf primary
   * route title). Missing titles reset to `defaultTitle`. Cancels a pending count debounce.
   */
  setFromRouteTitle(title: string | null | undefined): void {
    this.clearCountTimer();
    const page = sanitizeTitleText(title);
    if (!page) {
      this.reset();
      return;
    }
    this.writeGeneration += 1;
    this.lastParts = { page };
    this.commit({ page });
  }

  private isStaleNavigation(options?: PixelTitleSetOptions): boolean {
    const expected = options?.navigationId;
    if (expected == null) {
      return false;
    }
    const current = this.injector.get(Router, null)?.lastSuccessfulNavigation()?.id;
    return current != null && expected !== current;
  }

  private commit(parts: PixelTitleParts): void {
    const formatted = formatPixelTitle(parts, this.resolved);
    this.warnDev(parts, formatted);
    this.title.setTitle(formatted);
    this.valueSignal.set(formatted);
  }

  private warnDev(parts: PixelTitleParts, formatted: string): void {
    if (!isDevMode()) {
      return;
    }
    const page = sanitizeTitleText(parts.page);
    if (!page && !sanitizeTitleText(this.resolved.defaultTitle)) {
      console.warn(
        'PixelTitleService: empty page title; pass a page string or configure defaultTitle.',
      );
    }
    const unbounded = formatPixelTitle(parts, { ...this.resolved, maxLength: Number.MAX_SAFE_INTEGER });
    if (unbounded.length > this.resolved.maxLength) {
      console.warn(
        `PixelTitleService: title exceeded maxLength (${this.resolved.maxLength}); truncated to "${formatted}".`,
      );
    }
  }

  private clearCountTimer(): void {
    if (this.countTimer != null) {
      clearTimeout(this.countTimer);
      this.countTimer = null;
    }
  }
}
