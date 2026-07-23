import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelDataGridColumn,
  PixelDataGridComponent,
  PixelNavigateService,
} from 'pixel-ui';
import { AppShellPlaygroundNavBridge } from '../app-shell-playground-nav.bridge';

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
  selector: 'docs-app-shell-claims-page',
  imports: [PixelButtonComponent, PixelDataGridComponent],
  template: `
    <header class="page-head">
      <h1>Claims</h1>
      <p>
        Deep-link a row via the notification bell (TR-112) or the buttons below. The grid registers
        with <code>PixelNavigateService</code> through the playground nav bridge.
      </p>
    </header>

    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="table_rows" (click)="revealClaim()">
        Reveal TR-112
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="wand_stars" (click)="openAmendment()">
        Open amendment wizard (Documents)
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
    :host {
      display: block;
    }
    .page-head {
      margin-block-end: 1rem;
    }
    .page-head h1 {
      margin: 0 0 0.35rem;
      font-size: 1.5rem;
    }
    .page-head p {
      margin: 0;
      max-inline-size: 40rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }
    .info {
      margin: 0.75rem 0 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-on-surface-variant, #444);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellClaimsPage {
  private readonly navigate = inject(PixelNavigateService);
  private readonly bridge = inject(AppShellPlaygroundNavBridge);
  private readonly destroyRef = inject(DestroyRef);
  private readonly grid = viewChild(PixelDataGridComponent<ClaimRow>);

  readonly rows = signal(seedClaims());
  readonly pageIndex = model(0);
  readonly status = signal('');
  readonly rowIdFn = (row: ClaimRow) => row.id;

  readonly columns: readonly PixelDataGridColumn<ClaimRow>[] = [
    { field: 'id', header: 'ID', width: '7rem' },
    { field: 'title', header: 'Title' },
    { field: 'status', header: 'Status', width: '8rem' },
  ];

  constructor() {
    // Defer until viewChild is ready.
    queueMicrotask(() => this.bindGrid());
    this.destroyRef.onDestroy(() => this.bridge.setGrid(null));
  }

  private bindGrid(): void {
    const grid = this.grid();
    if (!grid) {
      requestAnimationFrame(() => this.bindGrid());
      return;
    }
    this.bridge.setGrid({
      revealRow: (rowId, options) => grid.revealRow(rowId, options),
    });
  }

  async revealClaim(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-112', select: true },
      behavior: 'smooth',
      onFailure: 'silent',
      announce: 'Revealed claim TR-112',
    });
    this.status.set(
      result.ok ? 'Highlighted TR-112.' : `${result.reason}: ${result.message}`,
    );
  }

  async openAmendment(): Promise<void> {
    const result = await this.navigate.go({
      route: ['/playground/app-shell/claims'],
      target: { type: 'wizard', id: 'claim-amendment', step: 'documents' },
      syncUrl: true,
      onFailure: 'silent',
      announce: 'Opened claim amendment wizard',
    });
    this.status.set(
      result.ok ? 'Wizard opened on Documents.' : `${result.reason}: ${result.message}`,
    );
  }
}
