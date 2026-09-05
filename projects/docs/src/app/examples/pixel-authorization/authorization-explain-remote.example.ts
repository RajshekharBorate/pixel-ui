import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelAuthorizationService,
  providePixelAuthorizationTesting,
  PixelButtonComponent,
  PixelMockPolicyDecisionAdapter,
  withRemotePdpTimeout,
  PIXEL_AUTHORIZATION_REMOTE_PDP,
  seedPixelAuthorization,
} from 'pixel-ui';
import { AUTH_DEMO_CATALOG } from './authorization-demo.catalog';
import { AUTH_DEMO_STYLES } from './authorization-demo.styles';

@Component({
  selector: 'docs-authorization-explain-remote-example',
  imports: [PixelButtonComponent],
  providers: [
    ...providePixelAuthorizationTesting(),
    {
      provide: PIXEL_AUTHORIZATION_REMOTE_PDP,
      useFactory: () =>
        withRemotePdpTimeout(
          new PixelMockPolicyDecisionAdapter(
            () =>
              new Promise(() => {
                /* hang → timeout deny */
              }),
          ),
          40,
        ),
    },
  ],
  template: `
    <p class="hint">
      Two developer tools, not product UI. <strong>Explain local</strong> prints why export is
      allowed for this Exporter (use in QA). <strong>Ask remote (times out)</strong> pretends the
      policy server never answers — the library must deny, not hang open.
    </p>
    <p class="expect">Never show these traces or permission keys to end users.</p>
    <div class="actions">
      <pixel-button appearance="solid" (click)="runExplain()">Why is export allowed?</pixel-button>
      <pixel-button appearance="outline" (click)="runRemote()">Ask remote (times out)</pixel-button>
    </div>
    <pre class="panel" style="white-space: pre-wrap; font-size: 0.75rem">{{ log() }}</pre>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationExplainRemoteExample {
  private readonly auth = inject(PixelAuthorizationService);
  readonly log = signal('Choose a button above.');

  constructor() {
    seedPixelAuthorization(this.auth, {
      catalog: AUTH_DEMO_CATALOG,
      subject: { id: 'demo', roles: ['exporter'], tenantId: 'acme' },
    });
  }

  runExplain(): void {
    const result = this.auth.explain({ permission: 'claims:export', action: 'export' });
    this.log.set(
      JSON.stringify(
        {
          decision: result.decision,
          steps: result.steps,
        },
        null,
        2,
      ),
    );
  }

  async runRemote(): Promise<void> {
    this.log.set('Waiting for the remote policy service… it will time out and deny.');
    const decision = await this.auth.authorizeAsync({
      permission: 'claims:export',
      action: 'export',
    });
    this.log.set(JSON.stringify(decision, null, 2));
  }
}
