/**
 * Shared types, models and pure helpers for the `pixel-progress` component family.
 *
 * All progress components (`bar`, `circle`, `container`) consume these definitions so the
 * public contract stays consistent.
 */

/** High-level rendering taxonomy for a progress indicator. */
export type PixelProgressType =
  | 'linear'
  | 'circular'
  | 'step'
  | 'buffer'
  | 'query'
  | 'indeterminate'
  | 'multi-segment'
  | 'stacked'
  | 'dashboard'
  | 'radial';

/**
 * Determinacy mode for linear/circular bars. Mirrors Angular Material's progress modes:
 * - `determinate` — fill reflects `value`.
 * - `indeterminate` — animated sweep, value unknown.
 * - `buffer` — primary fill plus a secondary `buffer` track (e.g. streaming/preload).
 * - `query` — reverse indeterminate sweep used while "querying" before real progress.
 */
export type PixelProgressMode = 'determinate' | 'indeterminate' | 'buffer' | 'query';

/** Semantic / lifecycle state. Drives color and `aria-valuetext` wording. */
export type PixelProgressStatus =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'paused'
  | 'loading'
  | 'completed'
  | 'cancelled';

/** Density scale shared across the family. */
export type PixelProgressSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Visual treatment of the fill surface. */
export type PixelProgressVariant = 'solid' | 'striped' | 'pulse';

/** Orientation for stacked progress layouts. */
export type PixelProgressOrientation = 'horizontal' | 'vertical';

/**
 * One slice of a multi-segment (stacked) progress bar. Segment values are summed and each
 * slice is sized proportionally to the bar's `max`.
 */
export interface PixelProgressSegment {
  /** Human-readable category name (used for tooltip + screen reader text). */
  readonly label: string;
  /** Raw contribution of this segment, in the same unit as the bar's `value`. */
  readonly value: number;
  /** Optional explicit CSS color; falls back to a status/auto color when omitted. */
  readonly color?: string;
  /** Optional semantic status used to derive a themed color when `color` is absent. */
  readonly status?: PixelProgressStatus;
  /** Optional tooltip text shown on hover / focus. */
  readonly tooltip?: string;
}

/** A precomputed, render-ready segment (internal view-model). */
export interface PixelProgressSegmentView extends PixelProgressSegment {
  /** Percentage width this segment occupies of the whole track (0–100). */
  readonly percent: number;
  /** Cumulative percentage offset from the start of the track (0–100). */
  readonly offset: number;
  /** Resolved CSS color (explicit color, status color, or palette fallback). */
  readonly resolvedColor: string;
}

/**
 * Threshold band mapping a value range to a status color. When `thresholds` are supplied the
 * bar's active color is derived from the band the current value falls into, e.g.
 * `[{ from: 0, status: 'success' }, { from: 61, status: 'warning' }, { from: 81, status: 'error' }]`.
 */
export interface PixelProgressThreshold {
  /** Inclusive lower bound (percentage, 0–100) at which this band becomes active. */
  readonly from: number;
  /** Status applied while the value is within this band. */
  readonly status: PixelProgressStatus;
  /** Optional explicit color overriding the status palette. */
  readonly color?: string;
  /** Optional label surfaced via tooltip / aria when this band is active. */
  readonly label?: string;
}

/** A marker rendered along the track at a fixed percentage (e.g. `|25%|50%|75%|`). */
export interface PixelProgressMilestone {
  /** Position along the track as a percentage (0–100). */
  readonly at: number;
  /** Optional short label rendered beneath the marker. */
  readonly label?: string;
  /** Optional tooltip text. */
  readonly tooltip?: string;
}

/** A milestone augmented with its reached/unreached state (internal view-model). */
export interface PixelProgressMilestoneView extends PixelProgressMilestone {
  /** Whether the current percentage has met or passed this milestone. */
  readonly reached: boolean;
}

/** Payload emitted when progress reaches 100% (`completed` output). */
export interface PixelProgressCompleteEvent {
  /** Final raw value. */
  readonly value: number;
  /** Final percentage (always 100). */
  readonly percentage: number;
}

/** Payload emitted on every value change (`valueChange` output). */
export interface PixelProgressChangeEvent {
  /** Current raw value. */
  readonly value: number;
  /** Current percentage (0–100). */
  readonly percentage: number;
  /** Active semantic status. */
  readonly status: PixelProgressStatus;
}

/** Payload emitted the first time a milestone is reached (`milestoneReached` output). */
export interface PixelProgressMilestoneEvent {
  /** Position of the reached milestone (percentage). */
  readonly at: number;
  /** Optional milestone label. */
  readonly label?: string;
}

/* -------------------------------------------------------------------------- */
/*  Pure helpers — shared by components, the service and the spec.            */
/* -------------------------------------------------------------------------- */

/** Clamp `value` to the inclusive `[min, max]` range, guarding against NaN/inverted bounds. */
export function clampProgressValue(value: number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (!Number.isFinite(value)) {
    return lo;
  }
  return Math.min(hi, Math.max(lo, value));
}

/** Convert a raw value within `[min, max]` to a 0–100 percentage. */
export function toProgressPercent(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) {
    return 0;
  }
  const clamped = clampProgressValue(value, min, max);
  return ((clamped - min) / span) * 100;
}

/**
 * Resolve the active threshold band for a percentage. Returns the band with the highest
 * `from` that the percentage has met, or `null` when none match / none are supplied.
 */
export function resolveThresholdStatus(
  percentage: number,
  thresholds: readonly PixelProgressThreshold[],
): PixelProgressThreshold | null {
  let active: PixelProgressThreshold | null = null;
  for (const band of thresholds) {
    if (percentage >= band.from && (active === null || band.from >= active.from)) {
      active = band;
    }
  }
  return active;
}

/** Map a semantic status to its themed CSS custom property reference. */
export function progressStatusColor(status: PixelProgressStatus): string {
  switch (status) {
    case 'success':
    case 'completed':
      return 'var(--pixel-progress-success)';
    case 'warning':
    case 'paused':
      return 'var(--pixel-progress-warning)';
    case 'error':
    case 'cancelled':
      return 'var(--pixel-progress-error)';
    case 'info':
      return 'var(--pixel-progress-info)';
    case 'loading':
    default:
      return 'var(--pixel-progress-fill)';
  }
}

/** Format a byte count as a human-readable string (e.g. `2.5 MB`). */
export function formatProgressBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const scaled = bytes / Math.pow(1024, exponent);
  return `${scaled.toFixed(exponent === 0 ? 0 : fractionDigits)} ${units[exponent]}`;
}

/** Format a duration in seconds as a compact `Hh Mm Ss` / `M:SS` string. */
export function formatProgressDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '—';
  }
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
