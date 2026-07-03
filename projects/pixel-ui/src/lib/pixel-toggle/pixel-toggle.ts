import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChild,
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
import PixelToggleCheckedIconDirective from './pixel-toggle-checked-icon';
import PixelToggleUncheckedIconDirective from './pixel-toggle-unchecked-icon';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
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
import type {
  PixelToggleCheckedChangeEvent,
  PixelToggleClassValue,
  PixelToggleInteractionSource,
  PixelToggleLabelPosition,
  PixelToggleMode,
  PixelToggleOption,
  PixelToggleSegmentedAppearance,
  PixelToggleSegmentedShape,
  PixelToggleSize,
  PixelToggleSwitchAppearance,
  PixelToggleValueChangeEvent,
} from './pixel-toggle.types';

export type {
  PixelToggleCheckedChangeEvent,
  PixelToggleClassValue,
  PixelToggleInteractionSource,
  PixelToggleLabelPosition,
  PixelToggleMode,
  PixelToggleOption,
  PixelToggleSegmentedAppearance,
  PixelToggleSegmentedShape,
  PixelToggleSize,
  PixelToggleSwitchAppearance,
  PixelToggleValueChangeEvent,
} from './pixel-toggle.types';

let nextToggleId = 0;

function normalizeClassValue(classValue: PixelToggleClassValue): string {
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

/**
 * Accessible, themeable toggle switch and segmented control.
 *
 * `switch` mode is a boolean sliding switch with optional thumb icons and in-track ON/OFF labels.
 * `segmented` mode is a pill selector for two or more mutually exclusive options.
 *
 * Implements `ControlValueAccessor` for reactive and template-driven forms.
 */
@Component({
  selector: 'pixel-toggle',
  standalone: true,
  imports: [NgTemplateOutlet, PixelSkeletonComponent],
  templateUrl: './pixel-toggle.html',
  styleUrl: './pixel-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelToggleComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelToggleComponent),
      multi: true,
    },
  ],
})
export default class PixelToggleComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-toggle-${++nextToggleId}`;
  protected readonly helperId = `${this.fallbackId}-helper`;
  protected readonly errorId = `${this.fallbackId}-error`;
  protected readonly externalLabelId = `${this.fallbackId}-label`;
  protected readonly hasFocus = signal(false);
  private readonly injector = inject(Injector);
  private readonly internalChecked = signal(false);
  private readonly internalValue = signal<string | number | null>(null);
  private readonly formDisabled = signal(false);
  private readonly previousCheckedInput = signal(false);
  private readonly previousValueInput = signal<string | number | null>(null);
  private readonly lastInteractionSource = signal<PixelToggleInteractionSource>('mouse');
  private onChange: (value: boolean | string | number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  private readonly syncSwitchInput = effect(() => {
    if (this.mode() !== 'switch') {
      return;
    }

    const nextChecked = this.checked();
    if (nextChecked !== untracked(this.previousCheckedInput)) {
      this.previousCheckedInput.set(nextChecked);
      this.internalChecked.set(nextChecked);
    }
  });

  private readonly syncSegmentedInput = effect(() => {
    if (this.mode() !== 'segmented') {
      return;
    }

    const nextValue = this.value();
    if (nextValue !== untracked(this.previousValueInput)) {
      this.previousValueInput.set(nextValue);
      this.internalValue.set(nextValue);
    }
  });

  private readonly syncRequiredValidator = effect(() => {
    this.required();
    untracked(() => this.onValidatorChange());
  });

  /**
   * @component pixel-toggle
   * Interaction mode — boolean switch or multi-option segmented control.
   */
  readonly mode = input<PixelToggleMode>('switch');

  /**
   * @component pixel-toggle
   * Optional id applied to the native switch input (switch mode only).
   */
  readonly id = input('');

  /**
   * @component pixel-toggle
   * External label rendered beside the control.
   */
  readonly label = input('');

  /**
   * @component pixel-toggle
   * Controlled checked value for switch mode.
   */
  readonly checked = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-toggle
   * Controlled selected value for segmented mode.
   */
  readonly value = input<string | number | null>(null);

  /**
   * @component pixel-toggle
   * Segmented options. Requires at least two entries when `mode` is `segmented`.
   */
  readonly options = input<readonly PixelToggleOption[]>([]);

  /**
   * @component pixel-toggle
   * When true, replaces the control with a skeleton placeholder. Bind to a loading signal or
   * a reactive form control's `pending` state: `[showSkeleton]="control.pending"`.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-toggle
   * Disables all interaction.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-toggle
   * Marks the control as required for validation and UI.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-toggle
   * Prevents value changes while keeping focus available.
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-toggle
   * Visual size variant.
   */
  readonly size = input<PixelToggleSize>('md');

  /**
   * @component pixel-toggle
   * Switch track treatment.
   */
  readonly switchAppearance = input<PixelToggleSwitchAppearance>('default');

  /**
   * @component pixel-toggle
   * Segmented track treatment.
   */
  readonly segmentedAppearance = input<PixelToggleSegmentedAppearance>('contained');

  /**
   * @component pixel-toggle
   * Segmented corner shape — `rounded` follows `pixel-button`; `pill` uses a full capsule.
   */
  readonly segmentedShape = input<PixelToggleSegmentedShape>('rounded');

  /**
   * @component pixel-toggle
   * Label placement relative to the control.
   */
  readonly labelPosition = input<PixelToggleLabelPosition>('right');

  /**
   * @component pixel-toggle
   * In-track label when the switch is on (`switchAppearance="labeled"`).
   */
  readonly onLabel = input('ON');

  /**
   * @component pixel-toggle
   * In-track label when the switch is off (`switchAppearance="labeled"`).
   */
  readonly offLabel = input('OFF');

  /**
   * @component pixel-toggle
   * Thumb icon template projected via `<ng-template pixelToggleCheckedIcon>`.
   */
  readonly checkedIconTemplate = contentChild(PixelToggleCheckedIconDirective);

  /**
   * @component pixel-toggle
   * Thumb icon template projected via `<ng-template pixelToggleUncheckedIcon>`.
   */
  readonly uncheckedIconTemplate = contentChild(PixelToggleUncheckedIconDirective);

  /**
   * @component pixel-toggle
   * Supporting helper or description text.
   */
  readonly helperText = input('');

  /**
   * @component pixel-toggle
   * Required validation message.
   */
  readonly requiredErrorMessage = input('This field is required.');

  /**
   * @component pixel-toggle
   * Accessible name override.
   */
  readonly ariaLabel = input('');

  /**
   * @component pixel-toggle
   * Accessible name for segmented mode when no external label is provided.
   */
  readonly segmentedAriaLabel = input('Toggle options');

  /**
   * @component pixel-toggle
   * Space-separated ids for external descriptions.
   */
  readonly ariaDescribedBy = input('');

  /**
   * @component pixel-toggle
   * Native form field name (switch mode).
   */
  readonly name = input('');

  /**
   * @component pixel-toggle
   * Keyboard tab order.
   */
  readonly tabIndex = input(0, { transform: numberAttribute });

  /**
   * @component pixel-toggle
   * Automatically focuses the control on initial render.
   */
  readonly autofocus = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-toggle
   * Extra CSS classes appended to the root element.
   */
  readonly className = input('');

  /**
   * @component pixel-toggle
   * Angular-style class map input for advanced styling.
   */
  readonly classList = input<PixelToggleClassValue>('');

  /** Emits the next checked value after user interaction (switch mode). */
  readonly checkedChange = output<boolean>();

  /** Emits the next selected value after user interaction (segmented mode). */
  readonly valueChange = output<string | number>();

  /** Emits a rich payload after switch interaction. */
  readonly checkedStateChange = output<PixelToggleCheckedChangeEvent>();

  /** Emits a rich payload after segmented interaction. */
  readonly valueStateChange = output<PixelToggleValueChangeEvent<string | number>>();

  /** Emits true when the control receives focus. */
  readonly focusChange = output<boolean>();

  /** Emits true when the control loses focus. */
  readonly blurChange = output<boolean>();

  /** Emits the original pointer or keyboard activation event. */
  readonly activated = output<MouseEvent | KeyboardEvent>();

  protected readonly inputId = computed(() => this.id().trim() || this.fallbackId);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly skeletonTrackWidth = computed(() => {
    switch (this.size()) {
      case 'xs': return '2.25rem';
      case 'sm': return '2.5rem';
      case 'lg': return '3.25rem';
      default:   return '2.75rem';
    }
  });

  protected readonly skeletonTrackHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.25rem';
      case 'sm': return '1.375rem';
      case 'lg': return '1.75rem';
      default:   return '1.5rem';
    }
  });

  protected readonly effectiveChecked = computed(() => this.internalChecked());

  protected readonly effectiveValue = computed(() => this.internalValue());

  protected readonly segmentCount = computed(() => Math.max(this.options().length, 1));

  protected readonly selectedIndex = computed(() => {
    const current = this.effectiveValue();
    const index = this.options().findIndex((option) => option.value === current);
    return index >= 0 ? index : 0;
  });

  protected readonly hasThumbIcon = computed(() =>
    Boolean(this.checkedIconTemplate() || this.uncheckedIconTemplate()),
  );

  protected readonly customClassList = computed(() => {
    return [this.className().trim(), normalizeClassValue(this.classList())]
      .filter(Boolean)
      .join(' ')
      .trim();
  });

  protected hasExternalLabel(): boolean {
    return Boolean(this.label().trim() || this.helperText().trim() || this.showRequiredError());
  }

  protected resolvedAriaLabel(): string {
    const explicit = this.ariaLabel().trim();
    if (explicit) {
      return explicit;
    }

    if (this.label().trim()) {
      return '';
    }

    if (this.mode() === 'switch') {
      return 'Toggle';
    }

    return '';
  }

  protected describedBy(): string {
    return [
      this.ariaDescribedBy().trim(),
      this.hasExternalLabel() && this.label().trim() ? this.externalLabelId : '',
      this.helperText() ? this.helperId : '',
      this.showRequiredError() ? this.errorId : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  protected isOptionSelected(option: PixelToggleOption): boolean {
    return option.value === this.effectiveValue();
  }

  protected isSegmentDisabled(option: PixelToggleOption): boolean {
    return this.isDisabled() || this.readonly() || Boolean(option.disabled);
  }

  protected segmentTabIndex(index: number): number {
    if (this.isDisabled() || this.readonly()) {
      return -1;
    }

    return index === this.selectedIndex() ? 0 : -1;
  }

  protected onSwitchClick(event: MouseEvent): void {
    event.preventDefault();
    this.toggleSwitch(event, 'mouse');
  }

  protected onSwitchKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.toggleSwitch(event, 'keyboard');
  }

  protected onSegmentKeyDown(
    event: KeyboardEvent,
    option: PixelToggleOption,
    index: number,
  ): void {
    const options = this.options();
    const lastIndex = options.length - 1;

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.selectOption(option, event, 'keyboard');
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = options[Math.min(index + 1, lastIndex)];
      if (next) {
        this.selectOption(next, event, 'keyboard');
      }
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const previous = options[Math.max(index - 1, 0)];
      if (previous) {
        this.selectOption(previous, event, 'keyboard');
      }
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const first = options[0];
      if (first) {
        this.selectOption(first, event, 'keyboard');
      }
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      const last = options[lastIndex];
      if (last) {
        this.selectOption(last, event, 'keyboard');
      }
    }
  }

  protected selectOption(
    option: PixelToggleOption,
    event: MouseEvent | KeyboardEvent,
    source: PixelToggleInteractionSource,
  ): void {
    if (this.isSegmentDisabled(option) || this.isOptionSelected(option)) {
      return;
    }

    event.stopPropagation();
    this.lastInteractionSource.set(source);
    this.activated.emit(event);
    this.commitSegmentValue(option.value, source, event);
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
    if (this.mode() === 'switch') {
      this.internalChecked.set(value === true);
      return;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      this.internalValue.set(value);
      return;
    }

    this.internalValue.set(null);
  }

  registerOnChange(fn: (value: boolean | string | number | null) => void): void {
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

    if (this.mode() === 'switch') {
      return control.value === true ? null : { required: true };
    }

    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected isFormInvalid(): boolean {
    const control = this.formControl();
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  protected showRequiredError(): boolean {
    const control = this.formControl();
    return Boolean(control?.hasError('required') && (control.touched || control.dirty));
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

  private toggleSwitch(event: MouseEvent | KeyboardEvent, source: PixelToggleInteractionSource): void {
    if (this.isDisabled() || this.readonly()) {
      event.stopImmediatePropagation();
      return;
    }

    event.stopPropagation();
    this.lastInteractionSource.set(source);
    this.activated.emit(event);

    const nextChecked = !this.effectiveChecked();
    this.internalChecked.set(nextChecked);
    this.onChange(nextChecked);
    this.checkedChange.emit(nextChecked);
    this.checkedStateChange.emit({
      checked: nextChecked,
      source,
      originalEvent: event,
    });
  }

  private commitSegmentValue(
    value: string | number,
    source: PixelToggleInteractionSource,
    event: MouseEvent | KeyboardEvent,
  ): void {
    this.internalValue.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
    this.valueStateChange.emit({
      value,
      source,
      originalEvent: event,
    });
  }

}
