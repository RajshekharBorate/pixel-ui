import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAvatarComponent,
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-image-thumb-example',
  standalone: true,
  imports: [
    PixelAvatarComponent,
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: `
    <pixel-toggle
      switchAppearance="labeled"
      size="md"
      label="Show profile photo"
      onLabel="ON"
      offLabel="OFF"
      [checked]="profileOn()"
      (checkedChange)="profileOn.set($event)"
    >
      <ng-template pixelToggleCheckedIcon>
        <pixel-avatar size="xs" name="Ada Brown" aria-hidden="true" />
      </ng-template>
      <ng-template pixelToggleUncheckedIcon>
        <pixel-toggle-thumb-icon icon="person_off" />
      </ng-template>
    </pixel-toggle>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleImageThumbExample {
  protected readonly profileOn = signal(true);
}
