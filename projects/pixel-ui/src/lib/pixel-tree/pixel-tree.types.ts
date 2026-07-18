export type PixelTreeNodeId = string | number;

export type PixelTreeSelectionMode = 'none' | 'single' | 'checkbox';

export type PixelTreeCheckState = 'checked' | 'unchecked' | 'indeterminate';

export type PixelTreeInteractionSource = 'mouse' | 'keyboard';

export interface PixelTreeNode<T = any> {
  /** Stable unique identity — expansion, selection, and lazy caches key off it. */
  readonly id: PixelTreeNodeId;
  /** Text rendered by the default node template (and used for the accessible name). */
  readonly label: string;
  /** Optional Material Symbols ligature rendered before the label. */
  readonly icon?: string;
  /** Child nodes. Omit (with `hasChildren`) for lazily loaded branches. */
  readonly children?: readonly PixelTreeNode<T>[];
  /** Marks a node as expandable even though `children` is not (yet) populated — lazy branches. */
  readonly hasChildren?: boolean;
  /** Disabled nodes are focusable (per WAI-ARIA) but cannot be selected or toggled. */
  readonly disabled?: boolean;
  /** Consumer payload carried through events and templates. */
  readonly data?: T;
}

/** One row of the flattened visible tree — template context for custom node templates. */
export interface PixelTreeFlatRow<T = any> {
  readonly node: PixelTreeNode<T>;
  readonly level: number;
  readonly posinset: number;
  readonly setsize: number;
  readonly expandable: boolean;
  readonly expanded: boolean;
  readonly loading: boolean;
  readonly checkState: PixelTreeCheckState;
  readonly selected: boolean;
  /** Whether this node is the last child among its siblings (connector lines). */
  readonly isLastChild: boolean;
  /** Per-ancestor flag: `true` when a vertical guide continues below that ancestor. */
  readonly ancestorContinues: readonly boolean[];
}

export interface PixelTreeNodeToggleEvent<T = any> {
  readonly node: PixelTreeNode<T>;
  readonly expanded: boolean;
  readonly source: PixelTreeInteractionSource;
}

export interface PixelTreeSelectionChangeEvent<T = any> {
  readonly node: PixelTreeNode<T>;
  readonly selected: boolean;
  readonly selectedIds: readonly PixelTreeNodeId[];
  readonly source: PixelTreeInteractionSource;
}

export interface PixelTreeNodeActivateEvent<T = any> {
  readonly node: PixelTreeNode<T>;
  readonly source: PixelTreeInteractionSource;
  readonly originalEvent: MouseEvent | KeyboardEvent;
}

/**
 * Sibling reorder payload — same move model as query-builder (`moveNode(from, to)`):
 * remove `node` at `fromIndex`, then insert it at `toIndex` in the sibling list
 * (indexes are against the list *before* removal).
 */
export interface PixelTreeNodeReorderEvent<T = any> {
  readonly node: PixelTreeNode<T>;
  readonly targetNode: PixelTreeNode<T>;
  /** Index of the dragged node among its siblings (before the move). */
  readonly fromIndex: number;
  /** Index of the drop target among the same siblings (before the move). */
  readonly toIndex: number;
  readonly source: PixelTreeInteractionSource;
}
