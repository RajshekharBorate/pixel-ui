import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

export type PixelChartSparklineVariant = 'line' | 'area';
export type PixelChartSparklineTone = 'default' | 'success' | 'warning' | 'error';

let nextId = 0;

/**
 * Build an SVG polyline/area path for sparkline values (viewBox 0 0 100 32).
 */
export function buildSparklinePath(
  values: readonly (number | null)[],
  options?: { readonly area?: boolean },
): { readonly line: string; readonly area: string } {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length === 0) {
    return { line: '', area: '' };
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const usable = values
    .map((v, i) => (v != null && Number.isFinite(v) ? { i, v } : null))
    .filter((p): p is { i: number; v: number } => p != null);
  if (usable.length === 0) {
    return { line: '', area: '' };
  }
  const n = Math.max(values.length - 1, 1);
  const points = usable.map(({ i, v }) => {
    const x = (i / n) * 100;
    const y = 28 - ((v - min) / span) * 24;
    return { x, y };
  });
  const line = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  if (!options?.area) {
    return { line, area: '' };
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const area = `${line} L${last.x.toFixed(2)} 32 L${first.x.toFixed(2)} 32 Z`;
  return { line, area };
}

/**
 * Tiny inline trend chart — custom SVG, **no ECharts**.
 * Use in tables, KPI cards, and dense dashboards where a full chart host is too heavy.
 */
@Component({
  selector: 'pixel-chart-sparkline',
  imports: [PixelSkeletonComponent],
  template: `
    @if (showSkeleton()) {
      <pixel-skeleton
        class="pixel-chart-sparkline__skeleton"
        preset="chart"
        chartVariant="line"
        [height]="heightCss()"
      />
    } @else {
      <svg
        class="pixel-chart-sparkline__svg"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        @if (paths().area) {
          <path class="pixel-chart-sparkline__area" [attr.d]="paths().area" />
        }
        @if (paths().line) {
          <path class="pixel-chart-sparkline__line" [attr.d]="paths().line" fill="none" />
        }
      </svg>
    }
    <span class="pixel-chart-sparkline__sr-only">{{ resolvedLabel() }}</span>
  `,
  styleUrl: './pixel-chart-sparkline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-chart-sparkline',
    role: 'img',
    '[id]': 'id() || fallbackId',
    '[attr.aria-label]': 'resolvedLabel()',
    '[attr.aria-busy]': 'showSkeleton() ? "true" : null',
    '[attr.data-variant]': 'variant()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-empty]': 'isEmpty() ? "true" : null',
    '[attr.data-skeleton]': 'showSkeleton() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[style.--pixel-chart-sparkline-inline-size]': 'widthCss()',
    '[style.--pixel-chart-sparkline-block-size]': 'heightCss()',
  },
})
export default class PixelChartSparklineComponent {
  protected readonly fallbackId = `pixel-chart-sparkline-${++nextId}`;

  /**
   * Numeric samples (null gaps are skipped in the path).
   *
   * @type {readonly (number | null)[]}
   * @default []
   */
  readonly values = input<readonly (number | null)[]>([]);

  /**
   * Stroke only vs filled area under the line.
   *
   * @type {'line' | 'area'}
   * @default 'line'
   */
  readonly variant = input<PixelChartSparklineVariant>('line');

  /**
   * Semantic color tone.
   *
   * @type {'default' | 'success' | 'warning' | 'error'}
   * @default 'default'
   */
  readonly tone = input<PixelChartSparklineTone>('default');

  /**
   * Accessible name (required for meaningful use).
   *
   * @type {string}
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Optional id override.
   *
   * @type {string}
   * @default ''
   */
  readonly id = input('');

  /**
   * CSS width (length or px number).
   *
   * @type {string | number}
   * @default '6rem'
   */
  readonly width = input<string | number>('6rem');

  /**
   * CSS height (length or px number).
   *
   * @type {string | number}
   * @default '2rem'
   */
  readonly height = input<string | number>('2rem');

  /**
   * Muted / non-interactive presentation hint.
   *
   * @type {boolean}
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Replace the SVG with a line-shaped chart skeleton sized to the sparkline height.
   *
   * @type {boolean}
   * @default false
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  protected readonly isEmpty = computed(() => {
    const vals = this.values();
    return vals.length === 0 || vals.every((v) => v == null || !Number.isFinite(v));
  });

  protected readonly paths = computed(() =>
    buildSparklinePath(this.values(), { area: this.variant() === 'area' }),
  );

  protected readonly resolvedLabel = computed(() => {
    const label = this.ariaLabel().trim();
    if (label) {
      return label;
    }
    const nums = this.values().filter((v): v is number => v != null && Number.isFinite(v));
    if (nums.length === 0) {
      return 'Empty sparkline';
    }
    const first = nums[0]!;
    const last = nums[nums.length - 1]!;
    const delta = last - first;
    const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    return `Sparkline ${dir}, ${nums.length} points, from ${first} to ${last}`;
  });

  protected readonly widthCss = computed(() => cssLength(this.width()));
  protected readonly heightCss = computed(() => cssLength(this.height()));
}

function cssLength(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}
