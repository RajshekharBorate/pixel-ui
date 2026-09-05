# pixel-data-grid

An enterprise-grade data grid — the library's sole table component (the earlier lightweight
`pixel-table` was removed once this covered its use cases too). Handles everything from simple,
mostly-static tables up to full scale (virtualization), advanced columns (resize / reorder / pin),
grouping & aggregation, inline editing, and full keyboard-grid accessibility.

> **Status: stable.** All seven feature phases are complete (foundation, data operations, column
> tooling, selection & export, virtualization, grouping & aggregation, inline editing & a11y) plus a
> component-reuse refactor and a polish pass. The roadmap and per-phase detail live in
> [`PLAN.md`](./PLAN.md). Deferred: tree data, advanced keyboard a11y, row-edit mode, and a
> comprehensive spec suite.

## Architecture

`pixel-data-grid` follows the store-based pattern used by `pixel-query-builder`: a signal-backed
[`PixelDataGridStore`](./pixel-data-grid.store.ts) is provided by the host component and holds the
canonical column/data state plus the derived render projections. Pure helpers live in
[`pixel-data-grid.utils.ts`](./pixel-data-grid.utils.ts) and all public types in
[`pixel-data-grid.types.ts`](./pixel-data-grid.types.ts).

## Phase 0 — Foundation (available now)

- Token-driven rendering with `comfortable` / `standard` / `compact` density.
- Sticky header with a scrollable body viewport.
- Built-in cell renderers: `text`, `number`, `date`, `boolean`, plus per-column `valueFormatter`.
- Custom cell templates via the `pixelGridCell` directive.
- Empty, loading-overlay, and in-body skeleton row states.
- Zebra striping, row hover, and optional clickable rows (`rowClick` output).
- Full theming (light / dark / `prefers-color-scheme`) and reduced-motion support.

### Usage

```html
<pixel-data-grid [data]="rows()" [columns]="columns" [rowId]="rowIdFn" density="standard">
  <ng-template pixelGridCell="status" let-value="value">
    <pixel-chip>{{ value }}</pixel-chip>
  </ng-template>
</pixel-data-grid>
```

```ts
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

columns: PixelDataGridColumn<PersonRow>[] = [
  { field: 'name', header: 'Name', flex: 2, minWidth: 120, maxWidth: 320 },
  { field: 'age', header: 'Age', type: 'number', align: 'end', width: 80 },
  { field: 'active', header: 'Active', type: 'boolean' },
];
rowIdFn = (row: PersonRow) => row.id;
```

### Inputs (Phase 0)

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `readonly T[]` | `[]` | Row data. |
| `columns` | `PixelDataGridColumn<T>[]` | `[]` | Column definitions. |
| `rowId` | `(row, index) => string \| number` | index | Stable row identity. |
| `density` | `'comfortable' \| 'standard' \| 'compact'` | `'standard'` | Row density. |
| `stickyHeader` | `boolean` | `true` | Pin header while body scrolls. |
| `striped` | `boolean` | `false` | Zebra striping. |
| `hoverable` | `boolean` | `true` | Highlight row under pointer. |
| `clickableRows` | `boolean` | `false` | Pointer cursor + `rowClick`. |
| `loading` | `boolean` | `false` | Busy flag (also set during DataSource fetch). |
| `loadingMode` | `'loader' \| 'skeleton'` | `'skeleton'` | Spinner overlay vs in-body skeleton rows while loading. |
| `showSkeleton` | `boolean` | `false` | Force in-body skeleton rows regardless of loading (e.g. route shell). |
| `skeletonRows` | `number` | `0` | `0` = auto (pageSize / viewport / known rows / 10). Positive = fixed count. |
| `emptyMessage` | `string` | `'No records to display.'` | Empty-state text. |
| `caption` | `string` | `''` | Accessible caption. |

### Outputs (Phase 0)

| Output | Type | Description |
| --- | --- | --- |
| `rowClick` | `PixelDataGridRowClickEvent<T>` | Row activated while `clickableRows` is on. |

## Phase 1 — Data operations (available now)

- **Multi-column sort** — mark columns `sortable`; click cycles none → asc → desc, **shift-click**
  adds a column to the sort (priority badges shown). Two-way `[(sortModel)]`; `sortChange` output.
- **Per-column filters** — set `filter` on a column (`text` / `number` / `date` / `select` /
  `boolean`) for a header filter popover with type-aware operators. Two-way `[(filters)]`.
  Date filters use `pixel-datepicker` (equals / before / after); values are stored as
  `YYYY-MM-DD` for state serialization. There is no `between` operator yet, so
  `pixel-date-range-picker` is not used.
- **Quick search** — `searchable` shows a global search box across visible columns. `[(quickFilter)]`.
- **Pagination** — `[paginated]="true"` adds a footer with page-size select + range label.
  Two-way `[(pageIndex)]` / `[(pageSize)]`; `pageChange` output.
- **Server mode** — `serverSide` renders `data` verbatim, emits a unified `criteriaChange`
  (sort + page + search + filters), and uses `totalRecords` for paging.
- **DataSource** — bind `[dataSource]` (a `PixelDataGridDataSource<T>` whose `fetch(criteria)`
  returns rows + total as a value / `Promise` / `Observable`); the grid fetches on every criteria
  change and manages loading automatically. Default `loadingMode="skeleton"` keeps headers and
  column layout and fills the body with placeholder rows sized to `pageSize` (or the virtual
  viewport); use `loadingMode="loader"` for a spinner overlay on refetch.

```html
<!-- Client-side: sort + filter + search + paginate -->
<pixel-data-grid [data]="rows()" [columns]="columns" [rowId]="rowIdFn" searchable [paginated]="true" />

<!-- Server-side via a DataSource (optional: spinner overlay instead of default skeleton) -->
<pixel-data-grid
  [dataSource]="dataSource"
  [columns]="columns"
  [rowId]="rowIdFn"
  loadingMode="loader"
  searchable
  [paginated]="true"
/>
```

### Inputs (Phase 1)

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `searchable` | `boolean` | `false` | Global quick-search box. |
| `multiSort` | `boolean` | `true` | Allow shift-click multi-column sort. |
| `sortModel` | `PixelDataGridSortDescriptor[]` | `[]` | Two-way multi-column sort model. |
| `filters` | `PixelDataGridFilterState` | `{}` | Two-way per-column filter state. |
| `quickFilter` | `string` | `''` | Two-way global search text. |
| `paginated` | `boolean` | `false` | Pagination footer. |
| `pageIndex` / `pageSize` | `number` | `0` / `10` | Two-way page position. |
| `pageSizeOptions` | `number[]` | `[10,25,50,100]` | Page-size choices. |
| `serverSide` | `boolean` | `false` | Render verbatim + emit `criteriaChange`. |
| `totalRecords` | `number \| null` | `null` | Total count for server paging. |
| `dataSource` | `PixelDataGridDataSource<T> \| null` | `null` | Pluggable source; fetch on criteria change. |

### Outputs (Phase 1)

