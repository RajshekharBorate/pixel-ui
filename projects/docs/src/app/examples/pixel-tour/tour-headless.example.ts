import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelCardComponent,
  PixelTourAnchorDirective,
  PixelTourPanelComponent,
  PixelTourRef,
  PixelTourService,
} from 'pixel-ui';

@Component({
  selector: 'docs-tour-headless-example',
  imports: [
    PixelButtonComponent,
    PixelCardComponent,
    PixelTourAnchorDirective,
    PixelTourPanelComponent,
  ],
  template: `
    <pixel-button leadingIcon="visibility_off" (click)="startTour()">Start headless tour</pixel-button>

    @if (ref(); as tour) {
      <pixel-tour-panel [ref]="tour" />
    }

    <pixel-card appearance="outlined" class="playground" cardTitle="Headless target">
      <pixel-button size="sm" pixelTourAnchor="headless-target" leadingIcon="ads_click">
        Highlighted control
      </pixel-button>
      <p class="hint">
        The spotlight is library-owned. <code>pixel-tour-panel</code> mounts the default card
        chrome into the overlay layer so it stays above the scrim.
      </p>
    </pixel-card>
  `,
  styles: `
    .playground { margin-block-start: var(--pixel-sys-space-md, 1rem); max-inline-size: 24rem; }
    .hint { margin: var(--pixel-sys-space-md, 1rem) 0 0; font-size: var(--pixel-sys-label-sm-size, 0.8125rem);
      color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 65%, transparent); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourHeadlessExample {
  private readonly tourService = inject(PixelTourService);
  protected readonly ref = signal<PixelTourRef | null>(null);

  startTour(): void {
    const running = this.tourService.start(
      [
        {
          id: 'welcome',
          title: 'Headless mode',
          content: 'The service mounts only the spotlight — pixel-tour-panel adds default card chrome.',
        },
        {
          id: 'target',
          target: 'headless-target',
          title: 'Spotlight only',
          content: 'The panel anchors above the scrim and tracks this control.',
        },
      ],
      { ui: 'headless' },
    );
    this.ref.set(running);
    void running.finished.finally(() => this.ref.set(null));
  }
}
