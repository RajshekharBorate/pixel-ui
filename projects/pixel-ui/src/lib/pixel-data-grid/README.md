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
- Empty, loading-overlay, and skeleton states.
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
  { field: 'name', header: 'Name', width: '14rem' },
  { field: 'age', header: 'Age', type: 'number', align: 'end' },
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
| `loading` | `boolean` | `false` | Loading overlay over current rows. |
| `showSkeleton` | `boolean` | `false` | Replace grid with skeleton. |
| `skeletonRows` | `number` | `5` | Skeleton placeholder row count. |
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
- **Quick search** — `searchable` shows a global search box across visible columns. `[(quickFilter)]`.
- **Pagination** — `[paginated]="true"` adds a footer with page-size select + range label.
  Two-way `[(pageIndex)]` / `[(pageSize)]`; `pageChange` output.
- **Server mode** — `serverSide` renders `data` verbatim, emits a unified `criteriaChange`
  (sort + page + search + filters), and uses `totalRecords` for paging.
- **DataSource** — bind `[dataSource]` (a `PixelDataGridDataSource<T>` whose `fetch(criteria)`
  returns rows + total as a value / `Promise` / `Observable`); the grid fetches on every criteria
  change and manages the loading overlay.

```html
<!-- Client-side: sort + filter + search + paginate -->
<pixel-data-grid [data]="rows()" [columns]="columns" [rowId]="rowIdFn" searchable [paginated]="true" />

<!-- Server-side via a DataSource -->
<pixel-data-grid [dataSource]="dataSource" [columns]="columns" [rowId]="rowIdFn" searchable [paginated]="true" />
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
  out with `resizable: false`, set a floor with `minWidth`). Double-click a handle to reset to auto.
- **Reorder** — `reorderableColumns` shows a drag handle; drag a header to reposition it
  (native drag-and-drop, with a drop indicator).
- **Pin / freeze** — `pinnableColumns` adds Pin left / Pin right / Unpin to each column's header
  menu; set `pinned: 'left' | 'right'` for an initial freeze. Pinned columns stay sticky with an
  edge shadow.
- **Manage columns panel** — `columnChooser` adds a toolbar button that opens a `pixel-drawer` side
  panel listing every chooser-eligible column (respecting `lockVisible`), each with a visibility
  toggle, drag handle (reorder), and — when `pinnableColumns` is also set — pin-left / pin-right
  buttons. The panel is a single central place for pin / hide / reorder plus Save / Restore / Clear
  layout, instead of hunting across the per-column menu and header drag handles.
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
  { field: 'name', header: 'Name', pinned: 'left', lockVisible: true, width: '14rem' },
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
  Two-way `[(selectedRows)]` (keyed by `rowId` so it survives paging/sort/filter); `selectionChange`
  output. When a whole page is selected and more rows exist, a banner offers **Select all N rows**.
- **Export** — `exportable` adds a toolbar menu for **CSV / JSON / Excel** (SpreadsheetML, no
  dependency) / **clipboard** (TSV). Exports respect column order, visibility, and `exportable:
  false`. When rows are selected, an **Only selected** toggle scopes the export. Programmatic
  `exportData(format, scope?)` supports `'all' | 'selected' | 'page'`; **export-all** fetches every
  row from a bound `[dataSource]` first.

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
| `exportData(format, scope?)` / `clearSelection()` | method | — | Programmatic export / clear. |

Column config also gains `exportable?: boolean`.

## Phase 4 — Virtualization & scale (available now)

- **Row virtualization** — `virtualScroll` renders only the visible window of rows (fixed-height
  windowing via spacer rows), so 10k–100k+ rows stay smooth. It **composes with the sticky header
  and pinned columns** and keeps full-set sorting/filtering. `virtualHeight` sets the viewport
  height; `rowHeight` overrides the per-density row-height estimate; `virtualOverscan` tunes the
  buffer. Virtualization bypasses pagination.
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
  **grand-total footer** over the full filtered set.
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
  selects), or a custom `pixelGridEditor` template. **Double-click** a cell, or focus it and press
  **Enter / F2**; **Enter** commits, **Esc** cancels. Per-column `validate(value, row)` blocks an
  invalid commit and shows the message. `cellEdit` emits `{ row, field, rowIndex, oldValue, newValue }`.
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
