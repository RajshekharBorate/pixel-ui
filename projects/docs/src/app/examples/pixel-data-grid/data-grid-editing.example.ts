import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PixelDataGridCellEditEvent,
  PixelDataGridColumn,
  PixelDataGridComponent,
  type PixelDataGridDensity,
} from 'pixel-ui/data-grid';

interface TaskRow {
  id: number;
  title: string;
  estimate: number;
  status: 'Todo' | 'Doing' | 'Done';
  dueDate: Date | null;
  done: boolean;
}

function seedRows(): TaskRow[] {
  const statuses: TaskRow['status'][] = ['Todo', 'Doing', 'Done'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 8 }, (_unused, index) => {
    const id = index + 1;
    const due = new Date(today);
    due.setDate(today.getDate() + id);
    return {
      id,
      title: `Task ${id}`,
      estimate: (id * 2) % 13,
      status: statuses[id % statuses.length],
      dueDate: due,
      done: id % 4 === 0,
    };
  });
}

@Component({
  selector: 'docs-data-grid-editing-example',
  imports: [PixelButtonComponent, PixelDataGridComponent],
  templateUrl: './data-grid-editing.example.html',
  styleUrl: './data-grid-editing.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridEditingExample {
  protected readonly rows = signal(seedRows());
  protected readonly lastEdit = signal('');
  protected readonly density = signal<PixelDataGridDensity>('standard');
  protected readonly densities: readonly { value: PixelDataGridDensity; label: string }[] = [
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'standard', label: 'Standard' },
    { value: 'compact', label: 'Compact' },
  ];
  protected readonly rowIdFn = (row: TaskRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<TaskRow>[] = [
    {
      field: 'title',
      header: 'Title',
      sortable: true,
      editable: true,
      validate: (value) => (String(value ?? '').trim() ? null : 'Title is required'),
    },
    {
      field: 'estimate',
      header: 'Estimate (pts)',
      type: 'number',
      align: 'end',
      editable: true,
      editor: 'number',
      validate: (value) => (Number(value) >= 0 ? null : 'Must be ≥ 0'),
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      editable: true,
      editor: 'select',
      editorOptions: [
        { value: 'Todo', label: 'Todo' },
        { value: 'Doing', label: 'Doing' },
        { value: 'Done', label: 'Done' },
      ],
      validate: (value, row) =>
        value === 'Done' && !row.done ? 'Mark Done before setting status to Done' : null,
    },
    {
      field: 'dueDate',
      header: 'Due',
      type: 'date',
      editable: true,
      editor: 'date',
      validate: (value) => (value ? null : 'Due date is required'),
    },
    {
      field: 'done',
      header: 'Done',
      type: 'boolean',
      align: 'center',
      editable: true,
      editor: 'checkbox',
      validate: (value, row) =>
        row.status === 'Done' && !value ? 'Completed tasks must stay checked' : null,
    },
  ];

  protected onCellEdit(event: PixelDataGridCellEditEvent<TaskRow>): void {
    const format = (value: unknown): string => {
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
      }
      return String(value);
    };
    this.lastEdit.set(`${event.field}: ${format(event.oldValue)} → ${format(event.newValue)}`);
  }
}
