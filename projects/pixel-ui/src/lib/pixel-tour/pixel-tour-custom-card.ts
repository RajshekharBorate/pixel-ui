import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  computed,
  inject,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelProgressBarComponent from '../pixel-progress/pixel-progress-bar';
import { PixelTourRef } from './pixel-tour-ref';
import { PIXEL_TOUR_PANEL_CONTROLLER } from './pixel-tour-panel-controller';
import { provideTourPanelController } from './pixel-tour-panel.providers';
import {
  PIXEL_TOUR_CARD_SOURCE,
  PIXEL_TOUR_VIEW_CONFIG,
  type PixelTourCardContext,
} from './pixel-tour.types';

let nextCustomCardId = 0;

/**
 * @internal Body-relocated custom tour card host — renders `config.card` or per-step
 * `step.card` templates/components. Created by `PixelTourService` when `ui: 'custom'`.
 */
@Component({
  selector: 'pixel-tour-custom-card',
  imports: [
    NgTemplateOutlet,
    NgComponentOutlet,
    PixelButtonComponent,
    PixelProgressBarComponent,
  ],
  templateUrl: './pixel-tour-custom-card.html',
  styleUrl: './pixel-tour-custom-card.scss',
  host: {
    class: 'pixel-tour-custom-card pixel-tour-card--host',
    role: 'dialog',
    'aria-modal': 'false',
    tabindex: '-1',
    '[class.pixel-tour-card--centered]': '!step().target',
    '[class.pixel-tour-card--minimized]': 'panel.minimized()',
    '[class.pixel-tour-card--dragging]': 'panel.dragging()',
    '[attr.aria-labelledby]': 'step().title ? titleId : null',
    '[attr.aria-label]': "step().title ? null : config.labels.stepAriaLabel",
    '(keydown)': 'panel.onKeydown($event)',
    '(mouseenter)': 'panel.hoverPaused.set(true)',
    '(mouseleave)': 'panel.hoverPaused.set(false)',
    '(focusin)': 'panel.onFocusIn($event)',
    '(focusout)': 'panel.focusPaused.set(false)',
    '(touchstart)': 'panel.onTouchStart($event)',
    '(touchend)': 'panel.onTouchEnd($event)',
  },
  providers: [provideTourPanelController()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTourCustomCardComponent {
  private readonly injector = inject(Injector);
  private readonly cardSource = inject(PIXEL_TOUR_CARD_SOURCE);

  protected readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ref = inject(PixelTourRef);
  protected readonly config = inject(PIXEL_TOUR_VIEW_CONFIG);
  protected readonly panel = inject(PIXEL_TOUR_PANEL_CONTROLLER);
  protected readonly step = this.ref.activeStep;

  protected readonly titleId = `pixel-tour-custom-card-${++nextCustomCardId}-title`;

  protected readonly waiting = computed(() => this.ref.status() === 'waiting');

  protected readonly templateContent = computed(() => {
    const content = this.cardSource.resolveCard(this.ref.activeStep());
    return content instanceof TemplateRef ? content : null;
  });

  protected readonly componentContent = computed(() => {
    const content = this.cardSource.resolveCard(this.ref.activeStep());
    return content instanceof TemplateRef ? null : content;
  });

  protected readonly cardContext = computed(
    (): PixelTourCardContext => ({
      $implicit: this.ref,
      ref: this.ref,
      step: this.ref.activeStep,
      labels: this.config.labels,
      view: this.config,
      waiting: this.waiting,
      minimized: this.panel.minimized,
    }),
  );

  protected readonly contentInjector = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: [
        { provide: PixelTourRef, useValue: this.ref },
        { provide: PIXEL_TOUR_VIEW_CONFIG, useValue: this.config },
        { provide: PIXEL_TOUR_PANEL_CONTROLLER, useValue: this.panel },
      ],
    }),
  );

  protected readonly announcement = computed(() => {
    const step = this.ref.activeStep();
    const progress = this.config.labels.progress
      .replace('{index}', String(this.ref.stepIndex() + 1))
      .replace('{total}', String(this.ref.total));
    return step.title ? `${progress}: ${step.title}` : progress;
  });
}
