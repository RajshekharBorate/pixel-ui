import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  PixelAuthorizationService,
  PixelAccessDirective,
  PixelButtonComponent,
  seedPixelAuthorization,
} from 'pixel-ui';
import { AUTH_DEMO_CATALOG } from './authorization-demo.catalog';
import { AUTH_DEMO_STYLES } from './authorization-demo.styles';

@Component({
  selector: 'docs-authorization-hydration-example',
  imports: [PixelButtonComponent, PixelAccessDirective],
  providers: [PixelAuthorizationService],
  template: `
    <p class="hint">
      After login, roles often arrive a moment later. Until we know who you are, the UI must
      <strong>not</strong> hide every gated button (that would flash empty, then pop in).
    </p>
    <p class="who">{{ statusBlurb() }}</p>
    <div class="actions">
      <pixel-button appearance="outline" (click)="toUnknown()">We don’t know yet</pixel-button>
      <pixel-button appearance="outline" (click)="toLoading()">Fetching profile…</pixel-button>
      <pixel-button appearance="solid" (click)="toReady()">Signed in as Viewer</pixel-button>
      <pixel-button appearance="outline" (click)="toExporter()">Signed in as Exporter</pixel-button>
    </div>
    @if (pending()) {
      <p class="panel info" aria-busy="true">Loading who you are… Export stays visible until this finishes.</p>
    }
    <div class="actions">
      <pixel-button pixelAccess="claims:export" pixelAccessMode="hide">Hide-style Export</pixel-button>
      <pixel-button pixelAccess="claims:export" pixelAccessMode="disable">
        Disable-style Export
      </pixel-button>
    </div>
    <p class="expect">{{ expectCopy() }}</p>
  `,
  styles: [AUTH_DEMO_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationHydrationExample {
  readonly auth = inject(PixelAuthorizationService);

  readonly pending = computed(() => {
    const status = this.auth.contextStatus();
    return status === 'unknown' || status === 'loading';
  });

  readonly statusBlurb = computed(() => {
    switch (this.auth.contextStatus()) {
      case 'unknown':
        return 'We don’t know who you are yet.';
      case 'loading':
        return 'Fetching your profile…';
      case 'ready': {
        const exporter =
          this.auth.authorize({ permission: 'claims:export', action: 'export' }).status ===
          'allow';
        return exporter
          ? 'Signed in as Exporter — export is allowed.'
          : 'Signed in as Viewer — export is not allowed.';
      }
      default:
        return 'Signed out or error — treat export as denied.';
    }
  });

  readonly expectCopy = computed(() => {
    if (this.pending()) {
      return 'Both Export buttons should still be on screen (busy, not vanished).';
    }
    const allowed =
      this.auth.authorize({ permission: 'claims:export', action: 'export' }).status === 'allow';
    return allowed
      ? 'You can export: both buttons are available.'
      : 'Viewer cannot export: Hide-style Export disappears; Disable-style Export stays greyed out.';
  });

  constructor() {
    seedPixelAuthorization(this.auth, {
      catalog: AUTH_DEMO_CATALOG,
      contextStatus: 'unknown',
      subject: null,
    });
  }

  toUnknown(): void {
    this.auth.setContextStatus('unknown');
  }

  toLoading(): void {
    this.auth.setContextStatus('loading');
  }

  toReady(): void {
    this.auth.setSubject({ id: 'demo', roles: ['viewer'], tenantId: 'acme' });
  }

  toExporter(): void {
    this.auth.setSubject({ id: 'demo', roles: ['exporter'], tenantId: 'acme' });
  }
}
