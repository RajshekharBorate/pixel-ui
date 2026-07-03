import type { PixelButtonSize } from '../pixel-button/pixel-button';
import type { PixelToggleSize } from '../pixel-toggle/pixel-toggle.types';
import type { PixelDateRangePickerSize } from '../pixel-date-range-picker/pixel-date-range-picker';
import type { PixelDatepickerSize } from '../pixel-datepicker/pixel-datepicker';
import type { PixelInputSize } from '../pixel-input/pixel-input';
import type { PixelSelectSize } from '../pixel-select/pixel-select';
import type { PixelToastSize } from '../pixel-toast/pixel-toast.types';
import type { PixelQueryBuilderSize } from './pixel-query-builder.types';

/** Maps query-builder density to `pixel-select` / multiselect controls (1:1). */
export function toQuerySelectSize(size: PixelQueryBuilderSize): PixelSelectSize {
  return size;
}

/** Maps query-builder density to `pixel-input` controls (1:1). */
export function toQueryInputSize(size: PixelQueryBuilderSize): PixelInputSize {
  return size;
}

/** Maps query-builder density to `pixel-datepicker` controls (1:1). */
export function toQueryDatepickerSize(size: PixelQueryBuilderSize): PixelDatepickerSize {
  return size;
}

/** Maps query-builder density to `pixel-date-range-picker` controls (1:1). */
export function toQueryDateRangePickerSize(size: PixelQueryBuilderSize): PixelDateRangePickerSize {
  return size;
}

/** Maps query-builder density to footer actions (`pixel-button`) (1:1). */
export function toQueryButtonSize(size: PixelQueryBuilderSize): PixelButtonSize {
  return size;
}

/** Maps query-builder density to AND/OR segmented toggles (`pixel-toggle`) (1:1). */
export function toQueryToggleSize(size: PixelQueryBuilderSize): PixelToggleSize {
  return size;
}

/** Maps query-builder density to inline toasts (`pixel-toast-inline`) (1:1). */
export function toQueryToastSize(size: PixelQueryBuilderSize): PixelToastSize {
  return size;
}
