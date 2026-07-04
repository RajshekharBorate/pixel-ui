import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelFileUploadComponent } from 'pixel-ui';

@Component({
  selector: 'docs-file-upload-states-example',
  imports: [PixelFileUploadComponent, PixelCheckboxComponent],
  template: `
    <pixel-checkbox label="Show skeleton" [checked]="skeleton()" (checkedChange)="skeleton.set($event)" />
    <div class="stack">
      <pixel-file-upload label="Default"  [showSkeleton]="skeleton()" />
      <pixel-file-upload label="Disabled" [disabled]="true" [showSkeleton]="skeleton()" />
      <pixel-file-upload label="Button variant" variant="button" [showSkeleton]="skeleton()" />
    </div>
  `,
  styles: `.stack { display: flex; flex-direction: column; gap: 1.25rem; margin-block-start: 1rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadStatesExample {
  protected readonly skeleton = signal(false);
}
