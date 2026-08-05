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
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import PixelInputComponent from '../pixel-input/pixel-input';
import PixelCalendarComponent from '../pixel-calendar/pixel-calendar';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelButtonComponent from '../pixel-button/pixel-button';
import {
  defaultParseDate,
  normalizeRange,
  sameDay,
  startOfDay,
  toNativeDate,
} from '../shared/datetime/pixel-date-utils';
import {
  ConnectedOverlay,
  OVERLAY_PANEL_OFFSET,
  OVERLAY_VIEWPORT_MARGIN,
  type OverlayPlacement,
} from '../shared/overlay/connected-overlay';
import type {
  PixelCalendarDateClassFn,
  PixelCalendarDateFilterFn,
  PixelCalendarView,
} from '../pixel-calendar/pixel-calendar.types';
import { PixelDateRange } from './pixel-date-range';
import {
  PIXEL_DATE_RANGE_SELECTION_STRATEGY,
  type PixelDateRangeSelectionStrategy,
} from './pixel-date-range-selection-strategy';
import { PixelDefaultDateRangeSelectionStrategy } from './pixel-default-date-range-selection-strategy';

export type PixelDateRangePickerSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelDateRangePickerLabelPosition = 'top' | 'left' | 'floating' | 'hidden';
export type PixelDateRangePickerOpenDirection = 'auto' | 'top' | 'bottom';
export type PixelDateRangePickerScrollBehavior = 'close' | 'reposition' | 'block';
export type PixelDateRangePickerView = PixelCalendarView;
export type PixelDateRangeValue = Date | string | number | null;

export interface PixelDateRangePickerValidationMessages {
  required?: string;
  dateParse?: string;
  dateFilter?: string;
  min?: string;
  max?: string;
  rangeIncomplete?: string;
  rangeOrder?: string;
  [errorCode: string]: string | undefined;
}

export type PixelDateRangePickerDateFilterFn = PixelCalendarDateFilterFn;
export type PixelDateRangePickerDateClassFn = PixelCalendarDateClassFn;
export { PixelDateRange } from './pixel-date-range';
export type { PixelDateRangeSelectionStrategy } from './pixel-date-range-selection-strategy';
export {
  PIXEL_DATE_RANGE_SELECTION_STRATEGY,
  providePixelDateRangeSelectionStrategy,
} from './pixel-date-range-selection-strategy';
export { PixelDefaultDateRangeSelectionStrategy } from './pixel-default-date-range-selection-strategy';
export { PixelFiveDayRangeSelectionStrategy } from './pixel-five-day-range-selection-strategy';

/** Splits range text on en/em dashes, or a hyphen with spaces (avoids ISO `YYYY-MM-DD` hyphens). */
const RANGE_SEPARATOR = /\s*[–—]\s*|\s+-\s+/;

const VALIDATION_MESSAGE_PRIORITY = [
  'required',
  'dateParse',
  'dateFilter',
  'min',
  'max',
  'rangeIncomplete',
  'rangeOrder',
] as const;

let nextRangePickerId = 0;

@Component({
  selector: 'pixel-date-range-picker',
  imports: [PixelInputComponent, PixelCalendarComponent, PixelSkeletonComponent, PixelButtonComponent],
  templateUrl: './pixel-date-range-picker.html',
  styleUrl: './pixel-date-range-picker.scss',
  host: { class: 'pixel-date-range-picker-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PixelDefaultDateRangeSelectionStrategy,
    {
      provide: PIXEL_DATE_RANGE_SELECTION_STRATEGY,
      useExisting: PixelDefaultDateRangeSelectionStrategy,
    },
  ],
})
export default class PixelDateRangePickerComponent {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injectedSelectionStrategy = inject(PIXEL_DATE_RANGE_SELECTION_STRATEGY);
  protected readonly panelRef = viewChild<ElementRef<HTMLElement>>('panelRef');
  protected readonly inputRef = viewChild(PixelInputComponent);
  protected readonly calendarRef = viewChild(PixelCalendarComponent);
  private readonly overlay = new ConnectedOverlay();

  protected readonly fallbackId = `pixel-date-range-picker-${++nextRangePickerId}`;
  protected readonly panelId = `${this.fallbackId}-panel`;

