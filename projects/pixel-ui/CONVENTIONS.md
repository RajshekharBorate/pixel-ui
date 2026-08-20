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
- **Every public `input()` gets JSDoc** with `@type`, `@default`, and **`@description`**
  (required for `npm run readme:api` Description cells). Run `npm run lint:jsdoc-inputs`
  to inventory gaps; `--strict` fails CI when ratcheting coverage.
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

### 3a. `appearance` vs `variant`

Use **one** look knob per component. Prefer these names going forward (existing APIs stay;
migrate or alias only with a Breaking-changes note):

| Input | Meaning | Prefer when | Examples |
|-------|---------|-------------|---------|
| **`appearance`** | Surface / chrome treatment shared with the button family | Filled vs outlined vs text / tonal chrome | `pixel-button`, `pixel-split-button`, `pixel-button-group`, `pixel-card`, `pixel-tabs`, chart shell |
| **`variant`** | Structural mode, semantic tone, or layout family that is **not** button surface chrome | Status color, divider style, accordion mode, toast/chip tone, QB layout family | `pixel-badge`, `pixel-chip`, `pixel-toast`, `pixel-breadcrumb`, `pixel-accordion`, `pixel-progress`, `pixel-avatar`, `pixel-query-builder` |

Do **not** expose both `appearance` and `variant` for the same axis on one component.
`pixel-chart-map` may keep a map-specific `variant` alongside shell `appearance` when they
control different axes (geography style vs shell chrome) — document both in the README.

### 3b. Size, density, and intentional exceptions

**Control size (default):** `'xs' | 'sm' | 'md' | 'lg'` with default **`md`** unless documented.

| Exception | Scale / default | Why (document in component README) |
|-----------|-----------------|--------------------------------------|
| Loader / progress | `…\|xl`; loader default `md`; **`pixel-loading-container` default `lg`** | Extra prominence for overlays / section chrome |
| Toast | Control sizes; default **`sm`** | Dense stacked notifications |
| Editor | `'sm' \| 'md' \| 'lg'` (no `xs`) | Toolbar chrome has no usable `xs` density |
| Dialog | `'sm' \| 'md' \| 'lg' \| 'fullscreen'` | Overlay footprint, not control size |
| Drawer | `'sm' \| 'md' \| 'lg' \| 'xl'` | Overlay footprint |

**Density** is a separate axis from `size` — do not invent a third vocabulary:

| Where | Values | Maps to control `size` |
|-------|--------|-------------------------|
| `pixel-data-grid` | `comfortable \| standard \| compact` (default `standard`) | `comfortable→md`, `standard→sm`, `compact→xs` for embedded paginator/input/select |
| `pixel-notification-item` | `compact \| default` | Layout spacing only; not a control-size alias |

New components: prefer `size` only. Add `density` only when row/list chrome needs three visual
heights independent of form-control size (grid pattern), and map embedded controls to `size`.

### 3c. Loading / skeleton matrix

Pick the pattern that matches async semantics; do not add decorative loaders to pure chrome:

| Pattern | When | Inputs / compose |
|---------|------|------------------|
| **Inline `loading` + `pixel-loader`** | Control is busy (submit, fetch options) | `loading`, `loadingLabel`; `aria-busy` |
| **`showSkeleton` / skeleton rows** | Replacing content footprint while data loads | `showSkeleton` or `loadingMode: 'skeleton'`; size to real layout |
| **`pixel-loading-container`** | Section / card / fullscreen overlay | Compose around content |
| **Neither** | Sync presentational / overlay chrome with no async data of its own | dialog/drawer/menu/tooltip shells — parent owns loading |

Interactive async comps (select, autocomplete, data-grid, charts, forms, breadcrumb route
loading) **must** document which pattern they support. Overlays and shell chrome stay
loader-free unless they own fetch state.

**Skeleton footprint:** skeletons must preserve the loaded chrome's approximate block size
(headers stay; row/plot stubs match density). Full chrome replace is only OK when documented
(e.g. tabs keep `min-block-size` of the tab bar). `pixel-app-shell` has no skeleton API —
route/feature owns loading.

**Empty states:** prefer composing `pixel-empty-state` for standalone empty regions (charts,
editor, tree, notification panel). Documented exceptions (listbox / table density /
query-builder validation chrome): select · autocomplete · data-grid empty row · QB empty
ruleset alert — bespoke empty UI keeps native roles.

