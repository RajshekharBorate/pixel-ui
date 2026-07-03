import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import PixelTooltipDirective, { PixelTooltipPosition } from './pixel-tooltip';

@Component({
  standalone: true,
  imports: [PixelTooltipDirective],
  template: `
    <button
      type="button"
      [pixelTooltip]="message()"
      [pixelTooltipPosition]="position()"
      [pixelTooltipShowDelay]="0"
      [pixelTooltipHideDelay]="0"
    >
      Trigger
    </button>
    <button
      type="button"
      draggable="true"
      pixelTooltip="Drag me"
      pixelTooltipShowDelay="0"
      pixelTooltipHideDelay="0"
    >
      Drag handle
    </button>
  `,
})
class HostComponent {
  readonly message = signal('Helpful hint');
  readonly position = signal<PixelTooltipPosition>('top');
}

describe('PixelTooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  });

  afterEach(() => {
    document.querySelectorAll('.pixel-tooltip').forEach((el) => el.remove());
  });

  function getTooltip(): HTMLElement | null {
    return document.body.querySelector('.pixel-tooltip');
  }

  it('shows a tooltip on pointer enter and wires aria-describedby', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(0);

    const tip = getTooltip();
    expect(tip).toBeTruthy();
    expect(tip?.getAttribute('role')).toBe('tooltip');
    expect(tip?.textContent?.trim()).toBe('Helpful hint');
    expect(button.getAttribute('aria-describedby')).toBe(tip?.id);
  }));

  it('hides on pointer leave and clears aria-describedby', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(0);
    expect(getTooltip()).toBeTruthy();

    button.dispatchEvent(new MouseEvent('mouseleave'));
    tick(0);
    tick(200);

    expect(button.getAttribute('aria-describedby')).toBeNull();
  }));

  it('does not show when the message is empty', fakeAsync(() => {
    fixture.componentInstance.message.set('');
    fixture.detectChanges();

    button.dispatchEvent(new MouseEvent('mouseenter'));
    tick(0);

    expect(getTooltip()).toBeNull();
  }));

  it('hides when the host starts dragging', fakeAsync(() => {
    const dragHandle = fixture.nativeElement.querySelector('button[draggable]') as HTMLButtonElement;

    dragHandle.dispatchEvent(new MouseEvent('mouseenter'));
    tick(0);
    expect(getTooltip()).toBeTruthy();

    dragHandle.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
    tick(200);

    expect(getTooltip()).toBeNull();
    expect(dragHandle.getAttribute('aria-describedby')).toBeNull();
  }));
});
