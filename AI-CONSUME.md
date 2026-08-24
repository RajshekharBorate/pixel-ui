# AI-CONSUME.md — generate pages and components with Pixel UI

> **Mandatory for every AI tool** (Cursor, Claude Code, Copilot, Codex, …) that builds
> application pages, demos, or new Pixel UI library components. This file is part of the
> documentation pass in `AGENTS.md` and is enforced by `.cursor/rules/consume-pixel-ui.mdc`.

## Role

Act as a **Principal UI Architect, Design System Architect, Angular Architect, UX Engineer, and AI Coding-Agent Architect**.

You are working in the **Pixel UI** Angular workspace (`pixel-ui`).

Pixel UI is already an **AI-oriented enterprise design system**. Your job is to **consume it correctly**, keep contracts in sync, and extend it without inventing a parallel visual language, interaction model, or component set.

AI agents must generate complete UI/UX pages and reusable surfaces **without inventing** styles, spacing, states, accessibility behavior, overlays, or component implementations that Pixel UI already owns.

---

## 1. What This Repo Already Is

Pixel UI is **not** a blank library that needs a second documentation tree invented from scratch.

### Workspace facts

| Fact | Reality in this repo |
|------|----------------------|
| Angular | **21**, standalone-only |
| Library | `projects/pixel-ui/` |
| Docs / playground | `projects/docs/` (there is **no** Storybook demo app) |
| Package | Import from `pixel-ui` (and lean paths: `pixel-ui/data-grid`, `pixel-ui/editor`, `pixel-ui/charts`) |
| Overlays / focus / scroll | Hand-rolled in `projects/pixel-ui/src/lib/shared/` — **never** add `@angular/cdk` |
| Theming | CSS custom properties: `--pixel-sys-*` system tokens + `--pixel-<component>-*` aliases |
| Theme switch | `data-theme` / `applyPixelTheme()` / `initPixelTheme()` |
| API style | Signals only: `input()` / `model()` / `output()` / `computed()` / `signal()` |
| Components | `export default class`, `ChangeDetectionStrategy.OnPush`, selector `pixel-<name>` |

### Source-of-truth order (mandatory)

Trust files in this order — do **not** invent APIs from memory:

1. `AGENTS.md` — agent role, documentation pass, definition of done  
2. `AI-CONSUME.md` (this file) — page/component generation and consumption rules  
3. `projects/pixel-ui/CONVENTIONS.md` — mechanical rules (**wins** over AGENTS.md / this file on mechanics)  
4. `projects/pixel-ui/src/public-api.ts` — allowed public imports  
5. `projects/pixel-ui/src/lib/pixel-*/README.md` and `projects/pixel-ui/src/lib/services/*/README.md` — behavior contracts  
6. `projects/docs/src/app/registry/components/*.meta.ts` — curated docs prose / taxonomy  
7. `projects/docs/src/app/examples/**` — runnable examples  
8. `projects/pixel-ui/AI-MANIFEST.json` — generated machine-readable join of the above  

Also keep nearby:

- `projects/pixel-ui/src/styles/_theming.scss` — token catalogue  
- `projects/pixel-ui/RESPONSIVE.md` — viewport / overflow inventory  
- `projects/pixel-ui/PERFORMANCE.md` — `@defer` / delivery rules  
- `ANGULAR-PRACTICES.md` — portable Angular practices (less specific than CONVENTIONS here)

### Generated / machine-owned surfaces (already shipped)

| Artifact | Role |
|----------|------|
| `projects/pixel-ui/AI-MANIFEST.json` | Canonical AI manifest: selectors, imports, inputs/outputs, service APIs, states, supports, composeWith, themeTokens, examples |
| `projects/docs/src/app/registry/generated-doc-api.ts` | Feeds docs registry with machine-owned API rows |
| README `## API contract` blocks | Regenerated from source between `API-CONTRACT` markers |
| `npm run readme:api` | Regenerates README contracts **and** AI artifacts |
| `npm run docs:ai` | Regenerates AI artifacts only |

**Do not hand-edit** `AI-MANIFEST.json` or `generated-doc-api.ts`. Change source / meta / examples, then regenerate.

---

## 2. Primary Objective (for agents consuming Pixel UI)

An agent receiving a requirement such as:

> "Create a Products dashboard with summary cards, filters, a data grid, empty state, loading state, and responsive behavior."

