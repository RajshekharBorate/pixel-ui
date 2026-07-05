import { DocComponentMeta } from '../types';
import { TOUR_EXAMPLES } from '../../examples/pixel-tour';

export const TOUR_META: DocComponentMeta = {
  id: 'pixel-tour',
  title: 'Tour',
  selector: '[pixelTourAnchor]',
  category: 'advanced',
  status: 'experimental',
  summary:
    'Product tour / onboarding walkthrough: a traveling spotlight scrim plus anchored step cards, driven imperatively by PixelTourService with full keyboard and screen-reader support.',
  overview: [
    'PixelTourService.start(steps, config) mounts the scrim, spotlight, and step card into the shared overlay layer — no host element needed — and returns a signals-based PixelTourRef (status, stepIndex, activeStep, finished promise).',
    'Targets resolve from [pixelTourAnchor] ids (preferred), CSS selectors, elements, or resolver functions; steps without a target render as centered welcome/finale cards.',
    'The spotlight is a single SVG even-odd path: rounded-rect or circular cutout with configurable padding, re-anchoring on scroll and resize.',
    'Transitions are async-aware: beforeEnter/afterLeave hooks, waitForTarget polling with timeout (optional steps skip, required steps abort), when predicates, route navigation for multi-page tours, scroll-into-view, and a beforeAbort dismissal veto. persistKey makes tours run once and resume after aborts.',
    'Next-gen polish: the spotlight morphs between targets (multi-target cutouts supported), autoplay auto-advances with a countdown and a mandatory pause control, pausing can minimize the tour to a floating resume chip, the card is draggable, and interactive spotlights keep the target clickable for hands-on advanceOn: target-click steps.',
  ],
  useCases: [
    'First-run onboarding walkthroughs',
    'Feature-launch announcements pointing at real UI',
    'Guided setup flows with step-by-step actions',
  ],
  themingNotes: [
    'Card tokens: --pixel-tour-card-background, --pixel-tour-card-color, --pixel-tour-card-radius, --pixel-tour-card-elevation, --pixel-tour-card-inline-size, --pixel-tour-card-padding.',
    'Scrim tokens: --pixel-tour-scrim-color, --pixel-tour-scrim-opacity. All declared on the body-relocated elements; the active data-theme is copied over automatically.',
  ],
  accessibilityNotes: [
    'The step card is role="dialog" (non-modal) with aria-labelledby/aria-describedby; focus moves to the card on every step and Tab is trapped inside it.',
    'ArrowRight/ArrowLeft navigate, Escape aborts (keyboard config), and progress + title are announced via an aria-live="polite" region.',
    'Focus returns to the element that was focused before the tour started.',
    'Autoplay always ships with a pause/play control plus hover pausing and keyboard-focus (:focus-visible) pausing — WCAG 2.2.1 Timing Adjustable is enforced structurally, not optionally.',
    'Scrim, card, spotlight-morph, and pulse animations are all disabled under prefers-reduced-motion.',
  ],
  imports: ['PixelTourService', 'PixelTourAnchorDirective'],
  serviceName: 'PixelTourService',
  serviceApi: [
    { name: 'start', signature: '<T>(steps: readonly PixelTourStep<T>[], config?: PixelTourConfig) => PixelTourRef<T>', description: 'Start a tour; a running tour is aborted first.' },
    { name: 'activeTour', signature: 'PixelTourRef | null', description: 'The currently running tour ref.' },
    { name: 'ref.next / previous / goTo(id) / skipStep', signature: '() => void', description: 'Step navigation; next() on the last step completes the tour.' },
    { name: 'ref.skip / abort / complete', signature: '() => void', description: 'Terminal transitions (skipped / aborted / completed); skip and abort respect config.beforeAbort.' },
    { name: 'ref.pause / resume', signature: '() => void', description: 'Freeze / unfreeze the tour (navigation no-ops while paused).' },
    { name: 'ref.status / stepIndex / activeStep / isLastStep', signature: 'Signal<…>', description: 'Reactive tour state (status includes waiting and paused).' },
    { name: 'ref.finished', signature: 'Promise<PixelTourEndReason>', description: 'Resolves when the tour ends for any reason.' },
    { name: 'resetPersistence', signature: '(persistKey: string, storage?: PixelTourStorage) => void', description: 'Clears saved state so a persisted tour can run again.' },
  ],
  inputs: [
    { name: 'pixelTourAnchor', type: 'string', description: 'Directive: registers the host element as a tour target id.' },
  ],
  outputs: [],
  examples: TOUR_EXAMPLES,
};
