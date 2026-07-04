import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_FILE_TRANSFER_CONFIG,
  PIXEL_UPLOAD_ADAPTER,
  PixelButtonComponent,
  PixelUploadService,
} from 'pixel-ui';
import { DemoFlakyAdapter } from './demo-flaky-adapter';

let seq = 0;

@Component({
  selector: 'docs-file-transfer-retry-example',
  imports: [PixelButtonComponent],
  // autoRetry with exponential backoff; the flaky adapter fails the first 2 attempts.
  providers: [
    DemoFlakyAdapter,
    { provide: PIXEL_UPLOAD_ADAPTER, useExisting: DemoFlakyAdapter },
    { provide: PIXEL_FILE_TRANSFER_CONFIG, useValue: { autoRetry: true, retryCount: 3, retryDelay: 300 } },
    PixelUploadService,
  ],
  template: `
    <p class="hint">
      The simulated adapter fails the first two attempts of each file. With
      autoRetry + backoff, the service retries automatically and succeeds on attempt 3.
    </p>
    <pixel-button appearance="solid" size="sm" leadingIcon="upload" (click)="add()">Upload a flaky file</pixel-button>

    @if (upload.tasks().length) {
      <ul class="list">
        @for (t of upload.tasks(); track t.id) {
          <li>
            <strong>{{ t.file.name }}</strong>
            <span class="state" [class.ok]="t.status === 'completed'" [class.err]="t.status === 'failed'">
              {{ t.status }}{{ t.status === 'uploading' ? ' ' + t.progress + '%' : '' }}
            </span>
            <span class="attempts">attempts: {{ t.attempts }}</span>
            @if (t.error) { <span class="msg">— {{ t.error.message }}</span> }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .hint     { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }
    .list     { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
    .state.ok { color: var(--pixel-sys-success); }
    .state.err{ color: var(--pixel-sys-error); }
    .attempts { margin-inline: 0.5rem; color: var(--pixel-sys-outline); font-size: 0.75rem; }
    .msg      { color: var(--pixel-sys-error); font-size: 0.75rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTransferRetryExample {
  protected readonly upload = inject(PixelUploadService);

  protected add(): void {
    const file = new File(['x'], `flaky-${++seq}.txt`, { type: 'text/plain' });
    this.upload.upload(file);
  }
}
