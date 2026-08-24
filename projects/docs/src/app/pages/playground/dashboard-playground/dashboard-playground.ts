import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelCardComponent,
  PixelEmptyStateComponent,
} from 'pixel-ui';
import { PixelChartSparklineComponent } from 'pixel-ui/charts';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';

interface ActivityRow {
  id: number;
  account: string;
  event: string;
  amount: number;
  trend: readonly number[];
  when: Date;
}

const SEED: readonly ActivityRow[] = [
  {
    id: 1,
    account: 'Acme Ops',
    event: 'Invoice paid',
    amount: 4200,
    trend: [12, 14, 13, 16, 18, 17, 19, 22],
    when: new Date(2026, 7, 20),
  },
  {
    id: 2,
    account: 'Northwind',
    event: 'Seat upgrade',
    amount: 890,
    trend: [8, 9, 11, 10, 12, 14, 13, 15],
    when: new Date(2026, 7, 19),
  },
  {
    id: 3,
    account: 'Contoso',
    event: 'Churn risk',
    amount: -120,
    trend: [20, 18, 17, 15, 14, 12, 11, 9],
    when: new Date(2026, 7, 18),
  },
  {
    id: 4,
    account: 'Fabrikam',
    event: 'Expansion',
    amount: 2100,
    trend: [5, 6, 6, 8, 9, 11, 12, 14],
    when: new Date(2026, 7, 17),
  },
];

/**
 * Phase 2 golden PAGE: operations dashboard with KPI cards, sparklines, and activity grid.
 * Route: `/playground/dashboard`
 */
@Component({
  selector: 'docs-dashboard-playground',
  imports: [
    PixelButtonComponent,
    PixelCardComponent,
    PixelChartSparklineComponent,
    PixelDataGridComponent,
    PixelEmptyStateComponent,
  ],
  templateUrl: './dashboard-playground.html',
  styleUrl: './dashboard-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPlaygroundComponent {
  protected readonly loading = signal(true);
  protected readonly rows = signal<ActivityRow[]>([...SEED]);

  protected readonly mrr = computed(() =>
    this.rows().reduce((sum, row) => sum + Math.max(row.amount, 0), 0),
  );
  protected readonly activeAccounts = computed(() => this.rows().length);
  protected readonly riskCount = computed(
    () => this.rows().filter((row) => row.amount < 0).length,
  );

  protected readonly revenueTrend = [12, 14, 13, 16, 18, 17, 19, 22, 21, 24, 26, 28];
  protected readonly seatsTrend = [40, 41, 42, 44, 43, 45, 47, 48, 49, 51, 52, 54];
  protected readonly riskTrend = [8, 9, 8, 10, 11, 9, 8, 7, 6, 7, 5, 4];

  protected readonly rowIdFn = (row: ActivityRow): number => row.id;

  protected readonly columns: PixelDataGridColumn<ActivityRow>[] = [
    { field: 'account', header: 'Account' },
    { field: 'event', header: 'Event' },
    { field: 'amount', header: 'Amount', type: 'number', align: 'end' },
    { field: 'when', header: 'When', type: 'date' },
  ];

  constructor() {
    window.setTimeout(() => this.loading.set(false), 700);
  }

  protected clearActivity(): void {
    this.rows.set([]);
  }

  protected resetSeed(): void {
    this.rows.set([...SEED]);
  }
}
