import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent, type PixelDividerVariant } from 'pixel-ui';

@Component({
  selector: 'docs-divider-variants-example',
  standalone: true,
  imports: [PixelDividerComponent],
  template: `
  @for (variant of variants; track variant) {
    <div class="row">
      <span class="label">{{ variant }}</span>
      <pixel-divider [variant]="variant" />
    </div>
  }
  `,
  styles: `
    .row {
      display: grid;
      grid-template-columns: 4.5rem 1fr;
      gap: 1rem;
      align-items: center;
    }

    .row + .row {
      margin-block-start: 0.75rem;
    }

    .label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--pixel-sys-outline);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerVariantsExample {
  protected readonly variants: readonly PixelDividerVariant[] = ['solid', 'dashed', 'dotted'];
}
