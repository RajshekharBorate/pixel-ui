import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,
  PixelAccessDirective,
  PixelButtonComponent,
  PixelInputComponent,
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
  selector: 'docs-authorization-pep-modes-example',
  imports: [PixelButtonComponent, PixelInputComponent, PixelSelectComponent, PixelAccessDirective],
  providers: [PixelAuthorizationService],
  template: `
    <p class="hint">
      When someone is <strong>not allowed</strong> to export, the UI can react in three ways.
      Switch role to compare: Viewer is blocked; Exporter is allowed.
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
    <div class="stack">
      <div class="panel">
        <h3>1. Hide — remove the action</h3>
        <p class="hint">Use when the person should not even know Export exists (typical for admin tools).</p>
        <pixel-button pixelAccess="claims:export" pixelAccessMode="hide">
          Export claims
        </pixel-button>
        <p class="expect">
          @if (canExport()) {
            You should see the Export button.
          } @else {
            You should see an empty panel — the button is not in the page.
          }
        </p>
      </div>
      <div class="panel">
        <h3>2. Disable — show it, but it cannot be used</h3>
        <p class="hint">Use when the action should stay visible (people know it exists) but they cannot click it.</p>
        <pixel-button pixelAccess="claims:export" pixelAccessMode="disable">
          Export claims
        </pixel-button>
        <p class="expect">
          @if (canExport()) {
            The button is clickable.
          } @else {
            The button stays on screen, greyed out, and does not click.
          }
        </p>
      </div>
      <div class="panel">
        <h3>3. Readonly — keep the field, block edits</h3>
        <p class="hint">Use on form fields so the value can still be read and copied, but not changed.</p>
        <pixel-input
          label="Internal policy note"
          value="Do not share outside the claims team"
          pixelAccess="claims:export"
          pixelAccessMode="readonly"
        />
        <p class="expect">
          @if (canExport()) {
            You can edit the note.
          } @else {
            The text stays visible. Try typing — it should not change.
          }
        </p>
      </div>
    </div>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationPepModesExample {
  private readonly auth = inject(PixelAuthorizationService);
  readonly role = signal<AuthDemoRole>('viewer');
  readonly roleOptions = AUTH_DEMO_ROLE_OPTIONS.filter(
    (o) => o.value === 'viewer' || o.value === 'exporter',
  );
  readonly canExport = this.auth.can('claims:export');
  readonly blurb = computed(() => authDemoRoleBlurb(this.role()));

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
