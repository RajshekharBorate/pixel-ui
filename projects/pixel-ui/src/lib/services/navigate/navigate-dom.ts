import { prefersReducedMotion } from '../../shared/overlay-utils';
import type { PixelNavigateScrollBehavior } from './navigate.types';

const HIGHLIGHT_STYLE_ID = 'pixel-nav-highlight-style';
const HIGHLIGHT_OVERLAY_CLASS = 'pixel-nav-highlight-overlay';
const HIGHLIGHT_OVERLAY_LOCAL_CLASS = 'pixel-nav-highlight-overlay--local';
const HIGHLIGHT_HOST_CLASS = 'pixel-nav-highlight-host';
const HIGHLIGHT_ROW_CLASS = 'pixel-nav-highlight-row';

/** Ensures the shared highlight stylesheet exists once on `document`. */
export function ensureNavHighlightStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const css = `
.${HIGHLIGHT_OVERLAY_CLASS} {
  box-sizing: border-box;
  pointer-events: none;
  z-index: 10000;
  /* Match pixel-input focus chrome: 1px border + 0.1875rem soft ring. */
  border: 1px solid var(--pixel-nav-highlight-color, var(--pixel-sys-primary, #3758f9));
  box-shadow: 0 0 0 0.1875rem
    color-mix(in srgb, var(--pixel-nav-highlight-color, var(--pixel-sys-primary, #3758f9)) 32%, transparent);
  background: color-mix(
    in srgb,
    var(--pixel-nav-highlight-color, var(--pixel-sys-primary, #3758f9)) 8%,
    transparent
  );
  transition: opacity var(--pixel-nav-highlight-duration, 200ms) ease;
}
/* Body-fixed ring — used for <tr> (absolute children of rows are unreliable). */
.${HIGHLIGHT_OVERLAY_CLASS}:not(.${HIGHLIGHT_OVERLAY_LOCAL_CLASS}) {
  position: fixed;
}
/*
 * In-element ring — stays aligned under CSS transforms (tab panel enter animation).
 * A transformed ancestor makes position:fixed use that ancestor as containing block,
 * which breaks getBoundingClientRect()-based placement.
 */
.${HIGHLIGHT_OVERLAY_LOCAL_CLASS} {
  position: absolute;
  inset: -1px;
  z-index: 2;
}
.${HIGHLIGHT_HOST_CLASS}:focus,
.${HIGHLIGHT_HOST_CLASS}:focus-visible {
  outline: none;
}
/* Soft fill on table rows while the overlay draws the continuous ring. */
.${HIGHLIGHT_ROW_CLASS} > * {
  background-color: color-mix(
    in srgb,
    var(--pixel-nav-highlight-color, var(--pixel-sys-primary, #3758f9)) 10%,
    transparent
  ) !important;
}
@media (prefers-reduced-motion: reduce) {
  .${HIGHLIGHT_OVERLAY_CLASS} {
    transition: none;
  }
}
`;
  let style = document.getElementById(HIGHLIGHT_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = HIGHLIGHT_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

function isTableRowElement(element: Element): boolean {
  return (
    element instanceof HTMLTableRowElement ||
    element.classList.contains('pixel-data-grid__row')
  );
}

function resolveHighlightRadius(element: Element): string {
  if (isTableRowElement(element)) {
    return 'var(--pixel-nav-highlight-radius, var(--pixel-sys-radius-sm, 4px))';
  }
  if (!(element instanceof HTMLElement) || typeof getComputedStyle === 'undefined') {
    return 'var(--pixel-nav-highlight-radius, var(--pixel-sys-radius-sm, 4px))';
  }
  const radius = getComputedStyle(element).borderRadius;
  return radius && radius !== '0px' ? radius : 'var(--pixel-nav-highlight-radius, var(--pixel-sys-radius-sm, 4px))';
}

/**
 * Finds the nearest scrollable ancestor (docs/app panels), or `window` for the document.
 * SSR-safe: returns `null` when DOM APIs are unavailable.
 */
export function findScrollParent(element: Element): HTMLElement | Window | null {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return null;
  }
  let current: Element | null = element.parentElement;
  while (current && current !== document.documentElement && current !== document.body) {
    if (current instanceof HTMLElement) {
      const style = getComputedStyle(current);
      const overflowY = style.overflowY;
      const canScrollY =
        (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
        current.scrollHeight > current.clientHeight + 1;
      if (canScrollY) {
        return current;
      }
    }
    current = current.parentElement;
  }
  return window;
}

/** Viewport bounds for a scrollport, inset by sticky offset at the top. */
function scrollportBounds(
  scrollParent: HTMLElement | Window,
  stickyOffset: number,
): { top: number; bottom: number; height: number } {
  if (scrollParent === window) {
    const top = stickyOffset;
    const bottom = window.innerHeight;
    return { top, bottom, height: Math.max(0, bottom - top) };
  }
  const parent = scrollParent as HTMLElement;
  const rect = parent.getBoundingClientRect();
  const top = rect.top + stickyOffset;
  const bottom = rect.bottom;
  return { top, bottom, height: Math.max(0, bottom - top) };
}

/**
 * True when `element` is fully visible in the scrollport (sticky offset reserved at top).
 * Tall targets that fill the viewport count as visible.
 */
export function isElementInView(
  element: Element,
  scrollParent: HTMLElement | Window,
  stickyOffset = 0,
): boolean {
  const elRect = element.getBoundingClientRect();
  const { top, bottom, height } = scrollportBounds(scrollParent, stickyOffset);
  if (height <= 0) {
    return false;
  }
  if (elRect.height >= height) {
    return elRect.top <= top && elRect.bottom >= bottom;
  }
  return elRect.top >= top && elRect.bottom <= bottom;
}

/** Scroll position that centers `element` in the scrollport's visible area. */
function centeredScrollTop(
  element: Element,
  scrollParent: HTMLElement | Window,
  stickyOffset: number,
): number {
  const elRect = element.getBoundingClientRect();
  const { top, height } = scrollportBounds(scrollParent, stickyOffset);
  const targetCenter = top + height / 2;
  const elCenter = elRect.top + elRect.height / 2;

  if (scrollParent === window) {
    return Math.max(0, window.scrollY + (elCenter - targetCenter));
  }
  const parent = scrollParent as HTMLElement;
  return Math.max(0, parent.scrollTop + (elCenter - targetCenter));
}

/**
 * Scrolls `element` into view only when it is outside the scrollport.
 * When scrolling, centers the target (sticky offset insets the visible area).
 */
export function scrollToElement(
  element: Element,
  options: {
    readonly offset?: number;
    readonly behavior?: PixelNavigateScrollBehavior;
  } = {},
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const behavior: ScrollBehavior =
    prefersReducedMotion() || options.behavior === 'instant' ? 'auto' : 'smooth';
  const stickyOffset = Math.max(0, options.offset ?? 0);

  try {
    const scrollParent = findScrollParent(element);
    if (!scrollParent) {
      if (!isElementInView(element, window, stickyOffset)) {
        element.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior });
      }
      return;
    }

    if (isElementInView(element, scrollParent, stickyOffset)) {
      return;
    }

    const nextTop = centeredScrollTop(element, scrollParent, stickyOffset);
    if (scrollParent === window) {
      window.scrollTo({ top: nextTop, behavior });
    } else {
      (scrollParent as HTMLElement).scrollTo({ top: nextTop, behavior });
    }

    // Also nudge nested parents (e.g. grid scroller inside docs content).
    if (element instanceof HTMLElement) {
      const nested = element.closest(
        '.pixel-data-grid__scroll, [data-pixel-scroll-port]',
      ) as HTMLElement | null;
      if (nested && nested !== scrollParent && nested.scrollHeight > nested.clientHeight) {
        if (!isElementInView(element, nested, Math.min(stickyOffset, 8))) {
          nested.scrollTo({
            top: centeredScrollTop(element, nested, Math.min(stickyOffset, 8)),
            behavior,
          });
        }
      }
    }
  } catch {
    try {
      element.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior });
    } catch {
      // jsdom / non-browser environments may lack scroll APIs
    }
  }
}

