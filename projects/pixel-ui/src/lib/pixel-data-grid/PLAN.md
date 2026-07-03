# `pixel-data-grid` — Enterprise Data Grid Plan

> Status tracker for building a new, AG-Grid/PrimeNG-class enterprise data grid as a **separate
> component** from the existing lightweight `pixel-table` (`pixel-table` was later removed once this
> grid covered its use cases too — see the 2026-07-02 note at the end of this file). Built phase by
> phase; each phase ships code + specs + at least one docs example and leaves `ng build` / `ng test`
> green.

## Decisions (locked)

- **New component** `pixel-data-grid` (selector `pixel-data-grid`). `pixel-table` stays as the
  lightweight option, untouched (at the time — removed 2026-07-02, see note at end of file).
- **Reuse over re-roll:** prefer existing pixel components (input/select/checkbox/paginator/button/
  badge/loader/radio) over hand-rolled controls + styles. See **Phase 5.5** below.
- **Scope:** full enterprise set — sorting, filtering, column resize/reorder/pin, selection,
  export (incl. export-all), virtualization/scale, grouping & aggregation, inline editing, a11y.

## Architecture (mirrors `pixel-query-builder`'s store pattern)

```
pixel-data-grid/
  pixel-data-grid.ts                  # host orchestrator (OnPush, signals, generic <T>)
  pixel-data-grid.html / .scss
  pixel-data-grid.types.ts            # all public types/interfaces
  pixel-data-grid.store.ts            # @Injectable() signal store: columns, sort, filter,
                                      #   selection, expansion, edit, page, view-state
  pixel-data-grid.utils.ts            # pure helpers: comparators, predicates, grouping,
                                      #   aggregation, export serialization, id gen
  pixel-data-grid-datasource.ts       # DataSource abstraction (client + server/remote)
  # sub-components (recursive/composable, store-injected)
  pixel-data-grid-toolbar.ts          # title, quick search, column chooser, export, density
  pixel-data-grid-header.ts           # header row: sort, resize, reorder, pin, header menu
  pixel-data-grid-body.ts             # virtualized scroll viewport
  pixel-data-grid-row.ts              # data row / group row / detail row
  pixel-data-grid-cell.ts            # cell render + inline editor host
  pixel-data-grid-filter.ts           # per-column filter popover / filter panel
  pixel-data-grid-footer.ts           # aggregation summary + pagination footer
  # directives (content-projection hooks)
  pixel-data-grid-cell.directive.ts        # custom cell template  [pixelGridCell="field"]
  pixel-data-grid-editor.directive.ts      # custom editor template [pixelGridEditor="field"]
  pixel-data-grid-detail.directive.ts      # master-detail template [pixelGridDetail]
  pixel-data-grid-toolbar.directive.ts     # projected toolbar actions
  pixel-data-grid-virtual-scroll.ts        # hand-rolled windowing (no @angular/cdk)
  README.md
  pixel-data-grid.spec.ts (+ per-area specs)
  PLAN.md                              # this file
```

### Conventions to follow (verified in repo)
- `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush`, default-exported class.
- Signal APIs: `input()`, `input.required()`, `model()`, `output()`, `computed()`, `effect()`,
  `contentChildren()`; `booleanAttribute` / `numberAttribute` transforms.
- Host bindings for state via `host: { class, '[attr.data-*]', '[class.*]' }`.
- Generic `export default class PixelDataGridComponent<T extends Row = Row>`.
- Store: `@Injectable()` provided on the host component, injected by sub-components (incl. a
  `injectPixelDataGridStore()` helper), immutable signal updates, synchronous change listener.
- SCSS: `@use '../../styles' as pixel;` + `pixel.theme-host()`, density mixin, `pixel.scrollbar`,
  dark/light scheme contexts, **logical properties** (`inline-size`/`block-size`/`inset-*`),
  `@media (prefers-reduced-motion)`, tokens extracted to mixins for body-appended overlays.
