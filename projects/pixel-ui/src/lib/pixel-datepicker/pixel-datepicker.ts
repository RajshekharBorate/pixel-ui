import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
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
  ValidationErrors,
  Validator,
} from '@angular/forms';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelCalendarComponent from '../pixel-calendar/pixel-calendar';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelButtonComponent from '../pixel-button/pixel-button';
import {
  defaultParseDate,
  sameDay,
  startOfDay,
  toNativeDate,
} from '../shared/datetime/pixel-date-utils';
import { ConnectedOverlay, OVERLAY_PANEL_OFFSET, OVERLAY_VIEWPORT_MARGIN, type OverlayPlacement } from '../shared/overlay/connected-overlay';
import type { PixelCalendarView } from '../pixel-calendar/pixel-calendar.types';

export type PixelDatepickerSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelDatepickerLabelPosition = 'top' | 'left' | 'floating' | 'hidden';
export type PixelDatepickerOpenDirection = 'auto' | 'top' | 'bottom';
export type PixelDatepickerScrollBehavior = 'close' | 'reposition' | 'block';
export type PixelDatepickerView = PixelCalendarView;
export type PixelDatepickerValue = Date | string | number | null;

export interface PixelDatepickerValidationMessages {
  required?: string;
  dateParse?: string;
  dateFilter?: string;
  min?: string;
  max?: string;
  [errorCode: string]: string | undefined;
}

export type PixelDatepickerDateFilterFn = (date: Date) => boolean;

export type PixelDatepickerDateClassFn = (
  date: Date,
) => string | readonly string[] | null | undefined;

let nextDatepickerId = 0;

@Component({
  selector: 'pixel-datepicker',
  imports: [PixelInputComponent, PixelCalendarComponent, PixelSkeletonComponent, PixelButtonComponent],
  templateUrl: './pixel-datepicker.html',
  styleUrl: './pixel-datepicker.scss',
  host: { class: 'pixel-datepicker-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelDatepickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelDatepickerComponent),
      multi: true,
    },
  ],
})
export default class PixelDatepickerComponent implements ControlValueAccessor, Validator {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly panelRef = viewChild<ElementRef<HTMLElement>>('panelRef');
  protected readonly inputRef = viewChild(PixelInputComponent);
  protected readonly calendarRef = viewChild(PixelCalendarComponent);
  private readonly overlay = new ConnectedOverlay();

  protected readonly fallbackId = `pixel-datepicker-${++nextDatepickerId}`;
  protected readonly panelId = `${this.fallbackId}-panel`;

