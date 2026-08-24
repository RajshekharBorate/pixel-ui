import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelCardComponent,
  PixelExportService,
  PixelInputComponent,
  type PixelExportColumn,
} from 'pixel-ui';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';

interface ProductRow {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  active: boolean;
  updated: Date;
}

const SEED: readonly ProductRow[] = [
  {
    id: 1,
    name: 'Pixel Hub License',
    sku: 'HUB-100',
    category: 'Software',
    stock: 120,
    active: true,
    updated: new Date(2026, 5, 12),
  },
  {
    id: 2,
    name: 'Sensor Kit Pro',
    sku: 'SEN-220',
    category: 'Hardware',
    stock: 8,
    active: true,
    updated: new Date(2026, 6, 2),
  },
  {
    id: 3,
    name: 'Support Retainer',
    sku: 'SUP-010',
    category: 'Services',
    stock: 0,
    active: false,
    updated: new Date(2026, 4, 28),
  },
  {
    id: 4,
    name: 'Analytics Add-on',
    sku: 'ANA-050',
    category: 'Software',
    stock: 45,
    active: true,
    updated: new Date(2026, 7, 1),
  },
  {
    id: 5,
    name: 'Field Gateway',
    sku: 'GWY-300',
    category: 'Hardware',
    stock: 3,
    active: true,
    updated: new Date(2026, 7, 10),
  },
];

/**
 * Phase 1 multi-agent dry-run page: Products management composed from Pixel UI only.
 * Route: `/playground/products`
 */
@Component({
  selector: 'docs-products-playground',
  imports: [
    PixelButtonComponent,
    PixelCardComponent,
    PixelInputComponent,
    PixelDataGridComponent,
  ],
  templateUrl: './products-playground.html',
  styleUrl: './products-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPlaygroundComponent {
  private readonly exporter = inject(PixelExportService);

  protected readonly loading = signal(true);
  protected readonly query = signal('');
  protected readonly allRows = signal<ProductRow[]>([...SEED]);

  protected readonly filteredRows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const rows = this.allRows();
    if (!q) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q),
    );
  });

  protected readonly totalCount = computed(() => this.allRows().length);
  protected readonly activeCount = computed(
    () => this.allRows().filter((row) => row.active).length,
  );
  protected readonly lowStockCount = computed(
    () => this.allRows().filter((row) => row.stock > 0 && row.stock < 10).length,
  );

  protected readonly rowIdFn = (row: ProductRow): number => row.id;

  protected readonly columns: PixelDataGridColumn<ProductRow>[] = [
    { field: 'name', header: 'Product' },
    { field: 'sku', header: 'SKU' },
    { field: 'category', header: 'Category' },
    { field: 'stock', header: 'Stock', type: 'number', align: 'end' },
    { field: 'active', header: 'Active', type: 'boolean', align: 'center' },
    { field: 'updated', header: 'Updated', type: 'date' },
  ];

  private readonly exportColumns: PixelExportColumn[] = [
    { key: 'name', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    { key: 'category', header: 'Category' },
    { key: 'stock', header: 'Stock' },
    { key: 'active', header: 'Active' },
  ];

  constructor() {
    window.setTimeout(() => this.loading.set(false), 900);
  }

  protected onSearch(value: string): void {
    this.query.set(value);
  }

  protected exportCsv(): void {
    this.exporter.exportTable(this.filteredRows(), this.exportColumns, 'csv', {
      fileName: 'products',
    });
  }

  protected simulateEmpty(): void {
    this.allRows.set([]);
    this.query.set('');
  }

  protected resetSeed(): void {
    this.allRows.set([...SEED]);
  }
}
