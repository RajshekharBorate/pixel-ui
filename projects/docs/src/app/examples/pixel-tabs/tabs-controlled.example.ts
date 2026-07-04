import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-controlled-example',
  imports: [PixelButtonComponent, PixelTabsComponent, PixelTabComponent],
  template: `
    <div class="controls">
      <pixel-button appearance="outline" size="sm" (click)="selectedIndex.set(0)">First</pixel-button>
      <pixel-button appearance="outline" size="sm" (click)="selectedIndex.set(1)">Second</pixel-button>
      <pixel-button appearance="outline" size="sm" (click)="selectedIndex.set(2)">Third</pixel-button>
      <span class="hint">Index: {{ selectedIndex() }}</span>
    </div>

    <pixel-tabs [(selectedIndex)]="selectedIndex" ariaLabel="Controlled tabs">
      <pixel-tab label="First">
        <p class="panel">First panel.</p>
      </pixel-tab>
      <pixel-tab label="Second">
        <p class="panel">Second panel.</p>
      </pixel-tab>
      <pixel-tab label="Third">
        <p class="panel">Third panel.</p>
      </pixel-tab>
    </pixel-tabs>
  `,
  styles: `
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 0.75rem;
      align-items: center;
      margin-block-end: 1rem;
    }

    .hint {
      font-size: 0.8125rem;
      color: var(--pixel-sys-outline);
    }

    .panel {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsControlledExample {
  protected readonly selectedIndex = signal(0);
}
