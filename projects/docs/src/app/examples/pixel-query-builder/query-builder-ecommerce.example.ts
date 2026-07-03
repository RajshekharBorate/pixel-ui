import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  exportQuery,
  isQueryValid,
  nativeDateAdapterProviders,
  queryToSummary,
  PixelButtonComponent,
  PixelQueryBuilderComponent,
  PixelQueryGroup,
} from 'pixel-ui';
import {
  createDocsEcommerceSampleQuery,
  docsEcommerceCatalog,
  docsEcommerceQueryConfig,
  filterDocsCatalog,
  formatCategoryLabel,
  formatStatusLabel,
} from './query-builder-ecommerce-catalog';

@Component({
  selector: 'docs-query-builder-ecommerce-example',
  standalone: true,
  imports: [CurrencyPipe, PixelButtonComponent, PixelQueryBuilderComponent],
  providers: [...nativeDateAdapterProviders()],
  template: `
    <div class="layout">
      <pixel-query-builder
        [config]="config"
        [(query)]="query"
        summaryLabel="Filter preview"
      />

      <div class="toolbar">
        <pixel-button appearance="solid" (click)="applyFilters()">Apply filters</pixel-button>
        <pixel-button appearance="text" (click)="resetFilters()">Reset</pixel-button>
        <span class="count">{{ matchCount() }} of {{ totalCount() }} products</span>
      </div>

      <p class="summary">{{ filterSummary() }}</p>

      <ul class="catalog">
        @for (product of filteredProducts(); track product.sku) {
          <li class="item">
            <div>
              <strong>{{ product.productName }}</strong>
              <span class="meta">
                {{ formatCategoryLabel(product.category) }} · {{ product.sku }}
              </span>
            </div>
            <div class="price">
              {{ product.price | currency: 'USD' }}
              <span class="status">{{ formatStatusLabel(product.status) }}</span>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      gap: 1.25rem;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .count {
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }

    .summary {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
    }

    .catalog {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.5rem;
    }

    .item {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 16%, transparent);
      background: var(--pixel-sys-surface-container-low);
    }

    .meta,
    .status {
      display: block;
      font-size: 0.75rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 68%, transparent);
    }

    .price {
      text-align: right;
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderEcommerceExample {
  protected readonly config = docsEcommerceQueryConfig;
  protected readonly formatCategoryLabel = formatCategoryLabel;
  protected readonly formatStatusLabel = formatStatusLabel;

  protected readonly query = signal<PixelQueryGroup>(createDocsEcommerceSampleQuery());
  protected readonly appliedQuery = signal<PixelQueryGroup>(createDocsEcommerceSampleQuery());

  protected readonly queryValid = computed(() => isQueryValid(this.query(), this.config));
  protected readonly filterSummary = computed(() =>
    queryToSummary(this.appliedQuery(), this.config),
  );
  protected readonly filteredProducts = computed(() =>
    filterDocsCatalog(docsEcommerceCatalog, exportQuery(this.appliedQuery())),
  );
  protected readonly matchCount = computed(() => this.filteredProducts().length);
  protected readonly totalCount = computed(() => docsEcommerceCatalog.length);

  protected applyFilters(): void {
    if (!this.queryValid()) {
      return;
    }
    this.appliedQuery.set(structuredClone(this.query()));
  }

  protected resetFilters(): void {
    const sample = createDocsEcommerceSampleQuery();
    this.query.set(structuredClone(sample));
    this.appliedQuery.set(structuredClone(sample));
  }
}
