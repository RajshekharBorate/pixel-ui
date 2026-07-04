import { createDocExample } from '../../shared/example-source.util';
import { CardAppearancesExample } from './card-appearances.example';
import { CardInteractiveExample } from './card-interactive.example';
import { CardMediaSkeletonExample } from './card-media-skeleton.example';

export const CARD_EXAMPLES = [
  createDocExample({
    id: 'appearances',
    title: 'Appearances',
    category: 'Basics',
    description: 'Elevated (default), outlined, and filled surfaces with the built-in header.',
    component: CardAppearancesExample,
    imports: ['PixelCardComponent'],
    html: `<pixel-card appearance="elevated" cardTitle="Elevated" cardSubtitle="Default appearance">
  Shadowed surface for content that floats above the page.
</pixel-card>
<pixel-card appearance="outlined" cardTitle="Outlined" cardSubtitle="Hairline border">
  Quiet container that keeps the page flat.
</pixel-card>
<pixel-card appearance="filled" cardTitle="Filled" cardSubtitle="Tonal background">
  Tonal surface for grouped secondary content.
</pixel-card>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCardComponent } from 'pixel-ui';

@Component({ /* … */ })
export class CardAppearancesExample {}`,
  }),
  createDocExample({
    id: 'interactive',
    title: 'Interactive selection (card picker)',
    category: 'Interaction',
    description:
      'interactive + selectable cards form a keyboard-accessible picker: the parent owns ' +
      'selected and reacts to activate (click, Enter, or Space).',
    component: CardInteractiveExample,
    imports: ['PixelCardComponent'],
    html: `@for (plan of plans; track plan.id) {
  <pixel-card
    appearance="outlined"
    interactive
    selectable
    [selected]="selectedId() === plan.id"
    [cardTitle]="plan.name"
    [cardSubtitle]="plan.price"
    (activate)="selectedId.set(plan.id)"
  >
    {{ plan.description }}
  </pixel-card>
}`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCardComponent } from 'pixel-ui';

@Component({ /* … */ })
export class CardInteractiveExample {
  protected readonly plans = [
    { id: 'starter', name: 'Starter', price: 'Free', description: 'For side projects.' },
    { id: 'team', name: 'Team', price: '$12/user', description: 'For growing teams.' },
  ];
  readonly selectedId = signal('team');
}`,
  }),
  createDocExample({
    id: 'media-actions-skeleton',
    title: 'Media, actions & skeleton',
    category: 'Content',
    description:
      'Edge-to-edge pixelCardMedia slot, pixelCardActions footer, and the showSkeleton ' +
      'loading placeholder sized to match the card footprint.',
    component: CardMediaSkeletonExample,
    imports: ['PixelCardComponent'],
    html: `<pixel-card
  cardTitle="Quarterly report"
  cardSubtitle="Finance · updated 2h ago"
  [showSkeleton]="loading()"
  skeletonHeight="16rem"
>
  <div pixelCardMedia class="media" aria-hidden="true"></div>
  Revenue is up 14% quarter-over-quarter with services leading growth.
  <pixel-button pixelCardActions appearance="text">Open report</pixel-button>
  <pixel-button pixelCardActions appearance="text">Share</pixel-button>
</pixel-card>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelCardComponent } from 'pixel-ui';

@Component({ /* … */ })
export class CardMediaSkeletonExample {
  readonly loading = signal(false);
}`,
  }),
] as const;
