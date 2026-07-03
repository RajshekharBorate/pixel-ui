import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
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
} from '@angular/forms';
import { merge } from 'rxjs';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

export type PixelSliderSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelSliderMode = 'single' | 'range';
export type PixelSliderLabelPosition = 'top' | 'hidden';

export interface PixelSliderValidationMessages {
  required?: string;
  min?: string;
  max?: string;
  [errorCode: string]: string | undefined;
}

/** Single value for `single` mode; `[start, end]` tuple for `range` mode. */
export type PixelSliderValue = number | [number, number];

function defaultDisplayWith(value: number): string {
  return String(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function snapToStep(value: number, min: number, step: number): number {
  if (step <= 0) return value;
  return Math.round((value - min) / step) * step + min;
}

let nextSliderId = 0;

/**
 * Accessible slider — single thumb or dual-thumb range.
 *
 * Implements the WAI-ARIA Slider pattern with `role="slider"` on each native `<input type="range">`.
 * Supports Angular reactive and template-driven forms via `ControlValueAccessor` + `Validator`.
 *
 * @example Single
 * ```html
 * <pixel-slider label="Volume" [min]="0" [max]="100" [(value)]="volume" />
 * ```
 *
 * @example Range
 * ```html
 * <pixel-slider label="Price range" mode="range" [(value)]="priceRange" />
 * ```
 */
@Component({
  selector: 'pixel-slider',
  standalone: true,
  imports: [PixelSkeletonComponent],
  templateUrl: './pixel-slider.html',
  styleUrl: './pixel-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-slider-host',
    '[class.pixel-slider-host--xs]': "size() === 'xs'",
    '[class.pixel-slider-host--sm]': "size() === 'sm'",
    '[class.pixel-slider-host--md]': "size() === 'md'",
    '[class.pixel-slider-host--lg]': "size() === 'lg'",
    '[class.pixel-slider-host--disabled]': 'isDisabled()',
    '[class.pixel-slider-host--range]': "mode() === 'range'",
    '[class.pixel-slider-host--discrete]': 'discrete()',
    '[attr.data-size]': 'size()',
    '[attr.data-mode]': 'mode()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelSliderComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelSliderComponent),
      multi: true,
    },
  ],
})
export default class PixelSliderComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-slider-${++nextSliderId}`;
  protected readonly helperId = `${this.fallbackId}-helper`;
  private readonly injector = inject(Injector);

  private readonly formDisabled = signal(false);
  private readonly controlShowsError = signal(false);
  private readonly controlValidationErrors = signal<ValidationErrors | null>(null);
  protected readonly isFocused = signal(false);
  protected readonly activeThumb = signal<'start' | 'end' | null>(null);

  /** Internal single value (single mode). */
  private readonly internalSingle = signal(0);
  /** Internal range start (range mode). */
  private readonly internalStart = signal(0);
  /** Internal range end (range mode). */
  private readonly internalEnd = signal(100);

  private onChange: (value: PixelSliderValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  protected readonly nativeEndRef = viewChild<ElementRef<HTMLInputElement>>('nativeEndRef');
  protected readonly nativeStartRef = viewChild<ElementRef<HTMLInputElement>>('nativeStartRef');

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** @component Slider mode. `single` = one thumb; `range` = two thumbs. */
  readonly mode = input<PixelSliderMode>('single');

  /** @component Controlled value. `number` for single mode; `[start, end]` for range mode. */
  readonly value = input<PixelSliderValue>(0);

  /** @component Minimum value. */
  readonly min = input(0, { transform: numberAttribute });

  /** @component Maximum value. */
  readonly max = input(100, { transform: numberAttribute });

  /** @component Step increment. Zero means continuous. */
  readonly step = input(1, { transform: numberAttribute });

  /** @component Size preset controlling track height and thumb diameter. */
  readonly size = input<PixelSliderSize>('md');

  /** @component Visible field label. */
  readonly label = input('');

  /** @component Label layout relative to the field. */
  readonly labelPosition = input<PixelSliderLabelPosition>('top');

  /** @component Helper/hint text rendered below the slider. */
  readonly helperText = input('');

  /** @component Marks the control as required for validation. */
  readonly required = input(false, { transform: booleanAttribute });

  /** @component Disables interaction and applies disabled styling. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** @component Prevents edits while keeping the slider focusable. */
  readonly readonly = input(false, { transform: booleanAttribute });

  /** @component Show the current value label above/inside the active thumb. */
  readonly showValue = input(false, { transform: booleanAttribute });

  /** @component Always show value labels (not just on focus/hover). */
  readonly alwaysShowValue = input(false, { transform: booleanAttribute });

  /** @component Render discrete tick marks along the track and snap to steps. */
  readonly discrete = input(false, { transform: booleanAttribute });

  /** @component Custom formatter for value labels. Defaults to `String(value)`. */
  readonly displayWith = input<(value: number) => string>(defaultDisplayWith);

  /** @component Error messages per Angular validation key. */
  readonly validationMessages = input<PixelSliderValidationMessages>({});

  /** @component Show skeleton placeholder while loading. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emits the committed value on change (mirrors the `value` input for two-way binding). */
  readonly valueChange = output<PixelSliderValue>();
  /** Emits when dragging begins on a thumb. */
  readonly dragStart = output<PixelSliderValue>();
  /** Emits when dragging ends on a thumb. */
  readonly dragEnd = output<PixelSliderValue>();
  /** Emits true when the slider receives focus. */
  readonly focusChange = output<boolean>();

  // ── Effects ─────────────────────────────────────────────────────────────────

  /** Mirror an external `[value]` into internal state (controlled / non-form usage). */
  private readonly syncExternalValue = effect(() => {
    const next = this.value();
    untracked(() => {
      if (this.resolveFormControl()) return;
      this.applyValue(next);
    });
  });

  private readonly syncControlErrorVisibility = effect((onCleanup) => {
    const control = untracked(() => this.resolveFormControl());
    if (!control) {
      untracked(() => {
        this.controlShowsError.set(false);
        this.controlValidationErrors.set(null);
      });
      return;
    }
    const sync = (): void => {
      this.controlValidationErrors.set(control.errors);
      this.controlShowsError.set(Boolean(control.invalid && (control.touched || control.dirty)));
    };
    sync();
    const sub = merge(control.statusChanges, control.valueChanges, control.events).subscribe(sync);
    onCleanup(() => sub.unsubscribe());
  });

  private readonly syncValidators = effect(() => {
    this.required();
    this.min();
    this.max();
    untracked(() => this.onValidatorChange());
  });

  // ── Computed ─────────────────────────────────────────────────────────────────

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly showLabel = computed(() => !!this.label().trim() && this.labelPosition() !== 'hidden');
  protected readonly fieldId = computed(() => this.fallbackId);

  protected readonly hasError = computed(() => this.controlShowsError());
  protected readonly resolvedValidationMessage = computed(() => {
    if (!this.controlShowsError()) return '';
    const errors = this.controlValidationErrors();
    if (!errors) return '';
    const messages = this.validationMessages();
    for (const key of Object.keys(errors)) {
      const msg = messages[key]?.trim();
      if (msg) return msg;
    }
    return '';
  });

  protected readonly rangeStart = computed(() => this.internalStart());
  protected readonly rangeEnd = computed(() => this.internalEnd());
  protected readonly singleValue = computed(() => this.internalSingle());

  protected readonly startPercent = computed(() =>
    this.toPercent(this.internalStart()),
  );
  protected readonly endPercent = computed(() =>
    this.toPercent(this.mode() === 'range' ? this.internalEnd() : this.internalSingle()),
  );

  /** Fill bar left offset and width for both modes. */
  protected readonly fillStyle = computed(() => {
    if (this.mode() === 'range') {
      const start = this.startPercent();
      const end = this.endPercent();
      return { left: `${start}%`, width: `${end - start}%` };
    }
    return { left: '0%', width: `${this.endPercent()}%` };
  });

  /** Array of tick positions (%) for discrete mode. */
  protected readonly tickArray = computed((): readonly number[] => {
    if (!this.discrete()) return [];
    const step = this.step();
    if (step <= 0) return [];
    const min = this.min();
    const max = this.max();
    const ticks: number[] = [];
    for (let v = min; v <= max; v += step) {
      ticks.push(this.toPercent(v));
    }
    return ticks;
  });

  protected readonly skeletonHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '1.5rem';
      case 'sm': return '2rem';
      case 'lg': return '3rem';
      default:   return '2.5rem';
    }
  });

  // ── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(value: unknown): void {
    this.applyValue(value as PixelSliderValue);
  }

  registerOnChange(fn: (value: PixelSliderValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  // ── Validator ───────────────────────────────────────────────────────────────

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value as PixelSliderValue | null;
    if (this.required()) {
      const isEmpty = value === null || value === undefined;
      if (isEmpty) return { required: true };
    }
    if (value === null || value === undefined) return null;

    const min = this.min();
    const max = this.max();
    if (Array.isArray(value)) {
      if (value[0] < min || value[1] > max) return { range: true };
    } else {
      if (value < min) return { min: { min, actual: value } };
      if (value > max) return { max: { max, actual: value } };
    }
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  protected onSingleInput(event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const raw = Number((event.target as HTMLInputElement).value);
    const value = clamp(snapToStep(raw, this.min(), this.step()), this.min(), this.max());
    this.internalSingle.set(value);
    this.commitValue(value);
  }

  protected onStartInput(event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const raw = Number((event.target as HTMLInputElement).value);
    const value = clamp(snapToStep(raw, this.min(), this.step()), this.min(), this.internalEnd());
    this.internalStart.set(value);
    this.commitRangeValue();
  }

  protected onEndInput(event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const raw = Number((event.target as HTMLInputElement).value);
    const value = clamp(snapToStep(raw, this.min(), this.step()), this.internalStart(), this.max());
    this.internalEnd.set(value);
    this.commitRangeValue();
  }

  protected onFocus(thumb: 'start' | 'end'): void {
    this.isFocused.set(true);
    this.activeThumb.set(thumb);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.activeThumb.set(null);
    this.onTouched();
    this.focusChange.emit(false);
  }

  protected onDragStart(): void {
    this.dragStart.emit(this.currentValue());
  }

  protected onDragEnd(): void {
    this.dragEnd.emit(this.currentValue());
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  protected formatValue(value: number): string {
    return this.displayWith()(value);
  }

  protected toPercent(value: number): number {
    const min = this.min();
    const max = this.max();
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  }

  protected showValueLabel(thumb: 'start' | 'end'): boolean {
    if (this.alwaysShowValue() || this.discrete()) return true;
    if (!this.showValue()) return false;
    return this.activeThumb() === thumb || this.isFocused();
  }

  private currentValue(): PixelSliderValue {
    return this.mode() === 'range'
      ? [this.internalStart(), this.internalEnd()]
      : this.internalSingle();
  }

  private commitValue(value: number): void {
    this.onChange(value);
    this.valueChange.emit(value);
  }

  private commitRangeValue(): void {
    const v: [number, number] = [this.internalStart(), this.internalEnd()];
    this.onChange(v);
    this.valueChange.emit(v);
  }

  private applyValue(value: PixelSliderValue | null | undefined): void {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      this.internalStart.set(clamp(value[0] ?? this.min(), this.min(), this.max()));
      this.internalEnd.set(clamp(value[1] ?? this.max(), this.min(), this.max()));
    } else {
      this.internalSingle.set(clamp(Number(value), this.min(), this.max()));
    }
  }

  private resolveFormControl(): AbstractControl | null {
    return this.injector.get(NgControl, null, { optional: true, self: true })?.control ?? null;
  }
}
