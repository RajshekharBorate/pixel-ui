import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-basic-example',
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <pixel-button appearance="outline" pixelTooltip="Delete this policy permanently">
      Delete policy
    </pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipBasicExample {}
