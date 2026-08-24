import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
  type PixelDataGridRowQuickAction,
  type PixelDataGridRowQuickActionEvent,
} from 'pixel-ui/data-grid';

interface MailRow {
  id: number;
  from: string;
  subject: string;
  folder: string;
  labels: string;
  unread: boolean;
  starred: boolean;
  received: Date;
  sizeKb: number;
}

function seedRows(): MailRow[] {
  return [
    {
      id: 1,
      from: 'Ada Lovelace',
      subject: 'Analytical engine notes',
      folder: 'Inbox',
      labels: 'Work',
      unread: true,
      starred: true,
      received: new Date(2026, 7, 20),
      sizeKb: 48,
    },
    {
      id: 2,
      from: 'Grace Hopper',
      subject: 'COBOL release checklist',
      folder: 'Inbox',
      labels: 'Work, Urgent',
      unread: false,
      starred: false,
      received: new Date(2026, 7, 19),
      sizeKb: 112,
    },
    {
      id: 3,
      from: 'Alan Turing',
      subject: 'Enigma follow-up',
      folder: 'Updates',
      labels: 'Research',
      unread: true,
      starred: false,
      received: new Date(2026, 7, 18),
      sizeKb: 36,
    },
    {
      id: 4,
      from: 'Katherine Johnson',
      subject: 'Trajectory review',
      folder: 'Inbox',
      labels: 'Work',
      unread: false,
      starred: true,
      received: new Date(2026, 7, 17),
      sizeKb: 64,
    },
    {
      id: 5,
      from: 'Margaret Hamilton',
      subject: 'Apollo software freeze',
      folder: 'Sent',
      labels: 'Archive',
      unread: true,
      starred: false,
      received: new Date(2026, 7, 16),
      sizeKb: 220,
    },
    {
      id: 6,
      from: 'Dorothy Vaughan',
      subject: 'Fortran lab schedule',
      folder: 'Inbox',
      labels: 'Team',
      unread: false,
      starred: false,
      received: new Date(2026, 7, 15),
      sizeKb: 28,
    },
  ];
}

@Component({
  selector: 'docs-data-grid-row-quick-actions-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-row-quick-actions.example.html',
  styleUrl: './data-grid-row-quick-actions.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridRowQuickActionsExample {
  protected readonly rows = signal(seedRows());
  protected readonly lastAction = signal('');
  protected readonly rowIdFn = (row: MailRow): number => row.id;

  protected readonly columns: PixelDataGridColumn<MailRow>[] = [
    { field: 'from', header: 'From', minWidth: 140 },
    { field: 'subject', header: 'Subject', flex: 2, minWidth: 180 },
    { field: 'folder', header: 'Folder', minWidth: 100 },
    { field: 'labels', header: 'Labels', minWidth: 120 },
    { field: 'unread', header: 'Unread', type: 'boolean', align: 'center', width: 88 },
    { field: 'starred', header: 'Starred', type: 'boolean', align: 'center', width: 88 },
    { field: 'received', header: 'Received', type: 'date', width: 120 },
    { field: 'sizeKb', header: 'Size (KB)', type: 'number', align: 'end', width: 100 },
  ];

  protected readonly rowQuickActions: readonly PixelDataGridRowQuickAction<MailRow>[] = [
    { id: 'archive', icon: 'archive', label: 'Archive' },
    { id: 'snooze', icon: 'snooze', label: 'Snooze' },
    { id: 'mark', icon: 'mark_email_read', label: 'Mark read' },
    { id: 'star', icon: 'star', label: 'Star' },
    { id: 'delete', icon: 'delete', label: 'Delete', danger: true },
  ];

  protected onQuickAction(event: PixelDataGridRowQuickActionEvent<MailRow>): void {
    this.lastAction.set(`${event.actionId} → ${event.row.subject}`);
    if (event.actionId === 'delete') {
      this.rows.update((rows) => rows.filter((row) => row.id !== event.row.id));
    }
    if (event.actionId === 'mark') {
      this.rows.update((rows) =>
        rows.map((row) => (row.id === event.row.id ? { ...row, unread: false } : row)),
      );
    }
    if (event.actionId === 'star') {
      this.rows.update((rows) =>
        rows.map((row) =>
          row.id === event.row.id ? { ...row, starred: !row.starred } : row,
        ),
      );
    }
  }
}
