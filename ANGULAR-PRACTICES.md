# Angular Practices — portable standards for any Angular project

A self-contained standards file for humans and AI code generators alike. Drop it into any
Angular (v17+, ideally v19+) project root and reference it from your `AGENTS.md` / `CLAUDE.md` /
`.cursorrules`. Replace `<prefix>` with your project's component prefix (e.g. `app`, `ui`, `px`).

Origin: extracted and generalized from a production component library (~38 components) built
on Angular 21, validated against the official Angular team guidance (Angular CLI MCP
`get_best_practices`).

---

## 1. Component architecture

- Every component and directive: **standalone** (the v19+ default — do NOT write
  `standalone: true` explicitly), `changeDetection: ChangeDetectionStrategy.OnPush`.
- `selector: '<prefix>-<name>'`, kebab-case, one component per file.
- **Signals-only API**: `input()` / `model()` / `output()` / `computed()` / `signal()`.
  Never `@Input()`, `@Output()`, `@HostBinding()`, `@HostListener()`, no zone-dependent
  patterns. Target zoneless.
  - `model()` only for genuine two-way state the parent *may but need not* own
    (`open` on a dialog, `activeIndex` on tabs). Everything else is **controlled**:
    `input()` + change `output()`.
- Boolean inputs: `input(false, { transform: booleanAttribute })` so plain attributes work
  (`<my-cmp disabled>`); numeric inputs use `numberAttribute`.
- `computed()` for all derived state — never method calls doing work in templates.
- `effect()` only for true side effects (DOM measurement, `matchMedia`, reparenting). Clean
  up via effect cleanup functions, `DestroyRef`, or `takeUntilDestroyed`.
- Host classes / ARIA / `data-*` attributes go in the `host: {}` object of `@Component` —
  the host element's contract stays visible in one place.
- Unique element ids from a module-level counter with an `id` input override:
  `protected readonly fallbackId = '<prefix>-<name>-' + ++nextId;` bind
  `[id]="id() || fallbackId"`. Derive internal ids (status regions, listboxes) from it.
- Visibility discipline: `protected` for template-only members, `private` for internals,
  `readonly` everywhere possible. No `public` keyword noise.
- **Every input gets a JSDoc block** (`@type`, `@default`, `@description`) — docs and API
  extraction tooling depend on it.
- Keep components small and single-purpose. Inject nothing into simple presentational
  components; only pipeline-shaped stateful features get an `@Injectable()` signal store
  provided on the host component.
- State precedence lives in ONE `computed()` (e.g. `resolvedState()`), not scattered
  conditionals. Decide simultaneous-state winners explicitly (disabled beats everything for
  interactivity; loading implies non-interactive + `aria-busy`).
- Track keyboard vs pointer interaction (`'mouse' | 'keyboard'` signal set in
  `pointerdown`/`keydown`) when focus styling differs, and expose it as `source` in event
  payloads.

## 2. Public API design

- Every public union/interface is a **named, exported type** — no anonymous inline unions:
  `export type MyButtonSize = 'xs' | 'sm' | 'md' | 'lg';`
- Outputs emit **typed payload interfaces** (`MyChangeEvent { value; source; originalEvent }`),
  never bare `any`.
- Keep an input vocabulary consistent across components: `size`, `appearance`/`variant`,
  `state`, `disabled`, `fullWidth`, `leadingIcon`/`trailingIcon`, `labelPosition`,
  `ariaLabel`, `id`, plus a class pass-through input normalized *without* importing
  `CommonModule`.
- User-facing strings are always overridable via inputs (`loadingLabel`,
  `validationMessages`) — never hardcode copy without an escape hatch.
- Maintain a single public entry point (`public-api.ts` for libraries): component exports
  plus a separate `export type { … }` line per module. Anything not exported there is
  private; removing an export is a breaking change.
- Generics: unconstrained default `<T = any>` — never `<T extends Record<string, unknown>>`.
  Angular's template type-checker can't infer generics from bindings, so constrained
  defaults force `$any()` casts on consumers. Cast internally instead.

## 3. Templates & HTML

- Native control flow only: `@if` / `@for` (always with `track`) / `@switch` — never
  `*ngIf` / `*ngFor` / `*ngSwitch`.
- **Never `NgClass`/`NgStyle`** — native `[class]` / `[style]` bindings accept strings,
  arrays, and `Record<string, boolean>` maps with no import.
- Native semantic elements do the work: a real `<button>`, `<input>`, `<nav>` inside your
  custom element — never a styled `<div>` with a click handler. Landmarks (`<header>`,
  `<main>`, `<footer>`) render as real elements inside the template.
