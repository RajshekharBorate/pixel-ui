import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  PixelAccordionComponent,
  PixelButtonComponent,
  PixelExpansionPanelComponent,
  type PixelAccordionVariant,
} from 'pixel-ui';

@Component({
  selector: 'docs-accordion-multi-example',
  standalone: true,
  imports: [PixelAccordionComponent, PixelExpansionPanelComponent, PixelButtonComponent],
  template: `
    <div class="controls">
      <pixel-button appearance="outline" size="sm" (click)="expandAll()">Expand all</pixel-button>
      <pixel-button appearance="outline" size="sm" (click)="collapseAll()">Collapse all</pixel-button>
    </div>

    <pixel-accordion #accordion [multi]="true">
      <pixel-expansion-panel title="Profile" icon="person">
        <p class="body">Update your display name, avatar, and time zone.</p>
      </pixel-expansion-panel>
      <pixel-expansion-panel title="Notifications" icon="notifications_active">
        <p class="body">Choose between real-time alerts, daily digests, or full silence.</p>
      </pixel-expansion-panel>
      <pixel-expansion-panel title="Privacy" icon="lock">
        <p class="body">Control who can see your profile and what data is shared.</p>
      </pixel-expansion-panel>
    </pixel-accordion>
  `,
  styles: `
    .controls {
      display: flex;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }

    .body {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionMultiExample {
  private readonly accordionRef = viewChild<PixelAccordionComponent>('accordion');

  protected expandAll(): void {
    this.accordionRef()?.expandAll();
  }

  protected collapseAll(): void {
    this.accordionRef()?.collapseAll();
  }
}