| Output | Type | Description |
| --- | --- | --- |
| `sortChange` | `PixelDataGridSortEvent` | Sort model changed. |
| `pageChange` | `PixelDataGridPageEvent` | Page index or size changed. |
| `criteriaChange` | `PixelDataGridCriteria` | Sort, filter, search, or page changed. |

## Phase 2 — Column power features (available now)

- **Resize** — `resizableColumns` adds drag handles on each column's trailing edge (a column can opt
  out with `resizable: false`, set a floor with `minWidth`). By default each handle shows a vertical
  hairline (`showResizeLine`, default `true`; set `false` to hide the idle cue — hover/drag still
  highlight). Double-click a handle to reset to auto.
- **Reorder** — `reorderableColumns` shows a drag handle; drag a header to reposition it
  (native drag-and-drop, with a drop indicator).
- **Pin / freeze** — `pinnableColumns` adds Pin left / Pin right / Unpin to each column's header
  menu; set `pinned: 'left' | 'right'` for an initial freeze. Pinned headers show a filled
  **push_pin** icon button (same compact style as the filter control) that unpins on click; tooltip
  notes left vs right. Pinned columns stay sticky; column separators use the header resize hairline only.
- **Header control order** (inline-start → inline-end, only when each feature applies): drag handle →
  label / sort → unpin (pin) → filter → column ⋮ menu → resize handle (on the cell edge).
- **Manage columns panel** — `columnChooser` adds a toolbar button that opens a `pixel-drawer` side
  panel listing every chooser-eligible column (respecting `lockVisible`), each with a visibility
  toggle, drag handle (reorder), and — when `pinnableColumns` is also set — pin-left / pin-right
  buttons. Save / Restore / Clear layout sit in the drawer's `pixelDrawerFooter` (pinned while the
  column list scrolls). The panel is a single central place for pin / hide / reorder plus layout
  persistence, instead of hunting across the per-column menu and header drag handles.
- **Header menu** — per-column `⋮` menu with sort, pin, and hide actions (unchanged, still available
  alongside the panel for quick single-column actions).
- **View-state persistence** — `getState()` / `setState()` (and `getStateJson()` /
  `setStateFromJson()`) capture column order, widths, visibility, pinning, sort, filters, search,
  and page. `stateChange` fires on any column-layout change; `resetColumns()` clears overrides.
- **Built-in layout persistence** — set `layoutKey` to a namespaced string and the panel's Save /
  Restore / Clear layout buttons (backed by `saveLayout()` / `restoreLayout()` / `clearLayout()`)
  read and write that key in `localStorage` automatically. **The grid restores a saved layout on
  init when `layoutKey` is set.** `layoutSave` / `layoutRestore` / `layoutClear` outputs mirror the
  underlying JSON payload so a host can persist elsewhere (a server, IndexedDB, …) instead.

```html
<pixel-data-grid
  [data]="rows()" [columns]="columns" [rowId]="rowIdFn"
  resizableColumns reorderableColumns pinnableColumns columnChooser
  layoutKey="employees-grid"
  (stateChange)="persist($event)"
/>
```

```ts
// columns can declare an initial freeze + lock out of the chooser
columns = [
  { field: 'name', header: 'Name', pinned: 'left', lockVisible: true, width: 224 },
  // …
  { field: 'actions', header: '', pinned: 'right' },
];

// manual persistence still works without `layoutKey` — grid emits, you store it
const json = grid.getStateJson();   // → store it (localStorage, profile API, …)
grid.setStateFromJson(json);        // ← reapply later
```

### Inputs (Phase 2)

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `resizableColumns` | `boolean` | `false` | Drag-resize handles. |
| `showResizeLine` | `boolean` | `true` | Persistent hairline on resize handles when `resizableColumns` is on. |
| `defaultColumnMinWidth` | `number` | `120` | Readable floor when `column.minWidth` is omitted (`max(floor, headerEstimate)`). |
| `reorderableColumns` | `boolean` | `false` | Drag headers to reorder. |
| `pinnableColumns` | `boolean` | `false` | Pin left/right via header menu + the panel. |
| `columnChooser` | `boolean` | `false` | Toolbar button opening the "Manage columns" panel. |
| `layoutKey` | `string \| null` | `null` | Enables built-in `localStorage` persistence + auto-restore on init. |

Column config also gains `resizable`, `minWidth`, and `pinned`.

### Outputs & methods (Phase 2)

| Member | Type | Description |
| --- | --- | --- |
| `columnVisibilityChange` | `output<string[]>` | Visible fields changed. |
| `stateChange` | `output<PixelDataGridState>` | Column layout changed. |
| `layoutSave` / `layoutRestore` | `output<string>` | Save/restore ran; emits the JSON payload. |
| `layoutClear` | `output<void>` | Clear layout ran. |
| `getState()` / `setState(s)` | method | Read / apply the full view-state snapshot. |
| `getStateJson()` / `setStateFromJson(j)` | method | JSON round-trip of the view state. |
| `resetColumns()` | method | Clear order / width / visibility / pin overrides. |
| `saveLayout()` | method | Serialize state; persist to `localStorage` if `layoutKey` is set. |
| `restoreLayout()` | method | Reapply the layout saved under `layoutKey`. Returns `false` if none. |
| `clearLayout()` | method | `resetColumns()` + remove the persisted `layoutKey` entry, if any. |

## Phase 3 — Selection & export (available now)

- **Selection** — `selectionMode="single" | "multiple"`. Multiple adds a sticky checkbox column with
  a header **select-all** (current page), an indeterminate state, and **shift-click range** select.
  Selection cells stay real table-cells (continuous row borders) and center the control via an inner
  `.pixel-data-grid__select-control` wrapper; selection checkboxes use `size="md"` and
  `[fullWidth]="false"` so mobile form stretch does not apply.
  Two-way `[(selectedRows)]` (keyed by `rowId` so it survives paging/sort/filter); `selectionChange`
  output. When a whole page is selected and more rows exist, a banner offers **Select all N rows**.
- **Export** — `exportable` adds a toolbar menu for **CSV / JSON / Excel** (real `.xlsx` via
  shared `PixelExportService`, no SheetJS) / **clipboard** (TSV). Serialization and local
  download go through **`PixelExportService`** (`services/export`). Exports respect column order,
  visibility, and `exportable: false` on columns. Date columns use Excel-safe formatting
  (`YYYY-MM-DD` / Excel text in CSV so Excel does not show `######`). When rows are selected, an
  **Only selected** toggle scopes the export. Programmatic `exportData(format, scope?)` supports
  `'all' | 'selected' | 'page'`; **export-all** fetches every row from a bound `[dataSource]` first.
  For URL/backend file transfers use File Transfer — not this menu.
- **Navigate / revealRow** — `revealRow(rowId, { page?, select?, highlightMs? })` pages (client
  mode), optionally selects, scrolls the row into view, and applies
  `.pixel-nav-highlight-row` (soft fill) plus navigate's fixed overlay ring. Rows expose
  `data-pixel-row-id`. Register the grid with
  `PixelNavigateService.registerGrid(id, { revealRow: … })` for `grid-row` deep links. Server-paged
  grids should pass `page` when the app already knows it.

