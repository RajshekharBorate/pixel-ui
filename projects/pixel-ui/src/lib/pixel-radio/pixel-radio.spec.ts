import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import PixelRadioComponent from './pixel-radio';
import PixelRadioGroupComponent from './pixel-radio-group';
import { PixelRadioOption, PixelRadioSelectionChangeEvent } from './pixel-radio.tokens';

@Component({
  standalone: true,
  imports: [PixelRadioGroupComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-radio-group
        label="Channel"
        helperText="Pick one"
        [value]="value()"
        [options]="options()"
        [layout]="layout()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [required]="required()"
        [state]="state()"
        (valueChange)="handleValueChange($event)"
        (selectionChange)="selectionEvents.push($event)"
        (focusChange)="focusEvents.push($event)"
        (blurChange)="blurEvents.push($event)"
      />
    </section>
  `,
})
class OptionsHostComponent {
  readonly value = signal<string | null>('email');
  readonly layout = signal<'horizontal' | 'vertical' | 'grid'>('vertical');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(true);
  readonly state = signal<'default' | 'error'>('default');
  readonly theme = signal<'light' | 'dark'>('light');
  readonly options = signal<readonly PixelRadioOption<string>[]>([
    { value: 'email', label: 'Email', icon: 'mail' },
    { value: 'sms', label: 'SMS', disabled: false },
    { value: 'push', label: 'Push', disabled: true },
  ]);
  readonly valueEvents: unknown[] = [];
  readonly selectionEvents: PixelRadioSelectionChangeEvent[] = [];
  readonly focusEvents: boolean[] = [];
  readonly blurEvents: boolean[] = [];

  handleValueChange(value: unknown): void {
    this.valueEvents.push(value);
    this.value.set(value as string);
  }
}

@Component({
  standalone: true,
  imports: [PixelRadioGroupComponent, PixelRadioComponent],
  template: `
    <pixel-radio-group label="Plan" [value]="plan()" (valueChange)="onPlanChange($event)">
      <pixel-radio value="starter" label="Starter" />
      <pixel-radio value="pro" label="Pro" />
    </pixel-radio-group>
  `,
})
class ProjectedHostComponent {
  readonly plan = signal('starter');

  onPlanChange(value: unknown): void {
    this.plan.set(String(value));
  }
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PixelRadioGroupComponent],
  template: `
    <pixel-radio-group
      label="Priority"
      required
      [formControl]="control"
      [options]="[
        { value: 'low', label: 'Low' },
        { value: 'high', label: 'High' },
      ]"
    />
  `,
})
class ReactiveFormsHostComponent {
  readonly control = new FormControl<string | null>(null, Validators.required);
}

@Component({
  standalone: true,
  imports: [FormsModule, PixelRadioGroupComponent],
  template: `
    <pixel-radio-group
      name="priority"
      label="Priority"
      required
      [(ngModel)]="priority"
      [options]="[
        { value: 'low', label: 'Low' },
        { value: 'high', label: 'High' },
      ]"
    />
  `,
})
class TemplateFormsHostComponent {
  priority: string | null = null;
}

describe('PixelRadioGroupComponent', () => {
  let fixture: ComponentFixture<OptionsHostComponent>;
  let host: OptionsHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionsHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OptionsHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getInputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  function getGroup(): PixelRadioGroupComponent {
    return fixture.debugElement.query(By.directive(PixelRadioGroupComponent))
      .componentInstance as PixelRadioGroupComponent;
  }

  it('creates the group and radios', () => {
    expect(getGroup()).toBeTruthy();
    expect(getInputs().length).toBe(3);
  });

  it('updates UI when selection changes', () => {
    host.value.set('sms');
    fixture.detectChanges();

    const checked = getInputs().find((input) => input.checked);
    expect(checked?.value).toBe('sms');
  });

  it('emits valueChange on selection', () => {
    const smsInput = getInputs()[1];
    smsInput.click();
    fixture.detectChanges();

    expect(host.valueEvents.at(-1)).toBe('sms');
    expect(host.value()).toBe('sms');
  });

  it('emits selectionChange with metadata', () => {
    getInputs()[1].click();
    fixture.detectChanges();

    expect(host.selectionEvents.length).toBeGreaterThan(0);
    expect(host.selectionEvents.at(-1)?.source).toBe('mouse');
    expect(host.selectionEvents.at(-1)?.value).toBe('sms');
  });

  it('supports arrow keyboard navigation', () => {
    const groupEl = fixture.nativeElement.querySelector('.pixel-radio__group') as HTMLElement;
    groupEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.value()).toBe('sms');
    expect(host.selectionEvents.at(-1)?.source).toBe('keyboard');
  });

  it('prevents interaction when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    getInputs()[1].click();
    fixture.detectChanges();

    expect(host.valueEvents.length).toBe(0);
    expect(host.value()).toBe('email');
  });

  it('prevents interaction when readonly', () => {
    host.readonly.set(true);
    fixture.detectChanges();

    getInputs()[1].click();
    fixture.detectChanges();

    expect(host.value()).toBe('email');
  });

  it('exposes aria attributes on radios', () => {
    const first = getInputs()[0];
    expect(first.getAttribute('role')).toBe('radio');
    expect(first.getAttribute('aria-checked')).toBe('true');
    expect(first.getAttribute('aria-disabled')).toBe('false');
  });

  it('applies group aria-required', () => {
    const fieldset = fixture.nativeElement.querySelector('fieldset');
    expect(fieldset.getAttribute('aria-required')).toBe('true');
  });

  it('applies CSS variables on host', () => {
    const style = getComputedStyle(fixture.nativeElement.querySelector('pixel-radio'));
    expect(style.getPropertyValue('--pixel-radio-selected').trim().length).toBeGreaterThan(0);
  });

  it('switches dark theme tokens via data-theme', () => {
    host.theme.set('dark');
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section');
    expect(section.getAttribute('data-theme')).toBe('dark');
  });
});

describe('PixelRadio projected options', () => {
  let fixture: ComponentFixture<ProjectedHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectedHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectedHostComponent);
    fixture.detectChanges();
  });

  it('selects projected radios', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    inputs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.plan()).toBe('pro');
  });
});

describe('PixelRadio forms integration', () => {
  it('works with reactive forms', () => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsHostComponent],
    });

    const fixture = TestBed.createComponent(ReactiveFormsHostComponent);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    host.control.setValue('high');
    fixture.detectChanges();

    const checked = fixture.nativeElement.querySelector(
      'input[type="radio"]:checked',
    ) as HTMLInputElement;
    expect(checked.value).toBe('high');
    expect(host.control.valid).toBe(true);
  });

  it('works with template-driven forms', async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormsHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TemplateFormsHostComponent);
    const host = fixture.componentInstance;
    host.priority = 'low';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const checked = fixture.nativeElement.querySelector(
      'input[type="radio"]:checked',
    ) as HTMLInputElement;
    expect(checked.value).toBe('low');
  });
});

describe('PixelRadioComponent focus outputs', () => {
  @Component({
    standalone: true,
    imports: [PixelRadioGroupComponent, PixelRadioComponent],
    template: `
      <pixel-radio-group label="Focus test" [value]="'a'">
        <pixel-radio value="a" label="A" (focusChange)="focused = $event" (blurChange)="blurred = $event" />
      </pixel-radio-group>
    `,
  })
  class FocusHostComponent {
    focused = false;
    blurred = false;
  }

  it('emits focus and blur outputs', async () => {
    await TestBed.configureTestingModule({
      imports: [FocusHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(FocusHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance.focused).toBe(true);
    expect(fixture.componentInstance.blurred).toBe(true);
  });
});
