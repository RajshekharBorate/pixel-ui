import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTabLinkComponent, PixelTabNavComponent } from 'pixel-ui';
import {
  TabsRoutedActivitySection,
  TabsRoutedOverviewSection,
  TabsRoutedSettingsSection,
} from './tabs-routed-sections';

type TabId = 'overview' | 'activity' | 'settings';

@Component({
  selector: 'docs-tabs-routed-example',
  imports: [
    PixelTabNavComponent,
    PixelTabLinkComponent,
    TabsRoutedOverviewSection,
    TabsRoutedActivitySection,
    TabsRoutedSettingsSection,
  ],
  template: `
    <pixel-tab-nav ariaLabel="Account sections (routed)">
      <a pixelTabLink [active]="active() === 'overview'" icon="dashboard" (click)="active.set('overview')">Overview</a>
      <a pixelTabLink [active]="active() === 'activity'" icon="timeline" (click)="active.set('activity')">Activity</a>
      <a pixelTabLink [active]="active() === 'settings'" icon="settings" (click)="active.set('settings')">Settings</a>
    </pixel-tab-nav>
    <div class="panel">
      @switch (active()) {
        @case ('overview') { <docs-tabs-routed-overview /> }
        @case ('activity') { <docs-tabs-routed-activity /> }
        @case ('settings') { <docs-tabs-routed-settings /> }
      }
    </div>
  `,
  styles: `
    .panel {
      margin-block-start: 1rem;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 16%, transparent);
      background: var(--pixel-sys-surface-container-low);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsRoutedExample {
  protected readonly active = signal<TabId>('overview');
}
