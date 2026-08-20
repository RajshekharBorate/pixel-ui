# pixel-timestamp

Locale- and timezone-aware instant display component.

## Overview

Accepts a UTC ISO-8601 string, epoch-ms number, or `Date` and renders it as:

- **relative** — `"5 minutes ago"`, `"2 hours ago"`, `"yesterday"` (auto-refreshes every 30 s)
- **absolute** — `"14 Aug 2026, 5:30 PM"` (locale-formatted date + time)

The visible text is wrapped in a `<time>` element whose `datetime` attribute always carries
the original ISO UTC value for machine readability and SEO.

This component satisfies the enterprise-date-time-handling §25–§26 `<px-date-time-display>`
contract: **input is a UTC instant; output is a localized human-readable string**.

## Use cases

- Notification feed timestamps (`createdAt`)
- Audit log columns (`updatedAt`, `deletedAt`)
- Appointment / event display
- Any column showing when something happened, formatted for the viewer's locale

## API contract

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| number \| Date` | required | UTC instant to display |
| `mode` | `'relative' \| 'absolute'` | `'relative'` | Display mode |
| `style` | `'long' \| 'short' \| 'narrow' \| 'compact'` | `'long'` | Phrase length for relative mode |
| `absoluteAfterDays` | `number \| null` | `7` | Switch to absolute after N days; `null` = always relative |
| `locale` | `string` | `''` | BCP 47 locale, e.g. `'de-DE'`; defaults to runtime locale |
| `timeZone` | `string` | `''` | IANA timezone, e.g. `'America/New_York'`; see Timezone precedence |
| `titleOverride` | `string` | `''` | Custom tooltip text; defaults to absolute timestamp |
| `ariaLabel` | `string` | `''` | Accessible label override for the `<time>` element |
| `showSkeleton` | `boolean` | `false` | Show empty placeholder instead of content |

### Timezone precedence

1. `[timeZone]` input (per-instance override)
2. `PIXEL_TIMEZONE` DI token (app-level business timezone)
3. Browser's local timezone (Intl default)

## Behavior notes

- **Relative auto-refresh**: a `setInterval` at 30 s increments `nowTick`; the `DestroyRef`
  clears it on component teardown.
- **Date-only strings**: passing `"2026-08-14"` (without a `T` and `Z`) is treated as UTC
  midnight by JavaScript's `new Date()`. For date-only values use `pixel-datepicker`, not
  this component — this component is for instants only.
- **Compact + non-English locale**: when a `locale` is provided, `compact` style delegates to
  `Intl.RelativeTimeFormat` with `style:'narrow'` for locale-appropriate short forms (e.g.
  `"3 Min."` in German, `"3分"` in Japanese).

## Examples

```html
<!-- Relative (default) -->
<pixel-timestamp [value]="notification.createdAt" />

<!-- Absolute, forced to business timezone -->
<pixel-timestamp [value]="appointment.scheduledAt"
                  mode="absolute"
                  timeZone="America/New_York" />

<!-- Compact for dense notification list -->
<pixel-timestamp [value]="item.createdAt" style="compact" />

<!-- Localized for German users -->
<pixel-timestamp [value]="event.startAt" locale="de-DE" />
```

## Accessibility

- Renders as a `<time>` element with a machine-readable `datetime` attribute (ISO UTC).
- The `title` attribute carries the absolute timestamp for tooltip access.
- `ariaLabel` input allows an override when the default text content is insufficient.

## Theme customization

| Token | Default | Description |
|---|---|---|
| `--pixel-timestamp-color` | `--pixel-sys-on-surface-variant` | Text color (relative mode) |
| `--pixel-timestamp-font-size` | `inherit` | Font size |
