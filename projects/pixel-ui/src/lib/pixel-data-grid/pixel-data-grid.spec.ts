import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelDataGridComponent from './pixel-data-grid';
import PixelDataGridCellDirective from './pixel-data-grid-cell.directive';
import type {
  PixelDataGridColumn,
  PixelDataGridLoadingMode,
  PixelDataGridRowClickEvent,
} from './pixel-data-grid.types';
import { compareGridValues, formatGridCell, gridHeaderLabel, matchesGridFilter, parseGridDate } from './pixel-data-grid.utils';

interface PersonRow {
  id: number;
  name: string;
  age: number;
  active: boolean;
  joined: Date;
}

const ROWS: PersonRow[] = [
  { id: 1, name: 'Ada', age: 36, active: true, joined: new Date('2020-01-15') },
  { id: 2, name: 'Linus', age: 54, active: false, joined: new Date('2018-06-01') },
  { id: 3, name: 'Grace', age: 0, active: true, joined: new Date('2021-11-30') },
];

@Component({
  imports: [PixelDataGridComponent, PixelDataGridCellDirective],
  template: `
    <pixel-data-grid
      [data]="rows()"
      [columns]="columns"
      [rowId]="rowIdFn"
      [density]="density()"
      [clickableRows]="clickable()"
      [showSkeleton]="skeleton()"
      [loading]="loading()"
      [loadingMode]="loadingMode()"
      [skeletonRows]="skeletonRows()"
      [paginated]="paginated()"
      [pageSize]="pageSize()"
      [emptyMessage]="emptyMessage()"
      (rowClick)="clicks.push($event)"
    >
      <ng-template pixelGridCell="name" let-value="value">
        <span class="custom-name">{{ value }}</span>
      </ng-template>
    </pixel-data-grid>
  `,
})
class HostComponent {
  readonly rows = signal<PersonRow[]>([...ROWS]);
  readonly density = signal<'comfortable' | 'standard' | 'compact'>('standard');
  readonly clickable = signal(false);
  readonly skeleton = signal(false);
  readonly loading = signal(false);
  readonly loadingMode = signal<PixelDataGridLoadingMode>('skeleton');
  readonly skeletonRows = signal(0);
  readonly paginated = signal(false);
  readonly pageSize = signal(10);
  readonly emptyMessage = signal('Nothing here.');
  readonly clicks: PixelDataGridRowClickEvent<PersonRow>[] = [];
  readonly rowIdFn = (row: PersonRow): number => row.id;
  readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Name' },
    { field: 'age', header: 'Age', type: 'number', align: 'end' },
    { field: 'active', header: 'Active', type: 'boolean' },
    { field: 'joined', header: 'Joined', type: 'date', hidden: true },
  ];
}

