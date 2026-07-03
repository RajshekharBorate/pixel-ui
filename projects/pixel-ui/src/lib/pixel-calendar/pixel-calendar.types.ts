/** Calendar view shown inside the panel: day grid, month grid, or multi-year grid. */
export type PixelCalendarView = 'day' | 'month' | 'year';

export type PixelCalendarMode = 'single' | 'range';

/** Returns `false` to disable a calendar day (combined with `min` / `max`). */
export type PixelCalendarDateFilterFn = (date: Date) => boolean;

/** Adds CSS class names to day cells in the day grid. */
export type PixelCalendarDateClassFn = (
  date: Date,
) => string | readonly string[] | null | undefined;

export interface PixelCalendarDay {
  readonly date: Date;
  readonly day: number;
  readonly inMonth: boolean;
  readonly today: boolean;
  readonly selected: boolean;
  readonly rangeStart: boolean;
  readonly rangeEnd: boolean;
  readonly inRange: boolean;
  readonly previewInRange: boolean;
  readonly previewEnd: boolean;
  readonly previewStart: boolean;
  readonly disabled: boolean;
  readonly cssClasses: readonly string[];
}

export interface PixelCalendarMonth {
  readonly month: number;
  readonly label: string;
  readonly current: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
}

export interface PixelCalendarYear {
  readonly year: number;
  readonly current: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
}

export interface PixelCalendarRange {
  readonly start: Date | null;
  readonly end: Date | null;
}
