import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  ConnectedOverlay,
  type OverlayPlacement,
  type OverlayWidthStrategy,
} from '../shared/overlay/connected-overlay';
import { getFocusableElements } from '../shared/overlay-utils';

export type PixelPopoverPosition = 'below' | 'above';
export type PixelPopoverAlign = 'start' | 'center' | 'end';
/** `'auto'` sizes to content, `'match-trigger'` mirrors the trigger width, any CSS size is used as-is. */
export type PixelPopoverWidth = 'auto' | 'match-trigger' | (string & {});

let nextPopoverId = 0;

/**
 * Non-modal rich-content overlay anchored to a trigger — the disclosure pattern for content
 * that is more than a tooltip (text only) and less than a dialog (modal). Pair with
 * `[pixelPopoverTriggerFor]`. Click toggles; Escape closes and restores trigger focus;
 * outside pointer and Tab-out close without stealing focus. Content is fully interactive.
 *
 * @example
 * ```html
 * <button [pixelPopoverTriggerFor]="info">Details</button>
 * <pixel-popover #info ariaLabel="Release details">
 *   <h3>v2.4</h3>
 *   <p>Shipped 14 fixes.</p>
 * </pixel-popover>
 * ```
 */
@Component({
  selector: 'pixel-popover',
  template: `
    <div
      #panel
      class="pixel-popover__panel"
      [class]="panelClass()"
      [class.pixel-popover__panel--open]="opened()"
      role="dialog"
      [id]="panelId"
      [attr.aria-label]="ariaLabel() || null"
      tabindex="-1"
      (keydown)="onPanelKeydown($event)"
      (focusout)="onPanelFocusOut($event)"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './pixel-popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelPopoverComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly panelRef = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly overlay = new ConnectedOverlay();

  /** Unique id of the panel — wired to the trigger's `aria-controls`. */
  readonly panelId = `pixel-popover-${++nextPopoverId}`;

  /**
   * Vertical side of the trigger the panel prefers.
   *
   * @type {'below' | 'above'}
   * @default 'below'
   * @description Flips automatically when the preferred side does not fit the viewport.
   */
  readonly position = input<PixelPopoverPosition>('below');

  /**
   * Horizontal alignment of the panel against the trigger.
   *
   * @type {'start' | 'center' | 'end'}
   * @default 'start'
   * @description Uses logical start/end so it follows the writing direction.
   */
  readonly align = input<PixelPopoverAlign>('start');

  /**
   * Panel inline-size strategy.
   *
   * @type {'auto' | 'match-trigger' | string}
   * @default 'auto'
   * @description `match-trigger` suits form-like popovers; any CSS size (e.g. `'24rem'`) is
   * applied directly.
   */
  readonly panelWidth = input<PixelPopoverWidth>('auto');

  /**
   * Accessible name for the popover dialog.
   *
   * @type {string}
   * @default ''
   * @description Required when the panel's first heading does not describe it.
   */
  readonly ariaLabel = input('');

  /**
   * Extra class(es) applied to the panel for one-off styling.
   *
   * @type {string}
   * @default ''
   * @description The panel is body-relocated while open — style via this class, not `:host`.
   */
  readonly panelClass = input('');

  /**
   * Moves focus into the panel when it opens.
   *
   * @type {boolean}
   * @default true
   * @description Focuses the first focusable element, else the panel itself. Disable for
   * hover-adjacent passive content.
   */
  readonly autoFocus = input(true, { transform: booleanAttribute });

  /**
   * Freezes page scroll while open.
   *
   * @type {boolean}
   * @default false
   * @description Off by default: the panel repositions with scroll (non-modal behavior).
   */
  readonly lockScroll = input(false, { transform: booleanAttribute });

  /** Emits `true` on open and `false` on close. */
  readonly openedChange = output<boolean>();

  /** Emits when the popover finishes closing. */
  readonly closed = output<void>();

  /** Open state — read-only for consumers; drive it via the trigger or `open()`/`close()`. */
  readonly opened = signal(false);

  private triggerEl: HTMLElement | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.overlay.destroy());
  }

  private placements(): OverlayPlacement[] {
    const align = this.align();
    const below: OverlayPlacement[] = [`bottom-${align}`, `top-${align}`] as OverlayPlacement[];
    const above: OverlayPlacement[] = [`top-${align}`, `bottom-${align}`] as OverlayPlacement[];
    return this.position() === 'below' ? below : above;
  }

  private widthStrategy(): OverlayWidthStrategy {
    const width = this.panelWidth();
    if (width === 'match-trigger') {
      return { kind: 'match-origin' };
    }
    if (width === 'auto' || !width.trim()) {
      return { kind: 'auto' };
    }
    return { kind: 'custom', value: width };
  }

  /** Opens the popover anchored to `trigger`. */
  open(trigger: HTMLElement): void {
    if (this.opened()) {
      return;
    }
    this.triggerEl = trigger;

    const panel = this.panelRef().nativeElement;
    // Carry the active theme context to the body-appended panel (CONVENTIONS §9).
    const themed = trigger.closest<HTMLElement>('[data-theme]');
    if (themed) {
      panel.setAttribute('data-theme', themed.getAttribute('data-theme') ?? '');
    }
    this.opened.set(true);
    this.openedChange.emit(true);

    afterNextRender(
      () => {
        if (!this.opened()) {
          return;
        }
        this.overlay.attach(trigger, panel, {
          preferredPlacements: this.placements(),
          scrollStrategy: this.lockScroll() ? 'block' : 'reposition',
          width: this.widthStrategy(),
          onOutsidePointer: () => this.close({ restoreFocus: false }),
        });
        if (this.autoFocus()) {
          const target = getFocusableElements(panel)[0] ?? panel;
          target.focus();
        }
      },
      { injector: this.injector },
    );
  }

  /** Closes the popover. Restores trigger focus unless `restoreFocus` is `false`. */
  close(options: { restoreFocus?: boolean } = {}): void {
    if (!this.opened()) {
      return;
    }
    this.overlay.detach();
    this.opened.set(false);
    this.openedChange.emit(false);
    this.closed.emit();
    if (options.restoreFocus !== false) {
      this.triggerEl?.focus();
    }
    this.triggerEl = null;
  }

  /** Toggles between `open` and `close` for the given trigger. */
  toggle(trigger: HTMLElement): void {
    if (this.opened()) {
      this.close();
    } else {
      this.open(trigger);
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return;
    }
    event.stopPropagation();
    this.close();
  }

  protected onPanelFocusOut(event: FocusEvent): void {
    // Tab-out (or programmatic focus move) past the panel closes the disclosure; focus is
    // already on its way elsewhere, so do not yank it back to the trigger.
    const next = event.relatedTarget as Node | null;
    if (!this.opened() || !next) {
      return;
    }
    const panel = this.panelRef().nativeElement;
    if (!panel.contains(next) && next !== this.triggerEl) {
      this.close({ restoreFocus: false });
    }
  }
}
