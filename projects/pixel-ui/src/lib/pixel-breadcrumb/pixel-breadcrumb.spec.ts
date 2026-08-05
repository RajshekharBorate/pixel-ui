import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import PixelBreadcrumbComponent from './pixel-breadcrumb';
import PixelBreadcrumbItemComponent from './pixel-breadcrumb-item';
import { PixelBreadcrumbService } from './pixel-breadcrumb.service';
import type {
  PixelBreadcrumbClickEvent,
  PixelBreadcrumbItem,
  PixelBreadcrumbOverflowMode,
  PixelBreadcrumbSize,
  PixelBreadcrumbType,
} from './pixel-breadcrumb.types';
import { PIXEL_BREAKPOINT_PX } from '../shared/breakpoints';

@Component({
  imports: [PixelBreadcrumbComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-breadcrumb
        #bc
        [items]="items()"
        [type]="type()"
        [size]="size()"
        [maxVisibleItems]="maxVisibleItems()"
        [overflowMode]="overflowMode()"
        [separatorIcon]="separatorIcon()"
        [iconOnly]="iconOnly()"
        [showLastAsLink]="showLastAsLink()"
        [responsive]="responsive()"
        (itemClick)="lastClick.set($event)"
        (overflowToggle)="lastOverflow.set($event)"
      />
    </section>
  `,
})
class HostComponent {
  readonly bc = viewChild.required<PixelBreadcrumbComponent>('bc');
  readonly theme = signal<'light' | 'dark'>('light');
  readonly items = signal<readonly PixelBreadcrumbItem[] | null>([
    { label: 'Home', link: '/' },
    { label: 'Products', link: '/products' },
    { label: 'Laptops' },
  ]);
  readonly type = signal<PixelBreadcrumbType>('default');
  readonly size = signal<PixelBreadcrumbSize>('md');
  readonly maxVisibleItems = signal(0);
  readonly overflowMode = signal<PixelBreadcrumbOverflowMode>('dropdown');
  readonly separatorIcon = signal('');
  readonly iconOnly = signal(false);
  readonly showLastAsLink = signal(false);
  readonly responsive = signal(true);

  readonly lastClick = signal<PixelBreadcrumbClickEvent | null>(null);
  readonly lastOverflow = signal<boolean | null>(null);
}

@Component({
  imports: [PixelBreadcrumbComponent, PixelBreadcrumbItemComponent],
  template: `
    <pixel-breadcrumb>
      <pixel-breadcrumb-item label="Home" link="/" icon="home" />
      <pixel-breadcrumb-item label="Users" link="/users" />
      <pixel-breadcrumb-item label="Details" active />
    </pixel-breadcrumb>
  `,
})
class DeclarativeHost {}

@Component({ template: 'users works' })
class UsersStub {}

@Component({
  imports: [PixelBreadcrumbComponent, RouterOutlet],
  template: `<pixel-breadcrumb routeDriven /><router-outlet />`,
})
class RoutedHost {}

function items(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll<HTMLElement>('.pixel-breadcrumb__link')];
}

function setup(): { fixture: ComponentFixture<HostComponent>; host: HostComponent } {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [provideRouter([]), provideLocationMocks()],
  });
  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, host };
}

describe('PixelBreadcrumbComponent', () => {
  it('renders a semantic nav/ol trail with each item', () => {
    const { fixture } = setup();
    const nav = fixture.nativeElement.querySelector('nav.pixel-breadcrumb__nav');
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(fixture.nativeElement.querySelector('ol.pixel-breadcrumb__list')).toBeTruthy();
    const rendered = items(fixture.nativeElement);
    expect(rendered).toHaveLength(3);
    expect(rendered.map((n) => n.textContent?.trim())).toEqual(['Home', 'Products', 'Laptops']);
  });

  it('marks the last node as the current page with aria-current', () => {
    const { fixture } = setup();
    const current = fixture.nativeElement.querySelector('.pixel-breadcrumb__current');
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(current?.textContent?.trim()).toBe('Laptops');
    // The current node is not a link by default.
    expect(current?.tagName.toLowerCase()).toBe('span');
  });

  it('renders linked nodes as routerLink anchors', () => {
    const { fixture } = setup();
    const anchors = fixture.nativeElement.querySelectorAll('a.pixel-breadcrumb__link');
    expect(anchors).toHaveLength(2);
    expect(anchors[0].getAttribute('href')).toBe('/');
    expect(anchors[1].getAttribute('href')).toBe('/products');
  });

  it('emits a typed itemClick event on activation', () => {
    const { fixture, host } = setup();
    const [home] = items(fixture.nativeElement);
    home.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const event = host.lastClick();
    expect(event?.item.label).toBe('Home');
    expect(event?.index).toBe(0);
    expect(event?.isLast).toBe(false);
    expect(event?.source).toBe('mouse');
  });

  it('renders custom separators between nodes', () => {
    const { fixture, host } = setup();
    host.separatorIcon.set('chevron_right');
    fixture.detectChanges();
    const seps = fixture.nativeElement.querySelectorAll('.pixel-breadcrumb__separator-icon');
    expect(seps).toHaveLength(2);
    expect(seps[0].textContent?.trim()).toBe('chevron_right');
  });

  it('collapses the middle into an overflow dropdown when the trail exceeds maxVisibleItems', () => {
    const { fixture, host } = setup();
    host.items.set([
      { label: 'Home', link: '/' },
      { label: 'A', link: '/a' },
      { label: 'B', link: '/b' },
      { label: 'C', link: '/c' },
      { label: 'D', link: '/d' },
      { label: 'Current' },
    ]);
    host.maxVisibleItems.set(4);
    fixture.detectChanges();

    // Trigger present, middle nodes are not inline.
    const trigger = fixture.nativeElement.querySelector('.pixel-breadcrumb__item--overflow');
    expect(trigger).toBeTruthy();
    const labels = items(fixture.nativeElement).map((n) => n.textContent?.trim());
    expect(labels).toContain('Home');
    expect(labels).toContain('Current');
    expect(labels).not.toContain('B');
  });

  it('renders the overflow dropdown as a pixel-menu of real link rows', () => {
    const { fixture } = setup();
    fixture.componentInstance.items.set([
      { label: 'Home', link: '/' },
      { label: 'A', link: '/a' },
      { label: 'B', link: '/b' },
      { label: 'C', link: '/c' },
      { label: 'D', link: '/d' },
      { label: 'Current' },
    ]);
    fixture.componentInstance.maxVisibleItems.set(4);
    fixture.detectChanges();

    // The collapsed middle is a pixel-menu (panelClass hook) of role=menuitem rows...
    const menu = document.querySelector('.pixel-breadcrumb__menu');
    expect(menu?.getAttribute('role')).toBe('menu');
    const rows = menu?.querySelectorAll<HTMLElement>('pixel-menu-item') ?? [];
    expect(rows.length).toBeGreaterThan(0);
    // ...and each row is a real navigational anchor (native middle-click / open-in-new-tab).
    const anchor = menu?.querySelector<HTMLAnchorElement>('a.pixel-menu__item-anchor');
    expect(anchor?.getAttribute('href')).toBe('/a');

    // The trigger exposes disclosure semantics via the menu-trigger directive.
    const trigger = fixture.nativeElement.querySelector('.pixel-breadcrumb__overflow-btn');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens / closes the overflow dropdown and emits overflowToggle', () => {
    const { fixture, host } = setup();
    host.items.set([
      { label: 'Home', link: '/' },
      { label: 'A', link: '/a' },
      { label: 'B', link: '/b' },
      { label: 'C', link: '/c' },
      { label: 'D', link: '/d' },
      { label: 'Current' },
    ]);
    host.maxVisibleItems.set(4);
    fixture.detectChanges();

    host.bc().toggleOverflow();
    fixture.detectChanges();
    expect(host.lastOverflow()).toBe(true);
    const trigger = fixture.nativeElement.querySelector('.pixel-breadcrumb__overflow-btn');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    host.bc().closeOverflow();
    fixture.detectChanges();
    expect(host.lastOverflow()).toBe(false);
  });

  it('uses a static ellipsis when overflowMode is "ellipsis"', () => {
    const { fixture, host } = setup();
    host.items.set([
      { label: 'Home', link: '/' },
      { label: 'A', link: '/a' },
      { label: 'B', link: '/b' },
      { label: 'C', link: '/c' },
      { label: 'D', link: '/d' },
      { label: 'Current' },
    ]);
    host.maxVisibleItems.set(4);
    host.overflowMode.set('ellipsis');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-breadcrumb__ellipsis')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-breadcrumb__menu')).toBeFalsy();
  });

  it('recomputes collapse when maxVisibleItems changes (computed signals)', () => {
    const { fixture, host } = setup();
    host.items.set([
      { label: 'Home', link: '/' },
      { label: 'A', link: '/a' },
      { label: 'B', link: '/b' },
      { label: 'C' },
    ]);
    fixture.detectChanges();
    expect(host.bc().collapsed()).toBe(false);
    host.maxVisibleItems.set(2);
    fixture.detectChanges();
    expect(host.bc().collapsed()).toBe(true);
  });

  it('hides labels but keeps them accessible in icon-only mode', () => {
    const { fixture, host } = setup();
    host.items.set([
      { label: 'Home', link: '/', icon: 'home' },
      { label: 'Laptops', icon: 'laptop' },
    ]);
    host.iconOnly.set(true);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.pixel-breadcrumb__label');
    expect(label?.textContent?.trim()).toBe('Home');
    expect(label?.classList.contains('pixel-sr-only')).toBe(true);
  });

  it('renders badges via the reused pixel-badge', () => {
    const { fixture, host } = setup();
    host.items.set([
      { label: 'Orders', link: '/orders', badge: 5 },
      { label: 'Current' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('pixel-badge.pixel-breadcrumb__badge')).toBeTruthy();
  });

  it('exposes the size/type/variant via data attributes for theming', () => {
    const { fixture, host } = setup();
    host.size.set('lg');
    host.type.set('compact');
    fixture.detectChanges();
    const hostEl = fixture.nativeElement.querySelector('pixel-breadcrumb');
    expect(hostEl.getAttribute('data-size')).toBe('lg');
    expect(hostEl.getAttribute('data-type')).toBe('compact');
    expect(hostEl.getAttribute('data-variant')).toBe('minimal');
  });

  it('renders the last node as a link when showLastAsLink is set', () => {
    const { fixture, host } = setup();
    host.items.set([
      { label: 'Home', link: '/' },
      { label: 'Current', link: '/current' },
    ]);
    host.showLastAsLink.set(true);
    fixture.detectChanges();
    const anchors = fixture.nativeElement.querySelectorAll('a.pixel-breadcrumb__link');
    expect(anchors).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.pixel-breadcrumb__current')).toBeFalsy();
  });
});

describe('PixelBreadcrumbComponent responsive overflow', () => {
  class FakeMediaQueryList {
    matches = false;
    readonly listeners = new Set<() => void>();
    addEventListener(_type: string, listener: () => void): void {
      this.listeners.add(listener);
    }
    removeEventListener(_type: string, listener: () => void): void {
      this.listeners.delete(listener);
    }
    dispatch(): void {
      this.listeners.forEach((listener) => listener());
    }
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let fakeMql: FakeMediaQueryList;
  let matchMediaQueries: string[] = [];
  let resizeObserverCallback: ResizeObserverCallback | null = null;

  const deepTrail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/' },
    { label: 'A', link: '/a' },
    { label: 'B', link: '/b' },
    { label: 'C', link: '/c' },
    { label: 'D', link: '/d' },
    { label: 'Current' },
  ];

  beforeEach(async () => {
    fakeMql = new FakeMediaQueryList();
    matchMediaQueries = [];
    resizeObserverCallback = null;
    (window as unknown as { matchMedia: unknown }).matchMedia = (query: string) => {
      matchMediaQueries.push(query);
      return fakeMql;
    };
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        resizeObserverCallback = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.items.set(deepTrail);
    fixture.detectChanges();
  });

  it('subscribes to the sm breakpoint for responsive auto-collapse', () => {
    expect(matchMediaQueries).toContain(`(max-width: ${PIXEL_BREAKPOINT_PX.sm - 1}px)`);
  });

  it('auto-collapses deep trails on a narrow viewport without maxVisibleItems', () => {
    expect(host.bc().collapsed()).toBe(false);
    fakeMql.matches = true;
    fakeMql.dispatch();
    fixture.detectChanges();
    expect(host.bc().narrowViewport()).toBe(true);
    expect(host.bc().collapsed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.pixel-breadcrumb__item--overflow')).toBeTruthy();
    const labels = items(fixture.nativeElement).map((n) => n.textContent?.trim());
    expect(labels).toContain('Home');
    expect(labels).toContain('Current');
    expect(labels).not.toContain('B');
  });

  it('steps density down one size on a narrow viewport', () => {
    host.size.set('md');
    fakeMql.matches = true;
    fakeMql.dispatch();
    fixture.detectChanges();
    const hostEl = fixture.nativeElement.querySelector('pixel-breadcrumb');
    expect(hostEl.getAttribute('data-size')).toBe('sm');
  });

  it('does not auto-collapse when overflowMode is scroll', () => {
    host.overflowMode.set('scroll');
    fakeMql.matches = true;
    fakeMql.dispatch();
    fixture.detectChanges();
    expect(host.bc().collapsed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.pixel-breadcrumb--scroll')).toBeTruthy();
  });

  it('does not auto-collapse when responsive is false', () => {
    host.responsive.set(false);
    fakeMql.matches = true;
    fakeMql.dispatch();
    fixture.detectChanges();
    expect(host.bc().narrowViewport()).toBe(false);
    expect(host.bc().collapsed()).toBe(false);
  });

  it('tightens collapse when the list is wider than its container', () => {
    fakeMql.matches = false;
    fixture.detectChanges();
    expect(host.bc().collapsed()).toBe(false);

    const list = fixture.nativeElement.querySelector('.pixel-breadcrumb__list') as HTMLElement;
    Object.defineProperty(list, 'clientWidth', { configurable: true, get: () => 120 });
    Object.defineProperty(list, 'scrollWidth', { configurable: true, get: () => 400 });

    resizeObserverCallback?.([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
    fixture.detectChanges();

    expect(host.bc().collapsed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.pixel-breadcrumb__item--overflow')).toBeTruthy();
  });
});

describe('PixelBreadcrumbComponent (declarative items)', () => {
  it('maps projected <pixel-breadcrumb-item> into the trail', () => {
    TestBed.configureTestingModule({
      imports: [DeclarativeHost],
      providers: [provideRouter([]), provideLocationMocks()],
    });
    const fixture = TestBed.createComponent(DeclarativeHost);
    fixture.detectChanges();
    const labels = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '.pixel-breadcrumb__label',
      ),
    ].map((n) => n.textContent?.trim());
    expect(labels).toEqual(['Home', 'Users', 'Details']);
    const current = fixture.nativeElement.querySelector('.pixel-breadcrumb__current');
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(fixture.nativeElement.querySelector('.pixel-breadcrumb__icon')?.textContent?.trim()).toBe(
      'home',
    );
  });
});

describe('PixelBreadcrumbService (router integration)', () => {
  it('generates a trail from route data.breadcrumb on navigation', async () => {
    TestBed.configureTestingModule({
      imports: [RoutedHost],
      providers: [
        provideRouter([
          {
            path: 'users',
            component: UsersStub,
            data: { breadcrumb: 'Users' },
          },
        ]),
        provideLocationMocks(),
      ],
    });
    const fixture = TestBed.createComponent(RoutedHost);
    const router = TestBed.inject(Router);
    const service = TestBed.inject(PixelBreadcrumbService);
    fixture.detectChanges();

    await router.navigate(['/users']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.items().map((i) => i.label)).toEqual(['Users']);
    expect(service.currentLabel()).toBe('Users');
    const rendered = items(fixture.nativeElement).map((n) => n.textContent?.trim());
    expect(rendered).toContain('Users');
  });

  it('interpolates :params in dynamic labels', async () => {
    TestBed.configureTestingModule({
      imports: [RoutedHost],
      providers: [
        provideRouter([
          { path: 'users/:id', component: UsersStub, data: { breadcrumb: 'User :id' } },
        ]),
        provideLocationMocks(),
      ],
    });
    const fixture = TestBed.createComponent(RoutedHost);
    const router = TestBed.inject(Router);
    const service = TestBed.inject(PixelBreadcrumbService);
    fixture.detectChanges();

    await router.navigate(['/users/42']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.currentLabel()).toBe('User 42');
  });

  it('supports a function resolver reading the route snapshot', async () => {
    TestBed.configureTestingModule({
      imports: [RoutedHost],
      providers: [
        provideRouter([
          {
            path: 'users/:id',
            component: UsersStub,
            data: { breadcrumb: (r: { params: Record<string, string> }) => `#${r.params['id']}` },
          },
        ]),
        provideLocationMocks(),
      ],
    });
    const fixture = TestBed.createComponent(RoutedHost);
    const router = TestBed.inject(Router);
    const service = TestBed.inject(PixelBreadcrumbService);
    fixture.detectChanges();

    await router.navigate(['/users/7']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.currentLabel()).toBe('#7');
  });
});
