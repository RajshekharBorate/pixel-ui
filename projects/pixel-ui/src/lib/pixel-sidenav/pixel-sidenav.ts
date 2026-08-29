import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { PIXEL_APP_SHELL } from '../pixel-app-shell/pixel-app-shell.tokens';
import { PIXEL_BREAKPOINT_PX } from '../shared/breakpoints';
import { getOverlayContainer } from '../shared/overlay/connected-overlay';
import {
  getFocusableElements,
  lockBodyScroll,
  prefersReducedMotion,
  trapFocus,
  unlockBodyScroll,
} from '../shared/overlay-utils';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';

export type PixelSidenavMode = 'side' | 'over';
export type PixelSidenavPosition = 'start' | 'end';
export type PixelSidenavSize = 'sm' | 'md' | 'lg';
export type PixelSidenavAutoCollapse = 'sm' | 'md' | 'lg' | 'xl' | 'none';
export type PixelSidenavCollapseTo = 'hidden' | 'rail';

const SIZE_REM: Record<PixelSidenavSize, number> = { sm: 14, md: 16, lg: 20 };

// Keep in sync with the slide transition duration in pixel-sidenav.scss.
const LEAVE_DURATION_MS = 200;

let nextSidenavId = 0;

/**
 * Collapsible/dockable side-navigation panel. Declares a preferred `mode` — `'side'` (docked,
 * in-flow, pushes/reserves layout space) or `'over'` (overlay, scrim, focus-trapped) — but
 * automatically switches to `'over'` below `autoCollapseBreakpoint` regardless of `mode`, so a
 * desktop-docked sidenav becomes a mobile drawer without any consumer wiring.
 *
 * Unlike `pixel-drawer` (which always relocates to `document.body` on open and never moves back),
 * this component keeps ONE persistent template — including any projected nav content — and instead
 * reparents its own root node between an in-flow position (docked) and the shared overlay layer
 * (overlay), so switching modes on viewport resize never destroys/recreates projected content or its
 * component state. It reuses the same shared overlay primitives as `pixel-drawer`
 * (`getOverlayContainer()`, focus trap, body scroll lock) for the overlay mode.
 *
 * Optionally projects a `pixelSidenavBrand` slot — a non-scrolling header region (matching
 * `pixel-header`'s 4rem height and bottom border, so the two lines align when composed inside
 * `pixel-app-shell`) for a logo/brand mark and an expand/collapse toggle. Everything else
 * projected (the default slot) becomes the scrolling nav/items region below it. Omitting
 * `pixelSidenavBrand` entirely renders no extra height or border — existing simple usages are
 * unaffected.
 *
 * @example
 * ```html
 * <pixel-sidenav mode="side" [(opened)]="navOpen">
 *   <div pixelSidenavBrand>
 *     <span class="brand-mark">Acme</span>
 *     <pixel-button appearance="icon" leadingIcon="menu" (click)="navOpen.set(!navOpen())" />
 *   </div>
 *   <nav>…</nav>
 * </pixel-sidenav>
 * ```
 */
