# pixel-datetime-picker

Composed date + time + timezone picker that outputs a canonical ISO-8601 UTC instant.

## Overview

Implements the enterprise-date-time-handling §8, §25, §26 contract:

> User enters: Date + Time + IANA Timezone → Component outputs: ISO-8601 UTC.

This is the library's answer to the gap between `pixel-datepicker` (date-only, no timezone)
and full scheduling scenarios where an exact moment in time must be captured and transmitted
as UTC.

```
User enters:
  14 Aug 2026
  5:30 PM
  Asia/Kolkata

Component emits:
  "2026-08-14T12:00:00.000Z"
```

## Use cases

- Appointment / meeting scheduling
- Event creation with explicit timezone
- Any form field that captures a globally meaningful instant

## When NOT to use

- **Date-only fields** (birthday, invoice date, contract start): use `pixel-datepicker`.
- **Time-only fields** (store hours): use `pixel-timepicker`.
- **Always-UTC, no timezone needed**: set `hideTimeZone` and ensure the consumer converts
  the UTC value correctly.

## API contract

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| null` | `null` | Controlled ISO-8601 UTC value |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Size applied to all fields |
| `labelPosition` | `'top' \| 'left' \| 'floating' \| 'hidden'` | `'top'` | Label position |
| `dateLabel` | `string` | `'Date'` | Label for the date field |
| `timeLabel` | `string` | `'Time'` | Label for the time field |
| `timeZoneLabel` | `string` | `'Timezone'` | Label for the timezone select |
| `defaultTimeZone` | `string` | browser zone | IANA default when no value is set |
| `timeZoneOptions` | `PixelSelectOption[]` | `PIXEL_COMMON_TIMEZONES` | Timezone dropdown options |
| `hideTimeZone` | `boolean` | `false` | Hides the timezone selector |
| `timeFormat` | `'12' \| '24' \| undefined` | `undefined` (locale-derived) | Hour cycle for timepicker |
| `locale` | `string \| undefined` | `undefined` | BCP 47 locale for hour-cycle detection |
| `disabled` | `boolean` | `false` | Disables all fields |
| `required` | `boolean` | `false` | Required validation |
| `showSkeleton` | `boolean` | `false` | Skeleton placeholder |
| `validationMessages` | `PixelDatetimePickerValidationMessages` | `{}` | Error message overrides |

### Outputs

| Output | Payload | Description |
|---|---|---|
| `valueChange` | `string \| null` | ISO UTC string whenever date/time/tz changes |
| `change` | `PixelDatetimePickerChangeEvent` | Full event: `{ utcIso, timeZone, localDate, localTime }` |

### Types

```ts
interface PixelDatetimePickerChangeEvent {
  utcIso: string | null;     // ISO-8601 UTC, e.g. "2026-08-14T12:00:00.000Z"
  timeZone: string;          // IANA id, e.g. "Asia/Kolkata"
  localDate: string | null;  // YYYY-MM-DD in the selected timezone
  localTime: string | null;  // HH:mm (24-hour canonical)
}
```

## Behavior notes

- **CVA value**: ISO UTC string or `null`. Integrates with both Reactive and template-driven forms.
- **Timezone precedence** for default timezone: `[defaultTimeZone]` input → `PIXEL_TIMEZONE` DI token → browser zone.
- **UTC conversion**: uses `Intl.DateTimeFormat.formatToParts` with `style:'narrow'` to determine the exact UTC offset for the given date+time in the selected IANA zone — correctly handles DST transitions.
- **Decompose on write**: when a UTC value is written (e.g. from `FormControl.setValue`), the component decomposes it into local date/time in the currently selected timezone.
- **Partial draft state**: selecting only a date (or date + time without a complete instant) keeps the inner fields populated. The CVA does **not** emit `null` mid-draft — that would trigger `writeValue(null)` and wipe the date field in reactive forms.
- **`PIXEL_COMMON_TIMEZONES`**: exported constant with 16 common IANA timezone options. Provide your own via `[timeZoneOptions]`.
- **No `LocalDateTime` ambiguity**: the internal time is always resolved to an instant — never left as a zone-free local time.

## Examples

```html
<!-- Basic -->
<pixel-datetime-picker label="" [(value)]="appointment.scheduledAt" />

<!-- Pre-select business timezone -->
<pixel-datetime-picker
  [(value)]="event.scheduledAt"
  [defaultTimeZone]="userProfile.timeZone" />

<!-- Fixed UTC zone (no selector) -->
<pixel-datetime-picker [(value)]="job.runAt" hideTimeZone [defaultTimeZone]="'UTC'" />

<!-- Reactive form -->
<pixel-datetime-picker [formControl]="scheduledAtCtrl" />
```

## Accessibility

- All three inner fields (`pixel-datepicker`, `pixel-timepicker`, `pixel-select`) carry their own accessible names via `label` inputs.
- Disabled state propagates to all inner controls.

## Breaking changes

None — new component.
