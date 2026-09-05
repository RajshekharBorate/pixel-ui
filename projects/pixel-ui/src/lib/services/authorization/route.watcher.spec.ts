import { ApplicationRef, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { PixelAuthorizationService } from './authorization.service';
import { pixelAuthorizationCanActivate } from './route.helpers';
import {
  providePixelAuthorizationRouteWatcher,
  reevaluateCurrentRouteAuthorization,
} from './route.watcher';
import { seedPixelAuthorization } from './testing';

@Component({
  selector: 'auth-route-home',
  template: `<p>home</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HomeStub {}

@Component({
  selector: 'auth-route-settings',
  template: `<p>settings</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SettingsStub {}

@Component({
  selector: 'auth-route-shell',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ShellStub {
  constructor() {
    inject(PixelAuthorizationService);
  }
}

const CATALOG = {
  version: '1',
  roles: {
    viewer: ['claims:read'],
    admin: ['claims:read', 'settings:view'],
  },
  permissions: {
    'claims:read': { description: 'Read' },
    'settings:view': { description: 'Settings' },
  },
};

const gatedRoutes = [
  { path: 'home', component: HomeStub },
  {
    path: 'settings',
    component: SettingsStub,
    canActivate: [pixelAuthorizationCanActivate({ forbiddenUrl: '/home' })],
    data: { access: 'settings:view' },
  },
];

describe('route authorization eviction', () => {
  async function setup(role: 'viewer' | 'admin'): Promise<{
    router: Router;
    auth: PixelAuthorizationService;
    fixture: ReturnType<typeof TestBed.createComponent<ShellStub>>;
  }> {
    TestBed.configureTestingModule({
      imports: [ShellStub],
      providers: [
        provideRouter(gatedRoutes),
        provideLocationMocks(),
        ...providePixelAuthorizationRouteWatcher({ forbiddenUrl: '/home' }),
      ],
    });
    const auth = TestBed.inject(PixelAuthorizationService);
    seedPixelAuthorization(auth, {
      catalog: CATALOG,
      subject: { id: 'u1', roles: [role] },
    });
    const fixture = TestBed.createComponent(ShellStub);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    return { router, auth, fixture };
  }

  it('blocks entering a gated route when the role is denied', async () => {
    const { router, fixture } = await setup('viewer');
    await router.navigateByUrl('/settings');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/home');
  });

  it('allows entering a gated route when the role is allowed', async () => {
    const { router, fixture } = await setup('admin');
    await router.navigateByUrl('/settings');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/settings');
  });

  it('leaves the gated page when the subject loses access', async () => {
    const { router, auth, fixture } = await setup('admin');
    await router.navigateByUrl('/settings');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/settings');

    auth.setSubject({ id: 'u1', roles: ['viewer'] });
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    expect(router.url).toBe('/home');
  });

  it('does not bounce away while context is loading', async () => {
    const { router, auth, fixture } = await setup('admin');
    await router.navigateByUrl('/settings');
    await fixture.whenStable();
    fixture.detectChanges();

    auth.setContextStatus('loading');
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    expect(router.url).toBe('/settings');
    expect(reevaluateCurrentRouteAuthorization(auth, router, { forbiddenUrl: '/home' })).toBe(
      true,
    );
  });

  it('waits for hydration instead of redirecting canActivate to forbidden', async () => {
    TestBed.configureTestingModule({
      imports: [ShellStub],
      providers: [
        provideRouter(gatedRoutes),
        provideLocationMocks(),
      ],
    });
    const auth = TestBed.inject(PixelAuthorizationService);
    auth.setPermissionCatalog({
      version: '1',
      roles: CATALOG.roles,
      permissions: CATALOG.permissions,
    });
    auth.setContextStatus('loading');
    const fixture = TestBed.createComponent(ShellStub);
    fixture.detectChanges();
    const router = TestBed.inject(Router);

    const nav = router.navigateByUrl('/settings');
    await Promise.resolve();
    expect(router.url).not.toBe('/home');

    auth.setSubject({ id: 'u1', roles: ['admin'] });
    await nav;
    await fixture.whenStable();
    expect(router.url).toBe('/settings');
  });

  it('leaves ungated routes in place when the subject changes', async () => {
    const { router, auth, fixture } = await setup('admin');
    await router.navigateByUrl('/home');
    await fixture.whenStable();
    auth.setSubject({ id: 'u1', roles: ['viewer'] });
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    expect(router.url).toBe('/home');
  });
});
