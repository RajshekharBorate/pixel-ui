import { createDocExample } from '../../shared/example-source.util';
import { TreeExplorerExample } from './tree-explorer.example';
import { TreeCheckboxLazyExample } from './tree-checkbox-lazy.example';
import { TreeLargeExample } from './tree-large.example';
import { TreeReorderExample } from './tree-reorder.example';

export const TREE_EXAMPLES = [
  createDocExample({
    id: 'explorer',
    title: 'File explorer (single selection)',
    category: 'Basics',
    description:
      'Nested nodes with icons, hierarchy connector lines (`showConnectors`), two-way ' +
      'expandedIds/selectedIds, a disabled node, and the full WAI-ARIA keyboard map.',
    component: TreeExplorerExample,
    imports: ['PixelTreeComponent'],
    html: `<pixel-tree
  ariaLabel="Project files"
  selectionMode="single"
  [nodes]="nodes"
  showConnectors
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
      'branches call loadChildren on first expansion with an inline loader and aria-busy. ' +
      'showConnectors draws hierarchy guide lines in the indent gutter.',
    component: TreeCheckboxLazyExample,
    imports: ['PixelTreeComponent'],
    html: `<pixel-tree
  ariaLabel="Notify teams"
  selectionMode="checkbox"
  [nodes]="nodes"
  [loadChildren]="loadMembers"
  showConnectors
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
  createDocExample({
    id: 'large-virtual',
    title: '10,000 nodes (virtual scroll)',
    category: 'Scale',
    description:
      'virtualScroll renders only the visible row window over the flat list — pair with ' +
      'virtualHeight for large expanded trees without thousands of DOM nodes.',
    component: TreeLargeExample,
    imports: ['PixelTreeComponent'],
    html: `<pixel-tree
  ariaLabel="Large flat tree"
  [nodes]="nodes"
  virtualScroll
  [virtualHeight]="420"
  showConnectors
/>`,
    typescript: `import { Component, signal } from '@angular/core';
import { PixelTreeComponent, type PixelTreeNode } from 'pixel-ui';

@Component({ /* … */ })
export class TreeLargeExample {
  protected readonly nodes = signal<readonly PixelTreeNode[]>(seedFlatTree(10000));
}`,
  }),
  createDocExample({
    id: 'reorder',
    title: 'Drag to reorder siblings',
    category: 'Scale',
    description:
      'reorderable adds a query-builder-style drag handle and an opaque floating row preview; ' +
      'drop targets use a soft primary tint (no insertion edge line). Pair with showConnectors.',
    component: TreeReorderExample,
    imports: ['PixelTreeComponent'],
    html: `<pixel-tree
  ariaLabel="Reorderable tasks"
  [nodes]="nodes"
  reorderable
  showConnectors
  (nodeReorder)="onReorder($event)"
/>`,
    typescript: `import { Component, signal } from '@angular/core';
import { PixelTreeComponent, type PixelTreeNodeReorderEvent } from 'pixel-ui';

@Component({ /* … */ })
export class TreeReorderExample {
  protected readonly nodes = signal<readonly PixelTreeNode[]>([ /* … */ ]);

  protected onReorder(event: PixelTreeNodeReorderEvent): void {
    // Reorder siblings in your nodes array and call nodes.set(next).
  }
}`,
  }),
] as const;