/** Moves focus to `element`, making it programmatically focusable when needed. */
export function focusElement(element: Element): void {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  try {
    const hadTabIndex = element.hasAttribute('tabindex');
    if (!hadTabIndex && element.tabIndex < 0) {
      element.tabIndex = -1;
    }
    element.focus({ preventScroll: true });
  } catch {
    // ignore focus failures in test environments
  }
}

/**
 * Draws a temporary highlight that matches the element's box (one continuous ring).
 * Non-row targets use an in-element absolute overlay so tab/accordion CSS transforms
 * cannot mis-place a body-fixed ring. Table rows use a fixed overlay (tr cannot host
 * absolute children reliably) plus a soft cell fill.
 */
export function highlightElement(element: Element, durationMs: number): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => undefined;
  }
  ensureNavHighlightStyles();

  if (isTableRowElement(element)) {
    return highlightTableRow(element, durationMs);
  }
  return highlightLocal(element, durationMs);
}

/** In-element absolute ring — correct under transformed ancestors (pixel-tabs panels). */
function highlightLocal(element: Element, durationMs: number): () => void {
  if (!(element instanceof HTMLElement)) {
    return () => undefined;
  }

  const computedPos = getComputedStyle(element).position;
  const madeRelative = computedPos === 'static';
  if (madeRelative) {
    element.style.position = 'relative';
  }
  element.classList.add(HIGHLIGHT_HOST_CLASS);

  const overlay = document.createElement('div');
  overlay.className = `${HIGHLIGHT_OVERLAY_CLASS} ${HIGHLIGHT_OVERLAY_LOCAL_CLASS}`;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.borderRadius = resolveHighlightRadius(element);
  element.appendChild(overlay);

  const clear = (): void => {
    overlay.remove();
    element.classList.remove(HIGHLIGHT_HOST_CLASS);
    if (madeRelative) {
      element.style.removeProperty('position');
    }
  };

  if (durationMs <= 0) {
    return clear;
  }
  const wait = prefersReducedMotion() ? Math.min(durationMs, 400) : durationMs;
  const timer = window.setTimeout(clear, wait);
  return () => {
    window.clearTimeout(timer);
    clear();
  };
}

