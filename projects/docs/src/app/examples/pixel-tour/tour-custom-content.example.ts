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
  PIXEL_TOUR_STEP_DATA,
  PixelTourAnchorDirective,
  PixelTourRef,
  PixelTourService,
} from 'pixel-ui';

@Component({
  selector: 'docs-tour-step-body-probe',
  template: `<p class="probe">Plan: {{ data?.plan }}</p>`,
})
export class TourStepBodyProbeComponent {
  readonly data = inject(PIXEL_TOUR_STEP_DATA, { optional: true }) as { plan?: string } | null;
}

@Component({
  selector: 'docs-tour-custom-content-example',
  imports: [PixelButtonComponent, PixelCardComponent, PixelTourAnchorDirective, TourStepBodyProbeComponent],
  template: `
    <ng-template #richStep let-tour>
      <p class="template-line">
        Template body — step <strong>{{ tour.stepIndex() + 1 }}</strong> of
        {{ tour.total }}.
      </p>
      <pixel-button size="sm" appearance="tonal" (click)="tour.next()">Template next</pixel-button>
    </ng-template>

    <pixel-button leadingIcon="code" (click)="startTour()">Start custom-content tour</pixel-button>

    <pixel-card appearance="outlined" class="playground" cardTitle="Custom step bodies">
      <pixel-button size="sm" pixelTourAnchor="save-view" leadingIcon="bookmark">
        Save view
      </pixel-button>
      <p class="hint">
        The first step uses a <code>TemplateRef</code>; the second mounts a small component with
        <code>PIXEL_TOUR_STEP_DATA</code>. The default card chrome (title, footer buttons) stays.
      </p>
    </pixel-card>
  `,
  styles: `
    .playground { margin-block-start: var(--pixel-sys-space-md, 1rem); max-inline-size: 28rem; }
    .hint { margin: var(--pixel-sys-space-md, 1rem) 0 0; font-size: var(--pixel-sys-label-sm-size, 0.8125rem);
      color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 65%, transparent); }
    .template-line { margin: 0 0 var(--pixel-sys-space-sm, 0.5rem); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourCustomContentExample {
  private readonly tour = inject(PixelTourService);
  private readonly richStep = viewChild.required<TemplateRef<{ $implicit: PixelTourRef }>>('richStep');

  startTour(): void {
    this.tour.start(
      [
        {
          id: 'welcome',
          title: 'Template step body',
          content: this.richStep(),
          buttons: ['skip-tour', 'next'],
        },
        {
          id: 'save',
          target: 'save-view',
          title: 'Component step body',
          content: TourStepBodyProbeComponent,
          data: { plan: 'enterprise' },
        },
        {
          id: 'done',
          title: 'Same default card',
          content: 'Footer buttons and progress still come from the built-in card.',
          buttons: ['back', 'done'],
        },
      ],
      { progress: 'count' },
    );
  }
}
