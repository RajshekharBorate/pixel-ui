import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';

interface EventRow {
  id: number;
  ref: string;
  user: string;
  action: string;
  ip: string;
  at: string;
}

function seedRows(count: number): EventRow[] {
  const users = ['ada', 'linus', 'grace', 'alan', 'margaret', 'katherine'];
  const actions = ['login', 'logout', 'create', 'update', 'delete', 'export'];
  return Array.from({ length: count }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      ref: `EVT-${String(id).padStart(6, '0')}`,
      user: users[id % users.length],
      action: actions[id % actions.length],
      ip: `10.0.${id % 255}.${(id * 7) % 255}`,
      at: new Date(Date.now() - id * 60000).toISOString().slice(0, 16).replace('T', ' '),
    };
  });
}

@Component({
  selector: 'docs-data-grid-virtual-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-virtual.example.html',
  styleUrl: './data-grid-virtual.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridVirtualExample {
  protected readonly rows = signal(seedRows(50000));
  protected readonly rowIdFn = (row: EventRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<EventRow>[] = [
    { field: 'ref', header: 'Reference', sortable: true, pinned: 'left' },
    { field: 'user', header: 'User', sortable: true },
    { field: 'action', header: 'Action', sortable: true },
    { field: 'ip', header: 'IP address' },
    { field: 'at', header: 'Timestamp', sortable: true },
  ];
}
