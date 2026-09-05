import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,

  providePixelAuthorizationTesting,
  PixelButtonComponent,
  PixelToggleComponent,
  seedPixelAuthorization,
} from 'pixel-ui';
import { AUTH_DEMO_CATALOG, AUTH_DEMO_POLICIES } from './authorization-demo.catalog';
import { AUTH_DEMO_STYLES } from './authorization-demo.styles';

@Component({
  selector: 'docs-authorization-abac-example',
  imports: [PixelButtonComponent, PixelToggleComponent],
  providers: [...providePixelAuthorizationTesting()],
  template: `
    <p class="hint">
      Role is not enough for every decision. Here you are an <strong>Adjuster</strong> — you
      may approve and export <em>this claim</em> only when extra rules pass.
    </p>
    <ul class="hint">
      <li>You cannot approve a claim you created yourself (separation of duties).</li>
      <li>You can export only when the amount is under 10,000.</li>
      <li>A claim from another company (wrong tenant) is always denied.</li>
    </ul>
    <div class="row">
      <pixel-toggle
        label="This is my own claim"
        [checked]="selfCreated()"
        (checkedChange)="selfCreated.set($event)"
      />
      <pixel-toggle
        label="Amount is $25,000 (over the 10k limit)"
        [checked]="highAmount()"
        (checkedChange)="highAmount.set($event)"
      />
      <pixel-toggle
        label="Claim belongs to another company"
        [checked]="wrongTenant()"
        (checkedChange)="wrongTenant.set($event)"
      />
    </div>
    <div class="actions">
      <pixel-button
        appearance="solid"
        [disabled]="!canApprove()"
        (click)="last.set('approve')"
      >
        Approve
      </pixel-button>
      <pixel-button
        appearance="outline"
        [disabled]="!canExport()"
        (click)="last.set('export')"
      >
        Export
      </pixel-button>
    </div>
    <p class="expect">{{ story() }}</p>
    <p class="info">
      Approve: {{ approveLabel() }} · Export: {{ exportLabel() }}
      @if (last()) {
        · last click: {{ last() }}
      }
    </p>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationAbacExample {
  readonly auth = inject(PixelAuthorizationService);
  readonly selfCreated = signal(true);
  readonly highAmount = signal(false);
  readonly wrongTenant = signal(false);
  readonly last = signal('');

  private readonly resource = computed(() => ({
    type: 'claim' as const,
    id: 'TR-1',
    attributes: {
      createdBy: this.selfCreated() ? 'demo' : 'other',
      amount: this.highAmount() ? 25000 : 500,
      tenantId: this.wrongTenant() ? 'other-co' : 'acme',
    },
  }));

  readonly canApprove = computed(
    () =>
      this.auth.authorize({
        permission: 'claims:approve',
        action: 'approve',
        resource: this.resource(),
      }).status === 'allow',
  );

  readonly canExport = computed(
    () =>
      this.auth.authorize({
        permission: 'claims:export',
        action: 'export',
        resource: this.resource(),
      }).status === 'allow',
  );

  readonly approveLabel = computed(() =>
    this.canApprove() ? 'allowed' : 'not allowed',
  );

  readonly exportLabel = computed(() => (this.canExport() ? 'allowed' : 'not allowed'));

  readonly story = computed(() => {
    const bits: string[] = [];
    bits.push(
      this.canApprove()
        ? 'Approve is enabled — this is someone else’s claim.'
        : this.selfCreated()
          ? 'Approve is disabled — you created this claim.'
          : 'Approve is disabled.',
    );
    bits.push(
      this.canExport()
        ? 'Export is enabled — amount is under 10,000.'
        : this.highAmount()
          ? 'Export is disabled — amount is over the limit.'
          : 'Export is disabled.',
    );
    if (this.wrongTenant()) {
      bits.unshift('Wrong company on the claim — both actions stay denied.');
    }
    return bits.join(' ');
  });

  constructor() {
    seedPixelAuthorization(this.auth, {
      catalog: AUTH_DEMO_CATALOG,
      policies: AUTH_DEMO_POLICIES,
      subject: { id: 'demo', roles: ['adjuster'], tenantId: 'acme' },
    });
  }
}
