import { Injectable } from '@angular/core';
import { DOC_CATEGORIES } from '../registry/categories';
import { COMPONENT_REGISTRY, getComponentById } from '../registry/component-registry';
import { DocComponentCategoryId, DocComponentMeta } from '../registry/types';

@Injectable({ providedIn: 'root' })
export class DocNavigationService {
  readonly categories = DOC_CATEGORIES;
  readonly components = COMPONENT_REGISTRY;

  /** UI kit entries (everything except charts). */
  readonly uiComponents = COMPONENT_REGISTRY.filter((c) => c.category !== 'charts');

  /** Chart families + shell + sparkline. */
  readonly chartComponents = COMPONENT_REGISTRY.filter((c) => c.category === 'charts');

  readonly sortedUiComponents = [...this.uiComponents].sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  readonly sortedChartComponents = [...this.chartComponents].sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  readonly sortedComponents = [...COMPONENT_REGISTRY].sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  readonly totalExamples = COMPONENT_REGISTRY.reduce(
    (total, component) => total + component.examples.length,
    0,
  );

  readonly uiExampleCount = this.uiComponents.reduce(
    (total, component) => total + component.examples.length,
    0,
  );

  readonly chartExampleCount = this.chartComponents.reduce(
    (total, component) => total + component.examples.length,
    0,
  );

  getComponent(id: string): DocComponentMeta | undefined {
    return getComponentById(id);
  }

  isChartComponent(component: DocComponentMeta): boolean {
    return component.category === 'charts';
  }

  displayTitle(component: DocComponentMeta): string {
    return this.isChartComponent(component)
      ? component.title.replace(/^Chart\s*[—-]\s*/i, '')
      : component.title;
  }

  docPath(component: DocComponentMeta, tab = 'overview'): string {
    const section = this.isChartComponent(component) ? 'charts' : 'components';
    return `/${section}/${component.id}/${tab}`;
  }

  componentsByCategory(categoryId: DocComponentCategoryId): readonly DocComponentMeta[] {
    return this.components.filter((component) => component.category === categoryId);
  }
}
