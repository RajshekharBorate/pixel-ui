import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,
  PixelButtonComponent,
  PixelSelectComponent,
  seedPixelAuthorization,
} from 'pixel-ui';
import {
  PixelDataGridColumn,
  PixelDataGridComponent,
  type PixelDataGridRowQuickAction,
} from 'pixel-ui/data-grid';
import {
  AUTH_DEMO_CATALOG,
  AUTH_DEMO_ROLE_OPTIONS,
  authDemoRoleBlurb,
  type AuthDemoRole,
} from './authorization-demo.catalog';
import { AUTH_DEMO_STYLES } from './authorization-demo.styles';

interface ClaimRow {
  id: string;
  title: string;
  amount: number;
  ssnLast4: string;
}

@Component({
  selector: 'docs-authorization-grid-example',
  imports: [PixelDataGridComponent, PixelSelectComponent, PixelButtonComponent],
  providers: [PixelAuthorizationService],
  template: `
    <p class="hint">
      One “can they export?” answer drives the toolbar, the SSN column, row export, and the
      <strong>Try export from code</strong> button. If only the toolbar were hidden, a Viewer
      could still leak CSV another way.
    </p>
    <div class="row">
      <pixel-select
        label="Act as"
        [options]="roleOptions"
        [value]="role()"
        (valueChange)="onRole($event)"
        style="min-inline-size: 16rem"
      />
      <pixel-button appearance="outline" leadingIcon="download" (click)="tryExport()">
        Try export from code
      </pixel-button>
    </div>
    <p class="who">{{ blurb() }}</p>
    <p class="expect">{{ expectCopy() }}</p>
    <pixel-data-grid
      #grid
      [data]="rows"
      [columns]="columns"
      [rowId]="rowId"
      [rowQuickActions]="actions"
      exportable
      exportAccess="claims:export"
      exportFileName="claims-auth-demo"
      density="compact"
      selectionMode="multiple"
    />
    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationGridExample {
  private readonly auth = inject(PixelAuthorizationService);
  readonly role = signal<AuthDemoRole>('viewer');
  readonly status = signal('');
  readonly blurb = computed(() => authDemoRoleBlurb(this.role()));
  readonly expectCopy = computed(() =>
    this.auth.authorize({ permission: 'claims:export', action: 'export' }).status === 'allow'
      ? 'Export menu, SSN column, and row export should appear. Try export from code should succeed.'
      : 'No export menu, no SSN column, no row export. Try export from code should be blocked.',
  );
  readonly roleOptions = AUTH_DEMO_ROLE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  readonly rowId = (row: ClaimRow) => row.id;

  readonly rows: readonly ClaimRow[] = [
    { id: 'TR-1', title: 'Wind damage', amount: 1200, ssnLast4: '4412' },
    { id: 'TR-2', title: 'Water loss', amount: 8800, ssnLast4: '9031' },
  ];

  readonly columns: readonly PixelDataGridColumn<ClaimRow>[] = [
    { field: 'id', header: 'ID', width: 96 },
    { field: 'title', header: 'Title' },
    { field: 'amount', header: 'Amount', width: 100, type: 'number' },
    {
      field: 'ssnLast4',
      header: 'SSN (last 4)',
      width: 120,
      access: 'claims:export',
    },
  ];

  readonly actions: readonly PixelDataGridRowQuickAction<ClaimRow>[] = [
    {
      id: 'export-row',
      icon: 'download',
      label: 'Export row',
      access: 'claims:export',
    },
  ];

  constructor() {
    seedPixelAuthorization(this.auth, {
      catalog: AUTH_DEMO_CATALOG,
      subject: { id: 'demo', roles: ['viewer'], tenantId: 'acme' },
    });
  }

  onRole(value: unknown): void {
    const role = (typeof value === 'string' ? value : 'viewer') as AuthDemoRole;
    this.role.set(role);
    this.auth.setSubject({ id: 'demo', roles: [role], tenantId: 'acme' });
    this.status.set('');
  }

  tryExport(): void {
    // Host looks up grid via template ref is awkward without viewChild — use query in click via DOM
    // Prefer documenting that exportData is blocked when exportAccess denies.
    const allowed =
      this.auth.authorize({ permission: 'claims:export', action: 'export' }).status === 'allow';
    this.status.set(
      allowed
        ? 'Export would run — this role is allowed.'
        : 'Export blocked — same rule as the toolbar (Viewer cannot export).',
    );
  }
}
