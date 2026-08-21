import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';

interface EmployeeRow {
  id: number;
  name: string;
  title: string;
  department: string;
  location: string;
  salary: number;
  startDate: string;
}

function seedRows(count = 40): EmployeeRow[] {
  const titles = ['Engineer', 'Designer', 'Manager', 'Analyst', 'Lead'];
  const depts = ['Platform', 'Growth', 'Finance', 'People', 'Sales'];
  const cities = ['Berlin', 'Austin', 'Tokyo', 'Lisbon', 'Toronto'];
  return Array.from({ length: count }, (_unused, index) => {
    const id = index + 1;
    return {
      id,
      name: `Employee ${String(id).padStart(2, '0')}`,
      title: titles[id % titles.length],
      department: depts[id % depts.length],
      location: cities[id % cities.length],
      salary: 60000 + ((id * 3137) % 90000),
      startDate: new Date(2018 + (id % 6), id % 12, (id % 27) + 1).toISOString().slice(0, 10),
    };
  });
}

@Component({
  selector: 'docs-data-grid-columns-example',
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-columns.example.html',
  styleUrl: './data-grid-columns.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridColumnsExample {
  protected readonly rows = signal(seedRows());
  protected readonly rowIdFn = (row: EmployeeRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<EmployeeRow>[] = [
    { field: 'name', header: 'Name', sortable: true, width: '14rem', pinned: 'left', lockVisible: true },
    { field: 'title', header: 'Title', sortable: true, width: '10rem' },
    { field: 'department', header: 'Department', sortable: true, width: '11rem' },
    { field: 'location', header: 'Location', sortable: true, width: '10rem' },
    { field: 'salary', header: 'Salary', sortable: true, type: 'number', align: 'end', width: '9rem' },
    { field: 'startDate', header: 'Start date', sortable: true, type: 'date', width: '10rem', pinned: 'right' },
  ];
}
