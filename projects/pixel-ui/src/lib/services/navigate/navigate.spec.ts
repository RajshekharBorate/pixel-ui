import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { PixelNavigateService } from './navigate.service';
import { PIXEL_NAVIGATE_CONFIG } from './navigate.tokens';
import {
  coerceNavigateRequest,
  parseNavParam,
  serializeNavTargets,
  navigateRequestToUrl,
  parseNavigateUrl,
  normalizeTargets,
} from './navigate-url';
import { getNotificationNavigateRequest } from './notification-nav';
import type { PixelNotification } from '../../pixel-notification/pixel-notification.types';

function notification(patch: Partial<PixelNotification> = {}): PixelNotification {
  return {
    id: 'n1',
    title: 'Approval',
    message: '',
    severity: 'warning',
    priority: 'high',
    state: 'default',
    category: 'approvals',
    source: 'Workflow',
    icon: '',
    imageSrc: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: null,
    readAt: null,
    archivedAt: null,
    progress: null,
    occurrences: 1,
    actions: [],
    channels: ['inbox'],
    dedupeKey: 'n1',
    data: {},
    ...patch,
  };
}

describe('navigate URL helpers', () => {
  it('round-trips section and grid-row nav blobs', () => {
    const blob = serializeNavTargets([
      { type: 'section', id: 'payments' },
      { type: 'grid-row', gridId: 'claims', rowId: 'TR-104', page: 2 },
    ]);
    expect(blob).toContain('section:payments');
    expect(blob).toContain('grid:claims');
    expect(blob).toContain('row:TR-104');
    const parsed = parseNavParam(blob);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ type: 'section', id: 'payments' });
    expect(parsed[1]).toMatchObject({
      type: 'grid-row',
      gridId: 'claims',
      rowId: 'TR-104',
      page: 2,
    });
  });

  it('parses wizard and stepper shapes', () => {
    expect(parseNavParam('wizard:claim-filing;step:documents')[0]).toEqual({
      type: 'wizard',
      id: 'claim-filing',
      step: 'documents',
    });
    expect(parseNavParam('stepper:onboarding;step:2')[0]).toEqual({
      type: 'stepper',
      id: 'onboarding',
      step: 2,
    });
  });

  it('toUrl / parseUrl preserve nav param', () => {
    const url = navigateRequestToUrl({
      route: ['claims', 'TR-104'],
      target: { type: 'section', id: 'documents' },
    });
    expect(url).toContain('/claims/TR-104');
    expect(url).toContain('nav=');
    const request = parseNavigateUrl(url);
    expect(request?.route).toEqual(['claims', 'TR-104']);
    expect(normalizeTargetType(request)).toBe('section');
  });

  it('coerceNavigateRequest accepts objects and nav strings', () => {
    expect(coerceNavigateRequest({ route: ['a'], target: { type: 'section', id: 'x' } })).toBeTruthy();
    expect(coerceNavigateRequest('section:payments')?.nav).toContain('section');
    expect(coerceNavigateRequest('payments')?.fragment).toBe('payments');
    expect(coerceNavigateRequest(null)).toBeNull();
  });
});

function normalizeTargetType(
  request: ReturnType<typeof parseNavigateUrl>,
): string | undefined {
  const t = request?.target;
  if (!t) return undefined;
  if (Array.isArray(t)) return t[0]?.type;
  return (t as { type: string }).type;
}

describe('notification nav helpers', () => {
  it('resolves action.nav over data.nav over href', () => {
    const n = notification({
      data: {
        nav: { route: ['/from-data'], target: { type: 'section', id: 'a' } },
      },
      actions: [
        {
          id: 'review',
          label: 'Review',
          nav: { route: ['/from-action'], target: { type: 'section', id: 'b' } },
          href: '/from-href',
        },
      ],
    });
    const fromAction = getNotificationNavigateRequest(n, n.actions[0]);
    expect(fromAction?.route).toEqual(['/from-action']);

    // Action without nav still falls back to data.nav before href.
    const withoutActionNav = getNotificationNavigateRequest(n, {
      id: 'x',
      label: 'X',
      href: '/only-href#frag',
    });
    expect(withoutActionNav?.route).toEqual(['/from-data']);

    const hrefOnly = getNotificationNavigateRequest(
      notification({ data: {} }),
      { id: 'x', label: 'X', href: '/only-href#frag' },
    );
    expect(hrefOnly?.route).toEqual(['only-href']);
    expect(hrefOnly?.fragment).toBe('frag');

    const fromData = getNotificationNavigateRequest({
      ...n,
      actions: [],
    });
    expect(fromData?.route).toEqual(['/from-data']);
  });
});

