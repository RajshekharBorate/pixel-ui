import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,

  providePixelAuthorizationTesting,
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

interface NavNode {
  readonly id: string;
  readonly label: string;
  readonly access?: string;
  readonly children?: readonly NavNode[];
}

const NAV_TREE: readonly NavNode[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    access: 'nav:workspace',
    children: [
      { id: 'claims', label: 'Claims', access: 'claims:read' },
      { id: 'export', label: 'Exports', access: 'claims:export' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    access: 'nav:admin',
    children: [{ id: 'settings', label: 'Settings', access: 'settings:view' }],
  },
];

@Component({
  selector: 'docs-authorization-nav-example',
  imports: [PixelSelectComponent],
  providers: [...providePixelAuthorizationTesting()],
  template: `
    <p class="hint">
      Side navigation should not show links the person cannot open. This list is the same
      menu filtered by role: denied items disappear, and an Admin group with no allowed
      children is removed entirely.
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
    <ul class="nav-demo panel">
      @for (item of visibleNav(); track item.id) {
        <li>
          <strong>{{ item.label }}</strong>
          @if (item.children?.length) {
            <ul class="nav-demo">
              @for (child of item.children; track child.id) {
                <li class="child">{{ child.label }}</li>
              }
            </ul>
          }
        </li>
      }
    </ul>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationNavExample {
  readonly auth = inject(PixelAuthorizationService);
  readonly role = signal<AuthDemoRole>('viewer');
  readonly roleOptions = AUTH_DEMO_ROLE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  readonly visibleNav = computed(() =>
    this.auth.filterAllowed(NAV_TREE, (n) => n.access, {
      getChildren: (n) => n.children,
      attachChildren: (n, children) => ({ ...n, children }),
      hideEmptyParents: true,
    }),
  );
  readonly blurb = computed(() => authDemoRoleBlurb(this.role()));
  readonly expectCopy = computed(() => {
    switch (this.role()) {
      case 'viewer':
        return 'You should see Workspace → Claims only. Exports and Admin should be gone.';
      case 'exporter':
      case 'adjuster':
        return 'You should see Workspace → Claims and Exports. Admin should still be gone.';
      case 'admin':
        return 'You should see Workspace (Claims, Exports) and Admin → Settings.';
    }
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
