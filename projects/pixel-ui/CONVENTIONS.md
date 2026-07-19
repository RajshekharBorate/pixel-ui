# pixel-ui conventions

Single source of truth for building or modifying anything in this library. Derived from a
full audit of all ~38 component folders, `shared/`, `services/`, `theme/`, styles, and the
docs site (July 2026). These are the rules already in force — not aspirational. The
behavioral charter for AI tools (role, UX checklist, definition of done) is in the root
`AGENTS.md`; this file is the mechanical reference.

## 1. Component architecture

- Every component and directive is standalone (the Angular v19+ default) with
  `changeDetection: ChangeDetectionStrategy.OnPush` — no exceptions. Do **not** write
  `standalone: true` explicitly; it is redundant and was swept from the codebase
  (official Angular guidance via the Angular CLI MCP `get_best_practices`).
- `selector: 'pixel-<name>'`, kebab-case, one component per file, **`export default class`**.
  Directives too (`PixelTooltipDirective`, `PixelMenuTriggerDirective`, …). Services and
  stores use named exports.
- Signals-only public API: `input()` / `model()` (two-way) / `output()`. Never `@Input()`/
  `@Output()`/`@HostBinding()`/`@HostListener()`.
  - `model()` is reserved for genuine two-way state the parent may but need not own
    (`open` on dialog/drawer, `activeIndex` on tabs/stepper, `expanded` on panels,
    `page` on paginator — 12 files use it). Everything else is controlled:
    `input()` + change `output()`.
- Boolean inputs: `input(false, { transform: booleanAttribute })` so `<pixel-foo bar>` works.
  Numeric inputs: `numberAttribute` transform.
- `computed()` for all derived state; `effect()` only for true side effects (`matchMedia`,
  DOM measurement, manual reparenting). Cleanup via effect cleanup fns, `DestroyRef`, or
  `takeUntilDestroyed` (27 files use these — always clean up observers/listeners).
- Host state classes / ARIA / `data-*` attributes go in the `@Component({ host: {…} })`
  object — the host contract stays visible in one place.
- Unique ids: module-level counter + input override —
  `protected readonly fallbackId = `pixel-<name>-${++nextId}``, `readonly id = input('')`,
  bind `[id]="id() || fallbackId"`. Derived ids (status regions, listboxes) suffix it.
- Visibility discipline: `protected` for template-only members, `private` for internals,
  `readonly` everywhere possible. No `public` keyword noise.
- **Every input gets a JSDoc block** with `@type`, `@default`, `@description` (see
  `pixel-button.ts`) — READMEs and docs meta are written from these.
- Simple presentational components inject nothing. Only pipeline-shaped stateful features
  get an `@Injectable()` signal store provided on the host component — exactly three exist:
  `PixelDataGridStore`, `PixelQueryBuilderStore`, `FileTransferStore`.
- **Component reuse rule (applies to every component, existing and new):** compose existing
  pixel components wherever their semantics fit (`pixel-loader`/`pixel-skeleton` for
  loading, `pixel-empty-state` for empty regions, `pixel-button` for actions, …) instead of
  hand-rolling lookalikes. Build a bespoke internal piece ONLY when the host pattern's
  semantics forbid the real component (e.g. a focusable form control inside a roving-tabindex
  `treeitem`/`gridcell`, where state must live on the row via ARIA) — and then (a) style it
  from the same system tokens so it stays visually identical to the real component, and
  (b) document the decision + the visual-parity coupling in the README's Behavior notes.
  Before going bespoke, check whether **decorative embedding** neutralizes the conflict:
  render the real component with `aria-hidden="true"`, `tabIndex="-1"` (checkbox/button
  expose a `tabIndex` input for this), and `pointer-events: none`, letting the host row own
  interaction + ARIA state — see pixel-tree's row checkbox.
  Precedents: data-grid Phase 5.5 reuse audit; pixel-tree's decoratively embedded
  `pixel-checkbox`.
