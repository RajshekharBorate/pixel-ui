import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';

export type PixelDividerOrientation = 'horizontal' | 'vertical';
export type PixelDividerVariant = 'solid' | 'dashed' | 'dotted';
export type PixelDividerLabelAlign = 'start' | 'center' | 'end';

/**
 * Thin separator between content groups, list items, menu sections, or layout regions.
 *
 * Supports horizontal/vertical orientation, inset spacing, solid/dashed/dotted lines, and an
 * optional projected label (horizontal only) for "OR"-style section breaks.
 *
 * @example
 * ```html
 * <pixel-divider />
 * <pixel-divider orientation="vertical" />
 * <pixel-divider>Section</pixel-divider>
 * <pixel-divider showSkeleton />
 * ```
 */
@Component({
  selector: 'pixel-divider',
  imports: [PixelSkeletonComponent],
  template: `
    @if (showSkeleton()) {
      <pixel-skeleton
        class="pixel-divider__skeleton"
        shape="rounded"
        [width]="skeletonWidth()"
        [height]="skeletonHeight()"
      />
    } @else if (hasLabel()) {
      <span class="pixel-divider__line" aria-hidden="true"></span>
      <span class="pixel-divider__label"><ng-content /></span>
      <span class="pixel-divider__line" aria-hidden="true"></span>
    }
  `,
  host: {
    role: 'separator',
    class: 'pixel-divider',
    '[class.pixel-divider--horizontal]': "orientation() === 'horizontal'",
    '[class.pixel-divider--vertical]': "orientation() === 'vertical'",
    '[class.pixel-divider--inset]': 'inset()',
    '[class.pixel-divider--labeled]': 'hasLabel() && !showSkeleton()',
    '[class.pixel-divider--solid]': "variant() === 'solid'",
    '[class.pixel-divider--dashed]': "variant() === 'dashed'",
    '[class.pixel-divider--dotted]': "variant() === 'dotted'",
    '[class.pixel-divider--skeleton]': 'showSkeleton()',
    '[attr.data-label-align]': 'hasLabel() && !showSkeleton() ? labelAlign() : null',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-busy]': 'showSkeleton() ? "true" : null',
  },
  styleUrl: './pixel-divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelDividerComponent {
  /**
   * Line direction.
   *
   * @type {'horizontal' | 'vertical'}
   * @default 'horizontal'
   * @description `vertical` requires a parent with a defined height (e.g. a flex toolbar).
   */
  readonly orientation = input<PixelDividerOrientation>('horizontal');

  /**
   * Adds symmetric inset margin so the rule does not touch container edges.
   *
   * @type {boolean}
   * @default false
   */
  readonly inset = input(false, { transform: booleanAttribute });

  /**
   * Stroke style of the rule.
   *
   * @type {'solid' | 'dashed' | 'dotted'}
   * @default 'solid'
   */
  readonly variant = input<PixelDividerVariant>('solid');

  /**
   * Alignment of the projected label along a horizontal divider.
   *
   * @type {'start' | 'center' | 'end'}
   * @default 'center'
   */
  readonly labelAlign = input<PixelDividerLabelAlign>('center');

  /**
   * Whether the divider renders a projected label.
   *
   * @type {boolean}
   * @default false
   * @description Set this when projecting content so the host can switch to the labeled layout.
   */
  readonly labeled = input(false, { transform: booleanAttribute });

  /**
   * Replaces the rule with a footprint-matched skeleton placeholder.
   *
   * @type {boolean}
   * @default false
   * @description Use while surrounding content is loading so layout does not jump.
   */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  protected readonly hasLabel = computed(() => this.labeled() && !this.showSkeleton());

  protected readonly skeletonWidth = computed(() =>
    this.orientation() === 'vertical' ? '0.25rem' : '100%',
  );

  protected readonly skeletonHeight = computed(() =>
    this.orientation() === 'vertical' ? '100%' : '0.25rem',
  );
}
