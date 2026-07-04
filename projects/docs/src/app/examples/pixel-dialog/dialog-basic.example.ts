import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDialogComponent } from 'pixel-ui';

@Component({
  selector: 'docs-dialog-basic-example',
  imports: [PixelButtonComponent, PixelDialogComponent],
  template: `
    <pixel-button appearance="solid" (click)="open.set(true)">Open dialog</pixel-button>

    <pixel-dialog [(open)]="open" title="Policy details" size="md">
      <p class="body">
        This dialog traps focus while open. Click the scrim, press Escape, or use the actions below
        to dismiss it.
      </p>
      <pixel-button pixelDialogFooter appearance="text" (click)="open.set(false)">Close</pixel-button>
      <pixel-button pixelDialogFooter appearance="solid" (click)="open.set(false)">Save</pixel-button>
    </pixel-dialog>
  `,
  styles: `
    .body {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogBasicExample {
  protected readonly open = signal(false);
}
