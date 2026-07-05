import { computed, signal, type Signal } from '@angular/core';
import type {
  PixelTourEndReason,
  PixelTourStatus,
  PixelTourStep,
  PixelTourStepChange,
} from './pixel-tour.types';

/** @internal Direction of travel — decides where conditional/optional skips land. */
export type PixelTourDirection = 1 | -1;

/** @internal A requested move, resolved asynchronously by the service pipeline. */
export interface PixelTourTransitionIntent {
  readonly toIndex: number;
  readonly direction: PixelTourDirection;
}

/**
 * Handle for a running tour. Returned by `PixelTourService.start()` and injectable from
 * step content (templates receive it as the implicit context; component content can inject
 * `PixelTourRef`). All state is exposed as signals; all transitions are methods.
 *
 * Navigation is asynchronous: steps may wait for targets, run hooks, or navigate routes —
 * watch `status()` (`'waiting'` while a transition is in flight, `'paused'` while frozen).
 */
export class PixelTourRef<T = any> {
  private readonly _status = signal<PixelTourStatus>('idle');
  private readonly _stepIndex = signal(0);
  private readonly stepChangeListeners = new Set<(change: PixelTourStepChange<T>) => void>();
  private endListeners = new Set<(reason: PixelTourEndReason) => void>();
  private resolveFinished!: (reason: PixelTourEndReason) => void;

  /** @internal Installed by the service: runs the async step pipeline, then `_commit`s. */
  _transitionHandler: ((intent: PixelTourTransitionIntent) => void) | null = null;

  /** @internal Installed by the service: applies the `beforeAbort` veto before ending. */
  _dismissHandler: ((reason: 'skipped' | 'aborted') => void) | null = null;

  /** @internal Analytics sink for transitions the service cannot observe directly. */
  _eventSink: ((type: 'pause' | 'resume') => void) | null = null;

  /** Resolves with the end reason when the tour finishes for any reason. */
  readonly finished: Promise<PixelTourEndReason> = new Promise((resolve) => {
    this.resolveFinished = resolve;
  });

  /** Current lifecycle status. */
  readonly status: Signal<PixelTourStatus> = this._status.asReadonly();

  /** Zero-based index of the active step. */
  readonly stepIndex: Signal<number> = this._stepIndex.asReadonly();

  /** Total number of steps (conditional steps included — they keep their slot). */
  readonly total: number;

  /** The active step definition. */
  readonly activeStep: Signal<PixelTourStep<T>> = computed(
    () => this.steps[this._stepIndex()],
  );

  /** True while the active step is the last one (its `next` button reads as Done). */
  readonly isLastStep: Signal<boolean> = computed(() => this._stepIndex() === this.total - 1);

  constructor(readonly steps: readonly PixelTourStep<T>[]) {
    if (steps.length === 0) {
      throw new Error('pixel-tour: a tour needs at least one step.');
    }
    this.total = steps.length;
  }

  /** Advances to the next step, or completes the tour from the last step. */
  next(): void {
    this.request(this._stepIndex() + 1, 1);
  }

  /** Returns to the previous step (no-op on the first step). */
  previous(): void {
    if (this._stepIndex() > 0) {
      this.request(this._stepIndex() - 1, -1);
    }
  }

  /** Skips just the current step (advances without ending the tour). */
  skipStep(): void {
    this.next();
  }

  /** Jumps to the step with the given id. */
  goTo(id: string): void {
    const index = this.steps.findIndex((step) => step.id === id);
    if (index >= 0) {
      this.request(index, index >= this._stepIndex() ? 1 : -1);
    }
  }

  /** Freezes the tour (navigation no-ops) — the UI stays. Resume with `resume()`. */
  pause(): void {
    if (this._status() === 'running') {
      this._status.set('paused');
      this._eventSink?.('pause');
    }
  }

  /** Unfreezes a paused tour. */
  resume(): void {
    if (this._status() === 'paused') {
      this._status.set('running');
      this._eventSink?.('resume');
    }
  }

  /** Ends the whole tour with the terminal `skipped` status (subject to `beforeAbort`). */
  skip(): void {
    if (this._dismissHandler && this.isLive()) {
      this._dismissHandler('skipped');
    } else {
      this._end('skipped');
    }
  }

  /** Ends the tour as dismissed (subject to `beforeAbort`). */
  abort(): void {
    if (this._dismissHandler && this.isLive()) {
      this._dismissHandler('aborted');
    } else {
      this._end('aborted');
    }
  }

  /** Ends the tour as successfully finished. */
  complete(): void {
    this._end('completed');
  }

  /** @internal Started by the service once the UI is mounted (optionally at a saved index). */
  _start(atIndex = 0): void {
    if (this._status() !== 'idle') {
      return;
    }
    this._stepIndex.set(Math.min(Math.max(atIndex, 0), this.total - 1));
    this._status.set('running');
    // The first step goes through the same async pipeline as every other transition.
    if (this._transitionHandler) {
      this._transitionHandler({ toIndex: this._stepIndex(), direction: 1 });
    } else {
      this.emitStepChange();
    }
  }

  /** @internal Pipeline entering async work (hooks / waiting / navigation). */
  _setWaiting(): void {
    if (this._status() === 'running') {
      this._status.set('waiting');
    }
  }

  /** @internal Pipeline finished: commit the landing index and notify the UI. */
  _commit(index: number): void {
    const status = this._status();
    if (status !== 'running' && status !== 'waiting') {
      return;
    }
    this._status.set('running');
    this._stepIndex.set(index);
    this.emitStepChange();
  }

  /** @internal Terminal transition — idempotent. */
  _end(reason: PixelTourEndReason): void {
    if (!this.isLive() && this._status() !== 'idle') {
      return;
    }
    this._status.set(reason);
    for (const listener of this.endListeners) {
      listener(reason);
    }
    this.endListeners = new Set();
    this.stepChangeListeners.clear();
    this.resolveFinished(reason);
  }

  /** @internal The service reacts to step changes to re-anchor the card and spotlight. */
  _onStepChange(listener: (change: PixelTourStepChange<T>) => void): void {
    this.stepChangeListeners.add(listener);
  }

  /** @internal The service reacts to the end to tear the UI down. */
  _onEnd(listener: (reason: PixelTourEndReason) => void): void {
    this.endListeners.add(listener);
  }

  private isLive(): boolean {
    const status = this._status();
    return status === 'running' || status === 'waiting' || status === 'paused';
  }

  private request(toIndex: number, direction: PixelTourDirection): void {
    if (this._status() !== 'running') {
      return;
    }
    if (toIndex >= this.total) {
      this.complete();
      return;
    }
    if (this._transitionHandler) {
      this._transitionHandler({ toIndex, direction });
    } else {
      this._commit(toIndex);
    }
  }

  private emitStepChange(): void {
    const change: PixelTourStepChange<T> = {
      step: this.activeStep(),
      index: this._stepIndex(),
      total: this.total,
    };
    for (const listener of this.stepChangeListeners) {
      listener(change);
    }
  }
}
