import { createDocExample } from '../../shared/example-source.util';
import { AutocompleteBasicExample } from './autocomplete-basic.example';
import { AutocompleteCustomValueExample } from './autocomplete-custom-value.example';
import { AutocompleteDisabledReadonlyExample } from './autocomplete-disabled-readonly.example';
import { AutocompleteGroupedExample } from './autocomplete-grouped.example';
import { AutocompleteLabelPositionsExample } from './autocomplete-label-positions.example';
import { AutocompleteReactiveFormExample } from './autocomplete-reactive-form.example';
import { AutocompleteRichOptionsExample } from './autocomplete-rich-options.example';
import { AutocompleteServerSearchExample } from './autocomplete-server-search.example';
import { AutocompleteSizesExample } from './autocomplete-sizes.example';
import { AutocompleteSkeletonExample } from './autocomplete-skeleton.example';

const AUTOCOMPLETE_IMPORTS = ['PixelAutocompleteComponent'] as const;

export const AUTOCOMPLETE_EXAMPLES = [
  // ── Setup ──────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'basic',
    title: 'Basic autocomplete',
    category: 'Setup',
    description: 'Flat options with client-side filtering, controlled value, and valueChange binding.',
    component: AutocompleteBasicExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteOption'],
    html: `<pixel-autocomplete
  label="City"
  placeholder="Search cities…"
  [options]="cities"
  [value]="city()"
  helperText="Start typing to filter. Press Esc to close."
  (valueChange)="city.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-basic-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteBasicExample {
  protected readonly city = signal<unknown | null>(null);

  protected readonly cities: readonly PixelAutocompleteOption[] = [
    { value: 'nyc', label: 'New York' },
    { value: 'sfo', label: 'San Francisco' },
    { value: 'lax', label: 'Los Angeles' },
    { value: 'chi', label: 'Chicago' },
    { value: 'hou', label: 'Houston' },
    { value: 'phx', label: 'Phoenix' },
    { value: 'phi', label: 'Philadelphia' },
    { value: 'sat', label: 'San Antonio' },
    { value: 'sd',  label: 'San Diego' },
    { value: 'dal', label: 'Dallas' },
  ];
}`,
    scss: `/* No styles required for this example */`,
  }),

  createDocExample({
    id: 'grouped',
    title: 'Grouped options',
    category: 'Setup',
    description: 'Set grouped=true and add a group key to each option to render section headers in the panel.',
    component: AutocompleteGroupedExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteOption'],
    html: `<pixel-autocomplete
  label="Technology"
  placeholder="Search frameworks…"
  [options]="technologies"
  [value]="tech()"
  [grouped]="true"
  helperText="Options are grouped by category."
  (valueChange)="tech.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-grouped-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-grouped.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteGroupedExample {
  protected readonly tech = signal<unknown | null>(null);

  protected readonly technologies: readonly PixelAutocompleteOption[] = [
    { value: 'angular', label: 'Angular',     group: 'Frontend' },
    { value: 'react',   label: 'React',       group: 'Frontend' },
    { value: 'vue',     label: 'Vue',         group: 'Frontend' },
    { value: 'svelte',  label: 'Svelte',      group: 'Frontend' },
    { value: 'node',    label: 'Node.js',     group: 'Backend' },
    { value: 'django',  label: 'Django',      group: 'Backend' },
    { value: 'rails',   label: 'Rails',       group: 'Backend' },
    { value: 'spring',  label: 'Spring Boot', group: 'Backend' },
    { value: 'postgres',label: 'PostgreSQL',  group: 'Database' },
    { value: 'mongo',   label: 'MongoDB',     group: 'Database' },
    { value: 'redis',   label: 'Redis',       group: 'Database' },
  ];
}`,
    scss: `/* No styles required for this example */`,
  }),

  // ── Layout ─────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'sizes',
    title: 'Size variants',
    category: 'Layout',
    description: 'xs, sm, md, and lg densities control typography, padding, and row height uniformly.',
    component: AutocompleteSizesExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteSize'],
    html: `@for (size of sizes; track size) {
  <pixel-autocomplete
    [label]="size.toUpperCase()"
    placeholder="Search…"
    [options]="options"
    [value]="values[size]()"
    [size]="size"
    (valueChange)="values[size].set($event)"
  />
}`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption, PixelAutocompleteSize } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-sizes-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-sizes.example.html',
  styleUrl: './autocomplete-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteSizesExample {
  protected readonly sizes: readonly PixelAutocompleteSize[] = ['xs', 'sm', 'md', 'lg'];

  protected readonly values: Record<PixelAutocompleteSize, ReturnType<typeof signal<unknown | null>>> = {
    xs: signal(null), sm: signal(null), md: signal(null), lg: signal(null),
  };

  protected readonly options: readonly PixelAutocompleteOption[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'g', label: 'Gamma' },
    { value: 'd', label: 'Delta' },
  ];
}`,
    scss: `.stack { display: grid; gap: 1rem; max-width: 20rem; }`,
  }),

  createDocExample({
    id: 'label-positions',
    title: 'Label positions',
    category: 'Layout',
    description: 'top, left, floating, and hidden label layouts to suit different form densities.',
    component: AutocompleteLabelPositionsExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteLabelPosition'],
    html: `@for (pos of positions; track pos) {
  <pixel-autocomplete
    [label]="labels[pos]"
    placeholder="Search…"
    [options]="options"
    [value]="values[pos]()"
    [labelPosition]="pos"
    (valueChange)="values[pos].set($event)"
  />
}`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAutocompleteComponent,
  PixelAutocompleteLabelPosition,
  PixelAutocompleteOption,
} from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-label-positions-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-label-positions.example.html',
  styleUrl: './autocomplete-label-positions.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteLabelPositionsExample {
  protected readonly positions: readonly PixelAutocompleteLabelPosition[] = [
    'top', 'left', 'floating', 'hidden',
  ];
  protected readonly labels: Record<PixelAutocompleteLabelPosition, string> = {
    top:      'Top label',
    left:     'Left label',
    floating: 'Floating label',
    hidden:   'Hidden label (aria-label only)',
  };
  /* values: Record<PixelAutocompleteLabelPosition, Signal<unknown | null>> */
}`,
    scss: `.stack { display: grid; gap: 1.25rem; max-width: 28rem; }`,
  }),

  createDocExample({
    id: 'rich-options',
    title: 'Rich option layouts',
    category: 'Layout',
    description: 'Options support avatarText, imageSrc, icon, subtitle, and meta for richer selection panels.',
    component: AutocompleteRichOptionsExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteOption'],
    html: `<!-- Avatar initials + subtitle -->
<pixel-autocomplete
  label="Assign to"
  placeholder="Search team members…"
  [options]="members"
  [value]="member()"
  helperText="Options with avatar initials and subtitle."
  (valueChange)="member.set($event)"
/>

<!-- Material Symbols icon + subtitle -->
<pixel-autocomplete
  label="File type"
  placeholder="Search file types…"
  [options]="fileTypes"
  [value]="fileType()"
  helperText="Options with Material Symbols icons."
  (valueChange)="fileType.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-rich-options-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-rich-options.example.html',
  styleUrl: './autocomplete-rich-options.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteRichOptionsExample {
  protected readonly member   = signal<unknown | null>(null);
  protected readonly fileType = signal<unknown | null>(null);

  protected readonly members: readonly PixelAutocompleteOption[] = [
    { value: 1, label: 'Alice Johnson', subtitle: 'Engineering · Lead',    avatarText: 'AJ' },
    { value: 2, label: 'Bob Martinez',  subtitle: 'Design · Senior',       avatarText: 'BM' },
    { value: 3, label: 'Carol Smith',   subtitle: 'Product · Manager',     avatarText: 'CS' },
    { value: 4, label: 'David Kim',     subtitle: 'Engineering · Mid',     avatarText: 'DK' },
    { value: 5, label: 'Eva Patel',     subtitle: 'QA · Senior',           avatarText: 'EP' },
  ];

  protected readonly fileTypes: readonly PixelAutocompleteOption[] = [
    { value: 'pdf',   label: 'PDF Document', subtitle: '.pdf',        icon: 'picture_as_pdf' },
    { value: 'image', label: 'Image',        subtitle: '.jpg .png',   icon: 'image' },
    { value: 'video', label: 'Video',        subtitle: '.mp4 .mov',   icon: 'videocam' },
    { value: 'audio', label: 'Audio',        subtitle: '.mp3 .wav',   icon: 'audio_file' },
    { value: 'sheet', label: 'Spreadsheet',  subtitle: '.xlsx .csv',  icon: 'table_chart' },
    { value: 'code',  label: 'Source Code',  subtitle: '.ts .js .py', icon: 'code' },
  ];
}`,
    scss: `.stack { display: grid; gap: 1.25rem; max-width: 22rem; }`,
  }),

  // ── Behavior ───────────────────────────────────────────────────────────────
  createDocExample({
    id: 'server-search',
    title: 'Server-side search',
    category: 'Behavior',
    description: 'serverSearch=true skips local filtering and emits a debounced searchChange event for async queries.',
    component: AutocompleteServerSearchExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteOption'],
    html: `<pixel-autocomplete
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
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-server-search-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-server-search.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteServerSearchExample {
  protected readonly selected = signal<unknown | null>(null);
  protected readonly results  = signal<readonly PixelAutocompleteOption[]>([]);
  protected readonly loading  = signal(false);

  protected onSearch(query: string): void {
    if (!query) { this.results.set([]); return; }
    this.loading.set(true);
    // Replace with your HTTP call, e.g. this.repoService.search(query)
    myApi.searchRepos(query).subscribe(repos => {
      this.results.set(repos);
      this.loading.set(false);
    });
  }
}`,
    scss: `/* No styles required for this example */`,
  }),

  createDocExample({
    id: 'custom-value',
    title: 'Custom value vs list-only',
    category: 'Behavior',
    description: 'allowCustomValue=true commits free typed text; false discards unmatched input and reverts to the last valid option on blur.',
    component: AutocompleteCustomValueExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteOption'],
    html: `<!-- Free text allowed -->
<pixel-autocomplete
  label="Tag (free text allowed)"
  [options]="tags"
  [value]="freeTag()"
  [allowCustomValue]="true"
  helperText="Blur commits any typed text as a custom value."
  (valueChange)="freeTag.set($event)"
/>

<!-- List-only -->
<pixel-autocomplete
  label="Country (list only)"
  [options]="countries"
  [value]="strictCountry()"
  [allowCustomValue]="false"
  helperText="Typed text that matches no option is discarded on blur."
  (valueChange)="strictCountry.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-custom-value-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-custom-value.example.html',
  styleUrl: './autocomplete-custom-value.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteCustomValueExample {
  protected readonly freeTag       = signal<unknown | null>(null);
  protected readonly strictCountry = signal<unknown | null>(null);

  protected readonly tags: readonly PixelAutocompleteOption[] = [
    { value: 'bug',      label: 'Bug' },
    { value: 'feature',  label: 'Feature' },
    { value: 'docs',     label: 'Documentation' },
    { value: 'refactor', label: 'Refactor' },
    { value: 'perf',     label: 'Performance' },
  ];

  protected readonly countries: readonly PixelAutocompleteOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'in', label: 'India' },
  ];
}`,
    scss: `.stack { display: grid; gap: 1.25rem; max-width: 22rem; }`,
  }),

  // ── States ─────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'disabled-readonly',
    title: 'Disabled, readonly, and skeleton',
    category: 'States',
    description: 'disabled prevents all interaction; readonly allows focus but not edits; showSkeleton renders a loading placeholder.',
    component: AutocompleteDisabledReadonlyExample,
    imports: [...AUTOCOMPLETE_IMPORTS],
    html: `<pixel-autocomplete
  label="Disabled"
  [options]="options" [value]="'nyc'"
  [disabled]="true"
  helperText="Prevents all interaction."
/>
<pixel-autocomplete
  label="Readonly"
  [options]="options" [value]="'sfo'"
  [readonly]="true"
  helperText="Focusable but cannot be changed."
/>
<pixel-autocomplete
  label="Loading skeleton"
  [options]="[]" [value]="null"
  [showSkeleton]="true"
  helperText="Shown while options are fetching."
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-disabled-readonly-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-disabled-readonly.example.html',
  styleUrl: './autocomplete-disabled-readonly.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteDisabledReadonlyExample {
  protected readonly options: readonly PixelAutocompleteOption[] = [
    { value: 'nyc', label: 'New York' },
    { value: 'sfo', label: 'San Francisco' },
    { value: 'lax', label: 'Los Angeles' },
  ];
}`,
    scss: `.grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }`,
  }),

  // ── Loading ────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show a placeholder while options or initial data are being fetched.',
    component: AutocompleteSkeletonExample,
    imports: [...AUTOCOMPLETE_IMPORTS],
    html: `<pixel-autocomplete
  label="City"
  placeholder="Search cities…"
  [options]="[]"
  [showSkeleton]="skeleton()"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-skeleton-example',
  standalone: true,
  imports: [PixelAutocompleteComponent],
  templateUrl: './autocomplete-skeleton.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),

  // ── Forms ──────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'reactive-form',
    title: 'Reactive form integration',
    category: 'Forms',
    description: 'Bind via formControlName; validation messages surface automatically when the control is touched and invalid.',
    component: AutocompleteReactiveFormExample,
    imports: [...AUTOCOMPLETE_IMPORTS, 'PixelAutocompleteValidationMessages', 'PixelButtonComponent'],
    html: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <pixel-autocomplete
    label="Country (required)"
    placeholder="Search countries…"
    [options]="countries"
    [required]="true"
    [allowCustomValue]="false"
    formControlName="country"
    [validationMessages]="messages"
    helperText="Select a country from the list."
  />
  <pixel-autocomplete
    label="City"
    placeholder="Search cities…"
    [options]="cities"
    formControlName="city"
    helperText="Optional — free text allowed."
  />
  <div class="actions">
    <pixel-button type="submit" appearance="solid" [disabled]="form.invalid">Submit</pixel-button>
    <pixel-button type="button" appearance="outline" (click)="onReset()">Reset</pixel-button>
  </div>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PixelAutocompleteComponent,
  PixelAutocompleteOption,
  PixelAutocompleteValidationMessages,
  PixelButtonComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelAutocompleteComponent, PixelButtonComponent],
  templateUrl: './autocomplete-reactive-form.example.html',
  styleUrl: './autocomplete-reactive-form.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteReactiveFormExample {
  protected submitted = false;

  protected readonly form = new FormGroup({
    country: new FormControl<unknown | null>(null, Validators.required),
    city:    new FormControl<unknown | null>(null),
  });

  protected readonly messages: PixelAutocompleteValidationMessages = {
    required: 'Please select a country.',
  };

  protected readonly countries: readonly PixelAutocompleteOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'in', label: 'India' },
    { value: 'jp', label: 'Japan' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
  ];

  protected readonly cities: readonly PixelAutocompleteOption[] = [
    { value: 'nyc', label: 'New York' },
    { value: 'lon', label: 'London' },
    { value: 'ber', label: 'Berlin' },
    { value: 'par', label: 'Paris' },
    { value: 'mum', label: 'Mumbai' },
    { value: 'tok', label: 'Tokyo' },
    { value: 'tor', label: 'Toronto' },
    { value: 'syd', label: 'Sydney' },
  ];

  protected onSubmit(): void {
    if (this.form.valid) this.submitted = true;
  }

  protected onReset(): void {
    this.form.reset();
    this.submitted = false;
  }
}`,
    scss: `.form { display: grid; gap: 1.25rem; max-width: 22rem; }
.actions { display: flex; gap: 0.75rem; }`,
  }),
] as const;
