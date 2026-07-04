import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

export type PixelEmptyStateSize = 'sm' | 'md' | 'lg';
export type PixelEmptyStateAlign = 'start' | 'center';

let nextEmptyStateId = 0;

/**
 * Designed placeholder for regions with nothing to show — no data yet, no search results,
 * an empty filter outcome, or a first-use state. Renders an icon (or a custom
 * `[pixelEmptyStateMedia]` illustration), a heading, a description, and an optional
 * `[pixelEmptyStateActions]` row, so consumers never leave a blank region.
 *
 * @example
 * ```html
 * <pixel-empty-state icon="search_off" heading="No results" description="Try fewer filters.">
 *   <pixel-button pixelEmptyStateActions appearance="tonal">Clear filters</pixel-button>
 * </pixel-empty-state>
 * ```
 */
@Component({
  selector: 'pixel-empty-state',
  templateUrl: './pixel-empty-state.html',
  styleUrl: './pixel-empty-state.scss',
  host: {
    class: 'pixel-empty-state',
    '[attr.data-size]': 'size()',
    '[attr.data-align]': 'align()',
    '[attr.id]': 'id() || fallbackId',
    '[attr.role]': "announce() ? 'status' : null",
    '[attr.aria-live]': "announce() ? 'polite' : null",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelEmptyStateComponent {
  protected readonly fallbackId = `pixel-empty-state-${++nextEmptyStateId}`;

  /**
   * Optional element id applied to the host.
   *
   * @type {string}
   * @default ''
   * @description Stable id for `aria-describedby` references from the emptied region.
   */
  readonly id = input('');

  /**
   * Material Symbols ligature rendered as the visual.
   *
   * @type {string}
   * @default ''
   * @description Decorative (`aria-hidden`); skipped when empty or when
   * `[pixelEmptyStateMedia]` content is projected alongside.
   */
  readonly icon = input('');

  /**
   * Short headline stating what is empty.
   *
   * @type {string}
   * @default ''
   * @description Keep it factual ("No results"), not apologetic.
   */
  readonly heading = input('');

  /**
   * Supporting copy explaining why and what to do next.
   *
   * @type {string}
   * @default ''
   * @description Projected default-slot content renders below this when both are present.
   */
  readonly description = input('');

  /**
   * Density preset scaling icon, type, and spacing.
   *
   * @type {'sm' | 'md' | 'lg'}
   * @default 'md'
   * @description `sm` suits table/list bodies, `lg` suits full-page states.
   */
  readonly size = input<PixelEmptyStateSize>('md');

  /**
   * Horizontal alignment of the content stack.
   *
   * @type {'start' | 'center'}
   * @default 'center'
   * @description `start` reads better inside dense list/table containers.
   */
  readonly align = input<PixelEmptyStateAlign>('center');

  /**
   * Announces the empty state to assistive technology when it appears.
   *
   * @type {boolean}
   * @default false
   * @description Adds `role="status"` + `aria-live="polite"` — enable for empty states that
   * replace content after async searches or filtering, not for static first-render states.
   */
  readonly announce = input(false, { transform: booleanAttribute });
}
