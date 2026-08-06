import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelCalendarComponent from './pixel-calendar';

@Component({
  imports: [PixelCalendarComponent],
  template: `
    <pixel-calendar
      [selected]="selected()"
      [disabled]="disabled()"
      (daySelected)="selected.set($event)"
    />
  `,
})
class HostComponent {
  readonly selected = signal<Date | null>(new Date(2026, 7, 5));
  readonly disabled = signal(false);
}

describe('PixelCalendarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a month grid with weekday headers', () => {
    expect(fixture.nativeElement.querySelector('.pixel-calendar-host, pixel-calendar')).toBeTruthy();
    const days = fixture.nativeElement.querySelectorAll(
      'button.pixel-calendar__day, .pixel-calendar__day',
    );
    expect(days.length).toBeGreaterThan(0);
  });

  it('selects a day and emits daySelected', () => {
    const dayBtns = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const target = dayBtns.find((btn) => /^\d+$/.test(btn.textContent?.trim() ?? '') && !btn.disabled);
    expect(target).toBeTruthy();
    target!.click();
    fixture.detectChanges();
    expect(host.selected()).toBeInstanceOf(Date);
  });

  it('ignores day activation when disabled', () => {
    const before = host.selected()?.getTime();
    host.disabled.set(true);
    fixture.detectChanges();
    const dayBtn = fixture.nativeElement.querySelector(
      'button.pixel-calendar__day:not(.pixel-calendar__day--placeholder)',
    ) as HTMLButtonElement | null;
    expect(dayBtn).toBeTruthy();
    dayBtn!.click();
    fixture.detectChanges();
    expect(host.selected()?.getTime()).toBe(before);
  });
});
