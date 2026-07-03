# pixel-date-range-picker

Accessible date **range** field with a pop-over calendar. Uses a single composed **`pixel-input`** showing `Start date – End date` (same field shell as `pixel-datepicker`).

Works with a parent `FormGroup` that exposes `start` and `end` controls (names are configurable).

## Basic usage

```html
<form [formGroup]="stayForm">
  <pixel-date-range-picker
    label="Stay dates"
    [formGroup]="stayForm"
    [min]="minDate"
    [max]="maxDate"
    [dateFilter]="weekdaysOnly"
    [required]="true"
    [validationMessages]="{
      required: 'Both start and end dates are required.',
      dateFilter: 'Choose a weekday.',
    }"
  />
</form>
```

```ts
stayForm = new FormGroup({
  start: new FormControl<Date | null>(null, Validators.required),
  end: new FormControl<Date | null>(null, Validators.required),
});
```

## Key inputs

| Input | Default | Description |
| --- | --- | --- |
| `formGroup` | *(required)* | Parent group containing start/end controls. |
| `startControlName` / `endControlName` | `'start'` / `'end'` | Control names inside the group. |
| `placeholder` | `'Start date – End date'` | Placeholder for the combined field. |
| `size` | `'md'` | `xs` \| `sm` \| `md` \| `lg`. |
| `labelPosition` | `'top'` | `top` \| `left` \| `floating` \| `hidden`. |
| `min` / `max` | `null` | Inclusive selectable range. |
| `dateFilter` | `null` | Predicate returning `false` for blocked days. |
| `validationMessages` | `{}` | Error copy for parse/filter/**and child control validators**. |

## Typed input

Enter a range with an en-dash separator, e.g. `6/10/2024 – 6/14/2024`. A single date before the separator updates only the start control.

## Validation UX

- Typed parse/filter errors show via `errorOverride` on the inner input.
- **`required` / `min` / `max` on the start/end `FormControl`s** surface once touched or dirty.

## Calendar interaction

1. Default strategy: first click sets start, second click sets end (panel closes).
2. Hover preview while choosing the end date.
3. Custom strategies via `PIXEL_DATE_RANGE_SELECTION_STRATEGY` or `[selectionStrategy]`.

### Custom selection strategy

Implement `PixelDateRangeSelectionStrategy` with `selectionFinished` and `createPreview`, then provide it:

```ts
import {
  provideNativeDateAdapter,
  providePixelDateRangeSelectionStrategy,
  PixelFiveDayRangeSelectionStrategy,
} from 'pixel-ui';

@Component({
  providers: [
    provideNativeDateAdapter(),
    ...providePixelDateRangeSelectionStrategy(PixelFiveDayRangeSelectionStrategy),
  ],
  template: `<pixel-date-range-picker [formGroup]="form" />`,
})
export class BookingRangeField {}
```

Or pass a strategy instance per picker:

```html
<pixel-date-range-picker [formGroup]="form" [selectionStrategy]="myStrategy" />
```

The included `PixelFiveDayRangeSelectionStrategy` selects a five-day window centered on the clicked/hovered day (Material’s canonical example).

## Related

- **`pixel-datepicker`** — single-date field (CVA + `formControlName`)
- **`pixel-calendar`** — shared day/month/year grid
