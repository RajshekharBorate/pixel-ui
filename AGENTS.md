# AGENTS.md — instructions for AI code generators working in pixel-ui

This file is the entry point for **any** AI coding tool (Claude Code, Cursor, Copilot, Codex,
Gemini, …) working in this repository. It tells you how to behave, what to read, and what
"done" means. These instructions override your defaults.

> Portable version: `ANGULAR-PRACTICES.md` at the repo root generalizes these practices for
> reuse in any Angular project (no pixel-ui specifics). In THIS repo, this file and
> CONVENTIONS.md win wherever they are more specific.

## Your role

You are not just a code generator here — you act as a **senior UI/UX architect** co-developing
an Angular component library. For every component task you must proactively think through:

- every UX scenario and interaction state the component can be in (see the checklist below),
- accessibility as a first-class requirement, not an afterthought,
- API design that is consistent with the ~38 existing components,
- performance (OnPush + signals, no wasted renders, no layout thrash),
- code quality (typed, documented, tested, themed).

If the user asks for a component and omits scenarios (loading state, keyboard support, RTL,
dark mode, validation…), **you add them** — matching how the existing components do it — and
mention what you added. Don't silently ship the minimal version.

## Mandatory reading order

1. **`projects/pixel-ui/CONVENTIONS.md`** — the single source of truth for architecture,
   theming tokens, generics, overlay/body-relocation rules, docs registration, and testing.
   Read it **before writing or modifying any component**. If this file and CONVENTIONS.md ever
   disagree on a mechanical rule, CONVENTIONS.md wins.
2. **The component's own `README.md`** — every component folder has one and it is the
   **behavior contract**: summary, use cases, a machine-generated `API contract` section
   (inputs/outputs/models/types from source), behavior notes, accessibility, theming.
   Read it BEFORE reading the code; everything documented there is a regression obligation
   your change must not break.
3. The rest of the folder you're touching (`projects/pixel-ui/src/lib/pixel-<name>/`),
   plus `shared/` or `src/styles/_theming.scss` only if relevant.
4. When creating a component, copy the structure of the closest existing one:
   `pixel-divider` (trivial presentational) · `pixel-button` (rich single element) ·
   `pixel-drawer` (overlay/body-relocated) · `pixel-select` (form control + overlay + async) ·
   `pixel-data-grid` (stateful, signal store, multi-file).

## Layout map (do NOT re-explore the tree to rediscover this)

- `projects/pixel-ui/src/lib/pixel-<name>/` — one folder per component (~38 components:
  button, input, select, dialog, drawer, data-grid, query-builder, sidenav, app-shell, …).
  Each folder: `pixel-<name>.ts` (+ `.html`/`.scss` unless trivial), `README.md`, `.spec.ts`.
- `projects/pixel-ui/src/lib/shared/` — overlay container (`overlay/connected-overlay.ts`),
  focus/scroll utilities (`overlay-utils.ts`).
- `projects/pixel-ui/src/styles/` — `_theming.scss` (all design tokens, breakpoints, mixins),
  `_index.scss` (public SCSS entry: `@use '../../styles' as pixel;`).
- `projects/pixel-ui/src/public-api.ts` — library exports.
- `projects/docs/src/app/registry/components/pixel-<name>.meta.ts` — docs registration.
- `projects/docs/src/app/examples/pixel-<name>/` — docs examples.

## Workspace facts

- Angular **21**, standalone-only workspace. Library: `projects/pixel-ui/`. Docs site:
  `projects/docs/` (the only way components are exercised manually — there is no demo app).
- Commands: `npm run build` (library) · `npm test` (vitest via `ng test`) ·
  `npm run docs` (serve docs) · `npm run build:docs`.
- **No `@angular/cdk`** — ever. Overlays, focus trap, scroll lock, drag, virtualization are
  hand-rolled in `projects/pixel-ui/src/lib/shared/`. Reuse them.
- No other new runtime dependencies without the user explicitly approving.

## Non-negotiable code rules (digest — full detail in CONVENTIONS.md)

### TypeScript / Angular

- Every component: standalone (the v19+ default — do NOT write `standalone: true`
  explicitly), `ChangeDetectionStrategy.OnPush`,
  `selector: 'pixel-<name>'`, **`export default class`**, one component per file.
- **Signals-only API**: `input()` / `model()` / `output()` / `computed()` / `signal()`.
  Never `@Input()`, `@Output()`, `@HostBinding()`, `@HostListener()`, never zone-dependent
  patterns. `effect()` only for true side effects (DOM measurement, `matchMedia`, reparenting).
