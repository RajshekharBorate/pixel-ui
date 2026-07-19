import type { Observable } from 'rxjs';

/**
 * Visual flavour of the stepper. Each preset tunes layout, connectors, and header chrome:
 * - `horizontal` — numbered indicators in a row, connected by lines.
 * - `vertical` — indicators stacked with content nested under the active step.
 * - `wizard` — horizontal header plus a prominent footer with Back / Next / Finish.
 * - `progress` — a slim progress bar with a `Step N of M` / percentage readout.
 * - `navigation` — pill-style, free-navigation header (think settings sub-nav).
 * - `timeline` — vertical dots-and-line activity feed.
 * - `compact` — condensed horizontal header for dense layouts / tablets.
 * - `mobile` — single-step view with a dot rail and Back / Next controls.
 */
export type PixelStepperType =
  | 'horizontal'
  | 'vertical'
  | 'wizard'
  | 'progress'
  | 'navigation'
  | 'timeline'
  | 'compact'
  | 'mobile';

/** Resolved layout axis. Derived from {@link PixelStepperType} unless overridden. */
export type PixelStepperOrientation = 'horizontal' | 'vertical';

/**
 * Where a step's label / description sit relative to its indicator (horizontal steppers only):
 * - `end` — beside the indicator (default).
 * - `bottom` — stacked, centered beneath the indicator.
 */
export type PixelStepperLabelPosition = 'end' | 'bottom';

/** Density / sizing scale shared with the rest of the library. */
export type PixelStepperSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Whether horizontal step labels collapse on narrow / overflowing layouts:
 * - `auto` — collapse below `md` (900px) for inline labels (`labelPosition="end"`), below `sm`
 *   (600px) for labels below the indicator, and whenever the header rail’s preferred width
 *   exceeds its container (content-aware).
 * - `true` / `false` — force collapse on or off.
 */
export type PixelStepperCollapseLabels = 'auto' | boolean;

/**
 * How far a user may move through the flow:
 * - `linear` — may only advance once the current (and all prior) steps are complete.
 * - `non-linear` — may jump to any already-visited or completed step.
 * - `free` — may jump to any enabled step at will.
 */
export type PixelStepperNavigationMode = 'linear' | 'non-linear' | 'free';

/**
 * Lifecycle / validation state of a single step. `current`, `completed`, and `pending` are derived
 * by the stepper; the rest may be forced via a step's `state` input.
 */
export type PixelStepState =
  | 'pending'
  | 'current'
  | 'completed'
  | 'error'
  | 'warning'
  | 'disabled'
  | 'locked'
  | 'optional'
  | 'loading';

/** Direction a selection change moved through the flow. */
export type PixelStepperDirection = 'next' | 'previous' | 'jump' | 'reset';

/** Payload emitted whenever the selected step changes. */
export interface PixelStepChangeEvent {
  /** Index the stepper moved away from. */
  readonly previouslySelectedIndex: number;
  /** Index the stepper moved to. */
  readonly selectedIndex: number;
  /** How the change was initiated. */
  readonly direction: PixelStepperDirection;
  /** Stable id of the newly selected step, when one was assigned. */
  readonly stepId?: string;
}

/** Context handed to navigation guards / hooks. */
export interface PixelStepGuardContext {
  /** Index the stepper is leaving. */
  readonly fromIndex: number;
  /** Index the stepper wants to move to (`-1` when finishing). */
  readonly toIndex: number;
  /** Stable id of the step being left, when assigned. */
  readonly fromStepId?: string;
}

/**
 * A navigation guard / hook. May return synchronously or asynchronously; resolving to `false`
 * (or throwing / erroring) cancels the navigation. Used for `beforeNext`, `beforePrevious`,
 * `beforeFinish`, `canActivateStep`, and `canLeaveStep`.
 */
export type PixelStepGuard = (
  context: PixelStepGuardContext,
) => boolean | Promise<boolean> | Observable<boolean>;

/**
 * Strongly typed descriptor for data-driven steppers (`navigation`, `progress`, `timeline`) where
 * headers are generated from data rather than projected `pixel-step` children.
 */
export interface PixelStepData {
  /** Stable identifier — used for tracking, analytics, and URL/state restoration. */
  readonly id?: string;
  /** Primary header label. */
  readonly label: string;
  /** Secondary descriptive line under the label. */
  readonly description?: string;
  /** Material Symbols glyph shown inside the indicator (overrides the number). */
  readonly icon?: string;
  /** Forced visual state; otherwise derived from selection / completion. */
  readonly state?: PixelStepState;
  /** Marks the step as skippable. */
  readonly optional?: boolean;
  /** Prevents selection. */
  readonly disabled?: boolean;
  /** Hides the step from the flow entirely (supports conditional / branching workflows). */
  readonly hidden?: boolean;
  /** Optional badge value rendered beside the label. */
  readonly badge?: string | number;
  /** Arbitrary payload for branching logic / analytics. */
  readonly data?: unknown;
}
