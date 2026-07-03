import { InjectionToken, Injectable, computed, signal } from '@angular/core';
import {
  createLoaderRequestId,
  type PixelLoaderAnalyticsEvent,
  type PixelLoaderCompleteEvent,
  type PixelLoaderGlobalConfig,
  type PixelLoaderRequest,
  type PixelLoaderRequestOptions,
} from './pixel-loader.types';

/** Injection token for global loader defaults. */
export const PIXEL_LOADER_GLOBAL_CONFIG = new InjectionToken<PixelLoaderGlobalConfig>(
  'PIXEL_LOADER_GLOBAL_CONFIG',
);

/** Optional analytics hook invoked on loader lifecycle events. */
export type PixelLoaderAnalyticsHook = (event: PixelLoaderAnalyticsEvent) => void;

const DEFAULT_CONFIG: Required<PixelLoaderGlobalConfig> = {
  showDelay: 300,
  minimumDuration: 500,
  defaultType: 'spinner',
  defaultSize: 'md',
  defaultVariant: 'minimal',
  fullscreen: false,
  blurBackground: true,
  lockInteraction: true,
};

/**
 * Global loading state manager with multi-request tracking, delay / minimum-duration
 * orchestration and analytics hooks.
 */
@Injectable({ providedIn: 'root' })
export class PixelLoaderService {
  private readonly config = signal<Required<PixelLoaderGlobalConfig>>(DEFAULT_CONFIG);
  private readonly requests = signal<ReadonlyMap<string, PixelLoaderRequest>>(new Map());
  private readonly analyticsHooks = signal<readonly PixelLoaderAnalyticsHook[]>([]);
  private readonly globalVisible = signal(false);
  private showDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private minDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt: number | null = null;

  /** True when at least one request is active. */
  readonly isLoading = computed(() => this.requests().size > 0);

  /** True when the global overlay should render (after delay / min-duration). */
  readonly isGlobalVisible = computed(() => this.globalVisible());

  /** Active request count. */
  readonly activeCount = computed(() => this.requests().size);

  /** Snapshot of active requests (immutable). */
  readonly activeRequests = computed(() => [...this.requests().values()]);

  /** Resolved global configuration. */
  readonly globalConfig = computed(() => this.config());

  /** Aggregate progress across upload/download requests (0–100). */
  readonly aggregateProgress = computed(() => {
    const withProgress = [...this.requests().values()].filter(
      (request) => typeof request.progress === 'number',
    );
    if (withProgress.length === 0) {
      return 0;
    }
    const total = withProgress.reduce((sum, request) => sum + (request.progress ?? 0), 0);
    return Math.round(total / withProgress.length);
  });

  /** Configure global defaults (merges with existing config). */
  configure(partial: PixelLoaderGlobalConfig): void {
    this.config.update((current) => ({ ...current, ...partial }));
  }

  /** Register an analytics hook (e.g. for product telemetry). */
  registerAnalyticsHook(hook: PixelLoaderAnalyticsHook): () => void {
    this.analyticsHooks.update((hooks) => [...hooks, hook]);
    return () => {
      this.analyticsHooks.update((hooks) => hooks.filter((item) => item !== hook));
    };
  }

  /** Start tracking a loading request; returns the request id. */
  show(options: PixelLoaderRequestOptions = {}): string {
    const id = createLoaderRequestId();
    const request: PixelLoaderRequest = {
      id,
      scope: options.scope ?? 'global',
      label: options.label,
      description: options.description,
      type: options.type ?? this.config().defaultType,
      progress: options.progress,
      meta: options.meta,
      startedAt: Date.now(),
    };

    this.requests.update((map) => new Map(map).set(id, request));
    this.syncGlobalVisibility(true);
    this.emitAnalytics({ action: 'show', id, scope: request.scope, meta: request.meta });
    return id;
  }

  /** Update progress for a tracked request (upload / download). */
  updateProgress(id: string, progress: number): void {
    this.requests.update((map) => {
      const existing = map.get(id);
      if (!existing) {
        return map;
      }
      const next = new Map(map);
      next.set(id, { ...existing, progress });
      return next;
    });
  }

