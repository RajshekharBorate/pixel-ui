import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCardComponent } from 'pixel-ui';

@Component({
  selector: 'docs-card-hover-example',
  imports: [PixelCardComponent],
  template: `
    <div class="grid">
      <pixel-card
        appearance="elevated"
        hoverEffect="lift"
        cardTitle="Lift on hover"
        cardSubtitle="hoverEffect=&quot;lift&quot;"
      >
        KPI-style push-up: translates slightly and raises the shadow.
      </pixel-card>
      <pixel-card
        appearance="elevated"
        hoverEffect="elevate"
        cardTitle="Elevate on hover"
        cardSubtitle="hoverEffect=&quot;elevate&quot;"
      >
        Stronger shadow and border only — no vertical motion.
      </pixel-card>
      <pixel-card appearance="elevated" cardTitle="No hover effect" cardSubtitle="Default">
        Resting elevated border + shadow; hover stays quiet unless interactive.
      </pixel-card>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: var(--pixel-sys-space-md, 1rem);
      padding-block: var(--pixel-sys-space-sm, 0.5rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHoverExample {}
