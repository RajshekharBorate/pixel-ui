import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelSelectComponent,
  PixelToastContainerComponent,
  PixelToastService,
  type PixelSelectOption,
  type PixelToastPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-positions-example',
  imports: [PixelButtonComponent, PixelSelectComponent, PixelToastContainerComponent],
  template: `
    <pixel-toast-container />
    <div class="controls">
      <pixel-select
        label="Position"
        size="sm"
        [options]="positionOptions"
        [value]="position()"
        (valueChange)="position.set($any($event))"
      />
      <pixel-button appearance="solid" (click)="show()">Show toast</pixel-button>
    </div>
  `,
  styles: `
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 0.75rem;
    }

    pixel-select {
      min-width: 11rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPositionsExample {
  private readonly toast = inject(PixelToastService);

  protected readonly positions: readonly PixelToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  protected readonly positionOptions: readonly PixelSelectOption[] = this.positions.map(pos => ({
    value: pos,
    label: pos,
  }));

  protected readonly position = signal<PixelToastPosition>('top-right');

  protected show(): void {
    this.toast.configure({ position: this.position() });
    this.toast.success('Position demo', `Rendering at ${this.position()}.`);
  }
}
