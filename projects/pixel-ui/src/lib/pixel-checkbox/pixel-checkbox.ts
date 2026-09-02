import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  Injector,
  numberAttribute,
  output,
  signal,
  untracked,
} from '@angular/core';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';

export type PixelCheckboxSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelCheckboxState = 'indeterminate' | 'loading';
export type PixelCheckboxResolvedState = 'unchecked' | 'checked' | PixelCheckboxState;
export type PixelCheckboxLabelPosition = 'left' | 'right';
export type PixelCheckboxClassValue =
  | string
  | string[]
  | Record<string, boolean>
  | null
  | undefined;
export type PixelCheckboxInteractionSource = 'mouse' | 'keyboard';

export interface PixelCheckboxStateChangeEvent {
  checked: boolean;
  indeterminate: boolean;
  state: PixelCheckboxResolvedState;
  source: PixelCheckboxInteractionSource;
  originalEvent: MouseEvent | KeyboardEvent;
}

let nextCheckboxId = 0;

function normalizeClassValue(classValue: PixelCheckboxClassValue): string {
  if (!classValue) {
    return '';
  }

  if (typeof classValue === 'string') {
    return classValue.trim();
  }

  if (Array.isArray(classValue)) {
    return classValue
      .flatMap((value) => normalizeClassValue(value))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return Object.entries(classValue)
    .filter(([, isEnabled]) => isEnabled)
    .map(([className]) => className)
    .join(' ')
    .trim();
}

@Component({
  selector: 'pixel-checkbox',
  imports: [PixelSkeletonComponent],
  template: `
    @if (showSkeleton()) {
      <span class="pixel-checkbox__skeleton">
        <pixel-skeleton shape="rect" width="1.25rem" height="1.25rem" borderRadius="calc(var(--pixel-checkbox-radius) * 0.55)" />
        @if (label()) {
          <pixel-skeleton width="6rem" height="0.75rem" />
        }
      </span>
    } @else {
    <label
      class="pixel-checkbox"
      [class]="customClassList()"
      [class.pixel-checkbox--xs]="size() === 'xs'"
      [class.pixel-checkbox--sm]="size() === 'sm'"
      [class.pixel-checkbox--md]="size() === 'md'"
      [class.pixel-checkbox--lg]="size() === 'lg'"
      [class.pixel-checkbox--label-left]="labelPosition() === 'left'"
      [class.pixel-checkbox--label-right]="labelPosition() === 'right'"
      [class.pixel-checkbox--checked]="effectiveChecked()"
      [class.pixel-checkbox--indeterminate]="effectiveIndeterminate()"
      [class.pixel-checkbox--disabled]="isDisabled()"
      [class.pixel-checkbox--loading]="isLoading()"
      [class.pixel-checkbox--focused]="hasFocus()"
      [class.pixel-checkbox--readonly]="readonly()"
      [class.pixel-checkbox--control-only]="!label()"
      [class.pixel-checkbox--full-width]="fullWidth()"
      [attr.data-state]="visualState()"
      [attr.data-size]="size()"
    >
      @switch (labelPosition()) {
        @case ('left') {
          @if (label()) {
            <span class="pixel-checkbox__content">
              <span class="pixel-checkbox__label">
                {{ label() }}
                @if (isRequiredField()) {
                  <span class="pixel-checkbox__required" aria-hidden="true">*</span>
                  <span class="pixel-checkbox__sr-only">required</span>
                }
              </span>
              @if (helperText()) {
                <span class="pixel-checkbox__helper" [id]="helperId">{{ helperText() }}</span>
              }
              @if (showErrorMessage()) {
                <span class="pixel-checkbox__error" [id]="errorId">
                  {{ errorMessage() }}
                </span>
              }
            </span>
          }
        }
      }

      <span class="pixel-checkbox__control">
        <input
          [id]="inputId()"
          class="pixel-checkbox__input"
          type="checkbox"
          [name]="name() || null"
          [value]="value()"
          [checked]="effectiveChecked()"
          [indeterminate]="effectiveIndeterminate()"
          [disabled]="isDisabled()"
          [required]="isRequiredField()"
          [readOnly]="readonly()"
          [tabIndex]="tabIndex()"
          [attr.autofocus]="autofocus() ? '' : null"
          [attr.aria-label]="ariaLabel() || (label() ? null : 'Checkbox')"
          [attr.aria-checked]="ariaChecked()"
          [attr.aria-disabled]="isDisabled() ? 'true' : 'false'"
          [attr.aria-required]="isRequiredField() ? 'true' : 'false'"
          [attr.aria-invalid]="isInvalid() ? 'true' : 'false'"
          [attr.aria-describedby]="describedBy() || null"
          (click)="onInputClick($event)"
          (keydown)="onInputKeyDown($event)"
          (focus)="onInputFocus()"
          (blur)="onInputBlur()"
        />

        <span class="pixel-checkbox__box" aria-hidden="true">
          @switch (visualState()) {
            @case ('loading') {
              <span class="pixel-checkbox__spinner"></span>
            }
            @default {
              <!-- Always mounted — opacity toggles checked/indeterminate. Mounting the glyph
                   only when checked shifts the box metrics and makes grid selection “slide”. -->
              <span class="pixel-checkbox__icon">
                @if (effectiveIndeterminate() || visualState() === 'indeterminate') {
                  {{ indeterminateIcon() }}
                } @else {
                  {{ checkedIcon() }}
                }
              </span>
            }
          }
        </span>
      </span>

      @if (!label() && showErrorMessage()) {
        <span class="pixel-checkbox__sr-only" [id]="errorId">{{ errorMessage() }}</span>
      }

      @switch (labelPosition()) {
        @case ('right') {
          @if (label()) {
            <span class="pixel-checkbox__content">
              <span class="pixel-checkbox__label">
                {{ label() }}
                @if (isRequiredField()) {
                  <span class="pixel-checkbox__required" aria-hidden="true">*</span>
                  <span class="pixel-checkbox__sr-only">required</span>
                }
              </span>
              @if (helperText()) {
                <span class="pixel-checkbox__helper" [id]="helperId">{{ helperText() }}</span>
              }
              @if (showErrorMessage()) {
                <span class="pixel-checkbox__error" [id]="errorId">
                  {{ errorMessage() }}
                </span>
              }
            </span>
          }
        }
      }
    </label>
    }
  `,
  styleUrl: './pixel-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-full-width]': 'fullWidth() ? "true" : "false"',
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelCheckboxComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelCheckboxComponent),
      multi: true,
    },
  ],
})
export default class PixelCheckboxComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-checkbox-${++nextCheckboxId}`;
  protected readonly helperId = `${this.fallbackId}-helper`;
  protected readonly errorId = `${this.fallbackId}-error`;
  protected readonly hasFocus = signal(false);
  private readonly injector = inject(Injector);
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });
  private readonly internalChecked = signal(false);
  private readonly internalIndeterminate = signal(false);
  private readonly formDisabled = signal(false);
  private readonly previousCheckedInput = signal(false);
  private readonly previousIndeterminateInput = signal(false);
  private readonly lastInteractionSource = signal<PixelCheckboxInteractionSource>('mouse');
  private onChange: (checked: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  private readonly syncInputState = effect(() => {
    const nextChecked = this.checked();
    const nextIndeterminate = this.indeterminate();

    if (nextChecked !== untracked(this.previousCheckedInput)) {
      this.previousCheckedInput.set(nextChecked);
      this.internalChecked.set(nextChecked);
    }

    if (nextIndeterminate !== untracked(this.previousIndeterminateInput)) {
      this.previousIndeterminateInput.set(nextIndeterminate);
      this.internalIndeterminate.set(nextIndeterminate);
    }
  });

  private readonly syncRequiredValidator = effect(() => {
    this.required();
    untracked(() => this.onValidatorChange());
  });

  /**
   * @component pixel-checkbox
   * Optional id applied to the native checkbox input.
   *
   * @type {string}
   * @default ''
   * @description Supplies a stable id for labels, helper text, and end-to-end selectors.
   */
  readonly id = input('');

  /**
   * Stable analytics id for this checkbox.
   *
   * @type {string}
   * @default ''
   * @description When `PIXEL_UI_ANALYTICS` is provided, toggles emit `ui.checkbox.toggle`.
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Record<string, unknown>}
   * @default {}
   */
  readonly analyticsProperties = input<Record<string, unknown>>({});

  /**
   * When true, suppresses `ui.checkbox.toggle` analytics events.
   *
   * @type {boolean}
   * @default false
   */
  readonly analyticsDisabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Visible checkbox label.
   *
   * @type {string}
   * @default ''
   * @description Renders screen-reader-friendly label text inside the clickable label area.
   */
  readonly label = input('');

  /**
   * @component pixel-checkbox
   * Controlled checked value.
   *
   * @type {boolean}
   * @default false
   * @description Sets the checked baseline; user interaction emits `checkedChange`.
   */
  readonly checked = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Controlled indeterminate value.
   *
   * @type {boolean}
   * @default false
   * @description Shows the mixed state until the next user toggle clears it.
   */
  readonly indeterminate = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Disables all interaction.
   *
   * @type {boolean}
   * @default false
   * @description Prevents pointer and keyboard changes and exposes unavailable ARIA state.
   */
  /**
   * @component pixel-checkbox
   * When true, replaces the checkbox with a skeleton placeholder. Bind to a loading signal or
   * a reactive form control's `pending` state: `[showSkeleton]="control.pending"`.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Marks the checkbox as required.
   *
   * @type {boolean}
   * @default false
   * @description Adds native required semantics and a visible required indicator.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Makes the checkbox read-only.
   *
   * @type {boolean}
   * @default false
   * @description Keeps focus available while preventing checked state changes.
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Visual size variant.
   *
   * @type {'xs' | 'sm' | 'md' | 'lg'}
   * @default 'md'
   * @description Adjusts box size, label type scale, and spacing.
   */
  readonly size = input<PixelCheckboxSize>('md');

  /**
   * @component pixel-checkbox
   * Semantic state variant.
   *
   * @type {'indeterminate' | 'loading' | undefined}
   * @default undefined
   * @description Applies non-value visual states. Checked and unchecked are derived from `checked`, `ngModel`, or `FormControl` values.
   */
  readonly state = input<PixelCheckboxState | undefined>(undefined);

  /**
   * @component pixel-checkbox
   * Label placement relative to the checkbox box.
   *
   * @type {'left' | 'right'}
   * @default 'right'
   * @description Supports leading or trailing labels for dense forms and tables.
   */
  readonly labelPosition = input<PixelCheckboxLabelPosition>('right');

  /**
   * @component pixel-checkbox
   * Supporting helper or description text.
   *
   * @type {string}
   * @default ''
   * @description Renders helper copy and wires it to the checkbox via `aria-describedby`.
   */
  readonly helperText = input('');

  /**
   * @component pixel-checkbox
   * Required validation message.
   *
   * @type {string}
   * @default 'This field is required.'
   * @description Rendered when Angular forms report a touched or dirty required error.
   */
  readonly requiredErrorMessage = input('This field is required.');

  /**
   * @component pixel-checkbox
   * Explicit error message that forces invalid chrome.
   *
   * @type {string}
   * @default ''
   * @description When non-empty, applies the same invalid border/ring as Angular form errors and
   *   shows this copy in the error slot (useful for parent-driven validation such as grid
   *   `column.validate`). Prefer Angular validators when the checkbox is bound to a form control.
   */
  readonly errorOverride = input('');

  /**
   * @component pixel-checkbox
   * Accessible name override.
   *
   * @type {string}
   * @default ''
   * @description Maps to `aria-label`, useful when no visible label is rendered.
   */
  readonly ariaLabel = input('');

  /**
   * @component pixel-checkbox
   * Space-separated ids for external descriptions.
   *
   * @type {string}
   * @default ''
   * @description Combines external ids with generated helper text ids.
   */
  readonly ariaDescribedBy = input('');

  /**
   * @component pixel-checkbox
   * Native form field name.
   *
   * @type {string}
   * @default ''
   * @description Passes the name through to the native checkbox for form submission.
   */
  readonly name = input('');

  /**
   * @component pixel-checkbox
   * Native form field value.
   *
   * @type {string}
   * @default 'on'
   * @description Submitted value when the checkbox is checked in a native form.
   */
  readonly value = input('on');

  /**
   * @component pixel-checkbox
   * Keyboard tab order.
   *
   * @type {number}
   * @default 0
   * @description Maps to the native checkbox `tabIndex` property.
   */
  readonly tabIndex = input(0, { transform: numberAttribute });

  /**
   * @component pixel-checkbox
   * Automatically focuses the checkbox on initial render.
   *
   * @type {boolean}
   * @default false
   * @description Applies the native `autofocus` attribute.
   */
  readonly autofocus = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Stretch to the container width on small viewports (form layouts).
   *
   * @type {boolean}
   * @default true
   * @description On `sm` and below, expands the control to full width for labeled form rows.
   * Set `false` for control-only placements (data-grid selection, compact toolbars) so the box
   * stays content-sized and parents can center it.
   */
  readonly fullWidth = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-checkbox
   * Extra CSS classes appended to the root label.
   *
   * @type {string}
   * @default ''
   * @description Supports application-specific styling hooks without `ngClass`.
   */
  readonly className = input('');

  /**
   * @component pixel-checkbox
   * Angular-style class map input for advanced styling.
   *
   * @type {string | string[] | Record<string, boolean> | null | undefined}
   * @default ''
   * @description Normalizes string, array, and object class declarations.
   */
  readonly classList = input<PixelCheckboxClassValue>('');

  /**
   * @component pixel-checkbox
   * Icon text for the checked state.
   *
   * @type {string}
   * @default '✓'
   * @description Replaces the default checkmark glyph.
   */
  readonly checkedIcon = input('✓');

  /**
   * @component pixel-checkbox
   * Icon text for the indeterminate state.
   *
   * @type {string}
   * @default '–'
   * @description Replaces the default mixed-state dash.
   */
  readonly indeterminateIcon = input('–');

  /** Emits the next checked value after user interaction. */
  readonly checkedChange = output<boolean>();

  /** Emits a rich state payload after user interaction. */
  readonly stateChange = output<PixelCheckboxStateChangeEvent>();

  /** Emits true when the native checkbox receives focus. */
  readonly focusChange = output<boolean>();

  /** Emits true when the native checkbox loses focus. */
  readonly blurChange = output<boolean>();

  /** Emits the original pointer or keyboard activation event. */
  readonly click = output<MouseEvent | KeyboardEvent>();

  protected readonly inputId = computed(() => this.id().trim() || this.fallbackId);

  protected readonly visualState = computed<PixelCheckboxResolvedState>(() => {
    if (this.isLoading()) {
      return 'loading';
    }

    if (this.effectiveIndeterminate()) {
      return 'indeterminate';
    }

    return this.effectiveChecked() ? 'checked' : 'unchecked';
  });

  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled() || this.isLoading(),
  );

  protected readonly isLoading = computed(() => this.state() === 'loading');

  protected readonly effectiveIndeterminate = computed(() => {
    return this.state() === 'indeterminate' || this.internalIndeterminate();
  });

  protected readonly effectiveChecked = computed(() => {
    if (this.state() === 'indeterminate') {
      return false;
    }

    return this.internalChecked();
  });

  protected readonly ariaChecked = computed(() => {
    if (this.effectiveIndeterminate()) {
      return 'mixed';
    }

    return this.effectiveChecked() ? 'true' : 'false';
  });

  protected describedBy(): string {
    return [
      this.ariaDescribedBy().trim(),
      this.helperText() ? this.helperId : '',
      this.showErrorMessage() ? this.errorId : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  protected readonly customClassList = computed(() => {
    return [this.className().trim(), normalizeClassValue(this.classList())]
      .filter(Boolean)
      .join(' ')
      .trim();
  });

  protected onInputClick(event: MouseEvent): void {
    event.preventDefault();
    this.toggleFromEvent(event, 'mouse');
  }

  protected onInputKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.toggleFromEvent(event, 'keyboard');
  }

  protected onInputFocus(): void {
    this.hasFocus.set(true);
    this.focusChange.emit(true);
  }

  protected onInputBlur(): void {
    this.hasFocus.set(false);
    this.onTouched();
    this.blurChange.emit(true);
  }

  writeValue(value: unknown): void {
    this.internalChecked.set(value === true);
    this.internalIndeterminate.set(false);
  }

  registerOnChange(fn: (checked: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required()) {
      return null;
    }

    return control.value === true ? null : { required: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected isFormInvalid(): boolean {
    const control = this.formControl();
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  protected readonly hasErrorOverride = computed(() => this.errorOverride().trim().length > 0);

  /** Form invalid or an explicit `errorOverride` — drives chrome, ARIA, and host `data-invalid`. */
  protected isInvalid(): boolean {
    return this.hasErrorOverride() || this.isFormInvalid();
  }

  protected showRequiredError(): boolean {
    const control = this.formControl();
    return Boolean(control?.hasError('required') && (control.touched || control.dirty));
  }

  protected showErrorMessage(): boolean {
    return this.hasErrorOverride() || this.showRequiredError();
  }

  protected errorMessage(): string {
    const override = this.errorOverride().trim();
    return override || this.requiredErrorMessage();
  }

  protected isRequiredField(): boolean {
    const control = this.formControl();
    return (
      this.required() ||
      Boolean(control?.hasValidator?.(Validators.required)) ||
      Boolean(control?.hasValidator?.(Validators.requiredTrue))
    );
  }

  private formControl(): NgControl['control'] | null {
    return this.injector.get(NgControl, null, { optional: true, self: true })?.control ?? null;
  }

  private toggleFromEvent(
    event: MouseEvent | KeyboardEvent,
    source: PixelCheckboxInteractionSource,
  ): void {
    if (this.isDisabled() || this.readonly()) {
      event.stopImmediatePropagation();
      return;
    }

    event.stopPropagation();
    this.lastInteractionSource.set(source);
    this.click.emit(event);

    const nextChecked = this.effectiveIndeterminate() ? true : !this.effectiveChecked();

    this.internalChecked.set(nextChecked);
    this.internalIndeterminate.set(false);
    this.onChange(nextChecked);
    this.checkedChange.emit(nextChecked);
    this.stateChange.emit({
      checked: nextChecked,
      indeterminate: false,
      state: nextChecked ? 'checked' : 'unchecked',
      source: this.lastInteractionSource(),
      originalEvent: event,
    });
    const analyticsId = this.analyticsId().trim();
    emitPixelUiAnalytics(this.analytics, {
      name: 'ui.checkbox.toggle',
      component: 'pixel-checkbox',
      disabled: this.analyticsDisabled(),
      extras: this.analyticsProperties(),
      reserved: {
        ...(analyticsId ? { checkboxId: analyticsId } : {}),
        ...(this.name().trim() ? { name: this.name().trim() } : {}),
        checked: nextChecked,
        source: this.lastInteractionSource(),
      },
    });
  }
}
