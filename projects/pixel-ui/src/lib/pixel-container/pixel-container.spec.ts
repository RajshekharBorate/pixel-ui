import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelContainerComponent, { PixelContainerMaxWidth } from './pixel-container';

@Component({
  imports: [PixelContainerComponent],
  template: `
    <pixel-container [maxWidth]="maxWidth()" [fluid]="fluid()" [padded]="padded()">
      <p>Content</p>
    </pixel-container>
  `,
})
class HostComponent {
  readonly maxWidth = signal<PixelContainerMaxWidth>('lg');
  readonly fluid = signal(false);
  readonly padded = signal(true);
}

describe('PixelContainerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getContainer(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-container') as HTMLElement;
  }

  it('defaults to a padded lg container and projects content', () => {
    const el = getContainer();
    expect(el.getAttribute('data-max-width')).toBe('lg');
    expect(el.classList.contains('pixel-container--padded')).toBe(true);
    expect(el.querySelector('p')?.textContent).toBe('Content');
  });

  it('reflects maxWidth changes', () => {
    host.maxWidth.set('xl');
    fixture.detectChanges();
    expect(getContainer().getAttribute('data-max-width')).toBe('xl');
  });

  it('forces data-max-width to full when fluid, regardless of maxWidth', () => {
    host.maxWidth.set('sm');
    host.fluid.set(true);
    fixture.detectChanges();
    expect(getContainer().getAttribute('data-max-width')).toBe('full');
  });

  it('removes the padded modifier class when padded is false', () => {
    host.padded.set(false);
    fixture.detectChanges();
    expect(getContainer().classList.contains('pixel-container--padded')).toBe(false);
  });
});
