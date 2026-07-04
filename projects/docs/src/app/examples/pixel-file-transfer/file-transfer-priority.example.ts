import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_FILE_TRANSFER_CONFIG,
  PIXEL_UPLOAD_ADAPTER,
  PixelButtonComponent,
  PixelUploadService,
} from 'pixel-ui';
import { DemoUploadAdapter } from './demo-upload-adapter';

let seq = 0;

@Component({
  selector: 'docs-file-transfer-priority-example',
  imports: [PixelButtonComponent],
  // parallelUploads: 1 makes the dequeue order visible.
  providers: [
    DemoUploadAdapter,
    { provide: PIXEL_UPLOAD_ADAPTER, useExisting: DemoUploadAdapter },
    { provide: PIXEL_FILE_TRANSFER_CONFIG, useValue: { parallelUploads: 1 } },
    PixelUploadService,
  ],
  template: `
    <p class="hint">
      Queue runs one at a time (parallelUploads: 1). Higher priority jumps ahead —
      add a few normal items, then a high-priority one, and watch the order.
    </p>
    <div class="actions">
      <pixel-button appearance="outline" size="sm" (click)="add(0)">Add normal (p0)</pixel-button>
      <pixel-button appearance="solid"   size="sm" leadingIcon="priority_high" (click)="add(10)">Add urgent (p10)</pixel-button>
    </div>

    @if (upload.tasks().length) {
      <ol class="queue">
        @for (t of upload.tasks(); track t.id) {
          <li [class.done]="t.status === 'completed'">
            <strong>{{ t.file.name }}</strong>
            <span class="badge">p{{ t.priority }}</span>
            <span class="state">{{ t.status }}{{ t.status === 'uploading' ? ' ' + t.progress + '%' : '' }}</span>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .hint    { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }
    .actions { display: flex; gap: 0.75rem; margin-block-end: 1rem; flex-wrap: wrap; }
    .queue   { margin: 0; padding-inline-start: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
    .queue li.done { opacity: 0.55; }
    .badge   { margin-inline: 0.5rem; padding: 0.05rem 0.4rem; border-radius: 999px; background: var(--pixel-sys-surface-container); font-size: 0.7rem; }
    .state   { color: var(--pixel-sys-outline); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTransferPriorityExample {
  protected readonly upload = inject(PixelUploadService);

  protected add(priority: number): void {
    const tag = priority > 0 ? 'urgent' : 'task';
    const file = new File([`x`], `${tag}-${++seq}.txt`, { type: 'text/plain' });
    this.upload.upload(file, { priority });
  }
}
