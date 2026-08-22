import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
} from 'pixel-ui/data-grid';
import {
  PixelButtonComponent,
  PixelNavigateService,
} from 'pixel-ui';

interface ClaimRow {
  id: string;
  title: string;
  status: string;
}

function seedClaims(): ClaimRow[] {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `TR-${100 + index}`,
    title: `Claim ${index + 1}`,
    status: index % 3 === 0 ? 'Open' : index % 3 === 1 ? 'Review' : 'Closed',
  }));
}

@Component({
  selector: 'docs-navigate-grid-example',
  imports: [PixelButtonComponent, PixelDataGridComponent],
  template: `
    <p class="hint">
      Register the grid with <code>registerGrid</code>, then deep-link a row. Client paging jumps
      to the page that contains the id and highlights it.
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="table_rows" (click)="revealClaim()">
        Reveal TR-112
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="link" (click)="copyLink()">
        Copy row link
      </pixel-button>
    </div>

    <pixel-data-grid
      [data]="rows()"
      [columns]="columns"
      [rowId]="rowIdFn"
      [paginated]="true"
      [pageSize]="5"
      [(pageIndex)]="pageIndex"
      selectionMode="single"
      density="compact"
    />

    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: `
    .hint,
    .info {
      margin: 0 0 0.75rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigateGridExample {
  private readonly navigate = inject(PixelNavigateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly grid = viewChild.required(PixelDataGridComponent);

  readonly rows = signal(seedClaims());
  readonly pageIndex = model(0);
  readonly status = signal('');
  readonly rowIdFn = (row: ClaimRow): string => row.id;
  readonly columns: PixelDataGridColumn<ClaimRow>[] = [
    { field: 'id', header: 'ID', width: 112 },
    { field: 'title', header: 'Title' },
    { field: 'status', header: 'Status', width: 112 },
  ];

  constructor() {
    afterNextRender(() => {
      const unsub = this.navigate.registerGrid('claims', {
        revealRow: (rowId, options) => this.grid().revealRow(rowId, options),
      });
      this.destroyRef.onDestroy(unsub);
    });
  }

  async revealClaim(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-112' },
      onFailure: 'silent',
      announce: 'Located claim TR-112',
    });
    this.status.set(
      result.ok ? 'TR-112 revealed (paged + highlighted).' : `${result.reason}: ${result.message}`,
    );
  }

  async copyLink(): Promise<void> {
    await this.navigate.copyLink({
      route: ['claims'],
      grid: 'claims',
      row: 'TR-112',
      target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-112' },
    });
    this.status.set('Copied link with ?grid=&row= (and nav blob).');
  }
}
