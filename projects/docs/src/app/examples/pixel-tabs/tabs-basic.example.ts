import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-basic-example',
  imports: [PixelTabsComponent, PixelTabComponent],
  template: `
    <pixel-tabs ariaLabel="Account sections">
      <pixel-tab label="Overview" icon="dashboard">
        <div class="panel">
          <h3>Overview</h3>
          <p>Summary of account activity, plan, and usage for the current billing period.</p>
        </div>
      </pixel-tab>
      <pixel-tab label="Activity" icon="timeline" [badge]="12">
        <div class="panel">
          <h3>Activity</h3>
          <p>A chronological feed of sign-ins, configuration changes, and exports.</p>
        </div>
      </pixel-tab>
      <pixel-tab label="Settings" icon="settings" badge="New" badgeState="active">
        <div class="panel">
          <h3>Settings</h3>
          <p>Manage notifications, security, and team permissions.</p>
        </div>
      </pixel-tab>
    </pixel-tabs>
  `,
  styles: `
    .panel h3 {
      margin: 0 0 0.35rem;
      font-size: 1rem;
    }

    .panel p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsBasicExample {}
