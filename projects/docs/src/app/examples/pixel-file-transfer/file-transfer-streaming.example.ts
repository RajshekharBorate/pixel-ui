import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelButtonComponent, PixelDownloadService } from 'pixel-ui';

@Component({
  selector: 'docs-file-transfer-streaming-example',
  imports: [PixelButtonComponent],
  template: `
    <p class="hint">
      downloadStream() reads the response via fetch + ReadableStream — memory-aware for
      very large files. Here it streams a generated ~50 MB blob and reports live progress.
      (noSave keeps the demo from triggering a download dialog.)
    </p>
    <pixel-button appearance="solid" leadingIcon="downloading" [disabled]="busy()" (click)="stream()">
      {{ busy() ? 'Streaming…' : 'Stream 50 MB file' }}
    </pixel-button>

    @if (taskId()) {
      @if (task(); as t) {
        <div class="status">
          <span>{{ t.status }} — {{ t.progress }}%</span>
          <span class="bar"><span class="fill" [style.width.%]="t.progress"></span></span>
        </div>
      }
    }
  `,
  styles: `
    .hint   { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }
    .status { display: flex; flex-direction: column; gap: 0.4rem; margin-block-start: 0.75rem; max-width: 22rem; font-size: 0.8125rem; }
    .bar    { block-size: 4px; border-radius: 999px; background: color-mix(in srgb, var(--pixel-sys-outline) 24%, transparent); overflow: hidden; }
    .fill   { display: block; block-size: 100%; background: var(--pixel-sys-primary); transition: width 120ms linear; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTransferStreamingExample {
  private readonly downloads = inject(PixelDownloadService);
  protected readonly busy = signal(false);
  protected readonly taskId = signal('');

  /** Reactive lookup of the streaming task in the service's signal. */
  protected task() {
    return this.downloads.tasks().find((t) => t.id === this.taskId());
  }

  protected stream(): void {
    this.busy.set(true);
    // ~50 MB of data so the per-chunk progress sweep is clearly visible.
    const blob = new Blob([new Uint8Array(50 * 1024 * 1024)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // Start streaming WITHOUT awaiting — the returned promise only resolves once the
    // stream is fully consumed, which would hide the live progress. The service registers
    // the task synchronously, so it's already the most recent entry in tasks().
    const promise = this.downloads.downloadStream(url, { fileName: 'large.bin', noSave: true });
    this.taskId.set(this.downloads.tasks().at(-1)?.id ?? '');

    // Revoke the object URL only after streaming completes (fetch needs it alive).
    promise.finally(() => {
      URL.revokeObjectURL(url);
      this.busy.set(false);
    });
  }
}