- JSDoc on every public input/output/type. `fallbackId` counter pattern for a11y ids.
- No `@angular/cdk` — hand-roll virtual scroll, drag, and any overlay (reuse select's pattern).
- Reuse existing pixel components: `pixel-button`, `pixel-menu`, `pixel-checkbox`, `pixel-input`,
  `pixel-select`, `pixel-chip`, `pixel-paginator`, `pixel-skeleton`, `pixel-tooltip`.
- Public API: export component, directives, store, util fns, and all types in `public-api.ts`.
- Docs: examples under `projects/docs/src/app/examples/pixel-data-grid/` + `index.ts`, a
  `pixel-data-grid.meta.ts` registry entry wired into `component-registry.ts`, API tables,
  accessibility notes.

---

## Phase 0 — Foundation & scaffolding  ✅ DONE (2026-06-23)
**Goal:** architecture in place; renders columns/rows with density, sticky header, empty/loading/
skeleton states, and custom cell templates. No advanced features yet.
**Shipped:** `types`/`store`/`utils`/`cell.directive`/host component + html/scss, `pixelGridCell`
custom cells, built-in text/number/date/boolean renderers + `valueFormatter`, density, sticky
header, striped/hover/clickable rows, empty + loading-overlay + skeleton states. Public API
exported; README; 14 passing unit tests; 2 docs examples + meta + registry. Library `ng build`
green. (SCSS skips `theme-host()` like `pixel-table` and reads ambient `--pixel-sys-*` tokens.)
**Generic typing:** row generic is **unconstrained** (`<T = any>`), unlike `pixel-table`'s
`<T extends Row>`. Consumers bind `[data]="rows()"` / `[columns]="columns"` with concrete row
interfaces and **no `$any()` casts**; they still get `keyof T` field-name checking when they type
`PixelDataGridColumn<PersonRow>` in their `.ts`. (Internal indexing casts via
`(row as Record<string, unknown>)[field]`.)
**Note:** `ng build docs` production fails the repo-wide `anyComponentStyle` 8kB budget for ~every
component (incl. `pixel-table`); pre-existing, out of scope.
- Scaffold folder; `types.ts` (port + extend `pixel-table.types`), `store.ts` skeleton,
  host component shell (`data`, `columns`, `rowId`, `density`, `stickyHeader`, `loading`,
  `showSkeleton`, `emptyMessage`, `caption`).
- SCSS token scaffold: theme-host, density mixin, dark/light, scrollbar.
- `pixelGridCell` directive + render pipeline (built-in renderers: text/number/date/boolean).
- Wire `public-api.ts`, docs meta + first "basic" example, README skeleton, spec scaffold.
- **Exit:** `ng build` + `ng test` green; basic grid visible in docs.

## Phase 1 — Core data operations  ✅ DONE (2026-06-23)
**Goal:** sorting, filtering, quick search, pagination — client- and server-side.
**Shipped:** multi-column sort (shift-click cycle none→asc→desc + priority badges, `cycleGridSort`),
per-column filters (text/number/date/select/boolean with type-aware operators + popover),
global quick search, pagination footer (page-size + range + first/prev/next/last). Store now owns
the filter→sort→paginate pipeline + `criteria`. Two-way models `[(sortModel)]`/`[(filters)]`/
`[(quickFilter)]`/`[(pageIndex)]`/`[(pageSize)]`; outputs `sortChange`/`pageChange`/`criteriaChange`.
Server mode (`serverSide` + `totalRecords`) and a pluggable **DataSource** (`[dataSource]`,
value/Promise/Observable `fetch(criteria)`, auto loading overlay). Public API + README + meta
updated; 2 new docs examples (client data-ops, server DataSource). Library `ng build` green; docs
typecheck clean. (Per request, no new spec tests this phase.)
- **Multi-column sort** (`sortModel: {field,direction,priority}[]`, shift-click to add); single-sort
  fallback. `aria-sort`, sort indicators with priority badges.
- **Per-column filters**: operators per type (text/number/date/select/boolean), filter popover;
  combined predicate. Global **quick search**.
- **Pagination** footer (reuse `pixel-paginator`) + page-size options; range label.
- **DataSource abstraction**: `PixelDataGridDataSource<T>` (client impl + remote impl); unified
  `criteriaChange` (sort + page + quickFilter + filters) for server mode; loading states.
- **Exit:** sortable/filterable/paged grid, both modes, with examples.

## Phase 2 — Column power features  ✅ DONE (2026-06-23)
**Goal:** make columns fully interactive and persistable.
**Shipped:** drag-**resize** (pointer handles, `minWidth`, dbl-click reset), drag-**reorder**
(native HTML5 DnD + drop indicator), **pin/freeze** left & right (sticky offsets via `pinLayout`,
edge shadow), **column chooser** toolbar, per-column **header menu** (sort/pin/hide), and
**view-state** `getState`/`setState`/`getStateJson`/`setStateFromJson`/`resetColumns` capturing
order+width+visibility+pin+sort+filters+page. Store owns column overrides (order/widths/
hidden/pinned) + arranged left→center→right columns. Inputs `resizableColumns`/`reorderableColumns`/
`pinnableColumns`/`columnChooser`; column config gains `resizable`/`minWidth`/`pinned`; outputs
`columnVisibilityChange`/`stateChange`. Public API + README + meta updated; 2 new docs examples
(column tooling, save/restore state). Library `ng build` green; docs typecheck clean; no test
regression. (Per request, no new spec tests this phase.)
**Visually verified (2026-06-24)** via `ng serve docs`: pinned columns are genuinely `position: sticky`
(Name left:0 z:4, Start date right:0 z:4), config widths exact. **Bug found & fixed:** the table was
`table-layout: auto`, which ignored explicit column / selection widths (selection col rendered 21px
not 44px) and broke pin-offset math → switched `.pixel-data-grid__table` to
`table-layout: fixed; inline-size: max-content; min-inline-size: 100%`. Pin offsets are now exact
when pinned columns have explicit widths.
- **Resize**: drag handles, min/max width, persisted widths, auto-size to content (dbl-click).
- **Reorder**: drag-and-drop header reordering (hand-rolled, reuse query-builder drag patterns).
- **Pin / freeze**: left & right sticky column groups with shadow affordance.
- **Column chooser / visibility**, lockable columns, header **context menu** (sort/pin/hide/resize).
- **View-state persistence**: `getState()/setState()` capturing column order/width/visibility/pin +
  sort + filters; emit `stateChange`. JSON export/import of grid view.
- **Exit:** columns resize/reorder/pin/persist; state round-trips.

## Phase 3 — Selection & export  ✅ DONE (2026-06-24)
**Goal:** rich selection and complete export story.
**Shipped:** single/multiple **selection** with a sticky checkbox column (header select-all +
indeterminate), **shift-click range**, select-all-across-pages banner (client mode), `[(selectedRows)]`
keyed by `rowId`, `selectionChange`. **Export** menu: CSV / JSON / **Excel (SpreadsheetML, no dep)** /
**clipboard (TSV)** via pure builders in utils; respects column order/visibility/`exportable:false`;
"Only selected" scope toggle; programmatic `exportData(format, scope)` with `'all'|'selected'|'page'`;
**export-all** fetches the full set from a bound `[dataSource]`. Store gained `leadingOffset` so pin
offsets account for the checkbox column. Inputs `selectionMode`/`selectedRows`/`exportable`/
`exportFileName`/`exportFormats`; column gains `exportable`. Public API + README + meta updated; 1 new
docs example (selection & export). Library `ng build` green; docs typecheck clean; no test regression.
(Per request, no new spec tests this phase.)
**Visually verified (2026-06-24):** checkbox column sticky at 44px, header indeterminate state,
select-all + per-row toggle update selection (9/10 → "9 selected"), CSV export content correct
(ISO dates, header labels, all 40 rows), server DataSource example loads async (15 of 240) and is
not stuck loading. Benefited from the `table-layout: fixed` fix above.
- **Selection**: single/multiple, checkbox column, header select-all (current page / all pages),
  **shift-click range** + ctrl/cmd toggle, keyboard selection, indeterminate header state,
  persistence across pages/sort/filter via `rowId`.
- **Export**: CSV, JSON, **Excel (SpreadsheetML/xlsx)**, **clipboard (TSV)**; scope = visible /
  selected / **all** (server-side "export all" fetches via DataSource); respects column order +
  visibility + value formatters; configurable file name.
- **Exit:** selection + every export scope working with examples.

## Phase 4 — Virtualization & scale  ✅ DONE (2026-06-24)
**Goal:** smooth with 10k–100k+ rows.
**Shipped:** hand-rolled fixed-height **row virtualization** (no `@angular/cdk`) using spacer `<tr>`
rows inside `<tbody>` so the `<table>` semantics — and the sticky header + sticky pinned columns —
keep working. Window computed from `scrollTop` + measured viewport (`ResizeObserver`), with
`virtualOverscan` buffer; absolute row index via `@let i = $index + viewStartIndex()`. Inputs
`virtualScroll`/`rowHeight`/`virtualHeight`/`virtualOverscan`; **infinite scroll** via
`infiniteScroll`/`hasMore`/`loadMore` (guard clears on data change). Virtualization bypasses
pagination. Public API needed no new types. README + meta updated; 1 docs example (50k rows + pinned
column). Library `ng build` green; docs typecheck clean; no test regression.
**Visually verified (2026-06-24):** 50k-row grid renders only **25 DOM rows**, scrollHeight ≈
2,250,000px (full set reserved by spacers), scrolling to ~row 1000 re-windows correctly
(EVT-000001 → EVT-000993, top spacer 44,640px, DOM rows constant at 25), and the `Reference` column
stays `position: sticky` while virtualized. (Screenshot tool times out on the 2.25M-px page; verified
via DOM measurement instead.)
- Hand-rolled **row virtualization** (windowing directive) compatible with sticky header/footer and
  pinned columns; configurable row height (fixed + estimated/variable).
- **Infinite scroll / load-more** hook via DataSource; scroll-position restoration.
- Optional **horizontal virtualization** for very wide grids.
- Performance pass: `trackBy`, signal granularity, minimal re-render, OnPush audit.
- **Exit:** documented benchmark; large-dataset example stays fluid.

## Phase 5 — Grouping & aggregation  ✅ DONE (2026-06-24, tree data deferred)
**Goal:** summarize and nest data.
**Shipped:** multi-level **row grouping** (`[groupBy]`) with collapsible indented headers + counts +
toolbar Expand/Collapse all; per-column **aggregation** (`aggregate`: sum/avg/min/max/count or custom
fn) in group headers + a sticky **grand-total `<tfoot>`**; **master-detail** rows via the
`pixelGridDetail` directive + `expandableRows` (sticky toggle column). Store builds a flattened
`renderRows` descriptor list (group / data / detail) consumed by a `@switch` branch; row cells
factored into a shared `#rowCells` template reused by the plain (virtualized) and flat (grouped)
paths. `leadingOffset` now accounts for selection + detail columns (also fixed single-selection
pin offset). New `pixel-data-grid-detail.directive.ts`; utils gained
`computeGridAggregate`/`aggregateGridColumns`/`buildGroupedRenderRows`/`collectGridGroupKeys`/
`gridRenderRowKey`. Public API + README + meta updated; 2 docs examples (grouping+aggregation,
master-detail). Library `ng build` green; docs typecheck clean; no test regression.
**Visually verified (2026-06-24):** 12 nested group rows (3 regions × 3 products, level-1 indented
16px), counts correct (EU 20 = 7+7+6), per-column sums in headers (EU units 370) + grand total
(1,130 units / 255,510 revenue), collapse hides children (60→40 rows), master-detail toggle expands
a `pixelGridDetail` panel (colspan 5). Tree data (hierarchical children) **deferred**; grouping not
combined with virtualization.
- **Row grouping** by one/multiple columns; collapsible group rows with counts.
- **Aggregation**: per-group + grand total (sum/avg/min/max/count/custom fns); **summary footer**.
- **Tree data** (self-referential/children) + **master-detail** expandable rows via
  `pixelGridDetail` template.
- **Exit:** grouped + aggregated + tree/detail examples.

## Phase 5.5 — Component reuse refactor  ✅ DONE (2026-06-24)
**Goal:** replace hand-rolled controls/styles in the grid with existing pixel components. No new
local component or bespoke style where a library component already exists. Behavior unchanged.
**Shipped & verified live:** pager → **pixel-paginator** (now has numbered pages + page-size select);
quick search → **pixel-input** (`trailingIcon=search`); selection header/rows → **pixel-checkbox**
(shift-click range preserved via the checkbox `click` MouseEvent output); column chooser + export
"only selected" → **pixel-checkbox**; filter operator + select/boolean value → **pixel-select**;
filter text/number value → **pixel-input**; filter trigger + column kebab + clear → **pixel-button**;
loading spinner → **pixel-loader**. Removed all now-dead SCSS (`__search-input/-icon`, `__pager`,
`__page-*`, `__spinner`+keyframes, `__filter-clear/-btn` base, `__col-menu-btn` base, `__checkbox`)
and dead methods (`goToPage`/`onPageSizeChange`/`rangeLabel`/`pageCount`). Density → control `size`
via a single unified `controlSize` computed: **`compact → xs`, `standard → sm`, `comfortable → md`**
(applies to paginator / input / select / checkbox; toolbar/menu chrome stays fixed `sm`). Library
`ng build` green; docs typecheck clean; no test regression. Verified live: all 3 densities map to
distinct control sizes (search input + paginator confirmed xs/sm/md).
**Nested-overlay risk RESOLVED:** verified pixel-select opens *inside* the pixel-menu filter popover
without closing it, and selecting an option applies + closes only the select (menuStillOpen=true).
**Kept bespoke (documented, no clean library fit):** sort header control (label+icon+priority),
drag/resize handles, group/detail expand toggles, group count pill (pixel-badge uses 99+ count
overflow), single-select radio (pixel-radio is group/options-oriented), date filter value (pixel-input
has no `date` type; pixel-datepicker would nest an overlay in the menu).

### Audit — hand-rolled element → pixel component
| # | Current (native) | Replace with | Notes / risk |
| - | --- | --- | --- |
| 1 | Quick search `<input type=search>` | **pixel-input** (`leadingIcon="search"`, `valueChange`) | density → `size` |
| 2 | Pager: page-size `<select>` + range + 4 nav `<button>` | **pixel-paginator** | `[length]="store.effectiveTotal()"`, `[(pageIndex)]`, `[(pageSize)]`, `(page)`; emit criteria |
| 3 | Selection header + row `<input type=checkbox>` | **pixel-checkbox** | keep **shift-click range** via `(click)` MouseEvent output; label-less, fit 44px cell |
| 4 | Single-select row `<input type=radio>` | **pixel-radio** | lower priority |
| 5 | Column-chooser `<input type=checkbox>` | **pixel-checkbox** | inside `pixel-menu` |
| 6 | Export "Only selected" `<input type=checkbox>` | **pixel-checkbox** | inside `pixel-menu` |
| 7 | Chooser "Reset columns" `<button>` | **pixel-button** (text) | |
| 8 | Filter operator `<select>` | **pixel-select** | ⚠ nested overlay inside `pixel-menu` — verify stacking/close |
| 9 | Filter value `<select>` / `<input>` | **pixel-select** / **pixel-input** | text/number/date = pixel-input (no overlay) |
| 10 | Filter clear `<button>` | **pixel-button** (text) | |
| 11 | Filter trigger icon `<button>` | **pixel-button** (icon-only, `ariaLabel`) | stays a `pixelMenuTriggerFor` |
| 12 | Column kebab icon `<button>` | **pixel-button** (icon-only) | stays a `pixelMenuTriggerFor` |
| 13 | Loading spinner `<span>` | **pixel-loader** (`type="spinner"`) | |
| 14 | Group count pill `<span>` | **pixel-badge** | |

### Keep bespoke (no library equivalent — grid-structural, documented)
Sort header control (label + sort icon + multi-sort priority), drag-reorder handle, resize handle,
group expand toggle, master-detail expand toggle. (Handle `title` tooltips may move to
**pixel-tooltip** as an optional nicety.)

### Sub-steps (each: `ng build` + `ng test` green + live verify, then delete now-dead SCSS)
- **5.5a Pager → pixel-paginator** (largest, isolated). Verify page math, server-side total, criteria.
- **5.5b Checkboxes + search → pixel-checkbox / pixel-input** (selection incl. shift-range, chooser,
  export scope, quick search). Verify select-all/indeterminate/range.
- **5.5c Filter popover → pixel-select / pixel-input / pixel-button**. Verify nested-overlay behavior
  (fallback: keep native `<select>` for operator if overlay nesting misbehaves).
- **5.5d Icon buttons + bits → pixel-button / pixel-badge / pixel-loader / pixel-radio**.
- **5.5e SCSS cleanup**: remove dead styles (`__search-input`, `__filter-control`, `__page-*`,
  `__checkbox/__radio`, `__spinner`, `__group-count`, …); final visual pass; re-check density sizing.

### Cross-cutting
- Map grid `density` → component `size` (compact→`sm`/`xs`, standard→`md`) so embedded controls match
  row height (esp. selection checkbox in the 44px column and the paginator).
- No behavioral/API change to the grid's own public surface.

## Phase 6 — Inline editing & accessibility  ✅ DONE (2026-06-25)
**Shipped & verified live:** **inline cell editing** — `editable` grid switch + per-column
`editable`; built-in `text`/`number`/`date`/`select`/`checkbox` editors (pixel-input/select/checkbox
+ native date) + custom `pixelGridEditor` directive (commit/cancel in context); per-column
`validate(value,row)`; dbl-click or Enter/F2 to edit, Enter commits, Esc cancels; `cellEdit` event
(mutates row in place). **Keyboard nav** — roving tabindex over data cells, arrows + Home/End,
Enter/F2 to edit (non-virtual, non-grouped path). **ARIA** — `role=grid` + `aria-rowcount`/`colcount`,
`role=row` + `aria-rowindex`/`aria-selected`, `role=gridcell`/`columnheader` + `aria-colindex`.
New `pixel-data-grid-editor.directive.ts`; public API + README + meta updated; 1 docs example.
Library `ng build` green; docs typecheck clean; no test regression.
**Bug found & fixed during verification:** the Enter keydown committed then **bubbled to the grid
nav handler which re-opened the editor**; fixed by stopping propagation on Enter AND guarding
`onGridKeydown` to ignore keystrokes originating inside an editor/form control.
**Verified live:** dbl-click opens editor (value preloaded); Enter commits + updates cell + emits
`cellEdit`; empty title blocked with "Title is required"; Esc cancels; arrows move focus (0,0→2,1);
Enter edits focused (number) cell; `role=grid` + `aria-rowcount=9`/`colcount=4`, 32 editable
gridcells, roving tabindex. **Deferred:** advanced a11y (PageUp/Down, Ctrl+Home/End, live regions),
row-edit mode, tree data.

### Original scope notes
**Goal:** editable grid + full WCAG grid semantics.
- **Editing**: built-in editors (text/number/date/select/checkbox) + `pixelGridEditor` custom
  templates; cell- and row-edit modes; **validation** (validators / Reactive Forms), dirty tracking,
  commit/cancel, `cellEdit`/`rowEdit` outputs; optimistic vs deferred save hook.
- **Keyboard grid nav**: arrows, Home/End, PageUp/Down, Ctrl+Home/End, Enter/F2 edit, Esc cancel,
  Tab within row; roving tabindex / focus management.
- **A11y roles**: `role=grid/row/gridcell/columnheader`, `aria-rowcount/colcount/index`,
  `aria-selected`, `aria-expanded`, live-region announcements for sort/filter/edit.
- **Exit:** keyboard-operable, screen-reader-tested editable grid.

## Phase 7 — Polish, docs  ✅ DONE (2026-06-25, specs deferred per request)
**Goal:** ship-ready, `stable`.
**Shipped:** registry status promoted **`experimental` → `stable`**; meta summary + theming +
accessibility notes rewritten to reflect the full feature set; toolbar `flex-wrap` added so it wraps
on narrow viewports. README carries per-phase API tables across all phases. Library `ng build` green;
docs typecheck clean.
**Verified live:** **dark mode** flips correctly — grid reads ambient `--pixel-sys-*` tokens, so with
`[data-theme=enterprise-dark]` the surface (`#1a2332`), text (`#e2e8f3`), header (`#161d2b`), border,
and primary accent (`#a8c7fa`) all switch (no `theme-host` needed). **Responsive** at 375px: toolbar
wraps (no horizontal overflow), grid body scrolls horizontally, sticky header + pinned columns intact.
**Deferred:** comprehensive vitest specs (per request — only the Phase 0 spec exists; pure
store/util fns remain the easiest backfill), responsive *card* mode (the grid scrolls horizontally
instead), and the deferred features from earlier phases (tree data, advanced a11y, row-edit mode).

### Original scope
- README (full API), ~15–20 docs examples, meta API tables, accessibility panel entry.
- Theming review (all tokens, dark mode), **responsive / mobile card mode**, reduced-motion.
- Comprehensive vitest specs across store + utils + interactions; perf benchmark notes.
- **Exit:** all green; registry status promoted to `stable`.

---

## Phase 8 — Manage columns panel (post-launch enhancement)  ✅ DONE (2026-07-01)
**Goal:** a central place to pin / hide / reorder columns and save / restore / clear a layout,
instead of that being scattered across the per-column `⋮` menu, header drag handles, and a
visibility-only toolbar menu.
**Shipped:** the toolbar's "Columns" button now opens a `pixel-drawer` side panel
(`pixel-data-grid-columns-panel`) listing every chooser-eligible column with a visibility checkbox,
drag-to-reorder (vertical list, HTML5 DnD, reuses `store.reorderColumn`), and pin-left/right buttons
when `pinnableColumns` is set. The panel emits intents (`toggleVisibility` / `pinChange` / `reorder`)
rather than mutating the store directly, so the grid stays the single place that mutates state and
fires `stateChange` / `columnVisibilityChange`. New `layoutKey` input enables built-in `localStorage`
persistence for the panel's Save / Restore / Clear layout actions (`saveLayout()` / `restoreLayout()`
/ `clearLayout()`, `layoutSave` / `layoutRestore` / `layoutClear` outputs); the grid auto-restores a
saved layout on init when `layoutKey` is set. No store changes were needed — every mutation primitive
(`setColumnPinned`, `toggleColumnHidden`, `reorderColumn`, `resetColumns`, `columnStates()` /
`applyColumnStates()`) already existed from Phase 2.
**Verified:** `ng build` + `ng test` (13/13 pixel-data-grid specs, no regressions) green; live via
`ng serve docs` + Claude Preview on the `data-grid-columns` example (`layoutKey="demo-columns"`).

---

## Cross-cutting acceptance per phase
1. `ng build` and `ng test` pass. 2. New public surface exported from `public-api.ts`.
3. At least one docs example + meta updated. 4. README section updated. 5. Dark mode + reduced
motion honored. 6. No `@angular/cdk` usage.

---

## `pixel-table` removed (2026-07-02)

`pixel-table` (the lightweight table this grid was originally built "alongside," per the top of this
file) was removed at the user's request now that `pixel-data-grid` covers its use cases too — it's the
library's only table component going forward. Deleted `projects/pixel-ui/src/lib/pixel-table/`, its
docs registry meta + examples, and its `public-api.ts` exports. The comparisons to `pixel-table`
scattered through the phase log above are left as historical record of decisions made at the time, not
current state.
