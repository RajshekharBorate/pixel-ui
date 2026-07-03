import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-overflow-example',
  standalone: true,
  imports: [PixelTooltipDirective],
  template: `
    <div class="cells">
      <div class="cell" pixelTooltip="" pixelTooltipShowOnOverflow>Short label</div>
      <div class="cell" pixelTooltip="" pixelTooltipShowOnOverflow>
        A considerably longer label that does not fit within the cell and is clipped with an ellipsis
      </div>
    </div>
  `,
  styles: `
    .cells {
      display: grid;
      gap: 0.5rem;
      max-width: 16rem;
    }

    .cell {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 20%, transparent);
      background: var(--pixel-sys-surface-container-low);
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipOverflowExample {}
