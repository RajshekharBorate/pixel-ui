import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_UPLOAD_ADAPTER,
  PixelButtonComponent,
  PixelChipComponent,
  PixelOfflineQueueService,
  PixelUploadService,
} from 'pixel-ui';
import { DemoUploadAdapter } from './demo-upload-adapter';

let demoSeq = 0;

@Component({
  selector: 'docs-file-transfer-offline-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelChipComponent],
  providers: [
    DemoUploadAdapter,
    { provide: PIXEL_UPLOAD_ADAPTER, useExisting: DemoUploadAdapter },
    PixelUploadService,
    PixelOfflineQueueService,
  ],
  template: `
    <div class="status">
      Connection:
      <pixel-chip
        [label]="offline.online() ? 'Online' : 'Offline'"
        [variant]="offline.online() ? 'solid' : 'outline'"
        size="sm"
        presentational
      />
      <span class="pending">Queued while offline: <strong>{{ offline.pendingCount() }}</strong></span>
    </div>

    <div class="actions">
      <pixel-button
        appearance="outline"
        size="sm"
        [leadingIcon]="offline.online() ? 'wifi_off' : 'wifi'"
        (click)="toggleConnection()"
      >
        Go {{ offline.online() ? 'offline' : 'online' }}
      </pixel-button>

      <pixel-button appearance="solid" size="sm" leadingIcon="upload" (click)="queueUpload()">
        Queue an upload
      </pixel-button>
    </div>

    <p class="hint">
      Queue uploads while offline — nothing transfers. Go online and the queue replays
      automatically. (This demo flips the real service's connectivity signal via synthetic
      window online/offline events.)
    </p>

    @if (upload.tasks().length) {
      <ul class="log">
        @for (t of upload.tasks(); track t.id) {
          <li>{{ t.file.name }} — {{ t.status }} ({{ t.progress }}%)</li>
        }
      </ul>
    }
  `,
  styles: `
    .status  { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; font-size: 0.875rem; }
    .pending { color: var(--pixel-sys-outline); }
    .actions { display: flex; gap: 0.75rem; margin-block: 0.75rem; flex-wrap: wrap; }
    .hint    { margin: 0; font-size: 0.8125rem; color: var(--pixel-sys-outline); }
    .log     { list-style: none; margin: 0.75rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTransferOfflineExample {
  protected readonly offline = inject(PixelOfflineQueueService);
  protected readonly upload = inject(PixelUploadService);

  protected toggleConnection(): void {
    // The offline service listens to window 'online' / 'offline' events.
    const goingOffline = this.offline.online();
    window.dispatchEvent(new Event(goingOffline ? 'offline' : 'online'));
  }

  protected queueUpload(): void {
    const name = `evidence-${++demoSeq}.txt`;
    const file = new File([`demo content ${demoSeq}`], name, { type: 'text/plain' });
    // Runs immediately when online; held + replayed on reconnect when offline.
    this.offline.upload(file);
  }
}
