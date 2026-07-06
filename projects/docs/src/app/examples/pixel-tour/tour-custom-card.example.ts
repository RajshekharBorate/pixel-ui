import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  inject,
  viewChild,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelCardComponent,
  PixelTourAnchorDirective,
  PixelTourCardContext,
  PixelTourControlsComponent,
  PixelTourService,
} from 'pixel-ui';

@Component({
  selector: 'docs-tour-custom-card-example',
  imports: [
    PixelButtonComponent,
    PixelCardComponent,
    PixelTourAnchorDirective,
    PixelTourControlsComponent,
  ],
  template: `
    <ng-template #card let-ref="ref" let-step="step" let-waiting="waiting">
      <pixel-card appearance="outlined" class="tour-shell" [cardTitle]="step().title ?? 'Tour'">
        @if (typeof step().content === 'string') {
          <p class="body">{{ step().content }}</p>
        }
        @if (waiting()) {
          <p class="waiting">Loading step…</p>
        }
        <pixel-tour-controls />
      </pixel-card>
    </ng-template>

    <pixel-button leadingIcon="dashboard_customize" (click)="startTour()">
      Start custom-card tour
    </pixel-button>

    <pixel-card appearance="outlined" class="playground" cardTitle="Workspace">
      <pixel-button size="sm" pixelTourAnchor="insights" leadingIcon="insights">
        Insights
      </pixel-button>
    </pixel-card>
  `,
  styles: `
    .playground { margin-block-start: var(--pixel-sys-space-md, 1rem); max-inline-size: 24rem; }
    .tour-shell { inline-size: 20rem; max-inline-size: calc(100vw - 2rem); }
    .body { margin: 0; color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 82%, transparent); }
    .waiting { margin: var(--pixel-sys-space-sm, 0.5rem) 0 0; font-size: var(--pixel-sys-label-sm-size, 0.8125rem); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourCustomCardExample {
  private readonly tour = inject(PixelTourService);
  private readonly card =
    viewChild.required<TemplateRef<PixelTourCardContext>>('card');

  startTour(): void {
    this.tour.start(
      [
        {
          id: 'intro',
          title: 'Your branded shell',
          content: 'The entire panel is a pixel-card you own — navigation comes from pixel-tour-controls.',
        },
        {
          id: 'insights',
          target: 'insights',
          title: 'Real target',
          content: 'Spotlight and overlay positioning still come from the tour service.',
        },
      ],
      {
        ui: 'custom',
        card: this.card(),
        progress: 'dots',
      },
    );
  }
}
