import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import PixelDateRangePickerComponent from './pixel-date-range-picker';
import { PixelDateRange } from './pixel-date-range';
import type { PixelDateRangeSelectionStrategy } from './pixel-date-range-selection-strategy';

@Component({
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  template: `
    <pixel-date-range-picker
      label="Stay dates"
      [formGroup]="form"
      [min]="min()"
      [max]="max()"
      [dateFilter]="filter()"
      (rangeChange)="rangeEvents.push($event)"
      (openChange)="openEvents.push($event)"
      [validationMessages]="{
        required: 'Both dates are required.',
        dateFilter: 'Choose a weekday.',
      }"
    />
  `,
})
class HostComponent {
  readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  readonly rangeEvents: Array<{ start: Date | null; end: Date | null }> = [];
  readonly openEvents: boolean[] = [];
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly filter = signal<((date: Date) => boolean) | null>(null);
}

@Component({
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  template: `
    <pixel-date-range-picker
      label="Trip"
      [formGroup]="form"
      [required]="true"
      [validationMessages]="{ required: 'Start is required.' }"
    />
  `,
})
class ValidationHostComponent {
  readonly form = new FormGroup({
    start: new FormControl<Date | null>(null, { validators: [Validators.required] }),
    end: new FormControl<Date | null>(null),
  });
}

describe('PixelDateRangePickerComponent', () => {
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

  it('should compose a single pixel-input field', () => {
    expect(fixture.debugElement.nativeElement.querySelector('pixel-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-date-range-picker__input')).toBeTruthy();
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

  it('should not patch controls while typing a partial range', () => {
    host.form.controls.start.setValue(new Date(2024, 5, 1));
    host.form.controls.end.setValue(new Date(2024, 5, 5));
    fixture.detectChanges();

    typeInField('2024-06-10 – 2024-06-1');
    expect(host.form.controls.start.value?.getDate()).toBe(1);
    expect(host.form.controls.end.value?.getDate()).toBe(5);
    expect(fixture.nativeElement.querySelector('.pixel-input__error')).toBeFalsy();
  });

  it('should show committed range text in the field when form controls update', () => {
    host.form.controls.start.setValue(new Date(2024, 5, 10));
    host.form.controls.end.setValue(new Date(2024, 5, 14));
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(native.value).toMatch(/10/);
    expect(native.value).toMatch(/14/);
    expect(native.value).toMatch(/2024/);
    expect(native.value).toMatch(/–|-/);
  });

  it('should patch controls when a range is committed on blur', () => {
    const native = typeInField('2024-06-10 – 2024-06-14');
    expect(host.form.controls.start.value).toBeNull();

    blurField(native);

    expect(host.form.controls.start.value?.getDate()).toBe(10);
    expect(host.form.controls.end.value?.getDate()).toBe(14);
  });

  it('should commit a typed range on Enter', () => {
    const native = typeInField('2024-06-10 – 2024-06-14');
    native.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.form.controls.start.value?.getDate()).toBe(10);
    expect(host.form.controls.end.value?.getDate()).toBe(14);
  });

  it('should open calendar and emit openChange', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.openEvents.at(-1)).toBe(true);
    expect(document.querySelector('.pixel-date-range-picker__panel')).toBeTruthy();
  });

  it('should apply a range from the calendar in two clicks', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = document.querySelector('.pixel-date-range-picker__panel');
    const clickDay = (day: number) => {
      const cell = [...panel!.querySelectorAll('[role="gridcell"]')].find(
        (el) => el.textContent?.trim() === String(day) && !(el as HTMLButtonElement).disabled,
      ) as HTMLButtonElement;
      cell.click();
    };
    clickDay(10);
    fixture.detectChanges();
    clickDay(14);
    fixture.detectChanges();

    expect(host.form.controls.start.value?.getDate()).toBe(10);
    expect(host.form.controls.end.value?.getDate()).toBe(14);
    expect(host.openEvents.at(-1)).toBe(false);
  });

  it('should highlight a committed range when the panel reopens', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = document.querySelector('.pixel-date-range-picker__panel');
    const clickDay = (day: number) => {
      const cell = [...panel!.querySelectorAll('[role="gridcell"]')].find(
        (el) => el.textContent?.trim() === String(day) && !(el as HTMLButtonElement).disabled,
      ) as HTMLButtonElement;
      cell.click();
    };
    clickDay(10);
    fixture.detectChanges();
    clickDay(14);
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.querySelector('.pixel-date-range-picker__panel')).toBeTruthy();
    expect(document.querySelectorAll('.pixel-calendar__day--in-range').length).toBeGreaterThan(0);
    expect(document.querySelector('.pixel-calendar__day--range-start')).toBeTruthy();
    expect(document.querySelector('.pixel-calendar__day--range-end')).toBeTruthy();
  });

  it('should reject a filtered date typed into the field after blur', () => {
    host.filter.set((date) => date.getDay() !== 0 && date.getDay() !== 6);
    fixture.detectChanges();

    const native = typeInField('2024-06-15');
    expect(fixture.nativeElement.querySelector('.pixel-input__error')).toBeFalsy();

    blurField(native);

    expect(fixture.nativeElement.querySelector('.pixel-input__error')?.textContent?.trim()).toBe(
      'Choose a weekday.',
    );
  });
});

