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
import { compareGridValues, formatGridCell, gridHeaderLabel } from './pixel-data-grid.utils';

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
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(5);
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeFalsy();
  });

  it('shows a loading overlay when loadingMode="loader"', () => {
    host.loading.set(true);
    host.loadingMode.set('loader');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__row--skeleton')).toBeFalsy();
  });

  it('shows in-body skeleton rows by default when loading', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__head')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(5);
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeFalsy();
  });

  it('shows in-body skeleton rows when loading with loadingMode="skeleton"', () => {
    host.loading.set(true);
    host.loadingMode.set('skeleton');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__table')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.pixel-data-grid__row--skeleton').length).toBe(5);
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeFalsy();
  });

  it('reflects density on the host and container', () => {
    host.density.set('compact');
    fixture.detectChanges();
    const gridDebug = fixture.debugElement.query(By.directive(PixelDataGridComponent));
    expect(gridDebug.nativeElement.getAttribute('data-density')).toBe('compact');
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

  it('compareGridValues sorts nullish first and numbers numerically', () => {
    expect(compareGridValues(null, 1)).toBeLessThan(0);
    expect(compareGridValues(2, 10)).toBeLessThan(0);
    expect(compareGridValues('b', 'a')).toBeGreaterThan(0);
  });
});
