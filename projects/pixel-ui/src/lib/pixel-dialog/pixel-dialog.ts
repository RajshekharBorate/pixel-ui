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

export type PixelDialogSize = 'sm' | 'md' | 'lg' | 'fullscreen';
export type PixelDialogPosition = 'center' | 'bottom-sheet';
export type PixelDialogRole = 'dialog' | 'alertdialog';

let nextDialogId = 0;

// Keep in sync with the exit animation duration in pixel-dialog.scss.
const LEAVE_DURATION_MS = 200;

/**
 * Accessible modal dialog with a scrim, focus trap, Escape-to-close, and smooth enter/exit
 * animation.
 *
 * Two-way bind `open`. Project content into the default slot for the body, and use the
 * `[pixelDialogHeader]` / `[pixelDialogFooter]` slots for custom header/footer regions. The
 * overlay is relocated to `document.body` while open for correct stacking, the body scroll is
 * locked without layout shift, and trigger focus is restored on close.
 *
 * @example
 * ```html
 * <pixel-dialog [(open)]="showDetails" title="Policy details" size="lg">
 *   <p>…body…</p>
 *   <div pixelDialogFooter>
 *     <pixel-button appearance="text" (click)="showDetails.set(false)">Close</pixel-button>
 *   </div>
 * </pixel-dialog>
 * ```
 */
@Component({
  selector: 'pixel-dialog',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <div
      #overlay
      class="pixel-dialog__overlay"
      [class.pixel-dialog__overlay--present]="present()"
      [class.pixel-dialog__overlay--leaving]="leaving()"
      [attr.data-position]="position()"
      [attr.data-size]="size()"
    >
      <div class="pixel-dialog__scrim" (click)="onScrimClick()"></div>

      <div
        #surface
        class="pixel-dialog__surface"
        [class]="panelClass()"
        [attr.data-size]="size()"
        [attr.data-position]="position()"
        [attr.role]="role()"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="title() && !ariaLabel() ? titleId : null"
        [attr.aria-describedby]="ariaDescribedBy() || null"
        (keydown)="onKeydown($event)"
      >
        @if (position() === 'bottom-sheet') {
          <div class="pixel-dialog__grabber" aria-hidden="true"></div>
        }

        <header
          class="pixel-dialog__header"
          [class.pixel-dialog__header--divided]="bodyScrolledFromTop()"
        >
          <ng-content select="[pixelDialogHeader]" />
          @if (title()) {
            <h2 class="pixel-dialog__title" [id]="titleId">{{ title() }}</h2>
          }
          @if (dismissable()) {
            <pixel-button
              class="pixel-dialog__close"
              appearance="icon"
              size="sm"
              leadingIcon="close"
              ariaLabel="Close dialog"
              (click)="requestClose()"
            />
          }
        </header>

        <div #body class="pixel-dialog__body" (scroll)="onBodyScroll()">
          <ng-content />
        </div>

        <footer
          class="pixel-dialog__footer"
          [class.pixel-dialog__footer--divided]="bodyScrollableToBottom()"
        >
          <ng-content select="[pixelDialogFooter]" />
        </footer>
      </div>
    </div>
  `,
  styleUrl: './pixel-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelDialogComponent {
  private readonly overlayRef = viewChild.required<ElementRef<HTMLElement>>('overlay');
  private readonly surfaceRef = viewChild.required<ElementRef<HTMLElement>>('surface');
  private readonly bodyRef = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly destroyRef = inject(DestroyRef);

  /** Two-way open state. */
  readonly open = model(false);

  /** Optional title rendered in the default header. */
  readonly title = input('');

  /** Dialog size preset. */
  readonly size = input<PixelDialogSize>('md');

  /** Placement: a centered modal or a bottom-anchored sheet that slides up. */
  readonly position = input<PixelDialogPosition>('center');

  /** ARIA role — use `alertdialog` for confirmations that interrupt the user. */
  readonly role = input<PixelDialogRole>('dialog');

  /** Allows closing via scrim click, Escape, and the header close button. */
  readonly dismissable = input(true, { transform: booleanAttribute });

  /** Extra class(es) applied to the dialog surface for one-off styling. */
  readonly panelClass = input('');

  /** Accessible label (overrides the title for labelling purposes). */
  readonly ariaLabel = input('');

  /** Space-separated ids describing the dialog body (maps to `aria-describedby`). */
  readonly ariaDescribedBy = input('');

  /** Emits when the dialog closes (any reason), after the exit animation completes. */
  readonly closed = output<void>();

  /** Emits once the dialog has finished opening (after the first frame is painted). */
  readonly opened = output<void>();

  /**
   * Emits on every scrim (backdrop) click, regardless of `dismissable`. Use to react to backdrop
   * interactions even when dismissal is disabled (mirrors Material's `backdropClick`).
   */
  readonly scrimClick = output<void>();

  protected readonly titleId = `pixel-dialog-title-${++nextDialogId}`;

  // `present` keeps the overlay rendered (display) through the exit animation; `leaving` toggles
  // the exit-animation classes. `open` is the consumer-facing state.
  protected readonly present = signal(false);
  protected readonly leaving = signal(false);

  // Scroll-shadow state: show a divider under the header once the body has scrolled, and above the
  // footer while there is more content to scroll to.
  protected readonly bodyScrolledFromTop = signal(false);
  protected readonly bodyScrollableToBottom = signal(false);

  private previousFocus: HTMLElement | null = null;
  private relocated = false;
  private previouslyOpen = false;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;
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

  close(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }

  /** Close in response to a user dismissal gesture (scrim/Escape/close button). */
  protected requestClose(): void {
    if (this.dismissable()) {
      this.close();
    }
  }

  protected onScrimClick(): void {
    this.scrimClick.emit();
    this.requestClose();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.leaving()) {
      return;
    }
    if (event.key === 'Escape' && this.dismissable()) {
      event.preventDefault();
      this.close();
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