```html
<pixel-data-grid
  [data]="rows()" [columns]="columns" [rowId]="rowIdFn"
  selectionMode="multiple" [(selectedRows)]="selected"
  exportable exportFileName="invoices"
/>
```

### Inputs / outputs (Phase 3)

| Member | Type | Default | Description |
| --- | --- | --- | --- |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | Row selection mode. |
| `selectedRows` | `T[]` (two-way) | `[]` | Selected rows (by `rowId`). |
| `exportable` | `boolean` | `false` | Toolbar export menu. |
| `exportFileName` | `string` | `'grid-export'` | Base download name. |
| `exportFormats` | `PixelDataGridExportFormat[]` | all | Formats offered. |
| `selectionChange` | `output<T[]>` | — | Selection changed. |
| `exportData(format, scope?)` / `clearSelection()` / `revealRow(rowId, options?)` | method | — | Programmatic export / clear / deep-link reveal (page + scroll + highlight). |

Column config also gains `exportable?: boolean`.

## Phase 4 — Virtualization & scale (available now)

- **Row virtualization** — `virtualScroll` renders only the visible window of rows (fixed-height
  windowing via spacer rows), so 10k–100k+ rows stay smooth. It **composes with the sticky header
  and pinned columns** and keeps full-set sorting/filtering. `virtualHeight` sets the viewport
  height (and seeds the first paint before the scrollport is measured); `rowHeight` overrides the
  per-density row-height estimate; `virtualOverscan` tunes the buffer. Virtualization bypasses
  pagination.
- **Infinite scroll** — `infiniteScroll` emits `loadMore` as the user nears the bottom (gated by
  `hasMore`), for incremental / server-driven loading. The in-flight guard clears when `data`
  changes.

```html
<pixel-data-grid
  [data]="rows()" [columns]="columns" [rowId]="rowIdFn"
  virtualScroll [virtualHeight]="480"
/>

<!-- incremental loading -->
<pixel-data-grid
  [data]="rows()" [columns]="columns" [rowId]="rowIdFn"
  virtualScroll infiniteScroll [hasMore]="hasMore()" (loadMore)="fetchNextPage()"
/>
```

### Inputs / output (Phase 4)

| Member | Type | Default | Description |
| --- | --- | --- | --- |
| `virtualScroll` | `boolean` | `false` | Fixed-height row windowing. |
| `rowHeight` | `number` | `0` | Row height px (0 = from density). |
| `virtualHeight` | `number` | `480` | Viewport height px. |
| `virtualOverscan` | `number` | `8` | Buffer rows above/below. |
| `infiniteScroll` | `boolean` | `false` | Emit `loadMore` near bottom. |
| `hasMore` | `boolean` | `true` | Gates `loadMore`. |
| `loadMore` | `output<void>` | — | Near-bottom scroll. |

> Virtualization assumes a **uniform row height**. Set `rowHeight` if your rows differ from the
> density default.

## Phase 5 — Grouping & aggregation (available now)

- **Row grouping** — `[groupBy]="['region', 'product']"` groups rows by one or more fields with
  collapsible headers (indented per level), row counts, and toolbar **Expand all / Collapse all**.
- **Aggregation** — give a column an `aggregate` (`'sum' | 'avg' | 'min' | 'max' | 'count'`, or a
  `(rows) => unknown` reducer). Aggregates appear per-column in each group header and in a sticky
  **grand-total footer** over the full filtered set. The footer uses an opaque
  `--pixel-data-grid-foot-bg` (same surface as group header rows) so body rows do not show through
  while scrolling; sticky cells seal flush to the scrollport bottom. The **Total** label matches
  aggregate cells (`font-weight: 600`).
- **Master-detail** — `expandableRows` adds a toggle column; project a `pixelGridDetail` template
  to render an expandable detail panel beneath each row.

```html
<!-- grouping + aggregation -->
<pixel-data-grid [data]="rows()" [columns]="columns" [groupBy]="['region', 'product']" />

<!-- master-detail -->
<pixel-data-grid [data]="rows()" [columns]="columns" expandableRows>
  <ng-template pixelGridDetail let-row>
    <div class="detail">{{ row.description }}</div>
  </ng-template>
</pixel-data-grid>
```

```ts
columns = [
  { field: 'region', header: 'Region' },
  { field: 'units', header: 'Units', type: 'number', align: 'end', aggregate: 'sum' },
  { field: 'price', header: 'Avg price', type: 'number', align: 'end', aggregate: 'avg' },
];
```

### Inputs / methods (Phase 5)

| Member | Type | Default | Description |
| --- | --- | --- | --- |
| `groupBy` | `string[]` | `[]` | Fields to group by (collapsible, aggregated). |
| `expandableRows` | `boolean` | `false` | Master-detail toggle + `pixelGridDetail`. |
| `expandAllGroups()` / `collapseAllGroups()` | method | — | Programmatic group expand/collapse. |

Column config also gains `aggregate`. Grouping/master-detail use the non-virtualized render path;
they are not combined with `virtualScroll` (tree data is not yet implemented).

## Phase 6 — Inline editing & accessibility (available now)

- **Inline editing** — `editable` (grid) + `editable: true` (column) turns on cell editing. Built-in
  editors `text` / `number` / `date` / `select` / `checkbox` (via `editor`, with `editorOptions` for
  selects), or a custom `pixelGridEditor` template. The date editor uses `pixel-datepicker` and
  commits a `Date | null`. **Double-click** a cell, or focus it and press
  **Enter / F2**; **Enter** commits, **Esc** cancels. Per-column `validate(value, row)` blocks an
  invalid commit: built-in text/number editors and checkboxes use `errorOverride`, selects use
  `state="error"`, and date editors use `errorText` so each control shows its normal red border +
  ring; the message is a tooltip on the editor plus an assertive live region (no under-field error
  line, so locked row height stays stable). `cellEdit`
  emits `{ row, field, rowIndex, oldValue, newValue }`.
- **Keyboard navigation** — arrow keys move a roving-tabindex cell focus; **Home/End** jump to the
  row's first/last column; **Enter/F2** edits the focused cell. (Active on the non-virtualized,
  non-grouped data path.)
- **ARIA** — `role="grid"` with `aria-rowcount` / `aria-colcount`, `role="row"` + `aria-rowindex` +
  `aria-selected`, and `role="gridcell"` / `role="columnheader"` + `aria-colindex`.

```html
<pixel-data-grid [data]="rows()" [columns]="columns" editable (cellEdit)="onEdit($event)">
  <!-- optional custom editor -->
  <ng-template pixelGridEditor="status" let-value let-commit="commit">
    <pixel-select [value]="value" [options]="opts" (valueChange)="commit($event)" />
  </ng-template>
</pixel-data-grid>
```

### Inputs / output (Phase 6)