  readonly id = input('');
  readonly label = input('');
  readonly value = input<PixelDatepickerValue>(null);
  readonly placeholder = input('Select a date');
  readonly size = input<PixelDatepickerSize>('md');
  readonly labelPosition = input<PixelDatepickerLabelPosition>('top');
  /** When true, replaces the field with a skeleton placeholder. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly inheritParentControlErrors = input(true, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input('');
  readonly validationMessages = input<PixelDatepickerValidationMessages>({});
  readonly errorText = input('');
  readonly parseErrorText = input('Enter a valid date');
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly min = input<PixelDatepickerValue>(null);
  readonly max = input<PixelDatepickerValue>(null);
  readonly startAt = input<PixelDatepickerValue>(null);
  readonly dateFilter = input<PixelDatepickerDateFilterFn | null>(null);
  readonly dateClass = input<PixelDatepickerDateClassFn | null>(null);
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  readonly locale = input<string | undefined>(undefined);
  readonly startView = input<PixelDatepickerView>('day');
  /**
   * When true, the calendar fills leading/trailing cells with adjacent-month dates.
   * Defaults to false (current month only).
   */
  readonly showOutsideDays = input(false, { transform: booleanAttribute });
  readonly openDirection = input<PixelDatepickerOpenDirection>('auto');
  readonly scrollBehavior = input<PixelDatepickerScrollBehavior>('close');
  readonly lockScroll = input(false, { transform: booleanAttribute });
  readonly displayWith = input<(date: Date, locale?: string) => string>((date, locale) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date),
  );
  readonly parseValue = input<(text: string, locale?: string) => Date | null>(defaultParseDate);
  readonly ariaLabel = input('');
  /**
   * When true, calendar edits a draft; Apply commits and Cancel restores & closes.
   * Default keeps immediate commit-on-select (current behavior).
   * @type {boolean}
   * @default false
   */
  readonly showActions = input(false, { transform: booleanAttribute });
  /**
   * Primary footer label when `showActions` is true.
   * @type {string}
   * @default 'Apply'
   */
  readonly applyLabel = input('Apply');
  /**
   * Secondary footer label when `showActions` is true.
   * @type {string}
   * @default 'Cancel'
   */
  readonly cancelLabel = input('Cancel');

  readonly valueChange = output<Date | null>();
  readonly openChange = output<boolean>();

  protected readonly isOpen = signal(false);
  protected readonly isFocused = signal(false);
  protected readonly displayText = signal('');
  protected readonly parseError = signal(false);
  protected readonly filterError = signal(false);
  private readonly internalValue = signal<Date | null>(null);
  /** Draft selection while the actions footer is shown; ignored when `showActions` is false. */
  private readonly draftValue = signal<Date | null>(null);
  private readonly formDisabled = signal(false);
  private onChange: (value: Date | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  private readonly syncExternalValue = effect(() => {
    const next = toNativeDate(this.value());
    untracked(() => {
      this.internalValue.set(next);
    });
  });

  private readonly syncDisplayText = effect(() => {
    const date = this.internalValue();
    const format = this.displayWith();
    const locale = this.locale();
    untracked(() => {
      if (this.isFocused()) {
        return;
      }
      this.displayText.set(date ? format(date, locale) : '');
      this.parseError.set(false);
    });
  });

  private readonly syncValidators = effect(() => {
    this.required();
    this.min();
    this.max();
    this.dateFilter();
    this.parseError();
    this.filterError();
    untracked(() => this.onValidatorChange());
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.overlay.destroy());
  }

  protected readonly fieldId = computed(() => this.id().trim() || this.fallbackId);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

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
  protected readonly minDate = computed(() => toNativeDate(this.min()));
  protected readonly maxDate = computed(() => toNativeDate(this.max()));
  protected readonly selectedDate = computed(() =>
    this.showActions() && this.isOpen() ? this.draftValue() : this.internalValue(),
  );
  protected readonly showClear = computed(
    () =>
      this.clearable() &&
      this.displayText().length > 0 &&
      !this.isDisabled() &&
      !this.readonly(),
  );
  protected readonly inputValidationMessages = computed(() => ({
    required: 'This field is required.',
    dateParse: this.parseErrorText(),
    dateFilter: 'This date is not available.',
    min: 'Date is too early.',
    max: 'Date is too late.',
    ...this.validationMessages(),
  }));
  protected readonly inputErrorOverride = computed(() => {
    const explicit = this.errorText().trim();
    if (explicit) {
      return explicit;
    }
    if (this.parseError()) {
      return this.parseErrorText();
    }
    if (this.filterError()) {
      return this.inputValidationMessages().dateFilter ?? 'This date is not available.';
    }
    return '';
  });

  protected readonly effectivePanelEdge = computed((): 'top' | 'bottom' => {
    const direction = this.openDirection();
    if (direction === 'top' || direction === 'bottom') {
      return direction;
    }
    return this.overlay.position()?.edge ?? 'bottom';
  });

  writeValue(value: PixelDatepickerValue): void {
    const next = toNativeDate(value);
    this.internalValue.set(next);
    this.parseError.set(false);
    this.filterError.set(false);
    this.displayText.set(next ? this.displayWith()(next, this.locale()) : '');
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.parseError()) {
      return { dateParse: true };
    }
    if (this.filterError()) {
      return { dateFilter: true };
    }
    const value = toNativeDate(control.value as PixelDatepickerValue);
    if (this.required() && !value) {
      return { required: true };
    }
    if (!value) {
      return null;
    }
    if (this.isFilteredOut(value)) {
      return { dateFilter: true };
    }
    const min = this.minDate();
    const max = this.maxDate();
    if (min && value.getTime() < min.getTime()) {
      return { min: { min, actual: value } };
    }
    if (max && value.getTime() > max.getTime()) {
      return { max: { max, actual: value } };
    }
    return null;
  }

  protected toggle(): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    this.setOpenState(!this.isOpen());
  }

  protected onInputChange(raw: string): void {
    if (this.readonly() || this.isDisabled()) {
      return;
    }
    this.displayText.set(raw);

    if (raw.trim() === '') {
      this.parseError.set(false);
      this.filterError.set(false);
      this.commit(null);
      return;
    }

    const parsed = this.parseValue()(raw, this.locale());
    if (!parsed) {
      this.parseError.set(true);
      this.filterError.set(false);
      this.commit(null);
      return;
    }
    if (this.isFilteredOut(parsed)) {
      this.parseError.set(false);
      this.filterError.set(true);
      this.commit(null);
      return;
    }
    if (this.isDateDisabled(parsed)) {
      this.parseError.set(true);
      this.filterError.set(false);
      this.commit(null);
      return;
    }

    this.parseError.set(false);
    this.filterError.set(false);
    this.commit(parsed);
  }

  protected onInputFocusChange(focused: boolean): void {
    this.isFocused.set(focused);
    if (focused) {
      return;
    }
    const date = this.internalValue();
    if (date) {
      this.displayText.set(this.displayWith()(date, this.locale()));
    } else if (!this.parseError()) {
      this.displayText.set('');
    }
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setOpenState(true);
      return;
    }
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      if (this.showActions()) {
        this.cancelPanel();
      } else {
        this.setOpenState(false);
      }
    }
  }

  protected onCalendarDaySelected(date: Date): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    if (this.showActions()) {
      this.draftValue.set(date);
      return;
    }
    this.commitFromCalendar(date);
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  protected onCalendarEscape(): void {
    if (this.showActions()) {
      this.cancelPanel();
      return;
    }
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  /** Commit the draft selection and close the panel. */
  protected confirmPanel(): void {
    const draft = this.draftValue();
    if (draft) {
      this.commitFromCalendar(draft);
    }
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  /** Restore the last committed value and close without applying the draft. */
  protected cancelPanel(): void {
    this.draftValue.set(this.internalValue());
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  protected onClear(_event: MouseEvent | KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    this.parseError.set(false);
    this.filterError.set(false);
    this.displayText.set('');
    this.commit(null);
    this.inputRef()?.focus();
  }

  private isDateDisabled(date: Date): boolean {
    return this.isOutOfMinMax(date) || this.isFilteredOut(date);
  }

  private isOutOfMinMax(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && date.getTime() < min.getTime()) {
      return true;
    }
    if (max && date.getTime() > max.getTime()) {
      return true;
    }
    return false;
  }

  private isFilteredOut(date: Date): boolean {
    const filter = this.dateFilter();
    return filter ? !filter(date) : false;
  }

  private calendarStartDate(): Date {
    const selected = this.internalValue();
    if (selected) {
      return selected;
    }
    return toNativeDate(this.startAt()) ?? startOfDay(new Date());
  }

  private commit(date: Date | null): void {
    if (sameDay(date, this.internalValue()) || (date === null && this.internalValue() === null)) {
      return;
    }
    this.internalValue.set(date);
    this.onChange(date);
    this.valueChange.emit(date);
    this.onTouched();
  }

  private commitFromCalendar(date: Date): void {
    this.commit(date);
    this.parseError.set(false);
    this.filterError.set(false);
    this.displayText.set(this.displayWith()(date, this.locale()));
  }

  private setOpenState(open: boolean): void {
    if (open === this.isOpen()) {
      return;
    }
    if (open) {
      this.draftValue.set(this.internalValue());
      this.isOpen.set(true);
      this.scheduleAttachOverlay();
    } else {
      this.overlay.detach();
      this.isOpen.set(false);
      this.onTouched();
    }
    this.openChange.emit(open);
  }

  private placements(): OverlayPlacement[] {
    switch (this.openDirection()) {
      case 'top':
        return ['top-start', 'bottom-start'];
      case 'bottom':
        return ['bottom-start', 'top-start'];
      default:
        return ['bottom-start', 'top-start'];
    }
  }

  private scheduleAttachOverlay(): void {
    afterNextRender(
      () => {
        if (!this.isOpen()) {
          return;
        }
        const origin = this.inputRef()?.overlayOrigin();
        const panel = this.panelRef()?.nativeElement;
        if (origin && panel) {
          this.overlay.attach(origin, panel, {
            preferredPlacements: this.placements(),
            scrollStrategy: this.lockScroll() ? 'block' : this.scrollBehavior(),
            offset: OVERLAY_PANEL_OFFSET,
            viewportMargin: OVERLAY_VIEWPORT_MARGIN,
            hasBackdrop: true,
            onOutsidePointer: () =>
              this.showActions() ? this.cancelPanel() : this.setOpenState(false),
            onScrollClose: () =>
              this.showActions() ? this.cancelPanel() : this.setOpenState(false),
          });
        }
        this.calendarRef()?.initializeView(this.calendarStartDate(), this.startView());
      },
      { injector: this.injector },
    );
  }
}
