import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-multiple-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <div class="stack">
      <pixel-select
        label="Regions"
        mode="multiple"
        [options]="countries"
        [value]="selected()"
        [showTags]="true"
        helperText="Multi mode keeps the panel open after each selection."
        (valueChange)="setSelected($event)"
      />
      <pixel-select
        label="Selected count"
        mode="multiple"
        [options]="countries"
        [value]="selected()"
        [showSelectedCount]="true"
        [showTags]="false"
        (valueChange)="setSelected($event)"
      />
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectMultipleExample {
  protected readonly selected = signal<unknown[]>([2, 3]);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];

  protected setSelected(value: unknown): void {
    this.selected.set(Array.isArray(value) ? value : []);
  }
}
