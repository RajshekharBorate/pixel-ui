import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelPaginatorComponent, {
  type PixelPageEvent,
  type PixelPaginatorSize,
  type PixelPaginatorVariant,
} from './pixel-paginator';

@Component({
  imports: [PixelPaginatorComponent],
  template: `
    <pixel-paginator
      [length]="length()"
      [(pageIndex)]="pageIndex"
      [(pageSize)]="pageSize"
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      (page)="lastPage.set($event)"
    />
  `,
})
class HostComponent {
  readonly length = signal(100);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly variant = signal<PixelPaginatorVariant>('default');
  readonly size = signal<PixelPaginatorSize>('md');
  readonly disabled = signal(false);
  readonly lastPage = signal<PixelPageEvent | null>(null);
}

describe('PixelPaginatorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-paginator') as HTMLElement;
  }

  it('renders a navigation landmark with an accessible name', () => {
    expect(el().getAttribute('role')).toBe('navigation');
    expect(el().getAttribute('aria-label')).toContain('Pagination');
  });

  it('reflects size and variant on the host', () => {
    host.size.set('sm');
    host.variant.set('minimal');
    fixture.detectChanges();
    expect(el().getAttribute('data-size')).toBe('sm');
    expect(el().getAttribute('data-variant')).toBe('minimal');
  });

  it('emits page when navigating to the next page', () => {
    const next = fixture.nativeElement.querySelector(
      '[aria-label="Next page"]',
    ) as HTMLElement | null;
    expect(next).toBeTruthy();
    next!.click();
    fixture.detectChanges();
    expect(host.pageIndex()).toBe(1);
    expect(host.lastPage()?.pageIndex).toBe(1);
    expect(host.lastPage()?.previousPageIndex).toBe(0);
  });

  it('marks the host disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(el().classList.contains('pixel-paginator--disabled')).toBe(true);
  });

  it('renders a size label and page-size control (label CSS-hidden below sm)', () => {
    // Responsive hide is CSS-only (`breakpoint-down(sm)` in SCSS / RESPONSIVE.md):
    // size label + page-number buttons hidden; prev/next remain. Assert DOM targets exist.
    const sizeLabel = el().querySelector('.pixel-paginator__size-label');
    const sizeWrap = el().querySelector('.pixel-paginator__size-wrap');
    expect(sizeLabel).toBeTruthy();
    expect(sizeWrap).toBeTruthy();
    expect(sizeLabel?.textContent?.toLowerCase()).toContain('page');
    expect(el().querySelector('.pixel-paginator__pages')).toBeTruthy();
  });
});
