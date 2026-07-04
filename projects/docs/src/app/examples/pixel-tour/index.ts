import { createDocExample } from '../../shared/example-source.util';
import { TourBasicExample } from './tour-basic.example';

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
] as const;
