import { Injectable } from '@angular/core';
import { DOC_CATEGORIES } from '../registry/categories';
import { COMPONENT_REGISTRY, getComponentById } from '../registry/component-registry';
import { DocComponentCategoryId, DocComponentMeta } from '../registry/types';

@Injectable({ providedIn: 'root' })
export class DocNavigationService {
  readonly categories = DOC_CATEGORIES;
  readonly components = COMPONENT_REGISTRY;
  readonly sortedComponents = [...COMPONENT_REGISTRY].sort((a, b) =>
    a.title.localeCompare(b.title),
  );
  readonly totalExamples = COMPONENT_REGISTRY.reduce(
    (total, component) => total + component.examples.length,
    0,
  );

  getComponent(id: string): DocComponentMeta | undefined {
    return getComponentById(id);
  }

  componentsByCategory(categoryId: DocComponentCategoryId): readonly DocComponentMeta[] {
    return this.components.filter((component) => component.category === categoryId);
  }
}
