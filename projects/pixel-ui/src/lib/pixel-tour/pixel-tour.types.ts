import { InjectionToken, type Signal, type TemplateRef, type Type } from '@angular/core';
import type { PixelTourRef } from './pixel-tour-ref';

/**
 * Injects the active step's `data` payload into component step content:
 *
 * ```ts
 * export class MyStepComponent {
 *   readonly data = inject(PIXEL_TOUR_STEP_DATA) as MyPayload;
 *   readonly tour = inject(PixelTourRef);
 * }
 * ```
 */
export const PIXEL_TOUR_STEP_DATA = new InjectionToken<unknown>('PIXEL_TOUR_STEP_DATA');

export type PixelTourStatus =
  | 'idle'
  | 'running'
  | 'waiting'
  | 'paused'
  | 'completed'
  | 'skipped'
  | 'aborted';

export type PixelTourPlacement = 'auto' | 'below' | 'above';
export type PixelTourAlign = 'start' | 'center' | 'end';
export type PixelTourButton = 'back' | 'next' | 'skip-step' | 'skip-tour' | 'done';
export type PixelTourSpotlightShape = 'rounded' | 'circle';
export type PixelTourProgressStyle = 'count' | 'dots' | 'bar' | 'none';
export type PixelTourUi = 'default' | 'custom' | 'headless';
export type PixelTourCardContent = TemplateRef<PixelTourCardContext> | Type<unknown>;

/** Template / component context when replacing the default card (`ui: 'custom'`). */
export interface PixelTourCardContext<T = any> {
  readonly $implicit: PixelTourRef<T>;
  readonly ref: PixelTourRef<T>;
  readonly step: Signal<PixelTourStep<T>>;
  readonly labels: PixelTourLabels;
  readonly view: PixelTourViewConfig;
  readonly waiting: Signal<boolean>;
  readonly minimized: Signal<boolean>;
}

/** Template context for `TemplateRef` step content. */
export interface PixelTourStepContext {
  readonly $implicit: PixelTourRef;
}

export interface PixelTourSpotlightOptions {
  /** Gap in px between the target's box and the cutout edge. @default 8 */
  readonly padding?: number;
  /** Cutout corner radius in px (`rounded` shape). @default 8 */
  readonly radius?: number;
  /** Cutout shape. @default 'rounded' */
  readonly shape?: PixelTourSpotlightShape;
  /**
   * Lets pointer events through the cutout so the highlighted element stays clickable
   * ("try it" steps). A pulsing ring marks the interactive area. @default false
   */
  readonly interactive?: boolean;
}

export type PixelTourTargetRef = string | Element | (() => Element | null);

export interface PixelTourAutoplayOptions {
  /** Default per-step dwell time in ms (per-step `autoAdvanceMs` overrides). */
  readonly stepMs: number;
  /** Pause the countdown while the pointer is over the card. @default true */
  readonly pauseOnHover?: boolean;
  /** Pause the countdown while focus is inside the card. @default true */
  readonly pauseOnFocus?: boolean;
  /** Show the remaining-time bar at the top of the card. @default true */
  readonly showCountdown?: boolean;
}

export interface PixelTourStep<T = any> {
  /** Stable unique id — used by `goTo`, persistence, and analytics. */
  readonly id: string;
  /**
   * The highlighted element: a `[pixelTourAnchor]` id or CSS selector, the element itself,
   * or a resolver function. Omit for a centered card (welcome / finale steps).
   */
  readonly target?: PixelTourTargetRef;
  /**
   * Additional highlighted elements — each gets its own spotlight cutout. The card anchors
   * to `target`; unresolvable extras are silently omitted.
   */
  readonly targets?: readonly PixelTourTargetRef[];
  /** Card heading. */
  readonly title?: string;
  /** Card body: plain text, a template (context = the tour ref), or a component. */
  readonly content: string | TemplateRef<PixelTourStepContext> | Type<unknown>;
  /**
   * Optional per-step card shell override (`TemplateRef` or component). Falls back to
   * `config.card`, then the built-in default card. Requires `config.ui: 'custom'`.
   */
  readonly card?: PixelTourCardContent;
  /** Optional illustration rendered above the title. */
  readonly media?: { readonly src: string; readonly alt: string };
  /** Preferred vertical side of the target. @default 'auto' (best fit, flips) */
  readonly placement?: PixelTourPlacement;
  /** Horizontal alignment against the target. @default 'start' */
  readonly align?: PixelTourAlign;
  /** Spotlight cutout options for this step. */
  readonly spotlight?: PixelTourSpotlightOptions;
  /** Buttons rendered for this step (order preserved). Defaults to config-derived set. */
  readonly buttons?: readonly PixelTourButton[];
  /**
   * How the step advances. `'target-click'` requires an interactive spotlight: clicking the
   * highlighted element advances the tour ("try it" steps). @default 'button'
   */
  readonly advanceOn?: 'button' | 'target-click';
  /** Per-step autoplay dwell override (ms). Requires `config.autoplay`. */
  readonly autoAdvanceMs?: number;
  /** Conditional step: evaluated on entry, skipped (in travel direction) when false. */
  readonly when?: () => boolean;
  /** Runs before the step shows (open menus, expand panels…). `waiting` status while pending. */
  readonly beforeEnter?: (ref: PixelTourRef) => void | Promise<void>;
  /** Runs after leaving the step (undo whatever `beforeEnter` staged). */
  readonly afterLeave?: (ref: PixelTourRef) => void | Promise<void>;
  /**
   * Waits for the target to appear (lazy content, post-navigation render). Polls and
   * observes DOM mutations until `timeoutMs` (default 5000). On timeout: `optional` steps
   * are skipped in the travel direction; required steps abort the tour.
   */
  readonly waitForTarget?: { readonly timeoutMs?: number; readonly pollMs?: number };
  /** Navigates here (Angular Router) before resolving the target — multi-page tours. */
  readonly route?: string;
  /** Skipped (not aborted) when its target cannot be resolved. */
  readonly optional?: boolean;
  /** Consumer payload carried through events. */
  readonly data?: T;
}

