import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelFileUploadComponent, { type PixelFileUploadVariant } from './pixel-file-upload';

@Component({
  imports: [PixelFileUploadComponent],
  template: `
    <pixel-file-upload
      label="Documents"
      [variant]="variant()"
      [showSkeleton]="skeleton()"
      [disabled]="disabled()"
    />
  `,
})
class HostComponent {
  readonly variant = signal<PixelFileUploadVariant>('dropzone');
  readonly skeleton = signal(false);
  readonly disabled = signal(false);
}

describe('PixelFileUploadComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement.querySelector('pixel-file-upload') as HTMLElement;
  }

  it('renders the dropzone variant by default with a label', () => {
    expect(el().getAttribute('data-variant')).toBe('dropzone');
    expect(fixture.nativeElement.textContent).toContain('Documents');
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeTruthy();
  });

  it('switches to the button variant', () => {
    host.variant.set('button');
    fixture.detectChanges();
    expect(el().getAttribute('data-variant')).toBe('button');
  });

  it('shows skeleton when showSkeleton is set', () => {
    host.skeleton.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('pixel-skeleton')).toBeTruthy();
  });
});
