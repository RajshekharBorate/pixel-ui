import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-skeleton-example',
  imports: [PixelButtonComponent, PixelCheckboxComponent],
  template: `
    <div class="controls">
      <pixel-checkbox
        label="Show skeleton"
        [checked]="skeleton()"
        (checkedChange)="skeleton.set($event)"
      />
    </div>

    <div class="grid">
      <pixel-button appearance="solid"   [showSkeleton]="skeleton()">Save</pixel-button>
      <pixel-button appearance="outline" [showSkeleton]="skeleton()">Cancel</pixel-button>
      <pixel-button appearance="text"    [showSkeleton]="skeleton()">Learn more</pixel-button>
      <pixel-button appearance="tonal"   [showSkeleton]="skeleton()">Export</pixel-button>
      <pixel-button appearance="icon"    leadingIcon="edit"  ariaLabel="Edit"   [showSkeleton]="skeleton()" />
      <pixel-button appearance="icon"    leadingIcon="delete" ariaLabel="Delete" fabShape="square" [showSkeleton]="skeleton()" />
    </div>

    <div class="sizes">
      @for (size of sizes; track size) {
        <pixel-button appearance="solid" [size]="size" [showSkeleton]="skeleton()">
          {{ size.toUpperCase() }}
        </pixel-button>
      }
    </div>
  `,
  styles: `
    .controls { margin-block-end: 1.25rem; }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      margin-block-end: 1rem;
    }
    .sizes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSkeletonExample {
  protected readonly skeleton = signal(true);
  protected readonly sizes = ['xs', 'sm', 'md', 'lg'] as const;
}
