import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import PixelCheckboxComponent, {
  PixelCheckboxSize,
  PixelCheckboxState,
  PixelCheckboxStateChangeEvent,
} from './pixel-checkbox';

@Component({  imports: [PixelCheckboxComponent],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-checkbox
        id="terms"
        name="terms"
        value="accepted"
        label="Accept terms"
        helperText="Required before continuing"
        ariaDescribedBy="external-help"
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [disabled]="disabled()"
        [required]="required()"
        [readonly]="readonly()"
        [size]="size()"
        [state]="state()"
        [labelPosition]="labelPosition()"
        [className]="className()"
        [classList]="classList()"
        [checkedIcon]="checkedIcon()"
        [indeterminateIcon]="indeterminateIcon()"
        (checkedChange)="handleCheckedChange($event)"
        (stateChange)="handleStateChange($event)"
        (focusChange)="focusEvents.push($event)"
        (blurChange)="blurEvents.push($event)"
        (click)="clickEvents.push($event)"
      />
      <p id="external-help">External helper</p>
    </section>
  `,
})
class HostComponent {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(true);
  readonly readonly = signal(false);
  readonly size = signal<PixelCheckboxSize>('md');
  readonly state = signal<PixelCheckboxState | undefined>(undefined);
  readonly labelPosition = signal<'left' | 'right'>('right');
  readonly className = signal('external-checkbox');
  readonly classList = signal<Record<string, boolean>>({ emphasized: true });
  readonly checkedIcon = signal('Y');
  readonly indeterminateIcon = signal('-');
  readonly theme = signal<'light' | 'dark'>('light');
  readonly checkedEvents: boolean[] = [];
  readonly stateEvents: PixelCheckboxStateChangeEvent[] = [];
  readonly focusEvents: boolean[] = [];
  readonly blurEvents: boolean[] = [];
  readonly clickEvents: Array<MouseEvent | KeyboardEvent> = [];

  handleCheckedChange(value: boolean): void {
    this.checkedEvents.push(value);
    this.checked.set(value);
  }

  handleStateChange(event: PixelCheckboxStateChangeEvent): void {
    this.stateEvents.push(event);
  }
}

@Component({  imports: [ReactiveFormsModule, PixelCheckboxComponent],
  template: `
    <pixel-checkbox
      label="Reactive checkbox"
      helperText="Reactive forms compatible"
      requiredErrorMessage="Please accept this option."
      [formControl]="control"
    />
  `,
})
class ReactiveFormsHostComponent {
  readonly control = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
}

@Component({  imports: [FormsModule, PixelCheckboxComponent],
  template: `
    <pixel-checkbox
      label="Template checkbox"
      name="templateCheckbox"
      required
      requiredErrorMessage="Please accept the template checkbox."
      [(ngModel)]="accepted"
    />
  `,
})
class TemplateFormsHostComponent {
  accepted = false;
}

describe('PixelCheckboxComponent', () => {
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

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
  }

  function getRoot(): HTMLElement {
    return fixture.nativeElement.querySelector('.pixel-checkbox') as HTMLElement;
  }

  function getBox(): HTMLElement {
    return fixture.nativeElement.querySelector('.pixel-checkbox__box') as HTMLElement;
  }

  function getComponentInstance(): PixelCheckboxComponent {
    return fixture.debugElement.query(By.directive(PixelCheckboxComponent))
      .componentInstance as PixelCheckboxComponent;
  }

  it('creates the host and component', () => {
    expect(host).toBeTruthy();
    expect(getComponentInstance()).toBeTruthy();
  });

  it('updates UI when inputs change', () => {
    host.checked.set(true);
    host.size.set('lg');
    host.labelPosition.set('left');
    fixture.detectChanges();

    const input = getInput();
    const root = getRoot();

    expect(input.checked).toBe(true);
    expect(root.classList.contains('pixel-checkbox--checked')).toBe(true);
    expect(root.classList.contains('pixel-checkbox--lg')).toBe(true);
    expect(root.classList.contains('pixel-checkbox--label-left')).toBe(true);
  });

  it('normalizes custom class bindings', () => {
    const root = getRoot();

    expect(root.classList.contains('external-checkbox')).toBe(true);
    expect(root.classList.contains('emphasized')).toBe(true);
  });

  it('toggles checked state and emits checkedChange', () => {
    getInput().click();
    fixture.detectChanges();

    expect(host.checkedEvents).toEqual([true]);
    expect(host.clickEvents).toHaveLength(1);
    expect(getInput().checked).toBe(true);
  });

  it('emits rich stateChange payloads', () => {
    getInput().click();
    fixture.detectChanges();

    expect(host.stateEvents).toHaveLength(1);
    expect(host.stateEvents[0]).toMatchObject({
      checked: true,
      indeterminate: false,
      state: 'checked',
      source: 'mouse',
    });
  });

  it('supports indeterminate state and clears it on toggle', () => {
    host.indeterminate.set(true);
    fixture.detectChanges();

    expect(getInput().indeterminate).toBe(true);
    expect(getInput().getAttribute('aria-checked')).toBe('mixed');
    expect(getRoot().classList.contains('pixel-checkbox--indeterminate')).toBe(true);

    getInput().click();
    fixture.detectChanges();

    expect(host.checkedEvents).toEqual([true]);
    expect(getInput().indeterminate).toBe(false);
    expect(getInput().checked).toBe(true);
  });

  it('prevents interaction when disabled or loading', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    getInput().click();
    fixture.detectChanges();

    expect(host.checkedEvents).toHaveLength(0);
    expect(getInput().disabled).toBe(true);
    expect(getInput().getAttribute('aria-disabled')).toBe('true');

    host.disabled.set(false);
    host.state.set('loading');
    fixture.detectChanges();

    getInput().click();
    expect(host.checkedEvents).toHaveLength(0);
    expect(getRoot().classList.contains('pixel-checkbox--loading')).toBe(true);
  });

  it('prevents interaction when readonly while preserving focusability', () => {
    host.readonly.set(true);
    fixture.detectChanges();

    getInput().click();
    fixture.detectChanges();

    expect(host.checkedEvents).toHaveLength(0);
    expect(getInput().tabIndex).toBe(0);
    expect(getRoot().classList.contains('pixel-checkbox--readonly')).toBe(true);
  });

  it('toggles with keyboard space and enter', () => {
    const input = getInput();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(host.checkedEvents).toEqual([true]);
    expect(host.stateEvents[0].source).toBe('keyboard');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(host.checkedEvents).toEqual([true, false]);
    expect(getInput().checked).toBe(false);
  });

  it('emits focus and blur output events', () => {
    const input = getInput();

    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(host.focusEvents).toEqual([true]);
    expect(host.blurEvents).toEqual([true]);
  });

  it('derives checked and unchecked visual state from value inputs', () => {
    host.checked.set(true);
    fixture.detectChanges();

    const component = getComponentInstance();

    expect(component['visualState']()).toBe('checked');
    expect(component['effectiveChecked']()).toBe(true);

    host.checked.set(false);
    fixture.detectChanges();

    expect(component['visualState']()).toBe('unchecked');
    expect(component['effectiveChecked']()).toBe(false);
  });

  it('supports only loading and indeterminate semantic state overrides', () => {
    host.state.set('indeterminate');
    host.checked.set(true);
    fixture.detectChanges();

    const component = getComponentInstance();

    expect(component['visualState']()).toBe('indeterminate');
    expect(component['effectiveIndeterminate']()).toBe(true);
    expect(component['effectiveChecked']()).toBe(false);

    host.state.set('loading');
    fixture.detectChanges();

    expect(component['visualState']()).toBe('loading');
    expect(component['isLoading']()).toBe(true);
  });

  it('includes required ARIA attributes and helper wiring', () => {
    const input = getInput();

    expect(input.id).toBe('terms');
    expect(input.name).toBe('terms');
    expect(input.value).toBe('accepted');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.getAttribute('aria-describedby')).toContain('external-help');
    expect(input.getAttribute('aria-describedby')).toContain('pixel-checkbox-');
  });

  it('applies custom icons', () => {
    host.checked.set(true);
    fixture.detectChanges();

    expect(getBox().textContent?.trim()).toBe('Y');

    host.checked.set(false);
    host.indeterminate.set(true);
    fixture.detectChanges();

    expect(getBox().textContent?.trim()).toBe('-');
  });

  it('exposes checkbox CSS variables in light mode', () => {
    const hostElement = fixture.nativeElement.querySelector('pixel-checkbox') as HTMLElement;
    const styles = getComputedStyle(hostElement);

    expect(styles.getPropertyValue('--pixel-sys-primary').trim()).toBe('#2962ff');
    expect(styles.getPropertyValue('--pixel-checkbox-bg').trim()).toBe(
      'var(--pixel-sys-surface, #fdfbff)',
    );
    expect(styles.getPropertyValue('--pixel-checkbox-error').trim()).toBe(
      'var(--pixel-sys-error, #b3261e)',
    );
  });

  it('switches CSS variables under an explicit dark theme parent', () => {
    host.theme.set('dark');
    fixture.detectChanges();

    const hostElement = fixture.nativeElement.querySelector('pixel-checkbox') as HTMLElement;
    const styles = getComputedStyle(hostElement);

    expect(styles.getPropertyValue('--pixel-sys-primary').trim()).toBe('#ffabf3');
    expect(styles.getPropertyValue('--pixel-checkbox-bg').trim()).toBe(
      'var(--pixel-sys-surface-container-low, #1e1a1d)',
    );
  });

  it('defaults to fullWidth host marker for mobile form stretch', () => {
    const hostEl = fixture.debugElement.query(By.directive(PixelCheckboxComponent))
      .nativeElement as HTMLElement;
    expect(hostEl.getAttribute('data-full-width')).toBe('true');
    expect(getRoot().classList.contains('pixel-checkbox--full-width')).toBe(true);
  });
});

@Component({
  imports: [PixelCheckboxComponent],
  template: `
    <pixel-checkbox ariaLabel="Select row" [fullWidth]="false" [checked]="checked()" />
  `,
})
class ControlOnlyHostComponent {
  readonly checked = signal(false);
}

describe('PixelCheckboxComponent control-only layout', () => {
  let fixture: ComponentFixture<ControlOnlyHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlOnlyHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlOnlyHostComponent);
    fixture.detectChanges();
  });

  it('opts out of fullWidth and uses control-only layout without a label', () => {
    const hostEl = fixture.debugElement.query(By.directive(PixelCheckboxComponent))
      .nativeElement as HTMLElement;
    const root = fixture.nativeElement.querySelector('.pixel-checkbox') as HTMLElement;

    expect(hostEl.getAttribute('data-full-width')).toBe('false');
    expect(root.classList.contains('pixel-checkbox--control-only')).toBe(true);
    expect(root.classList.contains('pixel-checkbox--full-width')).toBe(false);
  });
});

describe('PixelCheckboxComponent forms integration', () => {
  it('works as a reactive form control value accessor', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveFormsHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.checked).toBe(false);

    host.control.setValue(true);
    fixture.detectChanges();

    expect(input.checked).toBe(true);

    input.click();
    fixture.detectChanges();

    expect(host.control.value).toBe(false);
  });

  it('shows required indicator from reactive form validators', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveFormsHostComponent);
    fixture.detectChanges();

    const requiredIndicator = fixture.nativeElement.querySelector(
      '.pixel-checkbox__required',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(requiredIndicator.textContent?.trim()).toBe('*');
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('uses setDisabledState when a reactive form control is disabled', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveFormsHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    host.control.disable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const root = fixture.nativeElement.querySelector('.pixel-checkbox') as HTMLElement;

    expect(input.disabled).toBe(true);
    expect(root.classList.contains('pixel-checkbox--disabled')).toBe(true);
  });

  it('marks the reactive form control touched on blur and exposes Angular invalid classes', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReactiveFormsHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    const componentHost = fixture.nativeElement.querySelector('pixel-checkbox') as HTMLElement;

    expect(host.control.touched).toBe(true);
    expect(host.control.invalid).toBe(true);
    expect(componentHost.classList.contains('ng-invalid')).toBe(true);
    expect(componentHost.classList.contains('ng-touched')).toBe(true);
    expect(componentHost.textContent).toContain('Please accept this option.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('error');
  });

  it('works with template-driven ngModel', async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormsHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TemplateFormsHostComponent);
    const host = fixture.componentInstance;
    host.accepted = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.checked).toBe(true);

    input.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.accepted).toBe(false);
    expect(input.checked).toBe(false);
  });

  it('uses checkbox required validation with template-driven ngModel', async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormsHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TemplateFormsHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    const componentHost = fixture.nativeElement.querySelector('pixel-checkbox') as HTMLElement;

    expect(componentHost.classList.contains('ng-invalid')).toBe(true);
    expect(componentHost.classList.contains('ng-touched')).toBe(true);
    expect(componentHost.textContent).toContain('Please accept the template checkbox.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('error');
  });
});
