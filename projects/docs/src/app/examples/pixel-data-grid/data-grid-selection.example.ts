import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';

interface InvoiceRow {
  id: number;
  number: string;
  client: string;
  amount: number;
  status: 'Paid' | 'Open' | 'Overdue';
  due: string;
}

function seedRows(count = 40): InvoiceRow[] {
  const clients = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Soylent', 'Wonka'];
  const statuses: InvoiceRow['status'][] = ['Paid', 'Open', 'Overdue'];
  return Array.from({ length: count }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      number: `INV-${String(1000 + id)}`,
      client: clients[id % clients.length],
      amount: ((id * 197) % 9000) + 500,
      status: statuses[id % statuses.length],
      due: new Date(2024, id % 12, (id % 27) + 1).toISOString().slice(0, 10),
    };
  });
}

@Component({
  selector: 'docs-data-grid-selection-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-selection.example.html',
  styleUrl: './data-grid-selection.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridSelectionExample {
  protected readonly rows = signal(seedRows());
  protected readonly selected = signal<InvoiceRow[]>([]);
  protected readonly rowIdFn = (row: InvoiceRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<InvoiceRow>[] = [
    { field: 'number', header: 'Invoice', sortable: true },
    { field: 'client', header: 'Client', sortable: true },
    { field: 'amount', header: 'Amount', sortable: true, type: 'number', align: 'end' },
    { field: 'status', header: 'Status', sortable: true },
    { field: 'due', header: 'Due', sortable: true, type: 'date' },
  ];
}
