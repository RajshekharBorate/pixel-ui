import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  createComponent,
  inject,
  type ComponentRef,
} from '@angular/core';
import {
  ConnectedOverlay,
  getOverlayContainer,
  type OverlayPlacement,
} from '../shared/overlay/connected-overlay';
import PixelTourCardComponent, {
  PIXEL_TOUR_VIEW_CONFIG,
  type PixelTourViewConfig,
} from './pixel-tour-card';
import PixelTourSpotlightComponent from './pixel-tour-spotlight';
import { PixelTourAnchorRegistry } from './pixel-tour-anchor';
import { PixelTourRef } from './pixel-tour-ref';
import type {
  PixelTourConfig,
  PixelTourLabels,
  PixelTourStep,
} from './pixel-tour.types';

const DEFAULT_LABELS: PixelTourLabels = {
  next: 'Next',
  back: 'Back',
  skipStep: 'Skip',
  skipTour: 'Skip tour',
  done: 'Done',
  progress: '{index} of {total}',
  stepAriaLabel: 'Tour step',
};

/**
 * Starts product tours / onboarding walkthroughs imperatively — no host element required;
 * the scrim, spotlight, and step card mount into the shared overlay container and tear
 * down when the tour ends.
 *
 * ```ts
 * const ref = tour.start([
 *   { id: 'welcome', title: 'Welcome!', content: 'A quick look around.' },
 *   { id: 'create', target: 'create-button', content: 'Start here.' },
 * ]);
 * await ref.finished; // 'completed' | 'skipped' | 'aborted'
 * ```
 *
 * Targets resolve in order: `[pixelTourAnchor]` id → CSS selector → element / resolver
 * function. Starting a tour while another runs aborts the previous one.
 */
@Injectable({ providedIn: 'root' })
export class PixelTourService {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly anchors = inject(PixelTourAnchorRegistry);

  private active: PixelTourRef | null = null;

  /** The currently running tour, if any. */
  get activeTour(): PixelTourRef | null {
    return this.active;
  }

  /**
   * Starts a tour and returns its {@link PixelTourRef}.
   *
   * @param steps Ordered step definitions (at least one).
   * @param config Labels, progress style, keyboard, backdrop-click, and spotlight defaults.
   */
  start<T = any>(
    steps: readonly PixelTourStep<T>[],
    config: PixelTourConfig = {},
  ): PixelTourRef<T> {
    const ref = new PixelTourRef<T>(steps);
    if (typeof document === 'undefined') {
      // SSR: return an inert ref; the tour can only run in the browser.
      ref.abort();
      return ref;
    }
    this.active?.abort();
    this.active = ref as PixelTourRef;

    const viewConfig: PixelTourViewConfig = {
      labels: { ...DEFAULT_LABELS, ...config.labels },
      progress: config.progress ?? 'count',
      keyboard: config.keyboard ?? true,
    };

    const previousFocus = document.activeElement as HTMLElement | null;
    const container = getOverlayContainer();
    const overlay = new ConnectedOverlay();

    // Spotlight first, card second — DOM order stacks the card above the scrim.
    const spotlightRef = createComponent(PixelTourSpotlightComponent, {
      environmentInjector: this.environmentInjector,
    });
    const cardRef = createComponent(PixelTourCardComponent, {
      environmentInjector: this.environmentInjector,
      elementInjector: Injector.create({
        parent: this.injector,
        providers: [
          { provide: PixelTourRef, useValue: ref },
          { provide: PIXEL_TOUR_VIEW_CONFIG, useValue: viewConfig },
        ],
      }),
    });

    const spotlightEl = spotlightRef.location.nativeElement as HTMLElement;
    const cardEl = cardRef.location.nativeElement as HTMLElement;

    // Carry the active theme onto the body-relocated elements (CONVENTIONS §9).
    const theme = document.querySelector('[data-theme]')?.getAttribute('data-theme');
    if (theme) {
      spotlightEl.setAttribute('data-theme', theme);
      cardEl.setAttribute('data-theme', theme);
    }

    spotlightRef.instance.onScrimClick = () => {
      if ((config.backdropClick ?? 'none') === 'skip-tour') {
        ref.skip();
      }
    };

    container.appendChild(spotlightEl);
    container.appendChild(cardEl);
    this.appRef.attachView(spotlightRef.hostView);
    this.appRef.attachView(cardRef.hostView);
    spotlightRef.changeDetectorRef.detectChanges();
    cardRef.changeDetectorRef.detectChanges();

    ref._onStepChange((change) => {
      this.showStep(change.step, config, overlay, spotlightRef, cardEl);
    });

    ref._onEnd(() => {
      if (this.active === ref) {
        this.active = null;
      }
      overlay.destroy();
      // Defer disposal out of the current change-detection pass (same rule as dialogs).
      queueMicrotask(() => {
        this.appRef.detachView(spotlightRef.hostView);
        this.appRef.detachView(cardRef.hostView);
        spotlightRef.destroy();
        cardRef.destroy();
        spotlightEl.remove();
        cardEl.remove();
        previousFocus?.focus();
      });
    });

    ref._start();
    return ref;
  }

  private showStep(
    step: PixelTourStep,
    config: PixelTourConfig,
    overlay: ConnectedOverlay,
    spotlightRef: ComponentRef<PixelTourSpotlightComponent>,
    cardEl: HTMLElement,
  ): void {
    const target = this.resolveTarget(step);
    const spotlightOptions = { ...config.spotlight, ...step.spotlight };

    overlay.detach();
    spotlightRef.instance.update(target, spotlightOptions);

    if (!target) {
      // Centered card — CSS positions it; nothing to anchor.
      return;
    }

    overlay.attach(target as HTMLElement, cardEl, {
      preferredPlacements: this.placements(step),
      scrollStrategy: 'reposition',
      offset: (spotlightOptions.padding ?? 8) + 8,
      width: { kind: 'auto' },
    });
  }

  private placements(step: PixelTourStep): OverlayPlacement[] {
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

  private resolveTarget(step: PixelTourStep): Element | null {
    const target = step.target;
    if (!target) {
      return null;
    }
    if (typeof target === 'string') {
      return this.anchors.resolve(target) ?? document.querySelector(target);
    }
    if (typeof target === 'function') {
      return target();
    }
    return target;
  }
}
