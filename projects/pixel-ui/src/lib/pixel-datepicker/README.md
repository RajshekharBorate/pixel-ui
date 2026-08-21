# pixel-datepicker

Accessible date field with a pop-over calendar. The trigger is a composed **`pixel-input`** so typography, focus rings, sizes, labels, and form error behavior match the rest of the form controls.

Implements `ControlValueAccessor` and `Validator` for reactive and template-driven forms.

## Composition

- **Field shell** — `pixel-input` (label, helper, validation messages, clear button, calendar toggle)
- **Calendar panel** — inline overlay with day / month / year grids
- **Overlay** — shared `ConnectedOverlay` (same positioning model as `pixel-select`)

Only the datepicker host registers as the form control; the inner input may inherit parent
`NgControl` **errors** for styling while display text stays controlled via `[value]`.

## Basic usage

```html
<pixel-datepicker
  label="Event date"
  [value]="date()"
  (valueChange)="date.set($event)"
/>
```

## Reactive forms

```html
<form [formGroup]="form">
  <pixel-datepicker
    formControlName="startDate"
    label="Start date"
    [required]="true"
    helperText="Required to continue."
    [validationMessages]="{
      required: 'Start date is required.',
      min: 'Date is too early.',
      max: 'Date is too late.',
      dateParse: 'Enter a valid date.',
      dateFilter: 'This date is not available.',
    }"
  />
</form>
```

Validation messages appear automatically when the control is **touched** or **dirty**. Typed
parse / filter errors show after **blur** or **Enter** (not mid-keystroke) via `errorOverride`.

## Template-driven forms

```html
<pixel-datepicker
  name="birthDate"
  [(ngModel)]="birthDate"
  label="Date of birth"
  [required]="true"
/>
```

## Key inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Date \| string \| number \| null` | `null` | Controlled value when not using Angular forms. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Field size (passed through to `pixel-input`). |
| `labelPosition` | `'top' \| 'left' \| 'floating' \| 'hidden'` | `'top'` | Label layout. |
| `validationMessages` | `PixelDatepickerValidationMessages` | `{}` | Error copy keyed by validator (`required`, `min`, `max`, `dateParse`, …). |
| `errorText` | `string` | `''` | **Deprecated** — prefer `validationMessages`. Still overrides all error copy when set. |
| `parseErrorText` | `string` | `'Enter a valid date'` | Message for unparseable typed input. |
| `min` / `max` | `PixelDatepickerValue` | `null` | Inclusive selectable range. |
| `locale` | `string` | browser default | BCP-47 locale for formatting and parsing. |
| `firstDayOfWeek` | `number` | `0` | 0 = Sunday … 6 = Saturday. |
| `startView` | `'day' \| 'month' \| 'year'` | `'day'` | Initial calendar grid when the panel opens. |
| `showOutsideDays` | `boolean` | `false` | When true, show muted adjacent-month dates in the calendar grid. |
| `startAt` | `PixelDatepickerValue` | `null` | Month shown when opening with no selected value (else today). |
| `dateFilter` | `(date: Date) => boolean` | `null` | Return `false` to disable a date (combined with min/max). |
| `dateClass` | `(date: Date) => string \| string[]` | `null` | CSS class names added to day cells in the day grid. |
| `displayWith` | `(date, locale?) => string` | locale numeric | Formats the committed value (`defaultFormatDate`). |
| `parseValue` | `(text, locale?) => Date \| null` | locale-aware parser | Parses typed input on blur / Enter. |
| `clearable` | `boolean` | `true` | Shows a clear button when the field has text. |
| `scrollBehavior` | `'close' \| 'reposition' \| 'block'` | `'close'` | Page scroll behavior while open. |
| `showActions` | `boolean` | `false` | When true, calendar stays open while drafting; **Apply** commits, **Cancel** / Escape / outside click restores. |
| `applyLabel` / `cancelLabel` | `string` | `'Apply'` / `'Cancel'` | Footer button labels when `showActions` is true. |

## Outputs

| Output | Type | Description |
| --- | --- | --- |
| `valueChange` | `Date \| null` | Emits whenever the committed value changes. |
| `openChange` | `boolean` | Emits when the calendar panel opens or closes. |

## Keyboard

- **↓** on the field — open the panel
- **Enter** — commit the typed date (when the field is focused)
- **Arrow keys** — move focus inside the active calendar grid
- **Enter** / **Space** (in calendar) — select the focused day / month / year
- **Escape** — close the panel (with `showActions`, discards the draft) and return focus to the field

## Material feature parity (Phase 3)