| Member | Type | Default | Description |
| --- | --- | --- | --- |
| `editable` | `boolean` | `false` | Master switch for inline editing. |
| `cellEdit` | `output<PixelDataGridCellEditEvent<T>>` | — | A cell edit was committed. |

Column config gains `editable`, `editor`, `editorOptions`, and `validate`.

> Edits mutate the row object in place and emit `cellEdit`; persist from there. Advanced a11y
> (PageUp/Down, Ctrl+Home/End, live-region announcements) and row-edit mode are future work.

## Roadmap

See [`PLAN.md`](./PLAN.md). Upcoming: polish (Phase 7). Deferred: tree data (hierarchical rows),
advanced keyboard a11y, row-level editing.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-data-grid` (`PixelDataGridComponent`)

Enterprise data grid (work in progress — built phase by phase). Provide `data` and `columns`; render rich cells with `<ng-template pixelGridCell="field">`. Phase 0 established the store-driven foundation; Phase 1 adds the data pipeline: multi-column sort (shift-click), per-column filters, a global quick search, and pagination — client-side by default, or server-driven via `serverSide` + `criteriaChange`, or fully managed via a `[dataSource]`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `readonly T[]` | `[]` | Row data (ignored when a `dataSource` is bound). |
| `columns` | `readonly PixelDataGridColumn<T>[]` | `[]` | Column definitions. |
| `rowId` | `PixelDataGridRowId<T>` | `(_row, index) => index` | Stable row identity for tracking (and future selection). Defaults to the row index. |
| `labels` | `Partial<PixelDataGridLabels>` | `{}` | Merged with `DEFAULT_PIXEL_DATA_GRID_LABELS`. Use `{n}`, `{total}`, `{col}` placeholders (see `formatLabel`). Does not replace `emptyMessage`. |
| `dateLocale` | `string | undefined` | `undefined` | Precedence: this input → `PIXEL_DATE_LOCALE` → browser Intl. Display uses the same formatter as datepicker; export still emits canonical `YYYY-MM-DD`. |
| `density` | `PixelDataGridDensity` | `'standard'` |  |
| `stickyHeader` | `boolean` | `true` |  |
| `striped` | `boolean` | `false` |  |
| `hoverable` | `boolean` | `true` |  |
| `clickableRows` | `boolean` | `false` |  |
| `loading` | `boolean` | `false` | Combined with `loadingMode` to choose spinner overlay vs in-body skeleton rows. |
| `loadingMode` | `PixelDataGridLoadingMode` | `'skeleton'` | `skeleton` keeps headers, column widths, and pins and fills the body with placeholder rows auto-sized to the upcoming layout (same as `showSkeleton`); `loader` keeps existing rows and shows a centered spinner overlay. Applies to both the `loading` input and DataSource fetches. |
| `showSkeleton` | `boolean` | `false` | Useful for route-level first paint before any fetch starts. While loading, prefer `loadingMode="skeleton"` so DataSource fetches pick it up automatically. |
| `skeletonRows` | `number` | `0` | `0` (default) auto-sizes: `pageSize` when paginated, visible viewport rows when virtual, otherwise the current row count or 10. A positive value forces that many rows. |
| `emptyMessage` | `string` | `'No records to display.'` |  |
| `caption` | `string` | `''` |  |
| `searchable` | `boolean` | `false` | Shows a global quick-filter search box above the grid. |
| `searchPlaceholder` | `string` | `'Search…'` |  |
| `analyticsId` | `string` | `''` | Stable analytics id for this grid (e.g. `claims-inbox`). When `PIXEL_UI_ANALYTICS` is provided, sort / filter / export emit `data.table.*` events with this id. |
| `columnChooser` | `boolean` | `false` | Shows a toolbar button that opens the "Manage columns" panel (pin/hide/reorder + layout). |
| `layoutKey` | `string | null` | `null` | Namespaced key enabling built-in `localStorage` persistence for the panel's Save/Restore/Clear layout actions. When set, the grid also restores the saved layout automatically on init. |
| `resizableColumns` | `boolean` | `false` | Enables drag-resize handles (a column can opt out with `resizable: false`). |
| `showResizeLine` | `boolean` | `true` | When `resizableColumns` is on, paints a thin divider-token cue on every handle so resize is discoverable. Set `false` to hide the idle line (hover/drag still highlight). |
| `defaultColumnMinWidth` | `number` | `MIN_LAYOUT_COLUMN_PX` | Applied as `max(defaultColumnMinWidth, headerContentEstimate)` for layout and resize. Explicit `column.minWidth` still wins (including values below this floor). Not a mobile-only switch — raises the shared readable minimum for all viewports. |
| `reorderableColumns` | `boolean` | `false` | Enables drag-to-reorder of column headers. |
| `pinnableColumns` | `boolean` | `false` | Enables pin-left / pin-right actions in the per-column header menu. |
| `cellTooltipWhenTruncated` | `boolean` | `true` | Uses `pixelTooltipShowOnOverflow` on built-in formatted cells only; custom `pixelGridCell` templates opt in manually. |
| `selectionMode` | `PixelDataGridSelectionMode` | `'none'` | Row selection mode. `multiple` adds a checkbox column with select-all + shift-range. |
| `exportable` | `boolean` | `false` | Shows the toolbar export menu (CSV / JSON / Excel / clipboard). |
| `exportAccess` | `string` | `''` | When set, export toolbar and `exportData` require this permission via `PixelAuthorizationService`. Empty → no auth gate. |
| `exportFileName` | `string` | `'grid-export'` | Base file name for downloads (without extension). |
| `exportFormats` | `PixelDataGridExportFormat[]` | `['csv', 'json', 'excel', 'clipboard']` | Formats offered in the export menu. |
| `multiSort` | `boolean` | `true` | Allows shift-click to build a multi-column sort. When false, sorting is single-column. |
| `paginated` | `boolean` | `false` |  |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` |  |
| `serverSide` | `boolean` | `false` | Defer sorting/filtering/paging to the parent and render `data` verbatim. |
| `totalRecords` | `number | null` | `null` | Total record count for server-side paging. Defaults to the filtered client count. |
| `dataSource` | `PixelDataGridDataSource<T> | null` | `null` | A pluggable data source. When bound, the grid fetches on every criteria change. |
| `virtualScroll` | `boolean` | `false` | Render only the visible rows (fixed-height windowing). Bypasses pagination. |
| `rowHeight` | `number` | `0` | Fixed row height in px for virtualization. `0` derives it from density. |
| `virtualHeight` | `number` | `480` | Viewport height in px when virtual scrolling. |
| `virtualOverscan` | `number` | `8` | Extra rows rendered above/below the viewport to smooth fast scrolling. |
| `infiniteScroll` | `boolean` | `false` | Emit `loadMore` as the user nears the bottom (for incremental / server paging). |
| `hasMore` | `boolean` | `true` | Whether more rows are available to load (gates `loadMore`). |
| `groupBy` | `string[]` | `[]` | Fields to group rows by, in order. Group headers are collapsible; columns can aggregate. |
| `expandableRows` | `boolean` | `false` | Enables a master-detail toggle column that expands the `pixelGridDetail` template per row. |
| `editable` | `boolean` | `false` | Master switch for inline cell editing (a column must also set `editable: true`). |
| `rowQuickActions` | `readonly PixelDataGridRowQuickAction<T>[]` | `[]` | When non-empty (and no `pixelGridRowActions` template), the first `rowQuickActionsMaxVisible` icons render in the pill; the rest go in a ⋮ menu. On coarse pointers (touch), the pill reveals for the tapped row only (sticky until another row is tapped or a tap outside clears it). Ignored when a row-actions template is projected. |
| `rowQuickActionsMaxVisible` | `number` | `3` |  |
| `rowQuickActionsMode` | `PixelDataGridRowQuickActionsMode` | `'hover-focus'` | On coarse pointers, `hover` / `hover-focus` use tap-to-reveal (sticky row ownership) instead of always-visible. Only `always` shows every row's pill at once. |

