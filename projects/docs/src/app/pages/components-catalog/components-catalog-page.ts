import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PixelBadgeComponent, PixelContainerComponent, PixelInputComponent } from 'pixel-ui';
import { DocNavigationService } from '../../core/doc-navigation.service';
import { DocComponentMeta, DocComponentStatus } from '../../registry/types';

export type DocsCatalogSection = 'components' | 'charts';

type CatalogStatusFilter = 'all' | DocComponentStatus;

interface CatalogStatusOption {
  readonly id: CatalogStatusFilter;
  readonly label: string;
}

@Component({
  selector: 'docs-components-catalog-page',
  imports: [RouterLink, PixelBadgeComponent, PixelContainerComponent, PixelInputComponent],
  templateUrl: './components-catalog-page.html',
  styleUrl: './components-catalog-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsCatalogPageComponent {
  protected readonly nav = inject(DocNavigationService);
  private readonly route = inject(ActivatedRoute);

  protected readonly section = toSignal(
    this.route.data.pipe(map((data) => (data['catalog'] as DocsCatalogSection) ?? 'components')),
    { initialValue: (this.route.snapshot.data['catalog'] as DocsCatalogSection) ?? 'components' },
  );

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<CatalogStatusFilter>('all');

  protected readonly statusOptions: readonly CatalogStatusOption[] = [
    { id: 'all', label: 'All' },
    { id: 'stable', label: 'Stable' },
    { id: 'beta', label: 'Beta' },
    { id: 'experimental', label: 'Experimental' },
  ];

  protected readonly catalogItems = computed(() =>
    this.section() === 'charts' ? this.nav.sortedChartComponents : this.nav.sortedUiComponents,
  );

  protected readonly exampleTotal = computed(() =>
    this.section() === 'charts' ? this.nav.chartExampleCount : this.nav.uiExampleCount,
  );

  protected readonly eyebrow = computed(() =>
    this.section() === 'charts' ? 'Charts' : 'Components',
  );

  protected readonly heading = computed(() =>
    this.section() === 'charts' ? 'Chart catalog' : 'Component catalog',
  );

  protected readonly lede = computed(() =>
    this.section() === 'charts'
      ? 'Browse chart families from pixel-ui/charts — shell chrome, cartesian plots, gauges, and sparklines — with live previews and copyable examples.'
      : 'Browse every documented UI component with live previews, API reference, and copyable code snippets — all in alphabetical order.',
  );

  protected readonly emptyNoun = computed(() =>
    this.section() === 'charts' ? 'charts' : 'components',
  );

  protected readonly stableCount = computed(
    () => this.catalogItems().filter((component) => component.status === 'stable').length,
  );

  protected readonly filteredComponents = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.catalogItems().filter((component) => {
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
      return this.catalogItems().length;
    }
    return this.catalogItems().filter((component) => component.status === filter).length;
  }
}
