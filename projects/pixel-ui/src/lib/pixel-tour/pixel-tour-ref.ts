import { computed, signal, type Signal } from '@angular/core';
import type {
  PixelTourEndReason,
  PixelTourStatus,
  PixelTourStep,
  PixelTourStepChange,
} from './pixel-tour.types';

/**
 * Handle for a running tour. Returned by `PixelTourService.start()` and injectable from
 * step content (templates receive it as the implicit context; component content can inject
 * `PixelTourRef`). All state is exposed as signals; all transitions are methods.
 */
export class PixelTourRef<T = any> {
  private readonly _status = signal<PixelTourStatus>('idle');
  private readonly _stepIndex = signal(0);
  private readonly stepChangeListeners = new Set<(change: PixelTourStepChange<T>) => void>();
  private endListeners = new Set<(reason: PixelTourEndReason) => void>();
  private resolveFinished!: (reason: PixelTourEndReason) => void;

  /** Resolves with the end reason when the tour finishes for any reason. */
  readonly finished: Promise<PixelTourEndReason> = new Promise((resolve) => {
    this.resolveFinished = resolve;
  });

  /** Current lifecycle status. */
  readonly status: Signal<PixelTourStatus> = this._status.asReadonly();

  /** Zero-based index of the active step. */
  readonly stepIndex: Signal<number> = this._stepIndex.asReadonly();

  /** Total number of steps. */
  readonly total: number;

  /** The active step definition. */
  readonly activeStep: Signal<PixelTourStep<T>> = computed(
    () => this.steps[this._stepIndex()],
  );

  /** True while the active step is the last one (its `next` button reads as Done). */
  readonly isLastStep: Signal<boolean> = computed(() => this._stepIndex() === this.total - 1);

  constructor(private readonly steps: readonly PixelTourStep<T>[]) {
    if (steps.length === 0) {
      throw new Error('pixel-tour: a tour needs at least one step.');
    }
    this.total = steps.length;
  }

  /** Advances to the next step, or completes the tour from the last step. */
  next(): void {
    if (this._status() !== 'running') {
      return;
    }
    if (this.isLastStep()) {
      this.complete();
      return;
    }
    this.moveTo(this._stepIndex() + 1);
  }

  /** Returns to the previous step (no-op on the first step). */
  previous(): void {
    if (this._status() !== 'running' || this._stepIndex() === 0) {
      return;
    }
    this.moveTo(this._stepIndex() - 1);
  }

  /** Skips just the current step (advances without ending the tour). */
  skipStep(): void {
    this.next();
  }

  /** Jumps to the step with the given id. */
  goTo(id: string): void {
    if (this._status() !== 'running') {
      return;
    }
    const index = this.steps.findIndex((step) => step.id === id);
    if (index >= 0) {
      this.moveTo(index);
    }
  }

  /** Ends the whole tour with the terminal `skipped` status. */
  skip(): void {
    this.end('skipped');
  }

  /** Ends the tour as dismissed (Escape, programmatic teardown). */
  abort(): void {
    this.end('aborted');
  }

  /** Ends the tour as successfully finished. */
  complete(): void {
    this.end('completed');
  }

  /** @internal Started by the service once the UI is mounted. */
  _start(): void {
    if (this._status() !== 'idle') {
      return;
    }
    this._status.set('running');
    this.emitStepChange();
  }

  /** @internal The service reacts to step changes to re-anchor the card and spotlight. */
  _onStepChange(listener: (change: PixelTourStepChange<T>) => void): void {
    this.stepChangeListeners.add(listener);
  }

  /** @internal The service reacts to the end to tear the UI down. */
  _onEnd(listener: (reason: PixelTourEndReason) => void): void {
    this.endListeners.add(listener);
  }

  private moveTo(index: number): void {
    this._stepIndex.set(index);
    this.emitStepChange();
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

  private end(reason: PixelTourEndReason): void {
    const status = this._status();
    if (status === 'completed' || status === 'skipped' || status === 'aborted') {
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
}