  /** Mark a request complete and remove it from the active set. */
  hide(id: string, failed = false): void {
    const existing = this.requests().get(id);
    if (!existing) {
      return;
    }

    const durationMs = Date.now() - existing.startedAt;
    this.requests.update((map) => {
      const next = new Map(map);
      next.delete(id);
      return next;
    });

    this.syncGlobalVisibility(false);
    this.emitAnalytics({
      action: failed ? 'error' : 'complete',
      id,
      scope: existing.scope,
      durationMs,
      meta: existing.meta,
    });
    this.emitComplete({ id, failed, scope: existing.scope });
  }

  /** Remove every active request. */
  hideAll(): void {
    const ids = [...this.requests().keys()];
    for (const id of ids) {
      this.hide(id);
    }
  }

  /** Whether any request matches the given scope. */
  isScopeLoading(scope: PixelLoaderScope): boolean {
    return [...this.requests().values()].some((request) => request.scope === scope);
  }

  /** Whether a specific request id is still active. */
  isRequestActive(id: string): boolean {
    return this.requests().has(id);
  }

  /** Force-show the global overlay (bypasses request tracking). */
  showGlobal(): void {
    this.syncGlobalVisibility(true, true);
  }

  /** Force-hide the global overlay. */
  hideGlobal(): void {
    this.globalVisible.set(false);
    this.shownAt = null;
    this.clearTimers();
  }

  private syncGlobalVisibility(wantsVisible: boolean, force = false): void {
    const hasGlobalRequests =
      force || [...this.requests().values()].some((request) => request.scope === 'global');

    if (!hasGlobalRequests) {
      this.scheduleGlobalHide();
      return;
    }

    if (!wantsVisible) {
      this.scheduleGlobalHide();
      return;
    }

    const delay = this.config().showDelay;
    this.clearShowDelayTimer();

    if (delay <= 0) {
      this.showGlobalNow();
      return;
    }

    this.showDelayTimer = setTimeout(() => {
      if (this.isLoading()) {
        this.showGlobalNow();
      }
    }, delay);
  }

  private showGlobalNow(): void {
    if (this.globalVisible()) {
      return;
    }
    this.shownAt = Date.now();
    this.globalVisible.set(true);
  }

  private scheduleGlobalHide(): void {
    if (!this.globalVisible()) {
      return;
    }

    const minDuration = this.config().minimumDuration;
    const elapsed = this.shownAt ? Date.now() - this.shownAt : minDuration;
    const remaining = Math.max(0, minDuration - elapsed);

    this.clearMinDurationTimer();
    if (remaining === 0) {
      this.globalVisible.set(false);
      this.shownAt = null;
      return;
    }

    this.minDurationTimer = setTimeout(() => {
      if (!this.isLoading()) {
        this.globalVisible.set(false);
        this.shownAt = null;
      }
    }, remaining);
  }

  private clearTimers(): void {
    this.clearShowDelayTimer();
    this.clearMinDurationTimer();
  }

  private clearShowDelayTimer(): void {
    if (this.showDelayTimer) {
      clearTimeout(this.showDelayTimer);
      this.showDelayTimer = null;
    }
  }

  private clearMinDurationTimer(): void {
    if (this.minDurationTimer) {
      clearTimeout(this.minDurationTimer);
      this.minDurationTimer = null;
    }
  }

  private emitAnalytics(event: PixelLoaderAnalyticsEvent): void {
    for (const hook of this.analyticsHooks()) {
      hook(event);
    }
  }

  private readonly completeListeners = signal<
    readonly ((event: PixelLoaderCompleteEvent) => void)[]
  >([]);

  /** Subscribe to request completion events. Returns an unsubscribe function. */
  onComplete(listener: (event: PixelLoaderCompleteEvent) => void): () => void {
    this.completeListeners.update((listeners) => [...listeners, listener]);
    return () => {
      this.completeListeners.update((listeners) => listeners.filter((item) => item !== listener));
    };
  }

  private emitComplete(event: PixelLoaderCompleteEvent): void {
    for (const listener of this.completeListeners()) {
      listener(event);
    }
  }
}

/** Provide global loader defaults via DI. */
export function providePixelLoaderConfig(config: PixelLoaderGlobalConfig) {
  return {
    provide: PIXEL_LOADER_GLOBAL_CONFIG,
    useValue: config,
  };
}