  readonly label = input('');
  readonly formGroup = input.required<FormGroup>();
  readonly startControlName = input('start');
  readonly endControlName = input('end');
  readonly placeholder = input('Start date – End date');
  /** When true, replaces the field with a skeleton placeholder. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });
  readonly size = input<PixelDateRangePickerSize>('md');
  readonly labelPosition = input<PixelDateRangePickerLabelPosition>('top');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly inheritParentControlErrors = input(true, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input('');
  readonly validationMessages = input<PixelDateRangePickerValidationMessages>({});
  readonly errorText = input('');
  readonly parseErrorText = input('Enter a valid date range');
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly min = input<PixelDateRangeValue>(null);
  readonly max = input<PixelDateRangeValue>(null);
  readonly startAt = input<PixelDateRangeValue>(null);
  readonly dateFilter = input<PixelDateRangePickerDateFilterFn | null>(null);
  readonly dateClass = input<PixelDateRangePickerDateClassFn | null>(null);
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  readonly locale = input<string | undefined>(undefined);
  readonly startView = input<PixelDateRangePickerView>('day');
  /**
   * When true, the calendar fills leading/trailing cells with adjacent-month dates.
   * Defaults to false (current month only).
   */
  readonly showOutsideDays = input(false, { transform: booleanAttribute });
  readonly openDirection = input<PixelDateRangePickerOpenDirection>('auto');
  readonly scrollBehavior = input<PixelDateRangePickerScrollBehavior>('close');
  readonly lockScroll = input(false, { transform: booleanAttribute });
  readonly displayWith = input<(date: Date, locale?: string) => string>((date, locale) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date),
  );
  readonly parseValue = input<(text: string, locale?: string) => Date | null>(defaultParseDate);
  readonly ariaLabel = input('');
  /** Overrides the injected `PIXEL_DATE_RANGE_SELECTION_STRATEGY` for this picker instance. */
  readonly selectionStrategy = input<PixelDateRangeSelectionStrategy<Date> | null>(null);
  /**
   * When true, calendar edits a draft range; Apply commits and Cancel restores & closes.
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

  readonly openChange = output<boolean>();
  readonly rangeChange = output<{ start: Date | null; end: Date | null }>();

  protected readonly isOpen = signal(false);
  protected readonly isFocused = signal(false);
  protected readonly displayText = signal('');
  protected readonly parseError = signal(false);
  protected readonly filterError = signal(false);
  protected readonly rangeStart = signal<Date | null>(null);
  protected readonly rangeEnd = signal<Date | null>(null);
  protected readonly previewRangeStart = signal<Date | null>(null);
  protected readonly previewRangeEnd = signal<Date | null>(null);
  /** Draft range while the actions footer is shown. */
  private readonly draftStart = signal<Date | null>(null);
  private readonly draftEnd = signal<Date | null>(null);
  private readonly formDisabled = signal(false);
  private readonly controlRevision = signal(0);

  private readonly syncFromForm = effect(() => {
    const group = this.formGroup();
    const startName = this.startControlName();
    const endName = this.endControlName();
    const format = this.displayWith();
    const locale = this.locale();
    this.controlRevision();
    const start = toNativeDate(group.get(startName)?.value as PixelDateRangeValue);
    const end = toNativeDate(group.get(endName)?.value as PixelDateRangeValue);

    untracked(() => {
      this.rangeStart.set(start);
      this.rangeEnd.set(end);
      if (!this.isFocused()) {
        this.displayText.set(this.formatRangeDisplay(start, end, format, locale));
        if (start || end) {
          this.parseError.set(false);
          this.filterError.set(false);
        }
      }
    });
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.overlay.destroy());
    effect((onCleanup) => {
      const group = this.formGroup();
      const start = group.get(this.startControlName());
      const end = group.get(this.endControlName());
      const bump = () => untracked(() => this.controlRevision.update((n) => n + 1));
      const subs = [
        start?.valueChanges.subscribe(bump),
        end?.valueChanges.subscribe(bump),
        start?.events.subscribe(bump),
        end?.events.subscribe(bump),
      ].filter((sub): sub is NonNullable<typeof sub> => !!sub);
      onCleanup(() => subs.forEach((sub) => sub.unsubscribe()));
    });
  }

  protected readonly fieldId = computed(() => this.fallbackId);
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
    rangeIncomplete: 'Select both start and end dates.',
    rangeOrder: 'End date must be on or after start date.',
    ...this.validationMessages(),
  }));
  protected readonly formControlError = computed(() => {
    this.controlRevision();
    const startMsg = this.resolveControlError(this.startControl());
    if (startMsg) {
      return startMsg;
    }
    return this.resolveControlError(this.endControl());
  });
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
    return this.formControlError();
  });
  /** Calendar reads draft range when actions are shown; otherwise the form is the source of truth. */
  protected readonly calendarRangeStart = computed(() => {
    if (this.showActions() && this.isOpen()) {
      return this.draftStart();
    }
    this.controlRevision();
    return this.currentStart();
  });
  protected readonly calendarRangeEnd = computed(() => {
    if (this.showActions() && this.isOpen()) {
      return this.draftEnd();
    }
    this.controlRevision();
    return this.currentEnd();
  });
  protected readonly canApplyDraft = computed(
    () => !!(this.draftStart() && this.draftEnd()),
  );
  protected readonly effectivePanelEdge = computed((): 'top' | 'bottom' => {
    const direction = this.openDirection();
    if (direction === 'top' || direction === 'bottom') {
      return direction;
    }
    return this.overlay.position()?.edge ?? 'bottom';
  });

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
      this.applyRange(null, null);
      return;
    }

    const parts = raw.split(RANGE_SEPARATOR);
    if (parts.length === 1) {
      const startOnly = this.parseAndValidate(parts[0]);
      if (startOnly === 'invalid') {
        this.parseError.set(true);
        this.filterError.set(false);
        this.applyRange(null, this.currentEnd());
        return;
      }
      if (startOnly === 'filtered') {
        this.parseError.set(false);
        this.filterError.set(true);
        this.applyRange(null, this.currentEnd());
        return;
      }
      this.parseError.set(false);
      this.filterError.set(false);
      this.applyRange(startOnly, this.currentEnd());
      return;
    }

    const startParsed = this.parseAndValidate(parts[0]);
    const endParsed = this.parseAndValidate(parts[1]);
    if (startParsed === 'invalid' || endParsed === 'invalid') {
      this.parseError.set(true);
      this.filterError.set(false);
      return;
    }
    if (startParsed === 'filtered' || endParsed === 'filtered') {
      this.parseError.set(false);
      this.filterError.set(true);
      return;
    }

    this.parseError.set(false);
    this.filterError.set(false);
    const normalized =
      startParsed && endParsed ? normalizeRange(startParsed, endParsed) : { start: startParsed, end: endParsed };
    this.applyRange(normalized.start, normalized.end);
    this.displayText.set(
      this.formatRangeDisplay(normalized.start, normalized.end, this.displayWith(), this.locale()),
    );
  }

  protected onInputFocusChange(focused: boolean): void {
    this.isFocused.set(focused);
    if (focused) {
      return;
    }
    const start = this.currentStart();
    const end = this.currentEnd();
    if (start || end) {
      this.displayText.set(
        this.formatRangeDisplay(start, end, this.displayWith(), this.locale()),
      );
    } else if (!this.parseError()) {
      this.displayText.set('');
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
    if (this.isDisabled() || this.readonly() || this.isDateDisabled(date)) {
      return;
    }

    const next = this.resolveSelectionStrategy().selectionFinished(
      date,
      this.currentCalendarRange(),
      new Event('click'),
    );
    const start = next.start ? startOfDay(next.start) : null;
    const end = next.end ? startOfDay(next.end) : null;

    this.clearPreview();

    if (this.showActions()) {
      this.draftStart.set(start);
      this.draftEnd.set(end);
      this.displayText.set(
        this.formatRangeDisplay(start, end, this.displayWith(), this.locale()),
      );
      return;
    }

    this.applyRange(start, end);
    this.displayText.set(
      this.formatRangeDisplay(start, end, this.displayWith(), this.locale()),
    );

    if (start && end) {
      this.setOpenState(false);
      this.inputRef()?.focus();
    }
  }

  protected onDayHover(date: Date | null): void {
    const eventType = date == null ? 'mouseleave' : 'mouseenter';
    const preview = this.resolveSelectionStrategy().createPreview(
      date,
      this.currentCalendarRange(),
      new Event(eventType),
    );
    this.previewRangeStart.set(preview.start ? startOfDay(preview.start) : null);
    this.previewRangeEnd.set(preview.end ? startOfDay(preview.end) : null);
  }

  protected onCalendarEscape(): void {
    if (this.showActions()) {
      this.cancelPanel();
      return;
    }
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  /** Commit the draft range and close the panel. */
  protected confirmPanel(): void {
    const start = this.draftStart();
    const end = this.draftEnd();
    if (!start || !end) {
      return;
    }
    this.applyRange(start, end);
    this.displayText.set(
      this.formatRangeDisplay(start, end, this.displayWith(), this.locale()),
    );
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  /** Restore the last committed range and close without applying the draft. */
  protected cancelPanel(): void {
    const start = this.currentStart();
    const end = this.currentEnd();
    this.draftStart.set(start);
    this.draftEnd.set(end);
    this.displayText.set(
      this.formatRangeDisplay(start, end, this.displayWith(), this.locale()),
    );
    this.setOpenState(false);
    this.inputRef()?.focus();
  }

  protected onClear(_event: MouseEvent | KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }
    this.parseError.set(false);
    this.filterError.set(false);
    this.clearPreview();
    this.displayText.set('');
    this.applyRange(null, null);
    this.inputRef()?.focus();
  }

  private currentCalendarRange(): PixelDateRange<Date> {
    if (this.showActions() && this.isOpen()) {
      return new PixelDateRange(this.draftStart(), this.draftEnd());
    }
    return new PixelDateRange(this.currentStart(), this.currentEnd());
  }

  private refreshRangeFromForm(): void {
    const start = this.currentStart();
    const end = this.currentEnd();
    this.rangeStart.set(start);
    this.rangeEnd.set(end);
  }

  private resolveSelectionStrategy(): PixelDateRangeSelectionStrategy<Date> {
    return this.selectionStrategy() ?? this.injectedSelectionStrategy;
  }

  private clearPreview(): void {
    this.previewRangeStart.set(null);
    this.previewRangeEnd.set(null);
  }

  private parseAndValidate(text: string): Date | null | 'invalid' | 'filtered' {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = this.parseValue()(trimmed, this.locale());
    if (!parsed) {
      return 'invalid';
    }
    if (this.isFilteredOut(parsed)) {
      return 'filtered';
    }
    if (this.isDateDisabled(parsed)) {
      return 'invalid';
    }
    return parsed;
  }

  private formatRangeDisplay(
    start: Date | null,
    end: Date | null,
    format: (date: Date, locale?: string) => string,
    locale?: string,
  ): string {
    if (!start && !end) {
      return '';
    }
    const separator = ' – ';
    if (start && end) {
      return `${format(start, locale)}${separator}${format(end, locale)}`;
    }
    if (start) {
      return `${format(start, locale)}${separator}`;
    }
    return `${separator}${format(end!, locale)}`;
  }

  private applyRange(start: Date | null, end: Date | null): void {
    this.rangeStart.set(start);
    this.rangeEnd.set(end);
    this.patchControls(start, end);
    this.rangeChange.emit({ start, end });
  }

  private patchControls(start: Date | null, end: Date | null): void {
    const group = this.formGroup();
    const startName = this.startControlName();
    const endName = this.endControlName();
    const startControl = group.get(startName);
    const endControl = group.get(endName);
    const startChanged =
      !!startControl &&
      !this.datesEqual(toNativeDate(startControl.value as PixelDateRangeValue), start);
    const endChanged =
      !!endControl && !this.datesEqual(toNativeDate(endControl.value as PixelDateRangeValue), end);

    if (!startChanged && !endChanged) {
      return;
    }

    group.patchValue(
      {
        [startName]: start,
        [endName]: end,
      },
      { emitEvent: true },
    );

    startControl?.markAsDirty();
    startControl?.markAsTouched();
    endControl?.markAsDirty();
    endControl?.markAsTouched();
    this.controlRevision.update((revision) => revision + 1);
  }

  private startControl(): AbstractControl | null {
    return this.formGroup().get(this.startControlName());
  }

  private endControl(): AbstractControl | null {
    return this.formGroup().get(this.endControlName());
  }

  private resolveControlError(control: AbstractControl | null): string {
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return '';
    }
    const errors = control.errors;
    if (!errors) {
      return '';
    }
    return this.resolveValidationMessage(errors);
  }

  private resolveValidationMessage(errors: ValidationErrors): string {
    const messages: PixelDateRangePickerValidationMessages = this.inputValidationMessages();
    for (const key of VALIDATION_MESSAGE_PRIORITY) {
      if (errors[key] != null) {
        const tpl = messages[key]?.trim();
        if (tpl) {
          return tpl;
        }
      }
    }
    for (const key of Object.keys(errors)) {
      const tpl = messages[key]?.trim();
      if (tpl) {
        return tpl;
      }
    }
    return '';
  }

  private datesEqual(a: Date | null, b: Date | null): boolean {
    if (a === null || b === null) {
      return a === b;
    }
    return sameDay(a, b);
  }

  private currentStart(): Date | null {
    return toNativeDate(this.startControl()?.value as PixelDateRangeValue);
  }

  private currentEnd(): Date | null {
    return toNativeDate(this.endControl()?.value as PixelDateRangeValue);
  }

  private calendarStartDate(): Date {
    const start = this.currentStart();
    const end = this.currentEnd();
    if (start) {
      return start;
    }
    if (end) {
      return end;
    }
    return toNativeDate(this.startAt()) ?? startOfDay(new Date());
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

  private setOpenState(open: boolean): void {
    if (open === this.isOpen()) {
      return;
    }
    if (open) {
      this.refreshRangeFromForm();
      this.draftStart.set(this.currentStart());
      this.draftEnd.set(this.currentEnd());
      this.isOpen.set(true);
      this.clearPreview();
      this.scheduleAttachOverlay();
    } else {
      this.overlay.detach();
      this.isOpen.set(false);
      this.clearPreview();
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
