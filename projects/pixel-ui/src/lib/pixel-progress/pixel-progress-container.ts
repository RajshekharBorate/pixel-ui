import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { type PixelProgressStatus } from './pixel-progress.types';

/** Layout of the dashboard widget — vertical card vs. horizontal KPI row. */
export type PixelProgressContainerLayout = 'card' | 'inline' | 'tile';

/**
 * Dashboard / KPI widget shell for a progress indicator.
 *
 * Provides themed card chrome (title, subtitle, icon, optional trailing value + status pill)
 * around any projected progress component — a `pixel-progress-bar`, `pixel-progress-circle` or
 * custom content. Purely presentational and signal-driven; compose it to build storage cards,
 * upload panels and workflow widgets.
 *
 * @example
 * ```html
 * <pixel-progress-container title="Storage used" icon="cloud" value="75%" status="warning">
 *   <pixel-progress-bar [value]="75" status="warning" />
 * </pixel-progress-container>
 *
 * <pixel-progress-container layout="tile" title="Tasks done">
 *   <pixel-progress-circle [value]="62" showPercentage />
 * </pixel-progress-container>
 * ```
 */
@Component({
  selector: 'pixel-progress-container',
  templateUrl: './pixel-progress-container.html',
  styleUrl: './pixel-progress-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-progress-container',
    '[attr.data-layout]': 'layout()',
    '[attr.data-status]': 'status()',
  },
})
export default class PixelProgressContainerComponent {
  /**
   * @component Widget title.
   * @type {string}
   * @default ''
   */
  readonly title = input('');

  /**
   * @component Optional secondary subtitle / description.
   * @type {string}
   * @default ''
   */
  readonly subtitle = input('');

  /**
   * @component Optional Material Symbols glyph rendered in the header.
   * @type {string}
   * @default ''
   */
  readonly icon = input('');

  /**
   * @component Optional trailing value (e.g. `75%`, `2.5 GB`) shown emphasized in the header.
   * @type {string}
   * @default ''
   */
  readonly value = input('');

  /**
   * @component Semantic status driving the accent + optional status pill.
   * @type {PixelProgressStatus}
   * @default 'default'
   */
  readonly status = input<PixelProgressStatus>('default');

  /**
   * @component Renders a status pill next to the title.
   * @type {boolean}
   * @default false
   */
  readonly showStatus = input(false, { transform: booleanAttribute });

  /**
   * @component Layout style (`card` | `inline` | `tile`).
   * @type {PixelProgressContainerLayout}
   * @default 'card'
   */
  readonly layout = input<PixelProgressContainerLayout>('card');

  /**
   * @component Extra static classes appended to the host card.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  protected readonly hasHeader = computed(
    () => this.title().trim() !== '' || this.icon().trim() !== '' || this.value().trim() !== '',
  );

  protected readonly statusLabel = computed(() => {
    const map: Record<PixelProgressStatus, string> = {
      default: '',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      info: 'Info',
      paused: 'Paused',
      loading: 'Loading',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[this.status()];
  });

  protected readonly cardClass = computed(() => {
    const classes = ['pixel-progress-container__card'];
    const custom = this.className().trim();
    if (custom) {
      classes.push(custom);
    }
    return classes.join(' ');
  });
}
