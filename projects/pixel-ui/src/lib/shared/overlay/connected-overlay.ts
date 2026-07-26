import { signal, type Signal, type WritableSignal } from '@angular/core';

/**
 * Internal connected-overlay primitive shared by overlay-style components (select, datepicker,
 * menu). It is a lightweight, zero-dependency analogue of Angular CDK's `OverlayRef` +
 * connected-position strategy:
 *
 * - relocates a panel element into a single body-level overlay layer (so it can never be clipped by
 *   an ancestor's `overflow`),
 * - positions it with `position: fixed`, anchored to a trigger ("origin") element, trying a list of
 *   preferred placements and flipping / clamping to stay within the viewport,
 * - applies a scroll strategy (`block` swallows wheel/touch scrolling outside the panel without
 *   touching the page scrollbar; `reposition` re-anchors on scroll; `close` dismisses on scroll),
 * - wires outside-pointer dismissal and viewport/resize tracking,
 * - exposes the resolved placement as a signal for animation / direction styling.
 *
 * The component owns the panel element's lifecycle (e.g. an `@if`); the overlay only moves it while
 * attached and restores it to its original DOM position on {@link detach}, so framework teardown
 * stays correct. Not part of the public API.
 */

export const OVERLAY_PANEL_OFFSET = 4;
export const OVERLAY_VIEWPORT_MARGIN = 8;

export type OverlayVerticalEdge = 'top' | 'bottom';

export type OverlayPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom-center'
  | 'top-start'
  | 'top-end'
  | 'top-center'
  | 'right-start'
  | 'left-start';

export type OverlayScrollStrategy = 'block' | 'reposition' | 'close';

export type OverlayWidthStrategy =
  | { kind: 'match-origin' }
  | { kind: 'min-origin' }
  | { kind: 'custom'; value: string }
  | { kind: 'auto' };

export interface ResolvedOverlayPosition {
  readonly placement: OverlayPlacement;
  readonly edge: OverlayVerticalEdge;
}

export interface ConnectedOverlayConfig {
  /** Placements tried in priority order; the first that fits the viewport wins (flip). */
  readonly preferredPlacements: readonly OverlayPlacement[];
  /** Scroll behaviour while open. Defaults to `reposition`. */
  readonly scrollStrategy?: OverlayScrollStrategy;
  /** Gap in px between the origin and the panel. Defaults to 4. */
  readonly offset?: number;
  /** Minimum gap in px from the viewport edge. Defaults to 8. */
  readonly viewportMargin?: number;
  /** How the panel's inline size relates to the origin. Defaults to `auto`. */
  readonly width?: OverlayWidthStrategy;
  /** Invoked for a `pointerdown` outside the origin / panel (and any `isConnected` node). */
  readonly onOutsidePointer?: (event: PointerEvent) => void;
  /**
   * Renders a transparent full-viewport backdrop behind the panel that catches outside clicks and
   * swallows them, so the click that dismisses the panel never activates the element underneath
   * (mirrors Material's `cdkConnectedOverlayHasBackdrop` + `cdk-overlay-transparent-backdrop` on
   * select/datepicker). With a backdrop, `onOutsidePointer` fires from the backdrop's `click`
   * instead of a document-level `pointerdown`. Purely a pointer-interaction layer — it does not
   * affect scrolling, which stays governed by `scrollStrategy`.
   */
  readonly hasBackdrop?: boolean;
  /** Invoked when the `close` scroll strategy detects a scroll. */
  readonly onScrollClose?: () => void;
  /** Treats extra nodes (e.g. an open submenu panel) as "inside" for outside-pointer checks. */
  readonly isConnected?: (node: Node) => boolean;
  /** Extra class added to the panel while attached (e.g. for the overlay layer look). */
  readonly panelClass?: string;
}

/**
 * Added to the panel only after it has been positioned. Components keep the panel out of flow and
 * invisible until this class lands, then key their entrance animation on it — so the panel never
 * renders in document flow (which would push the page) or flash at an unpositioned spot.
 */
