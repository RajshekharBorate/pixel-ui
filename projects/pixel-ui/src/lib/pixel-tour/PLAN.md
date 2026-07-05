# pixel-tour — next-gen product tour / onboarding walkthrough plan

Multi-phase feature. Structural references: `pixel-dialog` (service + ref + dynamic
component creation), `pixel-popover` / `shared/overlay/connected-overlay.ts` (anchored
positioning + flip), `pixel-toast` (service-driven overlay content), `theme/pixel-theme.ts`
(storage adapter pattern), `pixel-breadcrumb.service` (router integration).

## Product definition — what "next-gen" means here

Not a static tooltip sequence. The bar:

1. **Spotlight that travels** — a scrim with a soft-edged cutout that *morphs* (animated
   position/size/shape) from target to target instead of blinking off/on.
2. **Async-aware steps** — a step can wait for its target to exist (lazy content, route
   change, menu that must open first) with hooks and timeouts, so tours survive real apps.
3. **Multi-page tours** — steps can navigate routes; the tour is a root service that
   outlives component trees.
4. **Respectful by default** — full keyboard contract, screen-reader announcements, reduced
   motion, dismissible at every step, never re-shows after completion (persistence).
5. **Composable content** — step body accepts a string, a `TemplateRef`, or a component
   (media/illustration slot included), with DI access to the tour ref.

## Decisions (locked)

- **Imperative-first API**: `PixelTourService.start(steps, config) => PixelTourRef`. No
  required host element — the service creates the scrim + step card in the shared overlay
  container (like dialog/toast). A declarative `[pixelTourAnchor]="'step-id'"` directive
  registers robust targets (preferred over CSS selectors, which stay supported).
- **Signals-first ref**: `PixelTourRef` exposes `activeStep`, `stepIndex`, `total`,
  `status` (`'idle' | 'running' | 'waiting' | 'paused' | 'completed' | 'skipped' |
  'aborted'`) as signals + `next()/previous()/goTo(id)/skipStep()/skip()/pause()/resume()/
  abort()/complete()`; one `finished` promise.
  - `skipStep()` advances past the current step without the terminal `skipped` status
    (per-step secondary button, configurable); `skip()` ends the whole tour.
  - `pause()/resume()` freeze the tour: autoplay countdown stops, and with
    `pauseUi: 'minimize'` the card+spotlight collapse into a floating "Resume tour" chip so
    the user can interact with the page mid-tour.
- **Positioning reuses `ConnectedOverlay`** (placements, flip, locked position, width
  strategies). Steps without a target render as centered modal cards (welcome / finale).
- **Spotlight** is a single fixed SVG layer (`<path>` with even-odd fill rule: full-screen
  rect minus rounded cutout). Morphing = animating the cutout rect via CSS transitions on
  transform-free attributes (FLIP-style interpolation in JS when `prefersReducedMotion()`
  is false; instant jump when true). Scrim blocks interaction; per-step
  `spotlight.interactive: true` allows clicking the highlighted element ("try it" steps),
  advancing on target click when `advanceOn: 'target-click'`.
- **Step type** (all per-step options override config defaults):
  ```ts
  interface PixelTourStep<T = any> {
    id: string;
    target?: string | Element | (() => Element | null);   // omit => centered card
    title?: string;
    content: string | TemplateRef<PixelTourStepContext> | Type<unknown>;
    media?: { src: string; alt: string };                  // top illustration slot
    placement?: 'auto' | PixelPopoverPosition;             // auto = best-fit
    align?: PixelPopoverAlign;
    spotlight?: { padding?: number; radius?: number; shape?: 'rounded' | 'circle';
                  interactive?: boolean };
    advanceOn?: 'button' | 'target-click';
    autoAdvanceMs?: number;                                     // per-step autoplay override
    buttons?: readonly ('back' | 'next' | 'skip-step' | 'skip-tour' | 'done')[];
    when?: () => boolean;                                       // conditional step predicate
    beforeEnter?: (ref: PixelTourRef) => void | Promise<void>;  // open menus, navigate…
    afterLeave?: (ref: PixelTourRef) => void | Promise<void>;
    waitForTarget?: { timeoutMs?: number; pollMs?: number };    // lazy/async targets
    route?: string;                                             // navigate before showing
    optional?: boolean;                                         // skipped if target missing
    data?: T;
  }
  ```