describe('PixelNavigateService', () => {
  let service: PixelNavigateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: PIXEL_NAVIGATE_CONFIG,
          useValue: { onFailure: 'silent', stickyOffset: 0, timeoutMs: 200 },
        },
      ],
    });
    service = TestBed.inject(PixelNavigateService);
  });

  afterEach(() => {
    document.getElementById('payments')?.remove();
  });

  it('go() returns ok for empty request', async () => {
    const result = await service.go({});
    expect(result.ok).toBe(true);
  });

  it('scrolls to section by element id', async () => {
    const el = document.createElement('section');
    el.id = 'payments';
    el.textContent = 'Payments';
    document.body.appendChild(el);

    const result = await service.go({
      target: { type: 'section', id: 'payments' },
      highlight: true,
      focus: true,
      behavior: 'instant',
      onFailure: 'silent',
      timeoutMs: 200,
    });
    expect(result.reason, result.message).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(result.element).toBe(el);
  });

  it('soft-fails when section missing', async () => {
    const result = await service.go({
      target: { type: 'section', id: 'missing-section-xyz' },
      timeoutMs: 80,
      onFailure: 'silent',
    });
    expect(result.ok).toBe(false);
    expect(result.reason === 'timeout' || result.reason === 'not-found').toBe(true);
  });

  it('requires wizard registration (opt-in)', async () => {
    const result = await service.go({
      target: { type: 'wizard', id: 'claim-filing', step: 1 },
      onFailure: 'silent',
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('adapter-missing');
  });

  it('opens registered wizard and sets step', async () => {
    const open = vi.fn();
    const setStep = vi.fn();
    service.registerWizard({
      id: 'claim-filing',
      open,
      setStep,
      syncUrl: false,
    });
    const result = await service.go({
      target: { type: 'wizard', id: 'claim-filing', step: 'documents' },
      onFailure: 'silent',
    });
    expect(result.ok).toBe(true);
    expect(open).toHaveBeenCalled();
    expect(setStep).toHaveBeenCalledWith('documents');
  });

  it('chains adapters and reports partial failure', async () => {
    service.registerAdapter({
      id: 'settings',
      kind: 'tabs',
      activate: vi.fn(async () => true),
    });
    const result = await service.go({
      target: [
        { type: 'tabs', id: 'settings', tab: 1 },
        { type: 'section', id: 'does-not-exist-abc', offset: 0 },
      ],
      timeoutMs: 80,
      onFailure: 'silent',
    });
    expect(result.ok).toBe(false);
    expect(result.partial).toBe(true);
    expect(result.completedTargets).toBe(1);
  });

  it('reveals registered grid rows', async () => {
    const revealRow = vi.fn(async () => true);
    service.registerGrid('claims', { revealRow });
    const result = await service.go({
      target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-104', page: 1 },
      onFailure: 'silent',
    });
    expect(result.ok).toBe(true);
    expect(revealRow).toHaveBeenCalledWith('TR-104', expect.objectContaining({ page: 1 }));
  });

  it('goFromUrl parses current-style relative urls', async () => {
    const spy = vi.spyOn(service, 'go').mockResolvedValue({ ok: true });
    await service.goFromUrl('/billing?nav=section:payments');
    expect(spy).toHaveBeenCalled();
    const arg = spy.mock.calls[0]?.[0];
    expect(arg?.source).toBe('bootstrap');
    expect(arg?.nav || arg?.target).toBeTruthy();
  });

  it('soft-fails with forbidden when permission guard denies', async () => {
    service.setPermissionGuard(() => false);
    const result = await service.go({
      target: { type: 'section', id: 'payments' },
      onFailure: 'silent',
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('forbidden');
    service.setPermissionGuard(null);
  });

  it('pushes context and back() restores previous request', async () => {
    const el = document.createElement('section');
    el.id = 'payments';
    document.body.appendChild(el);

    await service.go({
      target: { type: 'section', id: 'payments' },
      behavior: 'instant',
      onFailure: 'silent',
      broadcast: false,
    });
    expect(service.contextEntries.length).toBe(1);

    const back = await service.back();
    expect(back.ok).toBe(true);
    expect(service.contextEntries.length).toBe(0);
  });

  it('parses first-class row/grid query params without nav blob', () => {
    const request = parseNavigateUrl('/claims?grid=claims&row=TR-104');
    expect(request?.grid).toBe('claims');
    expect(request?.row).toBe('TR-104');
    const targets = normalizeTargets(request!);
    expect(targets[0]).toMatchObject({
      type: 'grid-row',
      gridId: 'claims',
      rowId: 'TR-104',
    });
  });

  it('toUrl writes first-class params alongside nav', () => {
    const url = navigateRequestToUrl({
      route: ['claims'],
      target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-104', page: 1 },
    });
    expect(url).toContain('nav=');
    expect(url).toContain('row=TR-104');
    expect(url).toContain('grid=claims');
  });

  it('enableMultiTab is a no-op when BroadcastChannel is missing', () => {
    const original = globalThis.BroadcastChannel;
    // @ts-expect-error test deletion
    delete globalThis.BroadcastChannel;
    expect(() => service.enableMultiTab()).not.toThrow();
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      value: original,
      configurable: true,
      writable: true,
    });
  });
});
