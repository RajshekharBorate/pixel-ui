import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

const ALL_REPOS: readonly PixelAutocompleteOption[] = [
  { value: 1, label: 'angular/angular', subtitle: 'TypeScript · 96k stars' },
  { value: 2, label: 'angular/angular-cli', subtitle: 'TypeScript · 27k stars' },
  { value: 3, label: 'facebook/react', subtitle: 'JavaScript · 224k stars' },
  { value: 4, label: 'vuejs/vue', subtitle: 'TypeScript · 207k stars' },
  { value: 5, label: 'sveltejs/svelte', subtitle: 'TypeScript · 78k stars' },
  { value: 6, label: 'microsoft/typescript', subtitle: 'TypeScript · 100k stars' },
  { value: 7, label: 'nodejs/node', subtitle: 'JavaScript · 106k stars' },
  { value: 8, label: 'denoland/deno', subtitle: 'Rust · 94k stars' },
];

@Component({
  selector: 'docs-autocomplete-server-search-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  template: `
    <pixel-autocomplete
      label="GitHub Repository"
      placeholder="Type to search repos…"
      [options]="results()"
      [value]="selected()"
      [serverSearch]="true"
      [loading]="loading()"
      [searchDebounceMs]="350"
      [minChars]="1"
      [allowCustomValue]="false"
      emptyStateMessage="Type at least 1 character."
      noResultMessage="No repositories found."
      helperText="Debounced query — results arrive after 350 ms."
      (searchChange)="onSearch($event)"
      (valueChange)="selected.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteServerSearchExample {
  protected readonly selected = signal<unknown | null>(null);
  protected readonly results = signal<readonly PixelAutocompleteOption[]>([]);
  protected readonly loading = signal(false);

  private simulateTimeout: ReturnType<typeof setTimeout> | null = null;

  protected onSearch(query: string): void {
    if (this.simulateTimeout) clearTimeout(this.simulateTimeout);
    if (!query) {
      this.results.set([]);
      return;
    }
    this.loading.set(true);
    this.simulateTimeout = setTimeout(() => {
      const q = query.toLowerCase();
      this.results.set(ALL_REPOS.filter((r) => r.label.toLowerCase().includes(q)));
      this.loading.set(false);
    }, 500);
  }
}
