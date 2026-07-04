import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent, type PixelDividerLabelAlign } from 'pixel-ui';

@Component({
  selector: 'docs-divider-labeled-example',
  imports: [PixelDividerComponent],
  template: `
    <div class="stack">
      @for (align of labelAligns; track align) {
        <pixel-divider labeled [labelAlign]="align">{{ align }}</pixel-divider>
      }
      <pixel-divider labeled>OR</pixel-divider>
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerLabeledExample {
  protected readonly labelAligns: readonly PixelDividerLabelAlign[] = ['start', 'center', 'end'];
}
