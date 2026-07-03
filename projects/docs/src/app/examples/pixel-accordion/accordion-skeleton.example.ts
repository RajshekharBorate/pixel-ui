import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelExpansionPanelComponent } from 'pixel-ui';

@Component({
  selector: 'docs-accordion-skeleton-example',
  standalone: true,
  imports: [PixelExpansionPanelComponent, PixelCheckboxComponent],
  template: `
    <div class="controls">
      <pixel-checkbox
        label="Show skeleton"
        [checked]="skeleton()"
        (checkedChange)="skeleton.set($event)"
      />
    </div>

    <div class="stack">
      <!-- Title only -->
      <pixel-expansion-panel
        title="Account settings"
        [showSkeleton]="skeleton()"
      >
        Manage your account preferences.
      </pixel-expansion-panel>

      <!-- Title + description -->
      <pixel-expansion-panel
        title="Notifications"
        description="Email and push preferences"
        [showSkeleton]="skeleton()"
      >
        Configure your notification channels.
      </pixel-expansion-panel>

      <!-- Title + icon -->
      <pixel-expansion-panel
        title="Security"
        icon="lock"
        [showSkeleton]="skeleton()"
      >
        Password and two-factor authentication.
      </pixel-expansion-panel>

      <!-- Title + icon + description -->
      <pixel-expansion-panel
        title="Billing"
        description="Plans and payment methods"
        icon="credit_card"
        [showSkeleton]="skeleton()"
      >
        View invoices and update payment info.
      </pixel-expansion-panel>
    </div>
  `,
  styles: `
    .controls { margin-block-end: 1rem; }
    .stack { display: flex; flex-direction: column; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionSkeletonExample {
  protected readonly skeleton = signal(true);
}
