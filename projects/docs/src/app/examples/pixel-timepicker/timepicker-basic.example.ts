import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTimepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-timepicker-basic-example',
  standalone: true,
  imports: [PixelTimepickerComponent],
  template: `
    <pixel-timepicker
      label="Meeting time"
      helperText="Select a time for the meeting."
      [(value)]="time"
    />
    <p class="output">Value: <strong>{{ time() || '—' }}</strong></p>
  `,
  styles: `.output { margin-block-start: 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimepickerBasicExample {
  protected readonly time = signal('09:30');
}
