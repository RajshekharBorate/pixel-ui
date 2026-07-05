import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelCardComponent,
  PixelTourAnchorDirective,
  PixelTourService,
} from 'pixel-ui';

@Component({
  selector: 'docs-tour-showcase-example',
  imports: [PixelButtonComponent, PixelCardComponent, PixelTourAnchorDirective],
  template: `
    <pixel-button leadingIcon="auto_awesome" (click)="startTour()">
      Start showcase tour
    </pixel-button>

    <pixel-card appearance="outlined" class="playground" cardTitle="Deploy pipeline">
      <div class="toolbar">
        <pixel-button size="sm" pixelTourAnchor="build" leadingIcon="construction">
          Build
        </pixel-button>
        <pixel-button size="sm" pixelTourAnchor="test" appearance="tonal" leadingIcon="science">
          Test
        </pixel-button>
        <pixel-button
          size="sm"
          appearance="solid"
          pixelTourAnchor="deploy"
          leadingIcon="rocket_launch"
          (click)="deployClicked.set(true)"
        >
          Deploy
        </pixel-button>
      </div>
      <p class="hint">
        {{ deployClicked() ? '🚀 Deployed! The tour advanced because you clicked the real button.' : 'The tour runs itself — hover the card to pause the countdown.' }}
      </p>
    </pixel-card>
  `,
  styles: `
    .playground { margin-block-start: var(--pixel-sys-space-md, 1rem); max-inline-size: 28rem; }
    .toolbar { display: flex; gap: var(--pixel-sys-space-sm, 0.5rem); align-items: center; flex-wrap: wrap; }
    .hint { margin: var(--pixel-sys-space-md, 1rem) 0 0; color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 65%, transparent); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourShowcaseExample {
  private readonly tour = inject(PixelTourService);
  readonly deployClicked = signal(false);

  startTour(): void {
    this.deployClicked.set(false);
    this.tour.start(
      [
        {
          id: 'intro',
          title: 'The full experience',
          content:
            'Autoplay with a countdown (hover to pause, or use the pause button — it ' +
            'minimizes the tour to a chip), dot progress, a draggable card, and a ' +
            'morphing spotlight. Sit back or take over at any time.',
          buttons: ['skip-tour', 'next'],
        },
        {
          id: 'stages',
          title: 'Two stages, one spotlight',
          content: 'Build and Test are highlighted together — multi-target cutouts.',
          target: 'build',
          targets: ['test'],
        },
        {
          id: 'try-deploy',
          title: 'Your turn: ship it',
          content:
            'This step will not advance on its own — click the glowing Deploy button ' +
            'for real. Interactive spotlights let clicks through.',
          target: 'deploy',
          advanceOn: 'target-click',
          autoAdvanceMs: 60_000,
          buttons: ['back', 'skip-step'],
        },
        {
          id: 'finale',
          title: 'That is next-gen touring',
          content: 'Morph, autoplay, pause-to-chip, drag, and hands-on steps — all themable.',
          buttons: ['back', 'done'],
        },
      ],
      {
        autoplay: { stepMs: 7000 },
        progress: 'dots',
        draggable: true,
        pauseUi: 'minimize',
      },
    );
  }
}