/** Fixed overlay for table rows; re-syncs while active (scroll / layout / animation). */
function highlightTableRow(element: Element, durationMs: number): () => void {
  element.classList.add(HIGHLIGHT_ROW_CLASS);

  const overlay = document.createElement('div');
  overlay.className = HIGHLIGHT_OVERLAY_CLASS;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.borderRadius = resolveHighlightRadius(element);
  document.body.appendChild(overlay);

  const pad = 1;
  let raf = 0;
  const sync = (): void => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) {
      overlay.style.visibility = 'hidden';
      return;
    }
    overlay.style.visibility = 'visible';
    overlay.style.top = `${rect.top - pad}px`;
    overlay.style.left = `${rect.left - pad}px`;
    overlay.style.width = `${rect.width + pad * 2}px`;
    overlay.style.height = `${rect.height + pad * 2}px`;
  };
  const tick = (): void => {
    sync();
    raf = window.requestAnimationFrame(tick);
  };
  sync();
  raf = window.requestAnimationFrame(tick);

  const onScrollOrResize = (): void => {
    sync();
  };
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);

  const clear = (): void => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
    overlay.remove();
    element.classList.remove(HIGHLIGHT_ROW_CLASS);
  };

  if (durationMs <= 0) {
    return clear;
  }
  const wait = prefersReducedMotion() ? Math.min(durationMs, 400) : durationMs;
  const timer = window.setTimeout(clear, wait);
  return () => {
    window.clearTimeout(timer);
    clear();
  };
}

/** Waits until `resolve` returns an element or `timeoutMs` elapses. */
export async function waitForElement(
  resolve: () => Element | null,
  timeoutMs: number,
  intervalMs = 50,
): Promise<Element | null> {
  const immediate = resolve();
  if (immediate) {
    return immediate;
  }
  if (typeof window === 'undefined' || timeoutMs <= 0) {
    return null;
  }
  const started = Date.now();
  return new Promise((settle) => {
    const tick = (): void => {
      const found = resolve();
      if (found) {
        settle(found);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        settle(null);
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}

/** Double rAF — wait for layout after accordion/tab activation before scrolling. */
export function waitForLayout(): Promise<void> {
  if (typeof requestAnimationFrame === 'undefined') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Announces a short message via a polite live region (created once). */
export function announceNavigate(message: string): void {
  if (typeof document === 'undefined' || !message.trim()) {
    return;
  }
  let region = document.getElementById('pixel-nav-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'pixel-nav-live';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'pixel-nav-sr-only';
    region.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
    document.body.appendChild(region);
  }
  region.textContent = '';
  window.setTimeout(() => {
    if (region) {
      region.textContent = message;
    }
  }, 20);
}
