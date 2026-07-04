import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-sizes-example',
  imports: [PixelSelectComponent, PixelInputComponent],
  template: `
    <div class="stack">
      @for (size of sizes; track size) {
        <div class="row">
          <pixel-select
            [label]="'Select · ' + size.toUpperCase()"
            [size]="size"
            [options]="countries"
            [value]="$index + 1"
          />
          <pixel-input
            [label]="'Input · ' + size.toUpperCase()"
            [size]="size"
            [value]="'Germany'"
            [helperText]="'Reference input ' + size"
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
export class SelectSizesExample {
  protected readonly sizes = ['xs', 'sm', 'md', 'lg'] as const;

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];
}