- Interaction-source tracking: components that style keyboard focus differently record
  `'mouse' | 'keyboard'` (a `lastInteractionSource` signal set in `pointerdown`/`keydown`)
  and expose it in change-event payloads as `source` (button, checkbox, radio, toggle,
  select, breadcrumb…).

## 2. Files & naming

Component folder layout (`src/lib/pixel-<name>/`):

- `pixel-<name>.ts` — the component. `templateUrl`/`styleUrl` by default; inline template
  only for genuinely trivial or tightly-coupled markup.
- `pixel-<name>.types.ts` — once the type surface outgrows the component file (14 exist:
  toast, stepper, progress, loader, dialog, drawer, data-grid, …). Small components keep
  types in the component file.
- `pixel-<name>.store.ts` / `.service.ts` / `.utils.ts` / `.tokens.ts` — split by role, same
  basename. Sub-components/directives are sibling files (`pixel-tab.ts`, `pixel-tab-label.ts`,
  `pixel-menu-trigger.ts`).
- `README.md` + `pixel-<name>.spec.ts` — required (see §11, §12).
- Compound families live in ONE folder: tabs (`pixel-tabs`/`pixel-tab`/`pixel-tab-nav`/
  `pixel-tab-link` + `PIXEL_TAB_NAV` token), stepper (6 files), chip + chip-set,
  radio + radio-group, avatar + avatar-group, progress bar/circle/container,
  toast + container + inline, loader + skeleton + loading-container.

CSS naming is BEM-flavored: block `pixel-button`, element `pixel-button__label`, modifier
`pixel-button--lg`, plus `data-state` / `data-size` / `data-appearance` attributes as style
and test hooks. Type names are `Pixel<Component><Thing>` (`PixelSelectOption`,
`PixelButtonChangeEvent`); DI tokens are `PIXEL_SCREAMING_SNAKE`; provider functions are
`provide<Thing>()` (`provideNativeDateAdapter`, `providePixelRouteLoading`).

## 3. Public API design

- Every public union/interface is a named, exported type — no anonymous inline unions.
  Shared vocabulary across components (keep consistent when adding inputs):
  `size` (`'xs'|'sm'|'md'|'lg'` subset) · `appearance`/`variant` · `state` · `disabled` ·
  `fullWidth` · `leadingIcon`/`trailingIcon` · `labelPosition` · `openDirection` ·
  `scrollBehavior` · `panelWidthMode` · `ariaLabel` · `id` · `className` + `ngClass`-style
  class-map input (normalized without importing `CommonModule`).
- Outputs emit typed payload interfaces (`Pixel<X>ChangeEvent` with `source` and
  `originalEvent` where applicable), never bare values for multi-field events.
- Form-ish components take a `validationMessages` input
  (`Pixel<X>ValidationMessages`) so consumer copy is overridable — never hardcode
  user-facing strings without an input escape hatch (cf. `loadingLabel` on button).
- State precedence is resolved in one `computed()` (`resolvedState()`), not scattered
  conditionals: disabled beats everything for interactivity; loading implies
  non-interactive + `aria-busy`.
- `public-api.ts`: component default exports re-exported as `Pixel<Name>Component`, then a
  separate `export type { … }` line per module. Everything not exported there is private —
  and moving a symbol out of `public-api.ts` is a breaking change.

## 4. Forms integration

Form controls (input, select, autocomplete, checkbox, toggle, radio-group, slider,
datepicker, timepicker, file-upload, chip-set, query-builder) implement
`ControlValueAccessor` **and**, where they self-validate, `Validator`:

```ts
providers: [
  { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PixelXComponent), multi: true },
  { provide: NG_VALIDATORS,     useExisting: forwardRef(() => PixelXComponent), multi: true },
],
```

They must work in Reactive AND template-driven forms, reflect `ng-touched`/`ng-invalid`
visual states, honor `setDisabledState`, and also work standalone (plain `value` input +
change output) without any `NgControl` present.

## 5. Generics

