import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-searchable-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <pixel-select
      label="Department"
      [searchable]="true"
      [options]="departments"
      [value]="department()"
      helperText="Client-side filtering with panel search input."
      (valueChange)="department.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSearchableExample {
  protected readonly department = signal<unknown | null>(2);

  protected readonly departments: readonly PixelSelectOption[] = [
    { value: 1, label: 'Engineering' },
    { value: 2, label: 'Design' },
    { value: 3, label: 'Product' },
    { value: 4, label: 'Marketing' },
    { value: 5, label: 'Support' },
  ];
}
