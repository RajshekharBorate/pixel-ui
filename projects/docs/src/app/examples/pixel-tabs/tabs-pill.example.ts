import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-pill-example',
  standalone: true,
  imports: [PixelTabsComponent, PixelTabComponent],
  template: `
    <pixel-tabs appearance="pill" align="center" ariaLabel="Plan tiers">
      <pixel-tab label="Monthly">
        <p class="panel">Billed every month. Cancel anytime.</p>
      </pixel-tab>
      <pixel-tab label="Yearly">
        <p class="panel">Two months free when billed annually.</p>
      </pixel-tab>
      <pixel-tab label="Lifetime">
        <p class="panel">One-time payment, perpetual access.</p>
      </pixel-tab>
    </pixel-tabs>
  `,
  styles: `
    .panel {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPillExample {}
