import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

interface SizeRow {
  readonly size: 'xs' | 'sm' | 'md' | 'lg';
  readonly value: WritableSignal<unknown[]>;
}

@Component({
  selector: 'docs-select-multi-sizes-example',
  standalone: true,
  imports: [PixelSelectComponent, PixelInputComponent],
  template: `
    <div class="stack">
      @for (entry of sizeRows; track entry.size) {
        <div class="row">
          <pixel-select
            [label]="'Multi · ' + entry.size.toUpperCase()"
            [size]="entry.size"
            mode="multiple"
            [options]="countries"
            [value]="entry.value()"
            [showTags]="true"
            [helperText]="'Chips ' + entry.size + '.'"
            (valueChange)="setMulti(entry.value, $event)"
          />
          <pixel-input
            [label]="'Input · ' + entry.size.toUpperCase()"
            [size]="entry.size"
            [value]="'Germany'"
            [helperText]="'Reference input ' + entry.size"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 36rem;
    }

    .row {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectMultiSizesExample {
  protected readonly sizeRows: readonly SizeRow[] = [
    { size: 'xs', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
    { size: 'sm', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
    { size: 'md', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
    { size: 'lg', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
  ];

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
    { value: 5, label: 'Canada' },
    { value: 6, label: 'Brazil' },
  ];

  protected setMulti(target: WritableSignal<unknown[]>, value: unknown): void {
    target.set(Array.isArray(value) ? value : []);
  }
}
