import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-label-only-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <div class="stack">
      <pixel-select
        [searchable]="true"
        label="Department"
        [options]="options"
        [value]="single()"
        (valueChange)="single.set($event)"
      />
      <pixel-select
        [searchable]="true"
        [showSelectAll]="true"
        label="Assignees"
        mode="multiple"
        [options]="options"
        [value]="multi()"
        [showTags]="true"
        (valueChange)="setMulti($event)"
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
export class SelectLabelOnlyExample {
  protected readonly single = signal<unknown | null>(2);
  protected readonly multi = signal<unknown[]>([2, 3]);

  protected readonly options: readonly PixelSelectOption[] = [
    { value: 1, label: 'Engineering' },
    { value: 2, label: 'Design' },
    { value: 3, label: 'Product' },
    { value: 4, label: 'Marketing' },
    { value: 5, label: 'Support' },
    { value: 6, label: 'Operations' },
  ];

  protected setMulti(value: unknown): void {
    this.multi.set(Array.isArray(value) ? value : []);
  }
}
