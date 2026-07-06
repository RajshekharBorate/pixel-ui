import { DocComponentMeta } from '../types';
import { TREE_EXAMPLES } from '../../examples/pixel-tree';

export const TREE_META: DocComponentMeta = {
  id: 'pixel-tree',
  title: 'Tree',
  selector: 'pixel-tree',
  category: 'data-display',
  status: 'stable',
  summary:
    'Accessible TreeView for hierarchical data with single or cascading checkbox selection, lazy-loaded branches, virtualization, connector lines, drag-to-reorder, custom node templates, and the full WAI-ARIA tree keyboard contract.',
  overview: [
    'pixel-tree renders a flattened visible-row list (indentation via CSS var, one @for) — virtualScroll windowing keeps 10k+ visible rows fast.',
    'expandedIds and selectedIds are two-way models; nodes are never mutated, and lazily loaded children are cached internally by node id.',
    'Checkbox mode cascades selection to descendants and derives checked/indeterminate parent state; reorderable emits nodeReorder for sibling drag-and-drop.',
  ],
  useCases: [
    'File and folder explorers',
    'Organization / permission trees with cascading checkbox selection',
    'Nested settings and taxonomy pickers with lazily loaded branches',
    'Large expanded hierarchies with virtualScroll',
  ],
  themingNotes: [
    'Component tokens: --pixel-tree-node-block-size, --pixel-tree-indent, --pixel-tree-color, --pixel-tree-hover-background, --pixel-tree-selected-background, --pixel-tree-selected-color, --pixel-tree-radius, --pixel-tree-connector-color.',
    'Indentation is logical (padding-inline-start) and the expand chevron mirrors under [dir=rtl].',
  ],
  accessibilityNotes: [
    'role="tree"/"treeitem" with aria-level, aria-posinset, aria-setsize on every row (flat pattern).',
    'Roving tabindex; ArrowUp/Down move, ArrowRight expands or enters, ArrowLeft collapses or goes to the parent, Home/End jump, Enter activates/selects, Space toggles, typeahead and * expand siblings.',
    'aria-expanded on branches, aria-selected in single mode, aria-checked (incl. "mixed") in checkbox mode, aria-busy while a branch loads.',
    'Disabled nodes stay focusable (per WAI-ARIA) but cannot be selected or toggled.',
  ],
  imports: ['PixelTreeComponent', 'PixelTreeNodeDefDirective'],
  inputs: [
    { name: 'nodes', type: 'readonly PixelTreeNode<T>[]', defaultValue: '[]', description: 'Root nodes; never mutated.' },
    { name: 'selectionMode', type: "'none' | 'single' | 'checkbox'", defaultValue: "'none'", description: 'Selection behavior.' },
    { name: 'loadChildren', type: '(node) => Promise<readonly PixelTreeNode<T>[]>', defaultValue: 'null', description: 'Async loader for hasChildren branches (cached by id).' },
    { name: 'virtualScroll', type: 'boolean', defaultValue: 'false', description: 'Fixed-height row windowing over the flat list.' },
    { name: 'virtualHeight', type: 'number', defaultValue: '480', description: 'Scroll viewport height px when virtualScroll is on.' },
    { name: 'rowHeight', type: 'number', defaultValue: '0', description: 'Row stride px for virtualization (0 = token default).' },
    { name: 'virtualOverscan', type: 'number', defaultValue: '8', description: 'Buffer rows above/below the viewport.' },
    { name: 'showConnectors', type: 'boolean', defaultValue: 'false', description: 'Ancestor connector lines in the indent gutter.' },
    { name: 'reorderable', type: 'boolean', defaultValue: 'false', description: 'Sibling drag-to-reorder via HTML5 drag handle.' },
    { name: 'expandedIds', type: 'readonly PixelTreeNodeId[]', defaultValue: '[]', description: 'Two-way expanded node ids.' },
    { name: 'selectedIds', type: 'readonly PixelTreeNodeId[]', defaultValue: '[]', description: 'Two-way selected node ids (checkbox mode stores the cascaded closure).' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible name for the tree.' },
    { name: 'emptyHeading', type: 'string', defaultValue: "'No items'", description: 'Built-in empty-state heading.' },
    { name: 'hideExpansionArrows', type: 'boolean', defaultValue: 'false', description: 'Hides chevrons (flat-list styling).' },
    { name: 'id', type: 'string', defaultValue: "''", description: 'Element id override (also prefixes row ids).' },
  ],
  outputs: [
    { name: 'nodeToggle', type: 'PixelTreeNodeToggleEvent<T>', description: 'Branch expanded or collapsed.' },
    { name: 'selectionChange', type: 'PixelTreeSelectionChangeEvent<T>', description: 'Selection changed ({ node, selected, selectedIds, source }).' },
    { name: 'nodeActivate', type: 'PixelTreeNodeActivateEvent<T>', description: 'Node activated via Enter or click.' },
    { name: 'nodeReorder', type: 'PixelTreeNodeReorderEvent<T>', description: 'Sibling reordered via drag-and-drop.' },
  ],
  examples: TREE_EXAMPLES,
};
