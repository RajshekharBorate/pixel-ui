import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,

  providePixelAuthorizationTesting,
  PixelButtonComponent,
  PixelNavAnchorDirective,
  PixelNavigateService,
  PixelSelectComponent,
  createAuthorizationNavigateGuard,
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
  selector: 'docs-authorization-navigate-example',
  imports: [PixelButtonComponent, PixelSelectComponent, PixelNavAnchorDirective],
  providers: [...providePixelAuthorizationTesting()],
  template: `
    <p class="hint">
      In-page jumps (scroll to a section) use the same permission as a button. Workspace is open
      to anyone who can read claims. Settings is admin-only — as a Viewer the jump is refused
      instead of scrolling you there.
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
      <pixel-button appearance="solid" (click)="goWorkspace()">Go to workspace</pixel-button>
      <pixel-button appearance="outline" (click)="goSettings()">Go to settings</pixel-button>
    </div>
    <section class="panel" pixelNavAnchor="auth-workspace" id="auth-workspace">
      <h3>Workspace</h3>
      <p>Anyone who can read claims can land here.</p>
    </section>
    <section class="panel" pixelNavAnchor="auth-settings" id="auth-settings">
      <h3>Settings</h3>
      <p>Only Admin can jump here.</p>
    </section>
    <p class="info">{{ status() || 'Try “Go to settings” as Viewer, then switch to Admin.' }}</p>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationNavigateExample {
  private readonly auth = inject(PixelAuthorizationService);
  private readonly navigate = inject(PixelNavigateService);
  private readonly destroyRef = inject(DestroyRef);
  readonly role = signal<AuthDemoRole>('viewer');
  readonly status = signal('');
  readonly blurb = computed(() => authDemoRoleBlurb(this.role()));
  readonly roleOptions = AUTH_DEMO_ROLE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  constructor() {
    seedPixelAuthorization(this.auth, {
      catalog: AUTH_DEMO_CATALOG,
      subject: { id: 'demo', roles: ['viewer'], tenantId: 'acme' },
    });
    this.navigate.setPermissionGuard(createAuthorizationNavigateGuard(this.auth));
    this.destroyRef.onDestroy(() => this.navigate.setPermissionGuard(null));
  }

  onRole(value: unknown): void {
    const role = (typeof value === 'string' ? value : 'viewer') as AuthDemoRole;
    this.role.set(role);
    this.auth.setSubject({ id: 'demo', roles: [role], tenantId: 'acme' });
  }

  async goWorkspace(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'section', id: 'auth-workspace' },
      access: 'claims:read',
      onFailure: 'silent',
    });
    this.status.set(result.ok ? 'Scrolled to workspace.' : `Could not go: ${result.reason ?? 'unknown'}`);
  }

  async goSettings(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'section', id: 'auth-settings' },
      access: 'settings:view',
      onFailure: 'silent',
    });
    this.status.set(
      result.ok
        ? 'Scrolled to settings.'
        : 'Blocked — this role cannot open Settings (try Admin).',
    );
  }
}
