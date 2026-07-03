import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'docs-tabs-routed-overview',
  template: `
    <h3 class="section-title">Overview</h3>
    <p class="section-copy">
      Loaded by the router at <code>overview</code>. The active tab follows the URL — deep-linkable
      and compatible with browser back/forward.
    </p>
  `,
  styles: `
    .section-title {
      margin: 0 0 0.35rem;
      font-size: 1rem;
    }

    .section-copy {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsRoutedOverviewSection {}

@Component({
  standalone: true,
  selector: 'docs-tabs-routed-activity',
  template: `
    <h3 class="section-title">Activity</h3>
    <p class="section-copy">
      A different routed component at <code>activity</code>. Navigate directly or via the tab bar —
      the highlight stays in sync.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsRoutedActivitySection {}

@Component({
  standalone: true,
  selector: 'docs-tabs-routed-settings',
  template: `
    <h3 class="section-title">Settings</h3>
    <p class="section-copy">
      Route at <code>settings</code>. In production each section can be lazy-loaded with
      <code>loadComponent</code>.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsRoutedSettingsSection {}
