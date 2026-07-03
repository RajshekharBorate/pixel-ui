import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDialogComponent } from 'pixel-ui';

@Component({
  selector: 'docs-dialog-bottom-sheet-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelDialogComponent],
  template: `
    <pixel-button appearance="tonal" (click)="open.set(true)">Open bottom-sheet</pixel-button>

    <pixel-dialog [(open)]="open" position="bottom-sheet" title="Filters">
      <p class="body">
        Bottom-sheets slide up from the bottom edge — ideal for filters and mobile-first flows.
      </p>
      <ul class="list">
        <li>Sort by relevance, date, or name</li>
        <li>Filter by status and owner</li>
        <li>Toggle archived items</li>
      </ul>
      <pixel-button pixelDialogFooter appearance="text" (click)="open.set(false)">Reset</pixel-button>
      <pixel-button pixelDialogFooter appearance="solid" (click)="open.set(false)">Apply filters</pixel-button>
    </pixel-dialog>
  `,
  styles: `
    .body {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      line-height: 1.55;
    }

    .list {
      margin: 0;
      padding-inline-start: 1.25rem;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogBottomSheetExample {
  protected readonly open = signal(false);
}
