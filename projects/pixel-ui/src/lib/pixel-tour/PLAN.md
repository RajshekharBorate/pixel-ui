# pixel-tour — advanced features plan

Phased roadmap after **Phase 0–2** (core engine, async transitions, morph/autoplay/interactive).
Mark each phase `✅ DONE (date)` when exit criteria pass, then move lasting decisions into
`README.md` Behavior notes and **delete this file**.

---

## Current baseline (done)

| Area | Shipped |
|------|---------|
| Imperative API | `PixelTourService.start()` → `PixelTourRef` (signals, `finished`) |
| Targets | `[pixelTourAnchor]`, selector, element, resolver; multi-target cutouts |
| Spotlight | SVG scrim + cutout, morph, scroll/resize tracking, dark-scheme tokens |
| Card | Anchored + centered, placement `auto`/`below`/`above`, drag, swipe, progress styles |
| Async | `when`, hooks, `route`, `waitForTarget`, `optional`, `beforeAbort` veto |
| Persistence | `persistKey` + pluggable storage, resume / run-once |
| Polish | Autoplay + countdown, pause/minimize chip, `advanceOn: 'target-click'` |

---

## Phase 3 — Custom card UI **(PRIORITY 1)**

**Goal:** Replace the default `pixel-tour-card` chrome with app-owned templates while the
service still owns spotlight, positioning, and lifecycle.

### Docs gap today

There is **no docs example** for step `content` as `TemplateRef` or component — all three
current examples (`basic`, `async-persistence`, `showcase`) use **string content only**.
Ship two docs examples as part of this phase:

1. **Today (interim):** `TemplateRef` + component body content inside the default card.
2. **After API lands:** full custom card template for the whole tour.

### API decision — Option A (+ B override, C as flag)

| Option | Verdict |
|--------|---------|
| **A — `config.card` template/component** | **Primary.** One shell per tour; service mounts it instead of `PixelTourCardComponent`. Matches how apps theme onboarding. |
| **B — per-step `step.card` override** | **Optional layer on A.** `step.card ?? config.card ?? default`. Use for one-off finale/welcome layouts only. |
| **C — `ui: 'headless'`** | **Subset of A** — no card mounted; consumer binds `PixelTourRef` in app template. Not a third implementation path. |

```ts
interface PixelTourConfig {
  /** @default 'default' */
  readonly ui?: 'default' | 'custom' | 'headless';
  /** Required when ui === 'custom'. Replaces the entire card for the tour. */
  readonly card?: TemplateRef<PixelTourCardContext> | Type<PixelTourCardHost>;
}

interface PixelTourStep {
  /** Optional per-step card override (falls back to config.card, then default). */
  readonly card?: TemplateRef<PixelTourCardContext> | Type<PixelTourCardHost>;
  // content remains for default-card body OR custom-card inner slots
}

interface PixelTourCardContext {
  readonly $implicit: PixelTourRef;
  readonly step: Signal<PixelTourStep>;
  readonly labels: PixelTourLabels;
  readonly view: PixelTourViewConfig;
  readonly waiting: Signal<boolean>;
  readonly minimized: Signal<boolean>;
}
```

### Companion: `pixel-tour-controls`

Optional directive/component for custom templates that want default navigation without
copy-pasting keyboard/autoplay logic:

```html
<ng-template #myCard let-ctx>
  <pixel-card>
  <h2>{{ ctx.step().title }}</h2>
  <ng-container *ngTemplateOutlet="body" />
  <pixel-tour-controls />  <!-- back / next / skip / pause / progress -->
  </pixel-card>
</ng-template>
```

Extracted from today's `pixel-tour-card` footer: focus trap host, keyboard contract,
autoplay countdown, `aria-live` announcements.

### Scope

- Service factory: `default` → `PixelTourCardComponent`; `custom` → `NgComponentOutlet` /
  `NgTemplateOutlet` with `PixelTourCardContext`; `headless` → spotlight only.
- Positioning: custom card host element still goes through `ConnectedOverlay` / centered CSS.
- `copyPixelThemeContext` on custom card host (same as today).
- Default card unchanged when `ui` omitted.

### Exit criteria