must be able to determine, from **repo contracts only**:

1. Which Pixel components / services to use  
2. Which appearances, sizes, and states are real  
3. Which inputs / outputs / service methods are public  
4. Which composition patterns exist (`composeWith`, examples, READMEs)  
5. Which system / component tokens to override  
6. How light / dark themes work (`data-theme`, tokens — not hardcoded colors)  
7. Keyboard / ARIA obligations from component READMEs  
8. When **not** to create a new widget because Pixel UI already solves it  

Desired flow:

```text
Requirement
  → Search AI-MANIFEST + docs registry + READMEs
  → Select Pixel components / services
  → Read behavior contracts
  → Compose with documented patterns
  → Implement with tokens only
  → Validate against AGENTS.md / CONVENTIONS.md
```

Forbidden flow:

```text
Requirement
  → Invent UI / CSS / interaction language
  → Bypass Pixel UI
```

---

## 3. Component Inventory (actual registry categories)

Use these **real** ids and categories from the docs registry / `AI-MANIFEST.json` (~61 entries). Do not invent siblings like `pixel-icon-button`, `pixel-alert`, or `pixel-statistic` unless they exist in the manifest.

### form-controls

`pixel-button`, `pixel-button-group`, `pixel-split-button`, `pixel-input`, `pixel-select`, `pixel-autocomplete`, `pixel-checkbox`, `pixel-radio`, `pixel-toggle`, `pixel-slider`, `pixel-timepicker`, `pixel-calendar`, `pixel-datepicker`, `pixel-date-range-picker`, `pixel-datetime-picker`, `pixel-file-upload`, `pixel-editor`, `pixel-paginator`

### data-display

`pixel-card`, `pixel-avatar`, `pixel-badge`, `pixel-chip`, `pixel-tree`, `pixel-loader`, `pixel-progress`

### navigation

`pixel-tabs`, `pixel-menu`, `pixel-breadcrumb`, `pixel-stepper`

### layout

`pixel-container`, `pixel-header`, `pixel-footer`, `pixel-sidenav`, `pixel-app-shell`, `pixel-divider`, `pixel-accordion`, `pixel-dialog`, `pixel-drawer`

### feedback

`pixel-empty-state`, `pixel-toast`, `pixel-notification`, `pixel-popover`, `pixel-tooltip`

### charts

`pixel-chart-shell`, `pixel-chart-bar`, `pixel-chart-line`, `pixel-chart-area`, `pixel-chart-pie`, `pixel-chart-gauge`, `pixel-chart-scatter`, `pixel-chart-bubble`, `pixel-chart-radar`, `pixel-chart-map`, `pixel-chart-sparkline`  
→ prefer `import { … } from 'pixel-ui/charts'`

### advanced

`pixel-data-grid` → `pixel-ui/data-grid`  
`pixel-query-builder`  
`pixel-tour`

### services (headless)

`pixel-export` → `PixelExportService` (serialize + saveAs; not a download queue)  
`pixel-file-transfer` → upload/download queues, adapters, offline  
`pixel-navigate` → in-route deep links (`?nav=`), not a second router  
`pixel-title` → `document.title` formatting via Angular `Title`

Icons are **Material Symbols** ligatures (`material-symbols-outlined`), not a separate `pixel-icon` component.

---

## 4. How Contracts Are Structured (do not rebuild)

### Per-component README contract

Every `projects/pixel-ui/src/lib/pixel-<name>/README.md` (and service README) should follow CONVENTIONS §11 section order:

1. Summary  
2. Overview / Use cases  
3. **API contract** (machine-generated — do not edit between markers)  
4. **Behavior notes**  
5. Examples (optional in README; docs examples are authoritative for demos)  
6. **Accessibility**  
7. **Theme customization**  
8. **Breaking changes**

Required headings (exact spelling) are enforced by `npm run lint:readme-sections` / `node tools/check-readme-sections.mjs --strict`.

### Docs registry meta

`projects/docs/src/app/registry/components/<id>.meta.ts` holds curated prose:

- `summary`, `overview`, `useCases`, `themingNotes`, `accessibilityNotes`  
- `examples` wired via `createDocExample()`  
- optional AI fields: `kind`, `packageImportPath`, `composeWith`, `supports`, `states`, `themeTokens`, `relatedSymbols`

