import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelCardComponent,
  PixelTourAnchorDirective,
  PixelTourService,
} from 'pixel-ui';

@Component({
  selector: 'docs-tour-basic-example',
  imports: [PixelButtonComponent, PixelCardComponent, PixelTourAnchorDirective],
  template: `
    <pixel-button leadingIcon="tour" (click)="startTour()">Start tour</pixel-button>

    <pixel-card appearance="outlined" class="playground" cardTitle="Reports workspace">
      <div class="toolbar">
        <pixel-button size="sm" pixelTourAnchor="new-report" leadingIcon="add">
          New report
        </pixel-button>
        <pixel-button size="sm" appearance="tonal" pixelTourAnchor="share" leadingIcon="share">
          Share
        </pixel-button>
        <pixel-button
          size="sm"
          appearance="icon"
          class="filters-trigger"
          leadingIcon="filter_list"
          ariaLabel="Filters"
        />
      </div>
      <p class="hint">This little workspace is the tour's playground.</p>
    </pixel-card>
  `,
  styles: `
    .playground { margin-block-start: var(--pixel-sys-space-md, 1rem); max-inline-size: 28rem; }
    .toolbar { display: flex; gap: var(--pixel-sys-space-sm, 0.5rem); align-items: center; }
    .hint { margin: var(--pixel-sys-space-md, 1rem) 0 0; color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 65%, transparent); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourBasicExample {
  private readonly tour = inject(PixelTourService);

  startTour(): void {
    this.tour.start(
      [
        {
          id: 'welcome',
          title: 'Welcome to Reports 👋',
          content:
            'This 30-second tour shows you the three things you need to get productive. ' +
            'Use the arrow keys to move around, or Escape to leave at any time.',
          buttons: ['skip-tour', 'next'],
        },
        {
          id: 'create',
          target: 'new-report',
          title: 'Create your first report',
          content: 'Everything starts here — pick a template or begin from scratch.',
        },
        {
          id: 'share',
          target: 'share',
          title: 'Share with your team',
          content: 'Reports are private until you share them. Invite viewers or editors.',
        },
        {
          id: 'filters',
          target: '.filters-trigger',
          title: 'Slice the data',
          content: 'Filters apply live — this one is targeted by CSS selector, with a circular spotlight.',
          spotlight: { shape: 'circle', padding: 6 },
        },
        {
          id: 'finale',
          title: 'You are all set!',
          content: 'That is the whole workflow. You can restart this tour from the help menu.',
          buttons: ['back', 'done'],
        },
      ],
      { backdropClick: 'skip-tour' },
    );
  }
}
