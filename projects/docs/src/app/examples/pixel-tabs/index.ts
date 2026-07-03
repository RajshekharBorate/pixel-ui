import { createDocExample } from '../../shared/example-source.util';
import { TabsSkeletonExample } from './tabs-skeleton.example';
import { TabsBasicExample } from './tabs-basic.example';
import { TabsClosableExample } from './tabs-closable.example';
import { TabsControlledExample } from './tabs-controlled.example';
import { TabsDisabledExample } from './tabs-disabled.example';
import { TabsLazyExample } from './tabs-lazy.example';
import { TabsPillExample } from './tabs-pill.example';
import { TabsRichLabelExample } from './tabs-rich-label.example';
import { TabsRoutedExample } from './tabs-routed.example';

const TABS_IMPORTS = ['PixelTabsComponent', 'PixelTabComponent'] as const;
const TABS_NAV_IMPORTS = [
  'PixelTabNavComponent',
  'PixelTabLinkComponent',
  'RouterLink',
  'RouterOutlet',
] as const;

export const TABS_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Underline tabs',
    category: 'Setup',
    description:
      'Default underline appearance with icons, numeric badges, and animated active indicator.',
    component: TabsBasicExample,
    imports: [...TABS_IMPORTS],
    html: `<pixel-tabs ariaLabel="Account sections">
  <pixel-tab label="Overview" icon="dashboard">
    <div class="panel">…</div>
  </pixel-tab>
  <pixel-tab label="Activity" icon="timeline" [badge]="12">…</pixel-tab>
  <pixel-tab label="Settings" icon="settings" badge="New" badgeState="active">…</pixel-tab>
</pixel-tabs>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-basic-example',
  standalone: true,
  imports: [PixelTabsComponent, PixelTabComponent],
  templateUrl: './tabs-basic.example.html',
  styleUrl: './tabs-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsBasicExample {}`,
    scss: `.panel p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
}`,
  }),
  createDocExample({
    id: 'pill',
    title: 'Pill appearance',
    category: 'Variants',
    description: 'Use appearance="pill" with align="center" for segmented-control styling.',
    component: TabsPillExample,
    imports: [...TABS_IMPORTS],
    html: `<pixel-tabs appearance="pill" align="center" ariaLabel="Plan tiers">
  <pixel-tab label="Monthly">…</pixel-tab>
  <pixel-tab label="Yearly">…</pixel-tab>
  <pixel-tab label="Lifetime">…</pixel-tab>
</pixel-tabs>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({
  selector: 'docs-tabs-pill-example',
  standalone: true,
  imports: [PixelTabsComponent, PixelTabComponent],
  templateUrl: './tabs-pill.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPillExample {}`,
  }),
  createDocExample({
    id: 'closable',
    title: 'Closable & addable',
    category: 'Behavior',
    description:
      'Mark tabs closable and set addable on the group. Handle tabClose and tabAdd to own the tab list.',
    component: TabsClosableExample,
    imports: [...TABS_IMPORTS],
    html: `<pixel-tabs
  [(selectedIndex)]="selectedIndex"
  [addable]="true"
  (tabAdd)="addTab()"
  (tabClose)="closeTab($event)"
>
  @for (tab of tabs(); track tab.id) {
    <pixel-tab [label]="tab.label" [closable]="true">…</pixel-tab>
  }
</pixel-tabs>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({ /* … */ })
export class TabsClosableExample {
  protected readonly tabs = signal([{ id: 1, label: 'Document 1' }]);
  protected readonly selectedIndex = signal(0);

  protected addTab(): void { /* push a tab, select it */ }
  protected closeTab(index: number): void { /* remove tab, clamp index */ }
}`,
  }),
  createDocExample({
    id: 'controlled',
    title: 'Controlled selection',
    category: 'Behavior',
    description: 'Two-way bind selectedIndex to drive the active tab from outside the group.',
    component: TabsControlledExample,
    imports: [...TABS_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-tabs [(selectedIndex)]="selectedIndex" ariaLabel="Controlled tabs">
  <pixel-tab label="First">…</pixel-tab>
  <pixel-tab label="Second">…</pixel-tab>
  <pixel-tab label="Third">…</pixel-tab>
</pixel-tabs>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({ /* … */ })
export class TabsControlledExample {
  protected readonly selectedIndex = signal(0);
}`,
    scss: `.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin-block-end: 1rem;
}`,
  }),
  createDocExample({
    id: 'routed',
    title: 'Routed tabs (URL-driven)',
    category: 'Advanced',
    description:
      'pixel-tab-nav + pixelTabLink pair with router-outlet: the active tab follows the URL and sections load on demand.',
    component: TabsRoutedExample,
    imports: [...TABS_NAV_IMPORTS],
    html: `<pixel-tab-nav ariaLabel="Account sections (routed)">
  <a pixelTabLink routerLink="overview" icon="dashboard">Overview</a>
  <a pixelTabLink routerLink="activity" icon="timeline">Activity</a>
  <a pixelTabLink routerLink="settings" icon="settings">Settings</a>
</pixel-tab-nav>
<div class="panel"><router-outlet /></div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet, Routes, provideRouter } from '@angular/router';
import { PixelTabLinkComponent, PixelTabNavComponent } from 'pixel-ui';

const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: OverviewSection },
  { path: 'activity', component: ActivitySection },
];

