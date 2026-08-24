import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PixelButtonComponent, PixelCardComponent, PixelContainerComponent } from 'pixel-ui';

export interface PatternGalleryItem {
  readonly title: string;
  readonly description: string;
  readonly route: string;
  readonly pageType: string;
  readonly surfaces: readonly string[];
  readonly openInNewTab?: boolean;
}

/**
 * Golden PAGE compositions for agents and humans to copy.
 * Route: `/patterns`
 */
@Component({
  selector: 'docs-pattern-gallery-page',
  imports: [RouterLink, PixelButtonComponent, PixelCardComponent, PixelContainerComponent],
  templateUrl: './pattern-gallery-page.html',
  styleUrl: './pattern-gallery-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternGalleryPageComponent {
  protected readonly patterns: readonly PatternGalleryItem[] = [
    {
      title: 'Products CRUD',
      description:
        'Header actions, KPI cards, search, data grid with skeleton loading and empty messaging, CSV export.',
      route: '/playground/products',
      pageType: 'crud',
      surfaces: ['pixel-card', 'pixel-input', 'pixel-data-grid', 'pixel-button', 'pixel-export'],
    },
    {
      title: 'Operations dashboard',
      description:
        'KPI cards with sparklines, activity grid, and a designed empty state — not a full chart host for micro-trends.',
      route: '/playground/dashboard',
      pageType: 'dashboard',
      surfaces: [
        'pixel-card',
        'pixel-chart-sparkline',
        'pixel-data-grid',
        'pixel-empty-state',
        'pixel-button',
      ],
    },
    {
      title: 'Settings wizard',
      description:
        'Linear stepper with profile fields, notification toggles, review step, and skeleton chrome.',
      route: '/playground/settings-wizard',
      pageType: 'wizard',
      surfaces: [
        'pixel-stepper',
        'pixel-input',
        'pixel-select',
        'pixel-toggle',
        'pixel-button',
      ],
    },
    {
      title: 'App shell',
      description:
        'Full-page shell with header, sidenav, and notification deep-link navigation recipes.',
      route: '/playground/app-shell',
      pageType: 'other',
      surfaces: ['pixel-app-shell', 'pixel-header', 'pixel-sidenav', 'pixel-navigate'],
      openInNewTab: true,
    },
  ];
}
