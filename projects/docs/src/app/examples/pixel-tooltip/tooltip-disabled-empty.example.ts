import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-disabled-empty-example',
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <div class="row">
      <pixel-button appearance="outline" pixelTooltip="This tooltip never shows" [pixelTooltipDisabled]="true">
        Disabled tooltip
      </pixel-button>
      <pixel-button appearance="outline" pixelTooltip="">Empty message</pixel-button>
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
export class TooltipDisabledEmptyExample {}
