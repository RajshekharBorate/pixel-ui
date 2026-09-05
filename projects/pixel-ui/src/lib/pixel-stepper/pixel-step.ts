import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { merge } from 'rxjs';
import PixelStepIconDirective from './pixel-step-icon';
import type { PixelStepGuard, PixelStepState } from './pixel-stepper.types';
import { PIXEL_AUTHORIZATION_EVALUATOR } from '../shared/authorization-evaluator';

let nextStepUid = 0;

/**
 * A single step projected into `pixel-stepper`. Its body is captured as a template and rendered by
 * the parent in the active panel, so only the current step's content is in the live panel at a time.
 *
 * @example
 * ```html
 * <pixel-step label="Account" icon="person" [stepControl]="form.controls.account">
 *   <pixel-step-content>…</pixel-step-content>
 *   <pixel-step-actions>
 *     <pixel-button appearance="solid" (click)="stepper.next()">Next</pixel-button>
 *   </pixel-step-actions>
 * </pixel-step>
 * ```
 */
@Component({
  selector: 'pixel-step',
  template: `<ng-template><ng-content /></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelStepComponent {
  private readonly auth = inject(PIXEL_AUTHORIZATION_EVALUATOR, { optional: true });

  /**
   * @component Header label for the step.
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component Secondary line rendered beneath the label.
   * @type {string}
   * @default ''
   */
  readonly description = input('');

  /**
   * @component Material Symbols glyph shown inside the indicator instead of the step number.
   * @type {string}
   * @default ''
   */
  readonly icon = input('');

  /**
   * @component Optional badge value (e.g. a count) rendered beside the label.
   * @type {string | number}
   * @default ''
   */
  readonly badge = input<string | number>('');

  /**
   * @component Stable identifier used for tracking, analytics, and URL / state restoration.
   * @type {string}
   * @default '' (an internal uid is used when omitted)
   */
  readonly stepId = input('');

  /**
   * @component Marks the step as skippable; the stepper surfaces an "Optional" hint and allows skip.
   * @type {boolean}
   * @default false
   */
  readonly optional = input(false, { transform: booleanAttribute });

  /**
   * @component Allows returning to and re-editing this step after it has been completed.
   * @type {boolean}
   * @default false
   */
  readonly editable = input(true, { transform: booleanAttribute });

  /**
   * @component Disables selection of the step.
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component Optional permission key. When denied, the step is treated as disabled.
   * Prefer `@if (auth.can()())` to omit the step entirely.
   * @type {string}
   * @default ''
   */
  readonly access = input('');

  /** Effective disabled — includes {@link access} denial when authorization is configured. */
  readonly interactionDisabled = computed(() => {
    if (this.disabled()) {
      return true;
    }
    const key = this.access()?.trim();
    if (!key) {
      return false;
    }
    if (!this.auth) {
      return true;
    }
    this.auth.snapshotVersion();
    if (this.auth.shouldShowWhilePending()) {
      return false;
    }
    return (
      this.auth.evaluate({
        permission: key,
        resource: { type: 'step', id: this.stepId() || undefined },
      }).status !== 'allow'
    );
  });

  /**
   * @component Marks the step as completed. Two-way bindable; when a `stepControl` is supplied and
   * `completed` is not explicitly set, completion follows the control's validity.
   * @type {boolean}
   */
  readonly completed = model<boolean | undefined>(undefined);

  /**
   * @component Forces a visual state, overriding the derived `pending`/`current`/`completed` value.
   * Use for `error`, `warning`, `loading`, or `locked` indicators.
   * @type {PixelStepState | undefined}
   */
  readonly state = input<PixelStepState | undefined>(undefined);

  /**
   * @component Reactive Forms control gating linear navigation. The step counts as complete when the
   * control is valid (or has been visited and is not invalid).
   * @type {AbstractControl | undefined}
   */
  readonly stepControl = input<AbstractControl | undefined>(undefined);

  /**
   * @component Async (or sync) guard run before leaving this step via Next / Finish. Resolving to
   * `false` cancels navigation — ideal for server-side validation.
   * @type {PixelStepGuard | undefined}
   */
  readonly validator = input<PixelStepGuard | undefined>(undefined);

  /**
   * @component Defers rendering of the step body until it is first activated.
   * @type {boolean}
   * @default false
   */
  readonly lazy = input(false, { transform: booleanAttribute });

  /** Captured body template, rendered by the parent stepper in the active panel. */
  readonly content = viewChild.required(TemplateRef);

  /**
   * Optional custom indicator content projected via `<ng-template pixelStepIcon>` — an avatar,
   * image, SVG, or component shown in place of the number / glyph. Status glyphs still win.
   */
  readonly iconTemplate = contentChild(PixelStepIconDirective);

  /** Internal unique id; also the fallback when no `stepId` is provided. */
  readonly uid = `pixel-step-${nextStepUid++}`;

  /** Whether the user has interacted with / visited this step (drives `stepControl` completion). */
  readonly interacted = signal(false);

  /** Tracks the bound `stepControl` validity so linear gating reacts to Reactive Forms edits. */
  readonly controlValid = signal(true);

  /** Tracks whether the bound control (or any of its children) has been touched. */
  readonly controlTouched = signal(false);

  /** Resolved stable id (explicit `stepId` or the internal uid). */
  readonly resolvedId = computed(() => this.stepId() || this.uid);

  /** Whether a non-empty badge value was supplied. */
  readonly hasBadge = computed(() => {
    const badge = this.badge();
    return badge !== '' && badge !== null && badge !== undefined;
  });

  /** Whether the bound `stepControl` currently fails validation. */
  readonly hasControlError = computed(() => {
    const control = this.stepControl();
    return !!control && !this.controlValid();
  });

  /** Whether linear navigation may advance from this step right now. */
  readonly canProceed = computed(() => {
    const control = this.stepControl();
    if (control) {
      return this.controlValid();
    }
    const explicit = this.completed();
    return explicit !== false;
  });

  /** Whether the step counts as completed for navigation/progress purposes. */
  readonly isComplete = computed(() => {
    const explicit = this.completed();
    if (explicit !== undefined) {
      return explicit;
    }
    const control = this.stepControl();
    if (control) {
      return this.controlValid() && this.interacted();
    }
    return false;
  });

  constructor() {
    effect((onCleanup) => {
      const control = this.stepControl();
      if (!control) {
        this.controlValid.set(true);
        return;
      }
      const sync = (): void => {
        this.controlValid.set(control.valid);
        this.controlTouched.set(control.touched);
      };
      sync();
      const sub = merge(control.statusChanges, control.valueChanges).subscribe(sync);
      onCleanup(() => sub.unsubscribe());
    });
  }

  /** Marks the step visited; called by the parent stepper when the step is left. */
  markInteracted(): void {
    this.interacted.set(true);
  }

  /** Marks the bound control touched so field + header error affordances can appear. */
  markControlTouched(): void {
    const control = this.stepControl();
    if (control) {
      control.markAllAsTouched({ emitEvent: true });
      this.controlTouched.set(control.touched);
    }
    this.markInteracted();
  }

  /** Whether the step header should render the error indicator for its `stepControl`. */
  showsControlError(validationSubmitted: boolean): boolean {
    return (
      this.hasControlError() &&
      (this.interacted() || this.controlTouched() || validationSubmitted)
    );
  }

  /** Resets interaction + auto-completion (used by the stepper's `reset()`). */
  reset(): void {
    this.interacted.set(false);
    this.controlTouched.set(false);
    if (this.completed() !== undefined) {
      this.completed.set(false);
    }
  }
}
