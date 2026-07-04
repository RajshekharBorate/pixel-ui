import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelEmptyStateComponent from '../pixel-empty-state/pixel-empty-state';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import PixelTreeNodeDefDirective from './pixel-tree-node.directive';
import type {
  PixelTreeCheckState,
  PixelTreeFlatRow,
  PixelTreeInteractionSource,
  PixelTreeNode,
  PixelTreeNodeActivateEvent,
  PixelTreeNodeId,
  PixelTreeNodeToggleEvent,
  PixelTreeSelectionChangeEvent,
  PixelTreeSelectionMode,
} from './pixel-tree.types';

let nextTreeId = 0;

/**
 * Accessible TreeView for hierarchical data: file explorers, org structures, nested
 * settings. Renders a flattened visible-row list (one `@for`, indentation via CSS var) with
 * the full WAI-ARIA tree keyboard contract, `single` or cascading `checkbox` selection,
 * lazy `loadChildren` branches, and custom node templates via `[pixelTreeNodeDef]`.
 *
 * @example
 * ```html
 * <pixel-tree
 *   [nodes]="files"
 *   selectionMode="checkbox"
 *   [(selectedIds)]="selection"
 *   [(expandedIds)]="expansion"
 * />
 * ```
 */
@Component({
  selector: 'pixel-tree',
  imports: [NgTemplateOutlet, PixelLoaderComponent, PixelEmptyStateComponent, PixelCheckboxComponent],
  templateUrl: './pixel-tree.html',
  styleUrl: './pixel-tree.scss',
  host: { class: 'pixel-tree' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTreeComponent<T = any> {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly nodeTemplate = contentChild(PixelTreeNodeDefDirective);

  protected readonly treeId = `pixel-tree-${++nextTreeId}`;

  /**
   * Root nodes of the tree.
   *
   * @type {readonly PixelTreeNode<T>[]}
   * @default []
   * @description Never mutated. Lazily loaded children are cached internally by node id, so
   * replace node ids to force a reload.
   */
  readonly nodes = input<readonly PixelTreeNode<T>[]>([]);

  /**
   * Selection behavior.
   *
   * @type {'none' | 'single' | 'checkbox'}
   * @default 'none'
   * @description `single` selects one node via Enter/click (`aria-selected`); `checkbox`
   * renders cascading checkboxes with indeterminate parents (`aria-checked`).
   */
  readonly selectionMode = input<PixelTreeSelectionMode>('none');

  /**
   * Async loader for `hasChildren` branches without inline `children`.
   *
   * @type {((node: PixelTreeNode<T>) => Promise<readonly PixelTreeNode<T>[]>) | null}
   * @default null
   * @description Called once per node on first expansion; the row shows an inline loader and
   * `aria-busy` while pending. Results are cached by node id.
   */
  readonly loadChildren = input<
    ((node: PixelTreeNode<T>) => Promise<readonly PixelTreeNode<T>[]>) | null
  >(null);

  /**
   * Accessible name for the tree.
   *
   * @type {string}
   * @default ''
   * @description Required when the tree has no visible heading (`aria-label` on the host).
   */
  readonly ariaLabel = input('');

  /**
   * Optional element id override.
   *
   * @type {string}
   * @default ''
   * @description Also prefixes the generated per-row ids used for roving focus.
   */
  readonly id = input('');

  /**
   * Heading for the built-in empty state shown when `nodes` is empty.
   *
   * @type {string}
   * @default 'No items'
   * @description Project `[pixelTreeEmpty]` content to replace the default empty state.
   */
  readonly emptyHeading = input('No items');

  /**
   * Hides the expand/collapse arrows (flat-list styling for shallow trees).
   *
   * @type {boolean}
   * @default false
   * @description Keyboard expansion still works; use only for trees that arrive expanded.
   */
  readonly hideExpansionArrows = input(false, { transform: booleanAttribute });

  /** Expanded node ids — two-way. */
  readonly expandedIds = model<readonly PixelTreeNodeId[]>([]);

  /** Selected node ids — two-way. In `checkbox` mode contains the full cascaded closure. */
  readonly selectedIds = model<readonly PixelTreeNodeId[]>([]);

  /** Emits when a branch expands or collapses. */
  readonly nodeToggle = output<PixelTreeNodeToggleEvent<T>>();

  /** Emits on every selection change with the node that caused it. */
  readonly selectionChange = output<PixelTreeSelectionChangeEvent<T>>();

  /** Emits when a node is activated (Enter or click on its content). */
  readonly nodeActivate = output<PixelTreeNodeActivateEvent<T>>();

  private readonly loadedChildren = signal<ReadonlyMap<PixelTreeNodeId, readonly PixelTreeNode<T>[]>>(
    new Map(),
  );
  private readonly loadingIds = signal<ReadonlySet<PixelTreeNodeId>>(new Set());
  protected readonly activeId = signal<PixelTreeNodeId | null>(null);
  private lastSource: PixelTreeInteractionSource = 'mouse';

  private readonly expandedSet = computed(() => new Set(this.expandedIds()));
  private readonly selectedSet = computed(() => new Set(this.selectedIds()));

  private childrenOf(node: PixelTreeNode<T>): readonly PixelTreeNode<T>[] {
    return node.children ?? this.loadedChildren().get(node.id) ?? [];
  }

  private isExpandable(node: PixelTreeNode<T>): boolean {
    return this.childrenOf(node).length > 0 || node.hasChildren === true;
  }

  /** Parent lookup for ArrowLeft navigation. */
  private readonly parentMap = computed(() => {
    const map = new Map<PixelTreeNodeId, PixelTreeNode<T> | null>();
    const walk = (nodes: readonly PixelTreeNode<T>[], parent: PixelTreeNode<T> | null) => {
      for (const node of nodes) {
        map.set(node.id, parent);
        walk(this.childrenOf(node), node);
      }
    };
    walk(this.nodes(), null);
    return map;
  });

  /** Cascading check state per node (checkbox mode). */
  private readonly checkStates = computed(() => {
    const states = new Map<PixelTreeNodeId, PixelTreeCheckState>();
    const selected = this.selectedSet();
    const visit = (node: PixelTreeNode<T>): PixelTreeCheckState => {
      const children = this.childrenOf(node);
      if (children.length === 0) {
        const state: PixelTreeCheckState = selected.has(node.id) ? 'checked' : 'unchecked';
        states.set(node.id, state);
        return state;
      }
      let checked = 0;
      let indeterminate = 0;
      for (const child of children) {
        const state = visit(child);
        if (state === 'checked') checked++;
        else if (state === 'indeterminate') indeterminate++;
      }
      const state: PixelTreeCheckState =
        checked === children.length
          ? 'checked'
          : checked > 0 || indeterminate > 0
            ? 'indeterminate'
            : 'unchecked';
      states.set(node.id, state);
      return state;
    };
    for (const root of this.nodes()) {
      visit(root);
    }
    return states;
  });

  /** The flattened, currently-visible rows — the single source the template renders. */
  protected readonly flatRows = computed<PixelTreeFlatRow<T>[]>(() => {
    const rows: PixelTreeFlatRow<T>[] = [];
    const expanded = this.expandedSet();
    const selected = this.selectedSet();
    const loading = this.loadingIds();
    const checkStates = this.checkStates();
    const single = this.selectionMode() === 'single';

    const walk = (nodes: readonly PixelTreeNode<T>[], level: number) => {
      nodes.forEach((node, index) => {
        const expandable = this.isExpandable(node);
        const isExpanded = expandable && expanded.has(node.id);
        rows.push({
          node,
          level,
          posinset: index + 1,
          setsize: nodes.length,
          expandable,
          expanded: isExpanded,
          loading: loading.has(node.id),
          checkState: checkStates.get(node.id) ?? 'unchecked',
          selected: single && selected.has(node.id),
        });
        if (isExpanded) {
          walk(this.childrenOf(node), level + 1);
        }
      });
    };
    walk(this.nodes(), 1);
    return rows;
  });

  protected readonly effectiveActiveId = computed<PixelTreeNodeId | null>(() => {
    const rows = this.flatRows();
    if (rows.length === 0) {
      return null;
    }
    const active = this.activeId();
    return active !== null && rows.some((row) => row.node.id === active)
      ? active
      : rows[0].node.id;
  });

  protected rowDomId(id: PixelTreeNodeId): string {
    return `${this.id() || this.treeId}-node-${String(id)}`;
  }

  // ---- expansion ----

  toggleNode(node: PixelTreeNode<T>, source: PixelTreeInteractionSource = 'mouse'): void {
    if (!this.isExpandable(node) || node.disabled) {
      return;
    }
    const expanded = this.expandedSet();
    if (expanded.has(node.id)) {
      this.expandedIds.set(this.expandedIds().filter((id) => id !== node.id));
      this.nodeToggle.emit({ node, expanded: false, source });
      return;
    }
    this.expandedIds.set([...this.expandedIds(), node.id]);
    this.nodeToggle.emit({ node, expanded: true, source });
    this.maybeLoadChildren(node);
  }

  private maybeLoadChildren(node: PixelTreeNode<T>): void {
    const loader = this.loadChildren();
    const needsLoad =
      loader !== null &&
      node.hasChildren === true &&
      !node.children &&
      !this.loadedChildren().has(node.id) &&
      !this.loadingIds().has(node.id);
    if (!needsLoad) {
      return;
    }
    this.loadingIds.update((ids) => new Set(ids).add(node.id));
    loader(node)
      .then((children) => {
        this.loadedChildren.update((map) => new Map(map).set(node.id, children));
      })
      .finally(() => {
        this.loadingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(node.id);
          return next;
        });
      });
  }

  /** Expands every currently-known branch (lazy branches load on their own expansion). */
  expandAll(): void {
    const ids: PixelTreeNodeId[] = [];
    const walk = (nodes: readonly PixelTreeNode<T>[]) => {
      for (const node of nodes) {
        if (this.isExpandable(node)) {
          ids.push(node.id);
          walk(this.childrenOf(node));
        }
      }
    };
    walk(this.nodes());
    this.expandedIds.set(ids);
  }

  collapseAll(): void {
    this.expandedIds.set([]);
  }

  // ---- selection ----

  private descendantClosure(node: PixelTreeNode<T>): PixelTreeNodeId[] {
    const ids: PixelTreeNodeId[] = [];
    const walk = (current: PixelTreeNode<T>) => {
      ids.push(current.id);
      for (const child of this.childrenOf(current)) {
        walk(child);
      }
    };
    walk(node);
    return ids;
  }

  protected select(node: PixelTreeNode<T>, source: PixelTreeInteractionSource): void {
    if (node.disabled) {
      return;
    }
    const mode = this.selectionMode();
    if (mode === 'single') {
      const already = this.selectedSet().has(node.id);
      const next = already ? [] : [node.id];
      this.selectedIds.set(next);
      this.selectionChange.emit({ node, selected: !already, selectedIds: next, source });
    } else if (mode === 'checkbox') {
      const closure = this.descendantClosure(node);
      const state = this.checkStates().get(node.id) ?? 'unchecked';
      const selecting = state !== 'checked';
      const current = new Set(this.selectedIds());
      for (const id of closure) {
        if (selecting) {
          current.add(id);
        } else {
          current.delete(id);
        }
      }
      const next = [...current];
      this.selectedIds.set(next);
      this.selectionChange.emit({ node, selected: selecting, selectedIds: next, source });
    }
  }

  // ---- interaction ----

  protected onRowClick(row: PixelTreeFlatRow<T>, event: MouseEvent): void {
    this.lastSource = 'mouse';
    this.activeId.set(row.node.id);
    if (row.node.disabled) {
      return;
    }
    this.select(row.node, 'mouse');
    this.nodeActivate.emit({ node: row.node, source: 'mouse', originalEvent: event });
  }

  protected onArrowClick(row: PixelTreeFlatRow<T>, event: MouseEvent): void {
    event.stopPropagation();
    this.activeId.set(row.node.id);
    this.toggleNode(row.node, 'mouse');
  }

  protected onTreeKeydown(event: KeyboardEvent): void {
    const rows = this.flatRows();
    if (rows.length === 0) {
      return;
    }
    const activeId = this.effectiveActiveId();
    const index = rows.findIndex((row) => row.node.id === activeId);
    const row = rows[index] ?? rows[0];

    const focusRow = (target: PixelTreeFlatRow<T> | undefined) => {
      if (!target) {
        return;
      }
      this.activeId.set(target.node.id);
      const domId = this.rowDomId(target.node.id);
      // Match by property instead of an id selector: consumer node ids may contain any
      // characters, and CSS.escape is unavailable in some test environments.
      const el = Array.from(
        this.hostRef.nativeElement.querySelectorAll<HTMLElement>('[role="treeitem"]'),
      ).find((candidate) => candidate.id === domId);
      el?.focus();
    };

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusRow(rows[index + 1]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusRow(rows[index - 1]);
        break;
      case 'Home':
        event.preventDefault();
        focusRow(rows[0]);
        break;
      case 'End':
        event.preventDefault();
        focusRow(rows[rows.length - 1]);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (row.expandable && !row.expanded) {
          this.toggleNode(row.node, 'keyboard');
        } else if (row.expanded) {
          focusRow(rows[index + 1]);
        }
        break;
      case 'ArrowLeft': {
        event.preventDefault();
        if (row.expanded) {
          this.toggleNode(row.node, 'keyboard');
          break;
        }
        const parent = this.parentMap().get(row.node.id);
        if (parent) {
          focusRow(rows.find((candidate) => candidate.node.id === parent.id));
        }
        break;
      }
      case 'Enter':
        event.preventDefault();
        this.select(row.node, 'keyboard');
        this.nodeActivate.emit({ node: row.node, source: 'keyboard', originalEvent: event });
        break;
      case ' ':
        event.preventDefault();
        this.select(row.node, 'keyboard');
        break;
    }
  }

  protected onRowFocus(row: PixelTreeFlatRow<T>): void {
    this.activeId.set(row.node.id);
  }
}
