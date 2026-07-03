import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PIXEL_UPLOAD_ADAPTER,
  PixelFileTransferService,
  PixelFileUploadComponent,
  PixelUploadService,
} from 'pixel-ui';
import { DemoUploadAdapter } from '../pixel-file-transfer/demo-upload-adapter';

@Component({
  selector: 'docs-file-upload-auto-transfer-example',
  standalone: true,
  imports: [PixelFileUploadComponent],
  // Component-scoped transfer engine + simulated adapter so the demo runs without a backend.
  // The file-upload resolves PixelFileTransferService up this injector chain.
  providers: [
    DemoUploadAdapter,
    { provide: PIXEL_UPLOAD_ADAPTER, useExisting: DemoUploadAdapter },
    PixelUploadService,
    PixelFileTransferService,
  ],
  template: `
    <pixel-file-upload
      label="Upload with live progress"
      [multiple]="true"
      [autoTransfer]="true"
      transferUrl="/api/upload"
      helperText="Files queue on the transfer engine; each row shows live progress with cancel / retry."
      (transferQueued)="onQueued($event)"
    />
    @if (lastIds().length) {
      <p class="info">Queued task ids: <code>{{ lastIds().join(', ') }}</code></p>
    }
  `,
  styles: `.info { margin-block-start: 0.75rem; font-size: 0.8125rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadAutoTransferExample {
  protected readonly lastIds = signal<string[]>([]);

  protected onQueued(ids: string[]): void {
    this.lastIds.set(ids);
  }
}
