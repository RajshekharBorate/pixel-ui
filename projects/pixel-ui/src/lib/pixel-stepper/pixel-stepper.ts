import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom, isObservable } from 'rxjs';
import PixelButtonComponent from '../pixel-button/pixel-button';
import { PIXEL_BREAKPOINT_PX } from '../shared/breakpoints';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';
import PixelStepComponent from './pixel-step';
import PixelStepHeaderComponent from './pixel-step-header';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import type {
  PixelStepChangeEvent,
  PixelStepGuard,
  PixelStepGuardContext,
  PixelStepperCollapseLabels,
  PixelStepperDirection,
  PixelStepperLabelPosition,
  PixelStepperNavigationMode,
  PixelStepperOrientation,
  PixelStepperSize,
  PixelStepperType,
  PixelStepState,
} from './pixel-stepper.types';

/** Presets that collapse labels on narrow viewports (indicator-only + tooltip). */
const LABEL_COLLAPSE_TYPES: ReadonlySet<PixelStepperType> = new Set([
  'horizontal',
  'wizard',
  'compact',
  'navigation',
]);

/** Extra pixels the rail must grow before releasing a content-overflow collapse. */
const OVERFLOW_HYSTERESIS_PX = 48;

let nextStepperUid = 0;

/** Internal per-step view model handed to the template. */
interface PixelStepperView {
  readonly step: PixelStepComponent;
  readonly index: number;
  readonly number: number;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly badge: string | number;
  readonly optional: boolean;
  readonly state: PixelStepState;
  readonly selected: boolean;
  readonly navigable: boolean;
  readonly first: boolean;
  readonly last: boolean;
  readonly headerId: string;
  readonly panelId: string;
  readonly clickable: boolean;
  readonly content: TemplateRef<unknown>;
  readonly iconTemplate: TemplateRef<unknown> | undefined;
}

/** Snapshot emitted on `draftSaved`, suitable for persistence / resume. */
export interface PixelStepperDraft {
  readonly selectedIndex: number;
  readonly completedStepIds: readonly string[];
}

/**
 * Enterprise stepper / wizard. Project `pixel-step` children; the stepper renders the header rail
 * (numbered, state-aware indicators with connectors), the active step's content, and — for
 * wizard / mobile presets — a Back / Next / Finish footer. Eight visual presets, four sizes, three
 * navigation modes, sync + async per-step validation, and full keyboard + ARIA support. Signal /
 * `input()` / `output()` driven; no two-way binding beyond `selectedIndex`.
 *
 * @example
 * ```html
 * <pixel-stepper type="wizard" navigationMode="linear" [(selectedIndex)]="active">
 *   <pixel-step label="Account" [stepControl]="form.controls.account">…</pixel-step>
 *   <pixel-step label="Review">…</pixel-step>
 * </pixel-stepper>
 * ```
 */
