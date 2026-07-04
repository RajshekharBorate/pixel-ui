import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelButtonSize } from 'pixel-ui';

@Component({
  selector: 'docs-button-sizes-example',
  imports: [PixelButtonComponent],
  template: `
    <div class="row">
      @for (size of sizes; track size) {
        <div class="size-item">
          <pixel-button [size]="size" appearance="solid" trailingIcon="arrow_forward">
            Continue
          </pixel-button>
          <span class="size-tag">{{ size }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 1.25rem 1.5rem;
    }

    .size-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .size-tag {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--pixel-sys-outline);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSizesExample {
  protected readonly sizes: readonly PixelButtonSize[] = ['xs', 'sm', 'md', 'lg'];
}
