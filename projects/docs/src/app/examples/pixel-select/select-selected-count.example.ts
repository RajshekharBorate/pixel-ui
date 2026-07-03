import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-selected-count-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <pixel-select
      label="Selected count mode"
      mode="multiple"
      [options]="countries"
      [value]="selected()"
      [showSelectedCount]="true"
      [showTags]="false"
      (valueChange)="setSelected($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSelectedCountExample {
  protected readonly selected = signal<unknown[]>([2, 4, 6]);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
    { value: 5, label: 'Canada' },
    { value: 6, label: 'Brazil' },
  ];

  protected setSelected(value: unknown): void {
    this.selected.set(Array.isArray(value) ? value : []);
  }
}
