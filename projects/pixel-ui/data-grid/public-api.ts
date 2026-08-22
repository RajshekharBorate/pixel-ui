/**
 * Preferred import path: `import { … } from 'pixel-ui/data-grid'`
 * (workspace tsconfig path). Primary `pixel-ui` barrel re-exports the same surface —
 * ng-packagr secondary compilation is blocked by an Angular compiler bug.
 */
export { default as PixelDataGridComponent } from '../src/lib/pixel-data-grid/pixel-data-grid';
export { default as PixelDataGridCellDirective } from '../src/lib/pixel-data-grid/pixel-data-grid-cell.directive';
export type { PixelDataGridCellContext } from '../src/lib/pixel-data-grid/pixel-data-grid-cell.directive';
export { default as PixelDataGridCellOverflowDirective } from '../src/lib/pixel-data-grid/pixel-data-grid-cell-overflow.directive';
export { default as PixelDataGridCellRowDirective } from '../src/lib/pixel-data-grid/pixel-data-grid-cell-row.directive';
export { default as PixelDataGridDetailDirective } from '../src/lib/pixel-data-grid/pixel-data-grid-detail.directive';
export type { PixelDataGridDetailContext } from '../src/lib/pixel-data-grid/pixel-data-grid-detail.directive';
export { default as PixelDataGridEditorDirective } from '../src/lib/pixel-data-grid/pixel-data-grid-editor.directive';
export type { PixelDataGridEditorContext } from '../src/lib/pixel-data-grid/pixel-data-grid-editor.directive';
export {
  PixelDataGridStore,
  injectPixelDataGridStore,
} from '../src/lib/pixel-data-grid/pixel-data-grid.store';
export {
  DEFAULT_PIXEL_DATA_GRID_LABELS,
  PIXEL_DATA_GRID_DEFAULT_OPERATORS,
  PIXEL_DATA_GRID_OPERATOR_LABELS,
  aggregateGridColumns,
  buildGroupedRenderRows,
  collectGridGroupKeys,
  compareGridValues,
  computeGridAggregate,
  cycleGridSort,
  filterGridRows,
  formatGridCell,
  formatLabel,
  gridHasAggregates,
  gridHeaderLabel,
  gridOperatorsFor,
  gridRangeLabel,
  gridRenderRowKey,
  gridRowsToDelimited,
  gridRowsToJson,
  gridStateToJson,
  isValuelessGridOperator,
  matchesGridFilter,
  mergePixelDataGridLabels,
  paginateGridRows,
  parseGridColumnWidth,
  parseGridState,
  sortGridRows,
  toGridExportColumns,
  triggerGridDownload,
} from '../src/lib/pixel-data-grid/pixel-data-grid.utils';
export type { FormatGridCellOptions } from '../src/lib/pixel-data-grid/pixel-data-grid.utils';
export type {
  PixelDataGridAggregator,
  PixelDataGridAggregatorName,
  PixelDataGridAlign,
  PixelDataGridCellEditEvent,
  PixelDataGridColumn,
  PixelDataGridColumnFilter,
  PixelDataGridColumnOverflow,
  PixelDataGridColumnState,
  PixelDataGridColumnType,
  PixelDataGridCriteria,
  PixelDataGridDataRow,
  PixelDataGridDataSource,
  PixelDataGridDensity,
  PixelDataGridLoadingMode,
  PixelDataGridDetailRow,
  PixelDataGridEditorType,
  PixelDataGridExportFormat,
  PixelDataGridExportScope,
  PixelDataGridFetchResult,
  PixelDataGridFilterOperator,
  PixelDataGridFilterOption,
  PixelDataGridFilterState,
  PixelDataGridFilterType,
  PixelDataGridFilterValue,
  PixelDataGridGroupRow,
  PixelDataGridLabels,
  PixelDataGridPageEvent,
  PixelDataGridPinSide,
  PixelDataGridRenderRow,
  PixelDataGridRow,
  PixelDataGridRowClickEvent,
  PixelDataGridRowId,
  PixelDataGridSelectionMode,
  PixelDataGridSortDescriptor,
  PixelDataGridSortDirection,
  PixelDataGridSortEvent,
  PixelDataGridState,
  PixelDataGridValueFormatter,
} from '../src/lib/pixel-data-grid/pixel-data-grid.types';
