# pixel-ui conventions

Reference for building any new component in this library. Codifies patterns already established
across `pixel-divider`, `pixel-badge`, `pixel-drawer`, `pixel-data-grid`, etc. — not aspirational,
these are the rules already in force. New components (starting with the layout-shell set: `pixel-
container`, `pixel-header`, `pixel-footer`, `pixel-sidenav`, `pixel-app-shell`) must follow them.

## 1. Component architecture

- `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush` — every component, no
  exceptions.
- `selector: 'pixel-<name>'`, kebab-case, one component per file, `export default class`.
- Signals-only public API: `input()` / `model()` (two-way) / `output()`. Never `@Input()`/`@Output()`/
  `@HostBinding()`/`@HostListener()`.
- `computed()` for derived/protected state. `effect()` only for side effects that can't be expressed
  as a template binding (e.g. a `matchMedia` listener, DOM measurement).
- Simple presentational components have no injected store or service. Only stateful,
  pipeline-shaped features (multi-signal derivation, e.g. `pixel-data-grid`, `pixel-query-builder`)
  get an `@Injectable()` signal store (`PixelXStore`) provided on the host component.
- Boolean inputs: `input(false, { transform: booleanAttribute })` so plain HTML attributes
  (`<pixel-foo bar>`) work without `[bar]="true"`.
- Skeleton:
  ```ts
  @Component({
    selector: 'pixel-example',
    standalone: true,
    templateUrl: './pixel-example.html',
    styleUrl: './pixel-example.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
      class: 'pixel-example',
      '[class.pixel-example--variant]': "variant() === 'x'",
      '[attr.data-size]': 'size()',
    },
  })
  export default class PixelExampleComponent {
    readonly variant = input<'a' | 'b'>('a');
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly changed = output<void>();
    protected readonly isActive = computed(() => …);
  }
  ```

## 2. Templates & host bindings

- `templateUrl`/`styleUrl` by default. Inline `template`/no separate `.scss` only for genuinely
  trivial components (a handful of lines, e.g. `pixel-divider`'s conditional label markup).
- State classes and ARIA/data attributes go in the `@Component({ host: {...} })` object, not
  directives applied to the template root — keeps the host element's contract visible in one place.
- Semantic HTML landmarks (`<header>`, `<footer>`, `<nav>`, `<main>`) are rendered as real elements
  *inside* the component template, even though the custom element itself (`<pixel-header>`) is
  generic — this is how correct landmark roles get onto the page.

## 3. Generics

- New generic components use an **unconstrained** default: `<T = any>`. Never
  `<T extends Record<string, unknown>>`.
  Reason: Angular's template type-checker can't infer a component's generic from input bindings, so
  concrete row/item interfaces (which lack an index signature) fail to satisfy a constrained default,
  forcing consumers to `$any()`-cast every binding. `<T = any>` binds cleanly; consumers still get
  `keyof T` checking wherever they annotate the type themselves. Cast internal index access as
  `(row as Record<string, unknown>)[field]`.

## 4. Design tokens & theming

- All colors/typography/shape/motion/spacing are ambient `--pixel-sys-*` CSS custom properties,
  declared once by `theme($theme)` in `src/styles/_theming.scss` and applied at a `[data-theme]`
  ancestor (`theme-root()`) or a component's own `:host` (`theme-host()`, for content that gets
  relocated to `document.body` — see §6). **Never hardcode a color/spacing value** — reference the
  token, with a literal fallback for resilience: `color: var(--pixel-sys-on-surface, #1a1b1f)`.
- Full token catalogue (see `_theming.scss` for exact values):
  - Color: `--pixel-sys-{primary,on-primary,primary-hover,secondary-container,on-secondary-container,
    surface,surface-container-low,surface-container,background,on-surface,outline,error,on-error,
    error-container,on-error-container,success,warning,info,disabled-container,on-disabled,
    focus-ring,scrim}` (+ `on-*`/`*-container` pairs per semantic color)
  - Spacing: `--pixel-sys-space-{xs,sm,md,lg,xl,2xl}` (0.25 / 0.5 / 1 / 1.5 / 2 / 3 rem)
  - Shape: `--pixel-sys-shape-corner-{small,medium,large,extra-large,full}`
  - Motion: `--pixel-sys-motion-duration-short4` (220ms)
  - Elevation: `--pixel-sys-elevation-level{1,2}`
  - Typography: `--pixel-sys-label-{xs,sm,md,lg}-{size,line-height,weight,tracking}` (+ M3
    `small`/`medium`/`large` aliases)
  - Scrollbar: `--pixel-sys-scrollbar-{track,thumb,thumb-hover,size,radius}`
- Component-local tokens follow `--pixel-<component>-<property>` (e.g. `--pixel-divider-color`),
  usually defined as `color-mix()`/direct references to `--pixel-sys-*` inside the component's own
  `:host` rule, and documented in the component's README under "Theme customization" so consumers can
  override them per-instance.
