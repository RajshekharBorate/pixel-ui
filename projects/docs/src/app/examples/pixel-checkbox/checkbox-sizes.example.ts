import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxSize } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-sizes-example',
  standalone: true,
  imports: [PixelCheckboxComponent],
  template: `
    <div class="row">
      @for (size of sizes; track size) {
        <pixel-checkbox
          [size]="size"
          [checked]="size === 'md' || size === 'lg'"
          [label]="'Size ' + size"
          helperText="Responsive density"
        />
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem 1.5rem;
      align-items: flex-start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxSizesExample {
  protected readonly sizes: readonly PixelCheckboxSize[] = ['xs', 'sm', 'md', 'lg'];
}
