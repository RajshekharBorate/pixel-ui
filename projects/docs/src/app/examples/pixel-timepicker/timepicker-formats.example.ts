import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTimepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-timepicker-formats-example',
  standalone: true,
  imports: [PixelTimepickerComponent],
  template: `
    <pixel-timepicker label="12-hour (AM/PM)" format="12" [(value)]="time" helperText="Displays as h:mm AM/PM." />
    <pixel-timepicker label="24-hour"         format="24" [(value)]="time" helperText="Displays as HH:mm." />
    <p class="output">Canonical value: <strong>{{ time() }}</strong></p>
  `,
  styles: `:host { display: flex; flex-direction: column; gap: 1.25rem; max-width: 22rem; }
  .output { font-size: 0.875rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimepickerFormatsExample {
  protected readonly time = signal('14:30');
}
