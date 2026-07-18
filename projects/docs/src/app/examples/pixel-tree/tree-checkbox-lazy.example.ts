import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTreeComponent, type PixelTreeNode, type PixelTreeNodeId } from 'pixel-ui';

const ORG: readonly PixelTreeNode[] = [
  {
    id: 'engineering',
    label: 'Engineering',
    icon: 'engineering',
    children: [
      { id: 'platform', label: 'Platform', hasChildren: true },
      { id: 'web', label: 'Web', hasChildren: true },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    icon: 'palette',
    children: [
      { id: 'brand', label: 'Brand' },
      { id: 'ux', label: 'UX Research' },
    ],
  },
];

const REMOTE_MEMBERS: Record<string, readonly PixelTreeNode[]> = {
  platform: [
    { id: 'p1', label: 'Priya (Lead)' },
    { id: 'p2', label: 'Marco' },
  ],
  web: [
    { id: 'w1', label: 'Sofia (Lead)' },
    { id: 'w2', label: 'Chen' },
    { id: 'w3', label: 'Amara' },
  ],
};

@Component({
  selector: 'docs-tree-checkbox-lazy-example',
  imports: [PixelTreeComponent],
  template: `
    <pixel-tree
      ariaLabel="Notify teams"
      selectionMode="checkbox"
      [nodes]="nodes"
      [loadChildren]="loadMembers"
      showConnectors
      [(expandedIds)]="expanded"
      [(selectedIds)]="selected"
    />
    <p class="result">{{ selected().length }} node(s) selected</p>
  `,
  styles: `
    :host { display: block; max-inline-size: 22rem; }
    .result { margin: var(--pixel-sys-space-md, 1rem) 0 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeCheckboxLazyExample {
  protected readonly nodes = ORG;
  readonly expanded = signal<readonly PixelTreeNodeId[]>(['engineering']);
  readonly selected = signal<readonly PixelTreeNodeId[]>([]);

  // Simulated server call — children resolve after a short delay and are cached by the tree.
  protected readonly loadMembers = (node: PixelTreeNode): Promise<readonly PixelTreeNode[]> =>
    new Promise((resolve) =>
      setTimeout(() => resolve(REMOTE_MEMBERS[String(node.id)] ?? []), 900),
    );
}