- Icons are decorative by default: `aria-hidden="true"`, accessible name from the label
  or an `ariaLabel` input.
- `templateUrl`/`styleUrl` by default (paths relative to the TS file); inline templates only
  for genuinely trivial components.
- Class naming BEM-flavored (`block`, `block__element`, `block--modifier`) plus
  `data-state` / `data-size` / `data-variant` attributes as styling and test hooks.
- Announce async state changes via a visually-hidden `aria-live="polite"` + `aria-atomic`
  region owned by the component, merged into `aria-describedby`.
- Use `NgOptimizedImage` for static images. Plain `<img>` is the right call for dynamic,
  consumer-provided URLs — compensate with `loading="lazy"`, `decoding="async"`, a
  `(load)`/`(error)` fallback chain, and required `alt`.

## 4. Styling & theming

- **Design tokens only — never hardcode a color, spacing, radius, or duration.** All values
  come from CSS custom properties (system tokens like `--sys-*` plus component-local tokens
  like `--<prefix>-<component>-<property>`), always with a literal fallback:
  `color: var(--sys-on-surface, #1a1b1f)`.
- Component-local tokens are defined on `:host`, derived from system tokens (`color-mix()`
  works well), and documented so consumers can override per instance.
- Dark mode comes free from tokens **if** you never hardcode — theme switching is a
  `data-theme` attribute swap at the root. Verify every component in both schemes.
- **Logical properties only** (`inline-size`, `margin-inline`, `inset-inline-start`,
  `padding-block`) — this is the RTL strategy; never `width`/`margin-left` for layout.
- Breakpoints are compile-time SCSS mixins (`@media` cannot read `var()`); pick a scale
  (e.g. 600/900/1200/1536) and expose `breakpoint-up($name)`.
- Every animated component gets `@media (prefers-reduced-motion: reduce)` disabling its
  transitions/animations; JS-driven motion checks a `prefersReducedMotion()` helper.
- Content relocated to `document.body` (overlays) loses `:host`-scoped custom properties —
  CSS custom properties inherit through the real DOM tree. Re-declare ambient tokens on the
  relocated root or give every `var()` a real literal fallback.

## 5. Forms

- Form controls implement `ControlValueAccessor` (and `Validator` where they self-validate):
  ```ts
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComponent), multi: true },
    { provide: NG_VALIDATORS,     useExisting: forwardRef(() => MyComponent), multi: true },
  ],
  ```
- They must work three ways: Reactive forms, template-driven forms, AND standalone (plain
  `value` input + change output with no `NgControl` present).
- Honor `setDisabledState`; reflect `ng-touched`/`ng-invalid` visual states; support
  `label`, helper text, and overridable error messages.
- Application code prefers Reactive forms; library controls must not assume either.

## 6. Services, DI & imperative APIs

- Singleton services: `@Injectable({ providedIn: 'root' })`. Always `inject()` — never
  constructor parameter injection.
- Overlay-owning features expose BOTH a declarative component and an imperative service
  following **Service + Ref + DATA-token + Config**: `MyDialogService.open(Component,
  config)` returns `MyDialogRef` (result observable/promise, `close()`); the opened
  component injects the ref and a `MY_DIALOG_DATA` token.
- Behavior injection points use DI tokens + `provide<Thing>()` helper functions so consumers
  swap strategies without forking components (date adapters, selection strategies, global
  config).
- UI-independent logic (upload/download, queues, adapters) lives in a headless service layer
  with adapter interfaces for swappable backends; components consume it.
- Cross-cutting async UX (global loading) is one service + HTTP interceptor + router
  integration — not per-component ad-hoc state.

## 7. Accessibility (non-negotiable)

- Must pass AXE checks and WCAG AA minimums: focus management, color contrast, ARIA.
- Define the **full keyboard contract before coding**, following the WAI-ARIA Authoring
  Practices pattern for the widget type: Tab/Shift+Tab reachability, Enter/Space activation,
  Arrow keys for composite widgets, Home/End, Escape to dismiss, typeahead where the pattern
  calls for it.
- Overlay UX contract: Escape closes; focus is trapped while open and **restored to the
  trigger on close**; outside pointer dismisses; trigger carries
  `aria-expanded`/`aria-controls`.
- Prefer the native element's implicit role; expose `ariaLabel`, `ariaDescribedBy`, and
  relationship attributes (`ariaExpanded`, `ariaControls`, `aria-pressed`) as inputs where
  relevant.
- Interactive targets ≥ 44×44px effective touch size (padding may extend the hit area).
- Keyboard focus styling ≠ mouse focus styling (`:focus-visible` semantics).