New generic components use an **unconstrained** default: `<T = any>`. Never
`<T extends Record<string, unknown>>`.
Reason: Angular's template type-checker can't infer a component's generic from input
bindings, so concrete row/item interfaces (no index signature) fail a constrained default,
forcing consumers to `$any()`-cast every binding. `<T = any>` binds cleanly; consumers still
get `keyof T` checking wherever they annotate the type themselves. Cast internal index
access as `(row as Record<string, unknown>)[field]`.

## 6. Templates

- Modern control flow only: `@if` / `@for` (with `track`) / `@switch` — never `*ngIf`/`*ngFor`.
- Never `NgClass`/`NgStyle` directives — plain `[class]` / `[style]` bindings accept strings,
  arrays, and `Record<string, boolean>` maps and need no `@angular/common` import. Components
  that expose a class-map input normalize it themselves (see `pixel-button`'s
  `normalizeClassValue`).
- Plain `<img>` (not `NgOptimizedImage`) is the deliberate choice for consumer-provided,
  dynamic image URLs (avatar, badge, toast…): `NgOptimizedImage` requires static dimensions
  or `fill` and a loader setup the library cannot assume. Compensate manually:
  `loading="lazy"` + `decoding="async"` (opt-in input), a `(load)`/`(error)` fallback chain,
  and required `alt` text.
- Native semantic elements do the work: a real `<button>`, `<input>`, `<nav>` inside the
  generic custom element — never a styled `<div>` with a click handler. Landmarks
  (`<header>`, `<footer>`, `<main>`) render as real elements inside the template.
- Icons are Material Symbols ligatures (`material-symbols-outlined`), always
  `aria-hidden="true"`; the accessible name comes from the label text or `ariaLabel`.
- Async state changes are announced through a visually-hidden `aria-live="polite"` +
  `aria-atomic` status region owned by the component (see `pixel-button__sr-only`), wired
  into `aria-describedby`.
- Loading affordances: inline `pixel-loader` for in-place busy states; a `showSkeleton`
  input rendering `pixel-skeleton` **sized to match the real footprint** for
  content-not-yet-here states.

## 7. Design tokens & theming

- All colors/typography/shape/motion/spacing are ambient `--pixel-sys-*` custom properties,
  declared by `theme($theme)` in `src/styles/_theming.scss`, applied at a `[data-theme]`
  ancestor (`theme-root()`) or a component's own `:host` (`theme-host()` — for
  body-relocated content, see §9). **Never hardcode a color/spacing value**; always
  reference a token with a literal fallback: `color: var(--pixel-sys-on-surface, #1a1b1f)`.
- Token catalogue (exact values in `_theming.scss`): color
  (`--pixel-sys-{primary,on-primary,primary-hover,secondary-container,surface,
  surface-container(-low),background,on-surface,outline,error,success,warning,info,
  disabled-container,on-disabled,focus-ring,scrim,…}` + `on-*`/`*-container` pairs),
  spacing (`--pixel-sys-space-{xs…2xl}`), shape (`--pixel-sys-shape-corner-{small…full}`),
  motion (`--pixel-sys-motion-duration-short4`), elevation
  (`--pixel-sys-elevation-level{1,2}`), typography
  (`--pixel-sys-label-{xs,sm,md,lg}-{size,line-height,weight,tracking}`), scrollbar
  (`--pixel-sys-scrollbar-*`).
- Component-local tokens: `--pixel-<component>-<property>`, defined on `:host`, derived from
  system tokens (often `color-mix()`), documented in the component README under
  "Theme customization".
- Runtime theming lives in `src/lib/theme/pixel-theme.ts`: `PixelThemeId`
  (`'enterprise-light' | 'enterprise-dark'`), `applyPixelTheme()` (sets `data-theme` +
  `data-color-scheme`, persists to `localStorage` with try/catch for blocked storage),
  `initPixelTheme()`, `isPixelDarkTheme()`, `copyPixelThemeContext()` (body-relocated
  overlays). Dark mode is free **if** you never hardcode — still verify every component in
  both schemes. **Never hardcode theme ids** (`enterprise-dark`) in component SCSS; use
  `dark-scheme-context` / `light-scheme-context` (in-flow), `dark-scheme-host` (body-relocated
  `:host`), or `dark-scheme-self` / `light-scheme-self` (body-relocated panels). Scheme
  hooks use `data-color-scheme='dark'|'light'`; theme ids are listed once in
  `$dark-theme-ids` / `$light-theme-ids` in `_theming.scss`.
