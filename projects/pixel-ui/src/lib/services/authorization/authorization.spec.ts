import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PixelAuthorizationService } from './authorization.service';
import {
  PIXEL_AUTHORIZATION_AUDIT,
  PIXEL_AUTHORIZATION_REMOTE_PDP,
} from './authorization.tokens';
import type { PixelPermissionCatalog, PixelPolicy } from './authorization.types';
import { PixelMockPolicyDecisionAdapter, withRemotePdpTimeout } from './policy.adapter';
import { evaluatePolicyCondition, resolvePolicyPath } from './policy.engine';
import { seedPixelAuthorization } from './testing';
import PixelAccessDirective from './pixel-access.directive';
import PixelButtonComponent from '../../pixel-button/pixel-button';
import PixelInputComponent from '../../pixel-input/pixel-input';

const CATALOG: PixelPermissionCatalog = {
  version: '1',
  roles: {
    viewer: ['claims:read'],
    exporter: ['claims:read', 'claims:export'],
    admin: ['claims:read', 'claims:export', 'claims:approve'],
  },
  permissions: {
    'claims:read': { description: 'Read claims' },
    'claims:export': { description: 'Export claims' },
    'claims:approve': { description: 'Approve claims' },
    'claims:*': { description: 'Wildcard segment' },
  },
};

describe('PixelAuthorizationService', () => {
  let auth: PixelAuthorizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    auth = TestBed.inject(PixelAuthorizationService);
  });

  it('allows RBAC-only when policies are empty and role grants permission', () => {
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['exporter'] },
    });
    expect(auth.authorize({ permission: 'claims:export' }).status).toBe('allow');
    expect(auth.can('claims:export')()).toBe(true);
  });

  it('denies unknown permission keys in strict mode', () => {
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['admin'] },
    });
    expect(auth.authorize({ permission: 'claims:hack' }).reason).toBe('unknown-permission');
  });

  it('denies on tenant mismatch before other rules', () => {
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['admin'], tenantId: 't1' },
    });
    const decision = auth.authorize({
      permission: 'claims:export',
      resource: { type: 'claim', attributes: { tenantId: 't2' } },
    });
    expect(decision.reason).toBe('tenant');
  });

  it('returns pending while context is unknown', () => {
    auth.setContextStatus('unknown');
    expect(auth.authorize({ permission: 'claims:export' }).status).toBe('pending');
  });

  it('denies when unauthenticated', () => {
    auth.setSubject(null);
    expect(auth.authorize({ permission: 'claims:export' }).reason).toBe('unauthenticated');
  });

  it('explicit deny policy wins over RBAC and break-glass permissions', () => {
    const policies: PixelPolicy[] = [
      {
        id: 'deny-self-approve',
        effect: 'deny',
        target: { actions: ['approve'], permissions: ['claims:approve'] },
        condition: { eq: ['subject.id', 'resource.attributes.createdBy'] },
      },
      {
        id: 'allow-approve',
        effect: 'allow',
        target: { permissions: ['claims:approve'] },
      },
    ];
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      policies,
      subject: {
        id: 'u1',
        roles: ['admin'],
        permissions: ['claims:approve'],
      },
    });
    const decision = auth.authorize({
      permission: 'claims:approve',
      action: 'approve',
      resource: { type: 'claim', attributes: { createdBy: 'u1' } },
    });
    expect(decision.status).toBe('deny');
    expect(decision.reason).toBe('abac');
  });

  it('RBAC ∩ ABAC requires matching allow when policies target the request', () => {
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      policies: [
        {
          id: 'allow-export-low',
          effect: 'allow',
          target: { permissions: ['claims:export'] },
          condition: { lt: ['resource.attributes.amount', 10000] },
        },
      ],
      subject: { id: 'u1', roles: ['exporter'] },
    });
    expect(
      auth.authorize({
        permission: 'claims:export',
        resource: { type: 'claim', attributes: { amount: 500 } },
      }).status,
    ).toBe('allow');
    expect(
      auth.authorize({
        permission: 'claims:export',
        resource: { type: 'claim', attributes: { amount: 50000 } },
      }).status,
    ).toBe('deny');
  });

  it('ABAC-only allows when no permission and allow policy matches', () => {
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      policies: [
        {
          id: 'view-public',
          effect: 'allow',
          target: { actions: ['view'], resourceTypes: ['doc'] },
          condition: { eq: ['resource.attributes.visibility', 'public'] },
        },
      ],
      subject: { id: 'u1', roles: [] },
    });
    expect(
      auth.authorize({
        action: 'view',
        resource: { type: 'doc', attributes: { visibility: 'public' } },
      }).status,
    ).toBe('allow');
  });

  it('filterAllowed drops denied items', () => {
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['viewer'] },
    });
    const items = [
      { id: 'a', access: 'claims:read' },
      { id: 'b', access: 'claims:export' },
    ];
    expect(auth.filterAllowed(items, (i) => i.access).map((i) => i.id)).toEqual(['a']);
  });

  it('explain returns decision steps', () => {
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['exporter'] },
    });
    const result = auth.explain({ permission: 'claims:export' });
    expect(result.decision.status).toBe('allow');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('authorizeAsync uses remote PDP and fail-closes on timeout', async () => {
    const slow = new PixelMockPolicyDecisionAdapter(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PIXEL_AUTHORIZATION_REMOTE_PDP,
          useValue: withRemotePdpTimeout(slow, 20),
        },
      ],
    });
    auth = TestBed.inject(PixelAuthorizationService);
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['admin'] },
    });
    const decision = await auth.authorizeAsync({ permission: 'claims:export' });
    expect(decision.reason).toBe('remote-unavailable');
    expect(decision.status).toBe('deny');
  });

  it('emits audit events when audit port is provided', () => {
    const events: string[] = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PIXEL_AUTHORIZATION_AUDIT,
          useValue: { track: (e: { name: string }) => events.push(e.name) },
        },
      ],
    });
    auth = TestBed.inject(PixelAuthorizationService);
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['viewer'] },
    });
    auth.authorize({ permission: 'claims:export' });
    expect(events).toContain('access.denied');
  });
});

