import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelButtonComponent, PixelFileUploadComponent } from 'pixel-ui';

@Component({
  selector: 'docs-file-upload-reactive-form-example',
  imports: [ReactiveFormsModule, PixelFileUploadComponent, PixelButtonComponent],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <pixel-file-upload
        label="Profile photo"
        accept="image/*"
        formControlName="photo"
        helperText="PNG, JPG or WebP · Max 2 MB."
        [maxSize]="2097152"
        [validationMessages]="{ required: 'A profile photo is required.' }"
      />
      <pixel-file-upload
        label="Supporting documents"
        variant="button"
        accept=".pdf,.docx"
        [multiple]="true"
        formControlName="docs"
        helperText="Optional — PDF or Word files."
      />
      <div class="actions">
        <pixel-button type="submit" appearance="solid" [disabled]="form.invalid">Submit</pixel-button>
        <pixel-button type="button" appearance="outline" (click)="form.reset()">Reset</pixel-button>
      </div>
      @if (submitted) {
        <p class="info">
          Photo: <strong>{{ form.value.photo?.name ?? '—' }}</strong> ·
          Docs: <strong>{{ form.value.docs?.length ?? 0 }}</strong>
        </p>
      }
    </form>
  `,
  styles: `
    .form    { display: flex; flex-direction: column; gap: 1.25rem; max-width: 28rem; }
    .actions { display: flex; gap: 0.75rem; }
    .info    { margin: 0; font-size: 0.875rem; color: var(--pixel-sys-outline); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadReactiveFormExample {
  protected submitted = false;

  protected readonly form = new FormGroup({
    photo: new FormControl<File | null>(null, Validators.required),
    docs:  new FormControl<File[]>([]),
  });

  protected onSubmit(): void {
    if (this.form.valid) this.submitted = true;
  }
}
