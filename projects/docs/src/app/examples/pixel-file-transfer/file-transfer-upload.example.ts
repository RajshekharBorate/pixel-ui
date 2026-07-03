import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_UPLOAD_ADAPTER,
  PixelButtonComponent,
  PixelFileUploadComponent,
  PixelProgressBarComponent,
  PixelUploadService,
  formatBytes,
  type PixelFileSelectEvent,
} from 'pixel-ui';
import { DemoUploadAdapter } from './demo-upload-adapter';

@Component({
  selector: 'docs-file-transfer-upload-example',
  standalone: true,
  imports: [PixelFileUploadComponent, PixelButtonComponent, PixelProgressBarComponent],
  // Swap the real REST adapter for a simulated one so the demo runs without a backend.
  // PixelUploadService is re-provided here so it resolves the adapter from THIS injector
  // (the root singleton would otherwise keep the default RestAdapter).
  providers: [
    DemoUploadAdapter,
    { provide: PIXEL_UPLOAD_ADAPTER, useExisting: DemoUploadAdapter },
    PixelUploadService,
  ],
  template: `
    <!-- pixel-file-upload picks files; the service owns the transfer queue -->
    <pixel-file-upload
      variant="button"
      buttonLabel="Add files to queue"
      [multiple]="true"
      helperText="Files are queued and uploaded with a simulated adapter (3 in parallel)."
      (filesChange)="onFiles($event)"
    />

    @if (upload.tasks().length) {
      <div class="totals">
        <span>Overall: <strong>{{ upload.totalProgress() }}%</strong></span>
        <span>Active: <strong>{{ upload.activeCount() }}</strong></span>
        <span>Completed: <strong>{{ upload.completed().length }}</strong></span>
        <pixel-button appearance="text" size="sm" (click)="upload.clearCompleted()">Clear completed</pixel-button>
      </div>

      <ul class="queue">
        @for (task of upload.tasks(); track task.id) {
          <li class="row">
            <div class="meta">
              <span class="name" [title]="task.file.name">{{ task.file.name }}</span>
              <span class="sub">{{ size(task.file.size) }} · {{ task.status }}</span>
            </div>

            <pixel-progress-bar class="bar" [value]="task.progress" size="sm" />

            <div class="actions">
              @if (task.status === 'uploading') {
                <pixel-button appearance="icon" size="xs" leadingIcon="pause" ariaLabel="Pause" (click)="upload.pauseUpload(task.id)" />
                <pixel-button appearance="icon" size="xs" leadingIcon="close" ariaLabel="Cancel" (click)="upload.cancelUpload(task.id)" />
              } @else if (task.status === 'paused') {
                <pixel-button appearance="icon" size="xs" leadingIcon="play_arrow" ariaLabel="Resume" (click)="upload.resumeUpload(task.id)" />
              } @else if (task.status === 'failed' || task.status === 'cancelled') {
                <pixel-button appearance="icon" size="xs" leadingIcon="refresh" ariaLabel="Retry" (click)="upload.retryUpload(task.id)" />
              }
              <pixel-button appearance="icon" size="xs" leadingIcon="delete" ariaLabel="Remove" (click)="upload.removeUpload(task.id)" />
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host { display: block; }
    .totals { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-block: 1rem 0.5rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }
    .queue  { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .row    { display: grid; grid-template-columns: minmax(8rem, 1fr) minmax(6rem, 14rem) auto; align-items: center; gap: 0.75rem; padding: 0.5rem 0.625rem; border-radius: 0.5rem; background: var(--pixel-sys-surface-container-low); }
    .meta   { display: flex; flex-direction: column; min-inline-size: 0; }
    .name   { font-size: 0.8125rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sub    { font-size: 0.72rem; color: var(--pixel-sys-outline); }
    .bar    { inline-size: 100%; }
    .actions{ display: flex; gap: 0.125rem; justify-content: flex-end; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTransferUploadExample {
  protected readonly upload = inject(PixelUploadService);

  protected onFiles(event: PixelFileSelectEvent): void {
    this.upload.uploadMany(event.accepted.map((f) => f.file));
  }

  protected size(bytes: number): string {
    return formatBytes(bytes);
  }
}
