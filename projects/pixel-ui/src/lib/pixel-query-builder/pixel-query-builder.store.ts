import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  PixelQueryBuilderConfig,
  PixelQueryCondition,
  PixelQueryGroup,
  PixelQueryRule,
} from './pixel-query-builder.types';
import {
  addQueryGroup,
  addQueryRule,
  cloneQueryTree,
  createEmptyQuery,
  createQueryRule,
  exportQuery,
  findQueryGroup,
  findQueryRule,
  isQueryGroup,
  moveQueryRule,
  removeQueryNode,
  setQueryCondition,
  updateQueryRule,
} from './pixel-query-builder.utils';
import { queryToSummary, validateQuery } from './pixel-query-builder.validator';

/**
 * Signal-backed immutable store for the query tree. Provided by `pixel-query-builder` and
 * injected into recursive child components.
 */
@Injectable()
export class PixelQueryBuilderStore {
  readonly config = signal<PixelQueryBuilderConfig>({ fields: {} });
  readonly query = signal<PixelQueryGroup>(createEmptyQuery());
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly maxDepth = signal(3);

  readonly validation = computed(() => validateQuery(this.query(), this.config()));
  readonly valid = computed(() => this.validation().valid);
  readonly summary = computed(() => queryToSummary(this.query(), this.config()));
  readonly exported = computed(() => exportQuery(this.query()));
  readonly ruleCount = computed(() => countRules(this.query()));

  private queryChangeListener: (() => void) | undefined;

  /** Registers a synchronous listener fired after every query-tree mutation. */
  listenQueryChanges(listener: () => void): void {
    this.queryChangeListener = listener;
  }

  private emitQueryChange(): void {
    this.queryChangeListener?.();
  }

  configure(config: PixelQueryBuilderConfig): void {
    this.config.set(config);
    if (config.maxDepth != null) {
      this.maxDepth.set(config.maxDepth);
    }
  }

  setQuery(query: PixelQueryGroup): void {
    const normalized = cloneQueryTree(query);
    if (queriesEqualByExport(this.query(), normalized)) {
      return;
    }
    this.query.set(normalized);
  }

  /** Replaces the query tree and notifies form / output listeners. */
  loadQuery(query: PixelQueryGroup): void {
    const normalized = cloneQueryTree(query);
    if (queriesEqualByExport(this.query(), normalized)) {
      return;
    }
    this.query.set(normalized);
    this.emitQueryChange();
  }

  private commitQuery(mutator: (root: PixelQueryGroup) => PixelQueryGroup): void {
    this.query.update(mutator);
    this.emitQueryChange();
  }

  setDisabled(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly.set(readOnly);
  }

  addRule(groupId: string, rule?: PixelQueryRule): void {
    if (this.readOnly() || this.disabled()) {
      return;
    }
    this.commitQuery((root) => addQueryRule(root, groupId, rule ?? createQueryRule()));
  }

  addGroup(groupId: string): void {
    if (this.readOnly() || this.disabled()) {
      return;
    }
    const depth = getDepth(this.query(), groupId);
    if (depth >= this.maxDepth() - 1) {
      return;
    }
    this.commitQuery((root) => addQueryGroup(root, groupId));
  }

  removeNode(nodeId: string): void {
    if (this.readOnly() || this.disabled()) {
      return;
    }
    this.commitQuery((root) => removeQueryNode(root, nodeId));
  }

  setCondition(groupId: string, condition: PixelQueryCondition): void {
    if (this.readOnly() || this.disabled()) {
      return;
    }
    this.commitQuery((root) => setQueryCondition(root, groupId, condition));
  }

  patchRule(ruleId: string, patch: Partial<Omit<PixelQueryRule, 'id'>>): void {
    if (this.readOnly() || this.disabled()) {
      return;
    }
    this.commitQuery((root) => updateQueryRule(root, ruleId, patch));
  }

  moveRule(groupId: string, fromIndex: number, toIndex: number): void {
    this.moveNode(groupId, fromIndex, toIndex);
  }

  moveNode(groupId: string, fromIndex: number, toIndex: number): void {
    if (this.readOnly() || this.disabled()) {
      return;
    }
    this.commitQuery((root) => moveQueryRule(root, groupId, fromIndex, toIndex));
  }

  groupById(groupId: string): PixelQueryGroup | null {
    return findQueryGroup(this.query(), groupId);
  }

  ruleById(ruleId: string): PixelQueryRule | null {
    return findQueryRule(this.query(), ruleId);
  }

  canNest(groupId: string): boolean {
    return getDepth(this.query(), groupId) < this.maxDepth() - 1;
  }
}

function queriesEqualByExport(a: PixelQueryGroup, b: PixelQueryGroup): boolean {
  return JSON.stringify(exportQuery(a)) === JSON.stringify(exportQuery(b));
}

function countRules(group: PixelQueryGroup): number {
  return group.rules.reduce((total, child) => {
    if (isQueryGroup(child)) {
      return total + countRules(child);
    }
    return total + 1;
  }, 0);
}

function getDepth(root: PixelQueryGroup, groupId: string, depth = 0): number {
  if (root.id === groupId) {
    return depth;
  }
  for (const child of root.rules) {
    if (isQueryGroup(child)) {
      const found = getDepth(child, groupId, depth + 1);
      if (found >= 0) {
        return found;
      }
    }
  }
  return -1;
}

/** Convenience inject helper for child components. */
export function injectPixelQueryBuilderStore(): PixelQueryBuilderStore {
  return inject(PixelQueryBuilderStore);
}