- **Config** (`PixelTourConfig`): `labels` (next/back/skip-step/skip-tour/done/pause/
  resume/progress — full i18n), `progress: 'dots' | 'bar' | 'count' | 'none'` (dots/bar
  reuse `pixel-progress`), `keyboard` (arrows/Escape toggles), `backdropClick: 'none' |
  'skip-tour'`, `persistKey?: string` + `storage?: PixelTourStorage` (localStorage default,
  injectable adapter — server-side profiles can plug in),
  `scroll: ScrollIntoViewOptions | false`, `stepTransitionMs`, `announceProgress` (SR copy
  template), plus:
  - `autoplay?: { stepMs: number; pauseOnHover: boolean (default true); pauseOnFocus:
    boolean (default true); showCountdown: boolean }` — timer-based auto-advance with a
    visible countdown (ring on the Next button). **WCAG 2.2.1 gate**: autoplay ALWAYS ships
    with a pause/play control and hover/focus pausing; `autoAdvanceMs` per step overrides
    `stepMs`.
  - `pausable?: boolean` + `pauseUi?: 'button' | 'minimize'` — user-facing pause/play.
  - `draggable?: boolean` — drag handle on the card header; pointer-drag repositions the
    card within viewport margins (per-step, resets on step change; positioning reverts to
    the anchor on resize). Convenience only — auto-positioning remains the default and
    keyboard users lose nothing.
  - `beforeAbort?: (ref) => boolean | Promise<boolean>` — veto/confirm dismissal.
- **Buttons/progress/card reuse** `pixel-button`, `pixel-progress`, card chrome from
  popover panel tokens. Component tokens: `--pixel-tour-*` (scrim color/opacity, cutout
  radius/padding, card width, spotlight pulse) — declared on the overlay elements (body-
  relocated, CONVENTIONS §9) with theme carry-over from `document.documentElement`/config.
- **A11y contract**: step card is `role="dialog"` with `aria-modal="false"` +
  `aria-labelledby`/`aria-describedby`; focus moves to the card on each step and is trapped
  between card and (when interactive) the spotlighted target; Escape aborts (configurable);
  ArrowRight/ArrowLeft = next/back; progress announced via `aria-live="polite"`; target
  scrolled into view with `scroll` config; every animation gated on `prefersReducedMotion()`.
- **Events**: outputs-as-observables on the ref (`stepChanged`, plus terminal status) and a
  single `PixelTourEvent` callback in config for analytics
  (`{ type: 'start'|'step'|'complete'|'skip'|'abort'; stepId; index; durationMs }`).
- **SSR-safe**: every DOM touch behind `typeof document` guards; service no-ops on server.

## Explicitly out of scope (all phases)

- Branching/conditional flows beyond `optional` steps (revisit after real usage).
- Beacon/hotspot mode (pulsing "?" dots) — candidate for a sibling `pixel-beacon` later.
- Cross-tab sync of persistence.

## Phase 0 — Core engine (single-page linear tours) ✅ DONE (2026-07-04)

Types + `PixelTourService`/`PixelTourRef` + step card component + SVG spotlight layer.
Selector/element/function targets (no waiting yet), `ConnectedOverlay` positioning with
flip + centered cards, scrim click policy, buttons (back/next/skip-step/skip-tour/done with
per-step `buttons` visibility), `count` progress, keyboard map + focus trap + `aria-live`,
Escape abort, reduced-motion-aware instant spotlight, `[pixelTourAnchor]` directive.
**Exit:** build + test green (service flow, ARIA, keyboard, spotlight geometry specs);
docs meta + runnable "product tour of the docs page" example; README contract + Behavior
notes; dark mode + keyboard-only + reduced-motion pass.

## Phase 1 — Async, routes & persistence ✅ DONE (2026-07-05)

`beforeEnter`/`afterLeave` hooks with `waiting` status, `waitForTarget` (poll +
`MutationObserver`, timeout ⇒ `optional` skip or abort), `when` conditional predicate,
`route` navigation steps (Router optional-injected), scroll-into-view, `persistKey` +
storage adapter (never re-show completed; resume from saved index), `pause()/resume()`
engine + `paused` status + `beforeAbort` veto hook, analytics event callback.
**Exit:** multi-page tour example in docs (walks two docs routes); specs for waiting/
timeout/persistence; README updated.

## Phase 2 — Next-gen polish

Spotlight **morph animation** between targets (FLIP interpolation, reduced-motion fallback
already in place), card enter/leave transitions choreographed with the spotlight, `dots`
and `bar` progress variants via `pixel-progress`, `media` illustration slot, component
content with `PIXEL_TOUR_STEP_DATA` injection, `advanceOn: 'target-click'` +
`spotlight.interactive`, spotlight pulse affordance, **autoplay** (`stepMs`/`autoAdvanceMs`,
countdown ring on Next, hover/focus pause, pause/play button — the WCAG timing gate),
**pause-to-chip** (`pauseUi: 'minimize'` floating resume chip), **draggable card** (pointer
drag within viewport margins, per-step, reset on step change/resize), multi-cutout
spotlight (`targets` array — SVG even-odd path handles it natively), optional swipe
next/back on touch, RTL pass, resize/scroll re-anchoring stress test.
**Exit:** the docs example reads as a designed product moment; visual regression pass in
both themes; README Behavior notes document the full animation/interaction contract.

Cross-cutting acceptance per phase: `ng build` + `ng test` green · docs example · README
regenerated (`npm run readme:api`) · dark mode + reduced motion + keyboard-only verified.
Delete this file only when Phase 2 lands.
