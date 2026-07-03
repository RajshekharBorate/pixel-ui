import { Injectable, computed, signal } from '@angular/core';
import {
  clampPercent,
  type PixelLoadingTask,
} from './pixel-loader.types';

/** Options accepted when registering a task with {@link PixelLoadingService.start}. */
export interface PixelLoadingStartOptions {
  /** Human-readable label surfaced to overlays / screen readers. */
  readonly message?: string;
  /** Initial determinate progress 0–100; omit for indeterminate. */
  readonly progress?: number;
  /** Category used to scope concurrent counts (e.g. `'http' | 'upload' | 'route'`). */
  readonly scope?: string;
}

/** Snapshot consumed by analytics hooks whenever the active task set changes. */
export interface PixelLoadingSnapshot {
  /** Whether anything is currently loading. */
  readonly active: boolean;
  /** Number of in-flight tasks. */
  readonly count: number;
  /** Aggregate determinate progress 0–100, or `null` when all tasks are indeterminate. */
  readonly progress: number | null;
}

/**
 * Global, signal-based loading state coordinator — the backbone for app-wide HTTP, route,
 * upload/download and feature loading. Designed to be consumed by `PixelLoadingInterceptor`,
 * router event handlers and feature code alike.
 *
 * Tracks any number of concurrent tasks keyed by id; the derived {@link active} /
 * {@link count} / {@link progress} signals stay correct as tasks start and finish in any order.
 * Reference-counts duplicate ids so overlapping requests to the same key don't end loading
 * prematurely. Inject it anywhere (`providedIn: 'root'`):
 *
 * ```ts
 * private loading = inject(PixelLoadingService);
 *
 * async save() {
 *   const id = this.loading.start({ message: 'Saving…', scope: 'http' });
 *   try { await this.api.save(); } finally { this.loading.stop(id); }
 * }
 * ```
 *
 * Or wrap a promise so start/stop are automatic:
 * ```ts
 * const result = await this.loading.track(this.api.load(), { message: 'Loading' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PixelLoadingService {
  /** Live task table keyed by id. */
  private readonly tasks = signal<ReadonlyMap<string, PixelLoadingTask>>(new Map());
  /** Reference counts so duplicate ids only clear once every starter has stopped. */
  private readonly refCounts = new Map<string, number>();
  private autoSeq = 0;

  /** Optional analytics callback invoked on every snapshot change. */
  private analyticsHook: ((snapshot: PixelLoadingSnapshot) => void) | null = null;

  /** All in-flight tasks, in insertion order. */
  readonly activeTasks = computed<readonly PixelLoadingTask[]>(() => [
    ...this.tasks().values(),
  ]);

  /** Whether anything is currently loading. */
  readonly active = computed(() => this.tasks().size > 0);

  /** Number of in-flight tasks. */
  readonly count = computed(() => this.tasks().size);

  /** Most-recent task's message (handy for a single global overlay caption). */
  readonly message = computed(() => {
    const list = this.activeTasks();
    return list.length ? (list[list.length - 1].message ?? '') : '';
  });

  /**
   * Aggregate determinate progress 0–100 across all tasks that report progress, or `null`
   * when every in-flight task is indeterminate.
   */
  readonly progress = computed<number | null>(() => {
    const determinate = this.activeTasks().filter((task) => task.progress !== null);
    if (determinate.length === 0) {
      return null;
    }
    const total = determinate.reduce((sum, task) => sum + (task.progress ?? 0), 0);
    return clampPercent(total / determinate.length);
  });

  /** Per-scope active flag, e.g. `isLoading('upload')`. Omit the scope for the global flag. */
  isLoading(scope?: string): boolean {
    if (!scope) {
      return this.active();
    }
    return this.activeTasks().some((task) => task.scope === scope);
  }

  /**
   * Register a loading task. Returns the resolved id (generated when not supplied) which must be
   * passed to {@link stop}. Calling `start` again with the same id increments a reference count
   * instead of duplicating the task.
   */
  start(options: PixelLoadingStartOptions = {}, id?: string): string {
    const taskId = id ?? `pixel-loading-${++this.autoSeq}`;
    const existingRef = this.refCounts.get(taskId) ?? 0;
    this.refCounts.set(taskId, existingRef + 1);

    if (existingRef === 0) {
      const next = new Map(this.tasks());
      next.set(taskId, {
        id: taskId,
        message: options.message,
        progress: options.progress === undefined ? null : clampPercent(options.progress),
        startedAt: Date.now(),
        scope: options.scope,
      });
      this.tasks.set(next);
      this.emitSnapshot();
    }
    return taskId;
  }

  /**
   * Update the determinate progress (0–100) of an in-flight task. No-op for unknown ids.
   * Used by upload/download handlers to drive a determinate bar.
   */
  setProgress(id: string, progress: number): void {
    const current = this.tasks().get(id);
    if (!current) {
      return;
    }
    const next = new Map(this.tasks());
    next.set(id, { ...current, progress: clampPercent(progress) });
    this.tasks.set(next);
    this.emitSnapshot();
  }

  /** Update the message of an in-flight task. No-op for unknown ids. */
  setMessage(id: string, message: string): void {
    const current = this.tasks().get(id);
    if (!current) {
      return;
    }
    const next = new Map(this.tasks());
    next.set(id, { ...current, message });
    this.tasks.set(next);
    this.emitSnapshot();
  }

  /**
   * Mark a task finished. Decrements the reference count; the task is only removed once every
   * matching {@link start} has been stopped. No-op for unknown ids.
   */
  stop(id: string): void {
    const refs = this.refCounts.get(id);
    if (refs === undefined) {
      return;
    }
    if (refs > 1) {
      this.refCounts.set(id, refs - 1);
      return;
    }
    this.refCounts.delete(id);
    if (this.tasks().has(id)) {
      const next = new Map(this.tasks());
      next.delete(id);
      this.tasks.set(next);
      this.emitSnapshot();
    }
  }

  /** Force-clear every task (e.g. on navigation cancel / global reset). */
  reset(): void {
    this.refCounts.clear();
    if (this.tasks().size > 0) {
      this.tasks.set(new Map());
      this.emitSnapshot();
    }
  }

  /**
   * Wrap a promise so the loading task is started before it runs and stopped when it settles
   * (resolve *or* reject). Returns the original promise's result.
   */
  async track<T>(work: Promise<T>, options: PixelLoadingStartOptions = {}): Promise<T> {
    const id = this.start(options);
    try {
      return await work;
    } finally {
      this.stop(id);
    }
  }

  /** Register an analytics hook fired with a fresh snapshot on every change. */
  onChange(hook: (snapshot: PixelLoadingSnapshot) => void): void {
    this.analyticsHook = hook;
  }

  private emitSnapshot(): void {
    this.analyticsHook?.({
      active: this.active(),
      count: this.count(),
      progress: this.progress(),
    });
  }
}
