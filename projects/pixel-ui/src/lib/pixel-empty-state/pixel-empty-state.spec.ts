import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelEmptyStateComponent, {
  PixelEmptyStateAlign,
  PixelEmptyStateSize,
} from './pixel-empty-state';

@Component({
  imports: [PixelEmptyStateComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-empty-state
        [icon]="icon()"
        [heading]="heading()"
        [description]="description()"
        [size]="size()"
        [align]="align()"
        [announce]="announce()"
      >
        @if (withActions()) {
          <button pixelEmptyStateActions type="button" class="action-probe">Clear filters</button>
        }
      </pixel-empty-state>
    </section>
  `,
})
class HostComponent {
  readonly icon = signal('search_off');
  readonly heading = signal('No results');
  readonly description = signal('Try removing some filters.');
  readonly size = signal<PixelEmptyStateSize>('md');
  readonly align = signal<PixelEmptyStateAlign>('center');
  readonly announce = signal(false);
  readonly withActions = signal(true);
  readonly theme = signal<'light' | 'dark'>('light');
}

describe('PixelEmptyStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-empty-state') as HTMLElement;
  }

  it('renders icon, heading, description, and projected actions', () => {
    expect(el().querySelector('.pixel-empty-state__icon')?.textContent).toContain('search_off');
    expect(el().querySelector('.pixel-empty-state__heading')?.textContent).toContain(
      'No results',
    );
    expect(el().querySelector('.pixel-empty-state__description')?.textContent).toContain(
      'Try removing some filters.',
    );
    expect(el().querySelector('.pixel-empty-state__actions .action-probe')).toBeTruthy();
  });

  it('keeps the icon decorative for assistive tech', () => {
    expect(
      el().querySelector('.pixel-empty-state__icon')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('omits empty anatomy parts', () => {
    host.icon.set('');
    host.heading.set('');
    host.description.set('');
    fixture.detectChanges();
    expect(el().querySelector('.pixel-empty-state__icon')).toBeNull();
    expect(el().querySelector('.pixel-empty-state__heading')).toBeNull();
    expect(el().querySelector('.pixel-empty-state__description')).toBeNull();
  });

  it('reflects size and align through data attributes', () => {
    host.size.set('lg');
    host.align.set('start');
    fixture.detectChanges();
    expect(el().getAttribute('data-size')).toBe('lg');
    expect(el().getAttribute('data-align')).toBe('start');
  });

  it('is silent by default and announces only when opted in', () => {
    expect(el().getAttribute('role')).toBeNull();
    expect(el().getAttribute('aria-live')).toBeNull();

    host.announce.set(true);
    fixture.detectChanges();
    expect(el().getAttribute('role')).toBe('status');
    expect(el().getAttribute('aria-live')).toBe('polite');
  });
});
