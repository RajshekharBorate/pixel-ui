import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type PixelContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Centers page content and caps its width per breakpoint, with consistent responsive inline
 * padding. The base layout primitive for page-level content — wrap a page/section's main content
 * in it instead of hand-rolling `max-inline-size` + `margin-inline: auto` per page.
 *
 * @example
 * ```html
 * <pixel-container>
 *   <h1>Dashboard</h1>
 * </pixel-container>
 * <pixel-container maxWidth="xl" [padded]="false">…</pixel-container>
 * ```
 */
@Component({
  selector: 'pixel-container',
  template: `<ng-content />`,
  host: {
    class: 'pixel-container',
    '[class.pixel-container--padded]': 'padded()',
    '[attr.data-max-width]': 'fluid() ? "full" : maxWidth()',
  },
  styleUrl: './pixel-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelContainerComponent {
  /**
   * Width cap preset.
   *
   * @type {'sm' | 'md' | 'lg' | 'xl' | 'full'}
   * @default 'lg'
   */
  readonly maxWidth = input<PixelContainerMaxWidth>('lg');

  /** Bypasses `maxWidth` entirely (100% width) — equivalent to `maxWidth="full"`. */
  readonly fluid = input(false, { transform: booleanAttribute });

  /** Responsive inline padding using the shared spacing scale. */
  readonly padded = input(true, { transform: booleanAttribute });
}
