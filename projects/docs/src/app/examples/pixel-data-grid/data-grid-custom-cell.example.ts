import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelDataGridCellDirective,
  PixelDataGridCellOverflowDirective,
  PixelDataGridCellRowDirective,
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui';
import { withLongDemoLabel } from './data-grid-demo-data';

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
    name: withLongDemoLabel(name, index),
    team: withLongDemoLabel(teams[index % teams.length], index, 2),
    active: index % 2 === 0,
  }));
}

@Component({
  selector: 'docs-data-grid-custom-cell-example',
  imports: [
    PixelDataGridComponent,
    PixelDataGridCellDirective,
    PixelDataGridCellOverflowDirective,
    PixelDataGridCellRowDirective,
  ],
  templateUrl: './data-grid-custom-cell.example.html',
  styleUrl: './data-grid-custom-cell.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridCustomCellExample {
  protected readonly rows = signal(seedRows());
  protected readonly rowIdFn = (row: PersonRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<PersonRow>[] = [
    { field: 'name', header: 'Member', flex: 2, minWidth: 120, maxWidth: 320 },
    { field: 'team', header: 'Team', flex: 1, minWidth: 100, maxWidth: 240 },
    { field: 'active', header: 'Status', align: 'center', width: '6.5rem' },
  ];
}