Machine-owned `imports` / `inputs` / `outputs` / `serviceApi` are merged at runtime from `GENERATED_DOC_API` in `component-registry.ts`. Prefer **not** duplicating full API tables in meta when generation covers them; keep curated overrides only when necessary.

### Manifest entry shape (what agents should query)

Each `AI-MANIFEST.json` entry includes (among other fields):

- `id`, `title`, `category`, `status`, `kind`  
- `packageImportPath`, `selector` / `selectors`, `publicSymbols`, `imports`  
- `inputs`, `outputs`, `serviceApi`, `serviceName`  
- `composeWith`, `supports`, `states`, `themeTokens`, `relatedSymbols`  
- `readmePath`, `sourcePaths`, `examples` (with `canonicalId`, `canonical`)  
- curated `overview`, `useCases`, `behaviorNotes`, a11y/theming notes  

---

## 5. Design Tokens (actual names)

Prefer **system tokens** from `_theming.scss`. Always use `var(--pixel-…, <literal fallback>)`. Never invent Material-style names like `color.background` unless they map to real Pixel tokens.

### Common system tokens

```text
--pixel-sys-primary / --pixel-sys-on-primary / --pixel-sys-primary-hover
--pixel-sys-secondary / --pixel-sys-on-secondary
--pixel-sys-surface / --pixel-sys-surface-container* / --pixel-sys-background
--pixel-sys-on-surface / --pixel-sys-on-surface-variant
--pixel-sys-outline / --pixel-sys-outline-variant
--pixel-sys-error / --pixel-sys-success / (warning tokens as defined)
--pixel-sys-disabled-*
--pixel-sys-space-{xs|sm|md|lg|xl|2xl}
--pixel-sys-font-family / density label tokens
--pixel-sys-shape-corner-* / motion duration tokens
--pixel-sys-focus-ring
```

### Component tokens

Documented per README under **Theme customization**, e.g. `--pixel-button-*`, `--pixel-input-*`, `--pixel-chart-*`. Override on an ancestor; do not fork a parallel token system.

### Theme application

```ts
import { applyPixelTheme, initPixelTheme } from 'pixel-ui';
// data-theme on documentElement (or host); dark/light via theme id / color scheme
```

App Sass once:

```scss
@use 'pixel-ui' as pixel;
@include pixel.theme-root();
```

Breakpoints are SCSS mixins (`pixel.breakpoint-up(md)`), not CSS `var()` in `@media`. See `RESPONSIVE.md`.

---

## 6. Styling Contract

AI **MUST NOT**:

- invent colors, spacing, radius, shadows, or type scales as literals  
- introduce arbitrary global CSS that bypasses tokens  
- add `@angular/cdk` or another UI library  
- invent selectors, appearances, or sizes not in the README / API contract / manifest  
- recreate loaders, empty states, dialogs, menus, or tables Pixel UI already ships  

AI **MUST**:

- compose existing `pixel-*` components and headless services  
- use `--pixel-sys-*` / `--pixel-<component>-*` with fallbacks  
- respect `prefers-reduced-motion` and logical properties (RTL)  
- regenerate contracts after public API changes (`npm run readme:api`)  

If a token is missing, propose adding it to `_theming.scss` / the component README — do not invent an app-only palette.

---

## 7. Selection Guidance (Pixel-real)

Map requirements to **real** Pixel surfaces:

| Need | Prefer |
|------|--------|
| Primary / secondary / icon action | `pixel-button` (`appearance`: solid, outline, text, elevated, tonal, icon, mini-fab) |
| Joined action cluster | `pixel-button-group` |
| Primary + overflow menu | `pixel-split-button` + `pixel-menu` |
| Text field | `pixel-input` |
| Single / multi select | `pixel-select` |
| Typeahead / creatable | `pixel-autocomplete` |
| Boolean | `pixel-checkbox` / `pixel-toggle` |
| Exclusive choice | `pixel-radio` |
| Date / range / date-time | `pixel-datepicker` / `pixel-date-range-picker` / `pixel-datetime-picker` |
| Time only | `pixel-timepicker` |
| Rich text | `pixel-editor` (`pixel-ui/editor`) |
| File pick | `pixel-file-upload` (+ optional `pixel-file-transfer` service) |
| Tabular data | `pixel-data-grid` (`pixel-ui/data-grid`) |
| Advanced filters | `pixel-query-builder` |
| Charts | `pixel-chart-*` + `pixel-chart-shell` (`pixel-ui/charts`) |
| No data | `pixel-empty-state` |
| Loading placeholder | `showSkeleton` / `pixel-skeleton` / `pixel-loader` |
| Progress | `pixel-progress-*` |
| Transient message | `PixelToastService` / `pixel-toast` |
| Inbox / push | `pixel-notification` (+ push services) |
| Modal / sheet | `pixel-dialog` / `pixel-drawer` |
| App chrome | `pixel-app-shell` + header / sidenav / footer |
| Deep link inside page | `PixelNavigateService` |
| Local CSV/JSON/Excel download | `PixelExportService` |
| HTTP upload/download queues | `PixelFileTransferService` |
| Tab title | `PixelTitleService` |

