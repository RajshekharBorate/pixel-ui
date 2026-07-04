import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import PixelAutocompleteComponent, {
  type PixelAutocompleteOption,
  type PixelAutocompleteSelectionChange,
} from './pixel-autocomplete';

const FRUITS: readonly PixelAutocompleteOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

@Component({
  imports: [PixelAutocompleteComponent],
  template: `
    <pixel-autocomplete
      label="Fruit"
      [options]="options()"
      [value]="value()"
      [allowCustomValue]="allowCustomValue()"
      [minChars]="minChars()"
      (valueChange)="value.set($event)"
      (optionSelected)="selections.push($event)"
      (openChange)="openEvents.push($event)"
      (searchChange)="searches.push($event)"
    />
  `,
})
class HostComponent {
  readonly options = signal<readonly PixelAutocompleteOption[]>(FRUITS);
  readonly value = signal<unknown>(null);
  readonly allowCustomValue = signal(true);
  readonly minChars = signal(0);
  readonly selections: PixelAutocompleteSelectionChange[] = [];
  readonly openEvents: boolean[] = [];
  readonly searches: string[] = [];
}

@Component({
  imports: [ReactiveFormsModule, PixelAutocompleteComponent],
  template: `
    <pixel-autocomplete
      label="Fruit"
      [options]="options"
      [formControl]="control"
      [required]="true"
      [validationMessages]="{ required: 'Fruit is required.' }"
    />
  `,
})
class ReactiveHostComponent {
  readonly options = FRUITS;
  readonly control = new FormControl<unknown>(null, { validators: [Validators.required] });
}

function typeInto(fixture: ComponentFixture<unknown>, text: string): void {
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function focusInput(fixture: ComponentFixture<unknown>): void {
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  input.dispatchEvent(new Event('focus', { bubbles: true }));
  fixture.detectChanges();
}

function keydown(fixture: ComponentFixture<unknown>, key: string): void {
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  fixture.detectChanges();
}

function panelOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.pixel-autocomplete__option'));
}

describe('PixelAutocompleteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Panel is body-appended; destroying the fixture runs the overlay's destroy hook so the
    // overlay layer is cleared between tests.
    fixture.destroy();
  });

  it('composes a pixel-input field', () => {
    expect(fixture.debugElement.query(By.css('pixel-input'))).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-autocomplete__input')).toBeTruthy();
  });

  it('opens on focus and lists all suggestions', () => {
    focusInput(fixture);
    expect(host.openEvents.at(-1)).toBe(true);
    expect(panelOptions().length).toBe(FRUITS.length);
  });

  it('filters options as the user types', () => {
    typeInto(fixture, 'ap');
    const labels = panelOptions().map((el) => el.textContent?.trim());
    expect(labels?.some((l) => l?.includes('Apple'))).toBe(true);
    expect(labels?.some((l) => l?.includes('Apricot'))).toBe(true);
    expect(labels?.some((l) => l?.includes('Banana'))).toBe(false);
  });

  it('commits the option value on click and fills the field', () => {
    focusInput(fixture);
    const apple = panelOptions().find((el) => el.textContent?.includes('Apple'))!;
    apple.click();
    fixture.detectChanges();
    expect(host.value()).toBe('apple');
    expect(host.selections.at(-1)?.option?.value).toBe('apple');
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('Apple');
  });

  it('navigates with the keyboard and selects with Enter', () => {
    focusInput(fixture);
    keydown(fixture, 'ArrowDown');
    keydown(fixture, 'ArrowDown');
    keydown(fixture, 'Enter');
    // First two enabled options are Apple, Apricot — index 1 is Apricot.
    expect(host.value()).toBe('apricot');
  });

  it('closes on Escape', () => {
    focusInput(fixture);
    expect(host.openEvents.at(-1)).toBe(true);
    keydown(fixture, 'Escape');
    expect(host.openEvents.at(-1)).toBe(false);
  });

  it('keeps custom text as the value when allowCustomValue is true', () => {
    typeInto(fixture, 'kiwi');
    expect(host.value()).toBe('kiwi');
  });

  it('shows a no-result message when nothing matches', () => {
    typeInto(fixture, 'zzz');
    expect(document.querySelector('.pixel-autocomplete__empty')?.textContent).toContain(
      'No matching results',
    );
  });

  it('does not select a disabled option', () => {
    focusInput(fixture);
    const cherry = panelOptions().find((el) => el.textContent?.includes('Cherry'))!;
    cherry.click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('respects minChars before opening', () => {
    host.minChars.set(2);
    fixture.detectChanges();
    typeInto(fixture, 'a');
    expect(host.openEvents.at(-1)).not.toBe(true);
    typeInto(fixture, 'ap');
    expect(host.openEvents.at(-1)).toBe(true);
  });
});

describe('PixelAutocompleteComponent (reactive forms)', () => {
  let fixture: ComponentFixture<ReactiveHostComponent>;
  let host: ReactiveHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(ReactiveHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is invalid while required and empty', () => {
    expect(host.control.valid).toBe(false);
    host.control.setValue('apple');
    fixture.detectChanges();
    expect(host.control.valid).toBe(true);
  });

  it('writes an external value into the field text', () => {
    host.control.setValue('banana');
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('Banana');
  });

  it('marks touched and shows the required error after focus + blur with no value', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('focus', { bubbles: true }));
    fixture.detectChanges();
    // Click away: the overlay's outside-pointer dismissal closes the panel.
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
    const error = fixture.nativeElement.querySelector('.pixel-input__error, [role="alert"]');
    expect(error?.textContent).toContain('Fruit is required.');
  });
});