/** Pluggable persistence backend. Defaults to `localStorage` (guarded). */
export interface PixelTourStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export type PixelTourEventType =
  | 'start'
  | 'step'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'skip'
  | 'abort';

/** Analytics callback payload — one event per lifecycle moment. */
export interface PixelTourEvent {
  readonly type: PixelTourEventType;
  readonly stepId: string | null;
  readonly stepIndex: number;
  readonly total: number;
  readonly persistKey?: string;
}

/** All user-facing copy — overridable for i18n. */
export interface PixelTourLabels {
  readonly next: string;
  readonly back: string;
  readonly skipStep: string;
  readonly skipTour: string;
  readonly done: string;
  /** `{index}` / `{total}` placeholders. Used for the visible count and SR announcements. */
  readonly progress: string;
  /** Accessible name for the tour dialog when a step has no title. */
  readonly stepAriaLabel: string;
  /** Accessible label of the pause control (autoplay / pausable tours). */
  readonly pause: string;
  /** Label of the resume control and the minimized floating chip. */
  readonly resume: string;
  /** Accessible label of the card drag handle. */
  readonly dragHandle: string;
}

/** @internal Resolved view options handed from the service to the tour panel. */
export interface PixelTourViewConfig {
  readonly labels: PixelTourLabels;
  readonly progress: PixelTourProgressStyle;
  readonly keyboard: boolean;
  readonly autoplay: PixelTourAutoplayOptions | null;
  readonly pauseUi: 'none' | 'button' | 'minimize';
  readonly draggable: boolean;
  readonly gestures: boolean;
}

/** @internal */
export const PIXEL_TOUR_VIEW_CONFIG = new InjectionToken<PixelTourViewConfig>(
  'PIXEL_TOUR_VIEW_CONFIG',
);

/** @internal Resolves the active card shell for `ui: 'custom'`. */
export interface PixelTourCardSource {
  resolveCard(step: PixelTourStep): PixelTourCardContent | null;
}

/** @internal */
export const PIXEL_TOUR_CARD_SOURCE = new InjectionToken<PixelTourCardSource>(
  'PIXEL_TOUR_CARD_SOURCE',
);

export interface PixelTourConfig {
  /**
   * Tour panel chrome. `'default'` — built-in card; `'custom'` — `config.card` template or
   * component; `'headless'` — spotlight only (mount `pixel-tour-panel` or your own UI).
   * @default 'default'
   */
  readonly ui?: PixelTourUi;
  /**
   * Replaces the entire step card when `ui: 'custom'`. Per-step `step.card` overrides this
   * for individual steps.
   */
  readonly card?: PixelTourCardContent;
  /** Merged over the built-in English labels. */
  readonly labels?: Partial<PixelTourLabels>;
  /** Progress indicator style. @default 'count' */
  readonly progress?: PixelTourProgressStyle;
  /** ArrowRight/ArrowLeft step navigation and Escape-to-abort. @default true */
  readonly keyboard?: boolean;
  /** What clicking the scrim does. @default 'none' */
  readonly backdropClick?: 'none' | 'skip-tour';
  /** Default spotlight options; per-step `spotlight` overrides field-by-field. */
  readonly spotlight?: PixelTourSpotlightOptions;
  /**
   * Persistence key. When set: a tour already ended (`completed`/`skipped`) never re-shows
   * (`start()` returns an inert completed ref), an aborted tour resumes from its saved
   * step, and progress is written on every step.
   */
  readonly persistKey?: string;
  /** Persistence backend. @default guarded `localStorage` */
  readonly storage?: PixelTourStorage;
  /** Scrolls each target into view before anchoring. `false` disables. @default `{ block: 'center' }` */
  readonly scroll?: ScrollIntoViewOptions | false;
  /**
   * Veto hook for dismissals (Escape/`abort()` and `skip()`/scrim-skip). Return or resolve
   * `false` to keep the tour running — e.g. after a "leave the tour?" confirm dialog.
   */
  readonly beforeAbort?: (ref: PixelTourRef) => boolean | Promise<boolean>;
  /** Analytics sink — receives one event per tour lifecycle moment. */
  readonly onEvent?: (event: PixelTourEvent) => void;
  /**
   * Timer-based auto-advance. Always ships with a pause/play control plus hover and focus
   * pausing (WCAG 2.2.1 Timing Adjustable) — those cannot be disabled together with
   * autoplay, only individually.
   */
  readonly autoplay?: PixelTourAutoplayOptions;
  /** Renders a pause/play control even without autoplay. @default false */
  readonly pausable?: boolean;
  /**
   * What pausing looks like: `'button'` freezes in place; `'minimize'` collapses the card
   * and scrim into a floating "resume" chip so the page is usable mid-tour. @default 'button'
   */
  readonly pauseUi?: 'button' | 'minimize';
  /** Adds a drag handle so users can reposition the card (per step, viewport-clamped). @default false */
  readonly draggable?: boolean;
  /** Horizontal swipe on the card navigates next/back on touch devices. @default true */
  readonly gestures?: boolean;
}

export type PixelTourEndReason = 'completed' | 'skipped' | 'aborted';

export interface PixelTourStepChange<T = any> {
  readonly step: PixelTourStep<T>;
  readonly index: number;
  readonly total: number;
}
