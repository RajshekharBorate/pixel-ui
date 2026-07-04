import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelAppShellComponent from '../pixel-app-shell/pixel-app-shell';
import PixelHeaderComponent from '../pixel-header/pixel-header';
import PixelSidenavComponent, {
  PixelSidenavAutoCollapse,
  PixelSidenavCollapseTo,
  PixelSidenavMode,
} from './pixel-sidenav';

class FakeMediaQueryList {
  matches = false;
  private readonly listeners = new Set<() => void>();
  addEventListener(_type: 'change', listener: () => void): void {
    this.listeners.add(listener);
  }
  removeEventListener(_type: 'change', listener: () => void): void {
    this.listeners.delete(listener);
  }
  simulate(matches: boolean): void {
    this.matches = matches;
    this.listeners.forEach((listener) => listener());
  }
}

@Component({
  imports: [PixelSidenavComponent],
  template: `
    <pixel-sidenav
      [mode]="mode()"
      [autoCollapseBreakpoint]="autoCollapseBreakpoint()"
      [dismissable]="dismissable()"
      [collapseTo]="collapseTo()"
      [railWidth]="railWidth()"
      [(opened)]="opened"
      (modeChange)="modeChangeSpy($event)"
    >
      <button type="button">Nav item</button>
    </pixel-sidenav>
  `,
})
class HostComponent {
  readonly mode = signal<PixelSidenavMode>('side');
  readonly autoCollapseBreakpoint = signal<PixelSidenavAutoCollapse>('md');
  readonly dismissable = signal(true);
  readonly collapseTo = signal<PixelSidenavCollapseTo>('hidden');
  readonly railWidth = signal(4.5);
  readonly opened = signal(true);
  readonly modeChangeSpy = vi.fn();
}

@Component({
  imports: [PixelSidenavComponent],
  template: `
    <pixel-sidenav [(opened)]="opened" [brandBordered]="brandBordered()">
      @if (withBrand()) {
        <div pixelSidenavBrand>Brand</div>
      }
      <button type="button">Nav item</button>
    </pixel-sidenav>
  `,
})
class BrandHostComponent {
  readonly opened = signal(true);
  readonly withBrand = signal(false);
  readonly brandBordered = signal(true);
}

@Component({
  imports: [PixelAppShellComponent, PixelHeaderComponent, PixelSidenavComponent],
  template: `
    <pixel-app-shell>
      <pixel-header><h1>Title</h1></pixel-header>
      <pixel-sidenav>
        <div pixelSidenavBrand>Brand</div>
      </pixel-sidenav>
    </pixel-app-shell>
  `,
})
class InAppShellHostComponent {}

