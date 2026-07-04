import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  TemplateRef,
  computed,
  effect,
  inject,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import PixelButtonComponent from '../pixel-button/pixel-button';
import { trapFocus } from '../shared/overlay-utils';
import { PixelTourRef } from './pixel-tour-ref';
import type {
  PixelTourButton,
  PixelTourLabels,
  PixelTourProgressStyle,
} from './pixel-tour.types';

/** @internal Resolved view options handed from the service to the card. */
export interface PixelTourViewConfig {
  readonly labels: PixelTourLabels;
  readonly progress: PixelTourProgressStyle;
  readonly keyboard: boolean;
}

/** @internal */
export const PIXEL_TOUR_VIEW_CONFIG = new InjectionToken<PixelTourViewConfig>(
  'PIXEL_TOUR_VIEW_CONFIG',
);

let nextTourCardId = 0;

const DEFAULT_BUTTONS: readonly PixelTourButton[] = ['back', 'skip-tour', 'next'];

/**
 * @internal The step card UI of a running tour: media, title, content (string, template,
 * or component), progress, and navigation buttons, with the tour keyboard contract
 * (ArrowLeft/ArrowRight navigate, Escape aborts, Tab is trapped). Created by
 * `PixelTourService`; positioned by `ConnectedOverlay` or centered via CSS. Not public API.
 */
@Component({
  selector: 'pixel-tour-card',
  imports: [NgTemplateOutlet, NgComponentOutlet, PixelButtonComponent],
  templateUrl: './pixel-tour-card.html',
  styleUrl: './pixel-tour-card.scss',
  host: {
    class: 'pixel-tour-card',
    role: 'dialog',
    'aria-modal': 'false',
    tabindex: '-1',
    '[class.pixel-tour-card--centered]': '!step().target',
    '[attr.aria-labelledby]': 'step().title ? titleId : null',
    '[attr.aria-label]': "step().title ? null : config.labels.stepAriaLabel",
    '[attr.aria-describedby]': 'bodyId',
    '(keydown)': 'onKeydown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTourCardComponent {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ref = inject(PixelTourRef);
  protected readonly config = inject(PIXEL_TOUR_VIEW_CONFIG);

  protected readonly titleId = `pixel-tour-card-${++nextTourCardId}-title`;
  protected readonly bodyId = `pixel-tour-card-${nextTourCardId}-body`;

  protected readonly step = this.ref.activeStep;

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

  protected readonly buttons = computed(() => {
    const buttons = this.step().buttons ?? DEFAULT_BUTTONS;
    // Back is meaningless on the first step — drop it instead of rendering it disabled.
    return this.ref.stepIndex() === 0
      ? buttons.filter((button) => button !== 'back')
      : buttons;
  });

  protected readonly progressText = computed(() =>
    this.config.labels.progress
      .replace('{index}', String(this.ref.stepIndex() + 1))
      .replace('{total}', String(this.ref.total)),
  );

  /** SR announcement per step: progress + title, via the card's polite live region. */
  protected readonly announcement = computed(() => {
    const title = this.step().title;
    return title ? `${this.progressText()}: ${title}` : this.progressText();
  });

  constructor() {
    // Move focus to the card whenever the step changes (and on open). Deferred a tick so the
    // overlay has positioned the card first.
    effect(() => {
      this.ref.stepIndex();
      if (this.ref.status() !== 'running' || typeof document === 'undefined') {
        return;
      }
      queueMicrotask(() => this.hostRef.nativeElement.focus());
    });
  }

  protected nextLabel(): string {
    return this.ref.isLastStep() ? this.config.labels.done : this.config.labels.next;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      trapFocus(event, this.hostRef.nativeElement);
      return;
    }
    if (!this.config.keyboard) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        event.stopPropagation();
        this.ref.abort();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.ref.next();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.ref.previous();
        break;
    }
  }
}