@Component({
  selector: 'pixel-sidenav',
  templateUrl: './pixel-sidenav.html',
  styleUrl: './pixel-sidenav.scss',
  host: {
    '[attr.data-rail]': "isRailCollapsed() ? '' : null",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelSidenavComponent {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly rootRef = viewChild.required<ElementRef<HTMLElement>>('overlayRoot');
  private readonly panelRef = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly destroyRef = inject(DestroyRef);
  private readonly appShell = inject(PIXEL_APP_SHELL, { optional: true });
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });
  private analyticsOpenedPrimed = false;

  /** Author's declared preference; may be overridden by `autoCollapseBreakpoint` — see {@link effectiveMode}. */
  readonly mode = input<PixelSidenavMode>('side');
  /** Edge the panel is docked to / slides in from. */
  readonly position = input<PixelSidenavPosition>('start');
  /** Width preset when docked (`'side'` / effective) — sm 14rem, md 16rem, lg 20rem. */
  readonly size = input<PixelSidenavSize>('md');
  /** Below this breakpoint, `effectiveMode` is forced to `'over'`. `'none'` disables auto-collapse. */
  readonly autoCollapseBreakpoint = input<PixelSidenavAutoCollapse>('md');
  /**
   * What a docked-and-closed sidenav looks like. `'hidden'` (default) collapses to zero width.
   * `'rail'` collapses to `railWidth` instead — a persistent icon-only rail. Purely visual: hiding
   * label text inside the rail is the consumer's responsibility via the `[data-rail]` host
   * attribute this component sets (e.g. `pixel-sidenav[data-rail] .my-label { display: none; }`).
   */
  readonly collapseTo = input<PixelSidenavCollapseTo>('hidden');
  /** Width, in rem, of the icon rail when `collapseTo="rail"`. */
  readonly railWidth = input(4.5, { transform: numberAttribute });
  /** Allows closing via scrim click and Escape while in overlay mode. */
  readonly dismissable = input(true, { transform: booleanAttribute });
  /**
   * Bottom border on the `pixelSidenavBrand` region (mirrors `pixel-header`'s `bordered` input).
   * Automatically suppressed when composed inside a `pixel-app-shell` with a `pixel-header`
   * present — its single shared toolbar-divider already draws that line, so this one would just be
   * redundant (and can visibly double up at non-integer devicePixelRatio, where two
   * independently-painted borders land on slightly different physical pixels). Only takes effect
   * for standalone (non-app-shell) usage; see {@link effectiveBrandBordered}.
   */
  readonly brandBordered = input(true, { transform: booleanAttribute });
  /** Resolves `brandBordered` against `pixel-app-shell`'s context — see `PixelAppShellContext`. */
  protected readonly effectiveBrandBordered = computed(() =>
    this.appShell?.hasHeader() ? false : this.brandBordered(),
  );
  /** Accessible label for the panel (only meaningful if the page has more than one landmark). */
  readonly ariaLabel = input('');

  /**
   * Stable analytics id for this sidenav (e.g. `app-nav`).
   *
   * @type {string}
   * @default ''
   * @description When `PIXEL_UI_ANALYTICS` is provided, open/close emit `ui.sidenav.open` /
   * `ui.sidenav.close` (skips the initial bind).
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Readonly<Record<string, unknown>> | undefined}
   * @default undefined
   */
  readonly analyticsProperties = input<Readonly<Record<string, unknown>> | undefined>(undefined);

  /** Two-way open state. */
  readonly opened = model(true);
  /** Emits whenever the effective mode changes (e.g. crossing the auto-collapse breakpoint). */
  readonly modeChange = output<PixelSidenavMode>();

  /** Width, in rem, for the current `size`. */
  readonly extentRem = computed(() => SIZE_REM[this.size()]);

  private readonly isCompact = signal(false);
  /** The mode actually in effect once the auto-collapse breakpoint is taken into account. */
  readonly effectiveMode = computed<PixelSidenavMode>(() => (this.isCompact() ? 'over' : this.mode()));

  /** True while docked-and-closed with `collapseTo="rail"` — drives the `[data-rail]` host attribute. */
  protected readonly isRailCollapsed = computed(
    () => this.effectiveMode() === 'side' && !this.opened() && this.collapseTo() === 'rail',
  );

  /**
   * True when the panel should be `inert` (unfocusable, excluded from hit-testing). Closed panels
   * are normally inert — but a rail-collapsed panel is still visually present and meant to stay
   * interactive (its icons, and any toggle projected into `pixelSidenavBrand`, must stay clickable),
   * so it's the one closed state that's exempt.
   */
  protected readonly isInert = computed(() => !this.opened() && !this.isRailCollapsed());

  /**
   * Current horizontal space this sidenav occupies: `0` in overlay mode (it doesn't reserve grid
   * space — it overlays), `extentRem()` when open, and either `railWidth()` or `0` when
   * docked-and-closed depending on `collapseTo`. The single source of truth `pixel-app-shell` reads
   * to size its content grid column.
   */
  readonly effectiveExtentRem = computed(() => {
    if (this.effectiveMode() === 'over') {
      return 0;
    }
    if (this.opened()) {
      return this.extentRem();
    }
    return this.collapseTo() === 'rail' ? this.railWidth() : 0;
  });

  protected readonly present = signal(false);
  protected readonly leaving = signal(false);

  private relocated = false;
  private scrollLocked = false;
  private previousFocus: HTMLElement | null = null;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEmittedMode: PixelSidenavMode | null = null;

  constructor() {
    // Track the auto-collapse breakpoint via matchMedia; re-subscribes if the breakpoint input changes.
    effect((onCleanup) => {
      const bp = this.autoCollapseBreakpoint();
      if (bp === 'none' || typeof matchMedia !== 'function') {
        this.isCompact.set(false);
        return;
      }
      const mql = matchMedia(`(max-width: ${PIXEL_BREAKPOINT_PX[bp] - 1}px)`);
      const update = (): void => this.isCompact.set(mql.matches);
      update();
      mql.addEventListener('change', update);
      onCleanup(() => mql.removeEventListener('change', update));
    });

    effect(() => {
      const mode = this.effectiveMode();
      const previous = this.lastEmittedMode;
      this.lastEmittedMode = mode;
      if (previous !== null && previous !== mode) {
        this.modeChange.emit(mode);
      }
    });

    effect(() => {
      this.syncPanel(this.effectiveMode(), this.opened());
    });

    effect(() => {
      const isOpen = this.opened();
      if (!this.analyticsOpenedPrimed) {
        this.analyticsOpenedPrimed = true;
        return;
      }
      const sidenavId = this.analyticsId().trim();
      emitPixelUiAnalytics(this.analytics, {
        name: isOpen ? 'ui.sidenav.open' : 'ui.sidenav.close',
        component: 'pixel-sidenav',
        extras: this.analyticsProperties(),
        reserved: {
          ...(sidenavId ? { sidenavId } : {}),
          mode: this.effectiveMode(),
          position: this.position(),
        },
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.leaveTimer) {
        clearTimeout(this.leaveTimer);
      }
      if (this.scrollLocked) {
        unlockBodyScroll();
        this.scrollLocked = false;
      }
      const root = this.rootRef()?.nativeElement;
      if (this.relocated && root?.parentNode) {
        root.parentNode.removeChild(root);
      }
    });
  }

  private syncPanel(mode: PixelSidenavMode, isOpen: boolean): void {
    const root = this.rootRef().nativeElement;

    if (mode === 'over') {
      if (!this.relocated) {
        getOverlayContainer().appendChild(root);
        this.relocated = true;
      }
      if (isOpen) {
        this.beginOverlayOpen();
      } else if (this.present()) {
        this.beginOverlayClose();
      }
      return;
    }

    // Docked ('side'): always in flow, no scrim / focus trap / scroll lock.
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
    this.present.set(false);
    this.leaving.set(false);
    if (this.scrollLocked) {
      unlockBodyScroll();
      this.scrollLocked = false;
    }
    if (this.relocated) {
      this.hostRef.nativeElement.appendChild(root);
      this.relocated = false;
    }
  }

  private beginOverlayOpen(): void {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
    this.leaving.set(false);
    this.present.set(true);
    this.previousFocus = document.activeElement as HTMLElement;
    if (!this.scrollLocked) {
      this.scrollLocked = true;
      lockBodyScroll();
    }
    requestAnimationFrame(() => {
      const panel = this.panelRef().nativeElement;
      const focusables = getFocusableElements(panel);
      (focusables[0] ?? panel).focus();
    });
  }

  private beginOverlayClose(): void {
    // Flip the transform-driving state now (not after the timer) so the CSS transition actually
    // animates the slide-out; `leaving` only keeps the panel mounted/relocated for the duration.
    this.present.set(false);
    if (this.scrollLocked) {
      unlockBodyScroll();
      this.scrollLocked = false;
    }
    if (this.previousFocus && document.contains(this.previousFocus)) {
      this.previousFocus.focus();
    }
    this.previousFocus = null;

    if (prefersReducedMotion()) {
      return;
    }
    this.leaving.set(true);
    this.leaveTimer = setTimeout(() => {
      this.leaveTimer = null;
      this.leaving.set(false);
    }, LEAVE_DURATION_MS);
  }

  protected onScrimClick(): void {
    if (this.dismissable()) {
      this.opened.set(false);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.effectiveMode() !== 'over' || this.leaving()) {
      return;
    }
    if (event.key === 'Escape' && this.dismissable()) {
      event.preventDefault();
      this.opened.set(false);
      return;
    }
    if (event.key === 'Tab') {
      trapFocus(event, this.panelRef().nativeElement);
    }
  }

  /** Toggles the open state. */
  toggle(): void {
    this.opened.update((value) => !value);
  }

  /** Closes the sidenav (no-op if already closed). */
  close(): void {
    this.opened.set(false);
  }
}
