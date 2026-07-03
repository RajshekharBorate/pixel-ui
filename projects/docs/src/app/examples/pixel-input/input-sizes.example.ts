import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelInputComponent, PixelInputSize } from 'pixel-ui';

interface SizeDemo {
  readonly size: PixelInputSize;
  readonly label: string;
}

@Component({
  selector: 'docs-input-sizes-example',
  standalone: true,
  imports: [PixelInputComponent],
  template: `
    <div class="grid">
      @for (item of sizes; track item.size) {
        <pixel-input
          [label]="item.label"
          [size]="item.size"
          [value]="'Size ' + item.size"
          helperText="Padding and type scale follow the size token."
        />
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      max-width: 36rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputSizesExample {
  protected readonly sizes: readonly SizeDemo[] = [
    { size: 'xs', label: 'Extra small' },
    { size: 'sm', label: 'Small' },
    { size: 'md', label: 'Medium' },
    { size: 'lg', label: 'Large' },
  ];
}
