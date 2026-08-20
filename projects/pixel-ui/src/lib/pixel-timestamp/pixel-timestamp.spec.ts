import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PIXEL_TIMEZONE } from '../shared/datetime/pixel-timezone';
import PixelTimestampComponent from './pixel-timestamp';

// Use live-relative values so the component's internal nowTick (Date.now()) sees the same delta.
const FIVE_MIN_AGO = Date.now() - 5 * 60 * 1000;
const TEN_DAYS_AGO = Date.now() - 10 * 24 * 60 * 60 * 1000;
// A fixed past instant far enough back to exercise absolute display.
const FIXED_PAST = new Date('2026-01-01T12:00:00.000Z').getTime();

@Component({
  imports: [PixelTimestampComponent],
  template: `<pixel-timestamp [value]="value()" [mode]="mode()" [style]="style()"
    [locale]="locale()" [timeZone]="tz()" [absoluteAfterDays]="afterDays()" />`,
})
class TestHost {
  value = signal<string | number | Date>(FIVE_MIN_AGO);
  mode = signal<'relative' | 'absolute'>('relative');
  style = signal<'long' | 'short' | 'narrow' | 'compact'>('long');
  locale = signal('en-US');
  tz = signal('');
  afterDays = signal<number | null>(7);
}

function createHost(overrides?: Partial<{ value: string | number | Date }>) {
  const fixture = TestBed.createComponent(TestHost);
  if (overrides?.value !== undefined) {
    fixture.componentInstance.value.set(overrides.value);
  }
  fixture.detectChanges();
  return fixture;
}

describe('PixelTimestampComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  it('renders a <time> element with a datetime attribute', () => {
    const { nativeElement } = createHost();
    const time = nativeElement.querySelector('time');
    expect(time).toBeTruthy();
    expect(time.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('datetime attribute contains ISO UTC string for a Date input', () => {
    const d = new Date(FIXED_PAST);
    const fixture = createHost({ value: d });
    const time = fixture.nativeElement.querySelector('time');
    expect(time.getAttribute('datetime')).toBe(d.toISOString());
  });

  it('shows relative text for recent instant', () => {
    const { nativeElement } = createHost({ value: FIVE_MIN_AGO });
    const text = nativeElement.querySelector('time').textContent;
    expect(text).toMatch(/minute|ago|min/i);
  });

  it('switches to absolute when absoluteAfterDays is exceeded', () => {
    const fixture = createHost({ value: TEN_DAYS_AGO });
    const text = fixture.nativeElement.querySelector('time').textContent;
    // Absolute output contains a year digit
    expect(text).toMatch(/2026/);
  });

  it('mode=absolute always renders locale date-time', () => {
    const fixture = createHost({ value: FIXED_PAST });
    fixture.componentInstance.mode.set('absolute');
    fixture.componentInstance.locale.set('en-US');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('time').textContent;
    expect(text).toMatch(/2026/);
  });

  it('compact style renders short form', () => {
    // Use a value that is 2 hours ago relative to real Date.now() so nowTick matches.
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const fixture = createHost({ value: twoHoursAgo });
    fixture.componentInstance.style.set('compact');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('time').textContent;
    expect(text).toMatch(/h|hour/i);
  });

  it('time element exists by default', () => {
    const fixture = createHost({ value: FIVE_MIN_AGO });
    const time = fixture.nativeElement.querySelector('time');
    expect(time).toBeTruthy();
  });

  it('title attribute carries the absolute timestamp', () => {
    const fixture = createHost({ value: FIXED_PAST });
    const time = fixture.nativeElement.querySelector('time');
    expect(time.getAttribute('title')).toBeTruthy();
    expect(time.getAttribute('title')).toMatch(/2026/);
  });

  it('injects PIXEL_TIMEZONE token when no [timeZone] input is set', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: PIXEL_TIMEZONE, useValue: 'America/New_York' }],
    });
    // Use a fixed instant: 2026-01-01T12:00:00Z → New York is 07:00 AM (EST UTC-5).
    const fixture = createHost({ value: new Date('2026-01-01T12:00:00.000Z') });
    fixture.componentInstance.mode.set('absolute');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('time').textContent;
    expect(text).toMatch(/AM|7:/i);
  });
});