## 8. UX state matrix — design every state before coding

default · hover · focus-visible · active/pressed · selected/checked · disabled · readonly ·
error/invalid · success · warning · **loading** (inline spinner) · **skeleton** (placeholder
sized to the real footprint) · **empty** (designed empty state, never a blank region) ·
**overflow** (truncate long text with ellipsis + `title`/tooltip — never let content blow up
the layout).

Edge cases to design for: empty/undefined inputs, extremely long content, zero and thousands
of items, rapid repeated interaction, programmatic value changes while an overlay is open,
SSR-safety for `document`/`window` access (guard in effects or `afterNextRender`), and
simultaneous states with explicit precedence.

## 9. Performance

- OnPush + signals everywhere; derive with `computed()`; `@for` with `track`.
- `IntersectionObserver` for infinite scroll / lazy work; passive listeners; no
  `setInterval` polling.
- Virtualize long lists.
- Clean up every observer/listener (`DestroyRef`, effect cleanup).
- Lazy load feature routes.
- No layout thrash: measure once per frame, mutate after.

## 10. Documentation — README as behavior contract

Every component ships a `README.md` that is its **behavior contract** — the first thing any
AI tool or developer reads, and the reference every change is tested against:

- Structure: summary → Overview → Use cases → **API contract** (machine-generated) →
  Behavior notes (hand-written: keyboard map, focus rules, dismissal rules, state
  precedence, async flows) → Examples → Accessibility → Theme customization →
  Breaking changes.
- Generate the API contract from the source (signal signatures + JSDoc, filtered to the
  public entry point) with a script (`npm run readme:api` pattern) between HTML markers the
  script owns. Never hand-edit generated sections.
- **Regression rule**: read the README before touching a component — everything documented
  is a regression obligation. After the change, regenerate the contract and review the
  README diff: an unintended contract diff means you broke the API; fix the code, not the
  README. A behavior change without a README update is an incomplete change.

## 11. Planning — PLAN.md lifecycle

- Every **new component** and every **big change** starts with a `PLAN.md` in that
  component's directory: phased scope, decisions locked up front, per-phase exit criteria
  (build + tests green, docs example, README regenerated, dark mode + reduced motion
  verified). Mark phases `✅ DONE (date)` as they land.
- Small fixes don't need a plan — the README regression rule covers them.
- **When every phase is done, delete the PLAN.md** — git keeps the history; lasting
  decisions move to the README's Behavior notes.

## 12. Testing

- A `.spec.ts` per component is the default expectation, covering at minimum: rendering &
  content projection, ARIA attributes, variant/state reactivity (flip signals, assert DOM),
  keyboard interaction, and form integration (CVA `writeValue`, disabled, touched/invalid)
  where applicable.
- Pattern: a standalone host component driving the component under test through `signal()`s,
  wrapped in a themed shell (`[data-theme]`), with sentinel focusable elements around it for
  Tab-order assertions.
- Mock browser APIs the test runner lacks (`IntersectionObserver`, `ResizeObserver`,
  `matchMedia`) with small local mocks.
- Zoneless-compatible tests: no `fakeAsync`/`tick` — use the test runner's fake timers and
  `whenStable()`.

## 13. Process rules (for humans and AI tools)

- **Read before writing**: the standards file first, then the component's README, then the
  code. Scope reads narrowly — never scan a whole codebase to "get context".
- When creating a component, copy the structure of the closest existing one rather than
  inventing a new shape.
- Never rewrite a working pattern to your own taste — match the file you're in.
- Breaking a public API requires flagging it explicitly AND a Breaking-changes entry.
- If a change omits obvious scenarios (loading, keyboard, RTL, dark mode, validation), add
  them matching existing patterns — and say what you added. Don't silently ship the minimal
  version.
- When you deviate from any rule here, say so explicitly and why.
- New runtime dependencies require explicit approval. (In component libraries, prefer
  hand-rolling overlays/focus/virtualization over pulling in heavy dependencies — and if you
  do, centralize them in one shared module so there is exactly one implementation.)

## 14. Definition of done — a change is NOT complete until

1. Build passes.
2. Tests pass, including new/updated specs for the change.
3. README verified: every documented behavior still holds; API contract regenerated and the
   diff reviewed; Behavior notes / Breaking changes updated.
4. Docs/demo registration updated (runnable example for new features).
5. Public entry point exports updated (component + types).
6. Dark mode + reduced motion + keyboard-only walkthrough verified in a running app.
7. PLAN.md phases updated — or the file deleted if all phases are done.