export const OVERLAY_VISIBLE_CLASS = 'pixel-overlay-visible';

/**
 * Creates a 1×1 fixed-position origin at viewport coordinates for cursor-anchored overlays
 * (context menus). Caller must remove it via {@link disposeOverlayPointOrigin} when done.
 */
export function createOverlayPointOrigin(clientX: number, clientY: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pixel-overlay-point-origin';
  el.setAttribute('aria-hidden', 'true');
  const style = el.style;
  style.position = 'fixed';
  style.left = `${Math.round(clientX)}px`;
  style.top = `${Math.round(clientY)}px`;
  style.width = '1px';
  style.height = '1px';
  style.margin = '0';
  style.padding = '0';
  style.border = '0';
  style.pointerEvents = 'none';
  style.visibility = 'hidden';
  document.body.appendChild(el);
  return el;
}

/** Removes a point origin created by {@link createOverlayPointOrigin}. */
export function disposeOverlayPointOrigin(el: HTMLElement | null | undefined): void {
  el?.remove();
}

let containerEl: HTMLElement | null = null;

/** Lazily creates (and reuses) the single body-level overlay layer that holds all open panels. */
export function getOverlayContainer(): HTMLElement {
  if (!containerEl || !document.body.contains(containerEl)) {
    containerEl = document.createElement('div');
    containerEl.className = 'pixel-overlay-container';
    const style = containerEl.style;
    style.position = 'fixed';
    style.top = '0';
    style.left = '0';
    style.zIndex = '1000';
    // The layer itself is transparent to pointers; each panel re-enables them for itself.
    style.pointerEvents = 'none';
    document.body.appendChild(containerEl);
  }
  return containerEl;
}

/**
 * True when `node` is inside an overlay panel that was attached after `panel` in the shared
 * overlay container (nested menus/selects opened from within `panel`).
 */
export function isInsideNestedOverlayPanel(panel: HTMLElement, node: Node): boolean {
  const parent = panel.parentElement;
  if (!parent) {
    return false;
  }
  const siblings = Array.from(parent.children);
  const myIndex = siblings.indexOf(panel);
  if (myIndex < 0) {
    return false;
  }
  return siblings.slice(myIndex + 1).some((sibling) => sibling.contains(node));
}

interface Coords {
  top: number;
  left: number;
  edge: OverlayVerticalEdge;
}

function placementCoords(
  placement: OverlayPlacement,
  origin: DOMRect,
  panelW: number,
  panelH: number,
  offset: number,
): Coords {
  switch (placement) {
    case 'bottom-start':
      return { top: origin.bottom + offset, left: origin.left, edge: 'bottom' };
    case 'bottom-end':
      return { top: origin.bottom + offset, left: origin.right - panelW, edge: 'bottom' };
    case 'bottom-center':
      return {
        top: origin.bottom + offset,
        left: origin.left + (origin.width - panelW) / 2,
        edge: 'bottom',
      };
    case 'top-start':
      return { top: origin.top - offset - panelH, left: origin.left, edge: 'top' };
    case 'top-end':
      return { top: origin.top - offset - panelH, left: origin.right - panelW, edge: 'top' };
    case 'top-center':
      return {
        top: origin.top - offset - panelH,
        left: origin.left + (origin.width - panelW) / 2,
        edge: 'top',
      };
    case 'right-start':
      return { top: origin.top, left: origin.right + offset, edge: 'bottom' };
    case 'left-start':
      return { top: origin.top, left: origin.left - offset - panelW, edge: 'bottom' };
  }
}

function fitsInViewport(
  coords: Coords,
  panelW: number,
  panelH: number,
  vw: number,
  vh: number,
  margin: number,
): boolean {
  return (
    coords.top >= margin &&
    coords.left >= margin &&
    coords.top + panelH <= vh - margin &&
    coords.left + panelW <= vw - margin
  );
}

