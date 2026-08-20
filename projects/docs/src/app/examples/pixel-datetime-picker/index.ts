import { createDocExample } from '../../shared/example-source.util';
import { DatetimePickerBasicExample } from './datetime-picker-basic.example';
import { DatetimePickerFixedTimezoneExample } from './datetime-picker-fixed-timezone.example';
import { DatetimePickerReactiveFormExample } from './datetime-picker-reactive-form.example';

const DATETIME_PICKER_IMPORTS = [
  'PixelDatetimePickerComponent',
  'PIXEL_COMMON_TIMEZONES',
  'PIXEL_TIMEZONE',
] as const;

export const DATETIME_PICKER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic date + time + timezone',
    category: 'Setup',
    description:
      'Collects date, time, and IANA timezone, then emits a UTC ISO instant for API payloads.',
    component: DatetimePickerBasicExample,
    imports: [...DATETIME_PICKER_IMPORTS],
    html: `<pixel-datetime-picker
  dateLabel="Appointment date"
  timeLabel="Appointment time"
  timeZoneLabel="Appointment timezone"
  [value]="scheduledAt()"
  (valueChange)="scheduledAt.set($event)"
/>
<p class="output">UTC payload: <strong>{{ scheduledAt() || '—' }}</strong></p>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDatetimePickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datetime-picker-basic-example',
  imports: [PixelDatetimePickerComponent],
  templateUrl: './basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimePickerBasicExample {
  protected readonly scheduledAt = signal<string | null>(null);
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
  max-width: 52rem;
}`,
  }),
  createDocExample({
    id: 'fixed-timezone',
    title: 'Fixed business timezone',
    category: 'Behavior',
    description:
      'Hide timezone selector and force all conversions through a fixed IANA business zone.',
    component: DatetimePickerFixedTimezoneExample,
    imports: [...DATETIME_PICKER_IMPORTS],
    html: `<pixel-datetime-picker
  dateLabel="Webinar date"
  timeLabel="Webinar time"
  [hideTimeZone]="true"
  defaultTimeZone="America/New_York"
  [value]="scheduledAt()"
  (valueChange)="scheduledAt.set($event)"
/>`,
    typescript: `export class DatetimePickerFixedTimezoneExample {
  protected readonly scheduledAt = signal<string | null>(null);
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
  max-width: 44rem;
}`,
  }),
  createDocExample({
    id: 'reactive-form',
    title: 'Reactive form',
    category: 'Forms',
    description:
      'ControlValueAccessor integration with required validation and direct UTC payload binding.',
    component: DatetimePickerReactiveFormExample,
    imports: [...DATETIME_PICKER_IMPORTS, 'ReactiveFormsModule', 'PixelButtonComponent'],
    html: `<form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
  <pixel-datetime-picker
    formControlName="scheduledAt"
    [required]="true"
    dateLabel="Start date"
    timeLabel="Start time"
    timeZoneLabel="Timezone"
  />
  <div class="actions">
    <pixel-button type="submit" appearance="solid" [disabled]="form.invalid">Save</pixel-button>
    <pixel-button type="button" appearance="outline" (click)="form.reset()">Clear</pixel-button>
  </div>
</form>`,
    typescript: `protected readonly form = new FormGroup({
  scheduledAt: new FormControl<string | null>(null, Validators.required),
});`,
    scss: `.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 56rem;
}`,
  }),
] as const;
