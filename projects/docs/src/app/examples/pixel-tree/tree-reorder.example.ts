import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelTreeComponent,
  type PixelTreeNode,
  type PixelTreeNodeId,
  type PixelTreeNodeReorderEvent,
} from 'pixel-ui';

@Component({
  selector: 'docs-tree-reorder-example',
  imports: [PixelTreeComponent],
  template: `
    <pixel-tree
      ariaLabel="Reorderable tasks"
      [nodes]="nodes()"
      reorderable
      showConnectors
      [(expandedIds)]="expanded"
      (nodeReorder)="onReorder($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeReorderExample {
  protected readonly nodes = signal<readonly PixelTreeNode[]>([
    {
      id: 'backlog',
      label: 'Backlog',
      icon: 'folder',
      children: [
        { id: 'a', label: 'Wireframes' },
        { id: 'b', label: 'API design' },
        { id: 'c', label: 'Prototype' },
      ],
    },
    {
      id: 'done',
      label: 'Done',
      icon: 'folder',
      children: [{ id: 'd', label: 'Kickoff' }],
    },
  ]);

  readonly expanded = signal<readonly PixelTreeNodeId[]>(['backlog', 'done']);

  protected onReorder(event: PixelTreeNodeReorderEvent): void {
    const parentId = this.parentId(event.targetNode.id);
    const siblings = this.siblingList(parentId);
    if (
      event.fromIndex < 0 ||
      event.toIndex < 0 ||
      event.fromIndex >= siblings.length ||
      event.toIndex >= siblings.length ||
      event.fromIndex === event.toIndex
    ) {
      return;
    }
    // Same as query-builder moveQueryRule: splice out, then insert at original toIndex.
    const next = [...siblings];
    const [moved] = next.splice(event.fromIndex, 1);
    next.splice(event.toIndex, 0, moved);
    this.nodes.set(this.replaceSiblings(parentId, next));
  }

  private parentId(nodeId: PixelTreeNodeId): PixelTreeNodeId | null {
    for (const root of this.nodes()) {
      if (root.id === nodeId) {
        return null;
      }
      const found = this.findParent(root, nodeId);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private findParent(node: PixelTreeNode, targetId: PixelTreeNodeId): PixelTreeNodeId | null {
    for (const child of node.children ?? []) {
      if (child.id === targetId) {
        return node.id;
      }
      const nested = this.findParent(child, targetId);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  private siblingList(parentId: PixelTreeNodeId | null): PixelTreeNode[] {
    if (parentId === null) {
      return [...this.nodes()];
    }
    const parent = this.findNode(parentId);
    return parent?.children ? [...parent.children] : [];
  }

  private findNode(id: PixelTreeNodeId): PixelTreeNode | null {
    const walk = (nodes: readonly PixelTreeNode[]): PixelTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
        const nested = walk(node.children ?? []);
        if (nested) {
          return nested;
        }
      }
      return null;
    };
    return walk(this.nodes());
  }

  private replaceSiblings(
    parentId: PixelTreeNodeId | null,
    siblings: readonly PixelTreeNode[],
  ): readonly PixelTreeNode[] {
    if (parentId === null) {
      return siblings;
    }
    const map = (nodes: readonly PixelTreeNode[]): readonly PixelTreeNode[] =>
      nodes.map((node) =>
        node.id === parentId
          ? { ...node, children: siblings }
          : { ...node, children: node.children ? map(node.children) : undefined },
      );
    return map(this.nodes());
  }
}
