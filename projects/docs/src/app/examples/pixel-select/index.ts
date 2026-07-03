import { createDocExample } from '../../shared/example-source.util';
import { SelectSkeletonExample } from './select-skeleton.example';
import { SelectAsyncSearchExample } from './select-async-search.example';
import { SelectAvatarsExample } from './select-avatars.example';
import { SelectBasicExample } from './select-basic.example';
import { SelectInfiniteScrollExample } from './select-infinite-scroll.example';
import { SelectKeyboardEventsExample } from './select-keyboard-events.example';
import { SelectLabelOnlyExample } from './select-label-only.example';
import { SelectMultiSizesExample } from './select-multi-sizes.example';
import { SelectMultipleExample } from './select-multiple.example';
import { SelectOverflowTooltipsExample } from './select-overflow-tooltips.example';
import { SelectReactiveFormExample } from './select-reactive-form.example';
import { SelectSearchableExample } from './select-searchable.example';
import { SelectSelectedCountExample } from './select-selected-count.example';
import { SelectSizesExample } from './select-sizes.example';
import { SelectStatesExample } from './select-states.example';
import { SelectTemplateFormExample } from './select-template-form.example';

const SELECT_IMPORTS = ['PixelSelectComponent'] as const;

export const SELECT_EXAMPLES = [
createDocExample({
    id: 'basic',
    title: 'Single select',
    category: 'Setup',
    description: 'Flat options with controlled value and valueChange.',
    component: SelectBasicExample,
    imports: [...SELECT_IMPORTS],
    html: `<pixel-select
  label="Country"
  [options]="countries"
  [value]="country()"
  helperText="Single select closes on choose."
  (valueChange)="country.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-basic-example',
  standalone: true,
  imports: [PixelSelectComponent],
  templateUrl: './select-basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectBasicExample {
  protected readonly country = signal<unknown | null>(3);
  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'multiple',
    title: 'Multiple selection',
    category: 'Behavior',
    description: 'Chip tags or selected-count trigger text in multi mode.',
    component: SelectMultipleExample,
    imports: [...SELECT_IMPORTS],
    html: `<pixel-select
  label="Regions"
  mode="multiple"
  [options]="countries"
  [value]="selected()"
  [showTags]="true"
  (valueChange)="setSelected($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-multiple-example',
  standalone: true,
  imports: [PixelSelectComponent],
  templateUrl: './select-multiple.example.html',
  styleUrl: './select-multiple.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectMultipleExample {
  protected readonly selected = signal<unknown[]>([2, 3]);
  // …countries array and setSelected helper
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 22rem;
}`,
  }),
createDocExample({
    id: 'searchable',
    title: 'Searchable dropdown',
    category: 'Behavior',
    description: 'Client-side filtering with a panel search input.',
    component: SelectSearchableExample,
    imports: [...SELECT_IMPORTS],
    html: `<pixel-select
  label="Department"
  [searchable]="true"
  [options]="departments"
  [value]="department()"
  (valueChange)="department.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-searchable-example',
  standalone: true,
  imports: [PixelSelectComponent],
  templateUrl: './select-searchable.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSearchableExample {
  protected readonly department = signal<unknown | null>(2);
  // …departments array
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'reactive-form',
    title: 'Reactive form',
    category: 'Forms',
    description: 'Required validation with validationMessages after the panel closes.',
    component: SelectReactiveFormExample,
    imports: [...SELECT_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-select
  label="Country (required)"
  [options]="countries"
  [required]="true"
  [formControl]="countryControl"
  [validationMessages]="validationMessages"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PixelSelectComponent,
  PixelSelectOption,
  PixelSelectValidationMessages,
} from 'pixel-ui';

@Component({
  selector: 'docs-select-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelSelectComponent],
  templateUrl: './select-reactive-form.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectReactiveFormExample {
  protected readonly countryControl = new FormControl<unknown | null>(3, {
    validators: [Validators.required],
  });
  // …validationMessages and countries
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'label-only',
    title: 'Label-only options',
    category: 'Layout',
    description: 'Searchable single and multi selects with flat text options.',
    component: SelectLabelOnlyExample,
    imports: [...SELECT_IMPORTS],
    html: `<div class="stack">
  <pixel-select
    [searchable]="true"
    label="Department"
    [options]="options"
    [value]="single()"
    (valueChange)="single.set($event)"
  />
  <pixel-select
    [searchable]="true"
    [showSelectAll]="true"
    label="Assignees"
    mode="multiple"
    [options]="options"
    [value]="multi()"
    [showTags]="true"
    (valueChange)="setMulti($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-label-only-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <div class="stack">
      <pixel-select
        [searchable]="true"
        label="Department"
        [options]="options"
        [value]="single()"
        (valueChange)="single.set($event)"
      />
      <pixel-select
        [searchable]="true"
        [showSelectAll]="true"
        label="Assignees"
        mode="multiple"
        [options]="options"
        [value]="multi()"
        [showTags]="true"
        (valueChange)="setMulti($event)"
      />
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectLabelOnlyExample {
  protected readonly single = signal<unknown | null>(2);
  protected readonly multi = signal<unknown[]>([2, 3]);

  protected readonly options: readonly PixelSelectOption[] = [
    { value: 1, label: 'Engineering' },
    { value: 2, label: 'Design' },
    { value: 3, label: 'Product' },
    { value: 4, label: 'Marketing' },
    { value: 5, label: 'Support' },
    { value: 6, label: 'Operations' },
  ];

  protected setMulti(value: unknown): void {
    this.multi.set(Array.isArray(value) ? value : []);
  }
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 22rem;
}`,
  }),
  createDocExample({
    id: 'avatars',
    title: 'Avatars and groups',
    category: 'Layout',
    description: 'Options with images, avatar text, subtitles, and grouped sections.',
    component: SelectAvatarsExample,
    imports: [...SELECT_IMPORTS],
    html: `<div class="stack">
  <pixel-select
    [searchable]="true"
    label="Reviewer (single)"
    [options]="users"
    [grouped]="true"
    [value]="reviewer()"
    (valueChange)="reviewer.set($event)"
  />
  <pixel-select
    [searchable]="true"
    [showSelectAll]="true"
    label="Assignees (multiple)"
    mode="multiple"
    [options]="users"
    [grouped]="true"
    [value]="assignees()"
    [showTags]="true"
    (valueChange)="setAssignees($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-avatars-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <div class="stack">
      <pixel-select
        [searchable]="true"
        label="Reviewer (single)"
        [options]="users"
        [grouped]="true"
        [value]="reviewer()"
        (valueChange)="reviewer.set($event)"
      />
      <pixel-select
        [searchable]="true"
        [showSelectAll]="true"
        label="Assignees (multiple)"
        mode="multiple"
        [options]="users"
        [grouped]="true"
        [value]="assignees()"
        [showTags]="true"
        (valueChange)="setAssignees($event)"
      />
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAvatarsExample {
  protected readonly reviewer = signal<unknown | null>('sam');
  protected readonly assignees = signal<unknown[]>(['sam', 'maya', 'infra']);

  protected readonly users: readonly PixelSelectOption[] = [
    {
      value: 'sam',
      label: 'Sam Wilson',
      subtitle: 'Design',
      meta: 'Online',
      imageSrc: 'https://i.pravatar.cc/40?img=12',
      icon: 'person',
      group: 'People',
    },
    {
      value: 'maya',
      label: 'Maya Chen',
      subtitle: 'Engineering',
      meta: 'Away',
      imageSrc: 'https://i.pravatar.cc/40?img=32',
      icon: 'person',
      group: 'People',
    },
    {
      value: 'infra',
      label: 'Infra Team',
      subtitle: 'Shared ownership',
      meta: 'Group',
      avatarText: 'IT',
      icon: 'group',
      group: 'Teams',
    },
    {
      value: 'qa',
      label: 'QA Guild',
      subtitle: 'Release quality',
      meta: 'Group',
      avatarText: 'QA',
      icon: 'groups',
      group: 'Teams',
    },
  ];

  protected setAssignees(value: unknown): void {
    this.assignees.set(Array.isArray(value) ? value : []);
  }
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 22rem;
}`,
  }),
  createDocExample({
    id: 'overflow-tooltips',
    title: 'Overflow tooltips',
    category: 'Behavior',
    description: 'Long labels and subtitles truncate with tooltips in a narrow trigger.',
    component: SelectOverflowTooltipsExample,
    imports: [...SELECT_IMPORTS],
    html: `<div class="narrow">
  <pixel-select
    [searchable]="true"
    label="Workspace"
    panelWidth="match-trigger"
    [options]="options"
    [value]="value()"
    (valueChange)="value.set($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-overflow-tooltips-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <div class="narrow">
      <pixel-select
        [searchable]="true"
        label="Workspace"
        panelWidth="match-trigger"
        [options]="options"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
    </div>
  \`,
  styles: \`
    .narrow {
      max-width: 14rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectOverflowTooltipsExample {
  protected readonly value = signal<unknown | null>(1);

  protected readonly options: readonly PixelSelectOption[] = [
    {
      value: 1,
      label: 'Quarterly revenue reconciliation and forecasting workspace (EMEA)',
      subtitle: 'Owned by the Financial Planning & Analysis cross-functional guild',
      icon: 'insights',
    },
    {
      value: 2,
      label: 'Customer onboarding automation pipeline — North America region',
      subtitle: 'Lifecycle marketing, growth, and data-engineering collaboration',
      icon: 'rocket_launch',
    },
    {
      value: 3,
      label: 'Infrastructure reliability and incident-response coordination board',
      subtitle: 'Platform SRE, on-call rotations, and postmortem tracking',
      icon: 'shield',
    },
    { value: 4, label: 'Short label', subtitle: 'Fits without truncation', icon: 'check_circle' },
  ];
}`,
    scss: `.narrow {
  max-width: 14rem;
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Select density tokens shown alongside reference inputs at each size.',
    component: SelectSizesExample,
    imports: [...SELECT_IMPORTS, 'PixelInputComponent'],
    html: `<div class="stack">
  @for (size of sizes; track size) {
    <div class="row">
      <pixel-select
        [label]="'Select · ' + size.toUpperCase()"
        [size]="size"
        [options]="countries"
        [value]="$index + 1"
      />
      <pixel-input
        [label]="'Input · ' + size.toUpperCase()"
        [size]="size"
        [value]="'Germany'"
        [helperText]="'Reference input ' + size"
      />
    </div>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-sizes-example',
  standalone: true,
  imports: [PixelSelectComponent, PixelInputComponent],
  template: \`
    <div class="stack">
      @for (size of sizes; track size) {
        <div class="row">
          <pixel-select
            [label]="'Select · ' + size.toUpperCase()"
            [size]="size"
            [options]="countries"
            [value]="$index + 1"
          />
          <pixel-input
            [label]="'Input · ' + size.toUpperCase()"
            [size]="size"
            [value]="'Germany'"
            [helperText]="'Reference input ' + size"
          />
        </div>
      }
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 36rem;
    }

    .row {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSizesExample {
  protected readonly sizes = ['xs', 'sm', 'md', 'lg'] as const;

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 36rem;
}

.row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
  align-items: start;
}`,
  }),
  createDocExample({
    id: 'multi-sizes',
    title: 'Multi sizes',
    category: 'Sizes',
    description: 'Multi-select chip density at xs, sm, md, and lg.',
    component: SelectMultiSizesExample,
    imports: [...SELECT_IMPORTS, 'PixelInputComponent'],
    html: `<div class="stack">
  @for (entry of sizeRows; track entry.size) {
    <div class="row">
      <pixel-select
        [label]="'Multi · ' + entry.size.toUpperCase()"
        [size]="entry.size"
        mode="multiple"
        [options]="countries"
        [value]="entry.value()"
        [showTags]="true"
        [helperText]="'Chips ' + entry.size + '.'"
        (valueChange)="setMulti(entry.value, $event)"
      />
      <pixel-input
        [label]="'Input · ' + entry.size.toUpperCase()"
        [size]="entry.size"
        [value]="'Germany'"
        [helperText]="'Reference input ' + entry.size"
      />
    </div>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

interface SizeRow {
  readonly size: 'xs' | 'sm' | 'md' | 'lg';
  readonly value: WritableSignal<unknown[]>;
}

@Component({
  selector: 'docs-select-multi-sizes-example',
  standalone: true,
  imports: [PixelSelectComponent, PixelInputComponent],
  template: \`
    <div class="stack">
      @for (entry of sizeRows; track entry.size) {
        <div class="row">
          <pixel-select
            [label]="'Multi · ' + entry.size.toUpperCase()"
            [size]="entry.size"
            mode="multiple"
            [options]="countries"
            [value]="entry.value()"
            [showTags]="true"
            [helperText]="'Chips ' + entry.size + '.'"
            (valueChange)="setMulti(entry.value, $event)"
          />
          <pixel-input
            [label]="'Input · ' + entry.size.toUpperCase()"
            [size]="entry.size"
            [value]="'Germany'"
            [helperText]="'Reference input ' + entry.size"
          />
        </div>
      }
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 36rem;
    }

    .row {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectMultiSizesExample {
  protected readonly sizeRows: readonly SizeRow[] = [
    { size: 'xs', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
    { size: 'sm', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
    { size: 'md', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
    { size: 'lg', value: signal<unknown[]>([1, 2, 3, 4, 5]) },
  ];

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
    { value: 5, label: 'Canada' },
    { value: 6, label: 'Brazil' },
  ];

  protected setMulti(target: WritableSignal<unknown[]>, value: unknown): void {
    target.set(Array.isArray(value) ? value : []);
  }
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 36rem;
}

.row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
  align-items: start;
}`,
  }),
  createDocExample({
    id: 'selected-count',
    title: 'Selected count',
    category: 'Behavior',
    description: 'Multi mode with showSelectedCount instead of chip tags.',
    component: SelectSelectedCountExample,
    imports: [...SELECT_IMPORTS],
    html: `<pixel-select
  label="Selected count mode"
  mode="multiple"
  [options]="countries"
  [value]="selected()"
  [showSelectedCount]="true"
  [showTags]="false"
  (valueChange)="setSelected($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-selected-count-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <pixel-select
      label="Selected count mode"
      mode="multiple"
      [options]="countries"
      [value]="selected()"
      [showSelectedCount]="true"
      [showTags]="false"
      (valueChange)="setSelected($event)"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSelectedCountExample {
  protected readonly selected = signal<unknown[]>([2, 4, 6]);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
    { value: 5, label: 'Canada' },
    { value: 6, label: 'Brazil' },
  ];

  protected setSelected(value: unknown): void {
    this.selected.set(Array.isArray(value) ? value : []);
  }
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'async-search',
    title: 'Async search',
    category: 'Advanced',
    description: 'Client-side filtering and debounced serverSearch with loading state.',
    component: SelectAsyncSearchExample,
    imports: [...SELECT_IMPORTS],
    html: `<div class="stack">
  <pixel-select
    label="Searchable dropdown"
    [options]="countries"
    [searchable]="true"
    [grouped]="true"
    helperText="Client-side filtering with highlighted match."
  />
  <pixel-select
    label="Async server search"
    [options]="serverOptions()"
    [value]="asyncValue()"
    [searchable]="true"
    [serverSearch]="true"
    [searchDebounceMs]="250"
    [loading]="serverLoading()"
    [grouped]="true"
    helperText="Debounced searchChange for server calls."
    (searchChange)="onServerSearch($event)"
    (valueChange)="asyncValue.set($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-async-search-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <div class="stack">
      <pixel-select
        label="Searchable dropdown"
        [options]="countries"
        [searchable]="true"
        [grouped]="true"
        helperText="Client-side filtering with highlighted match."
      />
      <pixel-select
        label="Async server search"
        [options]="serverOptions()"
        [value]="asyncValue()"
        [searchable]="true"
        [serverSearch]="true"
        [searchDebounceMs]="250"
        [loading]="serverLoading()"
        [grouped]="true"
        helperText="Debounced searchChange for server calls."
        (searchChange)="onServerSearch($event)"
        (valueChange)="asyncValue.set($event)"
      />
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAsyncSearchExample {
  protected readonly asyncValue = signal<unknown | null>(null);
  protected readonly serverLoading = signal(false);

  protected readonly allUsers: readonly PixelSelectOption[] = [
    {
      value: 'sam',
      label: 'Sam Wilson',
      subtitle: 'Design',
      imageSrc: 'https://i.pravatar.cc/40?img=12',
      group: 'People',
    },
    {
      value: 'maya',
      label: 'Maya Chen',
      subtitle: 'Engineering',
      imageSrc: 'https://i.pravatar.cc/40?img=32',
      group: 'People',
    },
    {
      value: 'infra',
      label: 'Infra Team',
      subtitle: 'Shared ownership',
      avatarText: 'IT',
      group: 'Teams',
    },
  ];

  protected readonly serverOptions = signal<readonly PixelSelectOption[]>(this.allUsers);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India', subtitle: 'Asia', group: 'Asia' },
    { value: 2, label: 'Japan', subtitle: 'Asia', group: 'Asia' },
    { value: 3, label: 'Germany', subtitle: 'Europe', group: 'Europe' },
    { value: 4, label: 'France', subtitle: 'Europe', group: 'Europe' },
  ];

  protected onServerSearch(query: string): void {
    this.serverLoading.set(true);
    window.setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        this.serverOptions.set(this.allUsers);
      } else {
        this.serverOptions.set(
          this.allUsers.filter((item) =>
            \`\${item.label} \${item.subtitle ?? ''}\`.toLowerCase().includes(q),
          ),
        );
      }
      this.serverLoading.set(false);
    }, 500);
  }
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 22rem;
}`,
  }),
  createDocExample({
    id: 'infinite-scroll',
    title: 'Infinite scroll',
    category: 'Advanced',
    description: 'Paged options with loadMore emitted near the panel end.',
    component: SelectInfiniteScrollExample,
    imports: [...SELECT_IMPORTS],
    html: `<pixel-select
  label="Infinite list"
  mode="multiple"
  [options]="pagedOptions()"
  [value]="selected()"
  [searchable]="true"
  [infiniteScroll]="true"
  [hasMore]="hasMore()"
  [loadingMore]="loadingMore()"
  [showSelectAll]="true"
  helperText="IntersectionObserver emits loadMore near panel end."
  (loadMore)="onLoadMore()"
  (valueChange)="setSelected($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

function makePage(page: number, size: number): PixelSelectOption[] {
  const start = (page - 1) * size;
  return Array.from({ length: size }, (_, index) => {
    const id = start + index + 1;
    return {
      value: id,
      label: \`Option \${id}\`,
      subtitle: \`Server page \${page}\`,
      meta: \`#\${id}\`,
      avatarText: \`O\${id}\`,
      group: id % 2 === 0 ? 'Even' : 'Odd',
    };
  });
}

@Component({
  selector: 'docs-select-infinite-scroll-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <pixel-select
      label="Infinite list"
      mode="multiple"
      [options]="pagedOptions()"
      [value]="selected()"
      [searchable]="true"
      [infiniteScroll]="true"
      [hasMore]="hasMore()"
      [loadingMore]="loadingMore()"
      [showSelectAll]="true"
      helperText="IntersectionObserver emits loadMore near panel end."
      (loadMore)="onLoadMore()"
      (valueChange)="setSelected($event)"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectInfiniteScrollExample {
  protected readonly selected = signal<unknown[]>([]);
  protected readonly page = signal(1);
  protected readonly loadingMore = signal(false);
  protected readonly pagedOptions = signal<readonly PixelSelectOption[]>(makePage(1, 20));
  protected readonly hasMore = computed(() => this.page() < 5);

  protected setSelected(value: unknown): void {
    this.selected.set(Array.isArray(value) ? value : []);
  }

  protected onLoadMore(): void {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }
    this.loadingMore.set(true);
    const nextPage = this.page() + 1;
    window.setTimeout(() => {
      this.pagedOptions.update((current) => [...current, ...makePage(nextPage, 20)]);
      this.page.set(nextPage);
      this.loadingMore.set(false);
    }, 500);
  }
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'Disabled, readonly, error, loading, and floating label modes.',
    component: SelectStatesExample,
    imports: [...SELECT_IMPORTS],
    html: `<div class="grid">
  <pixel-select
    label="Disabled"
    [options]="countries"
    [value]="1"
    [disabled]="true"
    helperText="Disabled prevents interaction."
  />
  <pixel-select
    label="Readonly"
    [options]="countries"
    [value]="2"
    [readonly]="true"
    helperText="Readonly keeps focus but blocks changes."
  />
  <pixel-select
    label="Error"
    [options]="countries"
    state="error"
    helperText="Error visual state token."
  />
  <pixel-select
    label="Loading"
    [options]="countries"
    [loading]="true"
    helperText="Async loading uses the loading visual state."
  />
  <pixel-select
    label="Floating label"
    labelPosition="floating"
    [options]="countries"
    [value]="floating()"
    [required]="true"
    helperText="Floating label mode with required indicator."
    (valueChange)="floating.set($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-states-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <div class="grid">
      <pixel-select
        label="Disabled"
        [options]="countries"
        [value]="1"
        [disabled]="true"
        helperText="Disabled prevents interaction."
      />
      <pixel-select
        label="Readonly"
        [options]="countries"
        [value]="2"
        [readonly]="true"
        helperText="Readonly keeps focus but blocks changes."
      />
      <pixel-select
        label="Error"
        [options]="countries"
        state="error"
        helperText="Error visual state token."
      />
      <pixel-select
        label="Loading"
        [options]="countries"
        [loading]="true"
        helperText="Async loading uses the loading visual state."
      />
      <pixel-select
        label="Floating label"
        labelPosition="floating"
        [options]="countries"
        [value]="floating()"
        [required]="true"
        helperText="Floating label mode with required indicator."
        (valueChange)="floating.set($event)"
      />
    </div>
  \`,
  styles: \`
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      max-width: 36rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectStatesExample {
  protected readonly floating = signal<unknown | null>(null);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  max-width: 36rem;
}`,
  }),
  createDocExample({
    id: 'keyboard-events',
    title: 'Keyboard events',
    category: 'Accessibility',
    description: 'Arrow keys, Enter, Escape, and focus/open/selection outputs.',
    component: SelectKeyboardEventsExample,
    imports: [...SELECT_IMPORTS],
    html: `<div class="split">
  <pixel-select
    label="Keyboard navigation"
    [options]="countries"
    [searchable]="true"
    helperText="Use arrows, enter, escape, and backspace."
    (focusChange)="log('Focus changed: ' + $event)"
    (blurChange)="log('Blur changed: ' + $event)"
    (openChange)="log('Open changed: ' + $event)"
    (selectionChange)="log('Selection changed')"
  />
  <aside class="log" aria-label="Event log">
    <p class="log-title">Events</p>
    @for (entry of eventLog(); track $index) {
      <p>{{ entry }}</p>
    }
  </aside>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-keyboard-events-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: \`
    <div class="split">
      <pixel-select
        label="Keyboard navigation"
        [options]="countries"
        [searchable]="true"
        helperText="Use arrows, enter, escape, and backspace."
        (focusChange)="log('Focus changed: ' + $event)"
        (blurChange)="log('Blur changed: ' + $event)"
        (openChange)="log('Open changed: ' + $event)"
        (selectionChange)="log('Selection changed')"
      />
      <aside class="log" aria-label="Event log">
        <p class="log-title">Events</p>
        @for (entry of eventLog(); track $index) {
          <p>{{ entry }}</p>
        }
      </aside>
    </div>
  \`,
  styles: \`
    .split {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 14rem);
      align-items: start;
      max-width: 40rem;
    }

    .log {
      margin: 0;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--pixel-sys-surface-container) 80%, transparent);
      font-size: 0.8125rem;
    }

    .log-title {
      margin: 0 0 0.5rem;
      font-weight: 600;
    }

    .log p {
      margin: 0.25rem 0;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectKeyboardEventsExample {
  protected readonly eventLog = signal<string[]>([
    'Focus a select and use Arrow keys + Enter to navigate.',
  ]);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];

  protected log(message: string): void {
    this.eventLog.update((entries) => [message, ...entries].slice(0, 8));
  }
}`,
    scss: `.split {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 14rem);
  align-items: start;
  max-width: 40rem;
}

.log {
  margin: 0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--pixel-sys-surface-container) 80%, transparent);
  font-size: 0.8125rem;
}

.log-title {
  margin: 0 0 0.5rem;
  font-weight: 600;
}

.log p {
  margin: 0.25rem 0;
}`,
  }),
  createDocExample({
    id: 'template-form',
    title: 'Template-driven form',
    category: 'Forms',
    description: 'ngModel with required validation on single and multi selects.',
    component: SelectTemplateFormExample,
    imports: [...SELECT_IMPORTS, 'FormsModule'],
    html: `<form class="stack" #tplForm="ngForm" (ngSubmit)="onSubmit(tplForm)">
  <pixel-select
    label="Country (required)"
    name="country"
    required
    [(ngModel)]="country"
    [options]="countries"
    helperText="Clear to test required + validationMessages after the panel closes."
    [validationMessages]="countryMessages"
  />
  <pixel-select
    label="Tags (required multi)"
    name="tags"
    mode="multiple"
    required
    [(ngModel)]="tags"
    [options]="countries"
    [showSelectAll]="true"
    [showTags]="true"
    helperText="Clear all to test required."
    [validationMessages]="tagsMessages"
  />
  <pixel-select
    label="Region (disabled field)"
    name="region"
    [(ngModel)]="regionLocked"
    [disabled]="true"
    [options]="countries"
    helperText="Uses [disabled] on the field."
  />
  <p class="meta">Form valid: {{ tplForm.valid }}</p>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PixelSelectComponent, PixelSelectOption, PixelSelectValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-select-template-form-example',
  standalone: true,
  imports: [FormsModule, PixelSelectComponent],
  template: \`
    <form class="stack" #tplForm="ngForm" (ngSubmit)="onSubmit(tplForm)">
      <pixel-select
        label="Country (required)"
        name="country"
        required
        [(ngModel)]="country"
        [options]="countries"
        helperText="Clear to test required + validationMessages after the panel closes."
        [validationMessages]="countryMessages"
      />
      <pixel-select
        label="Tags (required multi)"
        name="tags"
        mode="multiple"
        required
        [(ngModel)]="tags"
        [options]="countries"
        [showSelectAll]="true"
        [showTags]="true"
        helperText="Clear all to test required."
        [validationMessages]="tagsMessages"
      />
      <pixel-select
        label="Region (disabled field)"
        name="region"
        [(ngModel)]="regionLocked"
        [disabled]="true"
        [options]="countries"
        helperText="Uses [disabled] on the field."
      />
      <p class="meta">Form valid: {{ tplForm.valid }}</p>
    </form>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }

    .meta {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectTemplateFormExample {
  protected country: unknown | null = 3;
  protected tags: unknown[] = [2, 3];
  protected regionLocked: unknown | null = 1;
  protected readonly serverLoading = signal(false);

  protected readonly countryMessages: PixelSelectValidationMessages = {
    required: 'Pick a country.',
  };

  protected readonly tagsMessages: PixelSelectValidationMessages = {
    required: 'Select at least one tag.',
  };

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];

  protected onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
  }
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 22rem;
}

.meta {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show shimmer placeholders while option lists or initial selections are being fetched.',
    component: SelectSkeletonExample,
    imports: ['PixelSelectComponent'],
    html: `<pixel-select label="Country" [options]="[]" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent } from 'pixel-ui';

@Component({ /* … */ })
export class SelectSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
