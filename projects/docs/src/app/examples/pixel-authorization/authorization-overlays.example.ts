import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,

  providePixelAuthorizationTesting,
  PixelButtonComponent,
  PixelDialogService,
  PixelDrawerService,
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
  selector: 'docs-auth-overlay-body',
  template: `<p style="margin:0;padding:1rem">Authorized overlay content.</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AuthOverlayBody {}

@Component({
  selector: 'docs-authorization-overlays-example',
  imports: [PixelButtonComponent, PixelSelectComponent],
  providers: [...providePixelAuthorizationTesting()],
  template: `
    <p class="hint">
      Opening a dialog from code should fail closed if the person cannot amend a claim. As Viewer
      the overlay never shows its body. Switch to Admin and try again.
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
      <pixel-button appearance="solid" (click)="openDialog()">Open dialog</pixel-button>
      <pixel-button appearance="outline" (click)="openDrawer()">Open drawer</pixel-button>
    </div>
    <p class="expect">{{ expectCopy() }}</p>
    <p class="info">{{ status() }}</p>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationOverlaysExample {
  private readonly auth = inject(PixelAuthorizationService);
  private readonly dialog = inject(PixelDialogService);
  private readonly drawer = inject(PixelDrawerService);
  readonly role = signal<AuthDemoRole>('viewer');
  readonly status = signal('Try Open dialog as Viewer, then switch to Admin.');
  readonly blurb = computed(() => authDemoRoleBlurb(this.role()));
  readonly expectCopy = computed(() =>
    this.role() === 'admin'
      ? 'Admin can amend: Open dialog / Open drawer should show a panel.'
      : 'This role cannot amend: the overlay should stay empty (no body). Try Admin.',
  );
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

  openDialog(): void {
    const ref = this.dialog.open(AuthOverlayBody, {
      title: 'Amend claim',
      requires: 'claims:amend',
    });
    ref.afterClosed().subscribe(() => {
      const ok =
        this.auth.authorize({ permission: 'claims:amend', action: 'edit' }).status === 'allow';
      this.status.set(ok ? 'Dialog opened (you can close it).' : 'Blocked — overlay did not show content.');
    });
  }

  openDrawer(): void {
    const ref = this.drawer.open(AuthOverlayBody, {
      title: 'Amend claim',
      requires: 'claims:amend',
    });
    ref.afterClosed().subscribe(() => {
      const ok =
        this.auth.authorize({ permission: 'claims:amend', action: 'edit' }).status === 'allow';
      this.status.set(ok ? 'Drawer opened (you can close it).' : 'Blocked — overlay did not show content.');
    });
  }
}
