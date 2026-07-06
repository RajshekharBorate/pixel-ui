import { Injector, TemplateRef, computed, inject } from '@angular/core';
import { PixelTourRef } from './pixel-tour-ref';
import { PixelTourPanelController, PIXEL_TOUR_PANEL_CONTROLLER } from './pixel-tour-panel-controller';
import { PIXEL_TOUR_STEP_DATA, type PixelTourViewConfig } from './pixel-tour.types';

let nextTourPanelBodyId = 0;

/**
 * @internal Shared step-body computeds for default and headless tour panel hosts.
 */
export abstract class PixelTourPanelBody {
  protected abstract readonly panel: PixelTourPanelController;
  private readonly injector = inject(Injector);

  protected readonly titleId = `pixel-tour-panel-${++nextTourPanelBodyId}-title`;
  protected readonly bodyId = `pixel-tour-panel-${nextTourPanelBodyId}-body`;

  protected abstract tourRef(): PixelTourRef;
  protected abstract viewConfig(): PixelTourViewConfig;

  protected readonly step = computed(() => this.tourRef().activeStep());

  protected readonly stringContent = computed(() => {
    const content = this.step().content;
    return typeof content === 'string' ? content : null;
  });

  protected readonly templateContent = computed(() => {
    const content = this.step().content;
    return content instanceof TemplateRef ? content : null;
  });

  protected readonly componentContent = computed(() => {
    const content = this.step().content;
    return typeof content === 'string' || content instanceof TemplateRef ? null : content;
  });

  protected readonly contentInjector = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: [{ provide: PIXEL_TOUR_STEP_DATA, useValue: this.step().data ?? null }],
    }),
  );

  protected readonly announcement = computed(() => {
    const title = this.step().title;
    const progress = this.viewConfig().labels.progress
      .replace('{index}', String(this.tourRef().stepIndex() + 1))
      .replace('{total}', String(this.tourRef().total));
    return title ? `${progress}: ${title}` : progress;
  });
}
