import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelFileUploadComponent, type PixelFileSelectEvent } from 'pixel-ui';

@Component({
  selector: 'docs-file-upload-multiple-example',
  standalone: true,
  imports: [PixelFileUploadComponent],
  template: `
    <pixel-file-upload
      label="Upload images"
      accept="image/*"
      [multiple]="true"
      [maxFiles]="5"
      [maxSize]="5242880"
      helperText="Up to 5 images · Max 5 MB each."
      (filesChange)="onFiles($event)"
    />
    @if (rejections().length) {
      <ul class="errors">
        @for (r of rejections(); track r.file.name) {
          <li>{{ r.file.name }}: {{ r.errors[0] }}</li>
        }
      </ul>
    }
  `,
  styles: `.errors { margin: 0.5rem 0 0; padding-inline-start: 1rem; font-size: 0.8125rem; color: var(--pixel-sys-error); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadMultipleExample {
  protected readonly rejections = signal<PixelFileSelectEvent['rejected']>([]);

  protected onFiles(event: PixelFileSelectEvent): void {
    this.rejections.set([...event.rejected]);
  }
}
