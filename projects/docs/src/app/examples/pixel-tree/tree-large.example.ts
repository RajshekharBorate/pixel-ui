import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTreeComponent, type PixelTreeNode } from 'pixel-ui';

function seedFlatTree(count: number): readonly PixelTreeNode[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `node-${index + 1}`,
    label: `Item ${String(index + 1).padStart(5, '0')}`,
    icon: index % 7 === 0 ? 'folder' : 'description',
  }));
}

@Component({
  selector: 'docs-tree-large-example',
  imports: [DecimalPipe, PixelTreeComponent],
  template: `
    <p class="docs-tree-large__hint">
      {{ nodes().length | number }} sibling nodes — only the visible window is in the DOM.
    </p>
    <pixel-tree
      ariaLabel="Large flat tree"
      [nodes]="nodes()"
      virtualScroll
      [virtualHeight]="420"
      showConnectors
    />
  `,
  styles: `
    .docs-tree-large__hint {
      margin-block: 0 var(--pixel-sys-space-sm, 0.5rem);
      color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 70%, transparent);
      font-size: var(--pixel-sys-body-sm-size, 0.8125rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeLargeExample {
  protected readonly nodes = signal(seedFlatTree(10000));
}