describe('PixelDataGridComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function bodyRows(): HTMLTableRowElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.pixel-data-grid__body .pixel-data-grid__row'),
    );
  }

  it('renders only visible columns in the header', () => {
    const headers = fixture.nativeElement.querySelectorAll('.pixel-data-grid__cell--header');
    expect(headers.length).toBe(3); // joined is hidden
    expect(headers[0].textContent).toContain('Name');
    expect(headers[1].textContent).toContain('Age');
  });

  it('renders a row per data record', () => {
    expect(bodyRows().length).toBe(3);
  });

  it('uses a custom cell template when provided', () => {
    const custom = fixture.nativeElement.querySelector('.custom-name');
    expect(custom?.textContent).toContain('Ada');
  });

  it('formats built-in cell types and empty values', () => {
    const firstRowCells = bodyRows()[0].querySelectorAll('.pixel-data-grid__cell');
    // age column for Ada = 36
    expect(firstRowCells[1].textContent?.trim()).toBe('36');
    // boolean true -> Yes
    expect(firstRowCells[2].textContent?.trim()).toBe('Yes');
  });

  it('shows the empty state with the configured message', () => {
    host.rows.set([]);
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.pixel-data-grid__empty');
    expect(empty?.textContent).toContain('Nothing here.');
  });

  it('keeps headers and shows in-body skeleton rows when showSkeleton is set', () => {
    host.skeleton.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__head')).toBeTruthy();
    // Auto: non-paginated with known rows → match current row count (3).
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeFalsy();
  });

  it('shows a loading overlay when loadingMode="loader"', () => {
    host.loading.set(true);
    host.loadingMode.set('loader');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__row--skeleton')).toBeFalsy();
  });

  it('auto-sizes skeleton rows to the current row count when loading', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__head')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeFalsy();
  });

  it('auto-sizes skeleton rows to pageSize when paginated', () => {
    host.paginated.set(true);
    host.pageSize.set(15);
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(15);
  });

  it('honors an explicit skeletonRows override', () => {
    host.skeletonRows.set(4);
    host.paginated.set(true);
    host.pageSize.set(25);
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(4);
  });

  it('reserves body min-height while skeleton rows are shown', () => {
    host.paginated.set(true);
    host.pageSize.set(10);
    host.loading.set(true);
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.pixel-data-grid__body') as HTMLElement;
    // standard density → 48px × 10
    expect(body.style.minBlockSize).toBe('480px');
  });

  it('shows in-body skeleton rows when loading with loadingMode="skeleton"', () => {
    host.loading.set(true);
    host.loadingMode.set('skeleton');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__table')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeFalsy();
  });

  it('falls back to 10 skeleton rows when auto and there are no known rows', () => {
    host.rows.set([]);
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(10);
  });

  it('reflects density on the host and container', () => {
    host.density.set('compact');
    fixture.detectChanges();
    const gridDebug = fixture.debugElement.query(By.directive(PixelDataGridComponent));
    expect(gridDebug.nativeElement.getAttribute('data-density')).toBe('compact');
  });

  it('locks header cell height to the density row block size', () => {
    host.density.set('compact');
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector(
      '.pixel-data-grid__container',
    ) as HTMLElement;
    const header = fixture.nativeElement.querySelector(
      '.pixel-data-grid__head .pixel-data-grid__cell--header',
    ) as HTMLElement;
    const bodyCell = fixture.nativeElement.querySelector(
      '.pixel-data-grid__body .pixel-data-grid__cell',
    ) as HTMLElement;
    expect(container.style.getPropertyValue('--pixel-data-grid-row-block-size')).toBe('44px');
    expect(getComputedStyle(header).blockSize).toBe(getComputedStyle(bodyCell).blockSize);
    expect(getComputedStyle(header).maxBlockSize).toBe(getComputedStyle(bodyCell).maxBlockSize);
  });

  it('emits rowClick only when clickableRows is enabled', () => {
    bodyRows()[0].click();
    expect(host.clicks.length).toBe(0);

    host.clickable.set(true);
    fixture.detectChanges();
    bodyRows()[1].click();
    expect(host.clicks.length).toBe(1);
    expect(host.clicks[0].row.name).toBe('Linus');
    expect(host.clicks[0].index).toBe(1);
  });

  it('wraps built-in formatted cells in a truncating value span', () => {
    const values = fixture.nativeElement.querySelectorAll('.pixel-data-grid__cell-value');
    expect(values.length).toBeGreaterThan(0);
  });

  it('uses fixed table layout on the scroll table', () => {
    const table = fixture.nativeElement.querySelector('.pixel-data-grid__table') as HTMLElement;
    expect(getComputedStyle(table).tableLayout).toBe('fixed');
  });

  it('exposes data-field on header cells for column measurement', () => {
    const header = fixture.nativeElement.querySelector(
      'th.pixel-data-grid__cell--header[data-field="name"]',
    );
    expect(header).toBeTruthy();
  });
});

@Component({
  imports: [PixelDataGridComponent],
  template: `
    <pixel-data-grid
      [data]="rows"
      [columns]="columns"
      [rowId]="rowIdFn"
      [groupBy]="['active']"
    />
  `,
})
class GroupingHostComponent {
  readonly rows = ROWS;
  readonly rowIdFn = (row: PersonRow): number => row.id;
  readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Name' },
    { field: 'age', header: 'Age', type: 'number', aggregate: 'sum' },
    { field: 'active', header: 'Active', type: 'boolean' },
  ];
}

@Component({
  imports: [PixelDataGridComponent],
  template: `
    <pixel-data-grid [data]="rows" [columns]="columns" [rowId]="rowIdFn" />
  `,
})
class PinnedHostComponent {
  readonly rows = ROWS;
  readonly rowIdFn = (row: PersonRow): number => row.id;
  readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Name', pinned: 'left' },
    { field: 'age', header: 'Age', type: 'number' },
    { field: 'active', header: 'Active', type: 'boolean', pinned: 'right' },
  ];
}

