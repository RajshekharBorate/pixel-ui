import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelAppShellComponent from './pixel-app-shell';
import PixelHeaderComponent from '../pixel-header/pixel-header';
import PixelFooterComponent from '../pixel-footer/pixel-footer';
import PixelSidenavComponent from '../pixel-sidenav/pixel-sidenav';

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
  standalone: true,
  imports: [
    PixelAppShellComponent,
    PixelHeaderComponent,
    PixelFooterComponent,
    PixelSidenavComponent,
  ],
  template: `
    <pixel-app-shell>
      <pixel-header><h1>Dashboard</h1></pixel-header>
      <pixel-sidenav [(opened)]="sidenavOpen" [collapseTo]="collapseTo()" [railWidth]="railWidth()">
        <nav>Links</nav>
      </pixel-sidenav>
      <pixel-footer><span>Footer</span></pixel-footer>
      <p>Main content</p>
    </pixel-app-shell>
  `,
})
class HostComponent {
  readonly sidenavOpen = signal(true);
  readonly collapseTo = signal<'hidden' | 'rail'>('hidden');
  readonly railWidth = signal(4.5);
}

@Component({
  standalone: true,
  imports: [PixelAppShellComponent, PixelFooterComponent],
  template: `
    <pixel-app-shell>
      <pixel-footer><span>Footer</span></pixel-footer>
      <p>Main content</p>
    </pixel-app-shell>
  `,
})
class NoHeaderHostComponent {}

describe('PixelAppShellComponent', () => {
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

  function getShell(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-app-shell') as HTMLElement;
  }

  it('projects header, sidenav, footer, and default content into their grid regions', () => {
    const shell = getShell();
    expect(shell.querySelector('.pixel-app-shell__header h1')?.textContent).toBe('Dashboard');
    expect(shell.querySelector('.pixel-app-shell__sidenav nav')?.textContent).toBe('Links');
    expect(shell.querySelector('.pixel-app-shell__footer span')?.textContent).toBe('Footer');
    expect(shell.querySelector('main.pixel-app-shell__content p')?.textContent).toBe('Main content');
  });

  it('reserves a grid column matching the docked, open sidenav width', () => {
    expect(getShell().style.gridTemplateColumns).toBe('16rem 1fr');
  });

  it('collapses the grid column to 0 when the sidenav is closed', () => {
    host.sidenavOpen.set(false);
    fixture.detectChanges();
    expect(getShell().style.gridTemplateColumns).toBe('0rem 1fr');
  });

  it('collapses the grid column to 0 when the sidenav switches to overlay mode', () => {
    fakeMql.simulate(true);
    fixture.detectChanges();
    expect(getShell().style.gridTemplateColumns).toBe('0rem 1fr');
  });

  it('reserves the rail width (not 0) when the sidenav is closed with collapseTo="rail"', () => {
    host.collapseTo.set('rail');
    host.railWidth.set(5);
    host.sidenavOpen.set(false);
    fixture.detectChanges();
    expect(getShell().style.gridTemplateColumns).toBe('5rem 1fr');
  });

  describe('toolbar divider', () => {
    it('renders a single full-width divider at the toolbar-height boundary when a header is projected', () => {
      const divider = getShell().querySelector('.pixel-app-shell__toolbar-divider');
      expect(divider).toBeTruthy();
    });

    it('does not render the divider when no header is projected', async () => {
      const noHeaderFixture = TestBed.createComponent(NoHeaderHostComponent);
      noHeaderFixture.detectChanges();
      const shell = noHeaderFixture.nativeElement.querySelector('pixel-app-shell') as HTMLElement;
      expect(shell.querySelector('.pixel-app-shell__toolbar-divider')).toBeNull();
    });
  });
});
