import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, RouterLink, RouterOutlet, provideRouter } from '@angular/router';
import PixelTabNavComponent from './pixel-tab-nav';
import PixelTabLinkComponent from './pixel-tab-link';

@Component({ standalone: true, template: 'overview works' })
class OverviewStub {}

@Component({ standalone: true, template: 'activity works' })
class ActivityStub {}

@Component({
  standalone: true,
  imports: [PixelTabNavComponent, PixelTabLinkComponent, RouterLink, RouterOutlet],
  template: `
    <pixel-tab-nav ariaLabel="Sections">
      <a pixelTabLink routerLink="/overview" icon="dashboard">Overview</a>
      <a pixelTabLink routerLink="/activity">Activity</a>
    </pixel-tab-nav>
    <router-outlet />
  `,
})
class RoutedHost {}

@Component({
  standalone: true,
  imports: [PixelTabNavComponent, PixelTabLinkComponent],
  template: `
    <pixel-tab-nav>
      <a pixelTabLink [active]="true">Manual</a>
      <a pixelTabLink [active]="false">Other</a>
    </pixel-tab-nav>
  `,
})
class ManualHost {}

const routes = [
  { path: 'overview', component: OverviewStub },
  { path: 'activity', component: ActivityStub },
];

function links(el: HTMLElement): HTMLAnchorElement[] {
  return [...el.querySelectorAll<HTMLAnchorElement>('a[pixelTabLink]')];
}

describe('PixelTabNavComponent', () => {
  it('derives the active link from the URL and renders the routed component', async () => {
    TestBed.configureTestingModule({
      imports: [RoutedHost],
      providers: [provideRouter(routes), provideLocationMocks()],
    });
    const fixture = TestBed.createComponent(RoutedHost);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigate(['/overview']);
    await fixture.whenStable();
    fixture.detectChanges();

    let [overview, activity] = links(fixture.nativeElement);
    expect(overview.classList).toContain('pixel-tabs__tab--active');
    expect(overview.getAttribute('aria-selected')).toBe('true');
    expect(activity.classList).not.toContain('pixel-tabs__tab--active');
    expect(fixture.nativeElement.textContent).toContain('overview works');

    await router.navigate(['/activity']);
    await fixture.whenStable();
    fixture.detectChanges();

    [overview, activity] = links(fixture.nativeElement);
    expect(activity.classList).toContain('pixel-tabs__tab--active');
    expect(overview.classList).not.toContain('pixel-tabs__tab--active');
    expect(fixture.nativeElement.textContent).toContain('activity works');
  });

  it('renders an icon glyph and the projected label', async () => {
    TestBed.configureTestingModule({
      imports: [RoutedHost],
      providers: [provideRouter(routes), provideLocationMocks()],
    });
    const fixture = TestBed.createComponent(RoutedHost);
    fixture.detectChanges();
    await TestBed.inject(Router).navigate(['/overview']);
    fixture.detectChanges();

    const [overview] = links(fixture.nativeElement);
    expect(overview.querySelector('.pixel-tabs__tab-icon')?.textContent?.trim()).toBe('dashboard');
    expect(overview.querySelector('.pixel-tabs__tab-label')?.textContent?.trim()).toBe('Overview');
  });

  it('honours a manual [active] override without a router', () => {
    TestBed.configureTestingModule({ imports: [ManualHost] });
    const fixture = TestBed.createComponent(ManualHost);
    fixture.detectChanges();

    const [manual, other] = links(fixture.nativeElement);
    expect(manual.classList).toContain('pixel-tabs__tab--active');
    expect(other.classList).not.toContain('pixel-tabs__tab--active');
  });
});
