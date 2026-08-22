import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelTooltipDirective from './pixel-tooltip';

@Component({
  imports: [PixelTooltipDirective],
  template: `
    <div
      [pixelTooltip]="message()"
      [pixelTooltipShowOnOverflow]="true"
      [pixelTooltipShowDelay]="0"
      [pixelTooltipHideDelay]="0"
    >
      {{ text() }}
    </div>
  `,
})
class HostComponent {
  readonly message = signal('');
  readonly text = signal('A very long label that gets clipped');
}

// Resolve after the directive's `setTimeout(show, 0)` has run (real timers, no fakeAsync/zone).
function flushMacrotask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('PixelTooltipDirective — showOnOverflow', () => {
  let fixture: ComponentFixture<HostComponent>;
  let cell: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    cell = fixture.nativeElement.querySelector('div') as HTMLElement;
  });

  afterEach(() => {
    document.querySelectorAll('.pixel-tooltip').forEach((el) => el.remove());
  });

  // jsdom has no layout, so fake the overflow metrics the directive reads.
  function setTruncated(truncated: boolean): void {
    Object.defineProperty(cell, 'clientWidth', { value: 50, configurable: true });
    Object.defineProperty(cell, 'scrollWidth', { value: truncated ? 200 : 50, configurable: true });
    Object.defineProperty(cell, 'clientHeight', { value: 20, configurable: true });
    Object.defineProperty(cell, 'scrollHeight', { value: 20, configurable: true });
  }

  function tooltip(): HTMLElement | null {
    return document.body.querySelector('.pixel-tooltip');
  }

  it('does not show when the host text fits', async () => {
    setTruncated(false);
    cell.dispatchEvent(new MouseEvent('mouseenter'));
    await flushMacrotask();
    expect(tooltip()).toBeNull();
  });

  it('shows the host text when it is truncated', async () => {
    setTruncated(true);
    cell.dispatchEvent(new MouseEvent('mouseenter'));
    await flushMacrotask();
    expect(tooltip()?.textContent?.trim()).toBe('A very long label that gets clipped');
  });

  it('prefers an explicit message over the host text', async () => {
    fixture.componentInstance.message.set('Custom tip');
    fixture.detectChanges();
    setTruncated(true);
    cell.dispatchEvent(new MouseEvent('mouseenter'));
    await flushMacrotask();
    expect(tooltip()?.textContent?.trim()).toBe('Custom tip');
  });
});

@Component({
  imports: [PixelTooltipDirective],
  template: `
    <td class="pixel-data-grid__cell" #gridCell>
      <span
        class="pixel-data-grid__cell-value"
        [pixelTooltip]="message()"
        pixelTooltipShowOnOverflow
        [pixelTooltipShowDelay]="0"
        [pixelTooltipHideDelay]="0"
      >{{ text() }}</span>
    </td>
  `,
})
class GridCellHostComponent {
  readonly message = signal('Full member name');
  readonly text = signal('Full member name');
}

describe('PixelTooltipDirective — grid cell overflow', () => {
  let fixture: ComponentFixture<GridCellHostComponent>;
  let value: HTMLElement;
  let gridCell: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GridCellHostComponent] });
    fixture = TestBed.createComponent(GridCellHostComponent);
    fixture.detectChanges();
    value = fixture.nativeElement.querySelector('.pixel-data-grid__cell-value') as HTMLElement;
    gridCell = fixture.nativeElement.querySelector('.pixel-data-grid__cell') as HTMLElement;
  });

  afterEach(() => {
    document.querySelectorAll('.pixel-tooltip').forEach((el) => el.remove());
  });

  it('shows when the grid cell clips a cell-value host that still reports full width', async () => {
    Object.defineProperty(value, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(value, 'scrollWidth', { value: 200, configurable: true });
    Object.defineProperty(gridCell, 'clientWidth', { value: 80, configurable: true });
    Object.defineProperty(gridCell, 'scrollWidth', { value: 200, configurable: true });

    value.dispatchEvent(new MouseEvent('mouseenter'));
    await flushMacrotask();
    expect(document.body.querySelector('.pixel-tooltip')?.textContent?.trim()).toBe('Full member name');
  });
});
