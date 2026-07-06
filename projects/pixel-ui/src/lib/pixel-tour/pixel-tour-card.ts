import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelProgressBarComponent from '../pixel-progress/pixel-progress-bar';
import PixelTourControlsComponent from './pixel-tour-controls';
import { PixelTourRef } from './pixel-tour-ref';
import { PixelTourPanelBody } from './pixel-tour-panel-body';
import { provideTourPanelController } from './pixel-tour-panel.providers';
import { PixelTourPanelController, PIXEL_TOUR_PANEL_CONTROLLER } from './pixel-tour-panel-controller';
import { PIXEL_TOUR_VIEW_CONFIG, type PixelTourViewConfig } from './pixel-tour.types';

/**
 * @internal The step card UI of a running tour: media, title, content (string, template,
 * or component), progress (count/dots/bar), autoplay countdown with pause/play, navigation
 * buttons, drag handle, swipe gestures, and the tour keyboard contract. Created by
 * `PixelTourService`; positioned by `ConnectedOverlay` or centered via CSS. Not public API.
 */
@Component({
  selector: 'pixel-tour-card',
  imports: [
    NgTemplateOutlet,
    NgComponentOutlet,
    PixelButtonComponent,
    PixelProgressBarComponent,
    PixelTourControlsComponent,
  ],
  templateUrl: './pixel-tour-card.html',
  styleUrl: './pixel-tour-card.scss',
  host: {
    class: 'pixel-tour-card pixel-tour-card--host',
    role: 'dialog',
    'aria-modal': 'false',
    tabindex: '-1',
    '[class.pixel-tour-card--centered]': '!step().target',
    '[class.pixel-tour-card--minimized]': 'panel.minimized()',
    '[class.pixel-tour-card--dragging]': 'panel.dragging()',
    '[attr.aria-labelledby]': 'step().title ? titleId : null',
    '[attr.aria-label]': "step().title ? null : config.labels.stepAriaLabel",
    '[attr.aria-describedby]': 'bodyId',
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
export default class PixelTourCardComponent extends PixelTourPanelBody {
  protected readonly ref = inject(PixelTourRef);
  protected readonly config = inject(PIXEL_TOUR_VIEW_CONFIG);
  protected readonly panel = inject(PIXEL_TOUR_PANEL_CONTROLLER);

  protected tourRef(): PixelTourRef {
    return this.ref;
  }

  protected viewConfig(): PixelTourViewConfig {
    return this.config;
  }
}