@Component({
  providers: [provideRouter(routes)],
  imports: [PixelTabNavComponent, PixelTabLinkComponent, RouterLink, RouterOutlet],
  templateUrl: './routed.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsRoutedExample {}`,
    scss: `.panel {
  margin-block-start: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
}`,
  }),
  createDocExample({
    id: 'lazy',
    title: 'Lazy rendering',
    category: 'Advanced',
    description:
      'With [lazy]="true" panel content is created only the first time a tab is activated — ideal for heavy panels.',
    component: TabsLazyExample,
    imports: [...TABS_IMPORTS],
    html: `<pixel-tabs [lazy]="true" ariaLabel="Lazy tabs">
  <pixel-tab label="Summary">…rendered on first visit…</pixel-tab>
  <pixel-tab label="Reports">…heavy panel…</pixel-tab>
</pixel-tabs>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({ /* … */ })
export class TabsLazyExample {
  private readonly renderStamps = new Map<string, string>();
  protected renderStamp(label: string): string { /* memoize first-render time */ }
}`,
  }),
  createDocExample({
    id: 'rich-label',
    title: 'Rich label templates',
    category: 'Layout',
    description:
      'Project ng-template pixelTabLabel for badges, counts, or any markup beyond plain label + icon.',
    component: TabsRichLabelExample,
    imports: [...TABS_IMPORTS, 'PixelTabLabelDirective'],
    html: `<pixel-tab>
  <ng-template pixelTabLabel>
    <span class="material-symbols-outlined">inbox</span>
    Inbox <span class="badge">{{ inboxCount() }}</span>
  </ng-template>
  …panel…
</pixel-tab>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTabComponent, PixelTabLabelDirective, PixelTabsComponent } from 'pixel-ui';

@Component({ /* … */ })
export class TabsRichLabelExample {
  protected readonly inboxCount = signal(12);
}`,
    scss: `.badge {
  min-width: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
}`,
  }),
  createDocExample({
    id: 'disabled',
    title: 'Disabled tab',
    category: 'States',
    description:
      'A disabled tab is skipped during keyboard navigation and cannot be selected until re-enabled.',
    component: TabsDisabledExample,
    imports: [...TABS_IMPORTS],
    html: `<pixel-tabs ariaLabel="Steps">
  <pixel-tab label="Details">…</pixel-tab>
  <pixel-tab label="Payment">…</pixel-tab>
  <pixel-tab label="Review" [disabled]="true">…locked…</pixel-tab>
</pixel-tabs>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({ /* … */ })
export class TabsDisabledExample {}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show tab header placeholders while navigation config or remote content is loading. Skeleton count mirrors the projected tab count automatically.',
    component: TabsSkeletonExample,
    imports: ['PixelTabsComponent', 'PixelTabComponent'],
    html: `<pixel-tabs [showSkeleton]="skeleton()" [skeletonCount]="3">
  <pixel-tab label="Overview">Overview content</pixel-tab>
  <pixel-tab label="Analytics">Analytics content</pixel-tab>
  <pixel-tab label="Settings">Settings content</pixel-tab>
</pixel-tabs>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

@Component({ /* … */ })
export class TabsSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
