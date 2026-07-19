import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import {
  MS_PER_DAY,
  isBetweenInclusive,
  normalizeDateClasses,
  normalizeRange,
  sameDay,
  startOfDay,
  toNativeDate,
} from '../shared/datetime/pixel-date-utils';
import type {
  PixelCalendarDateClassFn,
  PixelCalendarDateFilterFn,
  PixelCalendarDay,
  PixelCalendarMode,
  PixelCalendarMonth,
  PixelCalendarView,
  PixelCalendarYear,
} from './pixel-calendar.types';

/** Years shown per page in the multi-year view (4 columns × 6 rows). */
const YEARS_PER_PAGE = 24;
/** Columns in the month and year grids — keyboard Up/Down moves by this much. */
const MONTH_YEAR_COLS = 4;

let nextCalendarId = 0;

@Component({
  selector: 'pixel-calendar',
  imports: [PixelButtonComponent],
  templateUrl: './pixel-calendar.html',
  styleUrl: './pixel-calendar.scss',
  host: { class: 'pixel-calendar-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelCalendarComponent {
  private readonly injector = inject(Injector);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  protected readonly fallbackId = `pixel-calendar-${++nextCalendarId}`;
  protected readonly gridId = `${this.fallbackId}-grid`;

  /** Single-date or range selection styling. */
  readonly mode = input<PixelCalendarMode>('single');
  /** Selected date in single mode. */
  readonly selected = input<Date | null>(null);
  /** Range endpoints in range mode. */
  readonly rangeStart = input<Date | null>(null);
  readonly rangeEnd = input<Date | null>(null);
  /** Hover preview end while choosing the second date. */
  readonly previewEnd = input<Date | null>(null);
  /** Hover preview start (used by custom selection strategies). Falls back to `rangeStart`. */
  readonly previewRangeStart = input<Date | null>(null);
  readonly min = input<Date | string | number | null>(null);
  readonly max = input<Date | string | number | null>(null);
  readonly dateFilter = input<PixelCalendarDateFilterFn | null>(null);
  readonly dateClass = input<PixelCalendarDateClassFn | null>(null);
  readonly firstDayOfWeek = input(0, { transform: numberAttribute });
  readonly locale = input<string | undefined>(undefined);
  readonly startView = input<PixelCalendarView>('day');
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * When true, days from the adjacent months fill the leading/trailing grid cells (muted).
   * When false (default), those cells are empty placeholders so only the current month’s
   * dates are shown — used by datepicker / date-range-picker.
   */
  readonly showOutsideDays = input(false, { transform: booleanAttribute });

  readonly daySelected = output<Date>();
  readonly dayHover = output<Date | null>();
  readonly escapePressed = output<void>();

  protected readonly viewMonth = signal(startOfDay(new Date()));
  protected readonly calendarView = signal<PixelCalendarView>('day');
  protected readonly activeDate = signal<Date | null>(null);
  protected readonly activeMonth = signal(0);
  protected readonly activeYear = signal(new Date().getFullYear());

  protected readonly minDate = computed(() => toNativeDate(this.min()));
  protected readonly maxDate = computed(() => toNativeDate(this.max()));

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
      this.viewMonth(),
    ),
  );

  protected readonly yearPageStart = computed(() => {
    const year = this.viewMonth().getFullYear();
    return year - (((year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
  });

  protected readonly periodLabel = computed(() => {
    switch (this.calendarView()) {
      case 'month':
        return String(this.viewMonth().getFullYear());
      case 'year': {
        const start = this.yearPageStart();
        return `${start} – ${start + YEARS_PER_PAGE - 1}`;
      }
      default:
        return this.monthLabel();
    }
  });

  protected readonly prevAriaLabel = computed(() => {
    switch (this.calendarView()) {
      case 'month':
        return 'Previous year';
      case 'year':
        return 'Previous 24 years';
      default:
        return 'Previous month';
    }
  });

  protected readonly nextAriaLabel = computed(() => {
    switch (this.calendarView()) {
      case 'month':
        return 'Next year';
      case 'year':
        return 'Next 24 years';
      default:
        return 'Next month';
    }
  });

  protected readonly months = computed<PixelCalendarMonth[]>(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { month: 'short' });
    const year = this.viewMonth().getFullYear();
    const today = new Date();
    const selected = this.selected();
    const rangeStart = this.rangeStart();
    const rangeEnd = this.rangeEnd();
    return Array.from({ length: 12 }, (_unused, month) => ({
      month,
      label: fmt.format(new Date(year, month, 1)),
      current: today.getFullYear() === year && today.getMonth() === month,
      selected:
        (!!selected && selected.getFullYear() === year && selected.getMonth() === month) ||
        (!!rangeStart &&
          rangeStart.getFullYear() === year &&
          rangeStart.getMonth() === month) ||
        (!!rangeEnd && rangeEnd.getFullYear() === year && rangeEnd.getMonth() === month),
      disabled: this.isMonthDisabled(year, month),
    }));
  });

  protected readonly years = computed<PixelCalendarYear[]>(() => {
    const start = this.yearPageStart();
    const today = new Date().getFullYear();
    const selected = this.selected();
    const rangeStart = this.rangeStart();
    const rangeEnd = this.rangeEnd();
    return Array.from({ length: YEARS_PER_PAGE }, (_unused, index) => {
      const year = start + index;
      return {
        year,
        current: year === today,
        selected:
          (!!selected && selected.getFullYear() === year) ||
          (!!rangeStart && rangeStart.getFullYear() === year) ||
          (!!rangeEnd && rangeEnd.getFullYear() === year),
        disabled: this.isYearDisabled(year),
      };
    });
  });

  protected readonly weekdayLabels = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const first = this.firstDayOfWeek();
    return Array.from({ length: 7 }, (_unused, index) => {
      const dayIndex = (first + index) % 7;
      return fmt.format(new Date(2023, 0, 1 + dayIndex));
    });
  });

  protected readonly weeks = computed<PixelCalendarDay[][]>(() => {
    const view = this.viewMonth();
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = this.firstDayOfWeek();
    const today = startOfDay(new Date());
    const selected = this.selected();
    const rangeStart = this.rangeStart();
    const rangeEnd = this.rangeEnd();
    const previewEnd = this.previewEnd();
    const previewRangeStart = this.previewRangeStart();
    const normalized =
      rangeStart && rangeEnd ? normalizeRange(rangeStart, rangeEnd) : null;
    let previewNormalized: { start: Date; end: Date } | null = null;
    if (previewRangeStart != null && previewEnd != null) {
      previewNormalized = normalizeRange(previewRangeStart, previewEnd);
    } else if (!rangeEnd && rangeStart != null && previewEnd != null) {
      previewNormalized = normalizeRange(rangeStart, previewEnd);
    }

    const firstOfMonth = new Date(year, month, 1);
    const lead = (firstOfMonth.getDay() - first + 7) % 7;
    const gridStart = new Date(year, month, 1 - lead);

    const weeks: PixelCalendarDay[][] = [];
    const cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const row: PixelCalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = startOfDay(cursor);
        const isRangeStart = !!rangeStart && sameDay(date, rangeStart);
        const isRangeEnd = !!rangeEnd && sameDay(date, rangeEnd);
        const inRange =
          !!normalized &&
          !!rangeEnd &&
          isBetweenInclusive(date, normalized.start, normalized.end);
        const previewInRange =
          !!previewNormalized &&
          isBetweenInclusive(date, previewNormalized.start, previewNormalized.end);
        const isPreviewStart =
          !!previewNormalized && sameDay(date, previewNormalized.start);
        const isPreviewEnd = !!previewNormalized && sameDay(date, previewNormalized.end);

        row.push({
          date,
          day: date.getDate(),
          inMonth: date.getMonth() === month,
          today: sameDay(date, today),
          selected: this.mode() === 'single' && sameDay(date, selected),
          rangeStart: isRangeStart,
          rangeEnd: isRangeEnd,
          inRange,
          previewInRange,
          previewEnd: isPreviewEnd,
          previewStart: isPreviewStart,
          disabled: this.isDateDisabled(date),
          cssClasses: this.resolveDateClasses(date),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(row);
    }
    return weeks;
  });

  /** Seed view + keyboard focus when the panel opens. */
  initializeView(base: Date, view: PixelCalendarView = this.startView()): void {
    const normalized = startOfDay(base);
    this.activeDate.set(normalized);
    this.viewMonth.set(new Date(normalized.getFullYear(), normalized.getMonth(), 1));
    this.calendarView.set(view);
    if (view === 'month') {
      this.activeMonth.set(normalized.getMonth());
    } else if (view === 'year') {
      this.activeYear.set(normalized.getFullYear());
    }
    this.focusActiveCellSoon();
  }

  focusActiveCell(): void {
    const root = this.hostRef.nativeElement;
    const cell = root.querySelector('[role="gridcell"][tabindex="0"]') as HTMLElement | null;
    cell?.focus();
  }

  protected prevPeriod(): void {
    this.shiftPeriod(-1);
  }

  protected nextPeriod(): void {
    this.shiftPeriod(1);
  }

  protected togglePeriodView(): void {
    if (this.calendarView() === 'day') {
      this.enterView('year');
    } else {
      this.enterView('day');
    }
  }

  protected selectYear(item: PixelCalendarYear): void {
    if (item.disabled) {
      return;
    }
    const view = this.viewMonth();
    this.viewMonth.set(new Date(item.year, view.getMonth(), 1));
    this.enterView('month');
  }

  protected selectMonth(item: PixelCalendarMonth): void {
    if (item.disabled) {
      return;
    }
    const year = this.viewMonth().getFullYear();
    this.viewMonth.set(new Date(year, item.month, 1));
    const base = this.activeDate() ?? this.selected() ?? startOfDay(new Date());
    const lastDay = new Date(year, item.month + 1, 0).getDate();
    this.activeDate.set(new Date(year, item.month, Math.min(base.getDate(), lastDay)));
    this.enterView('day');
  }

  protected onDayClick(day: PixelCalendarDay): void {
    if (day.disabled || this.disabled() || this.isOutsideHidden(day)) {
      return;
    }
    this.daySelected.emit(day.date);
  }

  protected onDayHover(day: PixelCalendarDay): void {
    if (this.mode() !== 'range' || day.disabled || this.disabled() || this.isOutsideHidden(day)) {
      return;
    }
    this.dayHover.emit(day.date);
  }

  protected onDayHoverLeave(): void {
    if (this.mode() === 'range') {
      this.dayHover.emit(null);
    }
  }

  protected onGridKeydown(event: KeyboardEvent): void {
    const current =
      this.activeDate() ?? this.selected() ?? this.rangeStart() ?? startOfDay(new Date());
    let next: Date | null = null;
    switch (event.key) {
      case 'ArrowLeft':
        next = new Date(current.getTime() - MS_PER_DAY);
        break;
      case 'ArrowRight':
        next = new Date(current.getTime() + MS_PER_DAY);
        break;
      case 'ArrowUp':
        next = new Date(current.getTime() - 7 * MS_PER_DAY);
        break;
      case 'ArrowDown':
        next = new Date(current.getTime() + 7 * MS_PER_DAY);
        break;
      case 'Home':
        next = new Date(current.getFullYear(), current.getMonth(), 1);
        break;
      case 'End':
        next = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        break;
      case 'PageUp':
        next = new Date(current.getFullYear(), current.getMonth() - 1, current.getDate());
        break;
      case 'PageDown':
        next = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const active = this.activeDate();
        if (!active || this.isDateDisabled(active)) {
          return;
        }
        // Don't commit adjacent-month dates when outside days are hidden placeholders.
        if (
          !this.showOutsideDays() &&
          (active.getMonth() !== this.viewMonth().getMonth() ||
            active.getFullYear() !== this.viewMonth().getFullYear())
        ) {
          return;
        }
        this.daySelected.emit(active);
        return;
      }
      case 'Escape':
        event.preventDefault();
        this.escapePressed.emit();
        return;
      default:
        return;
    }

    if (next) {
      event.preventDefault();
      const normalized = startOfDay(next);
      this.activeDate.set(normalized);
      this.viewMonth.set(new Date(normalized.getFullYear(), normalized.getMonth(), 1));
      this.focusActiveCellSoon();
    }
  }

  protected onMonthsKeydown(event: KeyboardEvent): void {
    let delta = 0;
    switch (event.key) {
      case 'ArrowLeft':
        delta = -1;
        break;
      case 'ArrowRight':
        delta = 1;
        break;
      case 'ArrowUp':
        delta = -MONTH_YEAR_COLS;
        break;
      case 'ArrowDown':
        delta = MONTH_YEAR_COLS;
        break;
      case 'PageUp':
        delta = -12;
        break;
      case 'PageDown':
        delta = 12;
        break;
      case 'Home':
        event.preventDefault();
        this.activeMonth.set(0);
        this.focusActiveCellSoon();
        return;
      case 'End':
        event.preventDefault();
        this.activeMonth.set(11);
        this.focusActiveCellSoon();
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const month = this.months()[this.activeMonth()];
        if (month) {
          this.selectMonth(month);
        }
        return;
      }
      case 'Escape':
        event.preventDefault();
        this.escapePressed.emit();
        return;
      default:
        return;
    }

    event.preventDefault();
    const view = this.viewMonth();
    const next = new Date(view.getFullYear(), this.activeMonth() + delta, 1);
    this.viewMonth.set(new Date(next.getFullYear(), next.getMonth(), 1));
    this.activeMonth.set(next.getMonth());
    this.focusActiveCellSoon();
  }

  protected onYearsKeydown(event: KeyboardEvent): void {
    let delta = 0;
    switch (event.key) {
      case 'ArrowLeft':
        delta = -1;
        break;
      case 'ArrowRight':
        delta = 1;
        break;
      case 'ArrowUp':
        delta = -MONTH_YEAR_COLS;
        break;
      case 'ArrowDown':
        delta = MONTH_YEAR_COLS;
        break;
      case 'PageUp':
        delta = -YEARS_PER_PAGE;
        break;
      case 'PageDown':
        delta = YEARS_PER_PAGE;
        break;
      case 'Home':
        event.preventDefault();
        this.setActiveYear(this.yearPageStart());
        return;
      case 'End':
        event.preventDefault();
        this.setActiveYear(this.yearPageStart() + YEARS_PER_PAGE - 1);
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const item = this.years().find((y) => y.year === this.activeYear());
        if (item) {
          this.selectYear(item);
        }
        return;
      }
      case 'Escape':
        event.preventDefault();
        this.escapePressed.emit();
        return;
      default:
        return;
    }

    event.preventDefault();
    this.setActiveYear(this.activeYear() + delta);
  }

  protected monthTabIndex(item: PixelCalendarMonth): number {
    return item.month === this.activeMonth() ? 0 : -1;
  }

  protected yearTabIndex(item: PixelCalendarYear): number {
    return item.year === this.activeYear() ? 0 : -1;
  }

  protected monthAriaLabel(item: PixelCalendarMonth): string {
    return new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
      new Date(this.viewMonth().getFullYear(), item.month, 1),
    );
  }

  protected cellTabIndex(day: PixelCalendarDay): number {
    if (this.isOutsideHidden(day)) {
      return -1;
    }
    const active = this.activeDate() ?? this.selected() ?? this.rangeStart();
    if (active) {
      return sameDay(day.date, active) ? 0 : -1;
    }
    return day.today && day.inMonth ? 0 : -1;
  }

  /** Outside-month cell that should not show a date or accept interaction. */
  protected isOutsideHidden(day: PixelCalendarDay): boolean {
    return !day.inMonth && !this.showOutsideDays();
  }

  protected dayClassMap(day: PixelCalendarDay): Record<string, boolean> {
    const hidden = this.isOutsideHidden(day);
    const map: Record<string, boolean> = {
      'pixel-calendar__day--outside': !day.inMonth,
      'pixel-calendar__day--placeholder': hidden,
      'pixel-calendar__day--today': !hidden && day.today,
      'pixel-calendar__day--selected': !hidden && day.selected,
      'pixel-calendar__day--range-start': !hidden && day.rangeStart,
      'pixel-calendar__day--range-end': !hidden && day.rangeEnd,
      'pixel-calendar__day--in-range': !hidden && day.inRange,
      'pixel-calendar__day--preview-range': !hidden && day.previewInRange,
      'pixel-calendar__day--preview-end': !hidden && day.previewEnd,
      'pixel-calendar__day--preview-start': !hidden && day.previewStart,
    };
    if (!hidden) {
      for (const cls of day.cssClasses) {
        map[cls] = true;
      }
    }
    return map;
  }

  protected dayAriaLabel(day: PixelCalendarDay): string {
    return new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full' }).format(day.date);
  }

  private setActiveYear(year: number): void {
    this.activeYear.set(year);
    const view = this.viewMonth();
    if (view.getFullYear() !== year) {
      this.viewMonth.set(new Date(year, view.getMonth(), 1));
    }
    this.focusActiveCellSoon();
  }

  private shiftPeriod(delta: number): void {
    const view = this.viewMonth();
    switch (this.calendarView()) {
      case 'month':
        this.viewMonth.set(new Date(view.getFullYear() + delta, view.getMonth(), 1));
        break;
      case 'year':
        this.viewMonth.set(
          new Date(view.getFullYear() + delta * YEARS_PER_PAGE, view.getMonth(), 1),
        );
        break;
      default:
        this.viewMonth.set(new Date(view.getFullYear(), view.getMonth() + delta, 1));
    }
  }

  private enterView(view: PixelCalendarView): void {
    this.calendarView.set(view);
    if (view === 'month') {
      this.activeMonth.set(this.viewMonth().getMonth());
    } else if (view === 'year') {
      this.activeYear.set(this.viewMonth().getFullYear());
    }
    this.focusActiveCellSoon();
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

  private resolveDateClasses(date: Date): readonly string[] {
    const fn = this.dateClass();
    return fn ? normalizeDateClasses(fn(date)) : [];
  }

  private isMonthDisabled(year: number, month: number): boolean {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      if (!this.isDateDisabled(new Date(year, month, day))) {
        return false;
      }
    }
    return true;
  }

  private isYearDisabled(year: number): boolean {
    for (let month = 0; month < 12; month++) {
      if (!this.isMonthDisabled(year, month)) {
        return false;
      }
    }
    return true;
  }

  private focusActiveCellSoon(): void {
    afterNextRender(() => this.focusActiveCell(), { injector: this.injector });
  }
}
