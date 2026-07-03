import { createDocExample } from '../../shared/example-source.util';
import { AvatarSkeletonExample } from './avatar-skeleton.example';
import { AvatarBasicInitialsExample } from './avatar-basic-initials.example';
import { AvatarPresenceStatusExample } from './avatar-presence-status.example';
import { AvatarAvatarGroupsExample } from './avatar-avatar-groups.example';
import { AvatarNotificationBadgesExample } from './avatar-notification-badges.example';
import { AvatarVariantsExample } from './avatar-variants.example';
import { AvatarSizesShapesExample } from './avatar-sizes-shapes.example';
import { AvatarIconPlaceholderExample } from './avatar-icon-placeholder.example';
import { AvatarClickableExample } from './avatar-clickable.example';
import { AvatarLoadingFallbackExample } from './avatar-loading-fallback.example';

export const AVATAR_EXAMPLES = [
  createDocExample({
    id: 'basic-initials',
    title: 'Initials avatars',
    category: 'Setup',
    description: 'Initials are derived from name with a deterministic accent color.',
    component: AvatarBasicInitialsExample,
    imports: ['PixelAvatarComponent'],
    html: `@for (person of people; track person) {
  <pixel-avatar [name]="person" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-basic-initials-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-basic-initials.example.html',
  styleUrl: './avatar-basic-initials.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarBasicInitialsExample {
  protected readonly people = ['Ada Brown', 'Carl Davis', 'Eva Frost', 'Gita Harper'];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'presence-status',
    title: 'Presence status',
    category: 'States',
    description: 'Online, away, busy, and offline indicators on avatars.',
    component: AvatarPresenceStatusExample,
    imports: ['PixelAvatarComponent'],
    html: `@for (sample of statuses; track sample.name) {
  <div class="item">
    <pixel-avatar [name]="sample.name" [status]="sample.status" size="lg" />
    <span class="label">{{ sample.status }}</span>
  </div>
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, type PixelAvatarStatus } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-presence-status-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-presence-status.example.html',
  styleUrl: './avatar-presence-status.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarPresenceStatusExample {
  protected readonly statuses: readonly { status: PixelAvatarStatus; name: string }[] = [
    { status: 'online', name: 'Sam Wilson' },
    { status: 'away', name: 'Maya Chen' },
    { status: 'busy', name: 'Leo Park' },
    { status: 'offline', name: 'Nora Diaz' },
  ];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pixel-sys-outline);
}`,
  }),
  createDocExample({
    id: 'avatar-groups',
    title: 'Avatar groups',
    category: 'Layout',
    description: 'Overlapping stacks with overflow and expandable hover spread.',
    component: AvatarAvatarGroupsExample,
    imports: ['PixelAvatarGroupComponent'],
    html: `<pixel-avatar-group [avatars]="team" [max]="4" ariaLabel="Project team" />
<pixel-avatar-group [avatars]="team" [max]="4" [expandable]="true" [showStatus]="true" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarGroupComponent, type PixelAvatarData } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-avatar-groups-example',
  standalone: true,
  imports: [PixelAvatarGroupComponent],
  templateUrl: './avatar-avatar-groups.example.html',
  styleUrl: './avatar-avatar-groups.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarAvatarGroupsExample {
  protected readonly team: readonly PixelAvatarData[] = [
    { name: 'Sam Wilson', status: 'online' },
    { name: 'Maya Chen', status: 'busy' },
    { name: 'Infra Team', initials: 'IT', color: '#0b8043' },
    { name: 'Leo Park' },
    { name: 'Nora Diaz' },
    { name: 'Omar Reed' },
    { name: 'Priya Rao' },
  ];
}`,
    scss: `:host {
  display: grid;
  gap: 1.25rem;
}`,
  }),
  createDocExample({
    id: 'notification-badges',
    title: 'Notification badges',
    category: 'Behavior',
    description: 'Count badges overflow at badgeMax and attach to avatars.',
    component: AvatarNotificationBadgesExample,
    imports: ['PixelAvatarComponent'],
    html: `@for (count of badgeCounts; track count) {
  <pixel-avatar name="Gita Harper" [badgeCount]="count" [badgeMax]="99" size="lg" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-notification-badges-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-notification-badges.example.html',
  styleUrl: './avatar-notification-badges.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarNotificationBadgesExample {
  protected readonly badgeCounts = [1, 6, 10, 120];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'variants',
    title: 'Variants',
    category: 'Variants',
    description: 'Soft, solid, and outline fill treatments.',
    component: AvatarVariantsExample,
    imports: ['PixelAvatarComponent'],
    html: `@for (variant of variants; track variant) {
  <pixel-avatar name="Ada Brown" [variant]="variant" size="lg" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, type PixelAvatarVariant } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-variants-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-variants.example.html',
  styleUrl: './avatar-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarVariantsExample {
  protected readonly variants: readonly PixelAvatarVariant[] = ['soft', 'solid', 'outline'];
}`,
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
    description: 'Four sizes and circle or rounded shapes.',
    component: AvatarSizesShapesExample,
    imports: ['PixelAvatarComponent'],
    html: `@for (size of sizes; track size) {
  <pixel-avatar name="Carl Davis" [size]="size" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent, type PixelAvatarSize } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-sizes-shapes-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-sizes-shapes.example.html',
  styleUrl: './avatar-sizes-shapes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarSizesShapesExample {
  protected readonly sizes: readonly PixelAvatarSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'icon-placeholder',
    title: 'Icon & placeholder',
    category: 'States',
    description: 'Fallback chain from icon to default placeholder glyph.',
    component: AvatarIconPlaceholderExample,
    imports: ['PixelAvatarComponent'],
    html: `<pixel-avatar icon="support_agent" size="lg" />
<pixel-avatar icon="smart_toy" variant="solid" size="lg" />
<pixel-avatar size="lg" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-icon-placeholder-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-icon-placeholder.example.html',
  styleUrl: './avatar-icon-placeholder.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarIconPlaceholderExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'clickable',
    title: 'Clickable avatars',
    category: 'Behavior',
    description: 'Interactive avatars as buttons with Enter and Space activation.',
    component: AvatarClickableExample,
    imports: ['PixelAvatarComponent'],
    html: `<pixel-avatar
  name="Leo Park"
  status="online"
  size="lg"
  [clickable]="true"
  (avatarClick)="onAvatarClick($event.name)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-clickable-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-clickable.example.html',
  styleUrl: './avatar-clickable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarClickableExample {
  protected readonly clickLog = signal('');

  protected onAvatarClick(name: string): void {
    this.clickLog.set('Clicked: ' + name);
  }
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'loading-fallback',
    title: 'Loading & image fallback',
    category: 'States',
    description: 'Skeleton placeholders while loading and initials when images fail.',
    component: AvatarLoadingFallbackExample,
    imports: ['PixelAvatarComponent'],
    html: `<pixel-avatar [loading]="true" size="lg" />
<pixel-avatar name="Broken Image" imageUrl="https://invalid.example/missing.png" size="lg" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-avatar-loading-fallback-example',
  standalone: true,
  imports: [PixelAvatarComponent],
  templateUrl: './avatar-loading-fallback.example.html',
  styleUrl: './avatar-loading-fallback.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarLoadingFallbackExample {}`,
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
    description: 'Replace individual avatars or a whole group with circle placeholders while user data is loading.',
    component: AvatarSkeletonExample,
    imports: ['PixelAvatarComponent', 'PixelAvatarGroupComponent'],
    html: `<pixel-avatar size="md" name="Jane" [showSkeleton]="skeleton()" />
<pixel-avatar-group [avatars]="avatars" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAvatarComponent, PixelAvatarGroupComponent, type PixelAvatarData } from 'pixel-ui';

@Component({ /* … */ })
export class AvatarSkeletonExample {
  protected readonly skeleton = signal(true);
  protected readonly avatars: PixelAvatarData[] = [
    { name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }, { name: 'Dave' },
  ];
}`,
    scss: `/* No styles required */`,
  }),
] as const;