describe('PixelSidenavComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let fakeMql: FakeMediaQueryList;

  beforeEach(async () => {
    fakeMql = new FakeMediaQueryList();
    (window as unknown as { matchMedia: unknown }).matchMedia = () => fakeMql;

    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  // The panel is reparented to a body-level overlay layer in "over" mode, so it must be looked up
  // against the document, not `fixture.nativeElement`.
  function getPanel(): HTMLElement {
    return document.querySelector('.pixel-sidenav__panel') as HTMLElement;
  }

  function getScrim(): HTMLElement {
    return document.querySelector('.pixel-sidenav__scrim') as HTMLElement;
  }

  function getSidenav(): PixelSidenavComponent {
    return fixture.debugElement.query(By.directive(PixelSidenavComponent))
      .componentInstance as PixelSidenavComponent;
  }

  // [data-rail] is set on the <pixel-sidenav> host itself (the README's documented CSS hook
  // targets `pixel-sidenav[data-rail] ...`), not the inner .pixel-sidenav__panel.
  function getHost(): HTMLElement {
    return fixture.debugElement.query(By.directive(PixelSidenavComponent))
      .nativeElement as HTMLElement;
  }

  it('renders docked (side) by default with content in flow', () => {
    const panel = getPanel();
    expect(panel.getAttribute('data-mode')).toBe('side');
    expect(panel.classList.contains('pixel-sidenav__panel--collapsed')).toBe(false);
    expect(panel.querySelector('button')?.textContent).toBe('Nav item');
  });

  it('collapses (but keeps mounted) when closed in side mode', () => {
    host.opened.set(false);
    fixture.detectChanges();

    const panel = getPanel();
    expect(panel.classList.contains('pixel-sidenav__panel--collapsed')).toBe(true);
    expect(panel.getAttribute('inert')).toBe('');
    // Content stays mounted — not torn down.
    expect(panel.querySelector('button')).toBeTruthy();
  });

  it('switches to overlay mode when the viewport crosses the auto-collapse breakpoint', () => {
    fakeMql.simulate(true);
    fixture.detectChanges();

    const panel = getPanel();
    expect(panel.getAttribute('data-mode')).toBe('over');
    expect(host.modeChangeSpy).toHaveBeenCalledWith('over');
  });

  it('switches back to docked mode when the viewport widens past the breakpoint again', () => {
    fakeMql.simulate(true);
    fixture.detectChanges();
    fakeMql.simulate(false);
    fixture.detectChanges();

    expect(getPanel().getAttribute('data-mode')).toBe('side');
    expect(host.modeChangeSpy).toHaveBeenCalledWith('over');
    expect(host.modeChangeSpy).toHaveBeenCalledWith('side');
  });

  it('closes on scrim click while in overlay mode and dismissable', () => {
    fakeMql.simulate(true);
    fixture.detectChanges();

    const scrim = getScrim();
    scrim.click();
    fixture.detectChanges();

    expect(host.opened()).toBe(false);
  });

  it('does not close on scrim click when not dismissable', () => {
    host.dismissable.set(false);
    fakeMql.simulate(true);
    fixture.detectChanges();

    const scrim = getScrim();
    scrim.click();
    fixture.detectChanges();

    expect(host.opened()).toBe(true);
  });

  it('closes on Escape while in overlay mode', () => {
    fakeMql.simulate(true);
    fixture.detectChanges();

    getPanel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.opened()).toBe(false);
  });

  it('ignores Escape while docked (side mode)', () => {
    getPanel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.opened()).toBe(true);
  });

  it('never forces overlay mode when autoCollapseBreakpoint is none', () => {
    host.autoCollapseBreakpoint.set('none');
    fixture.detectChanges();
    fakeMql.simulate(true);
    fixture.detectChanges();

    expect(getPanel().getAttribute('data-mode')).toBe('side');
  });

  describe('icon-rail collapse', () => {
    it('defaults collapseTo to "hidden" — effectiveExtentRem is 0 when closed', () => {
      host.opened.set(false);
      fixture.detectChanges();

      expect(getSidenav().effectiveExtentRem()).toBe(0);
      expect(getHost().getAttribute('data-rail')).toBeNull();
    });

    it('collapses to the rail width (not 0) and sets [data-rail] on the host when collapseTo="rail"', () => {
      host.collapseTo.set('rail');
      host.railWidth.set(5);
      host.opened.set(false);
      fixture.detectChanges();

      const panel = getPanel();
      expect(panel.getAttribute('data-collapse-to')).toBe('rail');
      expect(getHost().getAttribute('data-rail')).toBe('');
      expect(getSidenav().effectiveExtentRem()).toBe(5);
      // Content stays mounted, matching the hidden-collapse behavior.
      expect(panel.querySelector('button')).toBeTruthy();
    });

    it('stays interactive (not inert) when rail-collapsed — its icons and toggle must stay clickable', () => {
      host.collapseTo.set('rail');
      host.opened.set(false);
      fixture.detectChanges();

      expect(getPanel().getAttribute('inert')).toBeNull();
    });

    it('is inert when collapsed to hidden (collapseTo default)', () => {
      host.opened.set(false);
      fixture.detectChanges();

      expect(getPanel().getAttribute('inert')).toBe('');
    });

    it('does not set [data-rail] while open, even with collapseTo="rail"', () => {
      host.collapseTo.set('rail');
      fixture.detectChanges();

      expect(getHost().getAttribute('data-rail')).toBeNull();
      expect(getSidenav().effectiveExtentRem()).toBe(16); // full width ('md' size)
    });

    it('reports 0 extent in overlay mode regardless of collapseTo', () => {
      host.collapseTo.set('rail');
      fakeMql.simulate(true);
      fixture.detectChanges();

      expect(getSidenav().effectiveExtentRem()).toBe(0);
      expect(getHost().getAttribute('data-rail')).toBeNull();
    });
  });

  describe('brand slot', () => {
    function getBrandRegion(): HTMLElement {
      return document.querySelector('.pixel-sidenav__brand') as HTMLElement;
    }

    function getItemsRegion(): HTMLElement {
      return document.querySelector('.pixel-sidenav__items') as HTMLElement;
    }

    it('renders an empty brand region when pixelSidenavBrand is not projected', () => {
      // The default HostComponent above never uses pixelSidenavBrand.
      expect(getBrandRegion().children.length).toBe(0);
    });

    it('projects pixelSidenavBrand content into the brand region', () => {
      const brandFixture = TestBed.createComponent(BrandHostComponent);
      brandFixture.componentInstance.withBrand.set(true);
      brandFixture.detectChanges();

      expect(getBrandRegion().textContent?.trim()).toBe('Brand');
    });

    it('keeps default-slot content in the scrolling items region, not the brand region', () => {
      const brandFixture = TestBed.createComponent(BrandHostComponent);
      brandFixture.componentInstance.withBrand.set(true);
      brandFixture.detectChanges();

      expect(getItemsRegion().querySelector('button')?.textContent).toBe('Nav item');
      expect(getBrandRegion().querySelector('button')).toBeNull();
    });

    it('applies the bordered modifier class by default', () => {
      const brandFixture = TestBed.createComponent(BrandHostComponent);
      brandFixture.componentInstance.withBrand.set(true);
      brandFixture.detectChanges();

      expect(getBrandRegion().classList.contains('pixel-sidenav__brand--bordered')).toBe(true);
    });

    it('omits the bordered modifier class when brandBordered is false (e.g. pixel-app-shell already draws a shared divider)', () => {
      const brandFixture = TestBed.createComponent(BrandHostComponent);
      brandFixture.componentInstance.withBrand.set(true);
      brandFixture.componentInstance.brandBordered.set(false);
      brandFixture.detectChanges();

      expect(getBrandRegion().classList.contains('pixel-sidenav__brand--bordered')).toBe(false);
    });

    it('automatically omits the bordered modifier class when composed inside pixel-app-shell with a pixel-header, even though brandBordered defaults to true', () => {
      const appShellFixture = TestBed.createComponent(InAppShellHostComponent);
      appShellFixture.detectChanges();

      const brand = document.querySelector('.pixel-sidenav__brand') as HTMLElement;
      expect(brand.classList.contains('pixel-sidenav__brand--bordered')).toBe(false);
    });
  });
});
