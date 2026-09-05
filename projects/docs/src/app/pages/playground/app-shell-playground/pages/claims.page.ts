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
  PixelDataGridColumn,
  PixelDataGridComponent,
  type PixelDataGridRowQuickAction,
} from 'pixel-ui/data-grid';
import {
  PixelAccessDirective,
  PixelAuthorizationService,
  PixelButtonComponent,
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
  imports: [PixelButtonComponent, PixelDataGridComponent, PixelAccessDirective],
  template: `
    <header class="page-head">
      <h1>Claims</h1>
      <p>
        Deep-link a row via the notification bell (TR-112) or the buttons below. Export and the
        amendment wizard respect the header role dropdown (Exporter / Admin).
      </p>
    </header>

    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="table_rows" (click)="revealClaim()">
        Reveal TR-112
      </pixel-button>
      <pixel-button
        appearance="outline"
        leadingIcon="wand_stars"
        pixelAccess="claims:amend"
        pixelAccessMode="disable"
        (click)="openAmendment()"
      >
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
      exportable
      exportAccess="claims:export"
      exportFileName="playground-claims"
      [rowQuickActions]="rowActions"
      analyticsId="claims"
    />

    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styleUrl: '../playground-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellClaimsPage {
  private readonly navigate = inject(PixelNavigateService);
  private readonly bridge = inject(AppShellPlaygroundNavBridge);
  private readonly auth = inject(PixelAuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly grid = viewChild(PixelDataGridComponent<ClaimRow>);

  readonly rows = signal(seedClaims());
  readonly pageIndex = model(0);
  readonly status = signal('');
  readonly rowIdFn = (row: ClaimRow) => row.id;

  readonly columns: readonly PixelDataGridColumn<ClaimRow>[] = [
    { field: 'id', header: 'ID', width: 112 },
    { field: 'title', header: 'Title' },
    { field: 'status', header: 'Status', width: 128 },
  ];

  readonly rowActions: readonly PixelDataGridRowQuickAction<ClaimRow>[] = [
    {
      id: 'amend',
      icon: 'edit_document',
      label: 'Amend',
      access: 'claims:amend',
    },
  ];

  constructor() {
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
    if (this.auth.authorize({ permission: 'claims:amend', action: 'edit' }).status !== 'allow') {
      this.status.set('Amendment denied — switch header role to Admin.');
      return;
    }
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
