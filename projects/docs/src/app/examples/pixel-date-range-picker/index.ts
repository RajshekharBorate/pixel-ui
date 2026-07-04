import { createDocExample } from '../../shared/example-source.util';
import { DateRangePickerSkeletonExample } from './date-range-picker-skeleton.example';
import { DateRangeBasicExample } from './date-range-basic.example';
import { DateRangeBookingWindowExample } from './date-range-booking-window.example';
import { DateRangeCustomStrategyExample } from './date-range-custom-strategy.example';
import { DateRangeLabelPositionsExample } from './date-range-label-positions.example';
import { DateRangeSizesExample } from './date-range-sizes.example';
import { DateRangeWeekdaysExample } from './date-range-weekdays.example';

const DATE_RANGE_IMPORTS = [
  'PixelDateRangePickerComponent',
  'nativeDateAdapterProviders',
  'provideNativeDateAdapter',
  'providePixelDateRangeSelectionStrategy',
  'PixelFiveDayRangeSelectionStrategy',
] as const;

export const DATE_RANGE_PICKER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic range picker',
    category: 'Setup',
    description:
      'Bind a FormGroup with start and end controls. Requires nativeDateAdapterProviders().',
    component: DateRangeBasicExample,
    imports: [...DATE_RANGE_IMPORTS, 'ReactiveFormsModule', 'PixelButtonComponent'],
    html: `<form class="form" [formGroup]="form" (ngSubmit)="submit()">
  <pixel-date-range-picker
    label="Stay dates"
    [formGroup]="form"
    [required]="true"
    [validationMessages]="{
      required: 'Both start and end dates are required.',
    }"
  />
  <pixel-button appearance="solid" buttonType="submit">Apply dates</pixel-button>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelButtonComponent,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-basic-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent, PixelButtonComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeBasicExample {
  protected readonly form = new FormGroup({
    start: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    end: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });
}`,
  }),
  createDocExample({
    id: 'booking-window',
    title: 'Booking window',
    category: 'Behavior',
    description: 'Limit selectable dates with min and max on the range picker.',
    component: DateRangeBookingWindowExample,
    imports: [...DATE_RANGE_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-date-range-picker
  label="Booking window"
  [formGroup]="form"
  [min]="today"
  [max]="maxBookingDate"
  helperText="Select dates within the next 30 days."
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-booking-window-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './booking-window.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeBookingWindowExample {
  protected readonly today = new Date();
  protected readonly maxBookingDate = new Date(Date.now() + 30 * 86_400_000);

  protected readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}`,
  }),
  createDocExample({
    id: 'weekdays',
    title: 'Weekdays only',
    category: 'Behavior',
    description: 'Use dateFilter to disable weekends while choosing a range.',
    component: DateRangeWeekdaysExample,
    imports: [...DATE_RANGE_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-date-range-picker
  label="Business travel"
  [formGroup]="form"
  [dateFilter]="weekdaysOnly"
  helperText="Weekends are disabled in the calendar."
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-weekdays-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './weekdays.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeWeekdaysExample {
  protected readonly weekdaysOnly = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };
}`,
  }),
  createDocExample({
    id: 'custom-strategy',
    title: 'Custom selection strategy',
    category: 'Advanced',
    description: 'Provide a five-day window strategy alongside the native date adapter.',
    component: DateRangeCustomStrategyExample,
    imports: [...DATE_RANGE_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-date-range-picker
  label="Five-day window"
  [formGroup]="form"
  [selectionStrategy]="fiveDayStrategy"
  helperText="Selecting a start date locks a five-day range."
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  provideNativeDateAdapter,
  providePixelDateRangeSelectionStrategy,
  PixelDateRangePickerComponent,
  PixelFiveDayRangeSelectionStrategy,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-custom-strategy-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [
    ...provideNativeDateAdapter(),
    ...providePixelDateRangeSelectionStrategy(PixelFiveDayRangeSelectionStrategy),
  ],
  templateUrl: './custom-strategy.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeCustomStrategyExample {
  protected readonly fiveDayStrategy = inject(PixelFiveDayRangeSelectionStrategy);
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Range picker sizes',
    category: 'Sizes',
    description: 'Same size tokens as pixel-datepicker: xs, sm, md, and lg.',
    component: DateRangeSizesExample,
    imports: [...DATE_RANGE_IMPORTS, 'ReactiveFormsModule'],
    html: `<div class="grid">
  @for (size of sizes; track size) {
    <pixel-date-range-picker [label]="size + ' size'" [formGroup]="forms[size]" [size]="size" />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
  type PixelDatepickerSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-sizes-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './sizes.example.html',
  styleUrl: './sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeSizesExample {
  protected readonly sizes: readonly PixelDatepickerSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  max-width: 22rem;
}`,
  }),
  createDocExample({
    id: 'label-positions',
    title: 'Range picker label positions',
    category: 'Layout',
    description: 'labelPosition: top, left, floating, or hidden.',
    component: DateRangeLabelPositionsExample,
    imports: [...DATE_RANGE_IMPORTS, 'ReactiveFormsModule'],
    html: `<div class="grid">
  @for (position of labelPositions; track position) {
    <pixel-date-range-picker
      [label]="position + ' label'"
      [formGroup]="forms[position]"
      [labelPosition]="position"
      [ariaLabel]="position === 'hidden' ? 'Date range with hidden label' : ''"
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelDateRangePickerComponent,
  type PixelDatepickerLabelPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-date-range-label-positions-example',
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './label-positions.example.html',
  styleUrl: './label-positions.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeLabelPositionsExample {
  protected readonly labelPositions: readonly PixelDatepickerLabelPosition[] = [
    'top',
    'left',
    'floating',
    'hidden',
  ];
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  max-width: 24rem;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show a field placeholder while the range form or available dates are being loaded.',
    component: DateRangePickerSkeletonExample,
    imports: ['PixelDateRangePickerComponent'],
    html: `<pixel-date-range-picker label="Booking period" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDateRangePickerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DateRangePickerSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