describe('PixelDataGridComponent pinned column indicator', () => {
  let fixture: ComponentFixture<PinnedHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PinnedHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(PinnedHostComponent);
    fixture.detectChanges();
  });

  it('shows an unpin button on left- and right-pinned headers', () => {
    const pins = fixture.nativeElement.querySelectorAll(
      '.pixel-data-grid__pin-btn',
    ) as NodeListOf<HTMLButtonElement>;
    expect(pins.length).toBe(2);
    expect(pins[0].getAttribute('data-pin-side')).toBe('left');
    expect(pins[0].getAttribute('aria-label')).toBe('Unpin Name');
    expect(pins[1].getAttribute('data-pin-side')).toBe('right');
    expect(pins[1].getAttribute('aria-label')).toBe('Unpin Active');
    expect(
      fixture.nativeElement.querySelector(
        '.pixel-data-grid__cell--header:nth-child(2) .pixel-data-grid__pin-btn',
      ),
    ).toBeNull();
  });

  it('unpins the column when the pin button is clicked', () => {
    const pinBtn = fixture.nativeElement.querySelector(
      '.pixel-data-grid__pin-btn[data-pin-side="left"]',
    ) as HTMLButtonElement;
    pinBtn.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.pixel-data-grid__pin-btn[data-pin-side="left"]'),
    ).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__pin-btn').length).toBe(1);
  });
});

@Component({
  imports: [PixelDataGridComponent],
  template: `
    <pixel-data-grid
      [data]="rows"
      [columns]="columns"
      [rowId]="rowIdFn"
      virtualScroll
      [virtualHeight]="240"
    />
  `,
})
class VirtualHostComponent {
  readonly rows = Array.from({ length: 500 }, (_unused, index) => ({
    id: index + 1,
    name: `Row ${index + 1}`,
    age: 20 + (index % 40),
    active: index % 2 === 0,
    joined: new Date('2020-01-01'),
  }));
  readonly rowIdFn = (row: PersonRow): number => row.id;
  readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Name' },
    { field: 'age', header: 'Age', type: 'number' },
  ];
}

describe('PixelDataGridComponent virtual scroll', () => {
  let fixture: ComponentFixture<VirtualHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VirtualHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(VirtualHostComponent);
    fixture.detectChanges();
  });

  it('renders the initial row window without scrolling', () => {
    const bodyRows = fixture.nativeElement.querySelectorAll(
      '.pixel-data-grid__body .pixel-data-grid__row:not(.pixel-data-grid__spacer):not(.pixel-data-grid__row--empty)',
    );
    expect(bodyRows.length).toBeGreaterThan(0);
    expect(bodyRows[0].textContent).toContain('Row 1');
  });
});

describe('PixelDataGridComponent grouping footer', () => {
  let fixture: ComponentFixture<GroupingHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GroupingHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(GroupingHostComponent);
    fixture.detectChanges();
  });

  it('paints an opaque grand-total footer background', () => {
    const hostEl = fixture.nativeElement.querySelector('pixel-data-grid') as HTMLElement;
    const footCell = fixture.nativeElement.querySelector(
      '.pixel-data-grid__foot td',
    ) as HTMLElement;
    expect(footCell).toBeTruthy();
    const footBg = getComputedStyle(hostEl).getPropertyValue('--pixel-data-grid-foot-bg').trim();
    expect(footBg.length).toBeGreaterThan(0);
    const painted = getComputedStyle(footCell).backgroundColor;
    expect(painted).not.toBe('rgba(0, 0, 0, 0)');
    expect(painted).not.toBe('transparent');
  });

  it('renders a bold Total label matching aggregate weight', () => {
    const label = fixture.nativeElement.querySelector(
      '.pixel-data-grid__foot-label',
    ) as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.textContent?.trim()).toBe('Total');
    expect(getComputedStyle(label).fontWeight).toMatch(/^(600|bold)$/);
  });

  it('wraps group row labels for ellipsis and overflow tooltips', () => {
    const label = fixture.nativeElement.querySelector(
      '.pixel-data-grid__group-row .pixel-data-grid__group-label.pixel-data-grid__cell-value',
    );
    expect(label).toBeTruthy();
  });
});

