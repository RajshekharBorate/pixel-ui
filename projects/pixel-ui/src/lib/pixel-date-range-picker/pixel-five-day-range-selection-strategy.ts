import { Injectable, inject } from '@angular/core';
import { PixelDateAdapter, PIXEL_DATE_ADAPTER } from '../shared/datetime/pixel-date-adapter';
import { toNativeDate } from '../shared/datetime/pixel-date-utils';
import { PixelDateRange } from './pixel-date-range';
import type { PixelDateRangeSelectionStrategy } from './pixel-date-range-selection-strategy';

/** Material-style example: always selects a five-day window centered on the activated day. */
@Injectable({ providedIn: 'root' })
export class PixelFiveDayRangeSelectionStrategy implements PixelDateRangeSelectionStrategy<Date> {
  private readonly adapter = inject<PixelDateAdapter<Date>>(PIXEL_DATE_ADAPTER);

  selectionFinished(
    date: Date | null,
    _currentRange: PixelDateRange<Date>,
    _event: Event,
  ): PixelDateRange<Date> {
    return this.createFiveDayRange(date);
  }

  createPreview(
    activeDate: Date | null,
    _currentRange: PixelDateRange<Date>,
    _event: Event,
  ): PixelDateRange<Date> {
    return this.createFiveDayRange(activeDate);
  }

  private createFiveDayRange(date: Date | null): PixelDateRange<Date> {
    if (date == null) {
      return new PixelDateRange<Date>(null, null);
    }

    const start = toNativeDate(this.adapter.addCalendarDays(date, -2));
    const end = toNativeDate(this.adapter.addCalendarDays(date, 2));
    return new PixelDateRange(start, end);
  }
}