@Component({
  selector: 'pixel-stepper',
  imports: [NgTemplateOutlet, PixelStepHeaderComponent, PixelButtonComponent, PixelSkeletonComponent],
  templateUrl: './pixel-stepper.html',
  styleUrl: './pixel-stepper.scss',
  host: {
    class: 'pixel-stepper',
    '[attr.data-type]': 'type()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-size]': 'size()',
    '[attr.data-label-position]': 'labelPosition()',
    '[class.pixel-stepper--busy]': 'busy()',
    '[class.pixel-stepper--no-animation]': '!animated()',
    '[class.pixel-stepper--labels-collapsed]': 'labelsCollapsed()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelStepperComponent {
  protected readonly uid = `pixel-stepper-${nextStepperUid++}`;

  /** Projected step children, in document order. */
  protected readonly steps = contentChildren(PixelStepComponent);

  /** Header rail (`role="tablist"`) — used for content-aware label collapse. */
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('stepList');
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });

  // ─── Inputs ──────────────────────────────────────────────────────────────────────

  /** When true, replaces the stepper with skeleton step placeholders. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /** Number of skeleton steps. Defaults to the projected step count, otherwise 4. */
  readonly skeletonSteps = input(0, { transform: numberAttribute });

  /**
   * @component Visual preset (also sets the default orientation, connectors, and chrome).
   * @type {PixelStepperType}
   * @default 'horizontal'
   */
  readonly type = input<PixelStepperType>('horizontal');

  /**
   * @component Layout axis override. Defaults to vertical for `vertical` / `timeline`, else horizontal.
   * @type {PixelStepperOrientation}
   */
  readonly orientationInput = input<PixelStepperOrientation | undefined>(undefined, {
    alias: 'orientation',
  });

  /**
   * @component Density tier applied to indicators, labels, and spacing.
   * @type {PixelStepperSize}
   * @default 'md'
   */
  readonly size = input<PixelStepperSize>('md');

  /**
   * @component Where each step's label / description sit relative to its indicator (horizontal
   * layouts only): `end` beside it (default), or `bottom` stacked and centered beneath it.
   * @type {PixelStepperLabelPosition}
   * @default 'end'
   */
  readonly labelPosition = input<PixelStepperLabelPosition>('end');

  /**
   * @component How freely a user may move through the flow.
   * @type {PixelStepperNavigationMode}
   * @default 'linear'
   */
  readonly navigationMode = input<PixelStepperNavigationMode>('linear');

  /**
   * @component Two-way bindable index of the active step.
   * @type {number}
   * @default 0
   */
  readonly selectedIndex = model(0);

  /**
   * @component Whether step headers can be clicked to navigate (subject to `navigationMode`).
   * @type {boolean}
   * @default true
   */
  readonly clickableHeaders = input(true, { transform: booleanAttribute });

  /**
   * @component Force-show / hide the Back / Next / Finish footer. Defaults on for `wizard` / `mobile`.
   * @type {boolean | undefined}
   */
  readonly showNavigation = input<boolean | undefined>(undefined);

  /**
   * @component Force-show / hide the progress bar. Defaults on for the `progress` preset.
   * @type {boolean | undefined}
   */
  readonly showProgress = input<boolean | undefined>(undefined);

  /**
   * @component Force-show / hide the `Step N of M` counter. Defaults on for `progress` / `wizard` / `mobile`.
   * @type {boolean | undefined}
   */
  readonly showStepCounter = input<boolean | undefined>(undefined);

  /**
   * @component Enables content + indicator transitions (auto-disabled under reduced-motion).
   * @type {boolean}
   * @default true
   */
  readonly animated = input(true, { transform: booleanAttribute });

  /**
   * @component Duration (ms) of the panel / progress transitions.
   * @type {number}
   * @default 250
   */
  readonly animationDuration = input(250, { transform: numberAttribute });

  /**
   * @component Accessible label for the stepper navigation landmark / tablist.
   * @type {string}
   * @default 'Progress'
   */
  readonly ariaLabel = input('Progress');

  /**
   * Stable analytics id for this stepper (e.g. `onboarding`).
   *
   * @type {string}
   * @default ''
   * @description When `PIXEL_UI_ANALYTICS` is provided, step moves emit `ui.stepper.next` /
   * `ui.stepper.back` / `ui.stepper.goto` with from/to indexes (never step labels).
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Readonly<Record<string, unknown>> | undefined}
   * @default undefined
   */
  readonly analyticsProperties = input<Readonly<Record<string, unknown>> | undefined>(undefined);

  /**
   * @component Whether horizontal step labels collapse to indicator-only (with tooltip +
   * `aria-label`). `auto` collapses below `md` for inline labels (`end`) or `sm` for labels
   * below the indicator, and when the header rail’s preferred width exceeds its container.
   * `true` / `false` force on or off. Vertical / timeline / progress / mobile never collapse.
   * @type {PixelStepperCollapseLabels}
   * @default 'auto'
   */
  readonly collapseLabels = input<PixelStepperCollapseLabels>('auto');

  /**
   * @component Label for the Back button.
   * @type {string}
   * @default 'Back'
   */
  readonly previousLabel = input('Back');

  /**
   * @component Label for the Next button.
   * @type {string}
   * @default 'Next'
   */
  readonly nextLabel = input('Next');

  /**
   * @component Label for the Finish button shown on the last step.
   * @type {string}
   * @default 'Finish'
   */
  readonly finishLabel = input('Finish');

  /**
   * @component Label for the Skip button shown on optional steps.
   * @type {string}
   * @default 'Skip'
   */
  readonly skipLabel = input('Skip');

  /**
   * @component Guard run before advancing via Next. Resolve `false` (sync / Promise / Observable) to cancel.
   * @type {PixelStepGuard | undefined}
   */
  readonly beforeNext = input<PixelStepGuard | undefined>(undefined);

  /**
   * @component Guard run before moving back via Back.
   * @type {PixelStepGuard | undefined}
   */
  readonly beforePrevious = input<PixelStepGuard | undefined>(undefined);

  /**
   * @component Guard run before finishing on the last step.
   * @type {PixelStepGuard | undefined}
   */
  readonly beforeFinish = input<PixelStepGuard | undefined>(undefined);

  /**
   * @component Guard deciding whether a target step may be entered.
   * @type {PixelStepGuard | undefined}
   */
  readonly canActivateStep = input<PixelStepGuard | undefined>(undefined);

  /**
   * @component Guard deciding whether the current step may be left.
   * @type {PixelStepGuard | undefined}
   */
  readonly canLeaveStep = input<PixelStepGuard | undefined>(undefined);

  // ─── Outputs ─────────────────────────────────────────────────────────────────────

  /** Emitted whenever the selected step changes (with direction + ids). */
  readonly selectionChange = output<PixelStepChangeEvent>();
  /** Emitted when the flow is finished from the last step. */
  readonly finished = output<void>();
  /** Emitted when the flow is cancelled. */
  readonly cancelled = output<void>();
  /** Emitted with a serialisable snapshot when `saveDraft()` is called. */
  readonly draftSaved = output<PixelStepperDraft>();
  /** Emitted when an optional step is skipped. */
  readonly stepSkipped = output<number>();
  /** Emitted when navigation is blocked by a failing guard / validator. */
  readonly navigationBlocked = output<PixelStepGuardContext>();

  // ─── State ───────────────────────────────────────────────────────────────────────

  /** Index whose async guard / validator is currently running (`null` when idle). */
  protected readonly validating = signal<number | null>(null);

  /** Index that currently owns roving keyboard focus. */
  protected readonly focusedIndex = signal<number | null>(null);

  /** Set when a finish attempt is blocked so every invalid `stepControl` can surface errors. */
  protected readonly validationSubmitted = signal(false);

  /** Whether the viewport is below the collapse breakpoint for the current label position. */
  private readonly narrowViewport = signal(false);

  /**
   * Whether the header rail’s preferred (untruncated) width exceeds its container.
   * Released with hysteresis so collapse ↔ expand does not thrash.
   */
  private readonly contentOverflow = signal(false);

  /** `clientWidth` when content-overflow collapse last engaged. */
  private overflowAnchorWidth = 0;

  // ─── Derived state ────────────────────────────────────────────────────────────────

  protected readonly skeletonStepArray = computed(() => {
    const explicit = this.skeletonSteps();
    return Array.from({ length: explicit > 0 ? explicit : (this.steps().length || 4) });
  });

  /** Resolved layout axis. */
  readonly orientation = computed<PixelStepperOrientation>(() => {
    const override = this.orientationInput();
    if (override) {
      return override;
    }
    const type = this.type();
    return type === 'vertical' || type === 'timeline' ? 'vertical' : 'horizontal';
  });

  /** Whether this preset/orientation is eligible for label collapse. */
  private readonly supportsLabelCollapse = computed(
    () => LABEL_COLLAPSE_TYPES.has(this.type()) && this.orientation() === 'horizontal',
  );

  /**
   * Whether headers hide visible labels (indicator-only + tooltip). Driven by `collapseLabels`,
   * viewport breakpoint, content overflow, preset type, and orientation.
   */
  protected readonly labelsCollapsed = computed(() => {
    const mode = this.collapseLabels();
    if (mode === false || !this.supportsLabelCollapse()) {
      return false;
    }
    return mode === true || this.narrowViewport() || this.contentOverflow();
  });

  /**
   * Breakpoint used for `collapseLabels: 'auto'`: `md` for inline labels, `sm` when labels sit
   * below the indicator (they pack more tightly).
   */
  private readonly collapseBreakpointPx = computed(() =>
    this.labelPosition() === 'bottom' ? PIXEL_BREAKPOINT_PX.sm : PIXEL_BREAKPOINT_PX.md,
  );

  /** Total number of projected steps. */
  readonly totalSteps = computed(() => this.steps().length);

  /** Currently selected step component, if any. */
  readonly selectedStep = computed(() => this.steps()[this.selectedIndex()]);

  /** Number of completed steps. */
  readonly completedCount = computed(
    () => this.steps().filter((step) => step.isComplete()).length,
  );

  /** Whether an async guard / validator is in flight. */
  readonly busy = computed(() => this.validating() !== null);

  /** Whether the selected step is the last in the flow. */
  readonly isLast = computed(() => this.selectedIndex() >= this.totalSteps() - 1);

  /** Whether the selected step is the first in the flow. */
  readonly isFirst = computed(() => this.selectedIndex() <= 0);

  /** Completion percentage (0–100), rounded. */
  readonly percentComplete = computed(() => {
    const total = this.totalSteps();
    return total === 0 ? 0 : Math.round((this.completedCount() / total) * 100);
  });

  /** Linear progress position (0–100) based on the selected index. */
  readonly progressValue = computed(() => {
    const total = this.totalSteps();
    if (total <= 1) {
      return this.isLast() ? 100 : 0;
    }
    return Math.round((this.selectedIndex() / (total - 1)) * 100);
  });

  /** `Step N of M` counter string. */
  readonly counterLabel = computed(
    () => `Step ${Math.min(this.selectedIndex() + 1, this.totalSteps())} of ${this.totalSteps()}`,
  );

  /** Whether the footer navigation should render. */
  readonly footerVisible = computed(() => {
    const override = this.showNavigation();
    if (override !== undefined) {
      return override;
    }
    return this.type() === 'wizard' || this.type() === 'mobile';
  });

  /** Whether the progress bar should render. */
  readonly progressVisible = computed(() => {
    const override = this.showProgress();
    if (override !== undefined) {
      return override;
    }
    return this.type() === 'progress';
  });

  /** Whether the `Step N of M` counter should render. */
  readonly counterVisible = computed(() => {
    const override = this.showStepCounter();
    if (override !== undefined) {
      return override;
    }
    const type = this.type();
    return type === 'progress' || type === 'wizard' || type === 'mobile';
  });

  /** Whether the Next button should be enabled (linear mode gates on completion). */
  readonly canAdvance = computed(() => {
    if (this.busy()) {
      return false;
    }
    if (this.navigationMode() !== 'linear') {
      return true;
    }
    const step = this.selectedStep();
    if (!step) {
      return false;
    }
    if (step.optional()) {
      return true;
    }
    if (step.stepControl()) {
      return step.canProceed();
    }
    return step.completed() !== false;
  });

  /** Whether every bound `stepControl` is valid — gates Finish when forms are in use. */
  readonly canFinish = computed(() => {
    if (this.busy()) {
      return false;
    }
    return this.steps().every((step) => !step.stepControl() || step.controlValid());
  });

  /** Per-step view models for the template. */
  readonly stepViews = computed<readonly PixelStepperView[]>(() => {
    const steps = this.steps();
    const selected = this.selectedIndex();
    const validating = this.validating();
    const validationSubmitted = this.validationSubmitted();
    const total = steps.length;
    const isTimeline = this.type() === 'timeline';
    // Timeline "in progress" is the first incomplete, interactive step — independent of selection
    // so revisiting a completed event does not steal the current-step highlight.
    const timelineCurrentIndex = isTimeline
      ? steps.findIndex(
          (step) => !step.isComplete() && !step.disabled() && step.state() !== 'locked',
        )
      : -1;

    return steps.map((step, index) => {
      let state: PixelStepState;
      const forced = step.state();
      if (forced) {
        state = forced;
      } else if (validating === index) {
        state = 'loading';
      } else if (step.showsControlError(validationSubmitted)) {
        state = 'error';
      } else if (isTimeline) {
        if (step.isComplete()) {
          state = 'completed';
        } else if (index === timelineCurrentIndex) {
          state = 'current';
        } else if (step.disabled()) {
          state = 'disabled';
        } else {
          state = 'pending';
        }
      } else if (index === selected) {
        state = 'current';
      } else if (step.isComplete()) {
        state = 'completed';
      } else if (step.disabled()) {
        state = 'disabled';
      } else {
        state = 'pending';
      }
      return {
        step,
        index,
        number: index + 1,
        label: step.label(),
        description: step.description(),
        icon: step.icon(),
        badge: step.badge(),
        optional: step.optional(),
        state,
        selected: index === selected,
        navigable: this.clickableHeaders() && this.canEnter(index),
        clickable: this.clickableHeaders() && state !== 'disabled' && state !== 'locked',
        first: index === 0,
        last: index === total - 1,
        headerId: `${this.uid}-header-${index}`,
        panelId: `${this.uid}-panel-${index}`,
        content: step.content(),
        iconTemplate: step.iconTemplate()?.templateRef,
      };
    });
  });

  /** View model for the active step (drives the single-panel layouts). */
  readonly selectedView = computed(() => this.stepViews()[this.selectedIndex()]);

  /** Whether the current step can be skipped (optional and not the last step). */
  readonly canSkip = computed(() => {
    const step = this.selectedStep();
    return !!step && step.optional() && !this.isLast();
  });

  /** CSS custom property for animation duration. */
  protected readonly durationCss = computed(() => `${this.animated() ? this.animationDuration() : 0}ms`);

  constructor() {
    // Keep the selected index within bounds as steps are added / removed dynamically.
    effect(() => {
      const total = this.totalSteps();
      if (total === 0) {
        return;
      }
      const clamped = Math.max(0, Math.min(this.selectedIndex(), total - 1));
      if (clamped !== this.selectedIndex()) {
        this.selectedIndex.set(clamped);
      }
    });

    // Phase A — viewport breakpoint (md for inline labels, sm for labelPosition="bottom").
    effect((onCleanup) => {
      if (this.collapseLabels() !== 'auto' || !this.supportsLabelCollapse()) {
        this.narrowViewport.set(false);
        return;
      }
      if (typeof matchMedia !== 'function') {
        this.narrowViewport.set(false);
        return;
      }
      const bp = this.collapseBreakpointPx();
      const mql = matchMedia(`(max-width: ${bp - 1}px)`);
      const update = (): void => this.narrowViewport.set(mql.matches);
      update();
      mql.addEventListener('change', update);
      onCleanup(() => mql.removeEventListener('change', update));
    });

    // Phase C — content-aware collapse when preferred header width exceeds the rail.
    effect((onCleanup) => {
      const list = this.listRef()?.nativeElement;
      // Re-run when layout-affecting inputs change.
      this.collapseLabels();
      this.supportsLabelCollapse();
      this.totalSteps();
      this.labelPosition();
      this.size();
      this.labelsCollapsed();

      if (!list || this.collapseLabels() !== 'auto' || !this.supportsLabelCollapse()) {
        this.contentOverflow.set(false);
        return;
      }
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const measure = (): void => this.updateContentOverflow(list);
      measure();
      const frame = requestAnimationFrame(measure);
      const ro = new ResizeObserver(measure);
      ro.observe(list);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        ro.disconnect();
      });
    });
  }

  /**
   * Compare the sum of each header button’s preferred width (`scrollWidth`) to the rail’s
   * `clientWidth`. Uses hysteresis when releasing so collapse does not oscillate.
   */
  private updateContentOverflow(list: HTMLElement): void {
    if (this.collapseLabels() !== 'auto' || !this.supportsLabelCollapse()) {
      this.contentOverflow.set(false);
      return;
    }

    const available = list.clientWidth;
    if (available <= 0) {
      return;
    }

    if (!this.labelsCollapsed()) {
      let preferred = 0;
      list.querySelectorAll<HTMLElement>('.pixel-step-header__button').forEach((btn) => {
        preferred += btn.scrollWidth;
      });
      if (preferred > available + 1) {
        this.overflowAnchorWidth = available;
        this.contentOverflow.set(true);
      } else {
        this.contentOverflow.set(false);
      }
      return;
    }

    if (
      this.contentOverflow() &&
      available > this.overflowAnchorWidth + OVERFLOW_HYSTERESIS_PX
    ) {
      this.contentOverflow.set(false);
    }
  }

  // ─── Navigation guards ─────────────────────────────────────────────────────────────

  /**
   * Whether the step at `index` may be entered, given navigation mode, completion, and disabled /
   * locked state. Backwards moves to editable steps are always allowed.
   */
  canEnter(index: number): boolean {
    const steps = this.steps();
    const step = steps[index];
    if (!step || index < 0 || index >= steps.length) {
      return false;
    }
    if (step.disabled() || step.state() === 'disabled' || step.state() === 'locked') {
      return false;
    }
    const current = this.selectedIndex();
    if (index === current) {
      return true;
    }
    if (index < current) {
      // Going back: allowed unless the target step opted out of editing.
      return step.editable();
    }
    const mode = this.navigationMode();
    if (mode === 'free') {
      return true;
    }
    // linear + non-linear forward: every preceding step must be complete or optional.
    return this.allPriorComplete(index);
  }

  private allPriorComplete(index: number): boolean {
    const steps = this.steps();
    for (let j = 0; j < index; j++) {
      const step = steps[j];
      if (!step.isComplete() && !step.optional()) {
        return false;
      }
    }
    return true;
  }

  // ─── Public navigation API ──────────────────────────────────────────────────────────

  /** Advance to the next step (or finish on the last). Returns whether navigation occurred. */
  async next(): Promise<boolean> {
    if (this.isLast()) {
      return this.finish();
    }
    // In linear mode, advancing requires the current step to be complete (or optional).
    if (this.navigationMode() === 'linear' && !this.canAdvance()) {
      const step = this.selectedStep();
      this.navigationBlocked.emit({
        fromIndex: this.selectedIndex(),
        toIndex: this.selectedIndex() + 1,
        fromStepId: step?.resolvedId(),
      });
      return false;
    }
    return this.attemptMove(this.selectedIndex(), this.selectedIndex() + 1, 'next');
  }

  /** Move back to the previous step. */
  async previous(): Promise<boolean> {
    if (this.isFirst()) {
      return false;
    }
    return this.attemptMove(this.selectedIndex(), this.selectedIndex() - 1, 'previous');
  }

  /** Jump directly to `index` if navigation rules allow it. */
  async jumpTo(index: number): Promise<boolean> {
    if (index === this.selectedIndex() || !this.canEnter(index)) {
      return false;
    }
    return this.attemptMove(this.selectedIndex(), index, 'jump');
  }

  /** Skip the current step (only valid when it is optional). */
  async skip(): Promise<boolean> {
    const step = this.selectedStep();
    if (!step?.optional() || this.isLast()) {
      return false;
    }
    const from = this.selectedIndex();
    step.markInteracted();
    const moved = this.commitSelection(from + 1, 'next');
    if (moved) {
      this.stepSkipped.emit(from);
    }
    return moved;
  }

  /** Finish the flow from the last step, running `beforeFinish` + the step validator. */
  async finish(): Promise<boolean> {
    const from = this.selectedIndex();
    const step = this.selectedStep();
    const ctx: PixelStepGuardContext = {
      fromIndex: from,
      toIndex: -1,
      fromStepId: step?.resolvedId(),
    };

    if (!this.canFinish()) {
      this.validationSubmitted.set(true);
      for (const s of this.steps()) {
        s.markControlTouched();
      }
      this.navigationBlocked.emit(ctx);
      return false;
    }

    this.validating.set(from);
    try {
      if (!(await this.runGuard(this.beforeFinish(), ctx))) {
        this.navigationBlocked.emit(ctx);
        return false;
      }
      if (!(await this.runGuard(step?.validator(), ctx))) {
        this.navigationBlocked.emit(ctx);
        return false;
      }
    } finally {
      this.validating.set(null);
    }
    step?.markInteracted();
    if (step && step.completed() === undefined && !step.stepControl()) {
      step.completed.set(true);
    }
    this.finished.emit();
    return true;
  }

  /** Cancel the flow. */
  cancel(): void {
    this.cancelled.emit();
  }

  /** Reset to the first step and clear completion / interaction state. */
  reset(): void {
    const previous = this.selectedIndex();
    this.validationSubmitted.set(false);
    for (const step of this.steps()) {
      step.reset();
    }
    this.selectedIndex.set(0);
    this.focusedIndex.set(null);
    this.selectionChange.emit({
      previouslySelectedIndex: previous,
      selectedIndex: 0,
      direction: 'reset',
      stepId: this.steps()[0]?.resolvedId(),
    });
  }

  /** Emit a serialisable snapshot for persistence / later resume. */
  saveDraft(): PixelStepperDraft {
    const draft: PixelStepperDraft = {
      selectedIndex: this.selectedIndex(),
      completedStepIds: this.steps()
        .filter((step) => step.isComplete())
        .map((step) => step.resolvedId()),
    };
    this.draftSaved.emit(draft);
    return draft;
  }

  /** Restore selection + completion from a previously saved draft. */
  restoreDraft(draft: PixelStepperDraft): void {
    const completed = new Set(draft.completedStepIds);
    for (const step of this.steps()) {
      if (completed.has(step.resolvedId())) {
        step.markInteracted();
        if (step.completed() === undefined && !step.stepControl()) {
          step.completed.set(true);
        }
      }
    }
    const total = this.totalSteps();
    if (total > 0) {
      this.selectedIndex.set(Math.max(0, Math.min(draft.selectedIndex, total - 1)));
    }
  }

  // ─── Internal move pipeline ─────────────────────────────────────────────────────────

  private async attemptMove(
    from: number,
    to: number,
    direction: PixelStepperDirection,
  ): Promise<boolean> {
    const fromStep = this.steps()[from];
    const ctx: PixelStepGuardContext = {
      fromIndex: from,
      toIndex: to,
      fromStepId: fromStep?.resolvedId(),
    };
    const forward = to > from;

    this.validating.set(from);
    try {
      if (forward) {
        if (!(await this.runGuard(this.beforeNext(), ctx))) {
          this.navigationBlocked.emit(ctx);
          return false;
        }
        if (!(await this.runGuard(fromStep?.validator(), ctx))) {
          this.navigationBlocked.emit(ctx);
          return false;
        }
      } else if (!(await this.runGuard(this.beforePrevious(), ctx))) {
        this.navigationBlocked.emit(ctx);
        return false;
      }
      if (!(await this.runGuard(this.canLeaveStep(), ctx))) {
        this.navigationBlocked.emit(ctx);
        return false;
      }
      if (!(await this.runGuard(this.canActivateStep(), ctx))) {
        this.navigationBlocked.emit(ctx);
        return false;
      }
    } finally {
      this.validating.set(null);
    }

    if (forward) {
      if (fromStep && fromStep.completed() === undefined && !fromStep.stepControl()) {
        fromStep.completed.set(true);
      }
    }
    fromStep?.markInteracted();
    return this.commitSelection(to, direction);
  }

  private commitSelection(to: number, direction: PixelStepperDirection): boolean {
    const total = this.totalSteps();
    if (to < 0 || to >= total) {
      return false;
    }
    const previous = this.selectedIndex();
    this.selectedIndex.set(to);
    this.focusedIndex.set(to);
    this.selectionChange.emit({
      previouslySelectedIndex: previous,
      selectedIndex: to,
      direction,
      stepId: this.steps()[to]?.resolvedId(),
    });
    const name =
      direction === 'next'
        ? 'ui.stepper.next'
        : direction === 'previous'
          ? 'ui.stepper.back'
          : 'ui.stepper.goto';
    const stepperId = this.analyticsId().trim();
    const stepId = this.steps()[to]?.resolvedId()?.trim();
    emitPixelUiAnalytics(this.analytics, {
      name,
      component: 'pixel-stepper',
      extras: this.analyticsProperties(),
      reserved: {
        ...(stepperId ? { stepperId } : {}),
        from: previous,
        to,
        ...(stepId ? { stepId } : {}),
        type: this.type(),
      },
    });
    return true;
  }

  private async runGuard(
    guard: PixelStepGuard | undefined,
    context: PixelStepGuardContext,
  ): Promise<boolean> {
    if (!guard) {
      return true;
    }
    const result = guard(context);
    if (typeof result === 'boolean') {
      return result;
    }
    if (isObservable(result)) {
      return firstValueFrom(result);
    }
    return result;
  }

  // ─── Template handlers ──────────────────────────────────────────────────────────────

  protected onHeaderSelect(index: number): void {
    void this.jumpTo(index);
  }

  protected headerTabIndex(index: number): number {
    const roving = this.focusedIndex() ?? this.selectedIndex();
    return index === roving ? 0 : -1;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const total = this.totalSteps();
    if (total === 0) {
      return;
    }
    const horizontal = this.orientation() === 'horizontal';
    const current = this.focusedIndex() ?? this.selectedIndex();
    let next = current;
    switch (event.key) {
      case 'ArrowRight':
        if (!horizontal) return;
        next = this.nextFocusable(current, 1);
        break;
      case 'ArrowLeft':
        if (!horizontal) return;
        next = this.nextFocusable(current, -1);
        break;
      case 'ArrowDown':
        if (horizontal) return;
        next = this.nextFocusable(current, 1);
        break;
      case 'ArrowUp':
        if (horizontal) return;
        next = this.nextFocusable(current, -1);
        break;
      case 'Home':
        next = this.nextFocusable(-1, 1);
        break;
      case 'End':
        next = this.nextFocusable(total, -1);
        break;
      default:
        return;
    }
    event.preventDefault();
    this.focusedIndex.set(next);
    this.focusHeader(next);
  }

  private nextFocusable(from: number, step: number): number {
    const steps = this.steps();
    const count = steps.length;
    let index = from;
    for (let i = 0; i < count; i++) {
      index = (index + step + count) % count;
      const candidate = steps[index];
      if (!candidate.disabled() && candidate.state() !== 'disabled') {
        return index;
      }
    }
    return Math.max(0, Math.min(from, count - 1));
  }

  private focusHeader(index: number): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.getElementById(`${this.uid}-header-${index}`)?.focus();
  }
}