describe('policy.engine', () => {
  it('fails closed on missing paths', () => {
    const env = {
      subject: { id: 'u1' },
      request: {},
    };
    expect(evaluatePolicyCondition({ eq: ['resource.attributes.x', '1'] }, env)).toBe(false);
  });

  it('blocks prototype traversal', () => {
    const env = {
      subject: { id: 'u1' },
      request: {},
    };
    expect(resolvePolicyPath('subject.__proto__', env)).toBeUndefined();
  });
});

@Component({
  selector: 'host-access',
  imports: [PixelAccessDirective],
  template: `<button type="button" [pixelAccess]="perm" [pixelAccessMode]="mode">Go</button>`,
})
class HostAccess {
  perm = 'claims:export';
  mode: 'hide' | 'disable' = 'hide';
}

@Component({
  selector: 'host-pixel-access',
  imports: [PixelAccessDirective, PixelButtonComponent, PixelInputComponent],
  template: `
    <pixel-button pixelAccess="claims:export" pixelAccessMode="hide">Hidden when denied</pixel-button>
    <pixel-button pixelAccess="claims:export" pixelAccessMode="disable">Visible but disabled</pixel-button>
    <pixel-input
      label="Policy note"
      value="Sensitive field"
      pixelAccess="claims:export"
      pixelAccessMode="readonly"
    />
  `,
})
class HostPixelAccess {}

describe('PixelAccessDirective', () => {
  it('hides host when denied and mode is hide', () => {
    TestBed.configureTestingModule({ imports: [HostAccess] });
    const auth = TestBed.inject(PixelAuthorizationService);
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['viewer'] },
    });
    const fixture = TestBed.createComponent(HostAccess);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.hasAttribute('hidden')).toBe(true);
  });

  it('hides, disables, and makes pixel hosts readonly when denied (docs PEP modes)', () => {
    TestBed.configureTestingModule({ imports: [HostPixelAccess] });
    const auth = TestBed.inject(PixelAuthorizationService);
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: ['viewer'] },
    });
    const fixture = TestBed.createComponent(HostPixelAccess);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const pixelButtons = host.querySelectorAll('pixel-button');
    expect(pixelButtons.length).toBe(2);
    expect((pixelButtons[0] as HTMLElement).style.display).toBe('none');
    expect(pixelButtons[0].hasAttribute('hidden')).toBe(true);

    const inner = pixelButtons[1].querySelector('button') as HTMLButtonElement;
    expect(inner.disabled).toBe(true);

    const nativeInput = host.querySelector('pixel-input input') as HTMLInputElement;
    expect(nativeInput.readOnly).toBe(true);
  });
});