describe('PixelDateRangePickerComponent custom selection strategy', () => {
  const threeDayStrategy: PixelDateRangeSelectionStrategy<Date> = {
    selectionFinished(date) {
      if (!date) {
        return new PixelDateRange<Date>(null, null);
      }
      const start = new Date(date);
      start.setDate(date.getDate() - 1);
      const end = new Date(date);
      end.setDate(date.getDate() + 1);
      return new PixelDateRange(start, end);
    },
    createPreview(activeDate, currentRange) {
      return threeDayStrategy.selectionFinished(activeDate, currentRange, new Event('mouseenter'));
    },
  };

  @Component({
    imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
    template: `
      <pixel-date-range-picker
        label="Custom"
        [formGroup]="form"
        [selectionStrategy]="strategy"
      />
    `,
  })
  class StrategyHostComponent {
    readonly form = new FormGroup({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    });
    readonly strategy = threeDayStrategy;
  }

  let fixture: ComponentFixture<StrategyHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrategyHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StrategyHostComponent);
    fixture.detectChanges();
  });

  it('should apply a custom strategy range in one click', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = document.querySelector('.pixel-date-range-picker__panel');
    const cell = [...panel!.querySelectorAll('[role="gridcell"]')].find(
      (el) => el.textContent?.trim() === '15' && !(el as HTMLButtonElement).disabled,
    ) as HTMLButtonElement;
    cell.click();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    expect(host.form.controls.start.value?.getDate()).toBe(14);
    expect(host.form.controls.end.value?.getDate()).toBe(16);
    expect(document.querySelector('.pixel-date-range-picker__panel')).toBeFalsy();
  });

  it('should show strategy preview styling when hovering after a range is already selected', async () => {
    const button = fixture.nativeElement.querySelector(
      '.pixel-input__action--trailing button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const panel = () => document.querySelector('.pixel-date-range-picker__panel');
    const clickDay = (day: number) => {
      const cell = [...panel()!.querySelectorAll('[role="gridcell"]')].find(
        (el) => el.textContent?.trim() === String(day) && !(el as HTMLButtonElement).disabled,
      ) as HTMLButtonElement;
      cell.click();
    };

    clickDay(15);
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const hoverDay = [...panel()!.querySelectorAll('[role="gridcell"]')].find(
      (el) => el.textContent?.trim() === '16' && !(el as HTMLButtonElement).disabled,
    ) as HTMLButtonElement;
    hoverDay.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(document.querySelectorAll('.pixel-calendar__day--preview-range').length).toBe(3);
    expect(document.querySelectorAll('.pixel-calendar__day--in-range').length).toBeGreaterThan(0);
    expect(
      [...document.querySelectorAll('.pixel-calendar__day--preview-range')].some((el) =>
        el.classList.contains('pixel-calendar__day--in-range'),
      ),
    ).toBe(true);
  });
});

@Component({
  imports: [ReactiveFormsModule, PixelDateRangePickerComponent],
  template: `
    <pixel-date-range-picker
      label="Travel"
      showActions
      [formGroup]="form"
      (rangeChange)="rangeEvents.push($event)"
    />
  `,
})
class ActionsHostComponent {
  readonly form = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  readonly rangeEvents: Array<{ start: Date | null; end: Date | null }> = [];
}

describe('PixelDateRangePickerComponent showActions', () => {
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
    return document.querySelector('.pixel-date-range-picker__panel');
  }

  function clickDay(day: number): void {
    const cell = [...(panel()?.querySelectorAll('[role="gridcell"]') ?? [])].find(
      (el) => el.textContent?.trim() === String(day) && !(el as HTMLButtonElement).disabled,
    ) as HTMLButtonElement;
    cell.click();
    fixture.detectChanges();
  }

  function actionButton(label: string): HTMLButtonElement {
    const btn = [
      ...(panel()?.querySelectorAll('.pixel-date-range-picker__actions button') ?? []),
    ].find(
      (el) => el.querySelector('.pixel-button__label')?.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;
    expect(btn).toBeTruthy();
    return btn!;
  }

  it('should not commit the range until Apply', async () => {
    await openPanel();
    expect(panel()?.querySelector('.pixel-date-range-picker__actions')).toBeTruthy();

    clickDay(10);
    clickDay(14);

    expect(host.form.controls.start.value).toBeNull();
    expect(host.form.controls.end.value).toBeNull();
    expect(panel()).toBeTruthy();

    actionButton('Apply').click();
    fixture.detectChanges();

    expect(host.form.controls.start.value?.getDate()).toBe(10);
    expect(host.form.controls.end.value?.getDate()).toBe(14);
    expect(panel()).toBeFalsy();
  });

  it('should discard the draft on Cancel', async () => {
    await openPanel();
    clickDay(10);
    clickDay(14);

    actionButton('Cancel').click();
    fixture.detectChanges();

    expect(host.form.controls.start.value).toBeNull();
    expect(host.form.controls.end.value).toBeNull();
    expect(panel()).toBeFalsy();
  });
});

describe('PixelDateRangePickerComponent validation', () => {
  let fixture: ComponentFixture<ValidationHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidationHostComponent);
    fixture.detectChanges();
  });

  it('should show required validation from the start control', () => {
    const host = fixture.componentInstance;
    host.form.controls.start.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pixel-input__error')?.textContent?.trim()).toBe(
      'Start is required.',
    );
  });
});
