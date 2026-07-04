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
} from '@angular/core';
import PixelLoaderComponent from './pixel-loader';
import {
  type PixelLoaderScope,
  type PixelLoaderSize,
  type PixelLoaderType,
} from './pixel-loader.types';

/**
 * Overlay / section / fullscreen loading wrapper.
 *
 * Wraps projected content and, while `loading` is true, draws a themed backdrop with a centered
 * {@link PixelLoaderComponent} on top. Choose the `scope` to control footprint
 * (`inline` ▸ `section` ▸ `overlay` ▸ `fullscreen`), optionally `blur` / `dim` the content
 * behind it and `lockScroll` to block interaction. Composes the base loader rather than
 * re-implementing it, so every loader `type` and the anti-flicker
 * `showDelay` / `minDuration` logic are available here too. Fullscreen mode locks `body`
 * scrolling for as long as it is shown.
 *
 * @example
 * ```html
 * <!-- Section overlay over a card while data loads -->
 * <pixel-loading-container [loading]="pending()" scope="section" text="Loading orders" blur>
 *   <article class="card">…</article>
 * </pixel-loading-container>
 *
 * <!-- Full-screen app bootstrap loader -->
 * <pixel-loading-container [loading]="booting()" scope="fullscreen"
 *   text="Starting up" description="Preparing your workspace" />
 * ```
 */
@Component({
  selector: 'pixel-loading-container',
  imports: [PixelLoaderComponent],
  templateUrl: './pixel-loading-container.html',
  styleUrl: './pixel-loading-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-loading-container',
    '[attr.data-scope]': 'scope()',
    '[class.pixel-loading-container--active]': 'loading()',
    '[class.pixel-loading-container--blur]': 'blur() && loading()',
    '[class.pixel-loading-container--dim]': 'dim() && loading()',
    '[class.pixel-loading-container--locked]': 'lockInteraction() && loading()',
  },
})
export default class PixelLoadingContainerComponent {
  private readonly destroyRef = inject(DestroyRef);

  /**
   * @component Whether the loading overlay is shown.
   * @type {boolean}
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * @component Footprint of the overlay.
   * - `inline` — sits in the normal flow (no backdrop).
   * - `section` — absolutely covers the wrapped content.
   * - `overlay` — same as `section` with a stronger scrim.
   * - `fullscreen` — fixed, covers the viewport and locks `body` scroll.
   * @type {PixelLoaderScope}
   * @default 'section'
   */
  readonly scope = input<PixelLoaderScope>('section');

  /**
   * @component Indicator style passed through to the inner loader.
   * @type {PixelLoaderType}
   * @default 'spinner'
   */
  readonly type = input<PixelLoaderType>('spinner');

  /**
   * @component Size of the inner loader indicator.
   * @type {PixelLoaderSize}
   * @default 'lg'
   */
  readonly size = input<PixelLoaderSize>('lg');

  /**
   * @component Primary loading text.
   * @type {string}
   * @default ''
   */
  readonly text = input('');

  /**
   * @component Secondary description.
   * @type {string}
   * @default ''
   */
  readonly description = input('');

  /**
   * @component Blur the wrapped content behind the overlay.
   * @type {boolean}
   * @default false
   */
  readonly blur = input(false, { transform: booleanAttribute });

  /**
   * @component Dim the wrapped content behind the overlay.
   * @type {boolean}
   * @default true
   */
  readonly dim = input(true, { transform: booleanAttribute });

  /**
   * @component Block pointer interaction with the wrapped content while loading.
   * @type {boolean}
   * @default true
   */
  readonly lockInteraction = input(true, { transform: booleanAttribute });

  /**
   * @component Delay in ms before the overlay appears (anti-flash).
   * @type {number}
   * @default 0
   */
  readonly showDelay = input(0, { transform: numberAttribute });

  /**
   * @component Minimum time in ms the overlay stays visible once shown (anti-flicker).
   * @type {number}
   * @default 0
   */
  readonly minDuration = input(0, { transform: numberAttribute });

  /**
   * @component Extra static classes appended to the inner loader.
   * @type {string}
   * @default ''
   */
  readonly className = input('');

  /** Whether this container should lock the document body (fullscreen only). */
  private readonly locksBody = computed(
    () => this.scope() === 'fullscreen' && this.loading(),
  );

  constructor() {
    effect(() => {
      if (typeof document === 'undefined') {
        return;
      }
      const lock = this.locksBody();
      const body = document.body;
      if (lock) {
        body.style.setProperty('overflow', 'hidden');
      } else {
        body.style.removeProperty('overflow');
      }
    });

    this.destroyRef.onDestroy(() => {
      if (typeof document !== 'undefined') {
        document.body.style.removeProperty('overflow');
      }
    });
  }
}
