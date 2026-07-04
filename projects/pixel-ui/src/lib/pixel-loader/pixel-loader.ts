import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import {
  LOADER_SIZE_METRICS,
  type PixelLoaderSize,
  type PixelLoaderType,
  type PixelLoaderVisibilityEvent,
} from './pixel-loader.types';

/**
 * Enterprise-grade animated loading indicator.
 *
 * A single signal-driven, `OnPush`, standalone component that renders animated loader
 * styles (`spinner`, `dots`, `pulse`, `ring`, `wave`, `bars`, `bounce`, …), five sizes. It supports anti-flicker display logic
 * (`showDelay` + `minDuration`), optional loading text/description and full WCAG-AA
 * `role="status"` / `aria-live` semantics. Colors come entirely from the `--pixel-loader-*`
 * theme contract — nothing is hardcoded.
 *
 * For full-screen / section overlays compose it inside `pixel-loading-container`; for skeleton
 * placeholders use `pixel-skeleton`; for app-wide HTTP/route loading wire up
 * `PixelLoadingService` + `pixelLoadingInterceptor`.
 *
 * @example
 * ```html
 * <!-- Inline spinner with text -->
 * <pixel-loader type="spinner" text="Loading…" />
 *
 * <!-- Bound to async work with anti-flicker timing -->
 * <pixel-loader
 *   [loading]="pending()"
 *   text="Fetching report"
 *   description="This can take a few seconds"
 *   [showDelay]="300"
 *   [minDuration]="500"
 * />
 * ```
 */
@Component({
  selector: 'pixel-loader',
  templateUrl: './pixel-loader.html',
  styleUrl: './pixel-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-loader',
    role: 'status',
    'aria-live': 'polite',
    '[attr.aria-busy]': 'busy()',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.data-type]': 'type()',
    '[attr.data-size]': 'size()',
    '[class.pixel-loader--centered]': 'centered()',
    '[class.pixel-loader--hidden]': '!visible()',
    '[class.pixel-loader--has-text]': 'hasText()',
  },
})
export default class PixelLoaderComponent {
  private readonly destroyRef = inject(DestroyRef);

  /**
   * @component Whether the loader is active. When it flips to `false` the loader honours
   * `minDuration` before hiding; when `true` it honours `showDelay` before showing.
   * @type {boolean}
   * @default true
   */
  readonly loading = input(true, { transform: booleanAttribute });

  /**
   * @component Animated indicator style.
   * @type {PixelLoaderType}
   * @default 'spinner'
   */
  readonly type = input<PixelLoaderType>('spinner');

  /**
   * @component Density size scale.
   * @type {PixelLoaderSize}
   * @default 'md'
   */
  readonly size = input<PixelLoaderSize>('md');

  /**
   * @component Primary loading label rendered beside / beneath the indicator and announced to
   * screen readers.
   * @type {string}
   * @default ''
   */
  readonly text = input('');

  /**
   * @component Secondary description rendered under the primary text.
   * @type {string}
   * @default ''
   */
  readonly description = input('');

  /**
   * @component Centers the loader within its container (both axes).
   * @type {boolean}
   * @default false
   */
  readonly centered = input(false, { transform: booleanAttribute });

  /**
   * @component Animate the indicator. Set `false` for a static placeholder (also overridden by
   * `prefers-reduced-motion`).
   * @type {boolean}
   * @default true
   */
  readonly animated = input(true, { transform: booleanAttribute });

  /**
   * @component Delay in ms before the loader appears. Prevents flashing for fast operations.
   * @type {number}
   * @default 0
   */
  readonly showDelay = input(0, { transform: numberAttribute });

  /**
   * @component Minimum time in ms the loader stays visible once shown. Prevents flickering.
   * @type {number}
   * @default 0
   */
  readonly minDuration = input(0, { transform: numberAttribute });

  /**
   * @component Accessible label override. Defaults to the text, then `'Loading'`.
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * @component Extra static classes appended to the host.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /** Emits whenever the resolved visibility changes (after delay / min-duration are applied). */
  readonly visibilityChange = output<PixelLoaderVisibilityEvent>();

  /** Internal resolved visibility, driven by the delay / min-duration effect below. */
  private readonly visibleSignal = signal(false);
  /** Timestamp (epoch ms) the loader last became visible — used for `minDuration`. */
  private shownAt = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  /** Whether the loader is currently rendered (post delay/min-duration arbitration). */
  readonly visible = this.visibleSignal.asReadonly();

  /** `aria-busy` mirrors the active loading flag. */
  protected readonly busy = computed(() => this.loading());

  protected readonly hasText = computed(
    () => this.text().trim() !== '' || this.description().trim() !== '',
  );

  protected readonly resolvedAriaLabel = computed(() => {
    const explicit = this.ariaLabel().trim();
    if (explicit) {
      return explicit;
    }
    const text = this.text().trim();
    return text || 'Loading';
  });

  /** Whether the indicator should animate (respecting `animated`). */
  protected readonly indicatorAnimated = computed(() => this.animated());

  /** A fixed-length array driving `@for` rendering of multi-dot indicators. */
  protected readonly dots = [0, 1, 2];
  /** Five bars for the `bars` / `wave` equalizer indicators. */
  protected readonly barsTrack = [0, 1, 2, 3, 4];

  /** Spinner SVG geometry — shares `--pixel-loader-dimension` / `--pixel-loader-thickness`. */
  private readonly spinnerMetrics = computed(() => LOADER_SIZE_METRICS[this.size()]);

  protected readonly spinnerDiameter = computed(() => this.spinnerMetrics().dimension);

  protected readonly spinnerStrokeWidth = computed(() => this.spinnerMetrics().thickness);

  protected readonly spinnerCircleRadius = computed(
    () => (this.spinnerDiameter() - this.spinnerStrokeWidth()) / 2,
  );

  protected readonly spinnerViewBox = computed(
    () => `0 0 ${this.spinnerDiameter()} ${this.spinnerDiameter()}`,
  );

  protected readonly spinnerCircumference = computed(
    () => 2 * Math.PI * this.spinnerCircleRadius(),
  );

  constructor() {
    effect(() => {
      if (this.loading()) {
        this.scheduleShow();
      } else {
        this.scheduleHide();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearTimers();
    });
  }

  private scheduleShow(): void {
    this.clearHideTimer();
    if (this.visibleSignal()) {
      return;
    }
    const delay = Math.max(0, this.showDelay());
    if (delay === 0) {
      this.setVisible(true);
      return;
    }
    this.clearShowTimer();
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.setVisible(true);
    }, delay);
  }

  private scheduleHide(): void {
    this.clearShowTimer();
    if (!this.visibleSignal()) {
      return;
    }
    const remaining = this.shownAt + Math.max(0, this.minDuration()) - Date.now();
    if (remaining <= 0) {
      this.setVisible(false);
      return;
    }
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.setVisible(false);
    }, remaining);
  }

  private setVisible(value: boolean): void {
    if (this.visibleSignal() === value) {
      return;
    }
    this.visibleSignal.set(value);
    if (value) {
      this.shownAt = Date.now();
    }
    this.visibilityChange.emit({ visible: value });
  }

  private clearTimers(): void {
    this.clearShowTimer();
    this.clearHideTimer();
  }

  private clearShowTimer(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  private clearHideTimer(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