### 3d. Package entrypoints

| Import | Use for |
|--------|---------|
| `pixel-ui` | Components, services, theme helpers |
| `pixel-ui/charts` | **All chart facades, host, builders** — required for app code |

Charts are also re-exported from main `pixel-ui` for editor/tsconfig convenience until a
published ng-packagr secondary entry ships — **do not** rely on that path in applications.
Optional peer: `echarts` (not needed for sparkline-only).

Tree-shake / size gate: import only the chart families you need via `ensure*Chart` from
`pixel-ui/charts`; never `import … from 'echarts'`. Details: chart README **Tree-shake rules**,
`tools/CHARTS-SIZE.md`, `npm run size:charts` / `lint:echarts-import`.

### 3e. Docs registry taxonomy

Docs `DocComponentMeta` covers both UI components and headless services:

| Category id | Contents |
|-------------|----------|
| `form-controls` … `charts` | `pixel-*` UI under `src/lib/pixel-*` |
| `services` | Headless injectables under `src/lib/services/*` (export, file-transfer, navigate, title) |

Service metas use `serviceName` / `serviceApi` and omit chrome theming. Registry id may be
`pixel-<feature>` even when there is no component folder.

### 3f. Docs example matrix (minimum)

Every public UI component should ship examples covering:

1. **Basic** zero-config usage
2. **Sizes / variants** (or density)
3. **One edge** — overflow, mobile/narrow, form integration, or keyboard/a11y

Tag edge examples with `category: 'Edge'` (or `Behavior` / `Accessibility`) in
`createDocExample()`. Charts may use shell examples for overflow; overlays may use
scrollable / placement demos as the edge.

### 3g. Touch targets

Interactive targets aim for **≥ 44×44px effective** hit area (AGENTS checklist). Prefer expanding
hit area with padding / absolutely positioned `::after` without growing visual chrome.
**Documented exceptions:** compact header density (breadcrumb `sm`/`md` trail, chips, dense
tree rows) — keep visual height compact; expand hit area via pseudo when feasible.

### 3h. Virtualization matrix

| Surface | Long-list strategy |
|---------|-------------------|
| data-grid | `virtualScroll` windowing |
| tree | `virtualScroll` windowing |
| select | Infinite `loadMore` (IntersectionObserver) — **not** DOM windowing; all loaded options render |
| menu / autocomplete | No virtualization — keep option counts modest or paginate upstream |

Prefer select panel virtualization before menu/autocomplete when product lists exceed ~100 rows.

Library-wide performance waves, `@defer` rules, and Lighthouse harness gates: `PERFORMANCE.md`.

### 3i. User-visible copy

Every user-visible English default (labels, empty messages, ARIA names, button tooltips) must be
an `input()` (or a documented `labels` map) so apps can i18n. Prefer promoting hardcoded
template strings when found (paginator, input adornments, notification empties, …).

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
  dynamic image URLs (avatar, badge, toast, tour media, radio option art, file-upload
  previews, chart zoom snapshots…): `NgOptimizedImage` requires static dimensions or
  `fill`, assumes a loader the host app may not provide, and warns when `ngSrc` changes
  after init (common for avatars/toasts). Compensate manually on every such `<img>`:
  `loading="lazy"` + `decoding="async"`, a `(load)`/`(error)` fallback chain when a
  non-image fallback exists, and required `alt` text (`alt=""` only when decorative).
  Use `NgOptimizedImage` only for truly static asset URLs with known intrinsic size.
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
  (`--pixel-sys-{primary,on-primary,primary-hover,secondary,on-secondary,secondary-container,
  on-secondary-container,surface,surface-container(-low|-high|-highest),background,on-surface,
  on-surface-variant,outline,outline-variant,error,success,warning,info,disabled-container,
  on-disabled,focus-ring,scrim,…}` + `on-*`/`*-container` pairs),
  **border roles** (`--pixel-sys-border-{field,soft,divider,strong,emphasis}` — prefer these
  over ad-hoc `color-mix(... outline N% ...)` for `1px` chrome; field = full outline,
  soft ≈ 22%, divider ≈ 38%, strong ≈ 55%, emphasis ≈ 70%),
  spacing (`--pixel-sys-space-{xs…2xl}`), shape
  (`--pixel-sys-shape-corner-{extra-small,small,medium,large,extra-large,full}`),
  motion (`--pixel-sys-motion-duration-short4`), elevation
  (`--pixel-sys-elevation-level{1,2}`), typography
  (`--pixel-sys-label-{xs,sm,md,lg}-{size,line-height,weight,tracking}`), scrollbar
  (`--pixel-sys-scrollbar-*`).
