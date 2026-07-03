import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { PIXEL_APP_SHELL } from '../pixel-app-shell/pixel-app-shell.tokens';

/**
 * App-level top bar / toolbar shell region. Renders a real `<header>` element for correct landmark
 * semantics. Projects a leading/title area by default, plus a trailing `pixelHeaderActions` slot
 * that's automatically pushed to the end of the row.
 *
 * When composed inside `pixel-app-shell`, `bordered` and `sticky` are automatically suppressed in
 * favor of the shell's own unified toolbar-divider and sticky wrapper — see `PixelAppShellContext`.
 * Both inputs still apply normally for standalone (non-app-shell) usage.
 *
 * @example
 * ```html
 * <pixel-header sticky>
 *   <h1>Dashboard</h1>
 *   <pixel-button pixelHeaderActions appearance="icon" leadingIcon="notifications" />
 * </pixel-header>
 * ```
 */
@Component({
  selector: 'pixel-header',
  standalone: true,
  template: `
    <header class="pixel-header__bar">
      <ng-content />
      <div class="pixel-header__actions">
        <ng-content select="[pixelHeaderActions]" />
      </div>
    </header>
  `,
  host: {
    class: 'pixel-header',
    '[class.pixel-header--sticky]': 'effectiveSticky()',
    '[class.pixel-header--bordered]': 'effectiveBordered()',
  },
  styleUrl: './pixel-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelHeaderComponent {
  private readonly appShell = inject(PIXEL_APP_SHELL, { optional: true });

  /** Pins the header to the top of its nearest scrolling ancestor while scrolling. */
  readonly sticky = input(false, { transform: booleanAttribute });

  /** Bottom divider separating the header from page content. */
  readonly bordered = input(true, { transform: booleanAttribute });

  /**
   * `pixel-app-shell` makes its own `.pixel-app-shell__header` wrapper sticky (see its README for
   * why `sticky` alone has no effect once nested in that grid row) — this component's own
   * `position: sticky` would be redundant there, so it's skipped whenever composed inside one.
   */
  protected readonly effectiveSticky = computed(() =>
    this.appShell?.hasHeader() ? false : this.sticky(),
  );

  /**
   * `pixel-app-shell` draws its own unified toolbar-divider spanning both the header and the
   * sidenav's brand region whenever a header is present — this component's own border would
   * visibly double up alongside it, so it's skipped whenever composed inside one.
   */
  protected readonly effectiveBordered = computed(() =>
    this.appShell?.hasHeader() ? false : this.bordered(),
  );
}
