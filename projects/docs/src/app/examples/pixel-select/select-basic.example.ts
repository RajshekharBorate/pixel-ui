import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-basic-example',
  imports: [PixelSelectComponent],
  template: `
    <pixel-select
      label="Country"
      [options]="countries"
      [value]="country()"
      helperText="Single select closes on choose."
      (valueChange)="country.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectBasicExample {
  protected readonly country = signal<unknown | null>(3);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];
}