**Two-way (model)**

| Model | Type | Default | Description |
| --- | --- | --- | --- |
| `selectedRows` | `T[]` | `[]` | Two-way selected rows (by reference / `rowId`). |
| `sortModel` | `readonly PixelDataGridSortDescriptor[]` | `[]` | Two-way multi-column sort model (priority order). |
| `filters` | `PixelDataGridFilterState` | `{}` | Two-way per-column filter state (field → { operator, value }). |
| `quickFilter` | `string` | `''` | Two-way global quick-filter text. |
| `pageIndex` | `number` | `0` |  |
| `pageSize` | `number` | `10` |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `rowClick` | `PixelDataGridRowClickEvent<T>` |  |
| `rowQuickAction` | `PixelDataGridRowQuickActionEvent<T>` |  |
| `sortChange` | `PixelDataGridSortEvent` |  |
| `pageChange` | `PixelDataGridPageEvent` |  |
| `criteriaChange` | `PixelDataGridCriteria` | Unified criteria (sort + page + quick filter + filters) for server-side data sources. |
| `columnVisibilityChange` | `string[]` | Emits the visible column fields whenever column visibility changes. |
| `stateChange` | `PixelDataGridState` | Emits the full view-state snapshot whenever column layout (order/width/visibility/pin) changes. |
| `selectionChange` | `T[]` | Emits the selected rows whenever the selection changes. |
| `loadMore` | `void` | Emits when the user scrolls near the bottom and `infiniteScroll` + `hasMore` are set. |
| `cellEdit` | `PixelDataGridCellEditEvent<T>` | Emits when an inline cell edit is committed. |
| `layoutSave` | `string` | Emits the saved JSON payload whenever `saveLayout()` runs. |
| `layoutRestore` | `string` | Emits the restored JSON payload whenever `restoreLayout()` succeeds. |
| `layoutClear` | `void` | Emits whenever `clearLayout()` runs. |

### Directive `[pixelGridCellOverflow]` (`PixelDataGridCellOverflowDirective`)

Ellipsis + overflow tooltip helper for custom `pixelGridCell` templates. Applies `.pixel-data-grid__cell-value` and composes `PixelTooltipDirective` with `pixelTooltipShowOnOverflow`. Tooltip text defaults to the host's trimmed text when `pixelGridCellOverflow` is empty. Disable via `pixelGridCellOverflowDisabled` or the grid's `cellTooltipWhenTruncated` input (bind `[pixelGridCellOverflowDisabled]="!overflowTooltip"` from the cell context).

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `tooltip` | `string` | `''` | Tooltip message. When empty, the host's own trimmed text is used. |
| `showOnOverflow` | `boolean` | `true` | Forwards to `pixelTooltipShowOnOverflow` (enabled by default). |
| `disabled` | `boolean` | `false` | Suppresses the overflow tooltip. Bind `!overflowTooltip` from the cell context to honor the grid's `cellTooltipWhenTruncated` setting. |

### Directive `[pixelGridCellRow]` (`PixelDataGridCellRowDirective`)

Flex row wrapper for composite custom cells (avatar + label, icon + text). Pair with `PixelDataGridCellOverflowDirective` on the truncating text leaf.

### Directive `[pixelGridCell]` (`PixelDataGridCellDirective`)

Declares a custom cell renderer for a column. Place on an `<ng-template>` whose value matches the column `field`.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `field` | `string` | *required* | The column `field` this template renders. |

### Directive `[pixelGridDetail]` (`PixelDataGridDetailDirective`)

Declares the master-detail content rendered beneath an expanded row. Place on an `<ng-template>`; enable with `expandableRows` on the grid.

### Directive `[pixelGridEditor]` (`PixelDataGridEditorDirective`)

Declares a custom inline cell editor for a column. Place on an `<ng-template>` whose value matches the column `field`; enable editing with `editable` on the grid and the column.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `field` | `string` | *required* | The column `field` this editor renders. |

### Directive `[pixelGridRowActions]` (`PixelDataGridRowActionsDirective`)

Projects custom content into the floating row quick-actions pill. When present, replaces the declarative `rowQuickActions` renderer for that grid.

### Service `PixelDataGridStore`

Signal-backed view store for `pixel-data-grid`. Provided by the host component and injected by (future) recursive child components. The host owns the user-facing two-way models and mirrors them into the store; the store derives the render projection through a single filter → sort → paginate pipeline and owns the column view state (order / width / visibility / pinning) for Phase 2 column tooling.

