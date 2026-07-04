import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDialogComponent } from 'pixel-ui';

@Component({
  selector: 'docs-dialog-scrollable-example',
  imports: [PixelButtonComponent, PixelDialogComponent],
  templateUrl: './dialog-scrollable.example.html',
  styleUrl: './dialog-scrollable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogScrollableExample {
  protected readonly open = signal(false);
  protected readonly longContent: readonly string[] = Array.from(
    { length: 8 },
    (_unused, i) =>
      `Section ${i + 1}. The body scrolls independently while the header and footer stay pinned.`,
  );
}
