import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-states-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: `
    <div class="stack">
      <pixel-toggle label="Disabled off" disabled />
      <pixel-toggle label="Slide me!" disabled [checked]="true">
        <ng-template pixelToggleCheckedIcon>
          <pixel-toggle-thumb-icon icon="check" />
        </ng-template>
        <ng-template pixelToggleUncheckedIcon>
          <pixel-toggle-thumb-icon icon="remove" />
        </ng-template>
      </pixel-toggle>
      <pixel-toggle label="Readonly on" readonly [checked]="true">
        <ng-template pixelToggleCheckedIcon>
          <pixel-toggle-thumb-icon icon="check" />
        </ng-template>
      </pixel-toggle>
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleStatesExample {}
