import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridCellEditEvent,
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';

interface TaskRow {
  id: number;
  title: string;
  estimate: number;
  status: 'Todo' | 'Doing' | 'Done';
  done: boolean;
}

function seedRows(): TaskRow[] {
  const statuses: TaskRow['status'][] = ['Todo', 'Doing', 'Done'];
  return Array.from({ length: 8 }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      title: `Task ${id}`,
      estimate: (id * 2) % 13,
      status: statuses[id % statuses.length],
      done: id % 4 === 0,
    };
  });
}

@Component({
  selector: 'docs-data-grid-editing-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-editing.example.html',
  styleUrl: './data-grid-editing.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridEditingExample {
  protected readonly rows = signal(seedRows());
  protected readonly lastEdit = signal('');
  protected readonly rowIdFn = (row: TaskRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<TaskRow>[] = [
    {
      field: 'title',
      header: 'Title',
      sortable: true,
      width: '16rem',
      editable: true,
      validate: (value) => (String(value).trim() ? null : 'Title is required'),
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
    },
    { field: 'done', header: 'Done', type: 'boolean', align: 'center', editable: true, editor: 'checkbox' },
  ];

  protected onCellEdit(event: PixelDataGridCellEditEvent<TaskRow>): void {
    this.lastEdit.set(`${event.field}: ${event.oldValue} → ${event.newValue}`);
  }
}
