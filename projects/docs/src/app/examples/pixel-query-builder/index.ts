import { createDocExample } from '../../shared/example-source.util';
import { QueryBuilderBasicExample } from './query-builder-basic.example';
import { QueryBuilderDisabledReadonlyExample } from './query-builder-disabled-readonly.example';
import { QueryBuilderEcommerceExample } from './query-builder-ecommerce.example';
import { QueryBuilderImportExportExample } from './query-builder-import-export.example';
import { QueryBuilderNestedExample } from './query-builder-nested.example';
import { QueryBuilderReactiveFormExample } from './query-builder-reactive-form.example';
import { QueryBuilderRunSummaryExample } from './query-builder-run-summary.example';
import { QueryBuilderSizeVariantsExample } from './query-builder-size-variants.example';

const QUERY_BUILDER_IMPORTS = [
  'PixelQueryBuilderComponent',
  'PixelQueryBuilderConfig',
  'createEmptyQuery',
  'nativeDateAdapterProviders',
] as const;

export const QUERY_BUILDER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic query builder',
    category: 'Setup',
    description: 'Configure fields and bind query with two-way signal binding.',
    component: QueryBuilderBasicExample,
    imports: [...QUERY_BUILDER_IMPORTS],
    html: `<pixel-query-builder
  [config]="config"
  [(query)]="query"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  createEmptyQuery,
  nativeDateAdapterProviders,
  PixelQueryBuilderComponent,
  PixelQueryBuilderConfig,
  PixelQueryGroup,
} from 'pixel-ui';

@Component({
  selector: 'docs-query-builder-basic-example',
  imports: [PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderBasicExample {
  protected readonly config: PixelQueryBuilderConfig = {
    maxDepth: 2,
    fields: {
      name: { name: 'Name', type: 'string', icon: 'badge' },
      age: { name: 'Age', type: 'number', icon: 'numbers' },
      active: { name: 'Active', type: 'boolean', icon: 'toggle_on' },
    },
  };

  protected readonly query = signal<PixelQueryGroup>(createEmptyQuery('and'));
}`,
  }),
  createDocExample({
    id: 'nested',
    title: 'Nested rulesets',
    category: 'Behavior',
    description: 'Compose AND/OR groups with rules for amounts, stages, and date ranges.',
    component: QueryBuilderNestedExample,
    imports: [...QUERY_BUILDER_IMPORTS, 'createQueryRule', 'createQueryGroup'],
    html: `<pixel-query-builder
  [config]="config"
  [(query)]="query"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  createEmptyQuery,
  createQueryGroup,
  createQueryRule,
  nativeDateAdapterProviders,
  PixelQueryBuilderComponent,
  PixelQueryBuilderConfig,
  PixelQueryGroup,
} from 'pixel-ui';

@Component({
  selector: 'docs-query-builder-nested-example',
  imports: [PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './nested.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderNestedExample {
  protected readonly config: PixelQueryBuilderConfig = {
    maxDepth: 3,
    fields: {
      amount: { name: 'Amount', type: 'number', icon: 'payments' },
      closeDate: { name: 'Close date', type: 'date', icon: 'calendar_today' },
    },
  };

  protected readonly query = signal<PixelQueryGroup>(createSampleNestedQuery());
}`,
  }),
  createDocExample({
    id: 'reactive-form',
    title: 'Reactive forms',
    category: 'Forms',
    description: 'Implements ControlValueAccessor and Validator for formControlName binding.',
    component: QueryBuilderReactiveFormExample,
    imports: [...QUERY_BUILDER_IMPORTS, 'ReactiveFormsModule', 'exportQuery', 'PixelButtonComponent'],
    html: `<form class="form" [formGroup]="form" (ngSubmit)="submit()">
  <pixel-query-builder
    formControlName="filters"
    [config]="config"
    [required]="true"
  />
  <pixel-button appearance="solid" buttonType="submit">Run query</pixel-button>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  createEmptyQuery,
  nativeDateAdapterProviders,
  PixelQueryBuilderComponent,
  PixelQueryBuilderConfig,
  PixelQueryGroup,
} from 'pixel-ui';

@Component({
  selector: 'docs-query-builder-reactive-form-example',
  imports: [ReactiveFormsModule, PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './reactive-form.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderReactiveFormExample {
  protected readonly form = new FormGroup({
    filters: new FormControl<PixelQueryGroup | null>(createEmptyQuery('and')),
  });
}`,
  }),
  createDocExample({
    id: 'ecommerce',
    title: 'E-commerce catalog filter',
    category: 'Advanced',
    description:
      'Realistic scenario: build filters for a product catalog and apply them to a live result list.',
    component: QueryBuilderEcommerceExample,
    imports: [
      ...QUERY_BUILDER_IMPORTS,
      'exportQuery',
      'isQueryValid',
      'queryToSummary',
      'PixelButtonComponent',
    ],
    html: `<pixel-query-builder
  [config]="config"
  [(query)]="query"
  summaryLabel="Filter preview"
/>

<div class="toolbar">
  <pixel-button appearance="solid" (click)="applyFilters()">Apply filters</pixel-button>
  <span class="count">{{ matchCount() }} of {{ totalCount() }} products</span>
</div>

<ul class="catalog">
  @for (product of filteredProducts(); track product.sku) {
    <li>{{ product.productName }}</li>
  }
</ul>`,
    typescript: `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  exportQuery,
  isQueryValid,
  nativeDateAdapterProviders,
  PixelQueryBuilderComponent,
  PixelQueryGroup,
} from 'pixel-ui';

@Component({
  selector: 'docs-query-builder-ecommerce-example',
  imports: [PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  templateUrl: './ecommerce.example.html',
  styleUrl: './ecommerce.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderEcommerceExample {
  protected readonly query = signal<PixelQueryGroup>(createSampleQuery());
  protected readonly appliedQuery = signal<PixelQueryGroup>(createSampleQuery());

  protected readonly filteredProducts = computed(() =>
    filterCatalog(catalog, exportQuery(this.appliedQuery())),
  );

  protected applyFilters(): void {
    if (!isQueryValid(this.query(), this.config)) {
      return;
    }
    this.appliedQuery.set(structuredClone(this.query()));
  }
}`,
    scss: `.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.catalog {
  margin: 0;
  padding: 0;
  list-style: none;
}`,
  }),
  createDocExample({
    id: 'import-export',
    title: 'Import & export',
    category: 'Behavior',
    description:
      'Serialize the query to JSON for copy, download, or paste/file import using parseQueryExportJson and importQuery.',
    component: QueryBuilderImportExportExample,
    imports: [
      ...QUERY_BUILDER_IMPORTS,
      'exportQuery',
      'importQuery',
      'parseQueryExportJson',
      'serializeQueryExport',
      'PixelButtonComponent',
    ],
    html: `<pixel-query-builder [config]="config" [(query)]="query" />

<pixel-input multiline [rows]="6" labelPosition="hidden" label="Exported JSON" [readonly]="true" [value]="exportJson()" />
<pixel-button (click)="onApplyImport()">Import</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  exportQuery,
  importQuery,
  parseQueryExportJson,
  serializeQueryExport,
  PixelQueryBuilderComponent,
} from 'pixel-ui';

@Component({ /* … */ })
export class QueryBuilderImportExportExample {
  protected readonly exportJson = computed(() => serializeQueryExport(exportQuery(this.query()), true));
}`,
    scss: `.transfer {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'run-summary',
    title: 'Run query & summary',
    category: 'Behavior',
    description:
      'Run validates the query, exports it, and produces a human-readable summary via queryToSummary.',
    component: QueryBuilderRunSummaryExample,
    imports: [
      ...QUERY_BUILDER_IMPORTS,
      'exportQuery',
      'isQueryValid',
      'queryToSummary',
      'PixelButtonComponent',
    ],
    html: `<pixel-query-builder
  [config]="config"
  [(query)]="query"
  summaryPreview="both"
/>
<pixel-button (click)="onRunQuery()">Run Query</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { exportQuery, isQueryValid, queryToSummary, PixelQueryBuilderComponent } from 'pixel-ui';

@Component({ /* … */ })
export class QueryBuilderRunSummaryExample {
  protected onRunQuery(): void {
    this.lastRun.set({
      query: this.query(),
      export: exportQuery(this.query()),
      summary: queryToSummary(this.query(), this.config),
    });
  }
}`,
    scss: `.run {
  margin-block-start: 1.25rem;
  padding: 1rem;
  border-radius: 0.5rem;
}`,
  }),
  createDocExample({
    id: 'size-variants',
    title: 'Size variants',
    category: 'Sizes',
    description: 'size switches density between xs, sm, md (default), and lg.',
    component: QueryBuilderSizeVariantsExample,
    imports: [...QUERY_BUILDER_IMPORTS],
    html: `<pixel-query-builder
  [config]="config"
  [(query)]="query"
  [size]="builderSize()"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelQueryBuilderComponent, PixelQueryBuilderSize } from 'pixel-ui';

@Component({ /* … */ })
export class QueryBuilderSizeVariantsExample {
  protected readonly builderSize = signal<PixelQueryBuilderSize>('md');
}`,
    scss: `.controls {
  margin-block-end: 1rem;
}`,
  }),
  createDocExample({
    id: 'disabled-readonly',
    title: 'Disabled & read-only',
    category: 'States',
    description:
      'disabled blocks all interaction; readOnly shows the query without allowing edits.',
    component: QueryBuilderDisabledReadonlyExample,
    imports: [...QUERY_BUILDER_IMPORTS],
    html: `<pixel-query-builder
  [config]="config"
  [(query)]="query"
  [disabled]="disabled()"
  [readOnly]="readOnly()"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelQueryBuilderComponent } from 'pixel-ui';

@Component({ /* … */ })
export class QueryBuilderDisabledReadonlyExample {
  protected readonly disabled = signal(false);
  protected readonly readOnly = signal(false);
}`,
    scss: `.controls {
  display: flex;
  gap: 1rem;
  margin-block-end: 1rem;
}`,
  }),
] as const;
