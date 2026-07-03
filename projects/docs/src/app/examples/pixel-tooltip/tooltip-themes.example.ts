import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelTooltipDirective,
  PixelTooltipTheme,
} from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-themes-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <div class="row">
      @for (theme of themes; track theme) {
        <pixel-button
          [pixelTooltip]="theme + ' theme tooltip'"
          [pixelTooltipTheme]="theme"
          pixelTooltipPosition="bottom"
        >
          {{ theme }}
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
export class TooltipThemesExample {
  protected readonly themes: readonly PixelTooltipTheme[] = ['inverse', 'surface', 'primary'];
}
