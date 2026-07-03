import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDialogComponent } from 'pixel-ui';

@Component({
  selector: 'docs-dialog-nondismissable-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelDialogComponent],
  templateUrl: './dialog-nondismissable.example.html',
  styleUrl: './dialog-nondismissable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogNondismissableExample {
  protected readonly open = signal(false);
}
