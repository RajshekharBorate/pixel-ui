import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelFileUploadComponent, type PixelFileSelectEvent } from 'pixel-ui';

@Component({
  selector: 'docs-file-upload-basic-example',
  imports: [PixelFileUploadComponent],
  template: `
    <pixel-file-upload
      label="Upload document"
      helperText="Drag a file here or click to browse."
      (filesChange)="onFiles($event)"
    />
    @if (filename()) {
      <p class="info">Selected: <strong>{{ filename() }}</strong></p>
    }
  `,
  styles: `.info { margin-block-start: 0.5rem; font-size: 0.875rem; color: var(--pixel-sys-outline); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadBasicExample {
  protected readonly filename = signal('');

  protected onFiles(event: PixelFileSelectEvent): void {
    this.filename.set(event.accepted[0]?.file.name ?? '');
  }
}
