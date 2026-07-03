import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface PersonRow {
  id: number;
  name: string;
  team: string;
  age: number;
  active: boolean;
  joined: Date;
}

function seedRows(): PersonRow[] {
  const teams = ['Platform', 'Growth', 'Billing', 'Mobile'];
  const names = ['Ada Lovelace', 'Linus T.', 'Grace Hopper', 'Alan T.', 'Margaret H.', 'Katherine J.'];
  return names.map((name, index) => ({
    id: index + 1,
    name,
    team: teams[index % teams.length],
    age: 28 + ((index * 7) % 30),
    active: index % 3 !== 0,
    joined: new Date(2019 + (index % 5), (index * 3) % 12, ((index * 5) % 27) + 1),
  }));
}

@Component({
  selector: 'docs-data-grid-basic-example',
  standalone: true,
  imports: [PixelDataGridComponent],
  templateUrl: './data-grid-basic.example.html',
  styleUrl: './data-grid-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridBasicExample {
  protected readonly rows = signal(seedRows());
  protected readonly rowIdFn = (row: PersonRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Name', width: '14rem' },
    { field: 'team', header: 'Team' },
    { field: 'age', header: 'Age', type: 'number', align: 'end' },
    { field: 'active', header: 'Active', type: 'boolean', align: 'center' },
    { field: 'joined', header: 'Joined', type: 'date' },
  ];
}
