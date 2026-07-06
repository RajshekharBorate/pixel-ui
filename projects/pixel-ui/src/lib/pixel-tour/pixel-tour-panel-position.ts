import {
  ConnectedOverlay,
  type OverlayPlacement,
} from '../shared/overlay/connected-overlay';
import type { PixelTourConfig, PixelTourStep } from './pixel-tour.types';

/** Resolves a step target from an anchor id, selector, element, or resolver. */
export function resolveTourTargetRef(
  target: string | Element | (() => Element | null),
  resolveAnchor: (id: string) => Element | null,
): Element | null {
  if (typeof target === 'string') {
    return resolveAnchor(target) ?? document.querySelector(target);
  }
  if (typeof target === 'function') {
    return target();
  }
  return target;
}

/** Resolves the primary target for a tour step, if any. */
export function resolveTourStepTarget(
  step: PixelTourStep,
  resolveAnchor: (id: string) => Element | null,
): Element | null {
  return step.target ? resolveTourTargetRef(step.target, resolveAnchor) : null;
}

/** Preferred overlay placements for a step card relative to its target. */
export function tourStepPlacements(step: PixelTourStep): OverlayPlacement[] {
  const align = step.align ?? 'start';
  const below = [`bottom-${align}`, `top-${align}`] as OverlayPlacement[];
  const above = [`top-${align}`, `bottom-${align}`] as OverlayPlacement[];
  switch (step.placement ?? 'auto') {
    case 'below':
      return below;
    case 'above':
      return above;
    default:
      return [...below, 'right-start', 'left-start'];
  }
}

/**
 * Anchors a tour panel to the active step target (or detaches when centered / untargeted).
 * Shared by {@link PixelTourService} and {@link PixelTourPanelComponent}.
 */
export function attachTourPanel(
  overlay: ConnectedOverlay,
  panelEl: HTMLElement,
  step: PixelTourStep,
  config: PixelTourConfig,
  resolveAnchor: (id: string) => Element | null,
): void {
  const target = resolveTourStepTarget(step, resolveAnchor);
  const spotlightOptions = {
    ...config.spotlight,
    ...step.spotlight,
    ...(step.advanceOn === 'target-click' ? { interactive: true } : {}),
  };

  if (!target) {
    overlay.detach();
    return;
  }

  if (config.scroll !== false && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView(config.scroll ?? { block: 'center' });
  }

  overlay.attach(target as HTMLElement, panelEl, {
    preferredPlacements: tourStepPlacements(step),
    scrollStrategy: 'reposition',
    offset: (spotlightOptions.padding ?? 8) + 8,
    width: { kind: 'auto' },
  });
}
