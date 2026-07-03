import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelTooltipDirective,
  PixelTooltipPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-positions-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <div class="row">
      @for (position of positions; track position) {
        <pixel-button
          appearance="tonal"
          [pixelTooltip]="'Position: ' + position"
          [pixelTooltipPosition]="position"
        >
          {{ position }}
        </pixel-button>
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipPositionsExample {
  protected readonly positions: readonly PixelTooltipPosition[] = [
    'top',
    'bottom',
    'left',
    'right',
  ];
}
