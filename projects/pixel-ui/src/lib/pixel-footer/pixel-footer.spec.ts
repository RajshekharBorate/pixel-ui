import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelFooterComponent from './pixel-footer';

@Component({
  imports: [PixelFooterComponent],
  template: `
    <pixel-footer [bordered]="bordered()">
      <span>© 2026 Acme Inc.</span>
    </pixel-footer>
  `,
})
class HostComponent {
  readonly bordered = signal(true);
}

describe('PixelFooterComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getFooter(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-footer') as HTMLElement;
  }

  it('renders a native <footer> and projects content', () => {
    const el = getFooter();
    expect(el.querySelector('footer')).toBeTruthy();
    expect(el.querySelector('span')?.textContent).toBe('© 2026 Acme Inc.');
    expect(el.classList.contains('pixel-footer--bordered')).toBe(true);
  });

  it('removes the bordered modifier class when bordered is false', () => {
    host.bordered.set(false);
    fixture.detectChanges();
    expect(getFooter().classList.contains('pixel-footer--bordered')).toBe(false);
  });
});