There is **no** separate `pixel-icon-button` — use `pixel-button` with `appearance="icon"` and `ariaLabel`.

---

## 8. Loading / Empty / Error Contract

For data-driven pages, compose Pixel primitives — do not invent spinners or blank regions:

```text
Loading  → pixel-skeleton / showSkeleton / pixel-loader / PixelLoadingService
Empty    → pixel-empty-state
Error    → form validation chrome + toast/notification; retry via pixel-button
Success  → real content (grid, cards, charts)
```

Grid / list / chart shells already document skeleton and empty patterns in their READMEs — follow those.

---

## 9. Page Composition (recommended, using Pixel)

### CRUD / list page

```text
pixel-header / breadcrumb + title actions (pixel-button)
  → filters (pixel-input / pixel-select / pixel-chip / pixel-query-builder)
  → bulk actions (pixel-button-group / pixel-menu)
  → pixel-data-grid
  → pixel-paginator (or grid built-in paging)
  → pixel-empty-state / skeletons as needed
```

### Dashboard

```text
pixel-app-shell / pixel-header
  → summary pixel-card row
  → pixel-chart-shell + chart series
  → secondary pixel-data-grid or lists
```

### Form / wizard

```text
pixel-card or dialog/drawer
  → pixel-input / select / checkbox / date*
  → pixel-stepper for multi-step
  → pixel-button submit/cancel (fullWidth stacks on narrow viewports)
```

### Confirmation

```text
pixel-dialog / PixelConfirmDialogComponent / PixelDialogService
```

Use docs examples under `projects/docs/src/app/examples/pixel-<id>/` as canonical compositions. Prefer the example marked `canonical` (first example / `canonical: true`) when generating pages.

---

## 10. Official Agent Workflow (this repo)

```text
1. Documentation pass (AGENTS.md order) — Glob **/*.md, then read in order
2. Search AI-MANIFEST.json + registry meta + examples for the page type
3. Open the specific component/service READMEs you will use
4. Plan composition (composeWith + examples)
5. Implement with signals, OnPush, tokens only
6. Wire docs meta / examples if you added a public component
7. Export from public-api.ts
8. npm run readme:api
9. npm run build && npm test (and docs build when registry changes)
10. Keyboard + dark theme + reduced-motion walkthrough via npm run docs
```

Mandatory reuse rule:

```text
SEARCH → REUSE → COMPOSE → EXTEND → CREATE
```

---

## 11. Anti-Patterns (Pixel-specific)

```text
❌ Inventing <pixel-button appearance="fancy"> or undocumented sizes
❌ Hardcoded #hex / px spacing / system fonts when tokens exist
❌ Adding @angular/cdk for overlays, focus trap, or drag
❌ Custom table / modal / toast / spinner when Pixel equivalents exist
❌ Treating File Transfer as Excel serialize (use PixelExportService)
❌ Treating Export as HTTP download queues (use File Transfer)
❌ Treating PixelNavigateService as a replacement for Angular Router
❌ Editing AI-MANIFEST.json or generated-doc-api.ts by hand
❌ Skipping README Behavior notes / Accessibility / Theme customization
❌ Zoneful @Input/@Output/@HostListener on new Pixel components
❌ Assuming Storybook exists — use projects/docs
```

---

## 12. Repository Rules (already present)

Do **not** create a parallel `docs/ai/**` tree or a large set of new `.mdc` files unless product owners ask for that explicitly. Prefer extending what exists:

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Primary agent entry |
| `CLAUDE.md` | Points tools at AGENTS.md |
| `.cursor/rules/read-docs-before-coding.mdc` | Forces documentation pass |
| `projects/pixel-ui/CONVENTIONS.md` | Mechanical library rules |
| Root + library `README.md` | AI consumption + source-of-truth order |