- Control chrome exception: checkbox / radio / avatar presence rings may use **`1.5px`**
  stroke width for affordance; all other borders default to **`1px`**. Do not invent new
  widths without documenting them in the component README.
- Mobile tap flash: `theme-root()` sets `-webkit-tap-highlight-color: transparent` on
  `html` (Android Chrome’s default blue square). `theme-host()` / `tap-highlight-reset`
  cover component hosts and interactive descendants. Prefer Pixel `:active` /
  `:focus-visible` feedback — do not re-enable the browser tap highlight.
- Accidental text selection: `theme-host()` also applies `interactive-no-select-chrome`
  (`user-select: none` + iOS `-webkit-touch-callout: none` on activation chrome) and
  restores `user-select: text` on `input` / `textarea` / `contenteditable`. Components
  without `theme-host()` should `@include pixel.interactive-no-select` (or
  `interactive-no-select-chrome`) on clickable chrome only — never block selection on
  editable or intentionally copyable content. Prefer the mixins over raw `user-select`.
- Component-local tokens: `--pixel-<component>-<property>`, defined on `:host`, derived from
  system tokens (often `color-mix()`), documented in the component README under
  "Theme customization".
- Runtime theming lives in `src/lib/theme/pixel-theme.ts`: `PixelThemeId`
  (`'enterprise-light' | 'enterprise-dark'`), `applyPixelTheme()` (sets `data-theme` +
  `data-color-scheme`, bumps reactive `pixelThemeId` / `pixelThemeVersion`, persists to
  `localStorage` with try/catch for blocked storage), `initPixelTheme()`,
  `isPixelDarkTheme()`, `copyPixelThemeContext()` (body-relocated overlays), and
  `syncPixelThemeFromDom()` for rare manual DOM theme edits. Charts track
  `pixelThemeVersion` in an `effect` so axis/tooltip chrome re-reads tokens — do **not**
  duplicate `data-theme` on nested shells that lag `applyPixelTheme`. Dark mode is free
  **if** you never hardcode — still verify every component in both schemes. **Never
  hardcode theme ids** (`enterprise-dark`) in component SCSS; use
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
  Prefer animating `inset-inline-*` / `margin-inline-*` over `translateX` for inline-axis
  motion (toggle thumbs, segmented indicators). When `translateX` is required (enter/exit
  keyframes, overlay slide), drive the sign from a `:dir(rtl)`-mirrored custom property.
  Do not treat `--*-width` / `--*-height` **token names** as physical-CSS violations — rename
  only with a Breaking-changes note for theme consumers.
- **Never paint with a bare hex/rgb** on `color` / `background` / `fill` / etc. Always
  `var(--pixel-sys-* | --pixel-<comp>-*, #fallback)`. Component-only accent palettes
  (e.g. QB rule/ruleset accents) define `--pixel-<comp>-*` tokens, not ad-hoc property
  colors. Run `npm run lint:bare-color`.
- Interactive focus chrome uses **`:focus-visible`** (and/or `keyboardActive` for pressed
  keyboard state) — never style mouse `:focus` the same as hover. Listbox options may clear
  native outline and use a `--focused` class driven by the widget.
- `@media (prefers-reduced-motion: reduce)` disables transitions/animations on every
  animated component; JS-driven motion checks `prefersReducedMotion()` from
  `shared/overlay-utils.ts`.
- SCSS entry: `@use '../../styles' as pixel;`. Public mixins/functions via
  `src/styles/_index.scss`:   `pixel.theme()`, `theme-root()`, `theme-host()`,
  `tap-highlight-reset()`, `interactive-no-select()` / `interactive-no-select-chrome()` /
  `text-select-restore()`, `breakpoint-up()`, `breakpoint-down()`, `dark-scheme-context`/`light-scheme-context`,
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
- `PixelTitleService` + `providePixelTitle()` format `document.title` (brand, count, truncation) through Angular `Title`. Opt-in `PixelTitleStrategy` when `syncRouterTitle` is true — one writer, no parallel Router subscription. Not a Meta / Open Graph helper.
- UI-independent logic lives under `src/lib/services/<feature>/` with its own `public-api.ts`,
  README, and adapter interfaces for swappable backends (see `file-transfer/`: upload/
  download services, offline queue, `UploadAdapter`/`DownloadAdapter` interfaces,
  `RestAdapter` default). Headless service layer first; components consume it.
