import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelTimepickerComponent from './pixel-timepicker';

@Component({
  imports: [PixelTimepickerComponent],
  template: `
    <pixel-timepicker
      label="Meeting"
      [value]="value()"
      (valueChange)="value.set($event)"
      [showSkeleton]="skeleton()"
    />
  `,
})
class HostComponent {
  readonly value = signal('09:30');
  readonly skeleton = signal(false);
}

describe('PixelTimepickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a labeled time field', () => {
    expect(fixture.nativeElement.querySelector('pixel-timepicker')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Meeting');
  });

  it('shows skeleton placeholders when showSkeleton is set', () => {
    host.skeleton.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('pixel-skeleton')).toBeTruthy();
  });
});
