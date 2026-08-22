import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';

interface OrderRow {
  id: number;
  customer: string;
  region: 'NA' | 'EU' | 'APAC';
  amount: number;
  status: 'Paid' | 'Pending' | 'Refunded';
  placed: string;
}

function seedRows(count = 60): OrderRow[] {
  const regions: OrderRow['region'][] = ['NA', 'EU', 'APAC'];
  const statuses: OrderRow['status'][] = ['Paid', 'Pending', 'Refunded'];
  const customers = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Soylent', 'Wonka', 'Stark', 'Wayne'];
  return Array.from({ length: count }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      customer: `${customers[id % customers.length]} #${id}`,
      region: regions[id % regions.length],
      amount: ((id * 97) % 900) + 100,
      status: statuses[id % statuses.length],
      placed: new Date(2024, id % 12, (id % 27) + 1).toISOString().slice(0, 10),
    };
  });
}

@Component({
  selector: 'docs-data-grid-data-ops-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-data-ops.example.html',
  styleUrl: './data-grid-data-ops.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridDataOpsExample {
  protected readonly rows = signal(seedRows());
  protected readonly rowIdFn = (row: OrderRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<OrderRow>[] = [
    { field: 'customer', header: 'Customer', sortable: true, filter: { type: 'text', placeholder: 'Search customer' } },
    {
      field: 'region',
      header: 'Region',
      sortable: true,
      filter: {
        type: 'select',
        options: [
          { value: 'NA', label: 'North America' },
          { value: 'EU', label: 'Europe' },
          { value: 'APAC', label: 'APAC' },
        ],
      },
    },
    { field: 'amount', header: 'Amount', sortable: true, type: 'number', align: 'end', filter: { type: 'number' } },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      filter: {
        type: 'select',
        options: [
          { value: 'Paid', label: 'Paid' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Refunded', label: 'Refunded' },
        ],
      },
    },
    { field: 'placed', header: 'Placed', sortable: true, type: 'date', filter: { type: 'date' } },
  ];
}