- [x] Docs example **Custom step body** — `TemplateRef` + component `content` (today's API).
- [x] Docs example **Custom card shell** — `ui: 'custom'` + `card` template using `pixel-card`.
- [x] Docs example **Headless** — app-owned panel + `PixelTourRef` signals.
- [x] `pixel-tour-controls` works inside custom template; keyboard + autoplay parity tested.
- [x] Specs: custom card receives context; `ref.next()` advances; focus trap holds.
- [x] README API contract regenerated.

✅ DONE (2026-07-06)

---

## Phase 4 — Placement, beacon & scroll containers

**Goal:** Card feels “attached” to the target; works inside nested scroll areas and RTL.

### Scope

- **Placement API:** extend `PixelTourPlacement` with `'left' | 'right'`; document that `auto`
  already tries four sides — unify types + overlay attach options.
- **Beacon arrow:** optional CSS/SVG pointer from card edge to cutout center
  (`showBeacon?: boolean` per step or config).
- **Scroll-root aware targeting:** `scrollContainer?: Element | string` on step/config;
  `scrollIntoView` + cutout measure relative to the correct scrollport (not only `window`).
- **Sticky re-position:** when target moves within a scroll container, re-attach card without
  jank (throttle via `requestAnimationFrame`, same pattern as spotlight `measure()`).

### Exit criteria

- [ ] Docs example: tour inside `pixel-data-grid` or scrollable panel hits a row anchor correctly.
- [ ] Beacon visible in light + dark; hidden under `prefers-reduced-motion` (static offset only).
- [ ] RTL: card + beacon use logical properties; docs screenshot or spec assertion.
- [ ] `npm run build` + `pixel-tour.spec.ts` + new placement/scroll tests pass.

---

## Phase 5 — Branching, gates & step orchestration

**Goal:** Non-linear tours and “do the action first” flows without ad-hoc `when` hacks.

### Scope

- **Branching:** `next?: string | ((ref) => string)` on `PixelTourStep` — jump by step id
  instead of index+1. Back navigation respects visited stack (not raw index-1).
- **Advance gates:** `canAdvance?: () => boolean | Promise<boolean>` + card shows disabled
  Next until true; expose `ref.advanceBlocked` signal for custom step components.
- **Advance triggers:** extend `advanceOn`:
  - `'event'` + `advanceOnEvent?: string` (dispatch/listen on target, e.g. form `submit`)
  - `'signal'` + optional callback registration on `PixelTourRef`
- **Tour registry (optional DI):** `providePixelTours({ id → steps+config })` +
  `tour.startRegistered('onboarding-v2')` for app-level definitions.

### Exit criteria

- [ ] Docs example: branch on user role / feature flag via `when` + `next`.
- [ ] Docs example: “click Save to continue” using `advanceOn: 'event'` without `target-click`.
- [ ] Persistence stores **step id**, not only index (migration: fall back to index if id missing).
- [ ] README API contract regenerated; breaking changes section if index-only persistence breaks.

---

## Phase 6 — Tour chrome & discoverability

**Goal:** Users can orient, jump, and resume complex tours.

### Scope

- **Step menu (TOC):** optional `showStepList?: boolean` — dropdown or side sheet listing
  steps (respects `when` / skipped); keyboard reachable; marks current step.
- **Card variants:** `size?: 'sm' | 'md' | 'lg'`, `appearance?: 'default' | 'emphasis'` tokens.
- **Custom actions:** per-step `actions?: { label, icon?, onClick(ref) }[]` alongside built-in
  buttons (reuse `pixel-button` semantics).
- **Rich media:** `media?: { type: 'image' | 'video'; src; alt?; poster? }` with reduced-motion
  fallback (poster only).

### Exit criteria

- [ ] TOC opens via footer control + keyboard shortcut (configurable, default off).
- [ ] Step list skips non-applicable `when` steps; `goTo(id)` still works from TOC.
- [ ] Video does not autoplay with sound; respects reduced motion.
- [ ] Docs showcase updated with TOC + branch tour.

---

## Phase 7 — Contextual triggers & route integration

**Goal:** Tours start when and where users need them, not only imperatively.

### Scope

- **`pixelTourTrigger` directive:** inputs `tourId` or inline `steps`, `trigger: 'click' | 'firstVisit' | 'routeEnter'`, `once?: boolean` (uses `persistKey`).
- **Route data integration:** read `data.pixelTour?: string` from `ActivatedRoute` tree;
  optional `PixelTourRouteListener` service (provided in app shell).
- **Queue:** `PixelTourService.enqueue(tour)` — sequential tours after first completes.
- **Conflict rules:** `priority` on config; higher priority can preempt lower (with `beforeAbort`).

### Exit criteria

- [ ] Docs app-shell example: first visit to `/reports` starts tour once.
- [ ] Second tour in queue starts only after `finished` of first.
- [ ] No duplicate tours when navigate back/forward rapidly (debounce + transition id).
- [ ] SSR: triggers no-op; no DOM access errors.

---

## Phase 8 — Analytics, experiments & admin

**Goal:** Product teams measure and iterate tours.

### Scope

- **Rich events:** extend `PixelTourEvent` with `dwellMs`, `direction`, `skippedReason?`,
  `interactionAttempts?`; emit `stepExit` on leave.
- **Funnel helper:** optional `onFunnel?: (stepId, action) => void` typed wrapper over `onEvent`.
- **Tour versioning:** `persistKey` suffix or `config.version` — bump resets completion for
  all users of that key.
- **Debug mode:** `config.debug` draws anchor id badges on page (dev only); logs transitions to
  console.

### Exit criteria

- [ ] Docs example logs funnel to console.
- [ ] Version bump re-shows tour even if `done: true` stored for old version.
- [ ] Debug overlay toggled only when `isDevMode()` or explicit flag (never in production default).

---

## Phase 9 — Spotlight & backdrop pro

**Goal:** Visual polish competitive with Driver.js / Intro.js while staying token-only.

### Scope

- **Backdrop modes:** `backdrop: 'scrim' | 'blur' | 'none'` (blur uses `--pixel-sys-scrim-blur`,
  same as dialog).
- **Spotlight presets:** `spotlight.emphasis?: 'subtle' | 'default' | 'strong'` maps to
  scrim/highlight token overrides (no hardcoded colors).
- **No-scrim beacon-only steps:** `spotlight.scrim?: false` — highlight ring + card only
  (accessibility: still focus trap in card).
- **Cutout animation presets:** configurable morph duration/easing per step (respect reduced motion).

### Exit criteria

- [ ] Blur backdrop matches dialog visual weight in light/dark.
- [ ] Beacon-only step documented with warning about reduced focus visibility on page.
- [ ] Theme customization section lists new tokens.

---

## Phase 10 — Accessibility & i18n hardening

**Goal:** WCAG 2.2 AA for timing, focus, and localization.

### Scope

- **Modal mode:** `modal?: boolean` — `aria-modal="true"`, `inert` on page root (hand-rolled,
  no CDK), stricter focus trap.
- **Extended labels:** RTL-aware progress pattern; `labels` for TOC, gate blocked, branch choice.
- **Live region upgrades:** announce gate cleared, branch taken, pause/minimize state.
- **`@angular/localize` example** in docs for label overrides.

### Exit criteria

- [ ] axe / manual keyboard-only walkthrough on docs showcase passes.
- [ ] Modal mode: Tab cannot reach page behind scrim.
- [ ] Autoplay still has pause + hover/focus freeze (WCAG 2.2.1).

---

## Phase 11 — Developer experience & testing

**Goal:** Faster authoring and reliable E2E.

### Scope

- **Fluent builder:** `pixelTour().step('welcome', …).target('btn').build()` — sugar over arrays.
- **Test harness:** `providePixelTourTesting()` — sync transitions, instant wait, no animations.
- **Harness API:** `getTourCard()`, `getSpotlightCutout()`, `goToStep(id)` for vitest/playwright.
- **Anchor linter (docs-only tool):** script listing registered anchors vs step definitions.

### Exit criteria

- [ ] `pixel-tour.spec.ts` uses harness for drag/autoplay tests (fix jsdom `setPointerCapture`).
- [ ] Builder produces identical `PixelTourStep[]` to manual definition (snapshot test).

---

## Recommended implementation order

```text
Phase 3 (custom card UI)    ← PRIORITY 1 — start here
        ↓
Phase 4 (placement/scroll)  →  Phase 5 (branching/gates)  →  Phase 6 (TOC/chrome)
        ↓
Phase 7 (triggers/routes)   →  Phase 8 (analytics)
        ↓
Phase 9 (backdrop pro)      →  Phase 10 (a11y/i18n)      →  Phase 11 (DX/testing)
```

**Rationale:** custom card unlocks branded onboarding first; placement + scroll fixes
real-world targeting next; branching depends on stable card/ref contracts.

---

## Effort estimate (rough)

| Phase | Size | Risk |
|-------|------|------|
| 3 | L | Medium (a11y extraction) |
| 4 | M | Medium (scroll math) |
| 5 | L | High (branching + persistence) |
| 6 | M | Low |
| 7 | M | Medium (router races) |
| 8 | S | Low |
| 9 | S | Low |
| 10 | M | Medium (inert/focus) |
| 11 | M | Low |

**Suggested next PR:** Phase 3 — docs for today's `TemplateRef`/component body + `config.card` API.

---

## Explicit non-goals (v1 advanced)

- No `@angular/cdk` (overlay, focus, scroll remain hand-rolled in `shared/`).
- No built-in backend — persistence stays pluggable (`PixelTourStorage` only).
- No visual tour **recorder** in the library (docs tooling only, if ever).
- No iframe/cross-origin targeting.

---

## API principles (carry forward)

1. **Imperative-first** — `PixelTourService` + `PixelTourRef`; directives are triggers/targets only.
2. **Signals-only** — new state on ref as `Signal`, not RxJS subjects.
3. **Token-only theming** — new visuals via `--pixel-tour-*` / `--pixel-sys-*`, scheme mixins.
4. **Regression contract** — every public API change → README + `npm run readme:api` + spec.
5. **Breaking changes** — persistence shape, default `advanceOn`, or event payloads require
   README Breaking changes + migration note.
