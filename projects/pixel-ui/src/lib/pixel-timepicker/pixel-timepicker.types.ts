export type PixelTimepickerVariant = 'input' | 'clock';
export type PixelTimepickerFormat = '12' | '24';
export type PixelTimepickerSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelTimepickerLabelPosition = 'top' | 'left' | 'floating' | 'hidden';
export type PixelTimepickerOpenDirection = 'auto' | 'top' | 'bottom';

/** Internal clock view — used in clock (dial) variant. */
export type PixelTimepickerView = 'hour' | 'minute';

/** Parsed time parts. */
export interface PixelTimeParts {
  readonly hours: number;   // 0-23
  readonly minutes: number; // 0-59
}

/** Emitted on every confirmed value change. */
export interface PixelTimepickerChange {
  readonly value: string;        // canonical "HH:mm"
  readonly parts: PixelTimeParts;
}

export interface PixelTimepickerValidationMessages {
  required?: string;
  [errorCode: string]: string | undefined;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Parse "HH:mm" → { hours, minutes }. Returns null on invalid input. */
export function parseTime(value: string): PixelTimeParts | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hours: h, minutes: m };
}

/** Format parts → "HH:mm". */
export function formatTime(parts: PixelTimeParts): string {
  return `${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}`;
}

/** Format for display — respects 12/24 hour format. */
export function formatDisplayTime(parts: PixelTimeParts, format: PixelTimepickerFormat): string {
  const min = String(parts.minutes).padStart(2, '0');
  if (format === '24') {
    return `${String(parts.hours).padStart(2, '0')}:${min}`;
  }
  const period = parts.hours < 12 ? 'AM' : 'PM';
  const h12 = parts.hours % 12 || 12;
  return `${h12}:${min} ${period}`;
}
