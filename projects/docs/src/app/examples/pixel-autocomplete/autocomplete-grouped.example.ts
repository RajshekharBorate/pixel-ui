import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-grouped-example',
  imports: [PixelAutocompleteComponent],
  template: `
    <pixel-autocomplete
      label="Technology"
      placeholder="Search frameworks…"
      [options]="technologies"
      [value]="tech()"
      [grouped]="true"
      helperText="Options are grouped by category."
      (valueChange)="tech.set($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteGroupedExample {
  protected readonly tech = signal<unknown | null>(null);

  protected readonly technologies: readonly PixelAutocompleteOption[] = [
    { value: 'angular', label: 'Angular', group: 'Frontend' },
    { value: 'react', label: 'React', group: 'Frontend' },
    { value: 'vue', label: 'Vue', group: 'Frontend' },
    { value: 'svelte', label: 'Svelte', group: 'Frontend' },
    { value: 'node', label: 'Node.js', group: 'Backend' },
    { value: 'django', label: 'Django', group: 'Backend' },
    { value: 'rails', label: 'Rails', group: 'Backend' },
    { value: 'spring', label: 'Spring Boot', group: 'Backend' },
    { value: 'postgres', label: 'PostgreSQL', group: 'Database' },
    { value: 'mongo', label: 'MongoDB', group: 'Database' },
    { value: 'redis', label: 'Redis', group: 'Database' },
  ];
}
