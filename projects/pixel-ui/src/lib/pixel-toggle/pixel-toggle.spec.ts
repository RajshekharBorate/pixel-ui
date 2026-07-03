import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import PixelToggleComponent, {
  PixelToggleCheckedChangeEvent,
  PixelToggleOption,
  PixelToggleSize,
  PixelToggleValueChangeEvent,
} from './pixel-toggle';
import PixelToggleCheckedIconDirective from './pixel-toggle-checked-icon';
import PixelToggleUncheckedIconDirective from './pixel-toggle-unchecked-icon';

@Component({
  standalone: true,
  imports: [PixelToggleComponent, PixelToggleCheckedIconDirective, PixelToggleUncheckedIconDirective],
  template: `
    <section class="theme-shell" [attr.data-theme]="theme()">
      <pixel-toggle
        [mode]="mode()"
        [id]="id()"
        [label]="label()"
        [checked]="checked()"
        [value]="value()"
        [options]="options()"
        [disabled]="disabled()"
        [required]="required()"
        [readonly]="readonly()"
        [size]="size()"
        [switchAppearance]="switchAppearance()"
        [segmentedAppearance]="segmentedAppearance()"
        [segmentedShape]="segmentedShape()"
        [labelPosition]="labelPosition()"
        [onLabel]="onLabel()"
        [offLabel]="offLabel()"
        [ariaLabel]="ariaLabel()"
        (checkedChange)="handleCheckedChange($event)"
        (valueChange)="handleValueChange($event)"
        (checkedStateChange)="checkedStateEvents.push($event)"
        (valueStateChange)="valueStateEvents.push($event)"
        (focusChange)="focusEvents.push($event)"
        (blurChange)="blurEvents.push($event)"
        (activated)="activatedEvents.push($event)"
      >
        @if (showThumbIcons()) {
          <ng-template pixelToggleCheckedIcon>
            <span class="thumb-icon-checked">✓</span>
          </ng-template>
          <ng-template pixelToggleUncheckedIcon>
            <span class="thumb-icon-unchecked">–</span>
          </ng-template>
        }
      </pixel-toggle>
    </section>
  `,
})
class HostComponent {
  readonly mode = signal<'switch' | 'segmented'>('switch');
  readonly id = signal('wifi');
  readonly label = signal('Enable Wifi');
  readonly checked = signal(false);
  readonly value = signal<string | number | null>('and');
  readonly options = signal<readonly PixelToggleOption[]>([
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ]);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly readonly = signal(false);
  readonly size = signal<PixelToggleSize>('md');
  readonly switchAppearance = signal<'default' | 'labeled'>('default');
  readonly segmentedAppearance = signal<'contained' | 'surface'>('surface');
  readonly segmentedShape = signal<'rounded' | 'pill'>('rounded');
  readonly labelPosition = signal<'left' | 'right'>('right');
  readonly onLabel = signal('ON');
  readonly offLabel = signal('OFF');
  readonly showThumbIcons = signal(true);
  readonly ariaLabel = signal('');
  readonly theme = signal('default');
  readonly checkedChanges: boolean[] = [];
  readonly valueChanges: Array<string | number> = [];
  readonly checkedStateEvents: PixelToggleCheckedChangeEvent[] = [];
  readonly valueStateEvents: PixelToggleValueChangeEvent[] = [];
  readonly focusEvents: boolean[] = [];
  readonly blurEvents: boolean[] = [];
  readonly activatedEvents: Array<MouseEvent | KeyboardEvent> = [];

  handleCheckedChange(value: boolean): void {
    this.checkedChanges.push(value);
    this.checked.set(value);
  }

  handleValueChange(value: string | number): void {
    this.valueChanges.push(value);
    this.value.set(value);
  }
}

