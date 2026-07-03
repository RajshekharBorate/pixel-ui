import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleSize,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-switch-sizes-example',
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
          [label]="'Size ' + size"
          [size]="size"
          [checked]="size === 'md'"
        >
          <ng-template pixelToggleCheckedIcon>
            <pixel-toggle-thumb-icon icon="check" />
          </ng-template>
          <ng-template pixelToggleUncheckedIcon>
            <pixel-toggle-thumb-icon icon="remove" />
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
export class ToggleSwitchSizesExample {
  protected readonly sizes: readonly PixelToggleSize[] = ['xs', 'sm', 'md', 'lg'];
}
