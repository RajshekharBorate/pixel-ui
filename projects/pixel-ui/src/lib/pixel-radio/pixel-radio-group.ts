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
import PixelRadioComponent from './pixel-radio';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import { normalizeClassValue, optionTrackKey, valuesEqual } from './pixel-radio.shared';
import {
  PIXEL_RADIO_GROUP,
  PixelRadioClassValue,
  PixelRadioGroupController,
  PixelRadioInteractionSource,
  PixelRadioLabelPosition,
  PixelRadioLayout,
  PixelRadioOption,
  PixelRadioOptionGroup,
  PixelRadioRegistration,
  PixelRadioSelectionChangeEvent,
  PixelRadioSize,
  PixelRadioVisualState,
} from './pixel-radio.tokens';

let nextRadioGroupId = 0;

@Component({
  selector: 'pixel-radio-group',
  standalone: true,
  imports: [PixelRadioComponent, PixelSkeletonComponent],
  templateUrl: './pixel-radio-group.html',
  styleUrl: './pixel-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelRadioGroupComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelRadioGroupComponent),
      multi: true,
    },
    {
      provide: PIXEL_RADIO_GROUP,
      useExisting: PixelRadioGroupComponent,
    },
  ],
})
export default class PixelRadioGroupComponent
  implements ControlValueAccessor, Validator, PixelRadioGroupController
{
  protected readonly fallbackId = `pixel-radio-group-${++nextRadioGroupId}`;
  protected readonly legendId = `${this.fallbackId}-legend`;
  protected readonly helperId = `${this.fallbackId}-helper`;
  protected readonly errorId = `${this.fallbackId}-error`;
  protected readonly descriptionId = `${this.fallbackId}-description`;
  protected readonly hintId = `${this.fallbackId}-hint`;

  private readonly injector = inject(Injector);
  private readonly internalValue = signal<unknown>(null);
  private readonly formDisabled = signal(false);
  private readonly registrations = signal<readonly PixelRadioRegistration[]>([]);
  private readonly previousValueInput = signal<unknown | null>(null);
  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  private readonly syncExternalValue = effect(() => {
    const control = this.formControl();
    if (control) {
      return;
    }

    const next = this.value();
    const previous = untracked(this.previousValueInput);

    if (previous === null || !valuesEqual(this.valueComparator(), next, previous)) {
      this.previousValueInput.set(next);
      this.internalValue.set(next);
    }
  });

  private readonly syncRequiredValidator = effect(() => {
    this.required();
    untracked(() => this.onValidatorChange());
  });

  /**
   * @component pixel-radio-group
   * Controlled selected value.
   *
   * @type {unknown}
   * @default null
   * @description Baseline selection when not bound to Angular forms.
   */
  readonly value = input<unknown>(null);

  /**
   * @component pixel-radio-group
   * Flat option list rendered by the group.
   *
   * @type {readonly PixelRadioOption[]}
   * @default []
   * @description Declarative options API; projected `pixel-radio` children are also supported.
   */
  readonly options = input<readonly PixelRadioOption[]>([]);

  /**
   * @component pixel-radio-group
   * Grouped option sections.
   *
   * @type {readonly PixelRadioOptionGroup[]}
   * @default []
   * @description Renders titled sections of options.
   */
  readonly optionGroups = input<readonly PixelRadioOptionGroup[]>([]);

  /**
   * @component pixel-radio-group
   * Visible group legend.
   *
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component pixel-radio-group
   * Supporting helper text below the group.
   *
   * @type {string}
   * @default ''
   */
  readonly helperText = input('');

  /**
   * @component pixel-radio-group
   * Short hint above the options.
   *
   * @type {string}
   * @default ''
   */
  readonly hintText = input('');

  /**
   * @component pixel-radio-group
   * Longer description below the legend.
   *
   * @type {string}
   * @default ''
   */
  readonly descriptionText = input('');

  /**
   * @component pixel-radio-group
   * Disables the entire group.
   *
   * @type {boolean}
   * @default false
   */
  /**
   * @component pixel-radio-group
   * When true, replaces the group with a skeleton placeholder. Bind to a loading signal or
   * a reactive form control's `pending` state: `[showSkeleton]="control.pending"`.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Number of skeleton rows shown when `showSkeleton` is true. Defaults to the number of
   * options if provided, otherwise 3.
   */
  readonly skeletonRows = input(0, { transform: numberAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Prevents value changes while keeping focus.
   *
   * @type {boolean}
   * @default false
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Marks the group as required.
   *
   * @type {boolean}
   * @default false
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Visual state variant.
   *
   * @type {'default' | 'disabled' | 'readonly' | 'error'}
   * @default 'default'
   */
  readonly state = input<PixelRadioVisualState>('default');

  /**
   * @component pixel-radio-group
   * Size passed to rendered options.
   *
   * @type {'xs' | 'sm' | 'md' | 'lg'}
   * @default 'md'
   */
  readonly size = input<PixelRadioSize>('md');

  /**
   * @component pixel-radio-group
   * Option layout within the group.
   *
   * @type {'horizontal' | 'vertical' | 'grid'}
   * @default 'vertical'
   */
  readonly layout = input<PixelRadioLayout>('vertical');

  /**
   * @component pixel-radio-group
   * Label position for rendered options.
   *
   * @type {'right' | 'left' | 'top' | 'bottom'}
   * @default 'right'
   */
  readonly labelPosition = input<PixelRadioLabelPosition>('right');

  /**
   * @component pixel-radio-group
   * Native form field name shared by radios.
   *
   * @type {string}
   * @default ''
   */
  readonly name = input('');

  /**
   * @component pixel-radio-group
   * Grid column count for grid layout.
   *
   * @type {string}
   * @default 'repeat(auto-fit, minmax(12rem, 1fr))'
   */
  readonly gridColumns = input('repeat(auto-fit, minmax(12rem, 1fr))');

  /**
   * @component pixel-radio-group
   * Bordered option styling.
   *
   * @type {boolean}
   * @default false
   */
  readonly bordered = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Filled option styling.
   *
   * @type {boolean}
   * @default false
   */
  readonly filled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Compact density.
   *
   * @type {boolean}
   * @default false
   */
  readonly compact = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Card-style options.
   *
   * @type {boolean}
   * @default false
   */
  readonly card = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-radio-group
   * Required validation message.
   *
   * @type {string}
   * @default 'Please select an option.'
   */
  readonly requiredErrorMessage = input('Please select an option.');

  /**
   * @component pixel-radio-group
   * Extra CSS classes on the fieldset.
   *
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /**
   * @component pixel-radio-group
   * Angular-style class map for the fieldset.
   *
   * @type {PixelRadioClassValue}
   * @default ''
   */
  readonly classList = input<PixelRadioClassValue>('');

  /**
   * @component pixel-radio-group
   * Value equality function.
   *
   * @type {(a: unknown, b: unknown) => boolean}
   * @default Object.is
   */
  readonly valueComparator = input<(a: unknown, b: unknown) => boolean>((a, b) => Object.is(a, b));

  /** Emits the next selected value. */
  readonly valueChange = output<unknown>();

  /** Emits a rich selection payload. */
  readonly selectionChange = output<PixelRadioSelectionChangeEvent>();

  /** Emits when group focus state changes. */
  readonly focusChange = output<boolean>();

  /** Emits when the group is blurred. */
  readonly blurChange = output<boolean>();

  /** Emits when an option is clicked. */
  readonly optionClick = output<PixelRadioSelectionChangeEvent>();

  /** Emits when keyboard changes selection. */
  readonly keyboardSelection = output<PixelRadioSelectionChangeEvent>();

  /** Emits hover state for an option value. */
  readonly hoverChange = output<{ value: unknown; hovered: boolean }>();

  readonly selectedValue = this.internalValue.asReadonly();

  protected readonly groupedOptions = computed(() => this.options());

  protected readonly resolvedSkeletonRows = computed(() => {
    const explicit = this.skeletonRows();
    if (explicit > 0) return explicit;
    const fromOptions = this.options().length || this.optionGroups().reduce((n, g) => n + g.options.length, 0);
    return fromOptions > 0 ? fromOptions : 3;
  });

  protected readonly skeletonRowArray = computed(() =>
    Array.from({ length: this.resolvedSkeletonRows() }),
  );

  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled() || this.state() === 'disabled',
  );

  protected readonly groupClassList = computed(() =>
    [this.className().trim(), normalizeClassValue(this.classList())].filter(Boolean).join(' '),
  );

  readonly showErrorState = computed(() => this.state() === 'error' || this.isFormInvalid());

  protected trackOption(option: PixelRadioOption, index: number): string {
    return optionTrackKey(option, index);
  }

  protected resolveOptionState(option: PixelRadioOption): PixelRadioVisualState {
    if (option.disabled) {
      return 'disabled';
    }
    if (this.showErrorState()) {
      return 'error';
    }
    return 'default';
  }

  protected groupDescribedBy(): string {
    return [this.descriptionText() ? this.descriptionId : '', this.hintText() ? this.hintId : '']
      .filter(Boolean)
      .join(' ')
      .trim();
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

  protected onGroupKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }

    const key = event.key;
    if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
      return;
    }

    const vertical = this.layout() === 'vertical';
    const isNext =
      (vertical && key === 'ArrowDown') ||
      (!vertical && key === 'ArrowRight') ||
      (this.layout() === 'grid' && (key === 'ArrowDown' || key === 'ArrowRight'));
    const isPrev =
      (vertical && key === 'ArrowUp') ||
      (!vertical && key === 'ArrowLeft') ||
      (this.layout() === 'grid' && (key === 'ArrowUp' || key === 'ArrowLeft'));

    if (!isNext && !isPrev) {
      return;
    }

    event.preventDefault();
    const enabled = this.enabledRegistrations();
    if (!enabled.length) {
      return;
    }

    const currentIndex = enabled.findIndex((entry) =>
      this.valueEquals(entry.value(), this.internalValue()),
    );
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const direction = isNext ? 1 : -1;
    const nextIndex = (startIndex + direction + enabled.length) % enabled.length;
    const next = enabled[nextIndex];
    this.select(next.value(), 'keyboard', event);
    next.focus();
  }

  valueEquals(a: unknown, b: unknown): boolean {
    return valuesEqual(this.valueComparator(), a, b);
  }

  isSelected(value: unknown): boolean {
    return this.valueEquals(this.internalValue(), value);
  }

  select(value: unknown, source: PixelRadioInteractionSource, event?: Event): void {
    if (this.isDisabled() || this.readonly()) {
      event?.preventDefault();
      return;
    }

    const previousValue = this.internalValue();
    if (this.valueEquals(previousValue, value)) {
      return;
    }

    this.internalValue.set(value);
    this.onChange(value);
    this.valueChange.emit(value);

    const payload: PixelRadioSelectionChangeEvent = {
      value,
      previousValue: previousValue as never,
      source,
      originalEvent: event,
    };

    this.selectionChange.emit(payload);

    if (source === 'keyboard') {
      this.keyboardSelection.emit(payload);
    }
  }

  register(radio: PixelRadioRegistration): void {
    this.registrations.update((entries) => [...entries, radio]);
  }

  unregister(id: string): void {
    this.registrations.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  focusNext(currentId: string, direction: 1 | -1): void {
    const enabled = this.enabledRegistrations();
    const currentIndex = enabled.findIndex((entry) => entry.id === currentId);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = (currentIndex + direction + enabled.length) % enabled.length;
    enabled[nextIndex]?.focus();
  }

  getTabIndex(value: unknown, disabled: boolean): number {
    if (disabled || this.isDisabled()) {
      return -1;
    }

    const enabled = this.enabledRegistrations();
    if (!enabled.length) {
      return 0;
    }

    const selected = enabled.find((entry) =>
      this.valueEquals(entry.value(), this.internalValue()),
    );
    if (selected) {
      return this.valueEquals(selected.value(), value) ? 0 : -1;
    }

    return this.valueEquals(enabled[0]?.value(), value) ? 0 : -1;
  }

  writeValue(value: unknown): void {
    this.internalValue.set(value ?? null);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.isRequiredField()) {
      return null;
    }

    const value = control.value;
    return value === null || value === undefined || value === '' ? { required: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  markTouched(): void {
    this.onTouched();
  }

  private enabledRegistrations(): readonly PixelRadioRegistration[] {
    return this.registrations().filter((entry) => !entry.disabled());
  }

  private formControl(): NgControl['control'] | null {
    return this.injector.get(NgControl, null, { optional: true, self: true })?.control ?? null;
  }

  private isFormInvalid(): boolean {
    const control = this.formControl();
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }
}
