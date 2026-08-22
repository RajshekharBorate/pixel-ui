import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
  PixelDataGridCriteria,
  PixelDataGridDataSource,
  PixelDataGridFetchResult,
  compareGridValues,
} from 'pixel-ui/data-grid';

interface ServerRow {
  id: number;
  sku: string;
  warehouse: string;
  units: number;
}

function seedAll(count = 240): ServerRow[] {
  const warehouses = ['Berlin', 'Austin', 'Tokyo', 'São Paulo'];
  return Array.from({ length: count }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      sku: `SKU-${String(id).padStart(4, '0')}`,
      warehouse: warehouses[id % warehouses.length],
      units: (id * 53) % 500,
    };
  });
}

/** A fake backend: applies the grid criteria over an in-memory table with a simulated latency. */
class InMemoryDataSource implements PixelDataGridDataSource<ServerRow> {
  private readonly all = seedAll();

  fetch(criteria: PixelDataGridCriteria): Observable<PixelDataGridFetchResult<ServerRow>> {
    let rows = this.all;

    const term = criteria.quickFilter.trim().toLowerCase();
    if (term) {
      rows = rows.filter((row) => row.sku.toLowerCase().includes(term) || row.warehouse.toLowerCase().includes(term));
    }

    if (criteria.sort.length) {
      rows = [...rows].sort((a, b) => {
        for (const { field, direction } of criteria.sort) {
          const cmp =
            compareGridValues(
              (a as unknown as Record<string, unknown>)[field],
              (b as unknown as Record<string, unknown>)[field],
            ) * (direction === 'asc' ? 1 : -1);
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }

    const total = rows.length;
    const start = criteria.page.pageIndex * criteria.page.pageSize;
    const page = rows.slice(start, start + criteria.page.pageSize);
    return of({ rows: page, total }).pipe(delay(350));
  }
}

@Component({
  selector: 'docs-data-grid-data-source-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-data-source.example.html',
  styleUrl: './data-grid-data-source.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridDataSourceExample {
  protected readonly dataSource = new InMemoryDataSource();
  protected readonly rowIdFn = (row: ServerRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<ServerRow>[] = [
    { field: 'sku', header: 'SKU', sortable: true },
    { field: 'warehouse', header: 'Warehouse', sortable: true },
    { field: 'units', header: 'Units', sortable: true, type: 'number', align: 'end' },
  ];
}
