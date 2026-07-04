import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-switch-basic-example',
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: `
    <pixel-toggle
      label="Enable Wifi"
      [checked]="wifiEnabled()"
      (checkedChange)="wifiEnabled.set($event)"
    >
      <ng-template pixelToggleCheckedIcon>
        <pixel-toggle-thumb-icon icon="check" />
      </ng-template>
      <ng-template pixelToggleUncheckedIcon>
        <pixel-toggle-thumb-icon icon="remove" />
      </ng-template>
    </pixel-toggle>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchBasicExample {
  protected readonly wifiEnabled = signal(true);
}
