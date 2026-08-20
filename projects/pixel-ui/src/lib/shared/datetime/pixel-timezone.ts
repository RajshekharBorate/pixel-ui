/**
 * Timezone helpers for enterprise scheduling scenarios where the business timezone may
 * differ from the viewer's browser timezone.
 *
 * @see enterprise-date-time-handling.md §10–§11
 */

import { InjectionToken } from '@angular/core';

/**
 * Returns the IANA timezone identifier for the viewer's browser (e.g. `'Asia/Kolkata'`).
 *
 * This is a safe, SSR-compatible helper — it falls back to `'UTC'` when `Intl` is
 * unavailable (e.g. during server-side pre-rendering).
 *
 * **Do not** assume this is always the correct business timezone. An operator in India may
 * schedule appointments for customers in New York. When timezone context matters, let the
 * user select it explicitly and store/pass the IANA id alongside the UTC instant.
 */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Optional DI token that provides the IANA timezone used throughout the app for display.
 *
 * Provide this token at the root (or feature) level when the app needs a consistent
 * display timezone that differs from the browser's local zone — e.g. a scheduling tool
 * that always shows times in the customer's timezone.
 *
 * When not provided, components fall back to the browser's local zone (the browser default
 * for `Intl.DateTimeFormat`).
 *
 * @example
 * // app.config.ts
 * providers: [
 *   { provide: PIXEL_TIMEZONE, useValue: 'America/New_York' }
 * ]
 *
 * @example
 * // Dynamic (e.g. derived from authenticated user profile):
 * providers: [
 *   { provide: PIXEL_TIMEZONE, useFactory: () => inject(UserService).timeZone() }
 * ]
 */
export const PIXEL_TIMEZONE = new InjectionToken<string>('PIXEL_TIMEZONE');
