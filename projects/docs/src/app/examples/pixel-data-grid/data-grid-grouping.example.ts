import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface SaleRow {
  id: number;
  region: 'NA' | 'EU' | 'APAC';
  rep: string;
  product: string;
  units: number;
  revenue: number;
}

function seedRows(): SaleRow[] {
  const regions: SaleRow['region'][] = ['NA', 'EU', 'APAC'];
  const reps = ['A. Sharma', 'J. Doe', 'M. Patel', 'R. Khan'];
  const products = ['Starter', 'Pro', 'Enterprise'];
  return Array.from({ length: 60 }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      region: regions[id % regions.length],
      rep: reps[id % reps.length],
      // Decorrelated from region so each region nests multiple products.
      product: products[Math.floor(index / 3) % products.length],
      units: (id * 3) % 40,
      revenue: ((id * 197) % 9000) + 500,
    };
  });
}

@Component({
  selector: 'docs-data-grid-grouping-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-grouping.example.html',
  styleUrl: './data-grid-grouping.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridGroupingExample {
  protected readonly rows = signal(seedRows());
  protected readonly rowIdFn = (row: SaleRow): number => row.id;
  protected readonly groupBy = ['region', 'product'];
  protected readonly columns: PixelDataGridColumn<SaleRow>[] = [
    { field: 'region', header: 'Region', sortable: true, width: '16rem' },
    { field: 'product', header: 'Product', sortable: true },
    { field: 'rep', header: 'Rep', sortable: true },
    { field: 'units', header: 'Units', type: 'number', align: 'end', aggregate: 'sum' },
    { field: 'revenue', header: 'Revenue', type: 'number', align: 'end', aggregate: 'sum' },
  ];
}