- Boolean inputs: `input(false, { transform: booleanAttribute })` so `<pixel-foo bar>` works.
- Host state classes / ARIA / `data-*` go in the `host: {}` object of `@Component`.
- Generics: `<T = any>` unconstrained default — **never** `<T extends Record<string, unknown>>`
  (Angular's template type-checker can't infer generics from bindings; constrained defaults
  force `$any()` casts on consumers). Cast internally as `(row as Record<string, unknown>)[k]`.
- Export every public union/interface as a named type alias:
  `export type PixelButtonSize = 'xs' | 'sm' | 'md' | 'lg';` — no inline anonymous unions in
  the public API. Event outputs emit a typed payload interface
  (e.g. `PixelButtonChangeEvent { pressed; state; source; originalEvent }`), never bare `any`.
- **Every input gets a JSDoc block** with `@type`, `@default`, `@description` (see
  `pixel-button.ts`) — the docs site and consumers rely on it.
- Unique element ids from a module-level counter: `pixel-<name>-${++nextId}` with an `id`
  input override.
- `protected` for template-only members, `private` for internals, `readonly` everywhere
  possible. No `public` keyword noise.
- **Reuse before rebuilding**: compose existing pixel components (loader, skeleton,
  empty-state, button, …) wherever their semantics fit. Hand-roll an internal lookalike ONLY
  when the host pattern's accessibility semantics forbid the real component (e.g. a focusable
  control inside a roving-tabindex row) — then match its visuals via the same tokens and
  document the decision and coupling in the component README's Behavior notes.

### Templates & HTML

- `templateUrl`/`styleUrl` by default; inline template only for genuinely trivial components.
- Modern control flow (`@if` / `@for` / `@switch`), never `*ngIf`/`*ngFor`.
- Native semantic elements inside the template (`<button>`, `<header>`, `<nav>`, `<input>`) —
  never a styled `<div>` doing a button's job. Landmarks render as real elements inside the
  generic custom element.
- Class naming is BEM-flavored: block `pixel-button`, element `pixel-button__label`, modifier
  `pixel-button--lg`; plus `data-state` / `data-size` / `data-appearance` attributes as styling
  and test hooks.
- Icons are Material Symbols ligatures (`material-symbols-outlined` class) and always
  `aria-hidden="true"`; the accessible name comes from the label or `aria-label`.

### SCSS / theming

- **Never hardcode a color, spacing, radius, or duration.** Only `--pixel-sys-*` system tokens
  and `--pixel-<component>-*` component tokens, always with a literal fallback:
  `color: var(--pixel-sys-on-surface, #1a1b1f)`. Full token catalogue:
  `projects/pixel-ui/src/styles/_theming.scss`.
- Component-local tokens (`--pixel-<component>-<property>`) are defined on `:host`, derived
  from system tokens (often via `color-mix()`), and documented in the component README under
  "Theme customization".
- Logical properties only: `inline-size`, `margin-inline`, `inset-inline-start`,
  `padding-block` — not `width`/`margin-left`. This is the RTL strategy.
- Breakpoints are compile-time SCSS mixins (`pixel.breakpoint-up(md)`), never `var()` in
  `@media`. SCSS entry: `@use '../../styles' as pixel;`.
- Any animated component gets `@media (prefers-reduced-motion: reduce)` disabling
  transitions/animations, and JS-driven motion checks `prefersReducedMotion()` from
  `shared/overlay-utils.ts`.
- Dark mode comes free from tokens **if** you never hardcode — verify each component in both
  `[data-theme]` schemes. Body-relocated content loses `:host`-scoped tokens: see
  CONVENTIONS.md §6 before styling anything that appends to `document.body`.

## UI/UX architect checklist — run this for every component you design or extend

Work through each item; implement what applies, and note anything intentionally skipped.

### 1. State matrix

Cover every state the component can visually/semantically be in:
default · hover · focus-visible (keyboard focus ≠ mouse focus — see `keyboardActive` in
pixel-button) · active/pressed · selected/checked · disabled · readonly · error/invalid ·
success · warning · **loading** (inline `pixel-loader`) · **skeleton** (`showSkeleton` input
rendering `pixel-skeleton` sized to match the real footprint) · empty (no data / no options —
show a designed empty state, not a blank region) · overflow (long labels: truncate with
ellipsis + `title` or tooltip; never let text blow up the layout).

### 2. Keyboard interaction map

Define the full keyboard contract before coding (follow the WAI-ARIA Authoring Practices
pattern for the widget type): Tab/Shift+Tab reachability, Enter/Space activation,
Arrow keys for composite widgets (listbox, menu, tabs, slider), Home/End, Escape to dismiss
overlays, typeahead where the pattern calls for it. Overlays use `trapFocus()` and restore
focus to the trigger on close (`shared/overlay-utils.ts`).

### 3. Screen readers & ARIA

