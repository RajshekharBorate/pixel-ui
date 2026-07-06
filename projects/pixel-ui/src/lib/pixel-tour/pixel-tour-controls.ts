import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelProgressBarComponent from '../pixel-progress/pixel-progress-bar';
import { PixelTourRef } from './pixel-tour-ref';
import { PixelTourPanelController, PIXEL_TOUR_PANEL_CONTROLLER } from './pixel-tour-panel-controller';
import {
  PIXEL_TOUR_VIEW_CONFIG,
  type PixelTourButton,
} from './pixel-tour.types';

const DEFAULT_BUTTONS: readonly PixelTourButton[] = ['back', 'skip-tour', 'next'];

/**
 * Optional navigation chrome for custom tour card templates — back / next / skip / pause /
 * progress indicators with the same behavior as the default card footer.
 *
 * ```html
 * <ng-template #card let-ref="ref" let-step="step">
 *   <pixel-card>
 *     <h2>{{ step().title }}</h2>
 *     <pixel-tour-controls />
 *   </pixel-card>
 * </ng-template>
 * ```
 *
 * Must render inside a tour panel host (`pixel-tour-card`, `pixel-tour-custom-card`, or
 * `pixel-tour-panel`).
 */
@Component({
  selector: 'pixel-tour-controls',
  imports: [PixelButtonComponent, PixelLoaderComponent, PixelProgressBarComponent],
  templateUrl: './pixel-tour-controls.html',
  styleUrl: './pixel-tour-controls.scss',
  host: {
    class: 'pixel-tour-controls',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTourControlsComponent {
  protected readonly ref = inject(PixelTourRef);
  protected readonly config = inject(PIXEL_TOUR_VIEW_CONFIG);
  protected readonly panel = inject(PIXEL_TOUR_PANEL_CONTROLLER);

  protected readonly step = this.ref.activeStep;

  protected readonly showPauseControl =
    this.config.pauseUi !== 'none' || this.config.autoplay !== null;

  protected readonly buttons = computed(() => {
    const buttons = this.step().buttons ?? DEFAULT_BUTTONS;
    return this.ref.stepIndex() === 0
      ? buttons.filter((button) => button !== 'back')
      : buttons;
  });

  protected readonly progressText = computed(() =>
    this.config.labels.progress
      .replace('{index}', String(this.ref.stepIndex() + 1))
      .replace('{total}', String(this.ref.total)),
  );

  protected readonly progressPercent = computed(
    () => ((this.ref.stepIndex() + 1) / this.ref.total) * 100,
  );

  protected readonly dots = computed(() =>
    Array.from({ length: this.ref.total }, (_unused, index) => index),
  );

  protected nextLabel(): string {
    return this.ref.isLastStep() ? this.config.labels.done : this.config.labels.next;
  }

  protected togglePause(): void {
    this.panel.togglePause();
  }
}
