import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelDialogComponent,
  type PixelDialogSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-dialog-sizes-example',
  imports: [PixelButtonComponent, PixelDialogComponent],
  templateUrl: './dialog-sizes.example.html',
  styleUrl: './dialog-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogSizesExample {
  protected readonly sizes: readonly PixelDialogSize[] = ['sm', 'md', 'lg', 'fullscreen'];
  protected readonly open = signal(false);
  protected readonly activeSize = signal<PixelDialogSize>('md');

  protected openSize(size: PixelDialogSize): void {
    this.activeSize.set(size);
    this.open.set(true);
  }
}
