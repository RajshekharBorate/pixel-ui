import { InjectionToken, type Type, type Provider } from '@angular/core';
import { PixelDateRange } from './pixel-date-range';

/** Customizes calendar preview and click selection for `pixel-date-range-picker`. */
export interface PixelDateRangeSelectionStrategy<D = Date> {
  /** Returns the range after the user selects a calendar day. */
  selectionFinished(
    date: D | null,
    currentRange: PixelDateRange<D>,
    event: Event,
  ): PixelDateRange<D>;

  /** Returns the hover/focus preview range before selection is finished. */
  createPreview(
    activeDate: D | null,
    currentRange: PixelDateRange<D>,
    event: Event,
  ): PixelDateRange<D>;
}

export const PIXEL_DATE_RANGE_SELECTION_STRATEGY = new InjectionToken<
  PixelDateRangeSelectionStrategy<Date>
>('PIXEL_DATE_RANGE_SELECTION_STRATEGY');

export function providePixelDateRangeSelectionStrategy(
  strategy: Type<PixelDateRangeSelectionStrategy<Date>>,
): Provider[] {
  return [{ provide: PIXEL_DATE_RANGE_SELECTION_STRATEGY, useClass: strategy }];
}