- Behavior injection points use DI tokens + provider helpers (e.g.
  `PIXEL_DATE_RANGE_SELECTION_STRATEGY` + `providePixelDateRangeSelectionStrategy()`), so
  consumers can swap strategies without forking components.

## 11. Shared datetime — locale, timezone, and civil-date rules

All date/time logic for datepicker, calendar, date-range-picker, query-builder, data-grid,
and export flows through `projects/pixel-ui/src/lib/shared/datetime/`. These rules are
**final** (accepted 2026-08-19, see `LOCALE-TIMEZONE.md`).

### 11.1 Two kinds of date values

| Kind | What it means | How to store / compare |
|---|---|---|
| **Calendar date** (civil day) | A day the user picked — birthday, invoice date, leave | `Date` at **local midnight** (`new Date(year, month, day)`). Parse with `parseLocalIsoDate`. Serialize as `YYYY-MM-DD` via `toLocalIsoDate`. |
| **Instant** | A precise moment in time — notification `createdAt`, chart point | Epoch ms or ISO-8601 with offset/Z. Display with `Intl` in viewer's local zone. |

### 11.2 `parseLocalIsoDate` — the canonical coercion function

Use this everywhere a date-like value (string / Date / number) must become a `Date`.

```ts
import { parseLocalIsoDate } from '../shared/datetime/pixel-date-utils';
```

| Input | Output |
|---|---|
| Exact `YYYY-MM-DD` | Local civil day via `buildDate` — **never** UTC midnight |
| Full ISO / offset / `Z` | Parse as instant, then `startOfDay` in viewer zone |
| `Date` | `startOfDay` |
| Number (epoch ms) | `startOfDay` of that instant |
| null / undefined / '' | `null` |

**Why not `new Date('YYYY-MM-DD')`?** That is UTC midnight — in US Pacific (UTC−7)
`getDate()` returns the previous day. This is the root cause of all the "off-by-one" date
bugs across Angular Material, AG Grid, Kendo, etc.

### 11.3 `toLocalIsoDate` — canonical serializer for date-only wire format

```ts
import { toLocalIsoDate } from '../shared/datetime/pixel-date-utils';
```

Always use this instead of `date.toISOString().slice(0, 10)` — `toISOString` is UTC-midnight,
shifting the day in positive-offset zones (e.g. IST UTC+5:30).

### 11.4 `toNativeDate` — binding coercion (delegates to `parseLocalIsoDate`)

Used by datepicker/calendar `value`, `min`, `max`, `startAt`, CVA `writeValue`. Do not call
`new Date(stringValue)` anywhere in these paths.

### 11.5 Adapter rules

- **`getFirstDayOfWeek()`** — derived from `Intl.Locale(locale).getWeekInfo().firstDay`
  (ISO 1=Mon…7=Sun → JS `% 7`); Sunday fallback for Firefox <126 or invalid locale.
- **`addCalendarDays(date, n)`** — Y/M/D field arithmetic (`new Date(y, m, d + n)`), not
  `+n * 86400000` (DST-unsafe: clocks jump 1 h → day is only 23 h long).
- **`addCalendarMonths` / `addCalendarYears`** — clamp to last valid day of the target month
  (e.g. Jan 31 + 1 month → Feb 28/29, not March 2).
- `pixel-calendar` injects `PIXEL_DATE_ADAPTER` optionally and uses a lightweight inline
  fallback (`CALENDAR_FALLBACK_ADAPTER`) when no adapter is provided.

### 11.6 `firstDayOfWeek` input

`pixel-calendar`, `pixel-datepicker`, `pixel-date-range-picker` all expose:
```
firstDayOfWeek: input<number | undefined>(undefined)
```
- `undefined` (default) → adapter locale (automatic, locale-aware).
- `0` → Sunday (explicit override for apps that need US-style weeks regardless of locale).
- **Breaking change** from the old default of `0`: callers that relied on Sunday without
  passing `[firstDayOfWeek]="0"` explicitly now get their locale's first day.

