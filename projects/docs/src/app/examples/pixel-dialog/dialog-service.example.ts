import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelButtonComponent, PixelDialogService } from 'pixel-ui';
import { DocsDialogServiceContentComponent } from './dialog-service-content.component';

@Component({
  selector: 'docs-dialog-service-example',
  standalone: true,
  imports: [PixelButtonComponent],
  templateUrl: './dialog-service.example.html',
  styleUrl: './dialog-service.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogServiceExample {
  private readonly dialog = inject(PixelDialogService);
  protected readonly lastResult = signal('');

  protected openViaService(): void {
    const ref = this.dialog.open<DocsDialogServiceContentComponent, { currentName: string }, string>(
      DocsDialogServiceContentComponent,
      {
        title: 'Rename policy',
        size: 'sm',
        data: { currentName: 'Q3 enterprise renewal' },
      },
    );
    ref.afterClosed().subscribe((newName) => {
      this.lastResult.set(
        newName ? `Saved: "${newName}"` : 'Dismissed without changes',
      );
    });
  }
}
