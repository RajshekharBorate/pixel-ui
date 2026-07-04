import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelTooltipDirective,
  PixelTooltipTrigger,
} from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-triggers-example',
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <div class="row">
      @for (trigger of triggers; track trigger) {
        <pixel-button
          appearance="outline"
          [pixelTooltip]="'Trigger: ' + trigger"
          [pixelTooltipTrigger]="trigger"
        >
          {{ trigger }}
        </pixel-button>
      }
    </div>
    <p class="helper">Tab through the buttons to test focus-driven tooltips.</p>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .helper {
      margin: 0.75rem 0 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipTriggersExample {
  protected readonly triggers: readonly PixelTooltipTrigger[] = ['hover', 'focus', 'both'];
}
