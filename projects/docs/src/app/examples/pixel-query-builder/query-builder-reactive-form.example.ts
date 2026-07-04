import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  createEmptyQuery,
  exportQuery,
  nativeDateAdapterProviders,
  PixelButtonComponent,
  PixelQueryBuilderComponent,
  PixelQueryBuilderConfig,
  PixelQueryGroup,
} from 'pixel-ui';

@Component({
  selector: 'docs-query-builder-reactive-form-example',
  imports: [ReactiveFormsModule, PixelQueryBuilderComponent, PixelButtonComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="submit()">
      <pixel-query-builder
        formControlName="filters"
        [config]="config"
        [required]="true"
      />
      <pixel-button appearance="solid" buttonType="submit">Run query</pixel-button>
    </form>
    @if (submitted()) {
      <pre class="output">{{ submitted() }}</pre>
    }
  `,
  styles: `
    .form {
      display: grid;
      gap: 3rem;
    }

    .output {
      margin: 0;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface-container-low);
      font-size: 0.75rem;
      overflow: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderReactiveFormExample {
  protected readonly config: PixelQueryBuilderConfig = {
    maxDepth: 2,
    fields: {
      region: {
        name: 'Region',
        type: 'category',
        icon: 'public',
        options: [
          { name: 'USA', value: 'usa' },
          { name: 'EMEA', value: 'emea' },
          { name: 'APAC', value: 'apac' },
        ],
      },
      revenue: { name: 'Revenue', type: 'number', icon: 'payments' },
    },
  };

  protected readonly form = new FormGroup({
    filters: new FormControl<PixelQueryGroup | null>(createEmptyQuery('and')),
  });

  protected readonly submitted = signal('');

  protected submit(): void {
    const value = this.form.getRawValue().filters;
    if (!value) {
      return;
    }
    this.submitted.set(JSON.stringify(exportQuery(value), null, 2));
  }
}
