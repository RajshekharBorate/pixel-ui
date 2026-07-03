import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-labeled-switch-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: `
    <pixel-toggle
      switchAppearance="labeled"
      onLabel="ON"
      offLabel="OFF"
      [checked]="powerOn()"
      (checkedChange)="powerOn.set($event)"
    >
      <ng-template pixelToggleCheckedIcon>
        <pixel-toggle-thumb-icon icon="check" />
      </ng-template>
      <ng-template pixelToggleUncheckedIcon>
        <pixel-toggle-thumb-icon icon="close" />
      </ng-template>
    </pixel-toggle>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleLabeledSwitchExample {
  protected readonly powerOn = signal(false);
}
