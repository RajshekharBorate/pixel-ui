import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import {
  clampProgressValue,
  resolveThresholdStatus,
  toProgressPercent,
  type PixelProgressSize,
  type PixelProgressStatus,
  type PixelProgressThreshold,
} from './pixel-progress.types';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

/** Size → SVG diameter (px) mapping for the circular gauge. */
const CIRCLE_DIAMETER: Record<PixelProgressSize, number> = {
  xs: 40,
  sm: 56,
  md: 80,
  lg: 112,
  xl: 152,
};

/**
 * SVG-based circular / radial progress indicator (gauge).
 *
 * Renders a determinate ring driven by stroke-dasharray, an indeterminate spinner and a
 * centered percentage / custom label. Sizing is token-driven and the geometry is fully
 * derived from signals. Public API is `input()`-only.
 *
 * @example
 * ```html
 * <!-- Determinate gauge with percentage -->
 * <pixel-progress-circle [value]="75" showPercentage />
 *
 * <!-- Custom stroke + status thresholds -->
 * <pixel-progress-circle
 *   [value]="92"
 *   size="lg"
 *   [strokeWidth]="10"
 *   [thresholds]="[{ from: 0, status: 'success' }, { from: 90, status: 'error' }]"
 *   showPercentage
 * />
 *
 * <!-- Indeterminate spinner -->
 * <pixel-progress-circle indeterminate ariaLabel="Loading" />
 * ```
 */
@Component({
  selector: 'pixel-progress-circle',
  imports: [PixelSkeletonComponent],
  templateUrl: './pixel-progress-circle.html',
  styleUrl: './pixel-progress-circle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-progress-circle',
    '[class.pixel-progress-circle--indeterminate]': 'indeterminate()',
    '[attr.data-size]': 'size()',
    '[attr.data-status]': 'resolvedStatus()',
  },
})
export default class PixelProgressCircleComponent {
  /**
   * @component Current value within `[min, max]`.
   * @type {number}
   * @default 0
   */
  readonly value = input(0, { transform: numberAttribute });

  /**
   * @component Lower bound of the value range.
   * @type {number}
   * @default 0
   */
  readonly min = input(0, { transform: numberAttribute });

  /**
   * @component Upper bound of the value range.
   * @type {number}
   * @default 100
   */
  readonly max = input(100, { transform: numberAttribute });

  /**
   * @component Density size scale. Sets the SVG diameter unless `diameter` is supplied.
   * @type {PixelProgressSize}
   * @default 'md'
   */
  /** When true, replaces the circle with a skeleton ring placeholder. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  readonly size = input<PixelProgressSize>('md');

  /**
   * @component Explicit SVG diameter in px. Overrides the `size`-derived diameter when `> 0`.
   * @type {number}
   * @default 0
   */
  readonly diameter = input(0, { transform: numberAttribute });

  /**
   * @component Ring stroke width in px.
   * @type {number}
   * @default 8
   */
  readonly strokeWidth = input(8, { transform: numberAttribute });

  /**
   * @component Explicit semantic status (overridden by matching `thresholds`).
   * @type {PixelProgressStatus}
   * @default 'default'
   */
  readonly status = input<PixelProgressStatus>('default');

  /**
   * @component Threshold bands mapping percentage ranges to status colors.
   * @type {PixelProgressThreshold[]}
   * @default []
   */
  readonly thresholds = input<readonly PixelProgressThreshold[]>([]);

  /**
   * @component Renders the centered text block (percentage / label).
   * @type {boolean}
   * @default true
   */
  readonly showLabel = input(true, { transform: booleanAttribute });

  /**
   * @component Renders the centered percentage value.
   * @type {boolean}
   * @default false
   */
  readonly showPercentage = input(false, { transform: booleanAttribute });

  /**
   * @component Custom centered label (e.g. "Storage"). Rendered beneath the percentage.
   * @type {string}
   * @default ''
   */
  readonly label = input('');

  /**
   * @component Indeterminate spinner mode (value ignored).
   * @type {boolean}
   * @default false
   */
  readonly indeterminate = input(false, { transform: booleanAttribute });

  /**
   * @component Custom stroke color (any CSS color). Overrides status / threshold colors.
   * @type {string}
   * @default ''
   */
  readonly color = input('');

  /**
   * @component Extra static classes appended to the host figure.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /**
   * @component Accessible label override.
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  protected readonly skeletonCircleSize = computed(() => {
    const px = this.diameter() > 0 ? this.diameter() : CIRCLE_DIAMETER[this.size()];
    return `${px / 16}rem`;
  });

  protected readonly resolvedDiameter = computed(() => {
    const explicit = this.diameter();
    return explicit > 0 ? explicit : CIRCLE_DIAMETER[this.size()];
  });

  /** Radius of the arc, inset by half the stroke so the ring fits inside the viewBox. */
  readonly radius = computed(
    () => this.resolvedDiameter() / 2 - this.strokeWidth() / 2,
  );

  protected readonly center = computed(() => this.resolvedDiameter() / 2);

  readonly circumference = computed(() => 2 * Math.PI * this.radius());

  readonly clampedValue = computed(() =>
    clampProgressValue(this.value(), this.min(), this.max()),
  );

  readonly percentage = computed(() => {
    const pct = toProgressPercent(this.value(), this.min(), this.max());
    return Math.round(pct * 100) / 100;
  });

  /** Stroke dash offset that reveals the arc proportionally to the percentage. */
  readonly dashOffset = computed(
    () => this.circumference() * (1 - this.percentage() / 100),
  );

  private readonly activeThreshold = computed<PixelProgressThreshold | null>(() =>
    resolveThresholdStatus(this.percentage(), this.thresholds()),
  );

  readonly resolvedStatus = computed<PixelProgressStatus>(() => {
    if (!this.indeterminate() && this.percentage() >= 100 && this.status() === 'default') {
      return 'completed';
    }
    const band = this.activeThreshold();
    if (band && this.status() === 'default') {
      return band.status;
    }
    return this.status();
  });

  protected readonly strokeColor = computed<string | null>(() => {
    const explicit = this.color().trim();
    if (explicit) {
      return explicit;
    }
    return this.activeThreshold()?.color ?? null;
  });

  protected readonly percentageLabel = computed(() => `${Math.round(this.percentage())}%`);

  protected readonly showCenter = computed(
    () => this.showLabel() && (this.showPercentage() || this.label().trim() !== ''),
  );

  protected readonly ariaLabelText = computed(
    () => this.ariaLabel().trim() || this.label().trim() || 'Progress',
  );

  protected readonly ariaValueText = computed(() =>
    this.indeterminate() ? 'In progress' : `${Math.round(this.percentage())} percent`,
  );

  protected readonly figureClass = computed(() => {
    const classes = ['pixel-progress-circle__figure'];
    const custom = this.className().trim();
    if (custom) {
      classes.push(custom);
    }
    return classes.join(' ');
  });
}
