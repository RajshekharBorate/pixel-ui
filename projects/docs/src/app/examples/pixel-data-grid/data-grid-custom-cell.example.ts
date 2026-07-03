import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridCellDirective,
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui';

interface PersonRow {
  id: number;
  name: string;
  team: string;
  active: boolean;
}

function seedRows(): PersonRow[] {
  const teams = ['Platform', 'Growth', 'Billing', 'Mobile'];
  const names = ['Ada Lovelace', 'Linus T.', 'Grace Hopper', 'Alan T.', 'Margaret H.'];
  return names.map((name, index) => ({
    id: index + 1,
    name,
    team: teams[index % teams.length],
    active: index % 2 === 0,
  }));
}

@Component({
  selector: 'docs-data-grid-custom-cell-example',
  standalone: true,
  imports: [PixelDataGridComponent, PixelDataGridCellDirective],
  templateUrl: './data-grid-custom-cell.example.html',
  styleUrl: './data-grid-custom-cell.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridCustomCellExample {
  protected readonly rows = signal(seedRows());
  protected readonly rowIdFn = (row: PersonRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Member', width: '16rem' },
    { field: 'team', header: 'Team' },
    { field: 'active', header: 'Status', align: 'center' },
  ];
}
