import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  DestroyRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import PixelLoaderComponent from '../pixel-loader/pixel-loader';
import PixelEmptyStateComponent from '../pixel-empty-state/pixel-empty-state';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import PixelTreeNodeDefDirective from './pixel-tree-node.directive';
import {
  startTreeRowDragPreview,
  type PixelTreeDragPreviewSession,
} from './pixel-tree-drag-preview';
import type {
  PixelTreeCheckState,
  PixelTreeFlatRow,
  PixelTreeInteractionSource,
  PixelTreeNode,
  PixelTreeNodeActivateEvent,
  PixelTreeNodeId,
  PixelTreeNodeReorderEvent,
  PixelTreeNodeToggleEvent,
  PixelTreeReorderPosition,
  PixelTreeSelectionChangeEvent,
  PixelTreeSelectionMode,
} from './pixel-tree.types';

let nextTreeId = 0;

/** Node block-size + inter-row gap at a 16px root (matches SCSS defaults). */
const DEFAULT_ROW_STRIDE_PX = 38;

const TYPEAHEAD_RESET_MS = 500;

/**
 * Accessible TreeView for hierarchical data: file explorers, org structures, nested
 * settings. Renders a flattened visible-row list (one `@for`, indentation via CSS var) with
 * the full WAI-ARIA tree keyboard contract, `single` or cascading `checkbox` selection,
 * lazy `loadChildren` branches, optional virtualization, connector lines, drag-to-reorder,
 * and custom node templates via `[pixelTreeNodeDef]`.
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
  host: {
    class: 'pixel-tree',
    '[class.pixel-tree--connectors]': 'showConnectors()',
    '[class.pixel-tree--virtual]': 'virtualScroll()',
    '[class.pixel-tree--dragging]': 'dragNodeId() !== null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTreeComponent<T = any> {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
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

  /**
   * Renders only the visible row window (fixed-height windowing over the flat list).
   *
   * @type {boolean}
   * @default false
   * @description Use for large expanded trees (10k+ visible rows). Pair with `virtualHeight`.
   */
  readonly virtualScroll = input(false, { transform: booleanAttribute });

  /**
   * Fixed row stride in px for virtualization.
   *
   * @type {number}
   * @default 0
   * @description `0` derives from the component token defaults (node block-size + row gap).
   */
  readonly rowHeight = input(0, { transform: numberAttribute });

  /**
   * Scroll viewport height in px when `virtualScroll` is enabled.
   *
   * @type {number}
   * @default 480
   */
  readonly virtualHeight = input(480, { transform: numberAttribute });

  /**
   * Extra rows rendered above/below the viewport to smooth fast scrolling.
   *
   * @type {number}
   * @default 8
   */
  readonly virtualOverscan = input(8, { transform: numberAttribute });

  /**
   * Draws ancestor connector lines in the indent gutter (hierarchy guide lines).
   *
   * @type {boolean}
   * @default false
   * @description When enabled, each row renders L-shaped branch guides instead of plain
   * padding indentation — useful for org charts, file trees, and reorderable task lists.
   */
  readonly showConnectors = input(false, { transform: booleanAttribute });

  /**
   * Enables drag-to-reorder among sibling nodes (HTML5 drag on the handle).
   *
   * @type {boolean}
   * @default false
   * @description Emits `nodeReorder`; the consumer updates `nodes`. Drops are limited to
   * siblings at the same level.
   */
  readonly reorderable = input(false, { transform: booleanAttribute });

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

  /** Emits when the user drops a dragged node onto a sibling target. */
  readonly nodeReorder = output<PixelTreeNodeReorderEvent<T>>();

  private readonly loadedChildren = signal<ReadonlyMap<PixelTreeNodeId, readonly PixelTreeNode<T>[]>>(
    new Map(),
  );
  private readonly loadingIds = signal<ReadonlySet<PixelTreeNodeId>>(new Set());
  protected readonly activeId = signal<PixelTreeNodeId | null>(null);
  private lastSource: PixelTreeInteractionSource = 'mouse';

  private readonly scrollerRef = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly scrollTop = signal(0);
  private readonly viewportHeight = signal(0);
  private resizeObserver?: ResizeObserver;

  protected readonly dragNodeId = signal<PixelTreeNodeId | null>(null);
  protected readonly dropTarget = signal<{ id: PixelTreeNodeId; position: PixelTreeReorderPosition } | null>(
    null,
  );
  private dragPreviewSession: PixelTreeDragPreviewSession | null = null;

  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly expandedSet = computed(() => new Set(this.expandedIds()));
  private readonly selectedSet = computed(() => new Set(this.selectedIds()));

  constructor() {
    afterNextRender(() => {
      const scroller = this.scrollerRef()?.nativeElement;
      if (!scroller || typeof ResizeObserver === 'undefined') {
        return;
      }
      this.viewportHeight.set(scroller.clientHeight);
      this.resizeObserver = new ResizeObserver(() => {
        this.viewportHeight.set(scroller.clientHeight);
      });
      this.resizeObserver.observe(scroller);
      this.destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
    });
    this.destroyRef.onDestroy(() => {
      if (this.typeaheadTimer) {
        clearTimeout(this.typeaheadTimer);
      }
    });
  }

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

    const walk = (
      nodes: readonly PixelTreeNode<T>[],
      level: number,
      ancestorContinues: readonly boolean[],
    ) => {
      nodes.forEach((node, index) => {
        const expandable = this.isExpandable(node);
        const isExpanded = expandable && expanded.has(node.id);
        const isLastChild = index === nodes.length - 1;
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
          isLastChild,
          ancestorContinues,
        });
        if (isExpanded) {
          walk(this.childrenOf(node), level + 1, [...ancestorContinues, !isLastChild]);
        }
      });
    };
    walk(this.nodes(), 1, []);
    return rows;
  });

  protected readonly effectiveRowHeight = computed(
    () => this.rowHeight() || DEFAULT_ROW_STRIDE_PX,
  );

  private readonly virtualRange = computed(() => {
    const rowHeight = this.effectiveRowHeight();
    const total = this.flatRows().length;
    const overscan = this.virtualOverscan();
    const start = Math.max(0, Math.floor(this.scrollTop() / rowHeight) - overscan);
    const visible = Math.ceil(this.viewportHeight() / rowHeight) + overscan * 2;
    const end = Math.min(total, start + visible);
    return { start, end };
  });

  /** Rows rendered in the template — the full flat list or the virtual window. */
  protected readonly displayRows = computed(() => {
    const rows = this.flatRows();
    if (!this.virtualScroll()) {
      return rows;
    }
    const { start, end } = this.virtualRange();
    return rows.slice(start, end);
  });

  protected readonly viewStartIndex = computed(() =>
    this.virtualScroll() ? this.virtualRange().start : 0,
  );

  protected readonly topSpacerHeight = computed(() =>
    this.virtualScroll() ? this.virtualRange().start * this.effectiveRowHeight() : 0,
  );

  protected readonly bottomSpacerHeight = computed(() => {
    if (!this.virtualScroll()) {
      return 0;
    }
    const { end } = this.virtualRange();
    return (this.flatRows().length - end) * this.effectiveRowHeight();
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

  protected onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.scrollTop.set(el.scrollTop);
    if (this.viewportHeight() !== el.clientHeight) {
      this.viewportHeight.set(el.clientHeight);
    }
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

  private expandSiblings(row: PixelTreeFlatRow<T>): void {
    const parent = this.parentMap().get(row.node.id);
    const siblings = parent ? this.childrenOf(parent) : this.nodes();
    const expanded = new Set(this.expandedIds());
    let changed = false;
    for (const sibling of siblings) {
      if (this.isExpandable(sibling) && !expanded.has(sibling.id)) {
        expanded.add(sibling.id);
        changed = true;
        this.maybeLoadChildren(sibling);
      }
    }
    if (changed) {
      this.expandedIds.set([...expanded]);
    }
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

  // ---- drag reorder ----

  private parentIdOf(nodeId: PixelTreeNodeId): PixelTreeNodeId | null {
    return this.parentMap().get(nodeId)?.id ?? null;
  }

  private canDropOn(sourceId: PixelTreeNodeId, target: PixelTreeFlatRow<T>): boolean {
    if (sourceId === target.node.id) {
      return false;
    }
    return this.parentIdOf(sourceId) === this.parentIdOf(target.node.id);
  }

  protected onDragStart(row: PixelTreeFlatRow<T>, event: DragEvent): void {
    if (!this.reorderable() || row.node.disabled) {
      event.preventDefault();
      return;
    }
    this.dragNodeId.set(row.node.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(row.node.id));
    }
    const handle = event.currentTarget as HTMLElement | null;
    const rowEl = handle?.closest<HTMLElement>('[role="treeitem"]');
    if (rowEl) {
      this.stopDragPreview();
      this.dragPreviewSession = startTreeRowDragPreview(event, rowEl, this.hostRef.nativeElement);
    }
  }

  protected onDragOver(row: PixelTreeFlatRow<T>, event: DragEvent): void {
    const sourceId = this.dragNodeId();
    if (!this.reorderable() || sourceId === null || !this.canDropOn(sourceId, row)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const position: PixelTreeReorderPosition =
      event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    const current = this.dropTarget();
    if (current?.id !== row.node.id || current.position !== position) {
      this.dropTarget.set({ id: row.node.id, position });
    }
  }

  protected onDrop(row: PixelTreeFlatRow<T>, event: DragEvent): void {
    event.preventDefault();
    const sourceId = this.dragNodeId();
    const target = this.dropTarget();
    if (sourceId === null || !target || !this.canDropOn(sourceId, row)) {
      this.endDrag();
      return;
    }
    const sourceRow = this.flatRows().find((candidate) => candidate.node.id === sourceId);
    if (!sourceRow) {
      this.endDrag();
      return;
    }
    this.nodeReorder.emit({
      node: sourceRow.node,
      targetNode: row.node,
      position: target.position,
      source: 'mouse',
    });
    this.endDrag();
  }

  protected onDragLeave(row: PixelTreeFlatRow<T>, event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    const current = event.currentTarget as HTMLElement;
    if (related && current.contains(related)) {
      return;
    }
    if (this.dropTarget()?.id === row.node.id) {
      this.dropTarget.set(null);
    }
  }

  protected onDragEnd(): void {
    this.endDrag();
  }

  protected isDropTarget(row: PixelTreeFlatRow<T>): boolean {
    return this.dropTarget()?.id === row.node.id;
  }

  private endDrag(): void {
    this.dragNodeId.set(null);
    this.dropTarget.set(null);
    this.stopDragPreview();
  }

  private stopDragPreview(): void {
    this.dragPreviewSession?.cleanup();
    this.dragPreviewSession = null;
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

    if (this.handleTypeahead(event, rows, index)) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusRow(rows[index + 1], rows);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusRow(rows[index - 1], rows);
        break;
      case 'Home':
        event.preventDefault();
        this.focusRow(rows[0], rows);
        break;
      case 'End':
        event.preventDefault();
        this.focusRow(rows[rows.length - 1], rows);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (row.expandable && !row.expanded) {
          this.toggleNode(row.node, 'keyboard');
        } else if (row.expanded) {
          this.focusRow(rows[index + 1], rows);
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
          this.focusRow(
            rows.find((candidate) => candidate.node.id === parent.id),
            rows,
          );
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
      case '*':
        event.preventDefault();
        this.expandSiblings(row);
        break;
    }
  }

  private handleTypeahead(
    event: KeyboardEvent,
    rows: PixelTreeFlatRow<T>[],
    startIndex: number,
  ): boolean {
    const char = event.key;
    if (
      char.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      char === ' ' ||
      char === '*'
    ) {
      return false;
    }

    event.preventDefault();
    this.typeaheadBuffer += char.toLowerCase();
    if (this.typeaheadTimer) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, TYPEAHEAD_RESET_MS);

    const search = this.typeaheadBuffer;
    const ordered = [...rows.slice(startIndex + 1), ...rows.slice(0, startIndex + 1)];
    const match = ordered.find((candidate) =>
      candidate.node.label.toLowerCase().startsWith(search),
    );
    if (match) {
      this.focusRow(match, rows);
    }
    return true;
  }

  private focusRow(target: PixelTreeFlatRow<T> | undefined, rows: PixelTreeFlatRow<T>[]): void {
    if (!target) {
      return;
    }
    const index = rows.findIndex((row) => row.node.id === target.node.id);
    if (index >= 0) {
      this.scrollRowIndexIntoView(index);
    }
    this.activeId.set(target.node.id);
    const domId = this.rowDomId(target.node.id);
    const el = Array.from(
      this.hostRef.nativeElement.querySelectorAll<HTMLElement>('[role="treeitem"]'),
    ).find((candidate) => candidate.id === domId);
    el?.focus();
  }

  private scrollRowIndexIntoView(index: number): void {
    if (!this.virtualScroll()) {
      return;
    }
    const scroller = this.scrollerRef()?.nativeElement;
    if (!scroller) {
      return;
    }
    const rowHeight = this.effectiveRowHeight();
    const rowTop = index * rowHeight;
    const rowBottom = rowTop + rowHeight;
    const { scrollTop, clientHeight } = scroller;
    if (rowTop < scrollTop) {
      scroller.scrollTop = rowTop;
    } else if (rowBottom > scrollTop + clientHeight) {
      scroller.scrollTop = rowBottom - clientHeight;
    }
    this.scrollTop.set(scroller.scrollTop);
  }

  protected onRowFocus(row: PixelTreeFlatRow<T>): void {
    this.activeId.set(row.node.id);
  }
}
