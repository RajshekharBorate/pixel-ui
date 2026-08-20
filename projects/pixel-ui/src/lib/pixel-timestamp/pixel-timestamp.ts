import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { formatAbsoluteTimestamp, formatRelativeTime } from '../shared/datetime/pixel-relative-time';
import { PIXEL_TIMEZONE } from '../shared/datetime/pixel-timezone';

export type PixelTimestampMode = 'relative' | 'absolute';
export type PixelTimestampStyle = 'long' | 'short' | 'narrow' | 'compact';

/**
 * Locale- and timezone-aware instant display component.
 *
 * Accepts a UTC ISO-8601 string, an epoch-ms number, or a `Date` object and renders it
 * as a relative phrase ("5 minutes ago") or an absolute locale date-time string
 * ("14 Aug 2026, 5:30 PM").
 *
 * The visible text is wrapped in a `<time>` element whose `datetime` attribute always
 * carries the ISO UTC value for machine readability.
 *
 * Relative display auto-refreshes every 30 s while the component is mounted.
 *
 * ### Timezone precedence
 *
 * 1. `[timeZone]` input (explicit per-instance override).
 * 2. `PIXEL_TIMEZONE` DI token (app-level business timezone).
 * 3. Browser's local timezone (default `Intl` behaviour).
 *
 * @example Relative (default)
 * ```html
 * <pixel-timestamp [value]="notification.createdAt" />
 * ```
 *
 * @example Absolute, forced to a business timezone
 * ```html
 * <pixel-timestamp [value]="appointment.scheduledAt" mode="absolute"
 *                  timeZone="America/New_York" />
 * ```
 *
 * @example Compact relative for dense lists
 * ```html
 * <pixel-timestamp [value]="item.createdAt" style="compact" />
 * ```
 */
@Component({
  selector: 'pixel-timestamp',
  template: `
    <time
      class="pixel-timestamp__time"
      [attr.datetime]="isoValue()"
      [attr.title]="titleText()"
      [attr.aria-label]="ariaLabel() || null"
    >{{ displayText() }}</time>
  `,
  styleUrl: './pixel-timestamp.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-timestamp',
    '[attr.data-mode]': 'mode()',
    '[attr.data-style]': 'style()',
  },
})
export default class PixelTimestampComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appTimeZone = inject(PIXEL_TIMEZONE, { optional: true });
  private readonly nowTick = signal(Date.now());

  /**
   * The instant to display. Accepts an ISO-8601 UTC string, epoch milliseconds, or a `Date`.
   *
   * @type {string | number | Date}
   * @description Pass a UTC instant. Date-only `YYYY-MM-DD` strings without a timezone
   * suffix are treated as UTC midnight by JavaScript — prefer passing a full ISO string
   * (e.g. `2026-08-14T12:00:00Z`) for instant values.
   */
  readonly value = input.required<string | number | Date>();

  /**
   * Display mode.
   *
   * @type {'relative' | 'absolute'}
   * @default 'relative'
   * @description `relative` renders phrases like "5 minutes ago". `absolute` renders a
   * locale-formatted date + time. The `<time datetime>` attribute always carries the ISO
   * UTC value regardless of mode.
   */
  readonly mode = input<PixelTimestampMode>('relative');

  /**
   * Phrase length for relative mode.
   *
   * @type {'long' | 'short' | 'narrow' | 'compact'}
   * @default 'long'
   * @description `compact` produces ultra-dense forms like `"3m ago"` / `"2h ago"`. Other
   * values use `Intl.RelativeTimeFormat`.
   */
  readonly style = input<PixelTimestampStyle>('long');

  /**
   * Switch to an absolute timestamp after this many calendar days in relative mode.
   * Pass `null` to stay relative indefinitely.
   *
   * @type {number | null}
   * @default 7
   */
  readonly absoluteAfterDays = input<number | null>(7);

  /**
   * BCP 47 locale for formatting (e.g. `'de-DE'`). Defaults to the runtime locale.
   *
   * @type {string}
   * @default ''
   */
  readonly locale = input('');

  /**
   * IANA timezone for display (e.g. `'America/New_York'`). Takes precedence over the
   * app-level `PIXEL_TIMEZONE` token. Defaults to the browser's local timezone.
   *
   * @type {string}
   * @default ''
   */
  readonly timeZone = input('');

  /**
   * Override the tooltip text shown on hover. When empty the absolute timestamp is used.
   *
   * @type {string}
   * @default ''
   */
  readonly titleOverride = input('');

  /**
   * Accessible label override for the `<time>` element. When empty the display text is
   * read by assistive technology via the element's text content.
   *
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Show skeleton placeholder instead of the timestamp.
   *
   * @type {boolean}
   * @default false
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  private get resolvedTimeZone(): string | undefined {
    return this.timeZone() || this.appTimeZone || undefined;
  }

  protected readonly isoValue = computed(() => {
    const v = this.value();
    if (v instanceof Date) {
      return v.toISOString();
    }
    if (typeof v === 'number') {
      return new Date(v).toISOString();
    }
    return v;
  });

  protected readonly displayText = computed(() => {
    if (this.showSkeleton()) {
      return '';
    }
    const val = this.value();
    const locale = this.locale() || undefined;
    const tz = this.resolvedTimeZone;
    if (this.mode() === 'absolute') {
      return formatAbsoluteTimestamp(val, locale, tz);
    }
    return formatRelativeTime(val, {
      now: this.nowTick(),
      style: this.style(),
      locale,
      timeZone: tz,
      absoluteAfterDays: this.absoluteAfterDays(),
    });
  });

  protected readonly titleText = computed(
    () =>
      this.titleOverride() ||
      formatAbsoluteTimestamp(
        this.value(),
        this.locale() || undefined,
        this.resolvedTimeZone,
      ),
  );

  constructor() {
    const TICK_MS = 30_000;
    const intervalId = setInterval(() => this.nowTick.set(Date.now()), TICK_MS);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }
}
