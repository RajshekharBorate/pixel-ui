import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelToggleComponent from '../pixel-toggle/pixel-toggle';
import type { PixelToggleOption } from '../pixel-toggle/pixel-toggle.types';
import { isGroupEmptyInvalid } from './pixel-query-builder.validator';
import { injectPixelQueryBuilderStore } from './pixel-query-builder.store';
import { toQueryButtonSize, toQueryToggleSize } from './pixel-query-builder-size';
import type { PixelQueryBuilderSize, PixelQueryCondition, PixelQueryNode } from './pixel-query-builder.types';
import { isQueryGroup } from './pixel-query-builder.utils';
import { startQueryDragPreview, type PixelQueryDragPreviewSession } from './pixel-query-builder-drag-preview';
import PixelQueryRuleComponent from './pixel-query-rule';

@Component({
  selector: 'pixel-query-group',
  imports: [
    PixelQueryRuleComponent,
    PixelQueryGroupComponent,
    PixelTooltipDirective,
    PixelButtonComponent,
    PixelToggleComponent,
  ],
  templateUrl: './pixel-query-group.html',
  styleUrl: './pixel-query-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-query-group',
    role: 'group',
    '[attr.data-depth]': 'depth()',
    '[class.pixel-query-group--root]': 'isRoot()',
    '[class.pixel-query-group--nested]': '!isRoot()',
    '[class.pixel-query-group--collapsed]': 'collapsed()',
    '[class.pixel-query-group--invalid]': 'showEmptyError()',
    '[class.pixel-query-group--dragging]': 'dragFromIndex() !== null',
    '[attr.aria-invalid]': 'showEmptyError() ? "true" : null',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export default class PixelQueryGroupComponent {
  protected readonly store = injectPixelQueryBuilderStore();

  protected readonly logicOptions: readonly PixelToggleOption[] = [
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ];

  readonly groupId = input.required<string>();
  readonly depth = input(0);
  readonly isRoot = input(false, { transform: booleanAttribute });
  readonly size = input<PixelQueryBuilderSize>('md');

  protected readonly collapsed = signal(false);
  protected readonly dragFromIndex = signal<number | null>(null);
  protected readonly dragSourceKind = signal<'rule' | 'ruleset' | null>(null);
  protected readonly dropTargetIndex = signal<number | null>(null);
  private dragPreviewSession: PixelQueryDragPreviewSession | null = null;

  protected readonly group = computed(() => this.store.groupById(this.groupId()));
  protected readonly condition = computed(() => this.group()?.condition ?? 'and');
  protected readonly conditionLabel = computed(() => (this.condition() === 'and' ? 'AND' : 'OR'));
  protected readonly canNest = computed(() => this.store.canNest(this.groupId()));
  protected readonly nodes = computed(() => this.group()?.rules ?? []);
  protected readonly showEmptyError = computed(() => {
    const validation = this.store.validation();
    if (this.isRoot()) {
      return validation.empty && !(this.store.config().allowEmpty ?? false);
    }
    return isGroupEmptyInvalid(this.groupId(), validation);
  });
  protected readonly ariaLabel = computed(() =>
    `${this.conditionLabel()} ruleset, level ${this.depth() + 1}`,
  );

  protected readonly addRuleLabel = computed(() =>
    stripLeadingPlus(this.store.config().messages?.addRule ?? 'Rule'),
  );
  protected readonly addRulesetLabel = computed(() =>
    stripLeadingPlus(this.store.config().messages?.addRuleset ?? 'Ruleset'),
  );
  protected readonly collapseTooltip = computed(() => {
    const target = this.isRoot() ? 'query' : 'ruleset';
    return this.collapsed() ? `Expand ${target}` : `Collapse ${target}`;
  });
  protected readonly addRuleTooltip = computed(() => `Add ${this.addRuleLabel()}`);
  protected readonly addRulesetTooltip = computed(() => `Add ${this.addRulesetLabel()}`);
  protected readonly removeRulesetTooltip = 'Remove ruleset';
  protected readonly dragTooltip = 'Drag to reorder';
  protected readonly buttonSize = computed(() => toQueryButtonSize(this.size()));
  protected readonly toggleSize = computed(() => toQueryToggleSize(this.size()));
  protected readonly emptyGroupMessage = computed(
    () => this.store.config().messages?.emptyGroup ?? 'A ruleset cannot be empty.',
  );

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  protected addRule(): void {
    this.store.addRule(this.groupId());
    this.collapsed.set(false);
  }

  protected addNestedGroup(): void {
    this.store.addGroup(this.groupId());
    this.collapsed.set(false);
  }

  protected setCondition(condition: PixelQueryCondition): void {
    if (this.store.disabled() || this.store.readOnly()) {
      return;
    }
    this.store.setCondition(this.groupId(), condition);
  }

  protected onLogicChange(value: string | number): void {
    if (value === 'and' || value === 'or') {
      this.setCondition(value);
    }
  }

  protected removeGroup(): void {
    if (this.isRoot()) {
      return;
    }
    this.store.removeNode(this.groupId());
  }

  protected isGroupNode(node: PixelQueryNode): boolean {
    return isQueryGroup(node);
  }

  protected isInteractiveDisabled(): boolean {
    return this.store.disabled() || this.store.readOnly();
  }

  protected onNodeDragStart(event: DragEvent, index: number): void {
    if (this.isInteractiveDisabled()) {
      event.preventDefault();
      return;
    }
    this.dragFromIndex.set(index);
    const draggedNode = this.nodes()[index];
    this.dragSourceKind.set(draggedNode && isQueryGroup(draggedNode) ? 'ruleset' : 'rule');
    event.dataTransfer?.setData('text/plain', String(index));
    if (!event.dataTransfer) {
      return;
    }
    event.dataTransfer.effectAllowed = 'move';

    const handle = event.currentTarget as HTMLElement | null;
    const node = handle?.closest('.pixel-query-group__node') as HTMLElement | null;
    if (!node) {
      return;
    }

    this.stopDragPreview();
    this.dragPreviewSession = startQueryDragPreview(event, node);
  }

  protected onNodeDragOver(event: DragEvent, index: number): void {
    if (this.dragFromIndex() === null || this.isInteractiveDisabled()) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dropTargetIndex.set(index);
  }

  protected onNodeDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    const current = event.currentTarget as HTMLElement | null;
    if (current && related && current.contains(related)) {
      return;
    }
    this.dropTargetIndex.set(null);
  }

  protected onNodeDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    const fromIndex = this.dragFromIndex();
    if (fromIndex === null || fromIndex === index || this.isInteractiveDisabled()) {
      this.stopDragPreview();
      this.clearDragState();
      return;
    }
    this.store.moveNode(this.groupId(), fromIndex, index);
    this.stopDragPreview();
    this.clearDragState();
  }

  protected onDragEnd(): void {
    this.stopDragPreview();
    this.clearDragState();
  }

  private stopDragPreview(): void {
    this.dragPreviewSession?.cleanup();
    this.dragPreviewSession = null;
  }

  private clearDragState(): void {
    this.dragFromIndex.set(null);
    this.dragSourceKind.set(null);
    this.dropTargetIndex.set(null);
  }
}

function stripLeadingPlus(label: string): string {
  return label.replace(/^\+\s*/, '').trim();
}