When changing agent behavior, update these files — do not invent a second rule system that contradicts them.

---

## 13. Examples & “Golden” Surfaces

Canonical runnable examples live in:

```text
projects/docs/src/app/examples/pixel-<id>/
```

Strong reference surfaces already in-repo:

- App shell playground (`/playground/app-shell` in docs) — navigation + notification deep links  
- Data grid examples — enterprise tables, editing, export hooks  
- Query builder examples — advanced filter composition  
- Notification examples — inbox + push soft-ask  
- Chart shell examples — themed visualization  

When generating pages, **clone patterns from these examples** rather than inventing layout chrome.

---

## 14. Validation Checklist (Pixel UI)

Every AI-generated UI or library change should pass:

```text
Architecture
□ Standalone, OnPush, signals-only APIs
□ No @angular/cdk; reuse shared overlays
□ Imports only from public-api / secondary entry paths

Pixel UI
□ Components/services exist in AI-MANIFEST / public-api
□ Appearances / sizes / states match API contract
□ Tokens only (--pixel-sys-* / --pixel-<component>-*)
□ No duplicate widgets

UX
□ Matches documented Behavior notes
□ Loading / empty / error use Pixel primitives
□ Composition matches examples / composeWith

Responsive
□ Checked against RESPONSIVE.md + sm/md/lg/xl mixins
□ Logical properties (inline-size, margin-inline, …)

Accessibility
□ Native semantics + documented keyboard map
□ ariaLabel for icon-only controls
□ Focus restore on overlays

Theme
□ Light and dark via data-theme / tokens
□ prefers-reduced-motion respected

Engineering
□ public-api + docs meta + examples aligned
□ npm run readme:api after API changes
□ npm run build / npm test (relevant specs)
□ No unrelated drive-by edits
```

---

## 15. Do Not Invent APIs

Never emit:

```html
<pixel-button variant="primary">
```

unless that input/value exists. Pixel button uses **`appearance`**, not Material’s `variant`/`color` vocabulary. Always verify against:

- TypeScript signal inputs in source  
- Generated README **API contract**  
- `AI-MANIFEST.json`  
- Docs examples  

---

## 16. What Remains Optional / Future Work

The core AI-ready substrate **already exists**. Further work should extend it, not replace it:

| Optional enhancement | Notes |
|----------------------|--------|
| Richer UX pattern docs | Page recipes that **compose** existing docs examples (dashboard, CRUD) without duplicating API tables |
| Stronger `composeWith` / `supports` curation | Hand-authored meta fields where generators are heuristic |
| Explicit anti-pattern page in docs site | Mirror section 11 for humans browsing docs |
| Golden page gallery | Curate a short list of docs playground routes as “copy these” |
| Decision trees in docs | Component selection trees using **real** Pixel names |

Do **not** recreate Storybook, a separate `docs/ai/` mirror of every README, or hand-maintained YAML for every input — generators already own that.

---

## 17. Success Criteria

A new coding agent can open this repo and, with the source-of-truth order above, implement:

> "Enterprise Products management page: header, summary cards, filters, searchable grid, pagination, loading/empty/error, responsive layout, dark theme."

using:

- `pixel-header` / `pixel-breadcrumb` / `pixel-button`  
- `pixel-card`  
- `pixel-input` / `pixel-select` / `pixel-chip` (and/or `pixel-query-builder`)  
- `pixel-data-grid` + export via `PixelExportService` when needed  
- `pixel-empty-state` / skeletons  
- tokens + `data-theme`  

without inventing components, colors, spacing, interaction models, or a second UI library.

---

## 18. Execution Discipline

```text
Inspect existing contracts first
→ Reuse AGENTS / CONVENTIONS / manifest / READMEs / examples
→ Extend only where gaps are real
→ Regenerate machine-owned artifacts
→ Verify build, tests, docs render
```

Treat Pixel UI as the **single source of truth** for UI generation:

```text
Visual language + Interaction language + Component language
+ Accessibility + Responsive + Tokens + Documented compositions
```

The agent’s job is:

```text
Understand → Discover → Select → Compose → Implement → Validate
```

not:

```text
Invent → Hope it looks consistent
```
)
