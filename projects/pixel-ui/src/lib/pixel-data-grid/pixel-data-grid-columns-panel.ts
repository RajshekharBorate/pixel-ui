import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import PixelCheckboxComponent from '../pixel-checkbox/pixel-checkbox';
import { injectPixelDataGridStore } from './pixel-data-grid.store';
import type { PixelDataGridColumn, PixelDataGridPinSide } from './pixel-data-grid.types';
import { gridHeaderLabel } from './pixel-data-grid.utils';

/** Payload for the {@link PixelDataGridColumnsPanelComponent.pinChange} output. */
export interface PixelDataGridColumnsPanelPinEvent<T = any> {
  readonly column: PixelDataGridColumn<T>;
  readonly side: PixelDataGridPinSide | null;
}

/** Payload for the {@link PixelDataGridColumnsPanelComponent.reorder} output. */
export interface PixelDataGridColumnsPanelReorderEvent {
  readonly field: string;
  readonly targetField: string;
  readonly after: boolean;
}

/**
 * Central column-management panel hosted in `pixel-data-grid`'s "Manage columns" drawer. Lists
 * every chooser-eligible column with a visibility toggle, optional pin controls, and drag-to-reorder.
 * Layout Save / Restore / Clear actions live in the host drawer's `pixelDrawerFooter` slot so they
 * stay pinned on mobile. It's always rendered inside the host grid's own injector, so it reads the
 * shared {@link PixelDataGridStore} directly for display — but every mutation is emitted as an
 * output so the host grid stays the single place that mutates the store and fires its own
 * `stateChange` / `columnVisibilityChange` outputs.
 */
@Component({
  selector: 'pixel-data-grid-columns-panel',
  imports: [PixelCheckboxComponent],
  templateUrl: './pixel-data-grid-columns-panel.html',
  styleUrl: './pixel-data-grid-columns-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelDataGridColumnsPanelComponent<T = any> {
  private readonly store = injectPixelDataGridStore<T>();

  /** Shows pin-left / pin-right controls per row. */
  readonly pinnable = input(false);

  readonly toggleVisibility = output<PixelDataGridColumn<T>>();
  readonly pinChange = output<PixelDataGridColumnsPanelPinEvent<T>>();
  readonly reorder = output<PixelDataGridColumnsPanelReorderEvent>();

  protected readonly columns = computed(() => this.store.chooserColumns());

  /** Transient drag-reorder state (mirrors the header reorder mechanism, adapted to a vertical list). */
  protected readonly dragField = signal<string | null>(null);
  protected readonly dropTarget = signal<{ field: string; after: boolean } | null>(null);

  protected headerLabel(column: PixelDataGridColumn<T>): string {
    return gridHeaderLabel(column);
  }

  protected isHidden(column: PixelDataGridColumn<T>): boolean {
    return this.store.isColumnHidden(column);
  }

  protected pinSide(column: PixelDataGridColumn<T>): PixelDataGridPinSide | null {
    return this.store.columnPin(column);
  }

  // ── Drag-to-reorder (vertical list) ────────────────────────────────────────────────────────
  protected onDragStart(column: PixelDataGridColumn<T>, event: DragEvent): void {
    this.dragField.set(column.field);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column.field);
    }
  }

  protected onDragOver(column: PixelDataGridColumn<T>, event: DragEvent): void {
    if (!this.dragField() || this.dragField() === column.field) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    this.dropTarget.set({ field: column.field, after });
  }

  protected onDrop(column: PixelDataGridColumn<T>, event: DragEvent): void {
    event.preventDefault();
    const from = this.dragField();
    const target = this.dropTarget();
    if (from && target) {
      this.reorder.emit({ field: from, targetField: target.field, after: target.after });
    }
    this.endDrag();
  }

  protected onDragEnd(): void {
    this.endDrag();
  }

  private endDrag(): void {
    this.dragField.set(null);
    this.dropTarget.set(null);
  }

  protected isDropBefore(column: PixelDataGridColumn<T>): boolean {
    const target = this.dropTarget();
    return !!target && target.field === column.field && !target.after && this.dragField() !== column.field;
  }

  protected isDropAfter(column: PixelDataGridColumn<T>): boolean {
    const target = this.dropTarget();
    return !!target && target.field === column.field && target.after && this.dragField() !== column.field;
  }
}