export class ConnectedOverlay {
  private readonly _position: WritableSignal<ResolvedOverlayPosition | null> =
    signal<ResolvedOverlayPosition | null>(null);
  /** Resolved placement while attached, else `null`. Read for direction / animation styling. */
  readonly position: Signal<ResolvedOverlayPosition | null> = this._position.asReadonly();

  private origin: HTMLElement | null = null;
  private panel: HTMLElement | null = null;
  private cfg: ConnectedOverlayConfig | null = null;
  private placeholder: Comment | null = null;
  private backdropEl: HTMLElement | null = null;
  // Placement and clamp offsets resolved on the first reposition after attach. Later repositions
  // (scroll / resize / panel growth) reuse them so the panel stays glued to its origin — even off
  // screen — instead of being re-clamped to the viewport edge while the origin scrolls away
  // (mirrors Angular CDK's `withLockedPosition`, which Material selects/datepickers rely on).
  private lockedPlacement: OverlayPlacement | null = null;
  private clampDx = 0;
  private clampDy = 0;
  private removeViewportListeners: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private outsideHandler: ((event: PointerEvent) => void) | null = null;

  /** True while a panel is currently mounted in the overlay layer. */
  get attached(): boolean {
    return this.panel !== null;
  }

  /** Mounts `panel` into the overlay layer, anchored to `origin`, and starts tracking. */
  attach(origin: HTMLElement, panel: HTMLElement, cfg: ConnectedOverlayConfig): void {
    if (typeof document === 'undefined') {
      return;
    }
    if (this.attached) {
      this.detach();
    }
    this.origin = origin;
    this.panel = panel;
    this.cfg = cfg;
    this.lockedPlacement = null;
    this.clampDx = 0;
    this.clampDy = 0;

    // Remember where the panel lived so framework teardown can find it again after detach.
    this.placeholder = document.createComment('pixel-overlay');
    panel.parentNode?.insertBefore(this.placeholder, panel);
    const container = getOverlayContainer();
    if (cfg.hasBackdrop) {
      // Appended just before the panel so it stacks behind it but above everything already open.
      const backdrop = document.createElement('div');
      backdrop.className = 'pixel-overlay-backdrop';
      const style = backdrop.style;
      style.position = 'fixed';
      style.inset = '0';
      // Invisible on purpose (Material's transparent backdrop): it exists to catch and swallow
      // outside clicks, not to dim the page like a dialog scrim.
      style.background = 'transparent';
      style.pointerEvents = 'auto';
      container.appendChild(backdrop);
      this.backdropEl = backdrop;
    }
    container.appendChild(panel);

    panel.style.position = 'fixed';
    panel.style.margin = '0';
    panel.style.pointerEvents = 'auto';
    if (cfg.panelClass) {
      panel.classList.add(cfg.panelClass);
    }

    this.applyWidth();
    this.reposition();
    // Reveal only now that the panel is positioned (prevents page push + unpositioned flash).
    panel.classList.add(OVERLAY_VISIBLE_CLASS);
    this.applyScrollStrategy();
    this.bindOutsidePointer();
  }

