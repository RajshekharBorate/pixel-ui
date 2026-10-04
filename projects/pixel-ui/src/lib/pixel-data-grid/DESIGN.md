# pixel-data-grid — design

This page explains **pixel-data-grid** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A table for rows the page owns. Density picks the row height and the size of editors inside the cells. Do not pass a separate control size. Date filters and date editors use the date picker. Analytics records table events and export events, never the raw filter text.

| This piece does | It does not |
| --- | --- |
| Shows, sorts, filters, and edits rows | Send filter text or query text to analytics |
| Exports through the export service when the toolbar asks | Pick its own density and a second control size |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  grid["Data grid"]
  row["Rows"]
  filter["Filter"]
  select["Selection"]
  export["Export"]
  busy["Loading"]
  page --> grid
  grid --> row
  grid --> busy
  filter --> grid
  grid --> page
  row --> grid
  grid --> select
  select --> page
  grid --> export
  export --> page
```

## 3. Flows

### Show rows

1. The page passes rows and columns. The grid is a table. Density sets comfortable, standard, or compact rows.
2. While rows load, the table is busy. When the list is empty, show an empty state the page provides, not a blank body.

### Filter

1. The user filters. A date filter opens the date picker. The page applies the filter to the rows.
2. Analytics may record that a filter changed. It does not record the typed value.

### Edit a cell

1. The user edits a cell. A date cell uses the date picker. The control size follows density. Do not pass another size.
2. The page saves the new value. Sort and page changes keep using the page’s row list.

### Select rows

1. The page turns selection on. Single mode picks one row. Multiple mode adds checkboxes, a header select-all for this page, and shift-click range. A banner can then select every row.
2. The page keeps the selected rows. They stay selected across paging, sort, and filter. Export can be limited to that selection.

### Export

1. The export toolbar builds a file through the export service. Columns the user is not allowed to see stay out.
2. The file downloads. Analytics records the export event, not the cell text.

## 4. Step by step

### Show rows

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant grid as "Data grid"
  participant row as "Rows"
  participant busy as "Loading"
  page->>grid: The page passes rows and columns.
  grid->>busy: While rows load, the table is busy.
```

### Filter

```mermaid
sequenceDiagram
  participant filter as "Filter"
  participant grid as "Data grid"
  participant page as "Your page"
  filter->>grid: The user filters. A date filter opens the date picker. The page applies the filter to the rows.
  grid->>grid: Analytics may record that a filter changed.
```

### Edit a cell

```mermaid
sequenceDiagram
  participant row as "Rows"
  participant grid as "Data grid"
  participant page as "Your page"
  row->>grid: The user edits a cell. A date cell uses the date picker. The control size follows density. Do not pass another size.
  grid->>page: The page saves the new value.
```

### Select rows

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant grid as "Data grid"
  participant select as "Selection"
  page->>grid: The page turns selection on.
  select->>page: The page keeps the selected rows.
```

### Export

```mermaid
sequenceDiagram
  participant grid as "Data grid"
  participant export as "Export"
  participant page as "Your page"
  grid->>export: The export toolbar builds a file through the export service.
  export->>page: The file downloads. Analytics records the export event, not the cell text.
```

## 5. States

- Loading: the table is busy.
- Empty: the page shows an empty state.
- Density: comfortable, standard, or compact, which also sizes cell editors.
- Filtered, sorted, and paged.
- Row selection: none, one row, this page, or every row. The page holds the row objects.
- Cell editing.

## 6. Easy to get wrong

- Do not pass a separate size for inputs inside cells. Density already chooses md, sm, or xs.
- Do not put raw filter or query text in analytics.
- Date cells use pixel-datepicker. Do not invent a second date field.

## 7. Files

- `pixel-data-grid-cell-overflow.directive.ts`
- `pixel-data-grid-cell-row.directive.ts`
- `pixel-data-grid-cell.directive.ts`
- `pixel-data-grid-column-layout.ts`
- `pixel-data-grid-columns-panel.html`
- `pixel-data-grid-columns-panel.scss`
- `pixel-data-grid-columns-panel.ts`
- `pixel-data-grid-detail.directive.ts`
- `pixel-data-grid-drag-preview.ts`
- `pixel-data-grid-editor.directive.ts`
- `pixel-data-grid-header-min-width.ts`
- `pixel-data-grid-row-actions.directive.ts`
- `pixel-data-grid.html`
- `pixel-data-grid.scss`
- `pixel-data-grid.store.ts`
- `pixel-data-grid.ts`
- `pixel-data-grid.types.ts`
- `pixel-data-grid.utils.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
