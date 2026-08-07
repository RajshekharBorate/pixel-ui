import { createDocExample } from '../../shared/example-source.util';
import { DatepickerSkeletonExample } from './datepicker-skeleton.example';
import { DatepickerActionsExample } from './datepicker-actions.example';
import { DatepickerBasicExample } from './datepicker-basic.example';
import { DatepickerDisabledReadonlyExample } from './datepicker-disabled-readonly.example';
import { DatepickerLabelPositionsExample } from './datepicker-label-positions.example';
import { DatepickerLocaleExample } from './datepicker-locale.example';
import { DatepickerCustomFormatsExample } from './datepicker-custom-formats.example';
import { DatepickerMinMaxFilterExample } from './datepicker-min-max-filter.example';
import { DatepickerReactiveFormExample } from './datepicker-reactive-form.example';
import { DatepickerSizesExample } from './datepicker-sizes.example';
import { DatepickerStartAtDateClassExample } from './datepicker-start-at-date-class.example';
import { DatepickerStartViewsExample } from './datepicker-start-views.example';
import { DatepickerTemplateDrivenExample } from './datepicker-template-driven.example';

const DATEPICKER_IMPORTS = [
  'PixelDatepickerComponent',
  'nativeDateAdapterProviders',
  'provideNativeDateAdapter',
] as const;

export const DATEPICKER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic datepicker',
    category: 'Setup',
    description:
      'Controlled value binding. Register nativeDateAdapterProviders() at component or app scope.',
    component: DatepickerBasicExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<pixel-datepicker
  label="Event date"
  [value]="value()"
  (valueChange)="value.set($event)"
  helperText="Register the native date adapter at component or app scope."
/>
<p class="value">Selected: {{ displayValue() }}</p>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-basic-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './basic.example.html',
  styleUrl: './basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerBasicExample {
  protected readonly value = signal<Date | null>(new Date());

  protected displayValue(): string {
    const date = this.value();
    return date ? date.toDateString() : '—';
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'actions',
    title: 'Cancel & Apply',
    category: 'Behavior',
    description:
      'Opt-in showActions keeps the calendar open while drafting. Apply commits; Cancel restores.',
    component: DatepickerActionsExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<pixel-datepicker
  label="Appointment"
  showActions
  helperText="Pick a day, then Apply — Cancel restores the previous value."
  [value]="value()"
  (valueChange)="value.set($event)"
/>`,
    typescript: `export class DatepickerActionsExample {
  protected readonly value = signal<Date | null>(null);
}`,
  }),
  createDocExample({
    id: 'reactive-form',
    title: 'Reactive forms',
    category: 'Forms',
    description: 'Implements ControlValueAccessor with validation messages on touched controls.',
    component: DatepickerReactiveFormExample,
    imports: [...DATEPICKER_IMPORTS, 'PixelButtonComponent', 'ReactiveFormsModule'],
    html: `<form class="form" [formGroup]="form" (ngSubmit)="submit()">
  <pixel-datepicker
    formControlName="startDate"
    label="Start date"
    [required]="true"
    [validationMessages]="{ required: 'Start date is required.' }"
  />
  <pixel-button appearance="solid" buttonType="submit">Submit</pixel-button>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  nativeDateAdapterProviders,
  PixelButtonComponent,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-reactive-form-example',
  imports: [ReactiveFormsModule, PixelDatepickerComponent, PixelButtonComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './reactive-form.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerReactiveFormExample {
  protected readonly form = new FormGroup({
    startDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    }
  }
}`,
  }),
  createDocExample({
    id: 'min-max-filter',
    title: 'Min, max, and dateFilter',
    category: 'Behavior',
    description: 'Constrain selectable dates with min/max and a custom dateFilter predicate.',
    component: DatepickerMinMaxFilterExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<pixel-datepicker
  label="Shift date"
  [min]="today"
  [max]="maxDate"
  [dateFilter]="weekdaysOnly"
  helperText="Weekdays only, within the next 30 days."
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-min-max-filter-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './min-max-filter.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerMinMaxFilterExample {
  protected readonly today = new Date();
  protected readonly maxDate = new Date(Date.now() + 30 * 86_400_000);

  protected readonly weekdaysOnly = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };
}`,
  }),
  createDocExample({
    id: 'locale',
    title: 'Locale and formatting',
    category: 'Advanced',
    description: 'Configure locale, week start, startView, and a custom displayWith formatter.',
    component: DatepickerLocaleExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<pixel-datepicker
  label="Date of birth"
  locale="en-GB"
  [firstDayOfWeek]="1"
  startView="year"
  [displayWith]="longFormatter"
  helperText="en-GB locale, Monday week start, year-first navigation."
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-locale-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders({ locale: 'en-GB' })],
  templateUrl: './locale.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerLocaleExample {
  protected readonly longFormatter = (date: Date): string =>
    new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(date);
}`,
  }),
  createDocExample({
    id: 'custom-formats',
    title: 'Custom formats (DI)',
    category: 'Advanced',
    description:
      'App-wide parse/display via provideNativeDateAdapter + PIXEL_DD_MM_YYYY_FORMATS. showFormatHint communicates DD/MM/YYYY.',
    component: DatepickerCustomFormatsExample,
    imports: [...DATEPICKER_IMPORTS, 'PIXEL_DD_MM_YYYY_FORMATS'],
    html: `<pixel-datepicker
  label="Invoice date"
  showFormatHint
  [value]="value()"
  (valueChange)="value.set($event)"
