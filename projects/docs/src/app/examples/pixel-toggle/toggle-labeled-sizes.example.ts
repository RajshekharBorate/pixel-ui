import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleSize,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-labeled-sizes-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: `
    <div class="stack">
      @for (size of sizes; track size) {
        <pixel-toggle
          switchAppearance="labeled"
          [label]="'Size ' + size"
          [size]="size"
          onLabel="ON"
          offLabel="OFF"
          [checked]="size === 'md'"
        >
          <ng-template pixelToggleCheckedIcon>
            <pixel-toggle-thumb-icon icon="check" />
          </ng-template>
          <ng-template pixelToggleUncheckedIcon>
            <pixel-toggle-thumb-icon icon="close" />
          </ng-template>
        </pixel-toggle>
      }
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleLabeledSizesExample {
  protected readonly sizes: readonly PixelToggleSize[] = ['xs', 'sm', 'md', 'lg'];
}
