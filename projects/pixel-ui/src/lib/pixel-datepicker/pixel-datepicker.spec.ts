import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import {
  PIXEL_DD_MM_YYYY_FORMATS,
  provideNativeDateAdapter,
} from '../shared/datetime';
import { ConnectedOverlay } from '../shared/overlay/connected-overlay';
import PixelDatepickerComponent from './pixel-datepicker';

@Component({
  imports: [PixelDatepickerComponent],
  template: `
    <pixel-datepicker
      label="Event date"
      [value]="value()"
      (valueChange)="value.set($event)"
      (openChange)="openEvents.push($event)"
      [min]="min()"
      [max]="max()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [validationMessages]="validationMessages()"
    />
  `,
})
class HostComponent {
  readonly value = signal<Date | null>(null);
  readonly openEvents: boolean[] = [];
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly validationMessages = signal({ required: 'Date is required.' });
}

@Component({
  imports: [ReactiveFormsModule, PixelDatepickerComponent],
  template: `
    <pixel-datepicker
      label="Start date"
      [formControl]="control"
      [required]="true"
      [validationMessages]="{ required: 'Start date is required.' }"
    />
  `,
})
class ReactiveHostComponent {
  readonly control = new FormControl<Date | null>(null, { validators: [Validators.required] });
}

describe('PixelDatepickerComponent', () => {
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

  it('should create and compose pixel-input', () => {
    const input = fixture.debugElement.query(By.css('pixel-input'));
    expect(input).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-datepicker__input')).toBeTruthy();
  });

  function typeInField(text: string): HTMLInputElement {
    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    native.value = text;
    native.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    return native;
  }

  function blurField(native: HTMLInputElement): void {
    native.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();
  }

  it('should not commit while typing a partial date', () => {
    host.value.set(new Date(2024, 0, 10));
    fixture.detectChanges();

    typeInField('2024-06-1');
    expect(host.value()?.getDate()).toBe(10);
    expect(fixture.nativeElement.querySelector('.pixel-input__error')).toBeFalsy();
  });

  it('should emit valueChange when a valid ISO date is committed on blur', () => {
    const native = typeInField('2024-06-15');
    expect(host.value()).toBeNull();

    blurField(native);

    const value = host.value();
    expect(value?.getFullYear()).toBe(2024);
    expect(value?.getMonth()).toBe(5);
    expect(value?.getDate()).toBe(15);
  });

  it('should commit a valid typed date on Enter', () => {
    const native = typeInField('2024-06-15');
    native.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.value()?.getDate()).toBe(15);
  });

  it('should format committed values with locale numeric display by default', () => {
    host.value.set(new Date(2024, 5, 15));
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    // Locale-dependent; assert digits of the calendar day/month/year are present.
    expect(native.value).toMatch(/15/);
    expect(native.value).toMatch(/6|06/);
    expect(native.value).toMatch(/2024/);
    expect(native.value).not.toMatch(/Jun|June/i);
  });

  it('should show parse error override for invalid typed input after blur', () => {
    const native = typeInField('not-a-date');
    expect(fixture.nativeElement.querySelector('.pixel-input__error')).toBeFalsy();

    blurField(native);

    const error = fixture.nativeElement.querySelector('.pixel-input__error');
    expect(error?.textContent?.trim()).toBe('Enter a valid date');
    expect(native.value).toBe('not-a-date');
  });

  it('should open the calendar when the trailing icon is activated', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement | null;
    expect(button).toBeTruthy();
    button!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.openEvents.at(-1)).toBe(true);
    expect(fixture.nativeElement.querySelector('.pixel-datepicker--open')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-input--focused')).toBeTruthy();
    expect(document.querySelector('pixel-calendar')).toBeTruthy();
  });

  it('should stay open while the deferred calendar chunk loads', () => {
    const attachSpy = vi.spyOn(ConnectedOverlay.prototype, 'attach');
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement | null;
    button!.click();
    fixture.detectChanges();

    expect(host.openEvents.at(-1)).toBe(true);
    expect(host.openEvents.includes(false)).toBe(false);
    expect(fixture.nativeElement.querySelector('.pixel-datepicker--open')).toBeTruthy();
    for (const call of attachSpy.mock.calls) {
      const panel = call[1] as HTMLElement;
      expect(panel.querySelector('pixel-calendar')).toBeTruthy();
    }

    attachSpy.mockRestore();
  });
});