### 11.7 App locale bootstrap (recommended)

**Enterprise / docs default:** set Angular `LOCALE_ID` and wire pixel dates to it.

```ts
import { LOCALE_ID } from '@angular/core';
import { providePixelDateLocale } from 'pixel-ui';

{ provide: LOCALE_ID, useValue: 'en-IN' }, // or user/tenant locale from profile
...providePixelDateLocale({ strategy: 'localeId' }),
```

That keeps datepicker, date-range, grid `type: 'date'` cells, and query summaries aligned.
Do **not** call `localeId` without providing `LOCALE_ID` — Angular’s default is always
`'en-US'`.

Lower-level / alternate APIs (same underlying providers):

```ts
provideNativeDateAdapter({ locale: 'fr-FR' })
provideNativeDateAdapter({ localeFrom: 'localeId' })
providePixelDateLocale({ strategy: 'browser' }) // viewer Intl; no LOCALE_ID binding
providePixelDateLocale({ strategy: 'fixed', locale: 'en-IN', formats: PIXEL_DD_MM_YYYY_FORMATS })
```

### 11.8 Export date rule (locked)

All `type: 'date'` export columns (CSV, XLSX) must use the local civil day:

| Input | Output |
|---|---|
| `Date` | Local `YYYY-MM-DD` (via `toLocalIsoDate`) |
| Exact `YYYY-MM-DD` | Keep as-is |
| Full ISO / offset / `Z` | Local civil day via `parseLocalIsoDate` — **not** `slice(0, 10)` |
| Unparseable | Stringify |

### 11.9 Timepicker

- Canonical value format: `"HH:mm"` (24-hour, always).
- `format` input defaults to `undefined` → hour cycle resolved from `Intl` for the given
  `locale` input (`hour12: false` → `'24'`, otherwise `'12'`).
- Zone-free. Do not add IANA timezone to the timepicker.
- Date + time compose via `new Date(y, m, d, h, min)` in viewer zone.

### 11.10 Timezone awareness — `PIXEL_TIMEZONE` token + `getBrowserTimeZone()`

New components and helpers added 2026-08-19:

- **`getBrowserTimeZone()`** — returns `Intl.DateTimeFormat().resolvedOptions().timeZone`;
  falls back to `'UTC'` (SSR-safe).
- **`PIXEL_TIMEZONE`** — optional app-level `InjectionToken<string>`. Provide an IANA id at
  root (or feature) level to set a consistent display timezone independent of the browser:
  ```ts
  { provide: PIXEL_TIMEZONE, useValue: 'America/New_York' }
  ```
  Components that accept a `[timeZone]` input use this precedence:
  1. `[timeZone]` input (per-instance).
  2. `PIXEL_TIMEZONE` token (app-level).
  3. Browser local zone (Intl default).

### 11.11 `pixel-timestamp` — instant display component

Presentational component wrapping `formatRelativeTime` / `formatAbsoluteTimestamp` as a
`<time>` element. Use this instead of duplicating formatting logic in templates.

```html
<pixel-timestamp [value]="createdAt" />
<pixel-timestamp [value]="scheduledAt" mode="absolute" timeZone="America/New_York" />
```

Honors `PIXEL_TIMEZONE` token. Never use this for date-only values (`YYYY-MM-DD`) — use
`pixel-datepicker` or format with `toLocalIsoDate`.

### 11.12 `pixel-datetime-picker` — date + time + timezone → UTC instant

Composed component implementing the enterprise §8 / §25 contract:

```
User: date + time + IANA timezone → output: ISO-8601 UTC string
```

CVA value: ISO UTC string or `null`. Use for scheduling / appointment forms.
Never use `pixel-datepicker` alone for this — it has no timezone awareness.

```html
<pixel-datetime-picker [(value)]="appointment.scheduledAt"
                        [defaultTimeZone]="user.timeZone" />
```

### 11.13 `formatAbsoluteTimestamp` — timezone parameter

The second overload now accepts an optional `timeZone?: string` third argument:

```ts
formatAbsoluteTimestamp(value, locale?, timeZone?)
```

Pass the IANA timezone when displaying timestamps in a business zone that differs from the
viewer's browser zone (e.g. an India operator viewing appointments for New York customers).

