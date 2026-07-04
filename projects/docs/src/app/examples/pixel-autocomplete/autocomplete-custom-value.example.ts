import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-custom-value-example',
  imports: [PixelAutocompleteComponent],
  template: `
    <div class="stack">
      <pixel-autocomplete
        label="Tag (free text allowed)"
        placeholder="Type a new tag or pick one…"
        [options]="tags"
        [value]="freeTag()"
        [allowCustomValue]="true"
        helperText="Blur to commit any typed text as a custom value."
        (valueChange)="freeTag.set($event)"
      />
      <pixel-autocomplete
        label="Country (list only)"
        placeholder="Must pick from list…"
        [options]="countries"
        [value]="strictCountry()"
        [allowCustomValue]="false"
        helperText="Typed text that matches no option is discarded on blur."
        (valueChange)="strictCountry.set($event)"
      />
      <div class="output">
        <span class="output__label">Free tag value:</span>
        <code>{{ freeTag() ?? '—' }}</code>
        <span class="output__label">Country value:</span>
        <code>{{ strictCountry() ?? '—' }}</code>
      </div>
    </div>
  `,
  styles: `
    .stack { display: grid; gap: 1.25rem; max-width: 22rem; }
    .output {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 0.35rem 0.75rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface-container-low);
      font-size: 0.8125rem;
    }
    .output__label { color: var(--pixel-sys-outline); font-weight: 600; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteCustomValueExample {
  protected readonly freeTag = signal<unknown | null>(null);
  protected readonly strictCountry = signal<unknown | null>(null);

  protected readonly tags: readonly PixelAutocompleteOption[] = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'docs', label: 'Documentation' },
    { value: 'refactor', label: 'Refactor' },
    { value: 'perf', label: 'Performance' },
  ];

  protected readonly countries: readonly PixelAutocompleteOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'in', label: 'India' },
  ];
}
