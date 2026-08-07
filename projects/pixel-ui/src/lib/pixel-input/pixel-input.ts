import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
  viewChild,
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
import { merge } from 'rxjs';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

export type PixelInputSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelInputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type PixelInputLabelPosition = 'top' | 'left' | 'floating' | 'hidden';
export type PixelInputResize = 'none' | 'vertical' | 'horizontal' | 'both';
export type PixelInputClassValue =
  | string
  | string[]
  | Record<string, boolean>
  | null
  | undefined;

export interface PixelInputIconClickEvent {
  readonly side: 'prefix' | 'suffix';
  readonly role: 'password-toggle' | 'trailing-action';
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

/**
 * Maps `AbstractControl` error keys (e.g. `required`, `email`) to user-visible copy.
 * Use `{requiredLength}` / `{actualLength}` placeholders for `minlength` / `maxlength` details.
 */
export interface PixelInputValidationMessages {
  required?: string;
  email?: string;
  minlength?: string;
  maxlength?: string;
  pattern?: string;
  [errorCode: string]: string | undefined;
}

const VALIDATION_MESSAGE_PRIORITY: readonly string[] = [
  'required',
  'email',
  'minlength',
  'maxlength',
  'pattern',
];

function interpolateValidationTemplate(template: string, errorDetail: unknown): string {
  if (errorDetail === true || errorDetail === null || errorDetail === undefined) {
    return template;
  }
  if (typeof errorDetail !== 'object') {
    return template.replaceAll('{value}', String(errorDetail));
  }
  let result = template;
  for (const [key, value] of Object.entries(errorDetail as Record<string, unknown>)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

function resolveValidationMessage(
  errors: ValidationErrors,
  messages: PixelInputValidationMessages,
): string {
  for (const key of VALIDATION_MESSAGE_PRIORITY) {
    if (errors[key] != null) {
      const tpl = messages[key]?.trim();
      if (tpl) {
        return interpolateValidationTemplate(tpl, errors[key]);
      }
    }
  }
  for (const key of Object.keys(errors)) {
    const tpl = messages[key]?.trim();
    if (tpl) {
      return interpolateValidationTemplate(tpl, errors[key]);
    }
  }
  return '';
}

let nextInputId = 0;

function normalizeClassValue(classValue: PixelInputClassValue): string {
  if (!classValue) {
    return '';
  }

  if (typeof classValue === 'string') {
    return classValue.trim();
  }

  if (Array.isArray(classValue)) {
    return classValue
      .flatMap((value) => normalizeClassValue(value as PixelInputClassValue))
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
 * Accessible text field with labels, affixes, form-derived error styling, and theming hooks.
 *
 * Implements `ControlValueAccessor` for reactive and template-driven forms. Prefer
 * `valueChange` and explicit `[value]` bindings when not using Angular forms.
 */
@Component({
  selector: 'pixel-input',
  imports: [NgTemplateOutlet, PixelButtonComponent, PixelSkeletonComponent],
  templateUrl: './pixel-input.html',
  styleUrl: './pixel-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelInputComponent),
      multi: true,
    },
  ],
})
export default class PixelInputComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-input-${++nextInputId}`;
  protected readonly helperId = `${this.fallbackId}-helper`;
  protected readonly errorId = `${this.fallbackId}-error`;
  protected readonly counterId = `${this.fallbackId}-counter`;
  private readonly injector = inject(Injector);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  protected readonly internalValue = signal('');
  private readonly formDisabled = signal(false);
  /** True when the bound NgControl is invalid and touched or dirty (reactive / template-driven). */
  private readonly controlShowsError = signal(false);
  private readonly controlValidationErrors = signal<ValidationErrors | null>(null);
  /** True when the bound control status is `PENDING` (async validators running). */
  private readonly controlPending = signal(false);
  private readonly previousValueInput = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);
  protected readonly isFocused = signal(false);
  protected readonly nativeRef =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('nativeRef');
  protected readonly controlOriginRef = viewChild<ElementRef<HTMLElement>>('controlOriginRef');
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  private readonly syncExternalValue = effect(() => {
    const control = this.resolveFormControl();
    if (control) {
      return;
    }

    const next = this.value();
    const previous = untracked(this.previousValueInput);

    if (previous === null || next !== previous) {
      this.previousValueInput.set(next);
      this.internalValue.set(next);
    }
  });

  private readonly syncValidators = effect(() => {
    this.required();
    this.minLength();
    this.maxLength();
    this.pattern();
    untracked(() => this.onValidatorChange());
  });

  private readonly syncAutoResize = effect(() => {
    if (!this.multiline() || !this.autoResize()) {
      return;
    }

    this.internalValue();
    const ref = this.nativeRef();
    if (!ref) {
      return;
    }

    const el = ref.nativeElement;
    if (!(el instanceof HTMLTextAreaElement)) {
      return;
    }

    queueMicrotask(() => {
      el.style.blockSize = 'auto';
      el.style.blockSize = `${el.scrollHeight}px`;
    });
  });

  private readonly syncControlErrorVisibility = effect((onCleanup) => {
    const control = untracked(() => this.resolveFormControl());
    if (!control) {
      untracked(() => {
        this.controlShowsError.set(false);
        this.controlValidationErrors.set(null);
        this.controlPending.set(false);
      });
      return;
    }

    const sync = (): void => {
      const pending = control.pending;
      this.controlPending.set(pending);
      this.controlValidationErrors.set(control.errors);
      this.controlShowsError.set(
        Boolean(
          !pending && control.invalid && (control.touched || control.dirty),
        ),
      );
    };

    sync();
    const sub = merge(
      control.statusChanges,
      control.valueChanges,
      control.events,
    ).subscribe(sync);
    onCleanup(() => sub.unsubscribe());
  });

  /**
   * @component pixel-input
   * Optional id for the native input; falls back to a generated stable id.
   */
  readonly id = input('');

  /**
   * @component pixel-input
   * Visible field label (also used for floating and screen reader wiring).
   */
  readonly label = input('');

  /**
   * @component pixel-input
   * Controlled string value when not bound through Angular forms.
   */
  readonly value = input('');

  /**
   * @component pixel-input
   * Native input type (password visibility toggle applies when `password`). Ignored when
   * `multiline` is true (a `<textarea>` is rendered instead).
   */
  readonly type = input<PixelInputType>('text');

  /**
   * @component pixel-input
   * Renders a `<textarea>` instead of `<input>`, while keeping the same label / helper /
   * validation / counter / clear-button chrome. `type` and `showPasswordToggle` do not apply.
   */
  readonly multiline = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Initial visible row count when `multiline` is true. Ignored otherwise.
   */
  readonly rows = input(3, { transform: numberAttribute });

  /**
   * @component pixel-input
   * When `multiline` is true, automatically grows the textarea to fit its content. Disables the
   * native `resize` handle since the height is managed by the component.
   */
  readonly autoResize = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Native textarea `resize` behavior when `multiline` is true. Ignored when `autoResize` is on.
   */
  readonly resize = input<PixelInputResize>('vertical');

  /**
   * @component pixel-input
   * Native `name` attribute for forms.
   */
  readonly name = input('');

  /**
   * @component pixel-input
   * Placeholder shown in the field (suppressed for floating labels until focus/value).
   */
  readonly placeholder = input('');

  /**
   * @component pixel-input
   * Disables interaction and applies disabled styling.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Prevents edits while keeping focus for copy actions.
   */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * When false, the field does not inherit error state from an ancestor `NgControl`
   * (e.g. value-only fields nested inside another `ControlValueAccessor`).
   */
  readonly inheritParentControlErrors = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Marks the control as required for validation and UI.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Size variant for typography, padding, and height.
   */
  readonly size = input<PixelInputSize>('md');

  /**
   * @component pixel-input
   * Shows a loading spinner (not derived from the form control). The native input stays enabled
   * unless `disabledWhileLoading` is true.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * When true together with `loading`, applies disabled styling and disables the native input.
   */
  readonly disabledWhileLoading = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * When true (default), shows the same loader as `[loading]` while the bound control status is
   * `PENDING` (async validators). Does not disable the input unless `disabledWhileLoading` is set
   * on the explicit `[loading]` input only.
   */
  readonly showLoaderWhenPending = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Label layout relative to the field.
   */
  readonly labelPosition = input<PixelInputLabelPosition>('top');

  /**
   * @component pixel-input
   * Non-error hint text linked with `aria-describedby` when visible. Hidden while the bound
   * control is invalid and touched or dirty. Validation copy comes from `validationMessages`.
   */
  readonly helperText = input('');

  /**
   * @component pixel-input
   * Messages for each `ValidationErrors` key when the bound control is invalid and touched or dirty.
   */
  readonly validationMessages = input<PixelInputValidationMessages>({});

  /**
   * @component pixel-input
   * Forces error styling and copy regardless of touched/dirty (e.g. live parse feedback).
   */
  readonly errorOverride = input('');

  /**
   * @component pixel-input
   * Native `maxlength` and enables the optional counter display.
   */
  readonly maxLength = input(0, { transform: numberAttribute });

  /**
   * @component pixel-input
   * Native `minlength` for validation.
   */
  readonly minLength = input(0, { transform: numberAttribute });

  /**
   * @component pixel-input
   * Native `pattern` for validation.
   */
  readonly pattern = input('');

  /**
   * @component pixel-input
   * Native `autocomplete` hint.
   */
  readonly autocomplete = input('');

  /**
   * @component pixel-input
   * Native `spellcheck` toggle.
   */
  readonly spellcheck = input(true, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Native `inputmode` hint for virtual keyboards.
   */
  readonly inputmode = input('');

  /**
   * @component pixel-input
   * Leading static affix text inside the field.
   */
  readonly prefixText = input('');

  /**
   * @component pixel-input
   * Trailing static affix text inside the field.
   */
  readonly suffixText = input('');

  /**
   * @component pixel-input
   * Shows a clear affordance when the field has text.
   */
  readonly showClear = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Shows a visibility toggle when `type` is `password`.
   */
  readonly showPasswordToggle = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Material icon name for a trailing icon button (e.g. calendar toggle on a datepicker field).
   */
  readonly trailingIcon = input('');

  /**
   * @component pixel-input
   * Accessible name for the trailing icon button.
   */
  readonly trailingIconLabel = input('');

  /**
   * @component pixel-input
   * Tab order for the trailing icon button. Defaults to `-1` so the native input stays primary.
   */
  readonly trailingIconTabIndex = input(-1, { transform: numberAttribute });

  /**
   * @component pixel-input
   * Disables the trailing icon button without disabling the native input.
   */
  readonly trailingIconDisabled = input(false, { transform: booleanAttribute });

  /**
   * When true, host `disabled` does not force-disable the trailing icon — only
   * `trailingIconDisabled` applies. Used by datepickers for “input disabled / popup enabled”.
   *
   * @type {boolean}
   * @default false
   */
  readonly trailingIconBypassHostDisabled = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Accessible name override when no visible label is shown.
   */
  readonly ariaLabel = input('');

  /**
   * @type {string}
   * @default 'Clear input'
   * @description Accessible name for the clear adornment button.
   */
  readonly clearLabel = input('Clear input');

  /**
   * @type {string}
   * @default 'Loading'
   * @description Accessible name for the inline loading spinner.
   */
  readonly loadingLabel = input('Loading');

  /**
   * @type {string}
   * @default 'Show password'
   */
  readonly passwordShowLabel = input('Show password');

  /**
   * @type {string}
   * @default 'Hide password'
   */
  readonly passwordHideLabel = input('Hide password');

  /**
   * @type {string}
   * @default 'Text field'
   * @description Fallback `aria-label` when no visible label is shown.
   */
  readonly untitledLabel = input('Text field');

  /**
   * @component pixel-input
   * Native `aria-haspopup` on the field (e.g. `dialog` for datepicker).
   */
  readonly ariaHasPopup = input<string | boolean | null>(null);

  /**
   * @component pixel-input
   * Native `aria-expanded` on the field.
   */
  readonly ariaExpanded = input<string | boolean | null>(null);

  /**
   * @component pixel-input
   * Native `aria-controls` on the field.
   */
  readonly ariaControls = input('');

  /**
   * @component pixel-input
   * Additional ids merged into `aria-describedby`.
   */
  readonly ariaDescribedBy = input('');

  /**
   * @component pixel-input
   * Tab order for the native input.
   */
  readonly tabIndex = input(0, { transform: numberAttribute });

  /**
   * @component pixel-input
   * Native `autofocus` attribute.
   */
  readonly autofocus = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * When true, replaces the field with a skeleton placeholder. Bind to a loading signal or
   * a reactive form control's `pending` state: `[showSkeleton]="control.pending"`.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Skips primary focus border and outer focus ring (e.g. embedded select panel search).
   */
  readonly suppressFocusChrome = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Keeps focus border / ring styling while a related popup is open (e.g. datepicker calendar).
   */
  readonly focusedChrome = input(false, { transform: booleanAttribute });

  /**
   * @component pixel-input
   * Extra classes appended to the host container.
   */
  readonly className = input('');

  /**
   * @component pixel-input
   * Structured class map support (string, array, or record).
   */
  readonly classList = input<PixelInputClassValue>('');

  /** Emits the full string whenever the value changes from user input or clear actions. */
  readonly valueChange = output<string>();

  /** Emits on each native `input` event with the latest string. */
  readonly inputChange = output<string>();

  /** Emits `true` on focus and `false` on blur. */
  readonly focusChange = output<boolean>();

  /** Emits `true` after blur (mirrors checkbox output shape for consistency). */
  readonly blurChange = output<boolean>();

  /** Emits when Enter is pressed inside the field. */
  readonly enterPress = output<KeyboardEvent>();

  /** Emits when the clear button is activated. */
  readonly clearClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when an integrated icon control is activated (password visibility or trailing action). */
  readonly iconClick = output<PixelInputIconClickEvent>();

  /** Emits when the trailing icon button is activated. */
  readonly trailingIconClick = output<MouseEvent | KeyboardEvent>();

  /** Emits native keydown events from the field (after built-in handling). */
  readonly nativeKeydown = output<KeyboardEvent>();

  protected readonly inputId = computed(() => this.id().trim() || this.fallbackId);

  protected readonly customClassList = computed(() => {
    return [this.className().trim(), normalizeClassValue(this.classList())]
      .filter(Boolean)
      .join(' ')
      .trim();
  });

  protected readonly isNativeDisabled = computed(() => {
    return (
      this.disabled() ||
      this.formDisabled() ||
      (this.loading() && this.disabledWhileLoading())
    );
  });

  protected readonly isTrailingIconDisabled = computed(() => {
    if (this.trailingIconDisabled()) {
      return true;
    }
    if (this.trailingIconBypassHostDisabled()) {
      return false;
    }
    return this.isNativeDisabled();
  });

  protected readonly isNativeReadonly = computed(() => this.readonly());

  protected readonly showLoader = computed(
    () =>
      this.loading() ||
      (this.showLoaderWhenPending() && this.controlPending()),
  );

  protected readonly hasErrorOverride = computed(() => this.errorOverride().trim().length > 0);

  /** Field chrome uses focused styling when the native input is focused or `focusedChrome` is on. */
  protected readonly showFocusedChrome = computed(() => this.isFocused() || this.focusedChrome());

  protected readonly showsValidationError = computed(
    () => this.hasErrorOverride() || this.controlShowsError(),
  );

  protected readonly visualState = computed(() => {
    if (this.showLoader()) {
      return 'loading' as const;
    }
    if (this.showsValidationError()) {
      return 'error' as const;
    }
    return 'default' as const;
  });

  protected readonly hasValue = computed(() => this.internalValue().length > 0);

  protected readonly characterCount = computed(() => this.internalValue().length);

  protected readonly effectiveInputType = computed(() => {
    if (this.type() !== 'password') {
      return this.type();
    }

    return this.passwordVisible() ? 'text' : 'password';
  });

  protected readonly showCounter = computed(() => this.maxLength() > 0);

  protected readonly isOverMax = computed(
    () => this.maxLength() > 0 && this.characterCount() > this.maxLength(),
  );

  protected readonly floatingPlaceholder = computed(() => {
    if (this.labelPosition() !== 'floating') {
      return this.placeholder();
    }

    return this.showFocusedChrome() || this.hasValue() ? this.placeholder() : '';
  });

  protected readonly showClearButton = computed(
    () =>
      this.showClear() &&
      this.hasValue() &&
      !this.isNativeDisabled() &&
      !this.isNativeReadonly(),
  );

  protected readonly showPasswordToggleButton = computed(
    () =>
      !this.multiline() &&
      this.type() === 'password' &&
      this.showPasswordToggle() &&
      !this.isNativeDisabled(),
  );

  protected readonly showTrailingIconButton = computed(
    () => !this.multiline() && this.trailingIcon().trim().length > 0,
  );

  protected readonly trailingIconAriaLabel = computed(
    () => this.trailingIconLabel().trim() || 'Action',
  );

  protected readonly ariaHasPopupAttr = computed(() => {
    const value = this.ariaHasPopup();
    return value === null || value === undefined || value === false ? null : value;
  });

  protected readonly ariaExpandedAttr = computed(() => {
    const value = this.ariaExpanded();
    return value === null || value === undefined ? null : value;
  });

  protected readonly ariaControlsAttr = computed(() => this.ariaControls().trim() || null);

  /** CSS `resize` value for the native textarea when `multiline` is true. */
  protected readonly resolvedResize = computed<PixelInputResize>(() =>
    this.autoResize() ? 'none' : this.resize(),
  );

  protected readonly spellcheckAttr = computed(() => {
    return this.spellcheck() ? 'true' : 'false';
  });

  protected readonly ariaLabelValue = computed(() => {
    const explicit = this.ariaLabel().trim();
    if (explicit) {
      return explicit;
    }

    if (this.labelPosition() === 'hidden' && this.label().trim()) {
      return null;
    }

    if (!this.showLabel() && !this.label().trim()) {
      return this.untitledLabel();
    }

    return null;
  });

  protected readonly helperLines = computed(() => {
    const text = this.helperText();
    if (!text.trim()) {
      return [];
    }

    return text.split('\n').map((line) => line.trim());
  });

  /** Hint copy is hidden while the bound control is showing validation errors. */
  protected readonly showHelperHint = computed(
    () => this.helperLines().length > 0 && !this.showsValidationError(),
  );

  protected readonly resolvedValidationMessage = computed(() => {
    const override = this.errorOverride().trim();
    if (override) {
      return override;
    }
    if (!this.controlShowsError()) {
      return '';
    }
    const errors = this.controlValidationErrors();
    if (!errors) {
      return '';
    }
    return resolveValidationMessage(errors, this.validationMessages());
  });

  protected readonly describedBy = computed(() => {
    const ids = [
      this.ariaDescribedBy().trim(),
      this.resolvedValidationMessage().trim() ? this.errorId : '',
      this.showHelperHint() ? this.helperId : '',
      this.showCounter() ? this.counterId : '',
    ];

    return ids.filter(Boolean).join(' ').trim();
  });

  protected readonly ariaInvalid = computed(() =>
    this.showsValidationError() ? 'true' : 'false',
  );

  protected readonly showFieldMeta = computed(
    () =>
      this.resolvedValidationMessage().trim().length > 0 ||
      this.showHelperHint() ||
      this.showCounter(),
  );

  protected readonly skeletonFieldHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '2.35rem';
      case 'sm': return '2.5rem';
      case 'lg': return '3.125rem';
      default:   return '2.75rem';
    }
  });

  protected readonly shouldShowSkeletonLabel = computed(() =>
    !!this.label().trim() &&
    this.labelPosition() !== 'hidden' &&
    this.labelPosition() !== 'floating',
  );

  protected showLabel(): boolean {
    return Boolean(this.label().trim()) && this.labelPosition() !== 'hidden';
  }

  protected isRequiredField(): boolean {
    return this.isControlRequired(this.resolveFormControl());
  }

  private isControlRequired(control: AbstractControl | null): boolean {
    return Boolean(this.required() || control?.hasValidator?.(Validators.required));
  }

  protected clearButtonLabel(): string {
    return this.clearLabel();
  }

  protected passwordToggleLabel(): string {
    return this.passwordVisible() ? this.passwordHideLabel() : this.passwordShowLabel();
  }

  writeValue(value: unknown): void {
    this.internalValue.set(value === null || value === undefined ? '' : String(value));
    this.previousValueInput.set(this.internalValue());
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const asString = value === null || value === undefined ? '' : String(value);
    const required = this.isControlRequired(control);

    if (required && asString.trim() === '') {
      return { required: true };
    }

    if (this.minLength() > 0 && asString.length > 0 && asString.length < this.minLength()) {
      return { minlength: { requiredLength: this.minLength(), actualLength: asString.length } };
    }

    if (this.maxLength() > 0 && asString.length > this.maxLength()) {
      return { maxlength: { requiredLength: this.maxLength(), actualLength: asString.length } };
    }

    if (this.pattern() && asString.length > 0) {
      try {
        const regex = new RegExp(this.pattern());
        if (!regex.test(asString)) {
          return { pattern: true };
        }
      } catch {
        return { pattern: true };
      }
    }

    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected onNativeInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const next = target.value;
    this.internalValue.set(next);
    this.onChange(next);
    this.valueChange.emit(next);
    this.inputChange.emit(next);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.enterPress.emit(event);
    }

    if (event.key === 'Escape' && this.showClear() && this.hasValue() && !this.isNativeDisabled()) {
      event.preventDefault();
      this.clearValue();
    }

    this.nativeKeydown.emit(event);
  }

  /** Moves focus to the native input or textarea. */
  focus(): void {
    this.nativeRef()?.nativeElement.focus();
  }

  /** Element to anchor floating panels (e.g. datepicker calendar) below the field control. */
  overlayOrigin(): HTMLElement | null {
    return (
      (this.hostRef.nativeElement.querySelector('.pixel-input__wrapper') as HTMLElement | null) ??
      this.controlOriginRef()?.nativeElement ??
      null
    );
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    this.focusChange.emit(false);
    this.blurChange.emit(true);
  }

  protected onClear(event: MouseEvent | KeyboardEvent): void {
    event.preventDefault();
    this.clearValue();
    this.clearClick.emit(event);
  }

  protected onPasswordToggle(event: MouseEvent | KeyboardEvent): void {
    event.preventDefault();
    this.passwordVisible.update((visible) => !visible);
    this.iconClick.emit({
      side: 'suffix',
      role: 'password-toggle',
      originalEvent: event,
    });
  }

  protected onTrailingIconClick(event: MouseEvent | KeyboardEvent): void {
    event.preventDefault();
    this.iconClick.emit({
      side: 'suffix',
      role: 'trailing-action',
      originalEvent: event,
    });
    this.trailingIconClick.emit(event);
  }

  private clearValue(): void {
    if (this.isNativeDisabled() || this.isNativeReadonly()) {
      return;
    }

    this.internalValue.set('');
    this.onChange('');
    this.valueChange.emit('');
    this.inputChange.emit('');
  }

  /**
   * Resolves the bound `AbstractControl` for reactive / template-driven forms.
   * Tries `Self` first (same element as `formControlName` / `ngModel`), then the host tree.
   */
  private resolveFormControl(): AbstractControl | null {
    const fromSelf = this.injector.get(NgControl, null, { optional: true, self: true });
    if (fromSelf?.control) {
      return fromSelf.control;
    }

    if (!this.inheritParentControlErrors()) {
      return null;
    }

    return this.injector.get(NgControl, null, { optional: true })?.control ?? null;
  }
}
