import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { delay, of } from 'rxjs';
import { By } from '@angular/platform-browser';
import PixelInputComponent, {
  PixelInputLabelPosition,
  PixelInputSize,
  PixelInputType,
} from './pixel-input';

@Component({
  standalone: true,
  imports: [PixelInputComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-input
        id="city"
        label="City"
        name="city"
        [value]="value()"
        [type]="type()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [required]="required()"
        [size]="size()"
        [loading]="loading()"
        [disabledWhileLoading]="disabledWhileLoading()"
        [labelPosition]="labelPosition()"
        [helperText]="helperText()"
        [maxLength]="maxLength()"
        [minLength]="minLength()"
        [pattern]="pattern()"
        [placeholder]="placeholder()"
        [prefixText]="prefixText()"
        [suffixText]="suffixText()"
        [showClear]="showClear()"
        [showPasswordToggle]="showPasswordToggle()"
        [spellcheck]="spellcheck()"
        [className]="className()"
        [classList]="classList()"
        (valueChange)="valueEvents.push($event)"
        (inputChange)="inputEvents.push($event)"
        (focusChange)="focusEvents.push($event)"
        (blurChange)="blurEvents.push($event)"
        (enterPress)="enterEvents.push($event)"
        (clearClick)="clearEvents.push($event)"
        (iconClick)="iconEvents.push($event)"
      />
    </section>
  `,
})
class HostComponent {
  readonly value = signal('san');
  readonly type = signal<PixelInputType>('text');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly size = signal<PixelInputSize>('md');
  readonly loading = signal(false);
  readonly disabledWhileLoading = signal(false);
  readonly labelPosition = signal<PixelInputLabelPosition>('top');
  readonly helperText = signal('');
  readonly maxLength = signal(0);
  readonly minLength = signal(0);
  readonly pattern = signal('');
  readonly placeholder = signal('');
  readonly prefixText = signal('');
  readonly suffixText = signal('');
  readonly showClear = signal(false);
  readonly showPasswordToggle = signal(false);
  readonly spellcheck = signal(true);
  readonly theme = signal<'light' | 'dark'>('light');
  readonly className = signal('external-input');
  readonly classList = signal<Record<string, boolean>>({ emphasized: true });
  readonly valueEvents: string[] = [];
  readonly inputEvents: string[] = [];
  readonly focusEvents: boolean[] = [];
  readonly blurEvents: boolean[] = [];
  readonly enterEvents: KeyboardEvent[] = [];
  readonly clearEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly iconEvents: unknown[] = [];
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PixelInputComponent],
  template: `
    <pixel-input
      label="Email"
      helperText="Use your work email."
      [validationMessages]="{
        required: 'Email is required.',
        email: 'Enter a valid email address.',
      }"
      [formControl]="control"
    />
  `,
})
class ReactiveHostComponent {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
}

@Component({
  standalone: true,
  imports: [FormsModule, PixelInputComponent],
  template: `
    <pixel-input label="Nickname" name="nick" [(ngModel)]="nickname" />
  `,
})
class TemplateHostComponent {
  nickname = 'Ada';
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PixelInputComponent],
  template: `
    <pixel-input label="Async field" [formControl]="control" [showLoaderWhenPending]="showLoader()" />
  `,
})
class AsyncPendingHostComponent {
  readonly control = new FormControl('', {
    nonNullable: true,
    asyncValidators: [() => of(null).pipe(delay(400))],
  });
  readonly showLoader = signal(true);
}

describe('PixelInputComponent', () => {
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

  function getNativeInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
  }

  function getRoot(): HTMLElement {
    return fixture.nativeElement.querySelector('.pixel-input') as HTMLElement;
  }

  function getClearButton(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.pixel-input__action--clear') as HTMLElement;
  }

  function getPasswordToggle(): HTMLElement | null {
    return fixture.nativeElement.querySelector(
      '.pixel-input__action--password',
    ) as HTMLElement;
  }

  function getComponent(): PixelInputComponent {
    return fixture.debugElement.query(By.directive(PixelInputComponent))
      .componentInstance as PixelInputComponent;
  }

  it('creates the host and component', () => {
    expect(host).toBeTruthy();
    expect(getComponent()).toBeTruthy();
  });

  it('updates UI when host signals change', () => {
    host.value.set('Paris');
    host.size.set('lg');
    host.labelPosition.set('left');
    fixture.detectChanges();

    const input = getNativeInput();
    const root = getRoot();

    expect(input.value).toBe('Paris');
    expect(root.classList.contains('pixel-input--lg')).toBe(true);
    expect(root.classList.contains('pixel-input--label-left')).toBe(true);
  });

  it('normalizes custom class bindings', () => {
    const root = getRoot();

    expect(root.classList.contains('external-input')).toBe(true);
    expect(root.classList.contains('emphasized')).toBe(true);
  });

  it('emits valueChange and inputChange when the user types', () => {
    const input = getNativeInput();
    input.value = 'san francisco';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.valueEvents.at(-1)).toBe('san francisco');
    expect(host.inputEvents.at(-1)).toBe('san francisco');
  });

  it('emits focus and blur outputs', () => {
    const input = getNativeInput();

    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(host.focusEvents).toEqual([true]);
    expect(host.blurEvents).toEqual([true]);
  });

  it('emits enterPress on Enter', () => {
    const input = getNativeInput();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.enterEvents).toHaveLength(1);
    expect(host.enterEvents[0].key).toBe('Enter');
  });

  it('shows a clear button and clears the value when clicked', () => {
    host.showClear.set(true);
    fixture.detectChanges();

    const clear = getClearButton();
    expect(clear).toBeTruthy();

    clear?.click();
    fixture.detectChanges();

    expect(getNativeInput().value).toBe('');
    expect(host.valueEvents.at(-1)).toBe('');
    expect(host.clearEvents).toHaveLength(1);
  });

  it('toggles password visibility and emits iconClick', () => {
    host.type.set('password');
    host.showPasswordToggle.set(true);
    fixture.detectChanges();

    const input = getNativeInput();
    expect(input.type).toBe('password');

    getPasswordToggle()?.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(host.iconEvents).toHaveLength(1);
  });

  it('prevents edits when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    const input = getNativeInput();
    expect(input.disabled).toBe(true);
    expect(getRoot().classList.contains('pixel-input--disabled')).toBe(true);
  });

  it('shows loading UI without disabling the input by default', () => {
    host.loading.set(true);
    fixture.detectChanges();

    const input = getNativeInput();
    expect(input.disabled).toBe(false);
    expect(getRoot().classList.contains('pixel-input--state-loading')).toBe(true);
    expect(getRoot().classList.contains('pixel-input--disabled')).toBe(false);
    expect(fixture.nativeElement.querySelector('.pixel-input__spinner')).toBeTruthy();
  });

  it('disables the field when loading and disabledWhileLoading are true', () => {
    host.loading.set(true);
    host.disabledWhileLoading.set(true);
    fixture.detectChanges();

    const input = getNativeInput();
    expect(input.disabled).toBe(true);
    expect(getRoot().classList.contains('pixel-input--state-loading')).toBe(true);
    expect(getRoot().classList.contains('pixel-input--disabled')).toBe(true);
  });

  it('sets readonly on the native input', () => {
    host.readonly.set(true);
    fixture.detectChanges();

    const input = getNativeInput();
    expect(input.readOnly).toBe(true);
    expect(getRoot().classList.contains('pixel-input--readonly')).toBe(true);
  });

  it('computes derived state for value presence', () => {
    const component = getComponent() as unknown as { hasValue: () => boolean };
    expect(component.hasValue()).toBe(true);

    host.value.set('');
    fixture.detectChanges();

    expect(component.hasValue()).toBe(false);
  });

  it('shows a character counter when maxLength is set', () => {
    host.maxLength.set(10);
    host.value.set('abc');
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('.pixel-input__counter') as HTMLElement;
    expect(counter.textContent?.trim()).toBe('3 / 10');
  });

  it('marks counter over max length', () => {
    host.maxLength.set(3);
    host.value.set('abcd');
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('.pixel-input__counter') as HTMLElement;
    expect(counter.classList.contains('pixel-input__counter--over')).toBe(true);
  });

  it('exposes expected ARIA attributes', () => {
    host.required.set(true);
    host.helperText.set('Helper copy');
    host.maxLength.set(5);
    fixture.detectChanges();

    const input = getNativeInput();

    expect(input.id).toBe('city');
    expect(input.name).toBe('city');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.getAttribute('aria-describedby')).toContain('pixel-input-');
    expect(input.getAttribute('aria-describedby')).toContain('helper');
    expect(input.getAttribute('aria-describedby')).toContain('counter');
  });

  it('applies component CSS variables in light mode', () => {
    const hostElement = fixture.nativeElement.querySelector('pixel-input') as HTMLElement;
    const styles = getComputedStyle(hostElement);

    expect(styles.getPropertyValue('--pixel-sys-primary').trim()).toBe('#2962ff');
    expect(styles.getPropertyValue('--pixel-input-bg').trim()).toBe(
      'var(--pixel-sys-surface, #fdfbff)',
    );
    expect(styles.getPropertyValue('--pixel-input-error').trim()).toBe(
      'var(--pixel-sys-error, #b3261e)',
    );
  });

  it('switches CSS variables under an explicit dark theme parent', () => {
    host.theme.set('dark');
    fixture.detectChanges();

    const hostElement = fixture.nativeElement.querySelector('pixel-input') as HTMLElement;
    const styles = getComputedStyle(hostElement);

    expect(styles.getPropertyValue('--pixel-sys-primary').trim()).toBe('#ffabf3');
    expect(styles.getPropertyValue('--pixel-input-bg').trim()).toBe(
      'var(--pixel-sys-surface-container-low, #1e1a1d)',
    );
  });

  it('renders multiline helper text with control flow', () => {
    host.helperText.set('Line one\nLine two');
    fixture.detectChanges();

    const helper = fixture.nativeElement.querySelector('.pixel-input__helper') as HTMLElement;
    expect(helper.textContent).toContain('Line one');
    expect(helper.textContent).toContain('Line two');
  });

  it('clears the field on Escape when clear is enabled', () => {
    host.showClear.set(true);
    host.value.set('temp');
    fixture.detectChanges();

    const input = getNativeInput();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(host.valueEvents.at(-1)).toBe('');
  });
});

describe('PixelInputComponent forms integration', () => {
  it('works as a reactive form control value accessor', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;

    expect(input.value).toBe('');

    host.control.setValue('hello@example.com');
    fixture.detectChanges();

    expect(input.value).toBe('hello@example.com');

    input.value = 'oops';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe('oops');
  });

  it('uses setDisabledState when a reactive form control is disabled', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    host.control.disable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('works with template-driven ngModel', async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TemplateHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;
    expect(input.value).toBe('Ada');

    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.nickname).toBe('Grace');
  });

  it('derives error state from a touched invalid reactive control', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    host.control.setValue('');
    host.control.markAsTouched();
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.pixel-input') as HTMLElement;
    const input = fixture.nativeElement.querySelector('.pixel-input__native') as HTMLInputElement;

    expect(root.classList.contains('pixel-input--state-error')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    const errorEl = fixture.nativeElement.querySelector('.pixel-input__error') as HTMLElement;
    expect(errorEl?.textContent?.trim()).toBe('Email is required.');
    expect(input.getAttribute('aria-describedby')).toContain('error');
    expect(fixture.nativeElement.querySelector('.pixel-input__helper')).toBeNull();
  });

  it('shows the email validation message when the value is not an email', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    host.control.setValue('not-an-email');
    host.control.markAsDirty();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.pixel-input__error') as HTMLElement;
    expect(errorEl?.textContent?.trim()).toBe('Enter a valid email address.');
  });

  it('shows loading UI while async validation is pending', async () => {
    TestBed.configureTestingModule({ imports: [AsyncPendingHostComponent] });
    const fixture = TestBed.createComponent(AsyncPendingHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    host.control.setValue('check-me');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.pixel-input') as HTMLElement;
    expect(root.classList.contains('pixel-input--state-loading')).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 450));
    fixture.detectChanges();
    expect(root.classList.contains('pixel-input--state-loading')).toBe(false);
  });

  it('does not show loading UI when pending if showLoaderWhenPending is false', async () => {
    TestBed.configureTestingModule({ imports: [AsyncPendingHostComponent] });
    const fixture = TestBed.createComponent(AsyncPendingHostComponent);
    const host = fixture.componentInstance;
    host.showLoader.set(false);
    fixture.detectChanges();

    host.control.setValue('check-me');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.pixel-input') as HTMLElement;
    expect(root.classList.contains('pixel-input--state-loading')).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 450));
    fixture.detectChanges();
  });
});
