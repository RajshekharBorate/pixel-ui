import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelExpansionPanelComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-accordion-controlled-example',
  imports: [PixelExpansionPanelComponent, PixelButtonComponent],
  template: `
    <div class="controls">
      <pixel-button appearance="outline" size="sm" (click)="open.set(true)">Expand</pixel-button>
      <pixel-button appearance="outline" size="sm" (click)="open.set(false)">Collapse</pixel-button>
      <span class="hint">{{ open() ? 'expanded' : 'collapsed' }}</span>
    </div>

    <pixel-expansion-panel
      title="Advanced configuration"
      description="Optional settings for power users"
      icon="tune"
      [(expanded)]="open"
    >
      <p class="body">
        These settings are hidden by default. The chevron and buttons above stay in sync via
        two-way expanded binding.
      </p>
    </pixel-expansion-panel>
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

    .body {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionControlledExample {
  protected readonly open = signal(true);
}