- Breakpoints are **compile-time SCSS**, not CSS custom properties (`@media` cannot read `var()`):
  `$breakpoints` map + `@mixin breakpoint-up($name) { @media (min-width: map.get($breakpoints,
  $name)) { @content; } }` in `_theming.scss`. Scale: `sm 600px / md 900px / lg 1200px / xl 1536px`
  (Material Design–aligned, matching this theme's M3 flavor).
- Always use logical properties (`inline-size`, `margin-inline`, `inset-inline-start`, `padding-block`)
  over physical ones (`width`, `margin-left`) for RTL/writing-mode resilience.
- `@media (prefers-reduced-motion: reduce) { animation/transition: none !important; }` on any
  component with a slide/fade/scale transition (see `pixel-drawer.scss`).
- SCSS entry: `@use '../../styles' as pixel;`. Available via `src/styles/_index.scss`:
  `pixel.theme()`, `pixel.theme-root()`, `pixel.theme-host()`, `pixel.breakpoint-up()`,
  `pixel.dark-scheme-context` / `light-scheme-context` / `when-dark-scheme`, `pixel.page-background`,
  `pixel.scrollbar`, `pixel.label-density()`.

## 5. No `@angular/cdk`

Deliberate constraint for the whole library. Virtualization, drag (resize/reorder), overlays, and
focus management are hand-rolled. Reuse the existing hand-rolled infrastructure before writing new
overlay/drag code — see §6.

## 6. Overlay / body-relocated content

Components that must escape their local stacking context (menus, selects, dialogs, drawers) share:
- `src/lib/shared/overlay/connected-overlay.ts` — `getOverlayContainer()` returns (creating once) a
  `position: fixed; inset: 0; pointer-events: none; z-index: 1000` container appended to
  `document.body`; individual panels append themselves into it and re-enable `pointer-events`.
- `src/lib/shared/overlay-utils.ts` — `getFocusableElements()`, `trapFocus()`,
  `lockBodyScroll()`/`unlockBodyScroll()`, `prefersReducedMotion()`.
- Content relocated to `document.body` loses access to any `:host`-scoped custom property (like
  `--pixel-<component>-*` or any component-local token) because CSS custom properties inherit through
  the *actual* DOM tree, not the original template position. If a body-relocated component's styling
  depends on such a token, either (a) apply `pixel.theme-host()` so the ambient `--pixel-sys-*` set is
  re-declared on that component's own `:host` via `:host-context([data-theme=...])`, and/or (b) give
  every `var()` fallback a literal value computed from real tokens (not an invented/misspelled token
  name — this caused a real dark-mode bug once, see `pixel-data-grid-columns-panel.scss` history).
- A component that must render EITHER in-flow (part of normal document layout) OR body-relocated
  (overlay) depending on state — e.g. `pixel-sidenav`'s docked-vs-overlay modes — **cannot** be built
  by conditionally instantiating a body-always-relocates component like `pixel-drawer` as a child
  (`@if`/`@else` destroys and recreates the DOM subtree on every mode flip, losing any state in
  projected content). Instead, keep one persistent template and manually reparent the native DOM node
  between its in-flow position and `getOverlayContainer()` via direct `appendChild`/re-insertion in an
  `effect()`, exactly mirroring how `pixel-drawer` itself relocates on open — just made bidirectional.

## 7. Docs registration (required for every new public component)

1. `README.md` in the component's own folder, section order: `## Use cases` → `## Inputs` (table:
   Input | Type | Default | Description) → `## Examples` (HTML snippets) → `## Accessibility` →
   `## Theme customization` (component-local token list) → `## Breaking changes`.
2. Registry meta file at `projects/docs/src/app/registry/components/pixel-<name>.meta.ts`
   implementing `DocComponentMeta` (`projects/docs/src/app/registry/types.ts`) — `id`, `title`,
   `selector`, `category` (existing categories: `form-controls`, `data-display`, `navigation`,
   `layout`, `feedback`, `advanced` — layout-shell components use `'layout'`), `status`
   (`'experimental' | 'beta' | 'stable'`), `summary`, `overview`, `useCases`, `themingNotes`,
   `accessibilityNotes`, `imports`, `inputs`/`outputs` (`DocApiRow[]`), `examples`.
3. Docs examples at `projects/docs/src/app/examples/pixel-<name>/` as `<name>-<variant>.example.ts`
   (+`.html`/`.scss` if not trivial), wired through an `index.ts` barrel using `createDocExample()`
   (`projects/docs/src/app/shared/example-source.util.ts`), referenced from the meta file's
   `examples` array.
4. `public-api.ts`: `export { default as Pixel<Name>Component } from './lib/pixel-<name>/pixel-<name>';`
   followed by a separate `export type { ... } from '...';` line for every public union/interface.

## 8. Testing

`.spec.ts` is the **default expectation** for every new component (see `pixel-divider.spec.ts`:
rendering, ARIA attributes, variant/state reactivity, content projection). The one documented
exception is `pixel-data-grid`'s phased build, where specs were explicitly deferred by project
decision (see its `PLAN.md`) — that is a one-off, not a repo-wide policy.

## 9. Multi-phase features

A feature large enough to need staged delivery (new component families, not single components) gets
its own `PLAN.md` in its primary directory, phased, each phase exiting with `ng build` + `ng test`
green, a docs example, README, dark mode + reduced-motion verified. See `pixel-data-grid/PLAN.md` for
the template.