| Method | Signature | Description |
| --- | --- | --- |
| `isColumnHidden` | `isColumnHidden(column: PixelDataGridColumn<T>): boolean` |  |
| `columnPin` | `columnPin(column: PixelDataGridColumn<T>): PixelDataGridPinSide | null` |  |
| `columnWidthPx` | `columnWidthPx(column: PixelDataGridColumn<T>): number | null` | Explicit width in px (resized or fixed config width), or `null` for auto/flexible. |
| `columnEffectiveWidthPx` | `columnEffectiveWidthPx(column: PixelDataGridColumn<T>): number` | Width in px to use for sticky-offset math (falls back to a default for unsized columns). |
| `setResolvedLayoutWidths` | `setResolvedLayoutWidths(widths: Readonly<Record<string, number>> | null): void` | Updates viewport-layout resolved widths used for render + pin offsets. |
| `currentOrder` | `currentOrder(): string[]` | Field order to operate on: the override order (reconciled with config) or the config order. |
| `toggleGroup` | `toggleGroup(key: string): void` |  |
| `expandAllGroups` | `expandAllGroups(): void` |  |
| `collapseAllGroups` | `collapseAllGroups(): void` |  |
| `toggleDetail` | `toggleDetail(key: string | number): void` |  |
| `isDetailExpanded` | `isDetailExpanded(key: string | number): boolean` |  |
| `keyFor` | `keyFor(row: T, index: number): string | number` |  |
| `sortDescriptorFor` | `sortDescriptorFor(field: string): PixelDataGridSortDescriptor | undefined` |  |
| `sortPriorityFor` | `sortPriorityFor(field: string): number` |  |
| `setColumnWidth` | `setColumnWidth(field: string, width: number, minWidth = MIN_COLUMN_WIDTH, maxWidth?: number): void` |  |
| `resetColumnWidth` | `resetColumnWidth(field: string): void` |  |
| `reorderColumn` | `reorderColumn(field: string, targetField: string, placeAfter: boolean): void` | Moves `field` to before/after `targetField` in the column order. |
| `setColumnHidden` | `setColumnHidden(field: string, hidden: boolean): void` |  |
| `toggleColumnHidden` | `toggleColumnHidden(column: PixelDataGridColumn<T>): void` |  |
| `setColumnPinned` | `setColumnPinned(field: string, side: PixelDataGridPinSide | null): void` |  |
| `resetColumns` | `resetColumns(): void` | Clears all column overrides (order, widths, visibility, pinning). |
| `columnStates` | `columnStates(): PixelDataGridColumnState[]` | Builds the column-state list in display order. |
| `applyColumnStates` | `applyColumnStates(states: readonly PixelDataGridColumnState[]): void` | Applies a column-state list (order + width + visibility + pinning overrides). |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelDataGridRow` | `Record<string, unknown>` |
| `PixelDataGridAlign` | `'start' | 'center' | 'end'` |
| `PixelDataGridColumnOverflow` | `'ellipsis' | 'clip'` |
| `PixelDataGridDensity` | `'comfortable' | 'standard' | 'compact'` |
| `PixelDataGridLoadingMode` | `'loader' | 'skeleton'` |
| `PixelDataGridColumnType` | `'text' | 'number' | 'date' | 'boolean'` |
| `PixelDataGridRowId` | `(row: T, index: number) => string | number` |
| `PixelDataGridValueFormatter` | `(value: unknown, row: T) => string` |
| `PixelDataGridEditorType` | `'text' | 'number' | 'date' | 'select' | 'checkbox'` |
| `PixelDataGridAggregatorName` | `'sum' | 'avg' | 'min' | 'max' | 'count'` |
| `PixelDataGridAggregator` | `| PixelDataGridAggregatorName | ((rows: readonly T[]) => unknown)` |
| `PixelDataGridRenderRow` | `| PixelDataGridGroupRow | PixelDataGridDataRow<T> | PixelDataGridDetailRow<T>` |
| `PixelDataGridPinSide` | `'left' | 'right'` |
| `PixelDataGridRowQuickActionsMode` | `'hover' | 'hover-focus' | 'always'` |
| `PixelDataGridSelectionMode` | `'none' | 'single' | 'multiple'` |
| `PixelDataGridExportFormat` | `'csv' | 'json' | 'excel' | 'clipboard'` |
| `PixelDataGridExportScope` | `'all' | 'selected' | 'page'` |
| `PixelDataGridSortDirection` | `'asc' | 'desc' | null` |
| `PixelDataGridFilterType` | `'text' | 'number' | 'date' | 'select' | 'boolean'` |
| `PixelDataGridFilterOperator` | `| 'contains' | 'equals' | 'notEquals' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'before' | 'after' | 'empty' | 'notEmpty'` |
| `PixelDataGridFilterState` | `Record<string, PixelDataGridFilterValue>` |

### Exported interfaces

**`PixelDataGridCellContext`** — Context exposed to a custom cell template: `$implicit` = row, `value` = the cell value, `index` = row index, `field` = column field.

```ts
interface PixelDataGridCellContext {
  $implicit: T;
  value: unknown;
  index: number;
  field: string;
  overflowTooltip: boolean;
}
```

**`PixelDataGridDetailContext`** — Context for a master-detail template: `$implicit` = row, `index` = absolute row index.

```ts
interface PixelDataGridDetailContext {
  $implicit: T;
  index: number;
}
```

**`PixelDataGridEditorContext`** — Context for a custom inline editor template: `$implicit` = current draft value, `row` = the row, `field` = column field, plus `commit(value?)` and `cancel()` callbacks to end the edit.

```ts
interface PixelDataGridEditorContext {
  $implicit: unknown;
  row: T;
  field: string;
  rowIndex: number;
  commit: (value?: unknown) => void;
  cancel: () => void;
}
```

**`PixelDataGridRowActionsContext`** — Context for a projected row quick-actions template: `$implicit` = row, `index` = absolute row index.

```ts
interface PixelDataGridRowActionsContext {
  $implicit: T;
  index: number;
}
```

**`PixelDataGridColumn`** — Column definition for `pixel-data-grid`.

```ts
interface PixelDataGridColumn {
  field: keyof T & string;
  header?: string;
  align?: PixelDataGridAlign;
  width?: number;
  flex?: number;
  maxWidth?: number;
  overflow?: PixelDataGridColumnOverflow;
  type?: PixelDataGridColumnType;
  hidden?: boolean;
  lockVisible?: boolean;
  description?: string;
  valueFormatter?: PixelDataGridValueFormatter<T>;
  sortable?: boolean;
  filter?: PixelDataGridColumnFilter;
  resizable?: boolean;
  minWidth?: number;
  pinned?: PixelDataGridPinSide;
  exportable?: boolean;
  access?: string;
  aggregate?: PixelDataGridAggregator<T>;
  editable?: boolean;
  editor?: PixelDataGridEditorType;
  editorOptions?: readonly PixelDataGridFilterOption[];
  validate?: (value: unknown, row: T) => string | null;
}
```

**`PixelDataGridCellEditEvent`** — Emitted when an inline cell edit is committed.

```ts
interface PixelDataGridCellEditEvent {
  readonly row: T;
  readonly field: string;
  readonly rowIndex: number;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}