describe('PixelToggleComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, FormsModule, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function toggleInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('.pixel-toggle__input')).nativeElement;
  }

  function segments(): HTMLButtonElement[] {
    return fixture.debugElement
      .queryAll(By.css('.pixel-toggle__segment'))
      .map((debugEl) => debugEl.nativeElement as HTMLButtonElement);
  }

  it('should create switch mode with external label', () => {
    const label = fixture.nativeElement.querySelector('.pixel-toggle__label');
    expect(label?.textContent?.trim()).toContain('Enable Wifi');
    expect(toggleInput().getAttribute('role')).toBe('switch');
  });

  it('should toggle checked state on click', () => {
    toggleInput().click();
    fixture.detectChanges();

    expect(host.checked()).toBe(true);
    expect(host.checkedChanges).toEqual([true]);
    expect(host.checkedStateEvents[0]?.checked).toBe(true);
  });

  it('should toggle on Space key', () => {
    toggleInput().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(host.checked()).toBe(true);
    expect(host.checkedStateEvents[0]?.source).toBe('keyboard');
  });

  it('should apply disabled checked switch classes', () => {
    host.disabled.set(true);
    host.checked.set(true);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.pixel-toggle');
    expect(toggle?.classList.contains('pixel-toggle--disabled')).toBe(true);
    expect(toggle?.classList.contains('pixel-toggle--checked')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.pixel-toggle__thumb-icon .thumb-icon-checked')?.textContent?.trim(),
    ).toBe('✓');
  });

  it('should not toggle when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    toggleInput().click();
    fixture.detectChanges();

    expect(host.checked()).toBe(false);
    expect(host.checkedChanges).toEqual([]);
  });

  it('should render labeled switch with projected thumb icons', () => {
    @Component({
      standalone: true,
      imports: [
        PixelToggleComponent,
        PixelToggleCheckedIconDirective,
        PixelToggleUncheckedIconDirective,
      ],
      template: `
        <pixel-toggle switchAppearance="labeled" [checked]="checked()">
          <ng-template pixelToggleCheckedIcon>
            <span class="thumb-checked">ON</span>
          </ng-template>
          <ng-template pixelToggleUncheckedIcon>
            <span class="thumb-unchecked">OFF</span>
          </ng-template>
        </pixel-toggle>
      `,
    })
    class LabeledIconHostComponent {
      readonly checked = signal(false);
    }

    const labeledFixture = TestBed.createComponent(LabeledIconHostComponent);
    labeledFixture.detectChanges();

    expect(labeledFixture.nativeElement.querySelector('.pixel-toggle--labeled')).toBeTruthy();
    expect(labeledFixture.nativeElement.querySelector('.pixel-toggle--has-thumb-icon')).toBeTruthy();
    expect(
      labeledFixture.nativeElement.querySelector('.thumb-unchecked')?.textContent?.trim(),
    ).toBe('OFF');

    labeledFixture.componentInstance.checked.set(true);
    labeledFixture.detectChanges();

    expect(
      labeledFixture.nativeElement.querySelector('.thumb-checked')?.textContent?.trim(),
    ).toBe('ON');
  });

  it('should size labeled switches from on/off label copy', () => {
    host.switchAppearance.set('labeled');
    host.label.set('');
    host.onLabel.set('Dark');
    host.offLabel.set('Light');
    host.showThumbIcons.set(false);
    fixture.detectChanges();

    const sizer = fixture.nativeElement.querySelector('.pixel-toggle__track-label-sizer');
    expect(sizer).toBeTruthy();
    expect(sizer?.textContent).toContain('Dark');
    expect(sizer?.textContent).toContain('Light');
    expect(fixture.nativeElement.querySelector('.pixel-toggle__track-label')?.textContent?.trim()).toBe(
      'Light',
    );
  });

  it('should render labeled switch appearance with off label', () => {
    host.switchAppearance.set('labeled');
    host.label.set('');
    host.checked.set(false);
    host.showThumbIcons.set(false);
    fixture.detectChanges();

    const trackLabel = fixture.nativeElement.querySelector('.pixel-toggle__track-label');
    expect(trackLabel?.textContent?.trim()).toBe('OFF');
    expect(fixture.nativeElement.querySelector('.pixel-toggle--labeled')).toBeTruthy();
  });

  it('should render pill segmented shape', () => {
    host.mode.set('segmented');
    host.label.set('');
    host.segmentedShape.set('pill');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pixel-toggle--segmented-pill')).toBeTruthy();
  });

  it('should render disabled segmented with unified disabled tokens', () => {
    host.mode.set('segmented');
    host.label.set('');
    host.disabled.set(true);
    host.segmentedAppearance.set('contained');
    host.segmentedShape.set('pill');
    fixture.detectChanges();

    const segmented = fixture.nativeElement.querySelector('.pixel-toggle--segmented');
    expect(segmented?.classList.contains('pixel-toggle--disabled')).toBe(true);
    expect(fixture.nativeElement.querySelector('.pixel-toggle__segmented')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-toggle__segmented-thumb')).toBeTruthy();
  });

  it('should select segmented options', () => {
    host.mode.set('segmented');
    host.label.set('');
    fixture.detectChanges();

    segments()[1]?.click();
    fixture.detectChanges();

    expect(host.value()).toBe('or');
    expect(host.valueChanges).toEqual(['or']);
    expect(host.valueStateEvents[0]?.value).toBe('or');
  });

  it('should bind to reactive forms in switch mode', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, PixelToggleComponent],
      template: `<pixel-toggle [formControl]="control" />`,
    })
    class FormHostComponent {
      readonly control = new FormControl(false, { nonNullable: true });
    }

    const formFixture = TestBed.createComponent(FormHostComponent);
    formFixture.detectChanges();

    const input = formFixture.debugElement.query(By.css('.pixel-toggle__input')).nativeElement;
    input.click();
    formFixture.detectChanges();

    expect(formFixture.componentInstance.control.value).toBe(true);
  });

  it('should validate required segmented value', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, PixelToggleComponent],
      template: `
        <pixel-toggle
          mode="segmented"
          required
          [options]="options"
          [formControl]="control"
        />
      `,
    })
    class SegmentedFormHostComponent {
      readonly options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];
      readonly control = new FormControl<string | null>(null, { validators: Validators.required });
    }

    const formFixture = TestBed.createComponent(SegmentedFormHostComponent);
    formFixture.detectChanges();

    const toggle = formFixture.debugElement.query(By.directive(PixelToggleComponent))
      .componentInstance as PixelToggleComponent;
    expect(toggle.validate(formFixture.componentInstance.control)).toEqual({ required: true });

    formFixture.componentInstance.control.setValue('a');
    expect(toggle.validate(formFixture.componentInstance.control)).toBeNull();
  });
});
