import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelTooltipDirective,
  PixelTooltipPosition,
  PixelTooltipTheme,
} from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-arrow-example',
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <div class="section">
      <p class="label">Arrow on each position</p>
      <div class="row">
        @for (position of positions; track position) {
          <pixel-button
            appearance="tonal"
            [pixelTooltip]="'Arrow: ' + position"
            [pixelTooltipPosition]="position"
            pixelTooltipArrow
          >
            {{ position }}
          </pixel-button>
        }
      </div>
    </div>
    <div class="section">
      <p class="label">Arrow with themes</p>
      <div class="row">
        @for (theme of themes; track theme) {
          <pixel-button
            appearance="outline"
            [pixelTooltip]="theme + ' + arrow'"
            [pixelTooltipTheme]="theme"
            pixelTooltipPosition="bottom"
            pixelTooltipArrow
          >
            {{ theme }}
          </pixel-button>
        }
      </div>
    </div>
  `,
  styles: `
    .section + .section {
      margin-block-start: 1rem;
    }

    .label {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipArrowExample {
  protected readonly positions: readonly PixelTooltipPosition[] = ['top', 'bottom', 'left', 'right'];
  protected readonly themes: readonly PixelTooltipTheme[] = ['inverse', 'surface', 'primary'];
}
