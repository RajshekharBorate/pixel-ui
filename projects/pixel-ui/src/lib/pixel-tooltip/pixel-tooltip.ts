import {
  DestroyRef,
  Directive,
  ElementRef,
  type EmbeddedViewRef,
  NgZone,
  OnDestroy,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { getOverlayContainer } from '../shared/overlay/connected-overlay';

export type PixelTooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type PixelTooltipTrigger = 'hover' | 'focus' | 'both';
export type PixelTooltipTheme = 'inverse' | 'surface' | 'primary';

/** Keep the arrow this far from the tooltip's rounded corners (≈ half arrow + corner radius). */
const ARROW_INSET = 14;

let nextTooltipId = 0;

/** Order in which a preferred position will flip when the viewport can't fit it. */
const FLIP_ORDER: Record<PixelTooltipPosition, PixelTooltipPosition[]> = {
  top: ['top', 'bottom', 'right', 'left'],
  bottom: ['bottom', 'top', 'right', 'left'],
  left: ['left', 'right', 'top', 'bottom'],
  right: ['right', 'left', 'top', 'bottom'],
};

const VIEWPORT_MARGIN = 8;
const HOST_GAP = 8;

/**
 * Lightweight, accessible tooltip directive.
 *
 * Attaches a floating label to its host on hover/focus, positions it with viewport-aware
 * flipping, and wires `aria-describedby` for assistive technologies. The floating element is
 * appended to `document.body`; its styling ships in the shared `styles/_tooltip.scss` partial.
 *
 * @example
 * ```html
 * <button pixelTooltip="Delete policy" pixelTooltipPosition="bottom">…</button>
 * ```
 */
@Directive({
  selector: '[pixelTooltip], [pixelTooltipContent]',
  standalone: true,
  host: {
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'onBlur()',
    '(click)': 'onHostClick()',
    '(dragstart)': 'onDragStart()',
  },
})
export default class PixelTooltipDirective implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewContainer = inject(ViewContainerRef);

  /** Tooltip text. An empty value disables the tooltip. */
  readonly message = input('', { alias: 'pixelTooltip' });

  /** Preferred position; flips automatically when it would overflow the viewport. */
  readonly position = input<PixelTooltipPosition>('top', { alias: 'pixelTooltipPosition' });

  /** Interaction(s) that reveal the tooltip. */
  readonly trigger = input<PixelTooltipTrigger>('both', { alias: 'pixelTooltipTrigger' });

  /** Visual theme of the floating label. */
  readonly theme = input<PixelTooltipTheme>('inverse', { alias: 'pixelTooltipTheme' });

  /** Disables the tooltip without removing the directive. */
  readonly disabled = input(false, {
    alias: 'pixelTooltipDisabled',
    transform: booleanAttribute,
  });

  /** Delay in ms before showing. */
  readonly showDelay = input(50, { alias: 'pixelTooltipShowDelay', transform: numberAttribute });

  /** Delay in ms before hiding. */
  readonly hideDelay = input(0, { alias: 'pixelTooltipHideDelay', transform: numberAttribute });

  /** Max inline size of the tooltip, e.g. `16rem` or `240px`. */
  readonly maxWidth = input('16rem', { alias: 'pixelTooltipMaxWidth' });

  /**
   * Only show the tooltip when the host's text is actually clipped by overflow (e.g. a cell with
   * `text-overflow: ellipsis` or a line clamp). When the host fits its content, the tooltip is
   * suppressed. If no `pixelTooltip` message is set, the host's own trimmed text is used — handy for
   * truncated table cells / labels.
   */
  readonly showOnOverflow = input(false, {
    alias: 'pixelTooltipShowOnOverflow',
    transform: booleanAttribute,
  });

  /**
   * Renders a small arrow pointing from the tooltip to its host. Off by default (the plain tooltip);
   * opt in with `pixelTooltipArrow` for the tailed style.
   */
  readonly arrow = input(false, { alias: 'pixelTooltipArrow', transform: booleanAttribute });

  /**
   * Custom content template, rendered inside the tooltip in place of the plain text `message`. Use
   * for rich tooltips with titles, icons, or actions. The tooltip becomes interactive automatically
   * so the pointer can move into it.
   *
   * @example
   * ```html
   * <button [pixelTooltipContent]="tip">Upgrade</button>
   * <ng-template #tip>
   *   <strong>Premium feature</strong>
   *   <p>Unlock this for 20% off today.</p>
   *   <pixel-button size="sm" (click)="upgrade()">Upgrade</pixel-button>
   * </ng-template>
   * ```
   */
  readonly contentTemplate = input<TemplateRef<unknown> | null>(null, {
    alias: 'pixelTooltipContent',
  });

  /**
   * Keeps the tooltip open while the pointer is over it (so it can hold links/buttons). Enabled
   * automatically when a `pixelTooltipContent` template is provided.
   */
  readonly interactive = input(false, {
    alias: 'pixelTooltipInteractive',
    transform: booleanAttribute,
  });

  private readonly tooltipId = `pixel-tooltip-${++nextTooltipId}`;
  private tooltipEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;
  private arrowEl: HTMLElement | null = null;
  private contentView: EmbeddedViewRef<unknown> | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollHandler: (() => void) | null = null;

  // Stable references so add/removeEventListener pair up on the interactive tooltip element.
  private readonly onTooltipEnter = (): void => this.clearHide();
  private readonly onTooltipLeave = (): void => this.scheduleHide();

  /** Whether the tooltip itself should capture pointer events and stay open on hover. */
  private isInteractive(): boolean {
    return this.interactive() || !!this.contentTemplate();
  }

  constructor() {
    // Keep an open tooltip's text in sync with reactive message/disabled changes.
    effect(() => {
      const disabled = this.disabled();
      const hasTemplate = !!this.contentTemplate();
      const resolved = this.resolveMessage();
      if (!this.tooltipEl) {
        return;
      }
      if (disabled || (!hasTemplate && !resolved)) {
        this.hideNow();
      } else if (!hasTemplate && this.contentEl) {
        // Plain-text tooltip: update only the content span so the arrow node survives.
        this.renderer.setProperty(this.contentEl, 'textContent', resolved);
        this.reposition();
      }
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  protected onPointerEnter(): void {
    if (this.trigger() !== 'focus') {
      this.scheduleShow();
    }
  }

  protected onPointerLeave(): void {
    if (this.trigger() !== 'focus') {
      this.scheduleHide();
    }
  }

  protected onFocus(): void {
    if (this.trigger() !== 'hover') {
      this.scheduleShow();
    }
  }

  protected onBlur(): void {
    if (this.trigger() !== 'hover') {
      this.scheduleHide();
    }
  }

  protected onHostClick(): void {
    // Activating the host (e.g. a button) should dismiss the tooltip.
    this.hideNow();
  }

  protected onDragStart(): void {
    // Dragging the host (e.g. a reorder handle) should dismiss the tooltip immediately.
    this.hideNow();
  }

  /**
   * The text to display: the explicit `pixelTooltip` message, or — when gating on overflow with no
   * explicit message — the host's own trimmed text content.
   */
  private resolveMessage(): string {
    const explicit = this.message().trim();
    if (explicit) {
      return explicit;
    }
    if (this.showOnOverflow()) {
      return (this.host.nativeElement.textContent ?? '').trim();
    }
    return '';
  }

  /** True when the host's content is clipped by overflow on either axis (with a 1px tolerance). */
  private isHostTextTruncated(): boolean {
    const el = this.host.nativeElement;
    return el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > 1;
  }

  private scheduleShow(): void {
    if (this.disabled() || (!this.resolveMessage() && !this.contentTemplate())) {
      return;
    }
    // When gated on overflow, only show if the host's text is actually clipped.
    if (this.showOnOverflow() && !this.isHostTextTruncated()) {
      return;
    }
    this.clearHide();
    if (this.tooltipEl || this.showTimer) {
      return;
    }
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.show();
    }, this.showDelay());
  }

  private scheduleHide(): void {
    this.clearShow();
    if (!this.tooltipEl || this.hideTimer) {
      return;
    }
    // Interactive tooltips need enough delay to let the pointer cross the gap into the tooltip.
    const delay = this.isInteractive() ? Math.max(this.hideDelay(), 150) : this.hideDelay();
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.hideNow();
    }, delay);
  }

  private show(): void {
    if (this.tooltipEl) {
      return;
    }
    const el = this.renderer.createElement('div') as HTMLElement;
    el.id = this.tooltipId;
    el.className = 'pixel-tooltip';
    el.setAttribute('role', 'tooltip');
    el.setAttribute('data-theme-variant', this.theme());
    el.style.maxInlineSize = this.maxWidth();

    const template = this.contentTemplate();
    if (template) {
      el.classList.add('pixel-tooltip--rich');
      this.contentView = this.viewContainer.createEmbeddedView(template);
      this.contentView.detectChanges();
      for (const node of this.contentView.rootNodes) {
        this.renderer.appendChild(el, node);
      }
    } else {
      const content = this.renderer.createElement('span') as HTMLElement;
      content.className = 'pixel-tooltip__content';
      content.textContent = this.resolveMessage();
      this.renderer.appendChild(el, content);
      this.contentEl = content;
    }

    if (this.arrow()) {
      const arrow = this.renderer.createElement('span') as HTMLElement;
      arrow.className = 'pixel-tooltip__arrow';
      arrow.setAttribute('aria-hidden', 'true');
      this.renderer.appendChild(el, arrow);
      this.arrowEl = arrow;
    }

    this.renderer.appendChild(getOverlayContainer(), el);
    this.tooltipEl = el;

    this.host.nativeElement.setAttribute('aria-describedby', this.tooltipId);

    if (this.isInteractive()) {
      el.classList.add('pixel-tooltip--interactive');
      this.zone.runOutsideAngular(() => {
        el.addEventListener('mouseenter', this.onTooltipEnter);
        el.addEventListener('mouseleave', this.onTooltipLeave);
      });
    }

    this.reposition();
    // Trigger enter transition on the next frame.
    requestAnimationFrame(() => this.tooltipEl?.classList.add('pixel-tooltip--visible'));

    this.zone.runOutsideAngular(() => {
      this.scrollHandler = () => this.reposition();
      window.addEventListener('scroll', this.scrollHandler, true);
      window.addEventListener('resize', this.scrollHandler, true);
    });
  }

  private hideNow(): void {
    this.clearShow();
    this.clearHide();
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      window.removeEventListener('resize', this.scrollHandler, true);
      this.scrollHandler = null;
    }
    this.host.nativeElement.removeAttribute('aria-describedby');
    const el = this.tooltipEl;
    const view = this.contentView;
    this.tooltipEl = null;
    this.arrowEl = null;
    this.contentEl = null;
    this.contentView = null;
    if (!el) {
      view?.destroy();
      return;
    }
    el.removeEventListener('mouseenter', this.onTooltipEnter);
    el.removeEventListener('mouseleave', this.onTooltipLeave);
    el.classList.remove('pixel-tooltip--visible');
    // Allow the exit transition to play, then remove the node and tear down any embedded view.
    setTimeout(() => {
      el.parentNode?.removeChild(el);
      view?.destroy();
    }, 160);
  }

  private reposition(): void {
    const el = this.tooltipEl;
    if (!el) {
      return;
    }
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    // Measure the tooltip at its natural (layout) size. `getBoundingClientRect()` would report the
    // shrunk dimensions while the enter transition still has `transform: scale(.96)` applied (the
    // first reposition runs before the tooltip becomes visible), which throws off every placement
    // that subtracts the tooltip's own size — leaving `top`/`left` tooltips ~4% closer to the host
    // than `bottom`/`right` ones. `offsetWidth`/`offsetHeight` ignore transforms, so gaps stay equal.
    const tipRect = { width: el.offsetWidth, height: el.offsetHeight };
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fits = (pos: PixelTooltipPosition): boolean => {
      switch (pos) {
        case 'top':
          return hostRect.top - HOST_GAP - tipRect.height >= VIEWPORT_MARGIN;
        case 'bottom':
          return hostRect.bottom + HOST_GAP + tipRect.height <= vh - VIEWPORT_MARGIN;
        case 'left':
          return hostRect.left - HOST_GAP - tipRect.width >= VIEWPORT_MARGIN;
        case 'right':
          return hostRect.right + HOST_GAP + tipRect.width <= vw - VIEWPORT_MARGIN;
      }
    };

    const chosen = FLIP_ORDER[this.position()].find(fits) ?? this.position();

    let top = 0;
    let left = 0;
    switch (chosen) {
      case 'top':
        top = hostRect.top - HOST_GAP - tipRect.height;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + HOST_GAP;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.left - HOST_GAP - tipRect.width;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.right + HOST_GAP;
        break;
    }

    // Clamp into the viewport.
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), vw - tipRect.width - VIEWPORT_MARGIN);
    top = Math.min(Math.max(top, VIEWPORT_MARGIN), vh - tipRect.height - VIEWPORT_MARGIN);

    el.style.position = 'fixed';
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
    el.setAttribute('data-position', chosen);

    this.positionArrow(chosen, hostRect, top, left, tipRect);
  }

  /** Point the arrow at the host's centre along the cross axis, clamped within the tooltip. */
  private positionArrow(
    chosen: PixelTooltipPosition,
    hostRect: DOMRect,
    top: number,
    left: number,
    tipRect: { width: number; height: number },
  ): void {
    const arrow = this.arrowEl;
    if (!arrow) {
      return;
    }
    if (chosen === 'top' || chosen === 'bottom') {
      const hostCenterX = hostRect.left + hostRect.width / 2;
      const x = Math.min(Math.max(hostCenterX - left, ARROW_INSET), tipRect.width - ARROW_INSET);
      arrow.style.left = `${Math.round(x)}px`;
      arrow.style.top = '';
    } else {
      const hostCenterY = hostRect.top + hostRect.height / 2;
      const y = Math.min(Math.max(hostCenterY - top, ARROW_INSET), tipRect.height - ARROW_INSET);
      arrow.style.top = `${Math.round(y)}px`;
      arrow.style.left = '';
    }
  }

  private clearShow(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  private clearHide(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private cleanup(): void {
    this.clearShow();
    this.clearHide();
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      window.removeEventListener('resize', this.scrollHandler, true);
      this.scrollHandler = null;
    }
    if (this.tooltipEl) {
      this.tooltipEl.removeEventListener('mouseenter', this.onTooltipEnter);
      this.tooltipEl.removeEventListener('mouseleave', this.onTooltipLeave);
      this.tooltipEl.parentNode?.removeChild(this.tooltipEl);
      this.tooltipEl = null;
    }
    this.contentView?.destroy();
    this.contentView = null;
    this.arrowEl = null;
    this.contentEl = null;
  }
}
