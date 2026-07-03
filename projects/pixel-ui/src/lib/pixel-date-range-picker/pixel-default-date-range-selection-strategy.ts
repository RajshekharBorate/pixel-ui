import { Injectable } from '@angular/core';
import { normalizeRange } from '../shared/datetime/pixel-date-utils';
import { PixelDateRange } from './pixel-date-range';
import type { PixelDateRangeSelectionStrategy } from './pixel-date-range-selection-strategy';

/** Standard two-click range selection (start, then end). */
@Injectable()
export class PixelDefaultDateRangeSelectionStrategy
  implements PixelDateRangeSelectionStrategy<Date>
{
  selectionFinished(
    date: Date | null,
    currentRange: PixelDateRange<Date>,
    _event: Event,
  ): PixelDateRange<Date> {
    if (date == null) {
      return new PixelDateRange<Date>(null, null);
    }

    const { start, end } = currentRange;
    if (start == null || (start != null && end != null)) {
      return new PixelDateRange(date, null);
    }

    const normalized = normalizeRange(start, date);
    return new PixelDateRange(normalized.start, normalized.end);
  }

  createPreview(
    activeDate: Date | null,
    currentRange: PixelDateRange<Date>,
    _event: Event,
  ): PixelDateRange<Date> {
    const { start, end } = currentRange;
    if (start == null || end != null || activeDate == null) {
      return new PixelDateRange<Date>(null, null);
    }

    const normalized = normalizeRange(start, activeDate);
    return new PixelDateRange(normalized.start, normalized.end);
  }
}
