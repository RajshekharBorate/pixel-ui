import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelButtonGroupComponent from './pixel-button-group';
import PixelButtonComponent from '../pixel-button/pixel-button';

@Component({
  imports: [PixelButtonGroupComponent, PixelButtonComponent],
  template: `
    <pixel-button-group
      [size]="size()"
      [appearance]="appearance()"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [fullWidth]="fullWidth()"
      [ariaLabel]="ariaLabel()"
    >
      <pixel-button appearance="outline">Day</pixel-button>
      <pixel-button appearance="outline">Week</pixel-button>
      <pixel-button appearance="outline">Month</pixel-button>
    </pixel-button-group>
  `,
})
class HostComponent {
  readonly size = signal<'xs' | 'sm' | 'md' | 'lg'>('md');
  readonly appearance = signal<'solid' | 'outline'>('outline');
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly disabled = signal(false);
  readonly fullWidth = signal(false);
  readonly ariaLabel = signal('View range');
}

describe('PixelButtonGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a group with projected buttons', () => {
    const group = fixture.debugElement.query(By.css('pixel-button-group'));
    expect(group.nativeElement.getAttribute('role')).toBe('group');
    expect(group.nativeElement.getAttribute('aria-label')).toBe('View range');
    expect(fixture.nativeElement.querySelectorAll('pixel-button').length).toBe(3);
  });

  it('reflects orientation and disabled host state', () => {
    host.orientation.set('vertical');
    host.disabled.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('pixel-button-group') as HTMLElement;
    expect(el.classList.contains('pixel-button-group--vertical')).toBe(true);
    expect(el.classList.contains('pixel-button-group--disabled')).toBe(true);
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  it('supports fullWidth', () => {
    host.fullWidth.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('pixel-button-group') as HTMLElement;
    expect(el.classList.contains('pixel-button-group--full-width')).toBe(true);
  });
});