```html
<!-- Disable weekends -->
<pixel-datepicker
  label="Shift date"
  [dateFilter]="isWeekday"
  [validationMessages]="{ dateFilter: 'Choose a weekday.' }"
/>

<!-- Open on a specific month when empty -->
<pixel-datepicker label="Historical date" [startAt]="new Date(2020, 0, 1)" />

<!-- Highlight specific days -->
<pixel-datepicker label="Payroll" [dateClass]="paydayClass" />
```

`dateFilter` and `min` / `max` work together. Month and year views disable periods only when every day inside them is blocked.

## Recommended app bootstrap

Pair Angular `LOCALE_ID` with `providePixelDateLocale({ strategy: 'localeId' })` so picker,
grid, and query summaries share one locale (docs app uses `en-IN`).

```ts
import { LOCALE_ID } from '@angular/core';
import { providePixelDateLocale } from 'pixel-ui';

bootstrapApplication(App, {
  providers: [
    { provide: LOCALE_ID, useValue: 'en-IN' }, // or user/tenant locale
    ...providePixelDateLocale({ strategy: 'localeId' }),
  ],
});
```

Per-control `[locale]` still overrides the token when needed.

## Custom formats

For a fixed mask (e.g. always `dd/MM/yyyy`) instead of locale numeric:

```ts
import { PIXEL_DD_MM_YYYY_FORMATS, providePixelDateLocale } from 'pixel-ui';

bootstrapApplication(App, {
  providers: [
    ...providePixelDateLocale({
      strategy: 'fixed',
      locale: 'en-GB',
      formats: PIXEL_DD_MM_YYYY_FORMATS,
    }),
  ],
});
```

```html
<pixel-datepicker label="Invoice date" showFormatHint />
```

Priority: per-control `displayWith` / `parseValue` → `PIXEL_DATE_FORMATS` + adapter → built-in
locale numeric defaults. Pattern tokens: `yyyy` `yy` `MM` `M` `dd` `d`.

## Related components

- **`pixel-input`** — field shell, validation UX, trailing calendar icon API
- **`pixel-select`** — similar overlay + composed-input patterns

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-datepicker` (`PixelDatepickerComponent`)

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `label` | `string` | `''` |  |
| `value` | `PixelDatepickerValue` | `null` |  |
| `placeholder` | `string` | `'Select a date'` |  |
| `size` | `PixelDatepickerSize` | `'md'` |  |
| `labelPosition` | `PixelDatepickerLabelPosition` | `'top'` |  |
| `showSkeleton` | `boolean` | `false` | When true, replaces the field with a skeleton placeholder. |
| `disabled` | `boolean` | `false` |  |
| `inputDisabled` | `boolean` | `false` | Disables typed input / clear while still allowing the calendar popup (Material “input disabled”). Ignored when `disabled` is true. Prefer over `readonly` when the picker should remain usable. |
| `pickerDisabled` | `boolean` | `false` | Disables the calendar toggle / popup while still allowing typed dates (Material “popup disabled”). Ignored when `disabled` is true. |
| `readonly` | `boolean` | `false` | Prevents all value changes (typing and calendar). Focus may remain; use `inputDisabled` if the calendar should still commit a value. |
| `inheritParentControlErrors` | `boolean` | `true` |  |
| `required` | `boolean` | `false` |  |
| `helperText` | `string` | `''` |  |
| `formatHint` | `string` | `''` | Explicit format hint (e.g. `DD/MM/YYYY`). When empty and `showFormatHint` is true, a locale / formats-derived hint is used. Shown as helper text when `helperText` is empty. |
| `showFormatHint` | `boolean` | `false` | When true (and `helperText` is empty), show an auto format hint so users know how to type. |
| `validationMessages` | `PixelDatepickerValidationMessages` | `{}` |  |
| `errorText` | `string` | `''` |  |
| `parseErrorText` | `string` | `'Enter a valid date'` |  |
| `clearable` | `boolean` | `true` |  |
| `min` | `PixelDatepickerValue` | `null` |  |
| `max` | `PixelDatepickerValue` | `null` |  |
| `startAt` | `PixelDatepickerValue` | `null` |  |
| `dateFilter` | `PixelDatepickerDateFilterFn | null` | `null` |  |
| `dateClass` | `PixelDatepickerDateClassFn | null` | `null` |  |
| `firstDayOfWeek` | `number` | `0` |  |
| `locale` | `string | undefined` | `undefined` |  |
| `startView` | `PixelDatepickerView` | `'day'` |  |
| `showOutsideDays` | `boolean` | `false` | When true, the calendar fills leading/trailing cells with adjacent-month dates. Defaults to false (current month only). |
| `openDirection` | `PixelDatepickerOpenDirection` | `'auto'` |  |
| `scrollBehavior` | `PixelDatepickerScrollBehavior` | `'close'` |  |
| `lockScroll` | `boolean` | `false` |  |
| `displayWith` | `(date: Date, locale?: string) => string` | `defaultFormatDate` | Formats the committed value in the field. Leave at the default (`defaultFormatDate`) to use `PIXEL_DATE_FORMATS` / adapter when provided. Per-control override wins over DI formats. Pair with `parseValue` when custom. |
| `parseValue` | `(text: string, locale?: string) => Date | null` | `defaultParseDate` | Parses typed field text into a `Date`. Leave at the default (`defaultParseDate`) to use `PIXEL_DATE_FORMATS` / adapter when provided. Used on blur / Enter commit (not on every keystroke). |
| `ariaLabel` | `string` | `''` |  |
| `chooseDateAriaLabel` | `string` | `'Choose date'` | Fallback accessible name for the calendar trigger when `label` is empty. |
| `showActions` | `boolean` | `false` | When true, calendar edits a draft; Apply commits and Cancel restores & closes. Default keeps immediate commit-on-select (current behavior). |
| `applyLabel` | `string` | `'Apply'` | Primary footer label when `showActions` is true. |
| `cancelLabel` | `string` | `'Cancel'` | Secondary footer label when `showActions` is true. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `Date | null` |  |
| `openChange` | `boolean` |  |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelDatepickerSize` | `'xs' | 'sm' | 'md' | 'lg'` |
| `PixelDatepickerLabelPosition` | `'top' | 'left' | 'floating' | 'hidden'` |
| `PixelDatepickerScrollBehavior` | `'close' | 'reposition' | 'block'` |
| `PixelDatepickerView` | `PixelCalendarView` |
| `PixelDatepickerValue` | `Date | string | number | null` |
| `PixelDatepickerDateFilterFn` | `(date: Date) => boolean` |
| `PixelDatepickerDateClassFn` | `( date: Date, ) => string | readonly string[] | null | undefined` |

