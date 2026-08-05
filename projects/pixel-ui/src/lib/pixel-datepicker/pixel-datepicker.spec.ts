import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
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

  it('should emit valueChange when a valid ISO date is typed', () => {
    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    native.value = '2024-06-15';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const value = host.value();
    expect(value?.getFullYear()).toBe(2024);
    expect(value?.getMonth()).toBe(5);
    expect(value?.getDate()).toBe(15);
  });

  it('should show parse error override for invalid typed input', () => {
    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    native.value = 'not-a-date';
    native.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.pixel-input__error');
    expect(error?.textContent?.trim()).toBe('Enter a valid date');
  });

  it('should open the calendar when the trailing icon is activated', () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement | null;
    expect(button).toBeTruthy();
    button!.click();
    fixture.detectChanges();

    expect(host.openEvents.at(-1)).toBe(true);
    expect(fixture.nativeElement.querySelector('.pixel-datepicker--open')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-input--focused')).toBeTruthy();
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

  it('should reject a filtered date typed into the field', () => {
    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    native.value = '2024-06-15';
    native.dispatchEvent(new Event('input', { bubbles: true }));
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
});