@Component({
  imports: [PixelDatepickerComponent],
  providers: [
    ...provideNativeDateAdapter({
      locale: 'en-GB',
      formats: PIXEL_DD_MM_YYYY_FORMATS,
    }),
  ],
  template: `
    <pixel-datepicker
      label="UK date"
      showFormatHint
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class FormatsHostComponent {
  readonly value = signal<Date | null>(null);
}

describe('PixelDatepickerComponent custom formats', () => {
  let fixture: ComponentFixture<FormatsHostComponent>;
  let host: FormatsHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormatsHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormatsHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display and parse dd/MM/yyyy from PIXEL_DATE_FORMATS', () => {
    host.value.set(new Date(2024, 5, 15));
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(native.value).toBe('15/06/2024');
    expect(fixture.nativeElement.querySelector('.pixel-input__helper')?.textContent).toContain(
      'DD/MM/YYYY',
    );

    native.value = '20/07/2024';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    native.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.value()?.getFullYear()).toBe(2024);
    expect(host.value()?.getMonth()).toBe(6);
    expect(host.value()?.getDate()).toBe(20);
    expect(native.value).toBe('20/07/2024');
  });
});

@Component({
  imports: [PixelDatepickerComponent],
  template: `
    <pixel-datepicker
      label="Modes"
      [value]="value()"
      (valueChange)="value.set($event)"
      (openChange)="openEvents.push($event)"
      [disabled]="disabled()"
      [inputDisabled]="inputDisabled()"
      [pickerDisabled]="pickerDisabled()"
      [readonly]="readonly()"
    />
  `,
})
class DisableModesHostComponent {
  readonly value = signal<Date | null>(new Date(2024, 5, 15));
  readonly openEvents: boolean[] = [];
  readonly disabled = signal(false);
  readonly inputDisabled = signal(false);
  readonly pickerDisabled = signal(false);
  readonly readonly = signal(false);
}

describe('PixelDatepickerComponent disable modes', () => {
  let fixture: ComponentFixture<DisableModesHostComponent>;
  let host: DisableModesHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisableModesHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisableModesHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function trailingButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement | null;
  }

  it('should disable both field and picker when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(native.disabled).toBe(true);
    expect(trailingButton()?.disabled).toBe(true);
  });

  it('should allow typing but disable the picker when pickerDisabled', () => {
    host.pickerDisabled.set(true);
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(native.disabled).toBe(false);
    expect(trailingButton()?.disabled).toBe(true);

    native.value = '2024-07-20';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    native.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.value()?.getDate()).toBe(20);
  });

  it('should disable the field but keep the picker when inputDisabled', () => {
    host.inputDisabled.set(true);
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(native.disabled).toBe(true);
    expect(trailingButton()?.disabled).toBe(false);

    trailingButton()!.click();
    fixture.detectChanges();
    expect(host.openEvents.at(-1)).toBe(true);
  });
});

@Component({
  imports: [PixelDatepickerComponent],
  template: `
    <pixel-datepicker
      label="Appointment"
      showActions
      [value]="value()"
      (valueChange)="value.set($event)"
      (openChange)="openEvents.push($event)"
    />
  `,
})
class ActionsHostComponent {
  readonly value = signal<Date | null>(null);
  readonly openEvents: boolean[] = [];
}

describe('PixelDatepickerComponent showActions', () => {
  let fixture: ComponentFixture<ActionsHostComponent>;
  let host: ActionsHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionsHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionsHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function openPanel(): Promise<void> {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function panel(): Element | null {
    return document.querySelector('.pixel-datepicker__panel');
  }

  function actionButton(label: string): HTMLButtonElement {
    const btn = [...(panel()?.querySelectorAll('.pixel-datepicker__actions button') ?? [])].find(
      (el) => el.querySelector('.pixel-button__label')?.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;
    expect(btn).toBeTruthy();
    return btn!;
  }

  it('should keep the panel open and not commit until Apply', async () => {
    await openPanel();
    expect(panel()?.querySelector('.pixel-datepicker__actions')).toBeTruthy();

    const dayBtn = [...(panel()?.querySelectorAll('[role="gridcell"]') ?? [])].find(
      (el) => el.textContent?.trim() === '15' && !(el as HTMLButtonElement).disabled,
    ) as HTMLButtonElement | undefined;
    expect(dayBtn).toBeTruthy();
    dayBtn!.click();
    fixture.detectChanges();

    expect(host.value()).toBeNull();
    expect(panel()).toBeTruthy();

    actionButton('Apply').click();
    fixture.detectChanges();

    expect(host.value()?.getDate()).toBe(15);
    expect(panel()).toBeFalsy();
  });

  it('should discard the draft on Cancel', async () => {
    await openPanel();
    const dayBtn = [...(panel()?.querySelectorAll('[role="gridcell"]') ?? [])].find(
      (el) => el.textContent?.trim() === '15' && !(el as HTMLButtonElement).disabled,
    ) as HTMLButtonElement;
    dayBtn.click();
    fixture.detectChanges();

    actionButton('Cancel').click();
    fixture.detectChanges();

    expect(host.value()).toBeNull();
    expect(panel()).toBeFalsy();
  });
});

@Component({
  imports: [PixelDatepickerComponent],
  template: `
    <pixel-datepicker
      label="Shift date"
      [dateFilter]="dateFilter"
      [validationMessages]="{ dateFilter: 'Choose a weekday.' }"
    />
  `,
})
class FilterHostComponent {
  readonly dateFilter = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };
}

@Component({
  imports: [PixelDatepickerComponent],
  template: `
    <pixel-datepicker label="Historical" [startAt]="startAt" />
  `,
})
class StartAtHostComponent {
  readonly startAt = new Date(2020, 0, 15);
}

@Component({
  imports: [PixelDatepickerComponent],
  template: `
    <pixel-datepicker label="Payday" [dateClass]="dateClass" />
  `,
})
class DateClassHostComponent {
  readonly dateClass = (date: Date): string | null => (date.getDate() === 15 ? 'demo-payday' : null);
}

describe('PixelDatepickerComponent dateFilter', () => {
  let fixture: ComponentFixture<FilterHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterHostComponent);
    fixture.detectChanges();
  });

  it('should reject a filtered date typed into the field after blur', () => {
    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    native.value = '2024-06-15';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-input__error')).toBeFalsy();

    native.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pixel-input__error')?.textContent?.trim()).toBe(
      'Choose a weekday.',
    );
  });

  it('should disable filtered days in the calendar', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const disabledInMonth = Array.from(
      document.querySelectorAll('.pixel-calendar__day:not(.pixel-calendar__day--outside)'),
    ).some((el) => (el as HTMLButtonElement).disabled);
    expect(disabledInMonth).toBe(true);
  });
});

describe('PixelDatepickerComponent startAt', () => {
  let fixture: ComponentFixture<StartAtHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartAtHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StartAtHostComponent);
    fixture.detectChanges();
  });

  it('should open the calendar on the startAt month when value is empty', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.querySelector('.pixel-calendar__period')?.textContent).toContain('2020');
  });
});

describe('PixelDatepickerComponent dateClass', () => {
  let fixture: ComponentFixture<DateClassHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateClassHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateClassHostComponent);
    fixture.detectChanges();
  });

  it('should apply custom CSS classes from dateClass', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const payday = Array.from(
      document.querySelectorAll('.pixel-calendar__day') as NodeListOf<HTMLElement>,
    ).find((el) => el.textContent?.trim() === '15' && el.classList.contains('demo-payday'));
    expect(payday).toBeTruthy();
  });
});

describe('PixelDatepickerComponent reactive forms', () => {
  let fixture: ComponentFixture<ReactiveHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
  });

  it('should show required validation message after touch', () => {
    const host = fixture.componentInstance;
    host.control.markAsTouched();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.pixel-input__error');
    expect(error?.textContent?.trim()).toBe('Start date is required.');
  });

  it('should show the selected date in the field when the form control updates', () => {
    const host = fixture.componentInstance;
    host.control.setValue(new Date(2024, 5, 15));
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(native.value).toMatch(/15/);
    expect(native.value).toMatch(/6|06/);
    expect(native.value).toMatch(/2024/);
  });
});
