import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelDividerComponent, {
  PixelDividerOrientation,
  PixelDividerVariant,
} from './pixel-divider';

@Component({  imports: [PixelDividerComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-divider
        [orientation]="orientation()"
        [variant]="variant()"
        [inset]="inset()"
        [labeled]="labeled()"
      >
        @if (labeled()) {
          {{ label() }}
        }
      </pixel-divider>
    </section>
  `,
})
class HostComponent {
  readonly orientation = signal<PixelDividerOrientation>('horizontal');
  readonly variant = signal<PixelDividerVariant>('solid');
  readonly inset = signal(false);
  readonly labeled = signal(false);
  readonly label = signal('Section');
  readonly theme = signal<'light' | 'dark'>('light');
}

describe('PixelDividerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getDivider(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-divider') as HTMLElement;
  }

  it('renders a separator role and default horizontal orientation', () => {
    const el = getDivider();
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.classList.contains('pixel-divider--horizontal')).toBe(true);
  });

  it('reacts to orientation and variant changes', () => {
    host.orientation.set('vertical');
    host.variant.set('dashed');
    fixture.detectChanges();

    const el = getDivider();
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.classList.contains('pixel-divider--vertical')).toBe(true);
    expect(el.classList.contains('pixel-divider--dashed')).toBe(true);
  });

  it('applies inset spacing modifier', () => {
    host.inset.set(true);
    fixture.detectChanges();
    expect(getDivider().classList.contains('pixel-divider--inset')).toBe(true);
  });

  it('switches to labeled layout and projects the label', () => {
    host.labeled.set(true);
    fixture.detectChanges();

    const el = getDivider();
    expect(el.classList.contains('pixel-divider--labeled')).toBe(true);
    expect(el.querySelector('.pixel-divider__label')?.textContent?.trim()).toBe('Section');
    expect(el.querySelectorAll('.pixel-divider__line')).toHaveLength(2);
  });
});