### Exported interfaces

**`PixelDatepickerValidationMessages`**

```ts
interface PixelDatepickerValidationMessages {
  required?: string;
  dateParse?: string;
  dateFilter?: string;
  min?: string;
  max?: string;
  [errorCode: string]: string | undefined;
}
```

<!-- API-CONTRACT:END -->

## Behavior notes

- Only the datepicker host registers as the form control; the inner input reads the parent
  `NgControl` for **error styling** only. Display text is always driven by the datepicker via
  `[value]` (ancestor `NgControl` must not block that sync).
- **Default display** — locale short numeric via `defaultFormatDate` (Material-native style):
  en-US ≈ `M/D/YYYY`, en-GB ≈ `D/M/YYYY`. Not a fixed `MM/DD/YYYY` mask.
- **Typed input** — text is drafted while focused; the model commits on **blur** or **Enter**
  (calendar picks still commit immediately unless `showActions`). Invalid text stays visible
  with a parse/filter error; clearing via the clear control commits `null` immediately.
- ISO `YYYY-MM-DD` is always accepted by the default parser, alongside locale-ordered numerics
  and any `PIXEL_DATE_FORMATS.parse.dateInput` patterns.
- **Custom formats (DI)** — prefer `providePixelDateLocale({ strategy: 'localeId' })` with an
  explicit `LOCALE_ID`, or `providePixelDateLocale({ strategy: 'fixed', … })` /
  `provideNativeDateAdapter({ formats, locale })`. Per-control `displayWith` / `parseValue`
  override DI. Preset: `PIXEL_DD_MM_YYYY_FORMATS`.
- **Format hints** — `showFormatHint` (or `formatHint="DD/MM/YYYY"`) fills empty `helperText`
  so users know how to type (Material-style communication).
- **Disable modes** — `disabled` locks field + popup; `pickerDisabled` blocks only the calendar;
  `inputDisabled` greys the field but keeps the calendar; `readonly` blocks all edits.
- **Performance (`@defer`)** — `pixel-calendar` (and Apply/Cancel chrome) load via
  `@if (isOpen()) { @defer (on immediate) { … } }` with a sized `@placeholder`/`@loading`
  shell. A separate `@defer (when false; prefetch on hover(field))` warms the calendar chunk
  on hover without rendering. Closed pickers do not keep the calendar in the DOM. See
  `PERFORMANCE.md` Wave 2.

## Breaking changes

- **Default field format** changed from `dateStyle: 'medium'` (e.g. `Jul 15, 2024`) to locale
  **numeric** short date (e.g. `7/15/2024`). Apps that depended on medium prose should pass
  `displayWith` or provide custom `PIXEL_DATE_FORMATS`.
- **Typed dates** no longer update `value` / the form control on every keystroke; commit is on
  blur / Enter. Listeners that assumed live `valueChange` while typing should adjust.
