import { createDocExample } from '../../shared/example-source.util';
import { BadgeSkeletonExample } from './badge-skeleton.example';
import { BadgeBasicExample } from './badge-basic.example';
import { BadgeStatusPillsExample } from './badge-status-pills.example';
import { BadgeDotIndicatorsExample } from './badge-dot-indicators.example';
import { BadgeLiveCountsExample } from './badge-live-counts.example';
import { BadgeOverflowValuesExample } from './badge-overflow-values.example';
import { BadgeVariantsExample } from './badge-variants.example';
import { BadgeSizesShapesExample } from './badge-sizes-shapes.example';
import { BadgeIconBadgesExample } from './badge-icon-badges.example';
import { BadgeAvatarBadgesExample } from './badge-avatar-badges.example';
import { BadgeClickableRemovableExample } from './badge-clickable-removable.example';

export const BADGE_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Count badges',
    category: 'Setup',
    description: 'Numeric counters anchored to icons with top-right overlay placement.',
    component: BadgeBasicExample,
    imports: ['PixelBadgeComponent'],
    html: `<pixel-badge [value]="3" type="count" position="top-right">
  <span class="material-symbols-outlined">videocam</span>
</pixel-badge>
<pixel-badge [value]="10" type="count" position="top-right">
  <span class="material-symbols-outlined">chat</span>
</pixel-badge>
<pixel-badge [value]="99" type="count" position="top-right">
  <span class="material-symbols-outlined">groups</span>
</pixel-badge>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-basic-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-basic.example.html',
  styleUrl: './badge-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeBasicExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'status-pills',
    title: 'Status pills',
    category: 'Variants',
    description: 'Standalone status badges pair a semantic dot with a label.',
    component: BadgeStatusPillsExample,
    imports: ['PixelBadgeComponent'],
    html: `@for (status of statuses; track status.label) {
  <pixel-badge
    type="status"
    [state]="status.state"
    [label]="status.label"
    position="inline"
  />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent, type PixelBadgeState } from 'pixel-ui';

