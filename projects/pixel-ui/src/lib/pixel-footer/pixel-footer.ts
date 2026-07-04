import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * App-level footer shell region. Renders a real `<footer>` element for correct landmark semantics.
 * Deliberately minimal — pins to the bottom of the page via `pixel-app-shell`'s grid row, not its
 * own `position: sticky`.
 *
 * @example
 * ```html
 * <pixel-footer>
 *   <span>© 2026 Acme Inc.</span>
 * </pixel-footer>
 * ```
 */
@Component({
  selector: 'pixel-footer',
  template: `
    <footer class="pixel-footer__bar">
      <ng-content />
    </footer>
  `,
  host: {
    class: 'pixel-footer',
    '[class.pixel-footer--bordered]': 'bordered()',
  },
  styleUrl: './pixel-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelFooterComponent {
  /** Top divider separating the footer from page content. */
  readonly bordered = input(true, { transform: booleanAttribute });
}
