import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  createComponent,
  inject,
  type ComponentRef,
} from '@angular/core';
import { Router } from '@angular/router';
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
import { PixelTourRef, type PixelTourTransitionIntent } from './pixel-tour-ref';
import type {
  PixelTourConfig,
  PixelTourEventType,
  PixelTourLabels,
  PixelTourStep,
  PixelTourStorage,
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

const DEFAULT_WAIT_TIMEOUT = 5000;
const DEFAULT_WAIT_POLL = 150;

const localStorageAdapter: PixelTourStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private browsing / blocked storage — persistence is best-effort */
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

interface PersistedState {
  done?: boolean;
  index?: number;
}

/**
 * Starts product tours / onboarding walkthroughs imperatively — no host element required;
 * the scrim, spotlight, and step card mount into the shared overlay container and tear
 * down when the tour ends.
 *
 * ```ts
 * const ref = tour.start(
 *   [
 *     { id: 'welcome', title: 'Welcome!', content: 'A quick look around.' },
 *     { id: 'create', target: 'create-button', content: 'Start here.' },
 *   ],
 *   { persistKey: 'onboarding-v1' },
 * );
 * await ref.finished; // 'completed' | 'skipped' | 'aborted'
 * ```
 *
 * Targets resolve in order: `[pixelTourAnchor]` id → CSS selector → element / resolver
 * function. Transitions are asynchronous: steps may run `beforeEnter`/`afterLeave` hooks,
 * navigate a `route`, or `waitForTarget` — the ref reports `'waiting'` meanwhile. With a
 * `persistKey`, ended tours never re-show and aborted tours resume from their saved step.
 * Starting a tour while another runs aborts the previous one.
 */
@Injectable({ providedIn: 'root' })
export class PixelTourService {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly anchors = inject(PixelTourAnchorRegistry);
  private readonly router = inject(Router, { optional: true });

  private active: PixelTourRef | null = null;

  /** The currently running tour, if any. */
  get activeTour(): PixelTourRef | null {
    return this.active;
  }

  /** Clears the persisted state for a `persistKey` so the tour can run again. */
  resetPersistence(persistKey: string, storage: PixelTourStorage = localStorageAdapter): void {
    storage.remove(persistKey);
  }

  /**
   * Starts a tour and returns its {@link PixelTourRef}.
   *
   * @param steps Ordered step definitions (at least one).
   * @param config Labels, progress, keyboard, backdrop, spotlight, persistence, scroll,
   *   dismissal-veto, and analytics options.
   */
  start<T = any>(
    steps: readonly PixelTourStep<T>[],
    config: PixelTourConfig = {},
  ): PixelTourRef<T> {
    const ref = new PixelTourRef<T>(steps);
    if (typeof document === 'undefined') {
      // SSR: return an inert ref; the tour can only run in the browser.
      ref._end('aborted');
      return ref;
    }

    const storage = config.storage ?? localStorageAdapter;
    const persisted = this.readPersisted(config.persistKey, storage);
    if (persisted?.done) {
      // Already completed or skipped on this device/profile — never re-show.
      ref._end('completed');
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

    const emit = (type: PixelTourEventType) =>
      config.onEvent?.({
        type,
        stepId: ref.activeStep()?.id ?? null,
        stepIndex: ref.stepIndex(),
        total: ref.total,
        persistKey: config.persistKey,
      });

    let transitionId = 0;
    ref._transitionHandler = (intent) => {
      void this.runTransition(ref, intent, config, ++transitionId, () => transitionId);
    };

    ref._dismissHandler = (reason) => {
      void (async () => {
        if (config.beforeAbort) {
          const proceed = await config.beforeAbort(ref as PixelTourRef);
          if (proceed === false) {
            return;
          }
        }
        ref._end(reason);
      })();
    };

    ref._eventSink = emit;

    ref._onStepChange((change) => {
      this.showStep(change.step, config, overlay, spotlightRef, cardEl);
      if (config.persistKey) {
        storage.set(config.persistKey, JSON.stringify({ index: change.index }));
      }
      emit('step');
    });

    ref._onEnd((reason) => {
      transitionId++;
      if (this.active === ref) {
        this.active = null;
      }
      if (config.persistKey) {
        if (reason === 'completed' || reason === 'skipped') {
          storage.set(config.persistKey, JSON.stringify({ done: true }));
        } else {
          storage.set(config.persistKey, JSON.stringify({ index: ref.stepIndex() }));
        }
      }
      emit(reason === 'completed' ? 'complete' : reason === 'skipped' ? 'skip' : 'abort');
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

    emit('start');
    ref._start(persisted?.index ?? 0);
    return ref;
  }

  /**
   * The async step pipeline: conditional skip → afterLeave → route → beforeEnter →
   * (wait for) target → commit. A newer transition or a terminal status invalidates it.
   */
  private async runTransition(
    ref: PixelTourRef,
    intent: PixelTourTransitionIntent,
    config: PixelTourConfig,
    id: number,
    currentId: () => number,
  ): Promise<void> {
    const stale = () => {
      const status = ref.status();
      return id !== currentId() || (status !== 'running' && status !== 'waiting');
    };

    // Conditional steps keep their slot but are skipped in the travel direction.
    let index = intent.toIndex;
    while (index >= 0 && index < ref.total) {
      const candidate = ref.steps[index];
      if (!candidate.when || candidate.when()) {
        break;
      }
      index += intent.direction;
    }
    if (index >= ref.total) {
      ref.complete();
      return;
    }
    if (index < 0) {
      return; // Backing past a leading conditional step: stay where we are.
    }

    const from = ref.status() === 'running' || ref.status() === 'waiting'
      ? ref.activeStep()
      : null;
    const step = ref.steps[index];
    const hasAsyncWork =
      !!from?.afterLeave || !!step.beforeEnter || !!step.route || !!step.waitForTarget;
    if (hasAsyncWork) {
      ref._setWaiting();
    }

    try {
      if (from?.afterLeave && from !== step) {
        await from.afterLeave(ref);
      }
      if (stale()) {
        return;
      }

      if (step.route && this.router && this.router.url.split('?')[0] !== step.route) {
        await this.router.navigateByUrl(step.route);
        if (stale()) {
          return;
        }
      }

      if (step.beforeEnter) {
        await step.beforeEnter(ref);
        if (stale()) {
          return;
        }
      }

      let target = this.resolveTarget(step);
      if (!target && step.target && step.waitForTarget) {
        target = await this.waitForTarget(step, stale);
        if (stale()) {
          return;
        }
      }

      if (!target && step.target && (step.waitForTarget || step.optional)) {
        if (step.optional) {
          // Skip the unresolvable optional step in the travel direction.
          const nextIndex = index + intent.direction;
          if (nextIndex >= ref.total) {
            ref.complete();
          } else if (nextIndex >= 0) {
            void this.runTransition(
              ref,
              { toIndex: nextIndex, direction: intent.direction },
              config,
              id,
              currentId,
            );
          }
          return;
        }
        // Required target never appeared — the tour cannot continue truthfully.
        ref._end('aborted');
        return;
      }

      if (target && config.scroll !== false && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView(config.scroll ?? { block: 'center' });
      }

      ref._commit(index);
    } catch {
      // A hook or navigation failed — end the tour rather than strand a frozen scrim.
      if (!stale()) {
        ref._end('aborted');
      }
    }
  }

  /** Polls (and observes DOM mutations) until the step's target exists or the timeout hits. */
  private waitForTarget(
    step: PixelTourStep,
    stale: () => boolean,
  ): Promise<Element | null> {
    const timeoutMs = step.waitForTarget?.timeoutMs ?? DEFAULT_WAIT_TIMEOUT;
    const pollMs = step.waitForTarget?.pollMs ?? DEFAULT_WAIT_POLL;
    const deadline = Date.now() + timeoutMs;

    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      let observer: MutationObserver | null = null;
      const finish = (element: Element | null) => {
        observer?.disconnect();
        if (timer !== null) {
          clearTimeout(timer);
        }
        resolve(element);
      };
      const check = () => {
        if (stale()) {
          return finish(null);
        }
        const element = this.resolveTarget(step);
        if (element) {
          return finish(element);
        }
        if (Date.now() >= deadline) {
          return finish(null);
        }
        timer = setTimeout(check, pollMs);
      };
      if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => {
          const element = this.resolveTarget(step);
          if (element) {
            finish(element);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
      check();
    });
  }

  private readPersisted(
    persistKey: string | undefined,
    storage: PixelTourStorage,
  ): PersistedState | null {
    if (!persistKey) {
      return null;
    }
    try {
      const raw = storage.get(persistKey);
      return raw ? (JSON.parse(raw) as PersistedState) : null;
    } catch {
      return null;
    }
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
