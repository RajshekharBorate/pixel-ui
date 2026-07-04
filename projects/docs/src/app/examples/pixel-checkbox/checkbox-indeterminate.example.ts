import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-indeterminate-example',
  imports: [PixelCheckboxComponent],
  template: `
    <div class="stack">
      <pixel-checkbox
        label="Select all rows"
        helperText="Indeterminate when only some rows are selected."
        [checked]="allRowsSelected()"
        [indeterminate]="someRowsSelected()"
        (checkedChange)="toggleAllRows($event)"
      />
      <p class="meta">{{ selectedRows() }} of 4 rows selected</p>
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 0.5rem;
    }

    .meta {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxIndeterminateExample {
  protected readonly selectedRows = signal(2);

  protected readonly allRowsSelected = computed(() => this.selectedRows() === 4);
  protected readonly someRowsSelected = computed(
    () => this.selectedRows() > 0 && this.selectedRows() < 4,
  );

  protected toggleAllRows(value: boolean): void {
    this.selectedRows.set(value ? 4 : 0);
  }
}
