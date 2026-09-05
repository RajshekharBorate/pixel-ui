import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,

  providePixelAuthorizationTesting,
  PixelSelectComponent,
  PixelStepComponent,
  PixelStepperComponent,
  PixelTabComponent,
  PixelTabsComponent,
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
  selector: 'docs-authorization-tabs-stepper-example',
  imports: [
    PixelSelectComponent,
    PixelTabsComponent,
    PixelTabComponent,
    PixelStepperComponent,
    PixelStepComponent,
  ],
  providers: [...providePixelAuthorizationTesting()],
  template: `
    <p class="hint">
      Tabs and wizard steps that the person cannot use should not look like a dead end they can
      still click. Denied tabs/steps are disabled here. Switch to Admin to unlock Admin and Review.
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
    <p class="expect">{{ expectCopy() }}</p>
    <pixel-tabs [(selectedIndex)]="tabIndex">
      <pixel-tab label="Overview" access="claims:read">Workspace overview.</pixel-tab>
      <pixel-tab label="Exports" access="claims:export">Export tools.</pixel-tab>
      <pixel-tab label="Admin" access="admin:panel">Admin-only panel.</pixel-tab>
    </pixel-tabs>
    <div class="panel" style="margin-block-start: 1rem">
      <pixel-stepper navigationMode="linear">
        <pixel-step label="Details" access="claims:read">Claim details.</pixel-step>
        <pixel-step label="Documents" access="claims:read">Upload docs.</pixel-step>
        <pixel-step label="Review" access="claims:approve">Approval review.</pixel-step>
      </pixel-stepper>
    </div>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationTabsStepperExample {
  private readonly auth = inject(PixelAuthorizationService);
  readonly role = signal<AuthDemoRole>('viewer');
  readonly tabIndex = signal(0);
  readonly blurb = computed(() => authDemoRoleBlurb(this.role()));
  readonly expectCopy = computed(() => {
    switch (this.role()) {
      case 'viewer':
        return 'Overview should work. Exports and Admin stay disabled. In the wizard, Review stays locked.';
      case 'exporter':
        return 'Overview and Exports should work. Admin stays disabled. Review in the wizard stays locked.';
      case 'adjuster':
        return 'Overview and Exports should work. Admin stays disabled. Review in the wizard should unlock.';
      case 'admin':
        return 'All three tabs should work, and Review in the wizard should unlock.';
    }
  });
  readonly roleOptions = AUTH_DEMO_ROLE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

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
