import { createDocExample } from '../../shared/example-source.util';
import { DataGridBasicExample } from './data-grid-basic.example';
import { DataGridCustomCellExample } from './data-grid-custom-cell.example';
import { DataGridDataOpsExample } from './data-grid-data-ops.example';
import { DataGridDataSourceExample } from './data-grid-data-source.example';
import { DataGridColumnsExample } from './data-grid-columns.example';
import { DataGridStateExample } from './data-grid-state.example';
import { DataGridSelectionExample } from './data-grid-selection.example';
import { DataGridVirtualExample } from './data-grid-virtual.example';
import { DataGridGroupingExample } from './data-grid-grouping.example';
import { DataGridDetailExample } from './data-grid-detail.example';
import { DataGridEditingExample } from './data-grid-editing.example';

export const DATA_GRID_EXAMPLES = [
  createDocExample({
    id: 'data-grid-basic',
    title: 'Basic grid',
    category: 'Setup',
    description: 'Columns with built-in number, boolean, and date renderers, striped rows, and a caption.',
    component: DataGridBasicExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  density="standard"
  striped
  caption="Team members"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface PersonRow {
  id: number;
  name: string;
  team: string;
  age: number;
  active: boolean;
  joined: Date;
}

@Component({
  selector: 'docs-data-grid-basic-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-basic.example.html',
  styleUrl: './data-grid-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridBasicExample {
  protected readonly rows = signal<PersonRow[]>([/* … */]);
  protected readonly rowIdFn = (row: PersonRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Name', width: '14rem' },
    { field: 'team', header: 'Team' },
    { field: 'age', header: 'Age', type: 'number', align: 'end' },
    { field: 'active', header: 'Active', type: 'boolean', align: 'center' },
    { field: 'joined', header: 'Joined', type: 'date' },
  ];
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'data-grid-custom-cell',
    title: 'Custom cell template',
    category: 'Advanced',
    description: 'Project a pixelGridCell template for fully custom cell content such as avatars and status pills.',
    component: DataGridCustomCellExample,
    imports: ['PixelDataGridComponent', 'PixelDataGridCellDirective'],
    html: `<pixel-data-grid [data]="rows()" [columns]="columns" [rowId]="rowIdFn" density="comfortable">
  <ng-template pixelGridCell="name" let-row let-value="value">
    <span class="member">
      <span class="member__avatar" aria-hidden="true">{{ $any(value).charAt(0) }}</span>
      <span class="member__name">{{ value }}</span>
    </span>
  </ng-template>

  <ng-template pixelGridCell="active" let-value="value">
    <span class="status" [class.status--on]="value">{{ value ? 'Active' : 'Away' }}</span>
  </ng-template>
</pixel-data-grid>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridCellDirective,
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui';

interface PersonRow {
  id: number;
  name: string;
  team: string;
  active: boolean;
}

@Component({
  selector: 'docs-data-grid-custom-cell-example',
  imports: [PixelDataGridComponent, PixelDataGridCellDirective],
  templateUrl: './data-grid-custom-cell.example.html',
  styleUrl: './data-grid-custom-cell.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridCustomCellExample {
  protected readonly rows = signal<PersonRow[]>([/* … */]);
  protected readonly rowIdFn = (row: PersonRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Member', width: '16rem' },
    { field: 'team', header: 'Team' },
    { field: 'active', header: 'Status', align: 'center' },
  ];
}`,
    scss: `.member {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.member__avatar {
  display: inline-grid;
  place-items: center;
  inline-size: 1.75rem;
  block-size: 1.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--pixel-sys-primary-container);
  color: var(--pixel-sys-on-primary-container);
}

.status--on {
  background: var(--pixel-sys-success-container);
  color: var(--pixel-sys-on-success-container);
}`,
  }),
  createDocExample({
    id: 'data-grid-data-ops',
    title: 'Sort, filter, search & paginate',
    category: 'Behavior',
    description:
      'Client-side multi-column sort (shift-click), per-column filters, a global quick search, and pagination — all driven by the built-in pipeline.',
    component: DataGridDataOpsExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  searchable
  searchPlaceholder="Search orders…"
  [paginated]="true"
  [pageSize]="10"
  caption="Shift-click a header to sort by multiple columns"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface OrderRow {
  id: number;
  customer: string;
  region: 'NA' | 'EU' | 'APAC';
  amount: number;
  status: 'Paid' | 'Pending' | 'Refunded';
  placed: string;
}

@Component({
  selector: 'docs-data-grid-data-ops-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-data-ops.example.html',
  styleUrl: './data-grid-data-ops.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridDataOpsExample {
  protected readonly rows = signal<OrderRow[]>([/* … 60 orders … */]);
  protected readonly rowIdFn = (row: OrderRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<OrderRow>[] = [
    { field: 'customer', header: 'Customer', sortable: true, width: '14rem', filter: { type: 'text' } },
    { field: 'region', header: 'Region', sortable: true, filter: { type: 'select', options: [/* … */] } },
    { field: 'amount', header: 'Amount', sortable: true, type: 'number', align: 'end', filter: { type: 'number' } },
    { field: 'status', header: 'Status', sortable: true, filter: { type: 'select', options: [/* … */] } },
    { field: 'placed', header: 'Placed', sortable: true, type: 'date', filter: { type: 'date' } },
  ];
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'data-grid-data-source',
    title: 'Server-side data source',
    category: 'Advanced',
    description:
      'Bind a [dataSource]; the grid switches to server mode, calls fetch() on every criteria change (sort/search/page), and manages the loading overlay automatically.',
    component: DataGridDataSourceExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [dataSource]="dataSource"
  [columns]="columns"
  [rowId]="rowIdFn"
  searchable
  searchPlaceholder="Search SKU or warehouse…"
  [paginated]="true"
  [pageSize]="15"
/>`,
    typescript: `import { Observable, delay, of } from 'rxjs';
import {
  PixelDataGridCriteria,
  PixelDataGridDataSource,
  PixelDataGridFetchResult,
  compareGridValues,
} from 'pixel-ui';

interface ServerRow { id: number; sku: string; warehouse: string; units: number; }

// A fake backend: applies the grid criteria over an in-memory table with simulated latency.
class InMemoryDataSource implements PixelDataGridDataSource<ServerRow> {
  private readonly all: ServerRow[] = [/* … 240 rows … */];

  fetch(criteria: PixelDataGridCriteria): Observable<PixelDataGridFetchResult<ServerRow>> {
    let rows = this.all;
    const term = criteria.quickFilter.trim().toLowerCase();
    if (term) {
      rows = rows.filter((r) => r.sku.toLowerCase().includes(term) || r.warehouse.toLowerCase().includes(term));
    }
    if (criteria.sort.length) {
      rows = [...rows].sort((a, b) => {
        for (const { field, direction } of criteria.sort) {
          const cmp = compareGridValues((a as any)[field], (b as any)[field]) * (direction === 'asc' ? 1 : -1);
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }
    const total = rows.length;
    const start = criteria.page.pageIndex * criteria.page.pageSize;
    return of({ rows: rows.slice(start, start + criteria.page.pageSize), total }).pipe(delay(350));
  }
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'data-grid-columns',
    title: 'Resize, reorder & pin columns',
    category: 'Behavior',
    description:
      'Drag the resize edge, drag the ⠿ handle to reorder, and use a column’s ⋮ menu to pin left/right or hide. The column-chooser toolbar toggles visibility.',
    component: DataGridColumnsExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  resizableColumns
  reorderableColumns
  pinnableColumns
  columnChooser
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface EmployeeRow {
  id: number; name: string; title: string;
  department: string; location: string; salary: number; startDate: string;
}

@Component({
  selector: 'docs-data-grid-columns-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-columns.example.html',
  styleUrl: './data-grid-columns.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridColumnsExample {
  protected readonly rows = signal<EmployeeRow[]>([/* … 40 employees … */]);
  protected readonly rowIdFn = (row: EmployeeRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<EmployeeRow>[] = [
    // Pin a column with 'pinned', lock it out of the chooser with 'lockVisible'.
    { field: 'name', header: 'Name', sortable: true, width: '14rem', pinned: 'left', lockVisible: true },
    { field: 'title', header: 'Title', sortable: true, width: '10rem' },
    { field: 'department', header: 'Department', sortable: true, width: '11rem' },
    { field: 'location', header: 'Location', sortable: true, width: '10rem' },
    { field: 'salary', header: 'Salary', sortable: true, type: 'number', align: 'end', width: '9rem' },
    { field: 'startDate', header: 'Start date', sortable: true, type: 'date', width: '10rem', pinned: 'right' },
  ];
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'data-grid-state',
    title: 'Save & restore view state',
    category: 'Advanced',
    description:
      'getState() / setState() (and the JSON helpers) capture column order, widths, visibility, pinning, sort, filters, and page so you can persist a user’s layout.',
    component: DataGridStateExample,
    imports: ['PixelDataGridComponent', 'PixelButtonComponent'],
    html: `<pixel-button size="sm" (click)="save()">Save layout</pixel-button>
<pixel-button size="sm" [disabled]="!savedState()" (click)="restore()">Restore</pixel-button>
<pixel-button size="sm" appearance="text" (click)="reset()">Reset</pixel-button>

<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  resizableColumns
  reorderableColumns
  pinnableColumns
  columnChooser
/>`,
    typescript: `import { Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent, PixelDataGridComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DataGridStateExample {
  private readonly grid = viewChild.required(PixelDataGridComponent);
  protected readonly savedState = signal<string | null>(null);

  protected save(): void {
    // Persist anywhere (localStorage, a profile API, …).
    this.savedState.set(this.grid().getStateJson(true));
  }

  protected restore(): void {
    const json = this.savedState();
    if (json) this.grid().setStateFromJson(json);
  }

  protected reset(): void {
    this.grid().resetColumns();
  }
}`,
    scss: `.toolbar {
  display: flex;
  gap: 0.5rem;
  margin-block-end: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'data-grid-selection',
    title: 'Selection & export',
    category: 'Behavior',
    description:
      'Multi-select with a checkbox column, shift-click ranges, select-all (page or every page), and a CSV / JSON / Excel / clipboard export menu that can target the selection.',
    component: DataGridSelectionExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  selectionMode="multiple"
  [selectedRows]="selected()"
  (selectedRowsChange)="selected.set($event)"
  [paginated]="true"
  [pageSize]="10"
  exportable
  exportFileName="invoices"
/>
<p class="meta">{{ selected().length }} selected</p>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface InvoiceRow {
  id: number; number: string; client: string;
  amount: number; status: 'Paid' | 'Open' | 'Overdue'; due: string;
}

@Component({
  selector: 'docs-data-grid-selection-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-selection.example.html',
  styleUrl: './data-grid-selection.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridSelectionExample {
  protected readonly rows = signal<InvoiceRow[]>([/* … 40 invoices … */]);
  protected readonly selected = signal<InvoiceRow[]>([]);
  protected readonly rowIdFn = (row: InvoiceRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<InvoiceRow>[] = [
    { field: 'number', header: 'Invoice', sortable: true, width: '10rem' },
    { field: 'client', header: 'Client', sortable: true },
    { field: 'amount', header: 'Amount', sortable: true, type: 'number', align: 'end' },
    { field: 'status', header: 'Status', sortable: true },
    { field: 'due', header: 'Due', sortable: true, type: 'date' },
  ];
}`,
    scss: `.meta {
  margin-block-start: 0.75rem;
  font-size: 0.8125rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 70%, transparent);
}`,
  }),
  createDocExample({
    id: 'data-grid-virtual',
    title: 'Virtual scroll (50k rows)',
    category: 'Advanced',
    description:
      'Fixed-height row windowing keeps only the visible rows in the DOM, so very large datasets stay smooth — and it composes with the sticky header and a pinned column. Sorting still works across the whole set.',
    component: DataGridVirtualExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  virtualScroll
  [virtualHeight]="420"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface EventRow {
  id: number; ref: string; user: string; action: string; ip: string; at: string;
}

@Component({
  selector: 'docs-data-grid-virtual-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-virtual.example.html',
  styleUrl: './data-grid-virtual.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridVirtualExample {
  // 50,000 rows — only the visible window is rendered.
  protected readonly rows = signal<EventRow[]>([/* … */]);
  protected readonly rowIdFn = (row: EventRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<EventRow>[] = [
    { field: 'ref', header: 'Reference', sortable: true, width: '11rem', pinned: 'left' },
    { field: 'user', header: 'User', sortable: true, width: '9rem' },
    { field: 'action', header: 'Action', sortable: true, width: '9rem' },
    { field: 'ip', header: 'IP address', width: '10rem' },
    { field: 'at', header: 'Timestamp', sortable: true, width: '12rem' },
  ];
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'data-grid-grouping',
    title: 'Grouping & aggregation',
    category: 'Advanced',
    description:
      'Group by one or more columns with collapsible headers and row counts, per-column aggregates (sum/avg/min/max/count or a custom fn) in each group header, and a grand-total footer.',
    component: DataGridGroupingExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  [groupBy]="['region', 'product']"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface SaleRow {
  id: number; region: 'NA' | 'EU' | 'APAC'; rep: string;
  product: string; units: number; revenue: number;
}

@Component({
  selector: 'docs-data-grid-grouping-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-grouping.example.html',
  styleUrl: './data-grid-grouping.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridGroupingExample {
  protected readonly rows = signal<SaleRow[]>([/* … 60 sales … */]);
  protected readonly rowIdFn = (row: SaleRow): number => row.id;
  protected readonly groupBy = ['region', 'product'];
  protected readonly columns: PixelDataGridColumn<SaleRow>[] = [
    { field: 'region', header: 'Region', sortable: true, width: '16rem' },
    { field: 'product', header: 'Product', sortable: true },
    { field: 'rep', header: 'Rep', sortable: true },
    { field: 'units', header: 'Units', type: 'number', align: 'end', aggregate: 'sum' },
    { field: 'revenue', header: 'Revenue', type: 'number', align: 'end', aggregate: 'sum' },
  ];
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'data-grid-detail',
    title: 'Master-detail rows',
    category: 'Advanced',
    description:
      'Enable expandableRows and project a pixelGridDetail template; each row gets a toggle that expands a detail panel beneath it.',
    component: DataGridDetailExample,
    imports: ['PixelDataGridComponent', 'PixelDataGridDetailDirective'],
    html: `<pixel-data-grid [data]="rows()" [columns]="columns" [rowId]="rowIdFn" expandableRows>
  <ng-template pixelGridDetail let-row>
    <div class="ticket-detail">
      <h4>{{ row.ref }} — {{ row.subject }}</h4>
      <p>{{ row.description }}</p>
      <span class="ticket-detail__meta">Assigned to {{ row.assignee }} · {{ row.priority }} priority</span>
    </div>
  </ng-template>
</pixel-data-grid>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
  PixelDataGridDetailDirective,
} from 'pixel-ui';

interface TicketRow {
  id: number; ref: string; subject: string;
  priority: 'Low' | 'Medium' | 'High'; assignee: string; description: string;
}

@Component({
  selector: 'docs-data-grid-detail-example',
  imports: [PixelDataGridComponent, PixelDataGridDetailDirective],
  templateUrl: './data-grid-detail.example.html',
  styleUrl: './data-grid-detail.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridDetailExample {
  protected readonly rows = signal<TicketRow[]>([/* … */]);
  protected readonly rowIdFn = (row: TicketRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<TicketRow>[] = [
    { field: 'ref', header: 'Ref', sortable: true, width: '9rem' },
    { field: 'subject', header: 'Subject', sortable: true },
    { field: 'priority', header: 'Priority', sortable: true },
    { field: 'assignee', header: 'Assignee', sortable: true },
  ];
}`,
    scss: `.ticket-detail {
  padding: 1rem 1.25rem;
}`,
  }),
  createDocExample({
    id: 'data-grid-editing',
    title: 'Inline editing & validation',
    category: 'Advanced',
    description:
      'Double-click (or press Enter/F2 on a focused cell) to edit with built-in text / number / select / checkbox editors, per-column validation, and a cellEdit event. Arrow keys move the cell focus.',
    component: DataGridEditingExample,
    imports: ['PixelDataGridComponent'],
    html: `<pixel-data-grid
  [data]="rows()"
  [columns]="columns"
  [rowId]="rowIdFn"
  editable
  (cellEdit)="onCellEdit($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridCellEditEvent,
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui';

interface TaskRow {
  id: number; title: string; estimate: number; status: 'Todo' | 'Doing' | 'Done'; done: boolean;
}

@Component({
  selector: 'docs-data-grid-editing-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-editing.example.html',
  styleUrl: './data-grid-editing.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridEditingExample {
  protected readonly rows = signal<TaskRow[]>([/* … */]);
  protected readonly rowIdFn = (row: TaskRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<TaskRow>[] = [
    { field: 'title', header: 'Title', editable: true,
      validate: (v) => (String(v).trim() ? null : 'Title is required') },
    { field: 'estimate', header: 'Estimate', type: 'number', align: 'end', editable: true, editor: 'number',
      validate: (v) => (Number(v) >= 0 ? null : 'Must be ≥ 0') },
    { field: 'status', header: 'Status', editable: true, editor: 'select',
      editorOptions: [{ value: 'Todo', label: 'Todo' }, { value: 'Doing', label: 'Doing' }, { value: 'Done', label: 'Done' }] },
    { field: 'done', header: 'Done', type: 'boolean', align: 'center', editable: true, editor: 'checkbox' },
  ];

  protected onCellEdit(event: PixelDataGridCellEditEvent<TaskRow>): void {
    console.log(event.field, event.oldValue, '→', event.newValue);
  }
}`,
    scss: `:host {
  display: block;
}`,
  }),
] as const;
