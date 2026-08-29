import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import PixelDatepickerComponent from '../pixel-datepicker/pixel-datepicker';
import PixelTimepickerComponent from '../pixel-timepicker/pixel-timepicker';
import PixelSelectComponent from '../pixel-select/pixel-select';
import type { PixelSelectOption } from '../pixel-select/pixel-select';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import { toLocalIsoDate } from '../shared/datetime/pixel-date-utils';
import { nativeDateAdapterProviders } from '../shared/datetime/provide-native-date-adapter';
import { getBrowserTimeZone, PIXEL_TIMEZONE } from '../shared/datetime/pixel-timezone';
import type { PixelTimepickerFormat } from '../pixel-timepicker/pixel-timepicker.types';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';

export type PixelDatetimePickerSize = 'xs' | 'sm' | 'md' | 'lg';
export type PixelDatetimePickerLabelPosition = 'top' | 'left' | 'floating' | 'hidden';

export interface PixelDatetimePickerValidationMessages {
  required?: string;
  dateParse?: string;
  timeParse?: string;
  [errorCode: string]: string | undefined;
}

/**
 * Event emitted when the user confirms a datetime + timezone selection.
 */
export interface PixelDatetimePickerChangeEvent {
  /** ISO-8601 UTC instant, e.g. `"2026-08-14T12:00:00.000Z"`. Null when cleared. */
  readonly utcIso: string | null;
  /** IANA timezone used to resolve the instant (e.g. `"Asia/Kolkata"`). */
  readonly timeZone: string;
  /** The local date as `YYYY-MM-DD` in the selected timezone. */
  readonly localDate: string | null;
  /** The local time as `HH:mm` (24-hour canonical). */
  readonly localTime: string | null;
}

/**
 * Well-known IANA timezone options. Apps can provide their own via `[timeZoneOptions]`.
 */
export const PIXEL_COMMON_TIMEZONES: readonly PixelSelectOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Sao_Paulo', label: 'Brasília (BRT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central Europe (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Bangkok', label: 'Indochina (ICT)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST/NZDT)' },
];

let nextDatetimePickerId = 0;

/**
 * Composed date + time + timezone picker that outputs a canonical ISO-8601 UTC instant.
 *
 * Implements the enterprise-date-time-handling §8 + §25 contract:
 * - User enters: date + time + IANA timezone.
 * - Component converts to: ISO-8601 UTC (`"2026-08-14T12:00:00.000Z"`).
 * - CVA value: UTC ISO string (or `null` when incomplete/cleared).
 *
 * Integrates with Angular Reactive and template-driven forms via `ControlValueAccessor`.
 *
 * @example
 * ```html
 * <pixel-datetime-picker label="Appointment" [(value)]="scheduledAt" />
 * ```
 *
 * @example With pre-selected timezone
 * ```html
 * <pixel-datetime-picker label="Event" [(value)]="eventAt"
 *   [defaultTimeZone]="userProfile.timeZone" />
 * ```
 */
