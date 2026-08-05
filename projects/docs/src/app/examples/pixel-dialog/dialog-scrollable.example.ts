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
    { length: 24 },
    (_unused, i) =>
      `Section ${i + 1}. The body scrolls independently while the header and footer stay pinned. ` +
      `On smaller viewports the surface is capped to the dynamic viewport height so this region ` +
      `becomes a real scroll container with a visible scrollbar when content overflows.`,
  );
}
