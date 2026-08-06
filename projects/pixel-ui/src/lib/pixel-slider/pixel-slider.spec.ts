import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelSliderComponent, {
  type PixelSliderSize,
  type PixelSliderValue,
} from './pixel-slider';

@Component({
  imports: [PixelSliderComponent],
  template: `
    <pixel-slider
      label="Volume"
      [min]="0"
      [max]="100"
      [size]="size()"
      [value]="value()"
      (valueChange)="onValue($event)"
      [disabled]="disabled()"
    />
  `,
})
class HostComponent {
  readonly value = signal<number>(40);
  readonly size = signal<PixelSliderSize>('md');
  readonly disabled = signal(false);

  onValue(next: PixelSliderValue): void {
    if (typeof next === 'number') {
      this.value.set(next);
    }
  }
}

describe('PixelSliderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a labeled slider with a native range input', () => {
    expect(fixture.nativeElement.querySelector('.pixel-slider__label')?.textContent).toContain(
      'Volume',
    );
    const input = fixture.nativeElement.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement | null;
    expect(input).toBeTruthy();
    expect(Number(input!.value)).toBe(40);
  });

  it('reflects size on the control', () => {
    host.size.set('sm');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-slider')?.getAttribute('data-size')).toBe(
      'sm',
    );
  });

  it('updates value when the range input changes', () => {
    const input = fixture.nativeElement.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    input.value = '75';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe(75);
  });

  it('disables the native range when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.pixel-slider--disabled')).toBeTruthy();
  });
});