@Component({
  selector: 'pixel-datetime-picker',
  imports: [
    PixelDatepickerComponent,
    PixelTimepickerComponent,
    PixelSelectComponent,
    PixelSkeletonComponent,
  ],
  templateUrl: './pixel-datetime-picker.html',
  styleUrl: './pixel-datetime-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-datetime-picker-host',
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'resolvedDisabled() || null',
  },
  providers: [
    ...nativeDateAdapterProviders(),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelDatetimePickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelDatetimePickerComponent),
      multi: true,
    },
  ],
})
export default class PixelDatetimePickerComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-datetime-picker-${++nextDatetimePickerId}`;
  private readonly appTimeZone = inject(PIXEL_TIMEZONE, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });

  private onChange: (v: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  private readonly formDisabled = signal(false);

  /** Internal date state — `Date` at local midnight in the selected timezone. */
  protected readonly internalDate = signal<Date | null>(null);
  /** Internal time state — canonical `"HH:mm"` (24-hour). */
  protected readonly internalTime = signal<string>('');
  /** Internal timezone state. */
  protected readonly internalTimeZone: ReturnType<typeof signal<string>>;

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /**
   * Controlled ISO-8601 UTC value (or `null`). Set by parent / form control.
   *
   * @type {string | null}
   * @default null
   */
  readonly value = input<string | null>(null);

  /**
   * Component size — applied to all internal controls.
   *
   * @type {'xs' | 'sm' | 'md' | 'lg'}
   * @default 'md'
   */
  readonly size = input<PixelDatetimePickerSize>('md');

  /**
   * Label position for the date, time, and timezone fields.
   *
   * @type {'top' | 'left' | 'floating' | 'hidden'}
   * @default 'top'
   */
  readonly labelPosition = input<PixelDatetimePickerLabelPosition>('top');

  /**
   * Label for the date field.
   *
   * @type {string}
   * @default 'Date'
   */
  readonly dateLabel = input('Date');

  /**
   * Label for the time field.
   *
   * @type {string}
   * @default 'Time'
   */
  readonly timeLabel = input('Time');

  /**
   * Label for the timezone select field.
   *
   * @type {string}
   * @default 'Timezone'
   */
  readonly timeZoneLabel = input('Timezone');

  /**
   * Default IANA timezone when no controlled value is present.
   * Falls back to the `PIXEL_TIMEZONE` DI token, then to the browser's local zone.
   *
   * @type {string}
   * @default ''  (resolved at runtime)
   */
  readonly defaultTimeZone = input('');

  /**
   * Available timezone options in the timezone select.
   * Defaults to `PIXEL_COMMON_TIMEZONES`.
   *
   * @type {readonly PixelSelectOption[]}
   */
  readonly timeZoneOptions = input<readonly PixelSelectOption[]>(PIXEL_COMMON_TIMEZONES);

  /**
   * Whether to hide the timezone selector.
   * Use this when the timezone is always fixed (e.g. always UTC or always a single zone).
   *
   * @type {boolean}
   * @default false
   */
  readonly hideTimeZone = input(false, { transform: booleanAttribute });

  /**
   * Hour cycle for the time field.
   *
   * @type {'12' | '24' | undefined}
   * @default undefined  (locale-derived)
   */
  readonly timeFormat = input<PixelTimepickerFormat | undefined>(undefined);

  /**
   * BCP 47 locale for the time field's hour-cycle detection.
   *
   * @type {string | undefined}
   * @default undefined
   */
  readonly locale = input<string | undefined>(undefined);

  /**
   * Whether all fields are disabled.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Whether the component is required.
   *
   * @type {boolean}
   * @default false
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * Show skeleton placeholders instead of interactive controls.
   *
   * @type {boolean}
   * @default false
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * Validation messages for form errors.
   *
   * @type {PixelDatetimePickerValidationMessages}
   * @default {}
   */
  readonly validationMessages = input<PixelDatetimePickerValidationMessages>({});

  /**
   * Stable analytics id for this datetime picker.
   *
   * @type {string}
   * @default ''
   * @description Included as `pickerId` in date analytics events when non-empty.
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Record<string, unknown>}
   * @default {}
   * @description Adds non-sensitive application context to date analytics events.
   */
  readonly analyticsProperties = input<Record<string, unknown>>({});

  /**
   * When true, include the resolved ISO-8601 UTC instant in analytics.
   *
   * @type {boolean}
   * @default false
   * @description Defaults to presence-only analytics and never emits locale display text.
   */
  readonly analyticsEmitValue = input(false, { transform: booleanAttribute });

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /**
   * Emitted whenever the resolved UTC instant changes (date, time, or timezone change).
   */
  readonly change = output<PixelDatetimePickerChangeEvent>();

  /**
   * Emitted on the same schedule as `change` with just the UTC ISO string (or `null`).
   * Mirrors `pixel-datepicker`'s `valueChange` for API consistency.
   */
  readonly valueChange = output<string | null>();

  // ── Derived state ────────────────────────────────────────────────────────────

  protected readonly resolvedDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly resolvedTimeZoneOptions = computed(() => {
    const current = this.internalTimeZone();
    const options = this.timeZoneOptions();
    if (!current) {
      return options;
    }
    return options.some((option) => option.value === current)
      ? options
      : [{ value: current, label: current }, ...options];
  });

  /**
   * UTC ISO string computed from internalDate + internalTime + internalTimeZone.
   * Returns `null` when date or time is not yet set.
   */
  protected readonly resolvedUtcIso = computed((): string | null => {
    const date = this.internalDate();
    const time = this.internalTime();
    const tz = this.internalTimeZone();
    if (!date || !time || (!this.hideTimeZone() && !tz)) {
      return null;
    }
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      return null;
    }
    // Build local datetime string in the selected timezone and convert to UTC instant.
    // We use Intl to determine the UTC offset for the specific date+time in the given zone,
    // then construct the UTC instant by subtracting that offset.
    const localIso = `${toLocalIsoDate(date)}T${time.padStart(5, '0')}:00`;
    return localDateTimeToUtcIso(localIso, tz);
  });

  protected readonly resolvedLocalDate = computed(() => {
    const d = this.internalDate();
    return d ? toLocalIsoDate(d) : null;
  });

  constructor() {
    // Resolve initial timezone: input > token > browser
    const resolvedInitialTz =
      this.defaultTimeZone() || this.appTimeZone || getBrowserTimeZone();
    this.internalTimeZone = signal(resolvedInitialTz);

    // When controlled value changes (from parent [value] binding), decompose to parts.
    effect(() => {
      const utc = this.value();
      if (utc === null || utc === undefined) {
        return;
      }
      untracked(() => this.decomposeUtcValue(utc));
    });
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(v: string | null): void {
    if (v) {
      this.decomposeUtcValue(v);
    } else {
      this.internalDate.set(null);
      this.internalTime.set('');
    }
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  // ── Validator ────────────────────────────────────────────────────────────

  validate(_control: AbstractControl): ValidationErrors | null {
    const date = this.internalDate();
    const time = this.internalTime();
    const tz = this.internalTimeZone();
    if (this.required() && (!date || !time || (!this.hideTimeZone() && !tz))) {
      return { required: true };
    }
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // ── Template handlers ────────────────────────────────────────────────────

  protected onDateChange(date: Date | null): void {
    this.internalDate.set(date);
    this.onTouched();
    this.emitValueChange();
    this.emitDateAnalytics(date ? 'ui.date.select' : 'ui.date.clear');
  }

  protected onTimeChange(time: string): void {
    this.internalTime.set(time);
    this.onTouched();
    this.emitValueChange();
    this.emitDateAnalytics(time ? 'ui.date.select' : 'ui.date.clear');
  }

  protected onTimeZoneChange(tz: unknown): void {
    if (typeof tz === 'string' && tz) {
      this.internalTimeZone.set(tz);
    }
    this.onTouched();
    this.emitValueChange();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /**
   * Push value to the parent form / outputs.
   *
   * Important: while date/time are partially filled (no complete UTC instant yet),
   * do **not** call `onChange(null)` — Angular would invoke `writeValue(null)` and
   * wipe the in-progress date selection.
   */
  private emitValueChange(): void {
    const utcIso = this.resolvedUtcIso();
    const date = this.internalDate();
    const time = this.internalTime();
    const isEmpty = date === null && !time;

    if (utcIso !== null) {
      this.onChange(utcIso);
      this.valueChange.emit(utcIso);
    } else if (isEmpty) {
      this.onChange(null);
      this.valueChange.emit(null);
    }

    this.onValidatorChange();

    if (utcIso !== null || isEmpty) {
      this.change.emit({
        utcIso: utcIso ?? null,
        timeZone: this.internalTimeZone(),
        localDate: this.resolvedLocalDate(),
        localTime: time || null,
      });
    }
  }

  private emitDateAnalytics(name: 'ui.date.select' | 'ui.date.clear'): void {
    const pickerId = this.analyticsId().trim();
    const value = this.resolvedUtcIso();
    const extras = { ...this.analyticsProperties() };
    delete extras['value'];
    emitPixelUiAnalytics(this.analytics, {
      name,
      component: 'pixel-datetime-picker',
      extras,
      reserved: {
        ...(pickerId ? { pickerId } : {}),
        hasValue: value !== null,
        ...(this.analyticsEmitValue() && value ? { value } : {}),
      },
    });
  }

  /**
   * Given a UTC ISO string, decompose it into (localDate, localTime) in the currently
   * selected timezone, and update internal signals.
   */
  private decomposeUtcValue(utcIso: string): void {
    const instant = new Date(utcIso);
    if (isNaN(instant.getTime())) {
      return;
    }
    const tz = this.internalTimeZone();
    // Use Intl to get local year/month/day/hour/minute in the target timezone.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(instant);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const year = parseInt(get('year'), 10);
    const month = parseInt(get('month'), 10) - 1;
    const day = parseInt(get('day'), 10);
    let hour = parseInt(get('hour'), 10);
    const minute = parseInt(get('minute'), 10);

    // Intl with hour12:false can return '24' for midnight — normalise to 0.
    if (hour === 24) {
      hour = 0;
    }

    this.internalDate.set(new Date(year, month, day));
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    this.internalTime.set(`${hh}:${mm}`);
  }
}

/**
 * Converts a naive local datetime string (`"YYYY-MM-DDTHH:mm:ss"`) in a named IANA
 * timezone to an ISO-8601 UTC string.
 *
 * Strategy: construct a `Date` from the naive string (browser interprets as local), then
 * use `Intl.DateTimeFormat.formatToParts` to determine the UTC offset for that moment in
 * the given zone, and correct the `Date` accordingly.
 */
function localDateTimeToUtcIso(localIso: string, timeZone: string): string | null {
  try {
    // Parse as UTC first (append Z) to get a stable reference instant.
    const utcRef = new Date(`${localIso}Z`);
    if (isNaN(utcRef.getTime())) {
      return null;
    }

    // Get what the local time *looks like* in the target timezone at the UTC reference.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(utcRef);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
    let h = parseInt(get('hour'), 10);
    if (h === 24) {
      h = 0;
    }
    const zonedMs = Date.UTC(
      parseInt(get('year'), 10),
      parseInt(get('month'), 10) - 1,
      parseInt(get('day'), 10),
      h,
      parseInt(get('minute'), 10),
      parseInt(get('second'), 10),
    );

    // Offset = UTC reference (treated as local) − what the zone says it is.
    const offsetMs = utcRef.getTime() - zonedMs;
    return new Date(utcRef.getTime() + offsetMs).toISOString();
  } catch {
    return null;
  }
}
