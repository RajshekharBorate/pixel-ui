import { createDocExample } from '../../shared/example-source.util';
import { TimepickerAdvancedExample } from './timepicker-advanced.example';
import { TimepickerBasicExample } from './timepicker-basic.example';
import { TimepickerFormatsExample } from './timepicker-formats.example';
import { TimepickerReactiveFormExample } from './timepicker-reactive-form.example';
import { TimepickerStatesExample } from './timepicker-states.example';

const TIMEPICKER_IMPORTS = ['PixelTimepickerComponent'] as const;

export const TIMEPICKER_EXAMPLES = [
  createDocExample({
    id: 'input',
    title: 'Basic timepicker',
    category: 'Setup',
    description: 'Default input variant — large scrollable segments for hour, minute, and AM/PM in the panel.',
    component: TimepickerBasicExample,
    imports: [...TIMEPICKER_IMPORTS],
    html: `<pixel-timepicker
  label="Meeting time"
  helperText="Select a time for the meeting."
  [(value)]="time"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTimepickerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class TimepickerBasicExample {
  protected readonly time = signal('09:30');
}`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'clock',
    title: 'Advanced clock dial',
    category: 'Setup',
    description: 'variant="clock" shows a Material Design M2-style circular clock dial — tap or drag the hand to pick hour then minute. Supports both 12-hour (AM/PM) and 24-hour (inner ring) formats.',
    component: TimepickerAdvancedExample,
    imports: [...TIMEPICKER_IMPORTS],
    html: `<pixel-timepicker
  label="Alarm"
  variant="clock"
  format="12"
  [(value)]="alarm"
/>`,
    typescript: `protected readonly alarm = signal('07:00');`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'formats',
    title: '12-hour vs 24-hour',
    category: 'Variants',
    description: 'Both pickers share the same canonical "HH:mm" value — only the display format differs.',
    component: TimepickerFormatsExample,
    imports: [...TIMEPICKER_IMPORTS],
    html: `<pixel-timepicker label="12-hour" format="12" [(value)]="time" />
<pixel-timepicker label="24-hour" format="24" [(value)]="time" />`,
    typescript: `protected readonly time = signal('14:30');`,
    scss: `:host { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),

  createDocExample({
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'disabled prevents interaction.',
    component: TimepickerStatesExample,
    imports: [...TIMEPICKER_IMPORTS],
    html: `<pixel-timepicker label="Default"  value="09:00" />
<pixel-timepicker label="Disabled" value="09:00" [disabled]="true" />`,
    typescript: `@Component({ /* … */ }) export class TimepickerStatesExample {}`,
    scss: `:host { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),

  createDocExample({
    id: 'reactive-form',
    title: 'Reactive form',
    category: 'Forms',
    description: 'formControlName binding with required validation. The canonical "HH:mm" string maps directly to Angular form values.',
    component: TimepickerReactiveFormExample,
    imports: [...TIMEPICKER_IMPORTS, 'PixelTimepickerValidationMessages'],
    html: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <pixel-timepicker
    label="Start time (required)"
    [required]="true"
    formControlName="start"
    [validationMessages]="messages"
  />
  <pixel-timepicker label="End time" format="24" formControlName="end" />
  <pixel-button type="submit" [disabled]="form.invalid">Save</pixel-button>
</form>`,
    typescript: `protected readonly form = new FormGroup({
  start: new FormControl<string | null>(null, Validators.required),
  end:   new FormControl<string | null>('17:00'),
});`,
    scss: `.form { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),
] as const;
