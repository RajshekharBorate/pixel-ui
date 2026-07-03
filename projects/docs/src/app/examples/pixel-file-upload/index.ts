import { createDocExample } from '../../shared/example-source.util';
import { FileUploadAutoTransferExample } from './file-upload-auto-transfer.example';
import { FileUploadBasicExample }        from './file-upload-basic.example';
import { FileUploadButtonExample }       from './file-upload-button.example';
import { FileUploadMultipleExample }     from './file-upload-multiple.example';
import { FileUploadReactiveFormExample } from './file-upload-reactive-form.example';
import { FileUploadStatesExample }       from './file-upload-states.example';
import { FileUploadValidatorsExample }   from './file-upload-validators.example';

const UPLOAD_IMPORTS = ['PixelFileUploadComponent'] as const;

export const FILE_UPLOAD_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Dropzone',
    category: 'Setup',
    description: 'Default dropzone variant — drag a file or click to open the browser. Displays the selected file in a list with name, size, and a remove button.',
    component: FileUploadBasicExample,
    imports: [...UPLOAD_IMPORTS, 'PixelFileSelectEvent'],
    html: `<pixel-file-upload
  label="Upload document"
  helperText="Drag a file here or click to browse."
  (filesChange)="onFiles($event)"
/>`,
    typescript: `protected onFiles(event: PixelFileSelectEvent): void {
  console.log('accepted:', event.accepted);
  console.log('rejected:', event.rejected);
}`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'multiple',
    title: 'Multiple files with validation',
    category: 'Setup',
    description: 'accept, multiple, maxFiles, and maxSize inputs. Files that fail validation are rejected with error messages.',
    component: FileUploadMultipleExample,
    imports: [...UPLOAD_IMPORTS],
    html: `<pixel-file-upload
  label="Upload images"
  accept="image/*"
  [multiple]="true"
  [maxFiles]="5"
  [maxSize]="5242880"
  helperText="Up to 5 images · Max 5 MB each."
  (filesChange)="onFiles($event)"
/>`,
    typescript: `protected onFiles(event: PixelFileSelectEvent): void {
  this.rejections.set([...event.rejected]);
}`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'button',
    title: 'Button variant',
    category: 'Variants',
    description: 'variant="button" renders a compact trigger button with the file list below — ideal for inline forms.',
    component: FileUploadButtonExample,
    imports: [...UPLOAD_IMPORTS],
    html: `<pixel-file-upload
  variant="button"
  label="Attachment"
  accept=".pdf,.docx,.xlsx"
  helperText="PDF, Word, or Excel documents."
/>`,
    typescript: `@Component({ /* … */ }) export class FileUploadButtonExample {}`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'reactive-form',
    title: 'Reactive form integration',
    category: 'Forms',
    description: 'formControlName binding — single file resolves to File | null, multiple to File[]. The required state and error message are auto-detected from Validators.required; pass validationMessages to customise the copy.',
    component: FileUploadReactiveFormExample,
    imports: [...UPLOAD_IMPORTS],
    html: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- required is inferred from the control's Validators.required -->
  <pixel-file-upload
    label="Profile photo"
    accept="image/*"
    formControlName="photo"
    [validationMessages]="{ required: 'A profile photo is required.' }"
  />
  <!-- Optional multi-file -->
  <pixel-file-upload
    label="Supporting documents"
    variant="button"
    accept=".pdf,.docx"
    [multiple]="true"
    formControlName="docs"
  />
</form>`,
    typescript: `protected readonly form = new FormGroup({
  photo: new FormControl<File | null>(null, Validators.required),
  docs:  new FormControl<File[]>([]),
});`,
    scss: `.form { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),

  createDocExample({
    id: 'states',
    title: 'States & skeleton',
    category: 'States',
    description: 'Disabled state and showSkeleton placeholder across both variants.',
    component: FileUploadStatesExample,
    imports: [...UPLOAD_IMPORTS],
    html: `<pixel-file-upload label="Default"  [showSkeleton]="skeleton()" />
<pixel-file-upload label="Disabled" [disabled]="true" />
<pixel-file-upload label="Button variant" variant="button" [showSkeleton]="skeleton()" />`,
    typescript: `protected readonly skeleton = signal(false);`,
    scss: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),

  createDocExample({
    id: 'auto-transfer',
    title: 'Auto-upload with live progress',
    category: 'Advanced',
    description:
      'With [autoTransfer]="true" the component delegates accepted files to PixelFileTransferService and each row shows a live progress bar with cancel / retry — no manual wiring. The transfer engine is loaded lazily, so consumers that leave autoTransfer off never pull in HttpClient.',
    component: FileUploadAutoTransferExample,
    imports: ['PixelFileUploadComponent', 'PixelFileTransferService'],
    html: `<pixel-file-upload
  label="Upload with live progress"
  [multiple]="true"
  [autoTransfer]="true"
  transferUrl="/api/upload"
  (transferQueued)="onQueued($event)"
/>`,
    typescript: `import {
  PIXEL_UPLOAD_ADAPTER,
  PixelFileTransferService,
  PixelUploadService,
} from 'pixel-ui';

@Component({
  // In a real app just configure PIXEL_FILE_TRANSFER_CONFIG.uploadUrl and use the
  // default REST adapter — no providers needed here. This demo swaps in a simulated
  // adapter so it runs without a backend.
  providers: [
    DemoUploadAdapter,
    { provide: PIXEL_UPLOAD_ADAPTER, useExisting: DemoUploadAdapter },
    PixelUploadService,
    PixelFileTransferService,
  ],
  /* … */
})
export class FileUploadAutoTransferExample {
  onQueued(ids: string[]): void { /* track task ids if needed */ }
}`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'validators',
    title: 'Custom validators & total size',
    category: 'Advanced',
    description:
      'maxTotalSize caps the combined size of all selected files; validators runs custom per-file rules after the built-in accept / size / count checks. A failing validator routes the file into the rejected list with its message.',
    component: FileUploadValidatorsExample,
    imports: [...UPLOAD_IMPORTS],
    html: `<pixel-file-upload
  label="Upload assets"
  [multiple]="true"
  [maxTotalSize]="5242880"
  [validators]="validators"
/>`,
    typescript: `protected readonly validators = [
  (file: File) => file.name.includes(' ') ? 'Filename cannot contain spaces' : null,
  (file: File) => file.name.length > 40 ? 'Filename too long' : null,
];`,
    scss: `/* No styles required */`,
  }),
] as const;
