import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelDataGridComponent from './pixel-data-grid';
import PixelDataGridCellDirective from './pixel-data-grid-cell.directive';
import type { PixelDataGridColumn, PixelDataGridRowClickEvent } from './pixel-data-grid.types';
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

  it('shows a skeleton instead of the table when showSkeleton is set', () => {
    host.skeleton.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__skeleton')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__table')).toBeFalsy();
  });

  it('shows a loading overlay when loading is set', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__loading')).toBeTruthy();
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