@Component({
  selector: 'docs-badge-status-pills-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-status-pills.example.html',
  styleUrl: './badge-status-pills.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeStatusPillsExample {
  protected readonly statuses: readonly { state: PixelBadgeState; label: string }[] = [
    { state: 'success', label: 'Completed' },
    { state: 'warning', label: 'Pending' },
    { state: 'error', label: 'Failed' },
    { state: 'info', label: 'Draft' },
    { state: 'active', label: 'Active' },
  ];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'dot-indicators',
    title: 'Dot indicators',
    category: 'Variants',
    description: 'Compact dot and pulse indicators for unread activity or presence.',
    component: BadgeDotIndicatorsExample,
    imports: ['PixelBadgeComponent'],
    html: `<pixel-badge type="dot" state="error" position="top-right">
  <span class="material-symbols-outlined">notifications</span>
</pixel-badge>
<pixel-badge type="dot" state="success" position="top-right">
  <span class="material-symbols-outlined">chat</span>
</pixel-badge>
<pixel-badge type="pulse" state="info" position="top-right" [pulse]="true">
  <span class="material-symbols-outlined">groups</span>
</pixel-badge>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-dot-indicators-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-dot-indicators.example.html',
  styleUrl: './badge-dot-indicators.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDotIndicatorsExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'live-counts',
    title: 'Live updates',
    category: 'Behavior',
    description: 'Signal-driven counts with animated pop and overflow at max.',
    component: BadgeLiveCountsExample,
    imports: ['PixelBadgeComponent', 'PixelButtonComponent'],
    html: `<pixel-badge
  [value]="liveCount()"
  [max]="99"
  type="notification"
  [animated]="true"
  position="top-right"
>
  <span class="material-symbols-outlined">notifications_active</span>
</pixel-badge>
<pixel-button appearance="outline" size="sm" (click)="increment()">+1</pixel-button>
<span class="meta">Live: {{ liveCount() }}</span>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBadgeComponent, PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-live-counts-example',
  imports: [PixelBadgeComponent, PixelButtonComponent],
  templateUrl: './badge-live-counts.example.html',
  styleUrl: './badge-live-counts.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeLiveCountsExample {
  protected readonly liveCount = signal(3);

  protected increment(): void {
    this.liveCount.update((value) => value + 1);
  }
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.meta {
  font-size: 0.8125rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 70%, transparent);
}`,
  }),
  createDocExample({
    id: 'overflow-values',
    title: 'Overflow values',
    category: 'Behavior',
    description: 'Values above max collapse to max+ (default 99, here 999).',
    component: BadgeOverflowValuesExample,
    imports: ['PixelBadgeComponent'],
    html: `@for (value of overflowValues; track value) {
  <pixel-badge [value]="value" [max]="999" type="notification" position="inline" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-overflow-values-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-overflow-values.example.html',
  styleUrl: './badge-overflow-values.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeOverflowValuesExample {
  protected readonly overflowValues = [1, 10, 99, 120, 1500, 12000] as const;
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'variants',
    title: 'Variants',
    category: 'Variants',
    description: 'Solid, outline, and filled label badge treatments.',
    component: BadgeVariantsExample,
    imports: ['PixelBadgeComponent'],
    html: `<pixel-badge type="label" variant="solid" state="active" label="Solid" position="inline" />
<pixel-badge type="label" variant="outline" state="active" label="Outline" position="inline" />
<pixel-badge type="label" variant="filled" state="success" label="Filled success" position="inline" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-variants-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-variants.example.html',
  styleUrl: './badge-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeVariantsExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'sizes-shapes',
    title: 'Sizes & shapes',
    category: 'Sizes',
    description: 'Five sizes (xs–xl) and circle or pill shapes.',
    component: BadgeSizesShapesExample,
    imports: ['PixelBadgeComponent'],
    html: `@for (size of sizes; track size) {
  <pixel-badge [value]="8" [size]="size" type="count" position="inline" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent, type PixelBadgeSize } from 'pixel-ui';

@Component({
  selector: 'docs-badge-sizes-shapes-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-sizes-shapes.example.html',
  styleUrl: './badge-sizes-shapes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeSizesShapesExample {
  protected readonly sizes: readonly PixelBadgeSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'icon-badges',
    title: 'Icon badges',
    category: 'Layout',
    description: 'Glyph badges and counts anchored to buttons.',
    component: BadgeIconBadgesExample,
    imports: ['PixelBadgeComponent', 'PixelButtonComponent'],
    html: `<pixel-badge type="icon" icon="check" state="success" position="inline" />
<pixel-badge [value]="4" position="top-right">
  <pixel-button appearance="tonal" leadingIcon="inbox">Inbox</pixel-button>
</pixel-badge>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBadgeComponent, PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-icon-badges-example',
  imports: [PixelBadgeComponent, PixelButtonComponent],
  templateUrl: './badge-icon-badges.example.html',
  styleUrl: './badge-icon-badges.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeIconBadgesExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'avatar-badges',
    title: 'Avatar badges',
    category: 'Layout',
    description: 'Presence dots and counts overlaid on avatars.',
    component: BadgeAvatarBadgesExample,
    imports: ['PixelAvatarComponent', 'PixelBadgeComponent'],
    html: `<pixel-badge type="dot" state="success" size="lg" position="bottom-right">
  <pixel-avatar name="Ada Brooks" size="lg" [showStatus]="false" [showBadge]="false" />
</pixel-badge>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-avatar-badges-example',
  imports: [PixelAvatarComponent, PixelBadgeComponent],
  templateUrl: './badge-avatar-badges.example.html',
  styleUrl: './badge-avatar-badges.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeAvatarBadgesExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'clickable-removable',
    title: 'Clickable & removable',
    category: 'Behavior',
    description: 'Interactive badges with keyboard support and remove affordance.',
    component: BadgeClickableRemovableExample,
    imports: ['PixelBadgeComponent'],
    html: `<pixel-badge
  type="label"
  label="View 5 alerts"
  state="active"
  position="inline"
  [clickable]="true"
  (badgeClick)="onBadgeClick('View 5 alerts')"
/>
<pixel-badge
  type="label"
  label="Dismissible"
  state="info"
  position="inline"
  [removable]="true"
  (badgeRemove)="onRemove()"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({
  selector: 'docs-badge-clickable-removable-example',
  imports: [PixelBadgeComponent],
  templateUrl: './badge-clickable-removable.example.html',
  styleUrl: './badge-clickable-removable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeClickableRemovableExample {
  protected readonly removed = signal(false);

  protected onBadgeClick(label: string): void {}
  protected onRemove(): void {
    this.removed.set(true);
  }
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show badge shape placeholders while count data or status is loading. Dot/status/pulse types render a circle; count/label/notification types render a pill. Shape and size are inherited from the badge inputs.',
    component: BadgeSkeletonExample,
    imports: ['PixelBadgeComponent'],
    html: `<pixel-badge type="count" position="inline" label="12" [showSkeleton]="skeleton()" />
<pixel-badge type="dot" position="inline" [showSkeleton]="skeleton()" />
<pixel-badge type="label" position="inline" label="Beta" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBadgeComponent } from 'pixel-ui';

@Component({ /* … */ })
export class BadgeSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
