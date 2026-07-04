import { createDocExample } from '../../shared/example-source.util';
import { TreeExplorerExample } from './tree-explorer.example';
import { TreeCheckboxLazyExample } from './tree-checkbox-lazy.example';

export const TREE_EXAMPLES = [
  createDocExample({
    id: 'explorer',
    title: 'File explorer (single selection)',
    category: 'Basics',
    description:
      'Nested nodes with icons, two-way expandedIds/selectedIds, a disabled node, and the ' +
      'full WAI-ARIA keyboard map: arrows navigate, Right/Left expand/collapse, Enter selects.',
    component: TreeExplorerExample,
    imports: ['PixelTreeComponent'],
    html: `<pixel-tree
  ariaLabel="Project files"
  selectionMode="single"
  [nodes]="nodes"
  [(expandedIds)]="expanded"
  [(selectedIds)]="selected"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTreeComponent, type PixelTreeNode, type PixelTreeNodeId } from 'pixel-ui';

@Component({ /* … */ })
export class TreeExplorerExample {
  protected readonly nodes: readonly PixelTreeNode[] = [
    { id: 'src', label: 'src', icon: 'folder', children: [ /* … */ ] },
  ];
  readonly expanded = signal<readonly PixelTreeNodeId[]>(['src']);
  readonly selected = signal<readonly PixelTreeNodeId[]>([]);
}`,
  }),
  createDocExample({
    id: 'checkbox-lazy',
    title: 'Checkbox cascade + lazy loading',
    category: 'Selection & async',
    description:
      'Checkbox mode cascades to descendants and derives indeterminate parents; hasChildren ' +
      'branches call loadChildren on first expansion with an inline loader and aria-busy.',
    component: TreeCheckboxLazyExample,
    imports: ['PixelTreeComponent'],
    html: `<pixel-tree
  ariaLabel="Notify teams"
  selectionMode="checkbox"
  [nodes]="nodes"
  [loadChildren]="loadMembers"
  [(expandedIds)]="expanded"
  [(selectedIds)]="selected"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTreeComponent, type PixelTreeNode, type PixelTreeNodeId } from 'pixel-ui';

@Component({ /* … */ })
export class TreeCheckboxLazyExample {
  protected readonly nodes: readonly PixelTreeNode[] = [
    { id: 'engineering', label: 'Engineering', children: [
      { id: 'platform', label: 'Platform', hasChildren: true },
    ]},
  ];
  readonly expanded = signal<readonly PixelTreeNodeId[]>([]);
  readonly selected = signal<readonly PixelTreeNodeId[]>([]);

  protected readonly loadMembers = (node: PixelTreeNode) =>
    this.api.fetchMembers(node.id); // Promise<readonly PixelTreeNode[]>
}`,
  }),
] as const;
