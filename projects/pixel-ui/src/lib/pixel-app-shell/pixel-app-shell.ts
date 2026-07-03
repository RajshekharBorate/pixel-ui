import { ChangeDetectionStrategy, Component, computed, contentChild } from '@angular/core';
import PixelHeaderComponent from '../pixel-header/pixel-header';
import PixelSidenavComponent from '../pixel-sidenav/pixel-sidenav';
import { PIXEL_APP_SHELL, PixelAppShellContext } from './pixel-app-shell.tokens';

/**
 * Composing root for a full responsive application layout — arranges a header, sidenav, main
 * content, and footer into a CSS Grid. Reads the projected `pixel-sidenav` instance directly (via
 * `contentChild`) and reactively sizes its own grid column to match the sidenav's docked/open state,
 * so the content column reflows correctly with zero imperative wiring from the consumer.
 *
 * When a `pixel-header` is projected, also draws a single full-width divider at the toolbar-height
 * boundary spanning both the header and the sidenav's `pixelSidenavBrand` region — two independently
 * painted borders can land on different physical pixels at non-integer `devicePixelRatio` even when
 * logically identical, so this draws the line once instead of relying on both to coincidentally match.
 *
 * Uses the CSS Grid "sticky footer" pattern — give the shell a `min-block-size` (a floor, not a
 * fixed `block-size`). Short content pushes the footer to the viewport bottom via the `1fr` content
 * row; long content grows the grid past the floor and the whole page scrolls, with the sidenav's own
 * `position: sticky` (capped to `100vh`) keeping it pinned through that scroll.
 *
 * @example
 * ```html
 * <pixel-app-shell>
 *   <pixel-header><h1>Dashboard</h1></pixel-header>
 *   <pixel-sidenav><nav>…</nav></pixel-sidenav>
 *   <pixel-footer>© 2026 Acme Inc.</pixel-footer>
 *   <pixel-container>…</pixel-container>
 * </pixel-app-shell>
 * ```
 */
@Component({
  selector: 'pixel-app-shell',
  standalone: true,
  templateUrl: './pixel-app-shell.html',
  styleUrl: './pixel-app-shell.scss',
  host: {
    class: 'pixel-app-shell',
    '[style.grid-template-columns]': 'sidenavColumnRem() + "rem 1fr"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: PIXEL_APP_SHELL, useExisting: PixelAppShellComponent }],
})
export default class PixelAppShellComponent implements PixelAppShellContext {
  private readonly sidenav = contentChild(PixelSidenavComponent);
  protected readonly header = contentChild(PixelHeaderComponent);

  /** True once a `pixel-header` is projected — see `PixelAppShellContext`. */
  readonly hasHeader = computed(() => !!this.header());

  /**
   * Grid column width (rem) for the sidenav — reads `pixel-sidenav`'s own `effectiveExtentRem()`
   * directly (0 in overlay mode or hidden-collapse, the rail width when rail-collapsed, full width
   * when open) rather than re-deriving that logic here.
   */
  protected readonly sidenavColumnRem = computed(() => this.sidenav()?.effectiveExtentRem() ?? 0);

  /**
   * Whether the `.pixel-app-shell__header` grid cell itself needs to be sticky. `pixel-header`'s
   * own `sticky` input only has room to matter within its containing block — but that's this
   * single-row grid cell (auto-height, exactly as tall as the header), not the whole scrollable
   * page, so `position: sticky` on the header alone has no range to stick within once its own tiny
   * cell scrolls past the viewport. Mirrors `pixel-sidenav`'s own sticky wrapper for the same reason.
   */
  protected readonly headerSticky = computed(() => this.header()?.sticky() ?? false);
}