  /** Recomputes and applies the panel's position. Safe to call repeatedly. */
  reposition(): void {
    const origin = this.origin;
    const panel = this.panel;
    const cfg = this.cfg;
    if (!origin || !panel || !cfg || typeof window === 'undefined') {
      return;
    }

    this.applyWidth();
    const o = origin.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    const panelW = rect.width;
    const panelH = rect.height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = cfg.viewportMargin ?? 8;
    const offset = cfg.offset ?? 4;

    // Locked: re-anchor to the origin with the placement (and clamp offsets) chosen at open, so
    // the panel follows the origin 1:1 — off screen too — rather than sticking to the viewport.
    if (this.lockedPlacement) {
      const coords = placementCoords(this.lockedPlacement, o, panelW, panelH, offset);
      panel.style.top = `${Math.round(coords.top + this.clampDy)}px`;
      panel.style.left = `${Math.round(coords.left + this.clampDx)}px`;
      this._position.set({ placement: this.lockedPlacement, edge: coords.edge });
      return;
    }

    let chosen: { placement: OverlayPlacement; coords: Coords } | null = null;
    for (const placement of cfg.preferredPlacements) {
      const coords = placementCoords(placement, o, panelW, panelH, offset);
      if (fitsInViewport(coords, panelW, panelH, vw, vh, margin)) {
        chosen = { placement, coords };
        break;
      }
    }
    if (!chosen) {
      const placement = cfg.preferredPlacements[0];
      chosen = { placement, coords: placementCoords(placement, o, panelW, panelH, offset) };
    }

    const top = Math.min(
      Math.max(chosen.coords.top, margin),
      Math.max(margin, vh - panelH - margin),
    );
    const left = Math.min(
      Math.max(chosen.coords.left, margin),
      Math.max(margin, vw - panelW - margin),
    );
    panel.style.top = `${Math.round(top)}px`;
    panel.style.left = `${Math.round(left)}px`;
    this.lockedPlacement = chosen.placement;
    this.clampDy = top - chosen.coords.top;
    this.clampDx = left - chosen.coords.left;
    this._position.set({ placement: chosen.placement, edge: chosen.coords.edge });
  }

  /** Restores the panel to its original DOM position and stops all tracking. */
  detach(): void {
    this.teardownTracking();
    const panel = this.panel;
    if (panel) {
      panel.classList.remove(OVERLAY_VISIBLE_CLASS);
      if (this.cfg?.panelClass) {
        panel.classList.remove(this.cfg.panelClass);
      }
      panel.style.position = '';
      panel.style.margin = '';
      panel.style.pointerEvents = '';
      panel.style.top = '';
      panel.style.left = '';
      panel.style.inlineSize = '';
      panel.style.minInlineSize = '';
      // Move the panel back to where the framework expects it before it is destroyed.
      if (this.placeholder?.parentNode) {
        this.placeholder.parentNode.insertBefore(panel, this.placeholder);
      }
    }
    this.placeholder?.remove();
    this.placeholder = null;
    this.panel = null;
    this.origin = null;
    this.cfg = null;
    this.lockedPlacement = null;
    this.clampDx = 0;
    this.clampDy = 0;
    this._position.set(null);
  }

  /** Detaches if needed and releases any held resources. Call from the component's destroy hook. */
  destroy(): void {
    if (this.attached) {
      const panel = this.panel;
      // If the panel was already removed from its original parent, just drop it from the layer.
      if (panel && !this.placeholder?.parentNode) {
        this.teardownTracking();
        panel.parentNode?.removeChild(panel);
        this.placeholder = null;
        this.panel = null;
        this.origin = null;
        this.cfg = null;
        this._position.set(null);
        return;
      }
      this.detach();
    } else {
      this.teardownTracking();
    }
  }

  private applyWidth(): void {
    const panel = this.panel;
    const origin = this.origin;
    const width = this.cfg?.width ?? { kind: 'auto' };
    if (!panel || !origin) {
      return;
    }
    const originWidth = origin.getBoundingClientRect().width;
    switch (width.kind) {
      case 'match-origin':
        panel.style.inlineSize = `${originWidth}px`;
        panel.style.minInlineSize = '';
        break;
      case 'min-origin':
        panel.style.minInlineSize = `${originWidth}px`;
        break;
      case 'custom':
        panel.style.inlineSize = width.value;
        break;
      case 'auto':
        break;
    }
  }

