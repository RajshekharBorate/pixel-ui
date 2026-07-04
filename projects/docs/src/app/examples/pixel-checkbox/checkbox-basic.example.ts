import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-basic-example',
  imports: [PixelCheckboxComponent],
  template: `
    <pixel-checkbox
      label="Receive product updates"
      helperText="Uses checked and checkedChange without two-way binding."
      [checked]="newsletter()"
      (checkedChange)="newsletter.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxBasicExample {
  protected readonly newsletter = signal(true);
}
