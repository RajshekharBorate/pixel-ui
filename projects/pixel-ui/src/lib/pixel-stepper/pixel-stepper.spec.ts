import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import PixelStepperComponent from './pixel-stepper';
import PixelStepComponent from './pixel-step';
import PixelStepContentComponent from './pixel-step-content';
import type {
  PixelStepChangeEvent,
  PixelStepGuard,
  PixelStepperNavigationMode,
  PixelStepperType,
} from './pixel-stepper.types';

interface StepDef {
  readonly id: string;
  readonly label: string;
  readonly optional?: boolean;
  readonly completed?: boolean;
}

@Component({
  imports: [PixelStepperComponent, PixelStepComponent, PixelStepContentComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-stepper
        [type]="type()"
        [navigationMode]="mode()"
        [selectedIndex]="active()"
        (selectedIndexChange)="active.set($event)"
        [beforeNext]="beforeNext()"
        (selectionChange)="lastChange.set($event)"
        (finished)="finishedCount.set(finishedCount() + 1)"
      >
        @for (step of steps(); track step.id) {
          <pixel-step
            [stepId]="step.id"
            [label]="step.label"
            [optional]="!!step.optional"
            [completed]="step.completed"
          >
            <pixel-step-content>{{ step.label }} body</pixel-step-content>
          </pixel-step>
        }
      </pixel-stepper>
    </section>
  `,
})
class HostComponent {
  readonly theme = signal<'light' | 'dark'>('light');
  readonly type = signal<PixelStepperType>('horizontal');
  readonly mode = signal<PixelStepperNavigationMode>('non-linear');
  readonly active = signal(0);
  readonly beforeNext = signal<PixelStepGuard | undefined>(undefined);
  readonly lastChange = signal<PixelStepChangeEvent | null>(null);
  readonly finishedCount = signal(0);

  readonly steps = signal<StepDef[]>([
    { id: 'a', label: 'Account' },
    { id: 'b', label: 'Profile' },
    { id: 'c', label: 'Review' },
  ]);
}

@Component({
  imports: [ReactiveFormsModule, PixelStepperComponent, PixelStepComponent, PixelStepContentComponent],
  template: `
    <pixel-stepper type="wizard" navigationMode="linear" [selectedIndex]="active()" (selectedIndexChange)="active.set($event)">
      <pixel-step label="Account" [stepControl]="accountForm">
        <pixel-step-content>
          <form [formGroup]="accountForm">
            <input formControlName="name" />
          </form>
        </pixel-step-content>
      </pixel-step>
      <pixel-step label="Review">
        <pixel-step-content>Review body</pixel-step-content>
      </pixel-step>
    </pixel-stepper>
  `,
})
class FormHostComponent {
  private readonly fb = new FormBuilder();
  readonly accountForm = this.fb.group({
    name: ['', Validators.required],
  });
  readonly active = signal(0);
}

@Component({
  imports: [ReactiveFormsModule, PixelStepperComponent, PixelStepComponent, PixelStepContentComponent],
  template: `
    <pixel-stepper
      type="wizard"
      navigationMode="free"
      [selectedIndex]="active()"
      (selectedIndexChange)="active.set($event)"
    >
      <pixel-step label="Account" [stepControl]="accountForm">
        <pixel-step-content>
          <form [formGroup]="accountForm">
            <input formControlName="name" />
          </form>
        </pixel-step-content>
      </pixel-step>
      <pixel-step label="Address" [stepControl]="addressForm">
        <pixel-step-content>
          <form [formGroup]="addressForm">
            <input formControlName="city" />
            <input formControlName="zip" />
          </form>
        </pixel-step-content>
      </pixel-step>
      <pixel-step label="Review">
        <pixel-step-content>Review body</pixel-step-content>
      </pixel-step>
    </pixel-stepper>
  `,
})
class MultiFormHostComponent {
  private readonly fb = new FormBuilder();
  readonly accountForm = this.fb.group({
    name: ['', Validators.required],
  });
  readonly addressForm = this.fb.group({
    city: ['', Validators.required],
    zip: ['', Validators.required],
  });
  readonly active = signal(2);
}

describe('PixelStepperComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function stepper(): PixelStepperComponent {
    return fixture.debugElement.query(By.directive(PixelStepperComponent))
      .componentInstance as PixelStepperComponent;
  }

  function tabButtons(): HTMLButtonElement[] {
    return fixture.debugElement
      .queryAll(By.css('[role="tab"]'))
      .map((d) => d.nativeElement as HTMLButtonElement);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one header per projected step', () => {
    expect(stepper().totalSteps()).toBe(3);
    expect(tabButtons().length).toBe(3);
  });

  it('navigates with next() and previous()', async () => {
    await stepper().next();
    fixture.detectChanges();
    expect(host.active()).toBe(1);

    await stepper().next();
    fixture.detectChanges();
    expect(host.active()).toBe(2);

    await stepper().previous();
    fixture.detectChanges();
    expect(host.active()).toBe(1);
  });

  it('emits selectionChange with direction and step id', async () => {
    await stepper().next();
    fixture.detectChanges();
    expect(host.lastChange()?.selectedIndex).toBe(1);
    expect(host.lastChange()?.direction).toBe('next');
    expect(host.lastChange()?.stepId).toBe('b');
  });

  it('navigates by clicking a step header', async () => {
    host.mode.set('free');
    fixture.detectChanges();
    tabButtons()[2].click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.active()).toBe(2);
  });

  it('blocks forward jumps in linear mode until prior steps complete', async () => {
    host.mode.set('linear');
    fixture.detectChanges();

    const moved = await stepper().jumpTo(2);
    fixture.detectChanges();
    expect(moved).toBe(false);
    expect(host.active()).toBe(0);
    expect(stepper().canEnter(2)).toBe(false);
  });

  it('gates next() in linear mode on stepControl validity', async () => {
    const formFixture = TestBed.createComponent(FormHostComponent);
    const formHost = formFixture.componentInstance;
    formFixture.detectChanges();
    const formStepper = formFixture.debugElement.query(By.directive(PixelStepperComponent))
      .componentInstance as PixelStepperComponent;

    expect(formStepper.canAdvance()).toBe(false);
    formHost.accountForm.controls.name.setValue('Ada');
    formFixture.detectChanges();
    expect(formStepper.canAdvance()).toBe(true);

    await formStepper.next();
    formFixture.detectChanges();
    expect(formHost.active()).toBe(1);
    expect(formStepper.canEnter(1)).toBe(true);
  });

  it('gates finish on all stepControl validity in free mode', async () => {
    const formFixture = TestBed.createComponent(MultiFormHostComponent);
    const formHost = formFixture.componentInstance;
    formFixture.detectChanges();
    const formStepper = formFixture.debugElement.query(By.directive(PixelStepperComponent))
      .componentInstance as PixelStepperComponent;

    expect(formHost.active()).toBe(2);
    expect(formStepper.canFinish()).toBe(false);

    formHost.accountForm.controls.name.setValue('Ada');
    formFixture.detectChanges();
    expect(formStepper.canFinish()).toBe(false);

    formHost.addressForm.setValue({ city: 'London', zip: 'EC1A' });
    formFixture.detectChanges();
    expect(formStepper.canFinish()).toBe(true);
  });

  it('surfaces error indicators on invalid stepControl steps after a blocked finish', async () => {
    const formFixture = TestBed.createComponent(MultiFormHostComponent);
    formFixture.detectChanges();
    const formStepper = formFixture.debugElement.query(By.directive(PixelStepperComponent))
      .componentInstance as PixelStepperComponent;
    const formHost = formFixture.componentInstance;

    const moved = await formStepper.finish();
    formFixture.detectChanges();
    expect(moved).toBe(false);

    const headers = formFixture.debugElement.queryAll(By.css('pixel-step-header'));
    expect(headers[0].nativeElement.getAttribute('data-state')).toBe('error');
    expect(headers[1].nativeElement.getAttribute('data-state')).toBe('error');
    expect(headers[2].nativeElement.getAttribute('data-state')).toBe('current');

    // Selected step with a forced status still keeps --selected (attention ring in CSS).
    formHost.active.set(0);
    formFixture.detectChanges();
    expect(headers[0].nativeElement.getAttribute('data-state')).toBe('error');
    expect(headers[0].nativeElement.classList.contains('pixel-step-header--selected')).toBe(true);
    expect(headers[2].nativeElement.classList.contains('pixel-step-header--selected')).toBe(false);
  });

  it('blocks next() in linear mode when the current step is incomplete', async () => {
    host.mode.set('linear');
    host.steps.set([
      { id: 'a', label: 'Account', completed: false },
      { id: 'b', label: 'Profile' },
    ]);
    fixture.detectChanges();

    expect(stepper().canAdvance()).toBe(false);
    const moved = await stepper().next();
    fixture.detectChanges();
    expect(moved).toBe(false);
    expect(host.active()).toBe(0);

    host.steps.set([
      { id: 'a', label: 'Account', completed: true },
      { id: 'b', label: 'Profile' },
    ]);
    fixture.detectChanges();
    expect(stepper().canAdvance()).toBe(true);
    await stepper().next();
    fixture.detectChanges();
    expect(host.active()).toBe(1);
  });

  it('tracks completion as steps are advanced', async () => {
    expect(stepper().completedCount()).toBe(0);
    await stepper().next();
    fixture.detectChanges();
    expect(stepper().completedCount()).toBe(1);
    expect(stepper().percentComplete()).toBeGreaterThan(0);
  });

  it('computes the linear progress value from the selected index', async () => {
    expect(stepper().progressValue()).toBe(0);
    await stepper().next();
    fixture.detectChanges();
    expect(stepper().progressValue()).toBe(50);
    await stepper().next();
    fixture.detectChanges();
    expect(stepper().progressValue()).toBe(100);
  });

  it('supports dynamic step insertion and removal', async () => {
    host.steps.update((steps) => [...steps, { id: 'd', label: 'Done' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(stepper().totalSteps()).toBe(4);

    host.steps.update((steps) => steps.slice(0, 2));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(stepper().totalSteps()).toBe(2);
  });

  it('runs async guards before advancing (conditional navigation)', async () => {
    host.beforeNext.set(() => Promise.resolve(false));
    fixture.detectChanges();

    let moved = await stepper().next();
    fixture.detectChanges();
    expect(moved).toBe(false);
    expect(host.active()).toBe(0);

    host.beforeNext.set(() => Promise.resolve(true));
    fixture.detectChanges();
    moved = await stepper().next();
    fixture.detectChanges();
    expect(moved).toBe(true);
    expect(host.active()).toBe(1);
  });

  it('finishes from the last step', async () => {
    host.active.set(2);
    fixture.detectChanges();
    await stepper().finish();
    fixture.detectChanges();
    expect(host.finishedCount()).toBe(1);
  });

  it('moves roving focus with arrow keys', () => {
    const list = fixture.debugElement.query(By.css('[role="tablist"]')).nativeElement as HTMLElement;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(tabButtons()[1].tabIndex).toBe(0);
    expect(tabButtons()[0].tabIndex).toBe(-1);
  });

  it('exposes the expected ARIA roles and state', () => {
    const list = fixture.debugElement.query(By.css('[role="tablist"]'));
    expect(list).toBeTruthy();
    const tabs = tabButtons();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    const panel = fixture.debugElement.query(By.css('[role="tabpanel"]')).nativeElement as HTMLElement;
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
  });

  it('applies the animation-duration CSS custom property to the panel', () => {
    const panel = fixture.debugElement.query(By.css('.pixel-stepper__panel')).nativeElement as HTMLElement;
    expect(panel.style.getPropertyValue('--pixel-stepper-duration')).toBe('250ms');
  });

  it('renders within a dark theme context without breaking navigation', async () => {
    host.theme.set('dark');
    fixture.detectChanges();
    const wrapper = fixture.debugElement.query(By.css('section')).nativeElement as HTMLElement;
    expect(wrapper.getAttribute('data-theme')).toBe('dark');
    await stepper().next();
    fixture.detectChanges();
    expect(host.active()).toBe(1);
  });
});
