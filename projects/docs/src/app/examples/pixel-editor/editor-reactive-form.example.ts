import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PixelButtonComponent, PixelEditorComponent, type PixelEditorDoc } from 'pixel-ui';

@Component({
  selector: 'docs-editor-reactive-form-example',
  imports: [ReactiveFormsModule, JsonPipe, PixelEditorComponent, PixelButtonComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted = true" class="form">
      <pixel-editor
        formControlName="description"
        label="Description"
        placeholder="Required field…"
        required
        minLength="8"
      />
      <div class="actions">
        <pixel-button type="submit" size="sm">Validate</pixel-button>
        <pixel-button type="button" appearance="text" size="sm" (click)="form.reset()">Reset</pixel-button>
      </div>
    </form>
    @if (submitted) {
      <p class="hint">Valid: {{ form.valid }} · Value: {{ form.value | json }}</p>
    }
  `,
  styles: `
    .form {
      display: grid;
      gap: 0.75rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .hint {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #444);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorReactiveFormExample {
  private readonly fb = inject(FormBuilder);
  protected submitted = false;

  protected readonly form = this.fb.nonNullable.group({
    description: this.fb.nonNullable.control<PixelEditorDoc>({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    }),
  });
}
