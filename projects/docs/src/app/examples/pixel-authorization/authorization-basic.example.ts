import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,
  PixelAccessDirective,
  PixelButtonComponent,
  PixelSelectComponent,
  seedPixelAuthorization,
} from 'pixel-ui';
import {
  AUTH_DEMO_CATALOG,
  AUTH_DEMO_ROLE_OPTIONS,
  authDemoRoleBlurb,
  type AuthDemoRole,
} from './authorization-demo.catalog';
import { AUTH_DEMO_STYLES } from './authorization-demo.styles';

@Component({
  selector: 'docs-authorization-basic-example',
  imports: [PixelButtonComponent, PixelSelectComponent, PixelAccessDirective],
  providers: [PixelAuthorizationService],
  template: `
    <p class="hint">
      Pick a role, then look at the two actions. <strong>Download export</strong> is removed when
      you cannot export. <strong>Approve export</strong> stays on screen so people still know the
      action exists, but it cannot be clicked.
    </p>
    <div class="row">
      <pixel-select
        label="Act as"
        [options]="roleOptions"
        [value]="role()"
        (valueChange)="onRole($event)"
        style="min-inline-size: 16rem"
      />
    </div>
    <p class="who">{{ blurb() }}</p>
    <div class="actions">
      @if (canExport()) {
        <pixel-button appearance="solid" leadingIcon="download">Download export</pixel-button>
      }
      <pixel-button
        appearance="outline"
        leadingIcon="verified"
        pixelAccess="claims:export"
        pixelAccessMode="disable"
      >
        Approve export
      </pixel-button>
    </div>
    <p class="expect">{{ expectCopy() }}</p>
    <p class="info">{{ decisionLabel() }}</p>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationBasicExample {
  readonly auth = inject(PixelAuthorizationService);
  readonly role = signal<AuthDemoRole>('viewer');
  readonly roleOptions = AUTH_DEMO_ROLE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  readonly canExport = this.auth.can('claims:export');
  readonly blurb = computed(() => authDemoRoleBlurb(this.role()));
  private readonly exportDecision = this.auth.access({
    permission: 'claims:export',
    action: 'export',
  });

  readonly expectCopy = computed(() => {
    if (this.canExport()) {
      return 'You should see Download export, and Approve export should be clickable.';
    }
    return 'Download export is gone. Approve export stays on screen but is disabled.';
  });

  readonly decisionLabel = computed(() => {
    const allowed = this.exportDecision().status === 'allow';
    return allowed ? 'Export is allowed for this role.' : 'Export is not allowed for this role.';
  });

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
  }
}
