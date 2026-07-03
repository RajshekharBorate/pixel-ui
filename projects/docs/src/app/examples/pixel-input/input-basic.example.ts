import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-basic-example',
  standalone: true,
  imports: [PixelInputComponent],
  template: `
    <pixel-input
      label="City"
      placeholder="e.g. San Francisco"
      [value]="city()"
      helperText="Controlled value with explicit valueChange."
      (valueChange)="city.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputBasicExample {
  protected readonly city = signal('San Francisco');
}
