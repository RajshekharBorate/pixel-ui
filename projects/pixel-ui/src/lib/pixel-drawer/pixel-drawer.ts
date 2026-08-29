import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
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

export type PixelDrawerPosition = 'start' | 'end' | 'top' | 'bottom';
export type PixelDrawerSize = 'sm' | 'md' | 'lg' | 'xl';

let nextDrawerId = 0;

// Keep in sync with the slide animation duration in pixel-drawer.scss.
const LEAVE_DURATION_MS = 240;

/**
 * Accessible slide-in drawer / side panel with a scrim, focus trap, and smooth slide-in / slide-out
 * animation. Two-way bind `open` (or call `toggle()` / `open.set(true)` from a template ref). Ideal
 * for hosting wizards and detail panels. The overlay is relocated to `document.body` while open for
 * correct stacking, body scroll is locked without layout shift, and trigger focus is restored on
 * close.
 *
 * @example
 * ```html
 * <button (click)="wizard.open.set(true)">Create</button>
 * <pixel-drawer #wizard title="Create policy" position="end" size="lg">
 *   <app-create-wizard (done)="wizard.close()" />
 * </pixel-drawer>
 * ```
 */
@Component({
  selector: 'pixel-drawer',
  imports: [PixelButtonComponent],
  template: `
    <div
      #overlay
      class="pixel-drawer__overlay"
      [class.pixel-drawer__overlay--present]="present()"
      [class.pixel-drawer__overlay--leaving]="leaving()"
      [attr.data-position]="position()"
    >
      <div class="pixel-drawer__scrim" (click)="onScrimClick()"></div>

      <aside
        #surface
        class="pixel-drawer__surface"
        [class]="panelClass()"
        [attr.data-position]="position()"
        [attr.data-size]="size()"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="title() && !ariaLabel() ? titleId : null"
        [attr.aria-describedby]="ariaDescribedBy() || null"
        (keydown)="onKeydown($event)"
      >
        @if (title() || dismissable()) {
          <header
            class="pixel-drawer__header"
            [class.pixel-drawer__header--divided]="bodyScrolledFromTop()"
          >
            <ng-content select="[pixelDrawerHeader]" />
            @if (title()) {
              <h2 class="pixel-drawer__title" [id]="titleId">{{ title() }}</h2>
            }
            @if (dismissable()) {
              <pixel-button
                class="pixel-drawer__close"
                appearance="icon"
                size="sm"
                leadingIcon="close"
                [ariaLabel]="closeAriaLabel()"
                (click)="requestClose('close')"
              />
            }
          </header>
        }

        <div #body class="pixel-drawer__body" (scroll)="onBodyScroll()">
          <ng-content />
        </div>

        <footer
          class="pixel-drawer__footer"
          [class.pixel-drawer__footer--divided]="bodyScrollableToBottom()"
        >
          <ng-content select="[pixelDrawerFooter]" />
        </footer>
      </aside>
    </div>
  `,
  styleUrl: './pixel-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelDrawerComponent {
  private readonly overlayRef = viewChild.required<ElementRef<HTMLElement>>('overlay');
  private readonly surfaceRef = viewChild.required<ElementRef<HTMLElement>>('surface');
  private readonly bodyRef = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly destroyRef = inject(DestroyRef);
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });

  /** Two-way open state. */
  readonly open = model(false);

  /** Edge the drawer slides in from. */
  readonly position = input<PixelDrawerPosition>('end');

  /** Size preset (width for start/end, height for top/bottom). */
  readonly size = input<PixelDrawerSize>('md');

  /** Optional title rendered in the default header. */
  readonly title = input('');

  /**
   * Stable analytics id for this drawer instance.
   *
   * @type {string}
   * @default ''
   * @description When `PIXEL_UI_ANALYTICS` is provided, open/close emit
   * `ui.drawer.open` / `ui.drawer.close` with this id.
   */
  readonly analyticsId = input('');

  /**
   * Extra analytics properties (reserved keys win).
   *
   * @type {Record<string, unknown>}
   * @default {}
   * @description Adds non-sensitive application context to drawer analytics events.
   */
  readonly analyticsProperties = input<Record<string, unknown>>({});

  /** Allows closing via scrim click, Escape, and the header close button. */
  readonly dismissable = input(true, { transform: booleanAttribute });

  /** Extra class(es) applied to the drawer surface for one-off styling. */
  readonly panelClass = input('');

  /** Accessible label (overrides title for labelling). */
  readonly ariaLabel = input('');

  /**
   * Accessible name for the header dismiss control.
   *
   * @type {string}
   * @default 'Close panel'
   */
  readonly closeAriaLabel = input('Close panel');

  /** Space-separated ids describing the drawer body (maps to `aria-describedby`). */
  readonly ariaDescribedBy = input('');

  /** Emits when the drawer closes (any reason), after the exit animation completes. */
  readonly closed = output<void>();

  /** Emits once the drawer has finished opening (after the first frame is painted). */
  readonly opened = output<void>();

  /**
   * Emits on every scrim (backdrop) click, regardless of `dismissable`. Use to react to backdrop
   * interactions even when dismissal is disabled (mirrors Material's `backdropClick`).
   */
  readonly scrimClick = output<void>();

  protected readonly titleId = `pixel-drawer-title-${++nextDrawerId}`;

  // `present` keeps the overlay rendered (display) through the exit animation; `leaving` toggles
  // the slide-out classes. `open` is the consumer-facing state.
  protected readonly present = signal(false);
  protected readonly leaving = signal(false);

  // Scroll-shadow state: divider under the header once scrolled, divider above the footer while
  // there is more body content to scroll to.
  protected readonly bodyScrolledFromTop = signal(false);
  protected readonly bodyScrollableToBottom = signal(false);

  private previousFocus: HTMLElement | null = null;
  private relocated = false;
  private previouslyOpen = false;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;
  private analyticsCloseReason: 'escape' | 'scrim' | 'close' | 'programmatic' = 'programmatic';
  private scrollLocked = false;

  constructor() {
    effect(() => {
      const open = this.open();
      if (open) {
        this.beginOpen();
      } else if (this.previouslyOpen) {
        this.beginClose();
      }
      this.previouslyOpen = open;
    });

    // The overlay is relocated to <body> on open; remove the orphaned node and release the body
    // scroll lock when the component is destroyed (e.g. on route change) so it can't linger in the
    // DOM after its scoped styles are torn down.
    this.destroyRef.onDestroy(() => {
      if (this.leaveTimer) {
        clearTimeout(this.leaveTimer);
      }
      if (this.relocated) {
        const overlay = this.overlayRef().nativeElement;
        overlay.parentNode?.removeChild(overlay);
      }
      if (this.scrollLocked) {
        this.scrollLocked = false;
        unlockBodyScroll();
      }
    });
  }

  /** Toggles the drawer open/closed. */
  toggle(): void {
    this.open.update((value) => !value);
  }

  close(reason: 'escape' | 'scrim' | 'close' | 'programmatic' = 'programmatic'): void {
    this.analyticsCloseReason = reason;
    if (this.open()) {
      this.open.set(false);
    }
  }

  /** Close in response to a user dismissal gesture (scrim/Escape/close button). */
  protected requestClose(reason: 'escape' | 'scrim' | 'close' = 'close'): void {
    if (this.dismissable()) {
      this.close(reason);
    }
  }

  protected onScrimClick(): void {
    this.scrimClick.emit();
    this.requestClose('scrim');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.leaving()) {
      return;
    }
    if (event.key === 'Escape' && this.dismissable()) {
      event.preventDefault();
      this.close('escape');
      return;
    }
    if (event.key === 'Tab') {
      trapFocus(event, this.surfaceRef().nativeElement);
    }
  }

  protected onBodyScroll(): void {
    this.measureBodyScroll();
  }

  private beginOpen(): void {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
    this.leaving.set(false);
    this.present.set(true);

    const overlay = this.overlayRef().nativeElement;
    if (!this.relocated) {
      getOverlayContainer().appendChild(overlay);
      this.relocated = true;
    }
    this.previousFocus = document.activeElement as HTMLElement;
    if (!this.scrollLocked) {
      this.scrollLocked = true;
      lockBodyScroll();
    }
    requestAnimationFrame(() => {
      this.focusInitial();
      this.measureBodyScroll();
      this.opened.emit();
      this.emitAnalytics('ui.drawer.open');
    });
  }

  private beginClose(): void {
    if (prefersReducedMotion()) {
      this.finalizeClose();
      return;
    }
    this.leaving.set(true);
    this.leaveTimer = setTimeout(() => {
      this.leaveTimer = null;
      this.finalizeClose();
    }, LEAVE_DURATION_MS);
  }

  private finalizeClose(): void {
    this.leaving.set(false);
    this.present.set(false);
    if (this.scrollLocked) {
      this.scrollLocked = false;
      unlockBodyScroll();
    }
    if (this.previousFocus && document.contains(this.previousFocus)) {
      this.previousFocus.focus();
    }
    this.previousFocus = null;
    this.bodyScrolledFromTop.set(false);
    this.bodyScrollableToBottom.set(false);
    this.closed.emit();
    this.emitAnalytics('ui.drawer.close');
  }

  private emitAnalytics(name: 'ui.drawer.open' | 'ui.drawer.close'): void {
    const drawerId = this.analyticsId().trim();
    emitPixelUiAnalytics(this.analytics, {
      name,
      component: 'pixel-drawer',
      extras: this.analyticsProperties(),
      reserved: {
        ...(drawerId ? { drawerId } : {}),
        position: this.position(),
        size: this.size(),
        ...(name === 'ui.drawer.close' ? { reason: this.analyticsCloseReason } : {}),
      },
    });
    if (name === 'ui.drawer.close') {
      this.analyticsCloseReason = 'programmatic';
    }
  }

  private measureBodyScroll(): void {
    const body = this.bodyRef().nativeElement;
    const scrollable = body.scrollHeight - body.clientHeight > 1;
    this.bodyScrolledFromTop.set(body.scrollTop > 1);
    this.bodyScrollableToBottom.set(
      scrollable && body.scrollTop + body.clientHeight < body.scrollHeight - 1,
    );
  }

  private focusInitial(): void {
    const surface = this.surfaceRef().nativeElement;
    const focusables = getFocusableElements(surface);
    (focusables[0] ?? surface).focus();
  }
}
