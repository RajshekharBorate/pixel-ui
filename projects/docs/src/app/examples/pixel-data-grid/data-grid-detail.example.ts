import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
  PixelDataGridDetailDirective,
} from 'pixel-ui/data-grid';
import { withLongDemoLabel } from './data-grid-demo-data';

interface TicketRow {
  id: number;
  ref: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  description: string;
}

function seedRows(): TicketRow[] {
  const priorities: TicketRow['priority'][] = ['Low', 'Medium', 'High'];
  const people = ['Ada', 'Linus', 'Grace', 'Alan'];
  return Array.from({ length: 8 }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      ref: `TICK-${100 + id}`,
      subject: withLongDemoLabel(`Issue with module ${id}`, index),
      priority: priorities[id % priorities.length],
      assignee: people[id % people.length],
      description:
        'Detailed context for this ticket: reproduction steps, environment, and the latest update from the assignee live here in the expandable detail row.',
    };
  });
}

@Component({
  selector: 'docs-data-grid-detail-example',
  imports: [PixelDataGridComponent, PixelDataGridDetailDirective],
  templateUrl: './data-grid-detail.example.html',
  styleUrl: './data-grid-detail.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridDetailExample {
  protected readonly rows = signal(seedRows());
  protected readonly rowIdFn = (row: TicketRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<TicketRow>[] = [
    { field: 'ref', header: 'Ref', sortable: true, width: '9rem' },
    { field: 'subject', header: 'Subject', sortable: true },
    { field: 'priority', header: 'Priority', sortable: true },
    { field: 'assignee', header: 'Assignee', sortable: true },
  ];
}
