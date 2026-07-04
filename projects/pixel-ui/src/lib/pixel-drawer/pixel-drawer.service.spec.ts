import { ApplicationRef, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PixelDrawerService } from './pixel-drawer.service';
import { PixelDrawerRef } from './pixel-drawer-ref';
import { PIXEL_DRAWER_DATA } from './pixel-drawer.types';

interface DemoData {
  readonly name: string;
}

@Component({
  selector: 'test-drawer-content',
  template: `<p class="greeting">Hello {{ data.name }}</p>`,
})
class TestDrawerContent {
  readonly data = inject<DemoData>(PIXEL_DRAWER_DATA);
  readonly ref = inject<PixelDrawerRef<string, TestDrawerContent>>(PixelDrawerRef);

  confirm(): void {
    this.ref.close('confirmed');
  }
}

describe('PixelDrawerService', () => {
  let service: PixelDrawerService;

  beforeEach(() => {
    // Reduced motion makes the exit close synchronously, keeping the tests deterministic.
    (window as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true });
    TestBed.configureTestingModule({});
    service = TestBed.inject(PixelDrawerService);
  });

  afterEach(() => {
    service.closeAll();
  });

  it('opens a component, injecting data, and mounts it on the body', () => {
    service.open(TestDrawerContent, { data: { name: 'Ada' } });

    const greeting = document.body.querySelector('.greeting');
    expect(greeting?.textContent).toContain('Hello Ada');
    expect(service.openDrawers.length).toBe(1);
  });

  it('exposes the component instance on the ref', () => {
    const ref = service.open(TestDrawerContent, { data: { name: 'Ada' } });
    expect(ref.componentInstance).toBeInstanceOf(TestDrawerContent);
  });

  it('emits the result via afterClosed and tears down the overlay', async () => {
    const ref = service.open<TestDrawerContent, DemoData, string>(TestDrawerContent, {
      data: { name: 'Ada' },
    });
    let result: string | undefined;
    let completed = false;
    ref.afterClosed().subscribe({
      next: (value) => (result = value),
      complete: () => (completed = true),
    });

    ref.componentInstance?.confirm();
    // Closing flips the container's `open` signal; flush CD so the inner drawer runs its close
    // (in a real zoneless app this happens automatically on the next microtask).
    TestBed.inject(ApplicationRef).tick();

    expect(result).toBe('confirmed');
    expect(completed).toBe(true);
    expect(service.openDrawers.length).toBe(0);

    // View disposal (and overlay removal) is deferred to a microtask; let it run.
    await Promise.resolve();
    expect(document.body.querySelector('.greeting')).toBeNull();
  });

  it('closeAll() closes every open drawer', () => {
    service.open(TestDrawerContent, { data: { name: 'A' } });
    service.open(TestDrawerContent, { data: { name: 'B' } });
    expect(service.openDrawers.length).toBe(2);

    service.closeAll();
    TestBed.inject(ApplicationRef).tick();

    expect(service.openDrawers.length).toBe(0);
  });
});
