import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelDataGridCellOverflowDirective from './pixel-data-grid-cell-overflow.directive';
import PixelDataGridCellRowDirective from './pixel-data-grid-cell-row.directive';

@Component({
  imports: [PixelDataGridCellOverflowDirective, PixelDataGridCellRowDirective],
  template: `
    <span pixelGridCellRow>
      <span class="avatar" aria-hidden="true">A</span>
      <span
        pixelGridCellOverflow
        [pixelGridCellOverflow]="tooltip"
        [pixelGridCellOverflowDisabled]="disabled()"
      >{{ label }}</span>
    </span>
  `,
})
class HostComponent {
  readonly label =
    'Ada Lovelace — extended notes for layout stress: cross-region orchestration review';
  readonly tooltip = this.label;
  readonly disabled = () => false;
}

describe('PixelDataGridCellOverflowDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('applies cell-value and cell-row helper classes', () => {
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__cell-value')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pixel-data-grid__cell-row')).toBeTruthy();
  });

  it('marks the host for overflow gating and composes PixelTooltipDirective', () => {
    const overflowHost = fixture.debugElement.query(By.directive(PixelDataGridCellOverflowDirective));
    expect(overflowHost.nativeElement.hasAttribute('data-pixel-grid-cell-overflow')).toBe(true);
    expect(overflowHost.injector.get(PixelTooltipDirective)).toBeTruthy();
  });
});