- Breakpoints are compile-time SCSS (`@media` can't read `var()`):
  `pixel.breakpoint-up($name)` / `pixel.breakpoint-down($name)` with
  `sm 600 / md 900 / lg 1200 / xl 1536`. **Never** hard-code
  `@media (max-width: 640px)` (or any px/rem width) in component SCSS — CI
  (`npm run lint:breakpoints`) rejects them. JS `matchMedia` must use
  `PIXEL_BREAKPOINT_PX` from `shared/breakpoints.ts` (keep in sync with `$breakpoints`).
- See **§7a** for viewport vs container-query choice, and `RESPONSIVE.md` for the
  per-component inventory.
- Logical properties only (`inline-size`, `margin-inline`, `inset-inline-start`,
  `padding-block`) — this is the RTL strategy; never `width`/`margin-left` for layout.
- `@media (prefers-reduced-motion: reduce)` disables transitions/animations on every
  animated component; JS-driven motion checks `prefersReducedMotion()` from
  `shared/overlay-utils.ts`.
- SCSS entry: `@use '../../styles' as pixel;`. Public mixins/functions via
  `src/styles/_index.scss`:   `pixel.theme()`, `theme-root()`, `theme-host()`,
  `breakpoint-up()`, `breakpoint-down()`, `dark-scheme-context`/`light-scheme-context`,
  `dark-scheme-host`/`dark-scheme-self`/`light-scheme-self`,
  `when-dark-scheme`/`when-light-scheme`, `page-background`, `scrollbar`, `label-density()`.

### 7a. Viewport breakpoints vs container queries

| Use | When |
|-----|------|
| **Viewport** (`breakpoint-up` / `breakpoint-down`, or JS `PIXEL_BREAKPOINT_PX`) | Shell / sidenav mode, page-level form stacking, dialog sheet constraints, toast edge insets, stepper label collapse, touch-density tweaks that should follow the device. |
| **Container queries** (`@container`) | Chrome that lives inside a variable-width host (toolbar in a card/grid cell) — e.g. query-builder toolbar. Thresholds may be component-local; document them and still provide viewport fallbacks via `breakpoint-down` for older engines. |
| **Neither** | Fill-container overflow (data-grid h-scroll, tabs chevrons, chip-set `wrap`/`scrollable`, connected-overlay flip). Prefer intrinsic layout over viewport media. |

Inventory: `projects/pixel-ui/RESPONSIVE.md`.

## 8. No `@angular/cdk` — shared infrastructure instead

Deliberate library-wide constraint. Virtualization, drag (resize/reorder), overlays, focus
management, and date adapters are hand-rolled. **Reuse these before writing anything new:**

- `shared/overlay/connected-overlay.ts` — the positioning engine every anchored overlay
  (select, menu, autocomplete, datepicker, tooltip…) uses:
  - `getOverlayContainer()` — lazily created singleton `position: fixed; z-index: 1000;
    pointer-events: none` layer on `document.body`; each panel re-enables its own pointer
    events.
  - `ConnectedOverlay` class + `ConnectedOverlayConfig`: `preferredPlacements` tried in
    priority order with viewport-fit flip (8 placements: `bottom/top-start/end/center`,
    `right/left-start`), `scrollStrategy: 'block' | 'reposition' | 'close'`,
    `width: match-origin | min-origin | custom | auto`, `offset` (4px) /
    `viewportMargin` (8px) defaults, `hasBackdrop` (transparent backdrop that swallows the
    dismissing click), `onOutsidePointer`, `isConnected` (treat submenu panels as inside).
  - `OVERLAY_VISIBLE_CLASS` contract: panels stay out of flow and invisible until
    positioned, then the class lands and keys the entrance animation — never let a panel
    render in document flow or flash unpositioned.
- `shared/overlay-utils.ts` — `getFocusableElements()`, `trapFocus()`,
  `lockBodyScroll()`/`unlockBodyScroll()` (paired, re-entrant), `prefersReducedMotion()`,
  `OVERLAY_FOCUSABLE_SELECTOR`.
- `shared/datetime/` — `PixelDateAdapter` abstraction + `PixelNativeDateAdapter`,
  `PIXEL_DATE_ADAPTER`/`PIXEL_DATE_FORMATS`/`PIXEL_DATE_LOCALE` tokens,
  `provideNativeDateAdapter()`, `injectDateAdapter()`, plus pure date utils
  (`sameDay`, `normalizeRange`, `defaultParseDate`, `localeDateFieldOrder`, …). All
  date/time components consume the adapter — never `new Date()` parsing/formatting inline.

Overlay UX contract (all overlay components): Escape closes; focus is trapped while open
and **restored to the trigger on close**; outside pointer dismisses (backdrop or document
listener); `aria-expanded`/`aria-controls` on the trigger.

## 9. Body-relocated content — token inheritance & reparenting

- Content relocated to `document.body` loses `:host`-scoped custom properties (CSS custom
  properties inherit through the *actual* DOM tree). If a body-relocated panel's styling
  depends on a component-local token, either (a) apply `pixel.theme-host()` so the ambient
  `--pixel-sys-*` set is re-declared on that component's `:host` via
  `:host-context([data-theme=…])`, and/or (b) give every `var()` a literal fallback computed
  from real token values — not an invented/misspelled token name (this caused a real
  dark-mode bug; see `pixel-data-grid-columns-panel.scss` history). Call
  `copyPixelThemeContext(panel, trigger)` when mounting the panel so both `data-theme` and
  `data-color-scheme` are present for `dark-scheme-host` / `dark-scheme-self` mixins.
- A component that must render EITHER in-flow OR body-relocated depending on state (e.g.
  `pixel-sidenav` docked-vs-overlay) **cannot** conditionally instantiate a
  body-relocating child (`@if`/`@else` destroys the subtree on every flip, losing projected
  state). Keep one persistent template and manually reparent the native node between its
  in-flow position and `getOverlayContainer()` in an `effect()` — `pixel-drawer`'s
  relocation, made bidirectional.

## 10. Imperative services, refs & DI tokens

- Overlay-owning features expose BOTH a declarative component and an imperative service:
  `PixelDialogService.open()` / `PixelDrawerService.open()` return a `PixelDialogRef` /
  `PixelDrawerRef` (result promise/observable, `close()`), with data injected via
  `PIXEL_DIALOG_DATA` / `PIXEL_DRAWER_DATA` and options via `Pixel<X>Config`. New
  imperative overlays follow Service + Ref + DATA-token + Config, all exported from
  `public-api.ts`.
- `PixelToastService` — global toast queue (+ `pixel-toast-container`, promise-based
  `PixelToastPromiseMessages`).
- Loading system: `PixelLoadingService` (task registry), `pixelLoadingInterceptor` +
  `PIXEL_LOADING_CONFIG` (HTTP), `providePixelRouteLoading()` (router) — integrate with it
  rather than inventing per-component global loading state.
- `PixelBreadcrumbService` + `PIXEL_BREADCRUMB_DATA_KEY` derive breadcrumbs from router data.
- UI-independent logic lives under `src/lib/services/<feature>/` with its own `public-api.ts`,
  README, and adapter interfaces for swappable backends (see `file-transfer/`: upload/
  download services, offline queue, `UploadAdapter`/`DownloadAdapter` interfaces,
  `RestAdapter` default). Headless service layer first; components consume it.
- Behavior injection points use DI tokens + provider helpers (e.g.
  `PIXEL_DATE_RANGE_SELECTION_STRATEGY` + `providePixelDateRangeSelectionStrategy()`), so
  consumers can swap strategies without forking components.

## 11. README = behavior contract (required for every public component)

Every component folder has a `README.md` that is the component's **behavior contract** — the
first thing any AI tool or developer reads, and the reference every change is tested against.

1. **Read the README before touching the component.** Everything documented there is a
   regression obligation: the change is not done until each documented behavior still holds.
2. Section order: title + summary → `## Overview` → `## Use cases` → **`## API contract`**
   (machine-generated, see rule 3) → `## Behavior notes` (hand-written: keyboard map, focus
   handling, overlay/dismissal rules, state precedence, async flows — everything tables
   can't express) → `## Examples` (HTML snippets) → `## Accessibility` →
   `## Theme customization` (component token list) → `## Breaking changes`. Form controls
   add `## Reactive and template forms`; async-capable components add async guidance.
3. **The `API contract` section is machine-owned.** It lives between `API-CONTRACT` markers
   and is generated from the source (signal signatures + input JSDoc, filtered to
   `public-api.ts` exports) by **`npm run readme:api`** (`tools/generate-readme-api.mjs`).
   Never edit between the markers by hand.
4. **Regression rule — every change is tested against the README.** After modifying a
   component: run `npm run readme:api` and review the README diff. A diff inside the
   contract markers is an API change — either it was intended (record it under
   `## Breaking changes` when it breaks consumers) or it is a regression: fix the code, not
   the README. Behavior changes the tables can't express must be reflected in
   `## Behavior notes`. A behavior change without a README update is an incomplete change.
5. Legacy hand-written `## Inputs`/`## Outputs` tables (pre-contract) are superseded by the
   generated contract — when touching such a component, fold unique prose into
   `## Behavior notes` and delete the stale tables.
6. Registry meta at `projects/docs/src/app/registry/components/pixel-<name>.meta.ts`
   implementing `DocComponentMeta` (`registry/types.ts`): `id`, `title`, `selector`,
   `category` (`form-controls | data-display | navigation | layout | feedback | advanced`),
   `status` (`experimental | beta | stable`), `summary`, `overview`, `useCases`,
   `themingNotes`, `accessibilityNotes`, `imports`, `inputs`/`outputs` (`DocApiRow[]`),
   optional `serviceApi`/`serviceName` for service-backed components, `examples`.
7. Runnable examples at `projects/docs/src/app/examples/pixel-<name>/` as
   `<name>-<variant>.example.ts` (+`.html`/`.scss`), wired through an `index.ts` barrel
   using `createDocExample()` (`docs/src/app/shared/example-source.util.ts`).
8. `public-api.ts` export (component + types) per §3.

The docs site is the only manual test bed (no demo app) — a component without docs
registration is unfinished.

## 12. Testing

- `.spec.ts` per component is the default expectation (30 specs exist; the one sanctioned
  gap is `pixel-data-grid`'s phased build — a documented one-off, not policy).
- Pattern (see `pixel-select.spec.ts`, `pixel-divider.spec.ts`): a standalone host component
  driving the component under test through `signal()`s, wrapped in a
  `[data-theme]` shell; sentinel buttons around the component for Tab-order assertions.
- Mock browser APIs vitest/jsdom lacks (`IntersectionObserver`, `matchMedia`,
  `ResizeObserver`) with small local mock classes.
- Cover at minimum: rendering & content projection, ARIA attributes, variant/state
  reactivity (flip signals, assert DOM), keyboard interaction, form integration (CVA:
  `writeValue`, disabled state, touched/invalid) where applicable.

## 13. PLAN.md lifecycle

- **Every new component and every big change to an existing one starts with a `PLAN.md`** in
  that component's directory — phased scope, decisions (locked), and per-phase exit criteria:
  `ng build` + `ng test` green, docs example, README (contract regenerated), dark mode +
  reduced-motion verified. Mark phases `✅ DONE (date)` as they land.
- Small changes (bug fixes, single-input additions) don't need one — the README regression
  rule (§11.4) covers them.
- **When every phase is `✅ DONE`, delete the `PLAN.md`.** A fully-executed plan is history,
  and git preserves it (see `pixel-data-grid/PLAN.md`, executed over phases 0–8 and removed
  2026-07-04); lasting decisions must live in the component README (`## Behavior notes`) or
  this file, not in the plan.
