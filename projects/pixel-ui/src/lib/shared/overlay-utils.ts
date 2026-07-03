/**
 * Internal helpers shared by overlay-style components (dialog, drawer): body scroll locking,
 * focus trapping, and a reduced-motion check. Not part of the public API.
 */

// Shared reference count so multiple simultaneously-open overlays (e.g. a drawer opened from within
// a dialog) don't release the body scroll lock until the last one closes.
let scrollLockCount = 0;
let savedScroll: { top: number; left: number } | null = null;
let savedRootStyles: {
  position: string;
  width: string;
  top: string;
  left: string;
  overflowY: string;
} | null = null;
// True only when the lock actually applied styles (the page was scrollable). Used so a no-op lock on
// a short page doesn't trigger a bogus restore — and doesn't add a scrollbar gutter that shifts content.
let lockApplied = false;

/**
 * Freezes page scroll while keeping the scrollbar visible (matching Angular CDK's block strategy):
 * pins the document element with `position: fixed` offset by the current scroll, and forces
 * `overflow-y: scroll` so the scrollbar gutter stays and content does not shift. Ref-counted and
 * balanced with {@link unlockBodyScroll}; callers must guard against double-locking from the same
 * instance.
 */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (scrollLockCount === 0) {
    const root = document.documentElement;
    // Don't lock (and don't add a scrollbar gutter) when there's nothing to scroll. Mirrors CDK's
    // `BlockScrollStrategy._canBeEnabled`, which checks both axes.
    if (root.scrollHeight > root.clientHeight || root.scrollWidth > root.clientWidth) {
      savedScroll = { top: window.scrollY, left: window.scrollX };
      savedRootStyles = {
        position: root.style.position,
        width: root.style.width,
        top: root.style.top,
        left: root.style.left,
        overflowY: root.style.overflowY,
      };
      root.style.top = `${-savedScroll.top}px`;
      root.style.left = `${-savedScroll.left}px`;
      root.style.position = 'fixed';
      root.style.width = '100%';
      root.style.overflowY = 'scroll';
      lockApplied = true;
    }
  }
  scrollLockCount++;
}

/** Releases one scroll lock; restores the document and scroll position once the last overlay unlocks. */
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0 && lockApplied && savedRootStyles && savedScroll) {
    const root = document.documentElement;
    const body = document.body;
    const previousHtmlScrollBehavior = root.style.scrollBehavior;
    const previousBodyScrollBehavior = body.style.scrollBehavior;

    root.style.position = savedRootStyles.position;
    root.style.width = savedRootStyles.width;
    root.style.top = savedRootStyles.top;
    root.style.left = savedRootStyles.left;
    root.style.overflowY = savedRootStyles.overflowY;

    // Restore the scroll position instantly even when the page uses `scroll-behavior: smooth`,
    // otherwise closing an overlay would animate a scroll jump (matches CDK's BlockScrollStrategy).
    root.style.scrollBehavior = 'auto';
    body.style.scrollBehavior = 'auto';
    window.scrollTo(savedScroll.left, savedScroll.top);
    root.style.scrollBehavior = previousHtmlScrollBehavior;
    body.style.scrollBehavior = previousBodyScrollBehavior;

    savedRootStyles = null;
    savedScroll = null;
    lockApplied = false;
  }
}

export const OVERLAY_FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Visible, focusable elements within `container`, in DOM order. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(OVERLAY_FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Keeps Tab focus cycling within `container`. Call from a `keydown` handler when the key is `Tab`.
 */
export function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  const focusables = getFocusableElements(container);
  if (!focusables.length) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement as HTMLElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/** True when the user has requested reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