  private applyScrollStrategy(): void {
    const strategy = this.cfg?.scrollStrategy ?? 'reposition';
    const reposition = (): void => this.reposition();

    if (strategy === 'block') {
      // Freeze the page by swallowing scroll *input* (wheel / touch) everywhere except inside the
      // panel's own scrollers, instead of pinning the document CDK-style. The page scrollbar —
      // thumb included — is never touched, so opening the panel causes zero layout shift or
      // flicker. The rare scrolls that bypass input blocking (dragging the scrollbar itself,
      // keyboard scrolling with focus outside) keep the panel glued via reposition instead.
      const blockScrollInput = (event: Event): void => {
        const target = event.target as Node | null;
        if (target && this.hasScrollableWithinPanel(target)) {
          return;
        }
        event.preventDefault();
      };
      document.addEventListener('wheel', blockScrollInput, { capture: true, passive: false });
      document.addEventListener('touchmove', blockScrollInput, { capture: true, passive: false });
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      this.removeViewportListeners = () => {
        document.removeEventListener('wheel', blockScrollInput, { capture: true });
        document.removeEventListener('touchmove', blockScrollInput, { capture: true });
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
      };
    } else if (strategy === 'close') {
      const onScroll = (event: Event): void => {
        // Scrolling inside the panel (e.g. the options viewport) or the origin must not dismiss
        // it — only page / ancestor scrolling does (mirrors CDK's CloseScrollStrategy, which only
        // watches scroll containers outside the overlay).
        const target = event.target as Node | null;
        if (target && (this.panel?.contains(target) || this.origin?.contains(target))) {
          return;
        }
        this.cfg?.onScrollClose?.();
      };
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', reposition);
      this.removeViewportListeners = () => {
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', reposition);
      };
    } else {
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      this.removeViewportListeners = () => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
      };
    }

    // Re-anchor when the panel's own size changes (e.g. month nav, filtered options) or the origin moves.
    if (typeof ResizeObserver !== 'undefined' && this.panel && this.origin) {
      this.resizeObserver = new ResizeObserver(reposition);
      this.resizeObserver.observe(this.panel);
      this.resizeObserver.observe(this.origin);
    }
  }

  /**
   * True when `node` sits inside a scrollable element within the panel — wheel/touch input there
   * must reach the panel's own scrollers (e.g. the options list). End-of-list chaining to the page
   * is stopped by the scrollers' `overscroll-behavior: contain`.
   */
  private hasScrollableWithinPanel(node: Node): boolean {
    const panel = this.panel;
    if (!panel || !panel.contains(node)) {
      return false;
    }
    let el: Element | null = node instanceof Element ? node : node.parentElement;
    while (el && panel.contains(el)) {
      if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
        const styles = getComputedStyle(el);
        if (/auto|scroll/.test(`${styles.overflowY} ${styles.overflowX}`)) {
          return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  private bindOutsidePointer(): void {
    const cfg = this.cfg;
    if (!cfg?.onOutsidePointer || typeof document === 'undefined') {
      return;
    }
    // With a backdrop, every outside pointer physically lands on it — dismiss from its `click`
    // (like Material's `backdropClick`) so the backdrop is still present at mouseup and the
    // dismissing click can never fall through to the element underneath. The listener dies with
    // the element, so it needs no teardown bookkeeping.
    if (this.backdropEl) {
      this.backdropEl.addEventListener('click', (event) => {
        this.cfg?.onOutsidePointer?.(event as PointerEvent);
      });
      return;
    }
    this.outsideHandler = (event: PointerEvent): void => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (
        this.origin?.contains(target) ||
        this.panel?.contains(target) ||
        cfg.isConnected?.(target)
      ) {
        return;
      }
      // Any panel in the shared overlay container that was inserted AFTER this panel
      // is a nested overlay opened from within this panel (e.g. a select inside a menu).
      // Treat clicks on those panels as "inside" so they don't dismiss this overlay.
      if (this.panel && isInsideNestedOverlayPanel(this.panel, target)) {
        return;
      }
      cfg.onOutsidePointer!(event);
    };
    document.addEventListener('pointerdown', this.outsideHandler, true);
  }

  private teardownTracking(): void {
    this.backdropEl?.remove();
    this.backdropEl = null;
    this.removeViewportListeners?.();
    this.removeViewportListeners = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.outsideHandler) {
      document.removeEventListener('pointerdown', this.outsideHandler, true);
      this.outsideHandler = null;
    }
  }
}
