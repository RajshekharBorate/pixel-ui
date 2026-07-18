import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTreeComponent, type PixelTreeNode, type PixelTreeNodeId } from 'pixel-ui';

const FILES: readonly PixelTreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: 'folder',
    children: [
      {
        id: 'app',
        label: 'app',
        icon: 'folder',
        children: [
          { id: 'app.ts', label: 'app.component.ts', icon: 'code' },
          { id: 'app.html', label: 'app.component.html', icon: 'html' },
        ],
      },
      { id: 'main', label: 'main.ts', icon: 'code' },
      { id: 'styles', label: 'styles.scss', icon: 'css' },
    ],
  },
  {
    id: 'docs',
    label: 'docs',
    icon: 'folder',
    children: [{ id: 'readme', label: 'README.md', icon: 'description' }],
  },
  { id: 'package', label: 'package.json', icon: 'data_object' },
  { id: 'legacy', label: 'legacy.lock', icon: 'lock', disabled: true },
];

@Component({
  selector: 'docs-tree-explorer-example',
  imports: [PixelTreeComponent],
  template: `
    <pixel-tree
      ariaLabel="Project files"
      selectionMode="single"
      [nodes]="nodes"
      showConnectors
      [(expandedIds)]="expanded"
      [(selectedIds)]="selected"
    />
    <p class="result">Selected: {{ selected().length ? selected()[0] : 'none' }}</p>
  `,
  styles: `
    :host { display: block; max-inline-size: 22rem; }
    .result { margin: var(--pixel-sys-space-md, 1rem) 0 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeExplorerExample {
  protected readonly nodes = FILES;
  readonly expanded = signal<readonly PixelTreeNodeId[]>(['src']);
  readonly selected = signal<readonly PixelTreeNodeId[]>([]);
}
