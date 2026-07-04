import { ApplicationRef, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PixelDialogService } from './pixel-dialog.service';
import { PixelDialogRef } from './pixel-dialog-ref';
import { PIXEL_DIALOG_DATA } from './pixel-dialog.types';

interface DemoData {
  readonly name: string;
}

@Component({
  selector: 'test-dialog-content',
  template: `<p class="greeting">Hello {{ data.name }}</p>`,
})
class TestDialogContent {
  readonly data = inject<DemoData>(PIXEL_DIALOG_DATA);
  readonly ref = inject<PixelDialogRef<string, TestDialogContent>>(PixelDialogRef);

  confirm(): void {
    this.ref.close('confirmed');
  }
}

describe('PixelDialogService', () => {
  let service: PixelDialogService;

  beforeEach(() => {
    // Reduced motion makes the exit close synchronously, keeping the tests deterministic.
    (window as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true });
    TestBed.configureTestingModule({});
    service = TestBed.inject(PixelDialogService);
  });

  afterEach(() => {
    service.closeAll();
  });

  it('opens a component, injecting data, and mounts it on the body', () => {
    service.open(TestDialogContent, { data: { name: 'Ada' } });

    const greeting = document.body.querySelector('.greeting');
    expect(greeting?.textContent).toContain('Hello Ada');
    expect(service.openDialogs.length).toBe(1);
  });

  it('exposes the component instance on the ref', () => {
    const ref = service.open(TestDialogContent, { data: { name: 'Ada' } });
    expect(ref.componentInstance).toBeInstanceOf(TestDialogContent);
  });

  it('emits the result via afterClosed and tears down the overlay', async () => {
    const ref = service.open<TestDialogContent, DemoData, string>(TestDialogContent, {
      data: { name: 'Ada' },
    });
    let result: string | undefined;
    let completed = false;
    ref.afterClosed().subscribe({
      next: (value) => (result = value),
      complete: () => (completed = true),
    });

    ref.componentInstance?.confirm();
    // Closing flips the container's `open` signal; flush CD so the inner dialog runs its close
    // (in a real zoneless app this happens automatically on the next microtask).
    TestBed.inject(ApplicationRef).tick();

    expect(result).toBe('confirmed');
    expect(completed).toBe(true);
    expect(service.openDialogs.length).toBe(0);

    // View disposal (and overlay removal) is deferred to a microtask; let it run.
    await Promise.resolve();
    expect(document.body.querySelector('.greeting')).toBeNull();
  });

  it('closeAll() closes every open dialog', () => {
    service.open(TestDialogContent, { data: { name: 'A' } });
    service.open(TestDialogContent, { data: { name: 'B' } });
    expect(service.openDialogs.length).toBe(2);

    service.closeAll();
    TestBed.inject(ApplicationRef).tick();

    expect(service.openDialogs.length).toBe(0);
  });
});
