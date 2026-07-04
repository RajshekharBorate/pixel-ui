import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCardComponent } from 'pixel-ui';

@Component({
  selector: 'docs-card-appearances-example',
  imports: [PixelCardComponent],
  template: `
    <div class="grid">
      <pixel-card appearance="elevated" cardTitle="Elevated" cardSubtitle="Default appearance">
        Shadowed surface for content that floats above the page.
      </pixel-card>
      <pixel-card appearance="outlined" cardTitle="Outlined" cardSubtitle="Hairline border">
        Quiet container that keeps the page flat.
      </pixel-card>
      <pixel-card appearance="filled" cardTitle="Filled" cardSubtitle="Tonal background">
        Tonal surface for grouped secondary content.
      </pixel-card>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: var(--pixel-sys-space-md, 1rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardAppearancesExample {}
