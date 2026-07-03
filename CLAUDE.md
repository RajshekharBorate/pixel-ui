# pixel-ui — Angular component library

Angular 21 workspace. Library source lives in `projects/pixel-ui/`, docs site in `projects/docs/`.
There is no demo app (it was deleted); the docs site is how components are exercised manually.

## MANDATORY: read the conventions file first

Before writing or modifying ANY component, read `projects/pixel-ui/CONVENTIONS.md`. It is the
single source of truth for architecture, theming, generics, overlays, docs registration, and
testing rules. Do not guess patterns from memory — the rules there override defaults. Highlights
(details and reasons are in the file):

- Every component: `standalone: true`, `OnPush`, signals-only API (`input()`/`model()`/`output()`,
  never decorators), `export default class`, host bindings in the `host: {}` object.
- Generics: `<T = any>` (unconstrained default) — never `<T extends Record<string, unknown>>`.
- Theming: only `--pixel-sys-*` / `--pixel-<component>-*` CSS custom properties, never hardcoded
  colors/spacing. Logical properties (`inline-size`, `margin-inline`) over physical ones.
- **No `@angular/cdk`** — reuse the hand-rolled overlay/focus utilities in
  `projects/pixel-ui/src/lib/shared/`.
- Every new public component needs: folder README, docs registry meta file, docs examples,
  `public-api.ts` export, and a `.spec.ts`.

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

## Commands

- `npm run build` — build the library (ng-packagr)
- `npm test` — vitest via `ng test`
- `npm run docs` — serve the docs site
- `npm run build:docs` — build the docs site

## Working style

- For a task scoped to one component, read only that component's folder (and `shared/` or
  `_theming.scss` if relevant) — do not scan the whole library.
- When adding a component, copy the structure of a similar existing one (`pixel-drawer` for
  overlay-ish, `pixel-divider` for trivial presentational, `pixel-data-grid` for stateful/store).
- Multi-phase features get a `PLAN.md` in their directory (see `pixel-data-grid/PLAN.md`).
