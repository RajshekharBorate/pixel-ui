import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonAppearance, PixelButtonComponent, PixelButtonState } from 'pixel-ui';

interface VariantShowcaseRow {
  readonly name: string;
  readonly appearance: PixelButtonAppearance;
  readonly cells: readonly {
    readonly label: string;
    readonly disabled?: boolean;
    readonly state?: PixelButtonState;
    readonly leadingIcon?: string;
    readonly trailingIcon?: string;
  }[];
}

@Component({
  selector: 'docs-button-appearances-example',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <div class="matrix-head" aria-hidden="true">
      <span class="matrix-corner"></span>
      <span>Default</span>
      <span>Disabled</span>
    </div>

    @for (row of variantShowcase; track row.appearance) {
      <div class="matrix-row">
        <span class="matrix-label">{{ row.name }}</span>
        @for (cell of row.cells; track $index) {
          <pixel-button
            class="matrix-cell"
            [appearance]="row.appearance"
            [disabled]="cell.disabled ?? false"
            [state]="cell.state ?? 'default'"
            [leadingIcon]="cell.leadingIcon ?? ''"
            [trailingIcon]="cell.trailingIcon ?? ''"
          >
            {{ cell.label }}
          </pixel-button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .matrix-head,
    .matrix-row {
      display: grid;
      grid-template-columns: minmax(5.5rem, 7.5rem) minmax(0, 1fr) minmax(0, 1fr);
      gap: 0.75rem 1rem;
      align-items: center;
    }

    .matrix-head {
      margin-block-end: 0.35rem;
      padding-block-end: 0.5rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--pixel-sys-outline);
    }

    .matrix-row + .matrix-row {
      margin-block-start: 0.85rem;
    }

    .matrix-label {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .matrix-cell {
      justify-self: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAppearancesExample {
  protected readonly variantShowcase: readonly VariantShowcaseRow[] = [
    {
      name: 'Text',
      appearance: 'text',
      cells: [{ label: 'Learn more' }, { label: 'Learn more', disabled: true }],
    },
    {
      name: 'Elevated',
      appearance: 'elevated',
      cells: [{ label: 'Add to cart' }, { label: 'Add to cart', disabled: true }],
    },
    {
      name: 'Outlined',
      appearance: 'outline',
      cells: [
        { label: 'Cancel', leadingIcon: 'arrow_back' },
        { label: 'Cancel', leadingIcon: 'arrow_back', disabled: true },
      ],
    },
    {
      name: 'Filled',
      appearance: 'solid',
      cells: [
        { label: 'Confirm', trailingIcon: 'arrow_forward' },
        { label: 'Confirm', trailingIcon: 'arrow_forward', disabled: true },
      ],
    },
    {
      name: 'Tonal',
      appearance: 'tonal',
      cells: [{ label: 'Filter results' }, { label: 'Filter results', disabled: true }],
    },
    {
      name: 'Icon',
      appearance: 'icon',
      cells: [
        { label: 'Favorite', leadingIcon: 'favorite' },
        { label: 'Favorite', leadingIcon: 'favorite', disabled: true },
      ],
    },
    {
      name: 'Mini FAB',
      appearance: 'mini-fab',
      cells: [
        { label: 'Edit', leadingIcon: 'edit' },
        { label: 'Edit', leadingIcon: 'edit', disabled: true },
      ],
    },
  ];
}
