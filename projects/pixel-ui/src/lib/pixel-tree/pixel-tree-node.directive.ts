import { Directive, TemplateRef, inject } from '@angular/core';
import type { PixelTreeFlatRow } from './pixel-tree.types';

export interface PixelTreeNodeContext<T = any> {
  readonly $implicit: PixelTreeFlatRow<T>;
}

/**
 * Custom node template for `pixel-tree`. The implicit context value is the flat row
 * (`node`, `level`, `expanded`, `selected`, `checkState`, …); the tree keeps ownership of
 * the expand arrow, checkbox, indentation, and all interaction handling.
 *
 * @example
 * ```html
 * <pixel-tree [nodes]="files">
 *   <ng-template pixelTreeNodeDef let-row>
 *     <strong>{{ row.node.label }}</strong>
 *   </ng-template>
 * </pixel-tree>
 * ```
 */
@Directive({ selector: 'ng-template[pixelTreeNodeDef]' })
export default class PixelTreeNodeDefDirective<T = any> {
  readonly templateRef = inject(TemplateRef<PixelTreeNodeContext<T>>);
}