describe('PixelDataGridComponent inline edit validation', () => {
  interface EditRow {
    id: number;
    title: string;
    done: boolean;
    due: Date | null;
  }

  @Component({
    imports: [PixelDataGridComponent],
    template: `
      <pixel-data-grid
        [data]="rows()"
        [columns]="columns"
        [rowId]="rowIdFn"
        editable
      />
    `,
  })
  class EditHostComponent {
    readonly rows = signal<EditRow[]>([
      { id: 1, title: 'Task', done: false, due: new Date('2026-08-20') },
    ]);
    readonly rowIdFn = (row: EditRow): number => row.id;
    readonly columns: PixelDataGridColumn<EditRow>[] = [
      {
        field: 'title',
        header: 'Title',
        editable: true,
        validate: (value) => (String(value ?? '').trim() ? null : 'Title is required'),
      },
      {
        field: 'due',
        header: 'Due',
        editable: true,
        editor: 'date',
        validate: (value) => (value ? null : 'Due date is required'),
      },
      {
        field: 'done',
        header: 'Done',
        editable: true,
        editor: 'checkbox',
        validate: (value) => (value ? null : 'Must be checked'),
      },
    ];
  }

  it('keeps the cell in edit and shows control error chrome when validate fails', async () => {
    await TestBed.configureTestingModule({ imports: [EditHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(EditHostComponent);
    fixture.detectChanges();

    const titleCell = fixture.debugElement.query(By.css('[data-c="0"]'));
    titleCell.triggerEventHandler('dblclick', new MouseEvent('dblclick'));
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('pixel-input'));
    expect(input).toBeTruthy();
    input.componentInstance.valueChange.emit('');
    input.triggerEventHandler('blurChange', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pixel-data-grid__editor')).toBeTruthy();
    expect(input.componentInstance.errorOverride()).toBe('Title is required');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Title is required',
    );
  });
});

describe('pixel-data-grid utils', () => {
  it('gridHeaderLabel falls back to the field name', () => {
    expect(gridHeaderLabel({ field: 'foo' })).toBe('foo');
    expect(gridHeaderLabel({ field: 'foo', header: 'Foo' })).toBe('Foo');
  });

  it('formatGridCell renders an em dash for empty values', () => {
    expect(formatGridCell({ a: null }, { field: 'a' })).toBe('—');
    expect(formatGridCell({ a: '' }, { field: 'a' })).toBe('—');
  });

  it('formatGridCell honors a column valueFormatter', () => {
    expect(
      formatGridCell({ a: 5 }, { field: 'a', valueFormatter: (v) => `#${v}` }),
    ).toBe('#5');
  });

  it('formatGridCell formats date columns with formatDisplayDate locale', () => {
    expect(
      formatGridCell(
        { joined: '2026-08-19' },
        { field: 'joined', type: 'date' },
        { dateLocale: 'en-IN' },
      ),
    ).toMatch(/19/);
    expect(
      formatGridCell(
        { joined: '2026-08-19' },
        { field: 'joined', type: 'date' },
        { dateLocale: 'en-IN' },
      ),
    ).toMatch(/2026/);
  });

  it('compareGridValues sorts nullish first and numbers numerically', () => {
    expect(compareGridValues(null, 1)).toBeLessThan(0);
    expect(compareGridValues(2, 10)).toBeLessThan(0);
    expect(compareGridValues('b', 'a')).toBeGreaterThan(0);
  });

  it('parseGridDate treats YYYY-MM-DD as a local calendar day', () => {
    const date = parseGridDate('2020-01-15');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2020);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
  });

  it('matchesGridFilter compares dates by calendar day for equals / before / after', () => {
    const cell = new Date(2020, 0, 15);
    expect(matchesGridFilter(cell, { operator: 'equals', value: '2020-01-15' })).toBe(true);
    expect(matchesGridFilter(cell, { operator: 'before', value: '2020-01-16' })).toBe(true);
    expect(matchesGridFilter(cell, { operator: 'after', value: '2020-01-14' })).toBe(true);
    expect(matchesGridFilter(cell, { operator: 'equals', value: '2020-01-16' })).toBe(false);
  });
});

@Component({
  imports: [PixelDataGridComponent],
  template: `
    <pixel-data-grid
      [data]="rows()"
      [columns]="columns"
      [rowId]="rowIdFn"
      [clickableRows]="true"
      [rowQuickActions]="actions"
      [rowQuickActionsMaxVisible]="3"
      (rowClick)="clicks.push($event)"
      (rowQuickAction)="actionsFired.push($event)"
    />
  `,
})
class RowActionsHostComponent {
  readonly rows = signal<PersonRow[]>([...ROWS]);
  readonly clicks: PixelDataGridRowClickEvent<PersonRow>[] = [];
  readonly actionsFired: import('./pixel-data-grid.types').PixelDataGridRowQuickActionEvent<PersonRow>[] =
    [];
  readonly rowIdFn = (row: PersonRow): number => row.id;
  readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Name' },
    { field: 'age', header: 'Age', type: 'number' },
  ];
  readonly actions: import('./pixel-data-grid.types').PixelDataGridRowQuickAction<PersonRow>[] = [
    { id: 'archive', icon: 'archive', label: 'Archive' },
    { id: 'snooze', icon: 'snooze', label: 'Snooze' },
    { id: 'mark', icon: 'mark_email_read', label: 'Mark read' },
    { id: 'star', icon: 'star', label: 'Star' },
    { id: 'delete', icon: 'delete', label: 'Delete', danger: true },
  ];
}