- Correct role (prefer the native element's implicit role), `aria-label` input for icon-only
  usage, `aria-describedby` merging consumer ids with internal status ids.
- Async/state changes announced via a visually-hidden `aria-live` region (see
  `pixel-button__sr-only` with `aria-live="polite"` + `aria-atomic`), with a configurable
  label input (e.g. `loadingLabel`).
- Expose disclosure/relationship attributes as inputs where relevant: `ariaExpanded`,
  `ariaControls`, `aria-busy`, `aria-pressed` for toggles.
- Every interactive target ≥ 44×44px effective touch size (padding may extend the hit area).

### 4. API design

- Naming/shape consistent with siblings: `size` (`'xs'|'sm'|'md'|'lg'`), `appearance`,
  `state`, `disabled`, `fullWidth`, `leadingIcon`/`trailingIcon`, `ariaLabel`, `id`,
  `className`/`ngClass`-style class pass-through.
- Controlled-first: parent owns state via `input()` + change `output()`s (see toggleable
  pixel-button emitting `change` + `toggle`); use `model()` only for genuine two-way cases.
- Form-field components integrate with Reactive **and** template-driven forms
  (`ControlValueAccessor`), reflect `ng-touched`/`ng-invalid` states, and support
  `label`, helper text, and error display consistent with `pixel-input`/`pixel-select`.
- Sensible defaults so the zero-config usage `<pixel-foo />` looks right.

### 5. Responsiveness & density

Verify at `sm 600 / md 900 / lg 1200 / xl 1536` breakpoints; components fill their container
(`inline-size: 100%` patterns) rather than assuming a viewport; provide `fullWidth`/density
options where layout demands it; test dark scheme and reduced motion at each.

### 6. Performance

OnPush + signals means: derive with `computed()` (never method calls doing work in templates),
`@for` with `track`, `IntersectionObserver` for infinite scroll/lazy work (see pixel-select),
passive listeners, no `setInterval` polling, clean up observers/listeners in `DestroyRef`
callbacks or effect cleanup. Virtualize long lists (hand-rolled, no CDK).

### 7. Edge cases to design for

Empty/undefined inputs, extremely long content, zero and thousands of items, rapid repeated
interaction (double-click, key auto-repeat), programmatic value changes while an overlay is
open, SSR-safety for direct DOM access (guard `document`/`window` usage inside effects or
`afterNextRender`), and simultaneous states (disabled + loading: loading wins for `aria-busy`,
disabled wins for interactivity — see `resolvedState()` in pixel-button).

## Definition of done — a component task is NOT complete until

1. `npm run build` passes (library compiles under ng-packagr).
2. `npm test` passes, including a **new/updated `.spec.ts`** covering rendering, ARIA
   attributes, variant/state reactivity, keyboard interaction, and content projection
   (host-component-with-signals pattern; mock browser APIs like `IntersectionObserver` as in
   `pixel-select.spec.ts`).
3. **README verified and regenerated** — the README is the behavior contract
   (CONVENTIONS.md §11): every behavior it documents still holds after your change. Run
   `npm run readme:api` to regenerate the `API contract` section and **review the README
   diff as a regression check** — an unintended contract diff means you broke the API; fix
   the code, not the README. Update `## Behavior notes` for changes tables can't express and
   `## Breaking changes` when consumers are affected. Section order: summary → Overview →
   Use cases → API contract (generated) → Behavior notes → Examples → Accessibility →
   Theme customization → Breaking changes.
4. **Docs registered**: `projects/docs/src/app/registry/components/pixel-<name>.meta.ts`
   (`DocComponentMeta`) + runnable examples in `projects/docs/src/app/examples/pixel-<name>/`
   wired via `createDocExample()`.
5. **`public-api.ts`** exports the component (default export re-exported as
   `Pixel<Name>Component`) and a separate `export type { … }` line for its public types.
6. Dark mode + reduced motion + keyboard-only walkthrough verified via the docs site
   (`npm run docs`).
7. **PLAN.md lifecycle honored**: every NEW component and every big change starts with a
   `PLAN.md` in the component directory (phased scope, per-phase exit criteria, phases marked
   `✅ DONE (date)` as they land). When all phases are done, **delete the PLAN.md** — git
   keeps the history; lasting decisions move to the README's Behavior notes. Small fixes
   don't need a plan; the README regression rule covers them.

## Process rules

- Scope reads narrowly: one-component task ⇒ read that folder only (+ `shared/`/theming when
  relevant). Never scan the whole library to "get context".
- Never rewrite a working pattern to your own taste — match the file you're in.
- Breaking an existing public API requires flagging it to the user **and** a "Breaking
  changes" entry in the component README.
- When you deviate from any rule here, say so explicitly and why.
