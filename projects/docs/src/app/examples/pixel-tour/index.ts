import { createDocExample } from '../../shared/example-source.util';
import { TourBasicExample } from './tour-basic.example';
import { TourAsyncExample } from './tour-async.example';
import { TourShowcaseExample } from './tour-showcase.example';

export const TOUR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Product tour',
    category: 'Basics',
    description:
      'A five-step tour: centered welcome and finale cards, [pixelTourAnchor] and CSS ' +
      'selector targets, a circular spotlight, per-step button sets, and scrim-click skip. ' +
      'Arrow keys navigate; Escape aborts.',
    component: TourBasicExample,
    imports: ['PixelTourService', 'PixelTourAnchorDirective'],
    html: `<pixel-button leadingIcon="tour" (click)="startTour()">Start tour</pixel-button>

<pixel-button pixelTourAnchor="new-report" leadingIcon="add">New report</pixel-button>
<pixel-button pixelTourAnchor="share" appearance="tonal" leadingIcon="share">Share</pixel-button>
<pixel-button class="filters-trigger" appearance="icon" leadingIcon="filter_list" ariaLabel="Filters" />`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelTourAnchorDirective, PixelTourService } from 'pixel-ui';

@Component({ /* … */ })
export class TourBasicExample {
  private readonly tour = inject(PixelTourService);

  startTour(): void {
    this.tour.start(
      [
        { id: 'welcome', title: 'Welcome to Reports 👋', content: 'A 30-second look around.',
          buttons: ['skip-tour', 'next'] },
        { id: 'create', target: 'new-report', title: 'Create your first report',
          content: 'Everything starts here.' },
        { id: 'filters', target: '.filters-trigger', title: 'Slice the data',
          content: 'Targeted by CSS selector, circular spotlight.',
          spotlight: { shape: 'circle', padding: 6 } },
        { id: 'finale', title: 'You are all set!', content: 'That is the whole workflow.',
          buttons: ['back', 'done'] },
      ],
      { backdropClick: 'skip-tour' },
    );
  }
}`,
  }),
  createDocExample({
    id: 'async-persistence',
    title: 'Hooks, lazy targets & persistence',
    category: 'Async',
    description:
      'beforeEnter/afterLeave hooks stage the UI (opening a hidden panel), waitForTarget ' +
      'polls for content that arrives late (spinner + aria-busy meanwhile), and persistKey ' +
      'makes the tour run once: aborting saves the step for resume, finishing blocks re-runs.',
    component: TourAsyncExample,
    imports: ['PixelTourService', 'PixelTourAnchorDirective'],
    html: `<pixel-button leadingIcon="tour" (click)="startTour()">Start tour</pixel-button>
<pixel-button appearance="text" (click)="tour.resetPersistence('docs-tour-async-v1')">
  Reset persistence
</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelTourService } from 'pixel-ui';

@Component({ /* … */ })
export class TourAsyncExample {
  private readonly tour = inject(PixelTourService);
  readonly advancedOpen = signal(false);
  readonly connectionReady = signal(false);

  startTour(): void {
    this.tour.start(
      [
        {
          id: 'hidden-panel',
          target: 'webhook-url',
          content: 'beforeEnter opened this panel; afterLeave closes it again.',
          beforeEnter: () => void this.advancedOpen.set(true),
          afterLeave: () => void this.advancedOpen.set(false),
          waitForTarget: { timeoutMs: 2000 },
        },
        {
          id: 'lazy-chip',
          target: '#lazy-connection',
          content: 'The tour polled until the (simulated) server data arrived.',
          beforeEnter: () => setTimeout(() => this.connectionReady.set(true), 1200),
          waitForTarget: { timeoutMs: 5000 },
        },
      ],
      { persistKey: 'docs-tour-async-v1' },
    );
  }
}`,
  }),
  createDocExample({
    id: 'showcase',
    title: 'Autoplay, morph, drag & hands-on steps',
    category: 'Showcase',
    description:
      'The Phase 2 feature set: autoplay with a countdown bar (hover or keyboard focus ' +
      'pauses it; the pause button minimizes the tour to a floating chip), dot progress, a ' +
      'draggable card, a spotlight that morphs between targets (multi-target cutouts ' +
      'included), and an interactive "try it" step that advances when the real Deploy ' +
      'button is clicked.',
    component: TourShowcaseExample,
    imports: ['PixelTourService', 'PixelTourAnchorDirective'],
    html: `<pixel-button leadingIcon="auto_awesome" (click)="startTour()">Start showcase tour</pixel-button>`,
    typescript: `this.tour.start(
  [
    { id: 'stages', title: 'Two stages, one spotlight', content: '…',
      target: 'build', targets: ['test'] },
    { id: 'try-deploy', title: 'Your turn: ship it', content: '…',
      target: 'deploy', advanceOn: 'target-click', buttons: ['back', 'skip-step'] },
  ],
  {
    autoplay: { stepMs: 7000 },   // countdown bar; hover/focus pauses; pause control required
    progress: 'dots',
    draggable: true,
    pauseUi: 'minimize',          // pausing collapses the tour into a floating resume chip
  },
);`,
  }),
] as const;