/>
<p class="value">Selected: {{ displayValue() }}</p>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PIXEL_DD_MM_YYYY_FORMATS,
  provideNativeDateAdapter,
  PixelDatepickerComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-custom-formats-example',
  imports: [PixelDatepickerComponent],
  providers: [
    ...provideNativeDateAdapter({
      locale: 'en-GB',
      formats: PIXEL_DD_MM_YYYY_FORMATS,
    }),
  ],
  templateUrl: './custom-formats.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerCustomFormatsExample {
  protected readonly value = signal<Date | null>(new Date(2024, 5, 15));

  protected displayValue(): string {
    const date = this.value();
    return date ? date.toDateString() : '—';
  }
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'size tokens: xs, sm, md (default), and lg.',
    component: DatepickerSizesExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<div class="grid">
  @for (size of sizes; track size) {
    <pixel-datepicker [size]="size" [label]="size + ' size'" placeholder="Select a date" />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelDatepickerComponent,
  type PixelDatepickerSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-sizes-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './sizes.example.html',
  styleUrl: './sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerSizesExample {
  protected readonly sizes: readonly PixelDatepickerSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'label-positions',
    title: 'Label positions',
    category: 'Layout',
    description: 'labelPosition: top, left, floating, or hidden (pair with ariaLabel).',
    component: DatepickerLabelPositionsExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<div class="grid">
  @for (position of labelPositions; track position) {
    <pixel-datepicker
      [labelPosition]="position"
      [label]="position + ' label'"
      ariaLabel="Date with hidden label"
      placeholder="Select a date"
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  nativeDateAdapterProviders,
  PixelDatepickerComponent,
  type PixelDatepickerLabelPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-label-positions-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './label-positions.example.html',
  styleUrl: './label-positions.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerLabelPositionsExample {
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
    id: 'start-views',
    title: 'Month and year selection',
    category: 'Behavior',
    description: 'startView chooses which grid the panel opens with: day, month, or year.',
    component: DatepickerStartViewsExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<pixel-datepicker label="Default (day view)" helperText="Click the month/year label." />
<pixel-datepicker label="Opens on month view" startView="month" />
<pixel-datepicker label="Opens on year view" startView="year" helperText="Great for birth dates." />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-start-views-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './start-views.example.html',
  styleUrl: './start-views.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerStartViewsExample {}`,
    scss: `:host {
  display: grid;
  gap: 1rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'disabled-readonly',
    title: 'Disabled modes',
    category: 'States',
    description:
      'Material-style splits: completely disabled, popup-only disabled, input-only disabled, plus readonly (no edits).',
    component: DatepickerDisabledReadonlyExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<pixel-datepicker label="Completely disabled" [value]="today" disabled showFormatHint />
<pixel-datepicker label="Popup disabled" [value]="today" pickerDisabled showFormatHint />
<pixel-datepicker label="Input disabled" [value]="today" inputDisabled showFormatHint />
<pixel-datepicker label="Readonly (no edits)" [value]="today" readonly />`,
    typescript: `export class DatepickerDisabledReadonlyExample {
  protected readonly today = new Date();
}`,
  }),
  createDocExample({
    id: 'start-at-date-class',
    title: 'dateFilter, startAt, and dateClass',
    category: 'Advanced',
    description: 'Material parity: filter days, open on a month when empty, and style individual days.',
    component: DatepickerStartAtDateClassExample,
    imports: [...DATEPICKER_IMPORTS],
    html: `<pixel-datepicker
  label="Weekdays only"
  [dateFilter]="weekdaysOnly"
  [validationMessages]="{ dateFilter: 'Choose a weekday.' }"
/>
<pixel-datepicker label="Opens on Jan 2020" [startAt]="startAt" />
<pixel-datepicker label="Payday highlight" [dateClass]="paydayDateClass" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-start-at-date-class-example',
  imports: [PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './start-at-date-class.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerStartAtDateClassExample {
  protected readonly startAt = new Date(2020, 0, 1);

  protected readonly weekdaysOnly = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  protected readonly paydayDateClass = (date: Date): string | null =>
    date.getDate() === 15 ? 'demo-payday' : null;
}`,
  }),
  createDocExample({
    id: 'template-driven',
    title: 'Template-driven forms',
    category: 'Forms',
    description: 'Bind with [(ngModel)] and name — same CVA and validation as reactive forms.',
    component: DatepickerTemplateDrivenExample,
    imports: [...DATEPICKER_IMPORTS, 'FormsModule'],
    html: `<pixel-datepicker
  name="birthDate"
  label="Birth date"
  [(ngModel)]="birthDate"
  [required]="true"
  [validationMessages]="{ required: 'Birth date is required.' }"
/>
<p class="readout">Model value: <strong>{{ birthDate ? birthDate.toDateString() : '—' }}</strong></p>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { nativeDateAdapterProviders, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-template-driven-example',
  imports: [FormsModule, PixelDatepickerComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './template-driven.example.html',
  styleUrl: './template-driven.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerTemplateDrivenExample {
  protected birthDate: Date | null = null;
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show a field placeholder while the form or date constraints are being loaded.',
    component: DatepickerSkeletonExample,
    imports: ['PixelDatepickerComponent'],
    html: `<pixel-datepicker label="Start date" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDatepickerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DatepickerSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