### 11.14 `formatRelativeTime` — `timeZone` and `compactLabels` options

`PixelRelativeTimeOptions` now includes:
- `timeZone?: string` — forwarded to `formatAbsoluteTimestamp` when the relative window
  expires and the timestamp falls back to absolute display.
- `compactLabels?: PixelRelativeTimeCompactLabels` — per-field template strings for the
  `compact` style, enabling i18n of ultra-dense phrases that `Intl.RelativeTimeFormat`
  does not cover. When a `locale` is set, compact style now delegates to
  `Intl.RelativeTimeFormat` with `style:'narrow'` before falling back to English templates.

### 11.15 Calendar date display (read-only UI)

**Wire format stays `YYYY-MM-DD`** (export, APIs, grid filter model). **Display format** is
locale-aware and must use the shared helpers — never raw `toLocaleDateString()` on civil dates.

| Helper | Use |
|---|---|
| `formatDisplayDate(date, locale?)` | Grid cells, query summaries, editor chips — same Intl options as datepicker default |
| `formatDisplayDateValue(date, locale, io)` | When adapter/`PIXEL_DATE_FORMATS` are registered (e.g. `PIXEL_DD_MM_YYYY_FORMATS`) |
| `formatCalendarDateDisplayValue(value, locale?, io?)` | Coerce string/`Date`/epoch then format |
| `formatDisplayDateDayMonth(date, locale?)` | Compact grouping labels only (notification day headers) |

Locale precedence for components with a `[dateLocale]` input:
1. Component input
2. Config field (query builder)
3. `PIXEL_DATE_LOCALE` token
4. Browser Intl

App bootstrap — **recommended for enterprise apps and the docs site**:

```ts
// Explicit LOCALE_ID + pixel dates (docs uses en-IN)
{ provide: LOCALE_ID, useValue: 'en-IN' }
...providePixelDateLocale({ strategy: 'localeId' })

// Browser default (global SaaS with no app locale)
...providePixelDateLocale({ strategy: 'browser' })

// Fixed regional pattern
...providePixelDateLocale({
  strategy: 'fixed',
  locale: 'en-IN',
  formats: PIXEL_DD_MM_YYYY_FORMATS,
})
```

Export (`type: 'date'`) **always** emits `YYYY-MM-DD` regardless of display locale.

### 11.16 Out of scope for the library

- Luxon / date-fns / Moment adapters (Phase 4, deferred until a consumer asks).
- Non-Gregorian calendars.
- SSR: `today()` follows the server zone — document per component but do not invent a
  second timezone service.

See `LOCALE-TIMEZONE.md` for the full plan, enterprise-pattern comparison, and phased exit
criteria.

## 12. README = behavior contract (required for every component)

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

## 13. Testing

- `.spec.ts` per component is the default expectation (30 specs exist; the one sanctioned
  gap is `pixel-data-grid`'s phased build — a documented one-off, not policy).
- Pattern (see `pixel-select.spec.ts`, `pixel-divider.spec.ts`): a standalone host component
  driving the component under test through `signal()`s, wrapped in a
  `[data-theme]` shell using registered ids (`enterprise-light` / `enterprise-dark`);
  sentinel buttons around the component for Tab-order assertions.
- Theme CSS asserts: import helpers from `src/testing/theme-tokens.ts` (keep hexes in sync
  with `_theming.scss`). Do not hardcode obsolete brand colors (`#2962ff`, `#ffabf3`) as
  expected resolved `--pixel-sys-*` values.
- Mock browser APIs vitest/jsdom lacks (`IntersectionObserver`, `matchMedia`,
  `ResizeObserver`) with small local mock classes.
- Cover at minimum: rendering & content projection, ARIA attributes, variant/state
  reactivity (flip signals, assert DOM), keyboard interaction, form integration (CVA:
  `writeValue`, disabled state, touched/invalid) where applicable.
- **Responsive claims:** when behavior is **JS-driven** (`matchMedia`, `ResizeObserver`,
  `PIXEL_BREAKPOINT_PX`), add a spec with mocks (see breadcrumb / sidenav / stepper).
  CSS-only `breakpoint-down` / `@container` behavior is inventoried in `RESPONSIVE.md` and
  verified via docs examples — do not invent brittle getComputedStyle media asserts.

## 14. PLAN.md lifecycle

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
