import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  output,
  untracked,
} from '@angular/core';
import {
  clampProgressValue,
  progressStatusColor,
  resolveThresholdStatus,
  toProgressPercent,
  type PixelProgressChangeEvent,
  type PixelProgressCompleteEvent,
  type PixelProgressMilestone,
  type PixelProgressMilestoneEvent,
  type PixelProgressMilestoneView,
  type PixelProgressMode,
  type PixelProgressSegment,
  type PixelProgressSegmentView,
  type PixelProgressSize,
  type PixelProgressStatus,
  type PixelProgressThreshold,
  type PixelProgressVariant,
} from './pixel-progress.types';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

/**
 * Enterprise-grade, accessible, animated linear progress bar.
 *
 * Covers the full Angular-Material-style mode matrix (determinate, indeterminate, buffer,
 * query) plus multi-segment/stacked fills, threshold-driven status colors, milestone markers,
 * striped/pulse variants. State is derived entirely from signals; the public API uses
 * `input()` / `output()` only — no two-way binding, no `ngOnChanges`.
 *
 * @example
 * ```html
 * <!-- Determinate with label + percentage -->
 * <pixel-progress-bar [value]="75" showLabel showPercentage label="Uploading" />
 *
 * <!-- Buffered streaming progress -->
 * <pixel-progress-bar mode="buffer" [value]="40" [buffer]="65" />
 *
 * <!-- Threshold colors: 0–60 success, 61–80 warning, 81–100 error -->
 * <pixel-progress-bar
 *   [value]="storageUsed()"
 *   [thresholds]="[
 *     { from: 0, status: 'success' },
 *     { from: 61, status: 'warning' },
 *     { from: 81, status: 'error' }
 *   ]"
 *   showPercentage
 * />
 *
 * <!-- Multi-segment storage breakdown -->
 * <pixel-progress-bar
 *   [max]="100"
 *   [segments]="[
 *     { label: 'Docs', value: 30, status: 'info' },
 *     { label: 'Media', value: 25, status: 'warning' },
 *     { label: 'Other', value: 15 }
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'pixel-progress-bar',
  standalone: true,
  imports: [PixelTooltipDirective, PixelSkeletonComponent],
  templateUrl: './pixel-progress-bar.html',
  styleUrl: './pixel-progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-progress',
    '[class.pixel-progress--indeterminate]': 'isIndeterminate()',
    '[class.pixel-progress--animated]': 'animated()',
    '[class.pixel-progress--multi]': 'isMultiSegment()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-mode]': 'mode()',
    '[attr.data-status]': 'resolvedStatus()',
  },
})
export default class PixelProgressBarComponent {
  private readonly destroyRef = inject(DestroyRef);

  /**
   * @component Current progress value, interpreted within `[min, max]`. Ignored in
   * `indeterminate` / `query` modes.
   * @type {number}
   * @default 0
   */
  readonly value = input(0, { transform: numberAttribute });

  /**
   * @component Lower bound of the value range.
   * @type {number}
   * @default 0
   */
  readonly min = input(0, { transform: numberAttribute });

  /**
   * @component Upper bound of the value range.
   * @type {number}
   * @default 100
   */
  readonly max = input(100, { transform: numberAttribute });

  /**
   * @component Secondary "buffer" value (used in `buffer` mode for streaming / preload).
   * @type {number}
   * @default 0
   */
  readonly buffer = input(0, { transform: numberAttribute });

  /**
   * @component Determinacy mode: `determinate` | `indeterminate` | `buffer` | `query`.
   * @type {PixelProgressMode}
   * @default 'determinate'
   */
  readonly mode = input<PixelProgressMode>('determinate');

  /**
   * @component Density size scale (`xs` | `sm` | `md` | `lg` | `xl`).
   * @type {PixelProgressSize}
   * @default 'md'
   */
  readonly size = input<PixelProgressSize>('md');

  /**
   * @component Visual treatment of the fill (`solid` | `striped` | `pulse`).
   * @type {PixelProgressVariant}
   * @default 'solid'
   */
  readonly variant = input<PixelProgressVariant>('solid');

  /**
   * @component Explicit semantic status. Overridden by `thresholds` when those match, and by
   * the automatic `completed` state at 100%.
   * @type {PixelProgressStatus}
   * @default 'default'
   */
  readonly status = input<PixelProgressStatus>('default');

  /**
   * @component Enables fill / stripe / shimmer motion (respects `prefers-reduced-motion`).
   * @type {boolean}
   * @default true
   */
  readonly animated = input(true, { transform: booleanAttribute });

  /**
   * @component Renders a diagonal striped fill. Implied by `variant="striped"`.
   * @type {boolean}
   * @default false
   */
  readonly striped = input(false, { transform: booleanAttribute });

  /**
   * @component Enables the luminous shimmer pulse. Alias for `variant="pulse"`.
   * @type {boolean}
   * @default false
   */
  readonly pulse = input(false, { transform: booleanAttribute });

  /**
   * @component Shows the textual label row above the track.
   * @type {boolean}
   * @default false
   */
  readonly showLabel = input(false, { transform: booleanAttribute });

  /**
   * @component Shows the percentage value (e.g. `75%`).
   * @type {boolean}
   * @default false
   */
  readonly showPercentage = input(false, { transform: booleanAttribute });

  /**
   * @component Shows the raw `value / max` fraction (e.g. `75 / 100`).
   * @type {boolean}
   * @default false
   */
  readonly showValue = input(false, { transform: booleanAttribute });

  /**
   * @component Shows a status pill / icon (e.g. ✔ Completed).
   * @type {boolean}
   * @default false
   */
  readonly showStatus = input(false, { transform: booleanAttribute });

  /**
   * @component Renders milestone markers supplied via `milestones`.
   * @type {boolean}
   * @default false
   */
  readonly showMilestones = input(false, { transform: booleanAttribute });

  /**
   * @component Free-text label shown in the label row.
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component Segments for `multi-segment` / `stacked` bars. Each value is sized
   * proportionally to `max`.
   * @type {PixelProgressSegment[]}
   * @default []
   */
  readonly segments = input<readonly PixelProgressSegment[]>([]);

  /**
   * @component Threshold bands mapping percentage ranges to status colors.
   * @type {PixelProgressThreshold[]}
   * @default []
   */
  readonly thresholds = input<readonly PixelProgressThreshold[]>([]);

  /**
   * @component Milestone markers rendered along the track.
   * @type {PixelProgressMilestone[]}
   * @default []
   */
  readonly milestones = input<readonly PixelProgressMilestone[]>([]);

  /**
   * @component Whether the bar is in indeterminate mode (alias for `mode="indeterminate"`).
   * @type {boolean}
   * @default false
   */
  readonly indeterminate = input(false, { transform: booleanAttribute });

  /**
   * @component Marks the bar as loading (forces the `loading` status + pulse).
   * @type {boolean}
   * @default false
   */
  /** When true, replaces the bar with a skeleton placeholder. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @component Custom fill color (any CSS color). Overrides status/threshold colors.
   * @type {string}
   * @default ''
   */
  readonly color = input('');

  /**
   * @component Extra static classes appended to the host's wrapper.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /**
   * @component Accessible label override. Defaults to the `label` or `"Progress"`.
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /** Emitted once when progress first reaches 100%. */
  readonly completed = output<PixelProgressCompleteEvent>();
  /** Emitted on every value change. */
  readonly valueChange = output<PixelProgressChangeEvent>();
  /** Emitted the first time each milestone is reached. */
  readonly milestoneReached = output<PixelProgressMilestoneEvent>();
  /** Emitted when the resolved status changes. */
  readonly statusChange = output<PixelProgressStatus>();

  /** Internal mutable mirror of `value` for programmatic updates via the public API. */
  private readonly valueModel = linkedSignal<number>(() => this.value());

  readonly clampedValue = computed(() =>
    clampProgressValue(this.valueModel(), this.min(), this.max()),
  );

  /** Current fill percentage (0–100), rounded to two decimals for clean rendering. */
  readonly percentage = computed(() => {
    const pct = toProgressPercent(this.valueModel(), this.min(), this.max());
    return Math.round(pct * 100) / 100;
  });

  readonly bufferPercent = computed(() =>
    toProgressPercent(this.buffer(), this.min(), this.max()),
  );

  readonly isIndeterminate = computed(
    () => this.indeterminate() || this.mode() === 'indeterminate' || this.mode() === 'query',
  );

  protected readonly isBuffer = computed(() => this.mode() === 'buffer');

  protected readonly isMultiSegment = computed(() => this.normalizedSegments().length > 0);

  /** Active threshold band for the current percentage, if any. */
  private readonly activeThreshold = computed<PixelProgressThreshold | null>(() =>
    resolveThresholdStatus(this.percentage(), this.thresholds()),
  );

  /** Final status after folding in loading, completion and threshold rules. */
  readonly resolvedStatus = computed<PixelProgressStatus>(() => {
    if (this.loading()) {
      return 'loading';
    }
    if (!this.isIndeterminate() && this.percentage() >= 100 && this.status() === 'default') {
      return 'completed';
    }
    const band = this.activeThreshold();
    if (band && this.status() === 'default') {
      return band.status;
    }
    return this.status();
  });

  /** Resolved fill color: explicit `color` → threshold color → status color. */
  protected readonly fillColor = computed<string | null>(() => {
    const explicit = this.color().trim();
    if (explicit) {
      return explicit;
    }
    const band = this.activeThreshold();
    if (band?.color) {
      return band.color;
    }
    return null;
  });

  /** Normalized, render-ready segments with cumulative offsets + resolved colors. */
  private readonly normalizedSegments = computed<readonly PixelProgressSegmentView[]>(() => {
    const segments = this.segments();
    if (segments.length === 0) {
      return [];
    }
    const span = this.max() - this.min();
    if (span <= 0) {
      return [];
    }
    const views: PixelProgressSegmentView[] = [];
    let offset = 0;
    for (const segment of segments) {
      const percent = Math.max(0, (segment.value / span) * 100);
      views.push({
        ...segment,
        percent,
        offset,
        resolvedColor: segment.color ?? progressStatusColor(segment.status ?? 'default'),
      });
      offset += percent;
    }
    return views;
  });

  readonly segmentViews = computed(() => this.normalizedSegments());

  readonly milestoneViews = computed<readonly PixelProgressMilestoneView[]>(() => {
    const pct = this.percentage();
    return this.milestones().map((milestone) => ({
      ...milestone,
      reached: pct >= milestone.at,
    }));
  });

  /** Human-readable status label for the status pill. */
  protected readonly statusLabel = computed(() => {
    switch (this.resolvedStatus()) {
      case 'completed':
        return 'Completed';
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'info':
        return 'Info';
      case 'loading':
        return 'Processing…';
      case 'paused':
        return 'Paused';
      case 'cancelled':
        return 'Cancelled';
      default:
        return '';
    }
  });

  /** Material Symbols glyph for the status pill. */
  protected readonly statusIcon = computed(() => {
    switch (this.resolvedStatus()) {
      case 'completed':
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'loading':
        return 'autorenew';
      case 'paused':
        return 'pause_circle';
      case 'cancelled':
        return 'cancel';
      default:
        return '';
    }
  });

  /** Display string for the percentage readout. */
  protected readonly percentageLabel = computed(() => `${Math.round(this.percentage())}%`);

  /** Display string for the `value / max` fraction. */
  protected readonly valueLabel = computed(
    () => `${Math.round(this.clampedValue())} / ${this.max()}`,
  );

  protected readonly hasLabelRow = computed(
    () =>
      (this.showLabel() && this.label().trim() !== '') ||
      this.showPercentage() ||
      this.showValue() ||
      (this.showStatus() && this.statusLabel() !== ''),
  );

  /** Whether stripes should render (explicit `striped` or `variant="striped"`). */
  protected readonly isStriped = computed(
    () => this.striped() || this.variant() === 'striped',
  );

  protected readonly isPulsing = computed(
    () => this.pulse() || this.variant() === 'pulse' || this.loading(),
  );

  /** `aria-valuetext` describing the current state for screen readers. */
  protected readonly ariaValueText = computed(() => {
    if (this.isIndeterminate()) {
      return this.loading() ? 'Loading' : 'In progress';
    }
    const status = this.statusLabel();
    const pct = `${Math.round(this.percentage())} percent`;
    return status ? `${pct}, ${status}` : pct;
  });

  protected readonly ariaLabelText = computed(
    () => this.ariaLabel().trim() || this.label().trim() || 'Progress',
  );

  /** Class list for the wrapper element. */
  protected readonly skeletonBarHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '0.25rem';
      case 'sm': return '0.375rem';
      case 'lg': return '0.75rem';
      case 'xl': return '1rem';
      default:   return '0.5rem';
    }
  });

  protected readonly wrapperClass = computed(() => {
    const classes = ['pixel-progress__wrapper'];
    const custom = this.className().trim();
    if (custom) {
      classes.push(custom);
    }
    return classes.join(' ');
  });

  constructor() {
    // Emit valueChange / completed / statusChange as derived state settles.
    let lastEmitted = Number.NaN;
    let completedEmitted = false;
    effect(() => {
      const value = this.clampedValue();
      const pct = this.percentage();
      const status = this.resolvedStatus();
      untracked(() => {
        if (value !== lastEmitted) {
          lastEmitted = value;
          this.valueChange.emit({ value, percentage: pct, status });
        }
        if (pct >= 100 && !completedEmitted && !this.isIndeterminate()) {
          completedEmitted = true;
          this.completed.emit({ value, percentage: 100 });
        } else if (pct < 100) {
          completedEmitted = false;
        }
      });
    });

    // Announce status transitions.
    let lastStatus: PixelProgressStatus | null = null;
    effect(() => {
      const status = this.resolvedStatus();
      untracked(() => {
        if (lastStatus !== null && status !== lastStatus) {
          this.statusChange.emit(status);
        }
        lastStatus = status;
      });
    });

    // Fire milestoneReached the first time each marker is crossed.
    const announced = new Set<number>();
    effect(() => {
      const reached = this.milestoneViews().filter((m) => m.reached);
      untracked(() => {
        for (const milestone of reached) {
          if (!announced.has(milestone.at)) {
            announced.add(milestone.at);
            this.milestoneReached.emit({ at: milestone.at, label: milestone.label });
          }
        }
      });
    });

    this.destroyRef.onDestroy(() => announced.clear());
  }

  /** Programmatically set the current value (clamped) and notify listeners. */
  setValue(next: number): void {
    this.valueModel.set(clampProgressValue(next, this.min(), this.max()));
  }

  /** Increment the value by `step` (default 1), clamped to `max`. */
  increment(step = 1): void {
    this.setValue(this.clampedValue() + step);
  }

  /** Decrement the value by `step` (default 1), clamped to `min`. */
  decrement(step = 1): void {
    this.setValue(this.clampedValue() - step);
  }

  /** Reset the value back to the bound `value` input. */
  reset(): void {
    this.valueModel.set(this.value());
  }

  /** Jump straight to 100%. */
  complete(): void {
    this.setValue(this.max());
  }
}
