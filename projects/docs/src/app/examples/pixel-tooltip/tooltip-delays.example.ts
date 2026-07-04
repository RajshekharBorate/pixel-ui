import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-delays-example',
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <pixel-button
      appearance="solid"
      pixelTooltip="Surface theme with custom show and hide delays"
      pixelTooltipTheme="surface"
      [pixelTooltipShowDelay]="300"
      [pixelTooltipHideDelay]="100"
      [pixelTooltipMaxWidth]="'16rem'"
    >
      Hover or focus me
    </pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDelaysExample {}