```

**`PixelDataGridGroupRow`** — A group header in the flattened render list.

```ts
interface PixelDataGridGroupRow {
  readonly kind: 'group';
  readonly key: string;
  readonly field: string;
  readonly value: unknown;
  readonly label: string;
  readonly level: number;
  readonly count: number;
  readonly aggregates: Record<string, unknown>;
  readonly expanded: boolean;
}
```

**`PixelDataGridDataRow`** — A data (leaf) row in the flattened render list.

```ts
interface PixelDataGridDataRow {
  readonly kind: 'data';
  readonly row: T;
  readonly index: number;
  readonly level: number;
}
```

**`PixelDataGridDetailRow`** — A master-detail content row in the flattened render list.

```ts
interface PixelDataGridDetailRow {
  readonly kind: 'detail';
  readonly row: T;
  readonly index: number;
}
```

**`PixelDataGridRowClickEvent`** — Emitted when a row is activated (click / keyboard) while `clickableRows` is enabled.

```ts
interface PixelDataGridRowClickEvent {
  readonly row: T;
  readonly index: number;
}
```

**`PixelDataGridRowQuickAction`** — Declarative action for the floating row quick-actions pill. Icon-only buttons require a non-empty `label` (maps to `aria-label` + tooltip).

```ts
interface PixelDataGridRowQuickAction {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly danger?: boolean;
  readonly disabled?: boolean | ((row: T) => boolean);
  readonly visible?: (row: T) => boolean;
  readonly access?: string | ((row: T) => string | undefined);
}
```

**`PixelDataGridRowQuickActionEvent`** — Emitted when a declarative row quick action is activated.

```ts
interface PixelDataGridRowQuickActionEvent {
  readonly actionId: string;
  readonly row: T;
  readonly index: number;
  readonly originalEvent: Event;
}
```

**`PixelDataGridSortDescriptor`** — A single column's contribution to the (multi-column) sort model, in priority order.

```ts
interface PixelDataGridSortDescriptor {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}
```

**`PixelDataGridSortEvent`** — Emitted when the sort model changes. The array is ordered by sort priority.

```ts
interface PixelDataGridSortEvent {
  readonly sort: readonly PixelDataGridSortDescriptor[];
}
```

**`PixelDataGridFilterOption`** — Option for a `select` column filter.

```ts
interface PixelDataGridFilterOption {
  readonly value: unknown;
  readonly label: string;
}
```

**`PixelDataGridColumnFilter`** — Per-column filter configuration.

```ts
interface PixelDataGridColumnFilter {
  readonly type: PixelDataGridFilterType;
  readonly operators?: readonly PixelDataGridFilterOperator[];
  readonly options?: readonly PixelDataGridFilterOption[];
  readonly placeholder?: string;
}
```

**`PixelDataGridFilterValue`** — Active filter value for a single column.

```ts
interface PixelDataGridFilterValue {
  readonly operator: PixelDataGridFilterOperator;
  readonly value: unknown;
}
```

**`PixelDataGridPageEvent`** — Emitted when the page index or size changes.

```ts
interface PixelDataGridPageEvent {
  readonly pageIndex: number;
  readonly pageSize: number;
}
```

**`PixelDataGridCriteria`** — Unified snapshot of sort + page + quick filter + column filters for server-side data sources.

```ts
interface PixelDataGridCriteria {
  readonly sort: readonly PixelDataGridSortDescriptor[];
  readonly page: PixelDataGridPageEvent;
  readonly quickFilter: string;
  readonly filters: PixelDataGridFilterState;
}
```

**`PixelDataGridFetchResult`** — Rows + total count returned by a `PixelDataGridDataSource` for a given criteria.

```ts
interface PixelDataGridFetchResult {
  readonly rows: readonly T[];
  readonly total: number;
}
```

**`PixelDataGridDataSource`** — A pluggable data source. `fetch` receives the current criteria (sort/page/filters) and returns a page of rows plus the total record count. It may return a synchronous result, a `Promise`, or an `Observable`. Bind it via `[dataSource]`; the grid switches to server-driven mode, calls `fetch` whenever criteria change, and manages loading automatically (`loadingMode` chooses spinner overlay vs auto-sized in-body skeleton rows).

```ts
interface PixelDataGridDataSource {
  fetch( criteria: PixelDataGridCriteria, ): | Observable<PixelDataGridFetchResult<T>> | Promise<PixelDataGridFetchResult<T>> | PixelDataGridFetchResult<T>;
}
```

**`PixelDataGridColumnState`** — Runtime view state for a single column.

```ts
interface PixelDataGridColumnState {
  readonly field: string;
  readonly width?: number;
  readonly hidden?: boolean;
  readonly pinned?: PixelDataGridPinSide | null;
}
```

**`PixelDataGridState`** — Portable snapshot of the grid's view state — column order/width/visibility/pinning plus the active sort, filters, quick search, and page. Round-trip via `getState()` / `setState()` or the JSON helpers to persist a user's layout.

```ts
interface PixelDataGridState {
  readonly columns: readonly PixelDataGridColumnState[];
  readonly sort: readonly PixelDataGridSortDescriptor[];
  readonly filters: PixelDataGridFilterState;
  readonly quickFilter: string;
  readonly page: PixelDataGridPageEvent;
}
```

**`PixelDataGridLabels`** — Overridable user-visible copy for `pixel-data-grid` chrome (toolbar, selection, column menu, columns panel, filters, export). Pass a partial via the `labels` input; placeholders use `{n}`, `{total}`, and `{col}` (see `formatLabel` in utils). Does not include `emptyMessage` — that remains a dedicated input.

```ts
interface PixelDataGridLabels {
  readonly columns: string;
  readonly manageColumns: string;
  readonly manageColumnsAria: string;
  readonly export: string;
  readonly exportDataAria: string;
  readonly exportAsCsv: string;
  readonly exportAsJson: string;
  readonly exportAsExcel: string;
  readonly copyToClipboard: string;
  readonly onlySelected: string;
  readonly expandAll: string;
  readonly expandAllAria: string;
  readonly collapseAll: string;
  readonly collapseAllAria: string;
  readonly allPageSelected: string;
  readonly selectAllRows: string;
  readonly selectRow: string;
  readonly selectAllPage: string;
  readonly select: string;
  readonly expand: string;
  readonly toggleRowDetails: string;
  readonly editValue: string;
  readonly dragToReorder: string;
  readonly dragToResize: string;
  readonly unpinColumn: string;
  readonly unpinPinnedLeft: string;
  readonly unpinPinnedRight: string;
  readonly filterColumn: string;
  readonly filterOperator: string;
  readonly filterValue: string;
  readonly filterClear: string;
  readonly filterAny: string;
  readonly columnOptions: string;
  readonly sortAscending: string;
  readonly sortDescending: string;
  readonly clearSort: string;
  readonly pinLeft: string;
  readonly pinRight: string;
  readonly unpin: string;
  readonly hideColumn: string;
  readonly total: string;
  readonly loading: string;
  readonly gridPagination: string;
  readonly saveLayout: string;
  readonly restoreLayout: string;
  readonly clearLayout: string;
  readonly noColumnsAvailable: string;
  readonly showColumn: string;
  readonly pinColumnLeft: string;
  readonly pinColumnRight: string;
  readonly booleanYes: string;
  readonly booleanNo: string;
  readonly rowActions: string;
  readonly moreRowActions: string;
  readonly operators?: Partial<Record<PixelDataGridFilterOperator, string>>;
}
```

**`FormatGridCellOptions`** — Options for `formatGridCell`.

```ts
interface FormatGridCellOptions {
  readonly labels?: Pick<PixelDataGridLabels, 'booleanYes' | 'booleanNo'> | null;
  readonly dateLocale?: string;
  readonly dateFieldIo?: PixelDateFieldIoContext | null;
}
```

<!-- API-CONTRACT:END -->

## Behavior notes

- **Analytics (opt-in):** when `PIXEL_UI_ANALYTICS` is provided, sort / filter / filter.clear /
  debounced search / page / export emit `data.table.*` and `data.export` (with optional
  `analyticsId` as `gridId`). Filter/search payloads never include raw query or filter values.
- **Density vs size:** `density` (`comfortable` | `standard` | `compact`, default `standard`)
  controls row height. Header and body data cells lock to that height (`--pixel-data-grid-row-block-size`) so
  inline editors do not reflow the table when entering/leaving edit. Embedded form controls
  (paginator, filters, quick search, cell editors) map to control `size`: `comfortable→md`,
  `standard→sm`, `compact→xs` (CONVENTIONS §3b). Do not pass a separate `size` on the grid host.
- **Date filter / editor:** date column filters and the built-in date cell editor compose
  `pixel-datepicker` (nested overlay inside the filter `pixel-menu`, same pattern as filter
  `pixel-select`). Filter operators remain single-date (`equals` / `before` / `after`); range
  filtering would need a `between` operator + `pixel-date-range-picker`. Filter popovers are
  locked to `12rem` wide so the datepicker’s default `18rem` field max does not widen the panel.
- **Date cell display:** `type: 'date'` cells use the same formatter as datepicker
  (`formatCalendarDateDisplayValue`). Locale precedence: `[dateLocale]` → `PIXEL_DATE_LOCALE`
  (from `providePixelDateLocale({ strategy: 'localeId' })`) → browser Intl. Export still emits
  canonical `YYYY-MM-DD`.
- **Performance (`@defer`)** — columns-panel body (and layout footer actions) load via
  `@if (columnsPanelOpen()) { @defer (on immediate) { … } }` so closed choosers skip that chunk.
  Export toolbar stays eager (light `pixel-menu` items — not worth a separate chunk).
  Import the grid from `pixel-ui/data-grid`, not the main barrel.
- **Loading:** `loadingMode` supports spinner vs in-body skeleton rows. Headers/columns stay
  mounted; `skeletonRows` default `0` auto-sizes placeholders (see Breaking changes). Prefer
  skeleton when replacing row data so layout height stays stable.
- **Column layout:** the table fills the scroll viewport and distributes width via fixed
  `width`, `flex`, and optional `maxWidth` (AG Grid–style). Long default cell text ellipsizes;
  `cellTooltipWhenTruncated` (default `true`) shows the full value on hover/focus when clipped
  (`pixelTooltipShowOnOverflow`). Built-in cells honor `column.overflow`: `'ellipsis'` (default)
  or `'clip'` (hard crop, no tooltip). Custom `pixelGridCell` templates opt out of automatic
  wrapping — use `pixelGridCellRow` for composite layouts (avatar + label) and
  `pixelGridCellOverflow` on the truncating text leaf. Bind
  `[pixelGridCellOverflowDisabled]="!overflowTooltip"` from the cell context to respect
  `cellTooltipWhenTruncated`.
- **Column minimum width:** when `minWidth` is omitted, each column's floor is the header content
  width (label + sort / filter / pin / drag / menu chrome + padding), never below
  `defaultColumnMinWidth` (**120px** by default). Explicit `column.minWidth` overrides that default
  (even when smaller — header label may ellipsize). Viewport layout and drag-resize both honor the
  same effective minimum. Narrow viewports scroll horizontally when mins exceed the container —
  there is no mobile-only min branch.
- **Column width units:** `width`, `minWidth`, `maxWidth`, and persisted resize/state widths are all
  **pixels (`number`)**; `flex` is a unitless grow weight. Omit `width` and `flex` to participate
  as `flex: 1` in viewport layout.
- **Overflow:** horizontal scroll appears only when column minimums or user-resized widths exceed
  the viewport (see `RESPONSIVE.md`).
- **Empty:** empty body uses a designed empty row / message (`emptyMessage`), not
  `pixel-empty-state` — table semantics + density need an in-tbody row (CONVENTIONS empty-state
  exception).
- **Labels / i18n:** toolbar, selection banner, column menu, columns panel, filter chrome, export
  menu, boolean Yes/No, and row-actions group/overflow defaults are overridable via `[labels]`
  (`Partial<PixelDataGridLabels>`, merged with `DEFAULT_PIXEL_DATA_GRID_LABELS`). Templates support
  `{n}`, `{total}`, and `{col}` via `formatLabel`. `emptyMessage` stays a separate input.
- **Row quick actions (Gmail-style):** bind `[rowQuickActions]` for a floating pill at the
  `inset-inline-end` of each data row. Default reveal is `rowQuickActionsMode="hover-focus"`:
  pointer hover owns visibility (hovering another row hides the previous pill, including after a
  mouse click that left focus in the old row). Keyboard Tab/arrow into actions can keep the pill
  via focus-within only while keyboard navigation is active. Icons use round `pixel-button`
  `appearance="icon"` (`fabShape="circle"`). The first `rowQuickActionsMaxVisible` (default **3**)
  icons render inline; remaining actions open from a **⋮** `pixel-menu`. Coarse pointers
  (`pointer: coarse`) use **tap-to-reveal**: the pill sticks on the tapped row until another
  row (or outside the rows) is tapped — they are **not** forced always-visible. Only
  `rowQuickActionsMode="always"` shows every row's pill at once. Project
  `<ng-template pixelGridRowActions>` to replace the declarative renderer. Action clicks
  `stopPropagation` so they do not fire `rowClick`. Sticky zero-width trailing column keeps the
  pill aligned under horizontal scroll / pinned-right columns; keep the pill visible while the
  overflow menu is open, and **suppress hover pills on other rows** until that menu closes.

## Accessibility

- Grid uses table semantics with sortable headers, selectable rows, and keyboard navigation for
  focusable cells / editors (see Phase 6). Announce loading via `aria-busy` / live region when
  `loadingMode` is active.
- Ensure interactive chrome (sort, filter, row actions) keeps ≥44×44px effective hit targets where
  density allows; compact density tightens visual padding but keeps focus rings visible.

## Theme customization

Row density and chrome colors use `--pixel-data-grid-*` tokens derived from `--pixel-sys-*` on
`:host`. Override density padding / border / header surface tokens on the host or an ancestor;
dark scheme follows global theme without hardcoded colors.

## Breaking changes

- **Default column min width is 120px** — when `column.minWidth` is omitted, the readable floor is
  now 120px (was 56px), still raised further by header content estimates. Override with
  `[defaultColumnMinWidth]` on the grid or per-column `minWidth`.
- **`column.width` is px (`number`)** — was a CSS string (`'160px'`, `'12rem'`). Use pixel numbers
  for fixed widths; `minWidth`, `maxWidth`, and persisted `columnState.width` were already px.
  Removed the public `parseGridColumnWidth()` helper.
- **`columnLayout` removed** — the grid always fills the scroll viewport (`'viewport'` behavior).
  Remove `columnLayout="content"` from templates; use explicit column `width` values when you
  need a wider table with horizontal scroll. Ellipsis + overflow tooltips remain the default for
  long cell text.
- **`skeletonRows` default is `0` (auto)** — previously defaulted to `5`. Auto uses `pageSize` when
  paginated, the virtual viewport row count when virtualized, the current row count when known,
  otherwise `10`. Pass a positive number to force a fixed placeholder count.
