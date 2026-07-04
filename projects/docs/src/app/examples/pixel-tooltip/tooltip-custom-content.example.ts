import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-custom-content-example',
  imports: [PixelButtonComponent, PixelTooltipDirective],
  template: `
    <div class="row">
      <pixel-button
        appearance="solid"
        pixelTooltip="Tooltip design"
        pixelTooltipTheme="primary"
        pixelTooltipPosition="bottom"
        pixelTooltipArrow
      >
        Primary + arrow
      </pixel-button>

      <pixel-button
        appearance="outline"
        [pixelTooltipContent]="featureTip"
        pixelTooltipTheme="surface"
        pixelTooltipPosition="bottom"
      >
        Upgrade (rich)
      </pixel-button>
    </div>
    <p class="helper">Last action: <strong>{{ lastAction() }}</strong></p>

    <ng-template #featureTip>
      <div class="tip-card">
        <span class="tip-card__badge">
          <span class="material-symbols-outlined" aria-hidden="true">lock</span>
          Premium feature
        </span>
        <p class="tip-card__body">
          Upgrade to a business plan today to unlock this premium feature for <strong>20% off</strong>.
        </p>
        <pixel-button size="sm" appearance="solid" (click)="onAction('Upgrade clicked')">
          Upgrade
        </pixel-button>
      </div>
    </ng-template>
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
    }

    .tip-card {
      display: grid;
      gap: 0.5rem;
      max-width: 14rem;
    }

    .tip-card__badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tip-card__body {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipCustomContentExample {
  protected readonly lastAction = signal('—');

  protected onAction(label: string): void {
    this.lastAction.set(label);
  }
}
