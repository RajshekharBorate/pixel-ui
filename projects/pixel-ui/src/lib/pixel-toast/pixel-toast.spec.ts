import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelToastComponent from './pixel-toast';
import PixelToastContainerComponent from './pixel-toast-container';
import { PixelToastService } from './pixel-toast.service';

@Component({
  imports: [PixelToastComponent, PixelToastContainerComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-toast-container />
      <pixel-toast
        [type]="standaloneType()"
        [title]="standaloneTitle()"
        [message]="standaloneMessage()"
        [variant]="standaloneVariant()"
        [progressBar]="standaloneProgress()"
        [role]="standaloneRole()"
      />
    </section>
  `,
})
class HostComponent {
  readonly theme = signal<'light' | 'dark'>('light');
  readonly standaloneType = signal<'success' | 'error' | 'info' | 'warning'>('success');
  readonly standaloneTitle = signal('Saved');
  readonly standaloneMessage = signal('Your draft was stored.');
  readonly standaloneVariant = signal<'soft' | 'solid'>('soft');
  readonly standaloneProgress = signal(false);
  readonly standaloneRole = signal<'status' | 'alert' | undefined>(undefined);
}

describe('PixelToastComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let service: PixelToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    service = TestBed.inject(PixelToastService);
    service.clear();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders standalone toast with semantic soft styling', () => {
    const el = fixture.nativeElement.querySelector('.pixel-toast') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute('data-type')).toBe('success');
    expect(el.getAttribute('data-variant')).toBe('soft');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.textContent).toContain('Saved');
  });

  it('uses alert role for error type by default', () => {
    const host = fixture.componentInstance;
    host.standaloneType.set('error');
    host.standaloneRole.set(undefined);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.pixel-toast') as HTMLElement;
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('exposes aria-describedby for message', () => {
    const el = fixture.nativeElement.querySelector('.pixel-toast') as HTMLElement;
    const describedBy = el.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toBeTruthy();
  });
});

describe('PixelToastService', () => {
  let service: PixelToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PixelToastService);
    service.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.clear();
    vi.useRealTimers();
  });

  it('shows success and error toasts', () => {
    const successId = service.success('Done', 'All good');
    const errorId = service.error('Failed', 'Try again');
    expect(service.toasts().length).toBe(2);
    expect(service.toasts().find((t) => t.id === successId)?.config.type).toBe('success');
    expect(service.toasts().find((t) => t.id === errorId)?.config.type).toBe('error');
  });

  it('prevents duplicate toasts when enabled', () => {
    service.configure({ duplicatePrevention: true });
    const first = service.info('Sync', 'Already running');
    const second = service.info('Sync', 'Already running');
    expect(first).toBe(second);
    expect(service.toasts().length).toBe(1);
  });

  it('queues toasts beyond max visible', () => {
    service.configure({ maxVisible: 2, enableQueue: true });
    service.show({ title: 'One' });
    service.show({ title: 'Two' });
    service.show({ title: 'Three' });
    expect(service.toasts().filter((t) => !t.exiting).length).toBe(2);
    expect(service.queue().length).toBe(1);
  });

  it('auto dismisses after timeout', () => {
    const id = service.show({ title: 'Brief', timeOut: 1000, progressBar: false });
    expect(service.toasts().some((t) => t.id === id)).toBe(true);
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(300);
    expect(service.toasts().some((t) => t.id === id)).toBe(false);
  });

  it('pauses progress on hover', () => {
    const id = service.show({ title: 'Hover me', timeOut: 2000, progressBar: true });
    service.setHovered(id, true);
    const paused = service.toasts().find((t) => t.id === id)?.paused;
    expect(paused).toBe(true);
  });

  it('removes toast manually', () => {
    const id = service.success('Remove me');
    service.remove(id);
    vi.advanceTimersByTime(300);
    expect(service.toasts().some((t) => t.id === id)).toBe(false);
  });

  it('resolves promise lifecycle', async () => {
    const promise = service.promise(
      Promise.resolve('ok'),
      { loading: 'Saving…', success: 'Saved!', error: 'Failed' },
    );
    expect(service.toasts()[0]?.config.type).toBe('promise');
    await promise;
    vi.advanceTimersByTime(300);
    const types = service.toasts().map((t) => t.config.type);
    expect(types).toContain('success');
  });

  it('groups toasts by position', () => {
    service.show({ title: 'TL', position: 'top-left' });
    service.show({ title: 'BR', position: 'bottom-right' });
    expect(service.activePositions()).toEqual(
      expect.arrayContaining(['top-left', 'bottom-right']),
    );
  });

  it('clears all toasts', () => {
    service.success('A');
    service.error('B');
    service.clear();
    vi.advanceTimersByTime(300);
    expect(service.toasts().length).toBe(0);
  });

  it('routes inline toasts separately from overlay stacks', () => {
    service.show({ title: 'Overlay' });
    service.inline({ message: 'Inline', variant: 'outlined' });
    expect(service.visibleByPosition().get('top-right')?.length).toBe(1);
    expect(service.visibleInlineByAnchor().get('default')?.length).toBe(1);
    expect(service.visibleInlineByAnchor().get('default')?.[0]?.config.variant).toBe('outlined');
  });

  it('clears inline toasts by anchor', () => {
    service.inline({ message: 'A' });
    service.inline({ message: 'B', inlineAnchor: 'other' });
    service.clearInline('default');
    vi.advanceTimersByTime(300);
    expect(service.visibleInlineByAnchor().get('default')?.length ?? 0).toBe(0);
    expect(service.visibleInlineByAnchor().get('other')?.length).toBe(1);
  });
});

describe('PixelToastContainerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const service = TestBed.inject(PixelToastService);
    service.clear();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders container stacks for active positions', () => {
    const service = TestBed.inject(PixelToastService);
    service.info('Hello', 'World', { position: 'top-right' });
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector(
      '.pixel-toast-container[data-position="top-right"]',
    );
    expect(container).toBeTruthy();
    expect(container.querySelectorAll('pixel-toast').length).toBe(1);
  });
});