describe('PixelDataGridComponent row quick actions', () => {
  let fixture: ComponentFixture<RowActionsHostComponent>;
  let host: RowActionsHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RowActionsHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(RowActionsHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a floating actions pill with maxVisible icons plus overflow trigger', () => {
    const pills = fixture.nativeElement.querySelectorAll('.pixel-data-grid__row-actions');
    expect(pills.length).toBe(3);
    const first = pills[0] as HTMLElement;
    // 3 visible icon buttons + ⋮ trigger
    expect(first.querySelectorAll('pixel-button').length).toBe(4);
    expect(first.querySelector('pixel-menu')).toBeTruthy();
  });

  it('emits rowQuickAction without rowClick when an action is pressed', () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-data-grid__row-actions pixel-button',
    ) as HTMLElement;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.actionsFired.length).toBe(1);
    expect(host.actionsFired[0].actionId).toBe('archive');
    expect(host.clicks.length).toBe(0);
  });

  it('moves hover ownership when the pointer enters another row', () => {
    const rows = fixture.nativeElement.querySelectorAll(
      '.pixel-data-grid__body .pixel-data-grid__row',
    ) as NodeListOf<HTMLElement>;
    expect(rows.length).toBeGreaterThanOrEqual(2);

    rows[0].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    fixture.detectChanges();
    expect(rows[0].classList.contains('pixel-data-grid__row--actions-hovered')).toBe(true);

    const focusTarget = rows[0].querySelector('pixel-button button, pixel-button') as HTMLElement | null;
    focusTarget?.focus?.();
    fixture.detectChanges();

    rows[0].dispatchEvent(
      new PointerEvent('pointerleave', { bubbles: true, relatedTarget: rows[1] }),
    );
    rows[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    fixture.detectChanges();

    expect(rows[0].classList.contains('pixel-data-grid__row--actions-hovered')).toBe(false);
    expect(rows[1].classList.contains('pixel-data-grid__row--actions-hovered')).toBe(true);
  });

  it('does not show another row pill while overflow menu is open', () => {
    const gridDebug = fixture.debugElement.query(By.directive(PixelDataGridComponent));
    const grid = gridDebug.componentInstance as unknown as {
      onRowActionsMenuOpenChange(rowKey: string | number, open: boolean): void;
    };
    const rows = fixture.nativeElement.querySelectorAll(
      '.pixel-data-grid__body .pixel-data-grid__row',
    ) as NodeListOf<HTMLElement>;

    const row0Key = rows[0].getAttribute('data-pixel-row-id')!;
    grid.onRowActionsMenuOpenChange(row0Key, true);
    fixture.detectChanges();
    expect(rows[0].classList.contains('pixel-data-grid__row--actions-menu-open')).toBe(true);

    rows[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    fixture.detectChanges();
    expect(rows[1].classList.contains('pixel-data-grid__row--actions-hovered')).toBe(false);
    expect(rows[0].classList.contains('pixel-data-grid__row--actions-hovered')).toBe(true);

    grid.onRowActionsMenuOpenChange(row0Key, false);
    fixture.detectChanges();
    rows[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    fixture.detectChanges();
    expect(rows[1].classList.contains('pixel-data-grid__row--actions-hovered')).toBe(true);
  });

  it('uses round icon buttons for declarative quick actions', () => {
    const native = fixture.nativeElement.querySelector(
      '.pixel-data-grid__row-actions pixel-button button',
    ) as HTMLElement | null;
    expect(native?.getAttribute('data-icon-shape')).toBe('circle');
    expect(native?.classList.contains('pixel-button--shape-square')).toBe(false);
  });
});
