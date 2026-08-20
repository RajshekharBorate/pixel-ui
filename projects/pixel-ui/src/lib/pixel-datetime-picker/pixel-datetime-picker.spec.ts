import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import PixelDatetimePickerComponent, {
  PIXEL_COMMON_TIMEZONES,
} from './pixel-datetime-picker';

@Component({
  imports: [PixelDatetimePickerComponent],
  template: `<pixel-datetime-picker [value]="value()" [hideTimeZone]="hideZone()" />`,
})
class TestHost {
  value = signal<string | null>(null);
  hideZone = signal(false);
}

@Component({
  imports: [PixelDatetimePickerComponent, ReactiveFormsModule],
  template: `<pixel-datetime-picker [formControl]="ctrl" />`,
})
class FormHost {
  ctrl = new FormControl<string | null>(null);
}

describe('PixelDatetimePickerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost, FormHost] });
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('pixel-datepicker')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('pixel-timepicker')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('pixel-select')).toBeTruthy();
  });

  it('hides timezone select when hideTimeZone is true', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.hideZone.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('pixel-select')).toBeNull();
  });

  it('integrates with ReactiveFormsModule', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.value).toBeNull();
    expect(fixture.componentInstance.ctrl.invalid).toBe(false);
  });

  it('keeps a selected date visible while time is still incomplete', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const comp = fixture.debugElement.children[0].componentInstance as PixelDatetimePickerComponent;
    const selected = new Date(2026, 7, 14);

    comp['onDateChange'](selected);
    fixture.detectChanges();

    expect(comp['internalDate']()).toEqual(selected);
    expect(comp['resolvedUtcIso']()).toBeNull();
  });

  it('does not clear date when reactive form receives partial selection', () => {
    TestBed.resetTestingModule();
    @Component({
      imports: [PixelDatetimePickerComponent, ReactiveFormsModule],
      template: `<pixel-datetime-picker [formControl]="ctrl" [required]="true" />`,
    })
    class RequiredHost {
      ctrl = new FormControl<string | null>(null);
    }

    TestBed.configureTestingModule({ imports: [RequiredHost] });
    const fixture = TestBed.createComponent(RequiredHost);
    fixture.detectChanges();
    const comp = fixture.debugElement.children[0].componentInstance as PixelDatetimePickerComponent;
    const selected = new Date(2026, 7, 14);

    comp['onDateChange'](selected);
    fixture.detectChanges();

    expect(comp['internalDate']()).toEqual(selected);
    expect(fixture.componentInstance.ctrl.value).toBeNull();
    expect(fixture.componentInstance.ctrl.invalid).toBe(true);
  });

  it('adds the current timezone to the dropdown when it is not in the canned list', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const comp = fixture.debugElement.children[0].componentInstance as PixelDatetimePickerComponent;
    comp['internalTimeZone'].set('Asia/Calcutta');
    fixture.detectChanges();
    const options = comp['resolvedTimeZoneOptions']();
    expect(options[0]?.value).toBe('Asia/Calcutta');
  });

  it('PIXEL_COMMON_TIMEZONES includes IANA identifiers', () => {
    const values = PIXEL_COMMON_TIMEZONES.map((o) => o.value);
    expect(values).toContain('America/New_York');
    expect(values).toContain('Asia/Kolkata');
    expect(values).toContain('Europe/London');
    expect(values).toContain('UTC');
  });

  it('does not contain offset abbreviations like "IST" or "EST" as IANA ids', () => {
    const values = PIXEL_COMMON_TIMEZONES.map((o) => o.value);
    expect(values).not.toContain('IST');
    expect(values).not.toContain('EST');
    expect(values).not.toContain('PST');
  });
});

describe('localDateTimeToUtcIso (via component)', () => {
  it('converts IST date+time to UTC correctly', () => {
    // 14 Aug 2026 17:30 IST (Asia/Kolkata UTC+5:30) → 12:00 UTC
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const comp = fixture.debugElement.children[0].componentInstance as PixelDatetimePickerComponent;

    // Simulate user picking date 2026-08-14, time 17:30, tz Asia/Kolkata
    comp['internalDate'].set(new Date(2026, 7, 14)); // Aug 14
    comp['internalTime'].set('17:30');
    comp['internalTimeZone'].set('Asia/Kolkata');
    fixture.detectChanges();

    const utc = comp['resolvedUtcIso']();
    expect(utc).not.toBeNull();
    // Should be 2026-08-14T12:00:xx.xxxZ
    expect(utc).toMatch(/^2026-08-14T12:0[01]/);
  });
});
