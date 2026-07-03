import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { PixelButtonComponent, PixelDataGridColumn, PixelDataGridComponent } from 'pixel-ui';

interface AssetRow {
  id: number;
  ticker: string;
  name: string;
  price: number;
  change: number;
}

function seedRows(): AssetRow[] {
  const data: [string, string][] = [
    ['AAPL', 'Apple'],
    ['MSFT', 'Microsoft'],
    ['GOOGL', 'Alphabet'],
    ['AMZN', 'Amazon'],
    ['NVDA', 'Nvidia'],
    ['META', 'Meta'],
    ['TSLA', 'Tesla'],
    ['NFLX', 'Netflix'],
  ];
  return data.map(([ticker, name], index) => ({
    id: index + 1,
    ticker,
    name,
    price: 100 + ((index * 137) % 400),
    change: ((index * 17) % 11) - 5,
  }));
}

@Component({
  selector: 'docs-data-grid-state-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelDataGridComponent],
  templateUrl: './data-grid-state.example.html',
  styleUrl: './data-grid-state.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridStateExample {
  private readonly grid = viewChild.required(PixelDataGridComponent);

  protected readonly rows = signal(seedRows());
  protected readonly savedState = signal<string | null>(null);
  protected readonly rowIdFn = (row: AssetRow): number => row.id;
  protected readonly columns: PixelDataGridColumn<AssetRow>[] = [
    { field: 'ticker', header: 'Ticker', sortable: true, width: '8rem' },
    { field: 'name', header: 'Name', sortable: true, width: '12rem' },
    { field: 'price', header: 'Price', sortable: true, type: 'number', align: 'end' },
    { field: 'change', header: 'Change', sortable: true, type: 'number', align: 'end' },
  ];

  protected save(): void {
    // Persist anywhere (localStorage, a profile API, …). Here we just keep the JSON in memory.
    this.savedState.set(this.grid().getStateJson(true));
  }

  protected restore(): void {
    const json = this.savedState();
    if (json) {
      this.grid().setStateFromJson(json);
    }
  }

  protected reset(): void {
    this.grid().resetColumns();
  }
}
