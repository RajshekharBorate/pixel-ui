import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PixelBadgeComponent, PixelInputComponent } from 'pixel-ui';
import { DocNavigationService } from '../../core/doc-navigation.service';
import { DocComponentMeta, DocComponentStatus } from '../../registry/types';

type CatalogStatusFilter = 'all' | DocComponentStatus;

interface CatalogStatusOption {
  readonly id: CatalogStatusFilter;
  readonly label: string;
}

@Component({
  selector: 'docs-components-catalog-page',
  standalone: true,
  imports: [RouterLink, PixelBadgeComponent, PixelInputComponent],
  templateUrl: './components-catalog-page.html',
  styleUrl: './components-catalog-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsCatalogPageComponent {
  protected readonly nav = inject(DocNavigationService);

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<CatalogStatusFilter>('all');

  protected readonly statusOptions: readonly CatalogStatusOption[] = [
    { id: 'all', label: 'All' },
    { id: 'stable', label: 'Stable' },
    { id: 'beta', label: 'Beta' },
    { id: 'experimental', label: 'Experimental' },
  ];

  protected readonly stableCount = computed(
    () => this.nav.components.filter((component) => component.status === 'stable').length,
  );

  protected readonly filteredComponents = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.nav.sortedComponents.filter((component) => {
      if (status !== 'all' && component.status !== status) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        component.title.toLowerCase().includes(query) ||
        component.id.toLowerCase().includes(query) ||
        component.selector.toLowerCase().includes(query) ||
        component.summary.toLowerCase().includes(query)
      );
    });
  });

  protected setStatusFilter(filter: CatalogStatusFilter): void {
    this.statusFilter.set(filter);
  }

  protected exampleCount(component: DocComponentMeta): number {
    return component.examples.length;
  }

  protected statusCount(filter: CatalogStatusFilter): number {
    if (filter === 'all') {
      return this.nav.components.length;
    }
    return this.nav.components.filter((component) => component.status === filter).length;
  }
}
