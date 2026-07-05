/*
 * Public API Surface of pixel-ui
 */

export { default as PixelButtonComponent } from './lib/pixel-button/pixel-button';
export { default as PixelSliderComponent } from './lib/pixel-slider/pixel-slider';
export { default as PixelTimepickerComponent } from './lib/pixel-timepicker/pixel-timepicker';
export { default as PixelPaginatorComponent } from './lib/pixel-paginator/pixel-paginator';
export { default as PixelFileUploadComponent } from './lib/pixel-file-upload/pixel-file-upload';
export type {
  PixelFileRejection,
  PixelFileSelectEvent,
  PixelFileUploadSize,
  PixelFileUploadValidationMessages,
  PixelFileUploadVariant,
  PixelUploadedFile,
} from './lib/pixel-file-upload/pixel-file-upload.types';
export type {
  PixelPageEvent,
  PixelPageItem,
  PixelPaginatorButtonShape,
  PixelPaginatorSize,
  PixelPaginatorVariant,
} from './lib/pixel-paginator/pixel-paginator';
export type {
  PixelTimepickerChange,
  PixelTimepickerFormat,
  PixelTimepickerLabelPosition,
  PixelTimepickerOpenDirection,
  PixelTimepickerSize,
  PixelTimepickerValidationMessages,
  PixelTimepickerVariant,
  PixelTimeParts,
} from './lib/pixel-timepicker/pixel-timepicker.types';
export type {
  PixelSliderLabelPosition,
  PixelSliderMode,
  PixelSliderSize,
  PixelSliderValidationMessages,
  PixelSliderValue,
} from './lib/pixel-slider/pixel-slider';
export { default as PixelCheckboxComponent } from './lib/pixel-checkbox/pixel-checkbox';
export { default as PixelToggleComponent } from './lib/pixel-toggle/pixel-toggle';
export { default as PixelToggleCheckedIconDirective } from './lib/pixel-toggle/pixel-toggle-checked-icon';
export { default as PixelToggleUncheckedIconDirective } from './lib/pixel-toggle/pixel-toggle-unchecked-icon';
export { default as PixelToggleThumbIconComponent } from './lib/pixel-toggle/pixel-toggle-thumb-icon';
export { default as PixelInputComponent } from './lib/pixel-input/pixel-input';
export { default as PixelSelectComponent } from './lib/pixel-select/pixel-select';
export { default as PixelAutocompleteComponent } from './lib/pixel-autocomplete/pixel-autocomplete';
export type {
  PixelAutocompleteGroup,
  PixelAutocompleteInteractionSource,
  PixelAutocompleteLabelPosition,
  PixelAutocompleteOpenDirection,
  PixelAutocompleteOption,
  PixelAutocompletePanelWidthMode,
  PixelAutocompleteScrollBehavior,
  PixelAutocompleteSelectionChange,
  PixelAutocompleteSize,
  PixelAutocompleteValidationMessages,
} from './lib/pixel-autocomplete/pixel-autocomplete';
export { default as PixelRadioComponent } from './lib/pixel-radio/pixel-radio';
export { default as PixelRadioGroupComponent } from './lib/pixel-radio/pixel-radio-group';
export { default as PixelToastComponent } from './lib/pixel-toast/pixel-toast';
export { default as PixelToastContainerComponent } from './lib/pixel-toast/pixel-toast-container';
export { default as PixelToastInlineComponent } from './lib/pixel-toast/pixel-toast-inline';
export { default as PixelChipComponent } from './lib/pixel-chip/pixel-chip';
export { default as PixelChipSetComponent } from './lib/pixel-chip/pixel-chip-set';
export { default as PixelDividerComponent } from './lib/pixel-divider/pixel-divider';
export type {
  PixelDividerLabelAlign,
  PixelDividerOrientation,
  PixelDividerVariant,
} from './lib/pixel-divider/pixel-divider';
export { default as PixelTooltipDirective } from './lib/pixel-tooltip/pixel-tooltip';
export type {
  PixelTooltipPosition,
  PixelTooltipTheme,
  PixelTooltipTrigger,
} from './lib/pixel-tooltip/pixel-tooltip';
export { default as PixelMenuComponent } from './lib/pixel-menu/pixel-menu';
export type { PixelMenuXPosition, PixelMenuYPosition } from './lib/pixel-menu/pixel-menu';
export { default as PixelMenuItemComponent } from './lib/pixel-menu/pixel-menu-item';
export type { PixelMenuItemLink, PixelMenuItemIconColor } from './lib/pixel-menu/pixel-menu-item';
export { default as PixelMenuTriggerDirective } from './lib/pixel-menu/pixel-menu-trigger';
export { default as PixelDialogComponent } from './lib/pixel-dialog/pixel-dialog';
export type {
  PixelDialogSize,
  PixelDialogPosition,
  PixelDialogRole,
} from './lib/pixel-dialog/pixel-dialog';
export { default as PixelConfirmDialogComponent } from './lib/pixel-dialog/pixel-confirm-dialog';
export { PixelDialogService } from './lib/pixel-dialog/pixel-dialog.service';
export { PixelDialogRef } from './lib/pixel-dialog/pixel-dialog-ref';
export { PIXEL_DIALOG_DATA } from './lib/pixel-dialog/pixel-dialog.types';
export type { PixelDialogConfig } from './lib/pixel-dialog/pixel-dialog.types';
export { default as PixelDrawerComponent } from './lib/pixel-drawer/pixel-drawer';
export type { PixelDrawerPosition, PixelDrawerSize } from './lib/pixel-drawer/pixel-drawer';
export { PixelDrawerService } from './lib/pixel-drawer/pixel-drawer.service';
export { PixelDrawerRef } from './lib/pixel-drawer/pixel-drawer-ref';
export { PIXEL_DRAWER_DATA } from './lib/pixel-drawer/pixel-drawer.types';
export type { PixelDrawerConfig } from './lib/pixel-drawer/pixel-drawer.types';
export { default as PixelTabsComponent } from './lib/pixel-tabs/pixel-tabs';
export type { PixelTabsAlign, PixelTabsAppearance } from './lib/pixel-tabs/pixel-tabs';
export { default as PixelTabComponent } from './lib/pixel-tabs/pixel-tab';
export { default as PixelTabLabelDirective } from './lib/pixel-tabs/pixel-tab-label';
export { default as PixelTabNavComponent } from './lib/pixel-tabs/pixel-tab-nav';
export { default as PixelTabLinkComponent } from './lib/pixel-tabs/pixel-tab-link';
export type { PixelTabNavConfig } from './lib/pixel-tabs/pixel-tab-nav.token';
export { PIXEL_TAB_NAV } from './lib/pixel-tabs/pixel-tab-nav.token';
export { default as PixelAccordionComponent } from './lib/pixel-accordion/pixel-accordion';
export type { PixelAccordionVariant, PixelAccordionSize } from './lib/pixel-accordion/pixel-accordion';
export { default as PixelExpansionPanelComponent } from './lib/pixel-accordion/pixel-expansion-panel';
export type {
  PixelExpansionPanelVariant,
  PixelExpansionPanelSize,
} from './lib/pixel-accordion/pixel-expansion-panel';
export { default as PixelDatepickerComponent } from './lib/pixel-datepicker/pixel-datepicker';
export type {
  PixelDatepickerDateClassFn,
  PixelDatepickerDateFilterFn,
  PixelDatepickerLabelPosition,
  PixelDatepickerScrollBehavior,
  PixelDatepickerSize,
  PixelDatepickerValidationMessages,
  PixelDatepickerValue,
  PixelDatepickerView,
} from './lib/pixel-datepicker/pixel-datepicker';
export { default as PixelCalendarComponent } from './lib/pixel-calendar/pixel-calendar';
export type {
  PixelCalendarDateClassFn,
  PixelCalendarDateFilterFn,
  PixelCalendarMode,
  PixelCalendarRange,
  PixelCalendarView,
} from './lib/pixel-calendar/pixel-calendar.types';
export { default as PixelDateRangePickerComponent } from './lib/pixel-date-range-picker/pixel-date-range-picker';
export type {
  PixelDateRangePickerDateClassFn,
  PixelDateRangePickerDateFilterFn,
  PixelDateRangePickerLabelPosition,
  PixelDateRangePickerOpenDirection,
  PixelDateRangePickerScrollBehavior,
  PixelDateRangePickerSize,
  PixelDateRangePickerValidationMessages,
  PixelDateRangePickerView,
  PixelDateRangeValue,
  PixelDateRange,
  PixelDateRangeSelectionStrategy,
} from './lib/pixel-date-range-picker/pixel-date-range-picker';
export {
  PIXEL_DATE_RANGE_SELECTION_STRATEGY,
  providePixelDateRangeSelectionStrategy,
  PixelDefaultDateRangeSelectionStrategy,
  PixelFiveDayRangeSelectionStrategy,
} from './lib/pixel-date-range-picker/pixel-date-range-picker';
export {
  PixelDateAdapter,
  PIXEL_DATE_ADAPTER,
  PIXEL_DATE_FORMATS,
  PIXEL_DATE_LOCALE,
  PIXEL_NATIVE_DATE_FORMATS,
  PixelNativeDateAdapter,
  provideNativeDateAdapter,
  nativeDateAdapterProviders,
  defaultParseDate,
  defaultFormatDate,
  toNativeDate,
  sameDay,
  normalizeRange,
} from './lib/shared/datetime';
export type { PixelDateFormats } from './lib/shared/datetime';
// ---- Data grid (enterprise) ----
export { default as PixelDataGridComponent } from './lib/pixel-data-grid/pixel-data-grid';
export { default as PixelDataGridCellDirective } from './lib/pixel-data-grid/pixel-data-grid-cell.directive';
export type { PixelDataGridCellContext } from './lib/pixel-data-grid/pixel-data-grid-cell.directive';
export { default as PixelDataGridDetailDirective } from './lib/pixel-data-grid/pixel-data-grid-detail.directive';
export type { PixelDataGridDetailContext } from './lib/pixel-data-grid/pixel-data-grid-detail.directive';
export { default as PixelDataGridEditorDirective } from './lib/pixel-data-grid/pixel-data-grid-editor.directive';
export type { PixelDataGridEditorContext } from './lib/pixel-data-grid/pixel-data-grid-editor.directive';
export {
  PixelDataGridStore,
  injectPixelDataGridStore,
} from './lib/pixel-data-grid/pixel-data-grid.store';
export {
  PIXEL_DATA_GRID_DEFAULT_OPERATORS,
  PIXEL_DATA_GRID_OPERATOR_LABELS,
  aggregateGridColumns,
  buildGroupedRenderRows,
  collectGridGroupKeys,
  compareGridValues,
  computeGridAggregate,
  copyTextToClipboard,
  cycleGridSort,
  filterGridRows,
  formatGridCell,
  gridHasAggregates,
  gridHeaderLabel,
  gridOperatorsFor,
  gridRangeLabel,
  gridRenderRowKey,
  gridRowsToDelimited,
  gridRowsToJson,
  gridRowsToSpreadsheetXml,
  gridStateToJson,
  isValuelessGridOperator,
  matchesGridFilter,
  paginateGridRows,
  parseGridColumnWidth,
  parseGridState,
  sortGridRows,
  triggerGridDownload,
} from './lib/pixel-data-grid/pixel-data-grid.utils';
export type {
  PixelDataGridAggregator,
  PixelDataGridAggregatorName,
  PixelDataGridAlign,
  PixelDataGridCellEditEvent,
  PixelDataGridColumn,
  PixelDataGridColumnFilter,
  PixelDataGridColumnState,
  PixelDataGridColumnType,
  PixelDataGridCriteria,
  PixelDataGridDataRow,
  PixelDataGridDataSource,
  PixelDataGridDensity,
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
} from './lib/pixel-data-grid/pixel-data-grid.types';

export { PixelToastService } from './lib/pixel-toast/pixel-toast.service';
export type {
  PixelButtonAppearance,
  PixelButtonChangeEvent,
  PixelButtonClassValue,
  PixelButtonFabShape,
  PixelButtonIconColor,
  PixelButtonInteractionSource,
  PixelButtonSize,
  PixelButtonState,
  PixelButtonType,
} from './lib/pixel-button/pixel-button';
export type {
  PixelCheckboxClassValue,
  PixelCheckboxInteractionSource,
  PixelCheckboxLabelPosition,
  PixelCheckboxResolvedState,
  PixelCheckboxSize,
  PixelCheckboxState,
  PixelCheckboxStateChangeEvent,
} from './lib/pixel-checkbox/pixel-checkbox';
export type {
  PixelToggleCheckedChangeEvent,
  PixelToggleClassValue,
  PixelToggleInteractionSource,
  PixelToggleLabelPosition,
  PixelToggleMode,
  PixelToggleOption,
  PixelToggleSegmentedAppearance,
  PixelToggleSegmentedShape,
  PixelToggleSize,
  PixelToggleSwitchAppearance,
  PixelToggleValueChangeEvent,
} from './lib/pixel-toggle/pixel-toggle';
export type {
  PixelInputClassValue,
  PixelInputIconClickEvent,
  PixelInputLabelPosition,
  PixelInputResize,
  PixelInputSize,
  PixelInputType,
  PixelInputValidationMessages,
} from './lib/pixel-input/pixel-input';
export type {
  PixelSelectClassValue,
  PixelSelectGroup,
  PixelSelectInteractionSource,
  PixelSelectLabeledValue,
  PixelSelectLabelPosition,
  PixelSelectMode,
  PixelSelectOpenDirection,
  PixelSelectOption,
  PixelSelectPanelWidthMode,
  PixelSelectScrollBehavior,
  PixelSelectSelectionChange,
  PixelSelectSize,
  PixelSelectValidationMessages,
  PixelSelectValue,
  PixelSelectVisualState,
} from './lib/pixel-select/pixel-select';
export type { PixelThemeId, PixelThemeOption } from './lib/theme/pixel-theme';
export {
  PIXEL_THEME_OPTIONS,
  applyPixelTheme,
  initPixelTheme,
  isPixelDarkTheme,
  readStoredPixelTheme,
} from './lib/theme/pixel-theme';
export type {
  PixelChipClassValue,
  PixelChipEditEvent,
  PixelChipItem,
  PixelChipRemoveEvent,
  PixelChipSelectionChange,
  PixelChipSemantic,
  PixelChipSize,
  PixelChipType,
  PixelChipVariant,
} from './lib/pixel-chip/pixel-chip';
export { PIXEL_CHIP_SELECTABLE_TYPES } from './lib/pixel-chip/pixel-chip';
export type {
  PixelChipReorderEvent,
  PixelChipSetLayout,
  PixelChipSetSelectionChange,
  PixelChipSetSelectionMode,
} from './lib/pixel-chip/pixel-chip-set';
export type {
  PixelToastAction,
  PixelToastActionEvent,
  PixelToastAnimation,
  PixelToastConfig,
  PixelToastDismissEvent,
  PixelToastGlobalConfig,
  PixelToastPlacement,
  PixelToastPosition,
  PixelToastPromiseMessages,
  PixelToastRecord,
  PixelToastRole,
  PixelToastSize,
  PixelToastType,
  PixelToastVariant,
} from './lib/pixel-toast/pixel-toast';
export { default as PixelBadgeComponent } from './lib/pixel-badge/pixel-badge';
export { default as PixelAvatarComponent } from './lib/pixel-avatar/pixel-avatar';
export type {
  PixelAvatarBadgePosition,
  PixelAvatarClickEvent,
  PixelAvatarData,
  PixelAvatarDisplayMode,
  PixelAvatarShape,
  PixelAvatarSize,
  PixelAvatarStatus,
  PixelAvatarVariant,
} from './lib/pixel-avatar/pixel-avatar';
export { default as PixelAvatarGroupComponent } from './lib/pixel-avatar/pixel-avatar-group';
export type {
  PixelAvatarGroupClickEvent,
  PixelAvatarGroupLayout,
} from './lib/pixel-avatar/pixel-avatar-group';
export type {
  PixelBadgeAnimation,
  PixelBadgeAriaLive,
  PixelBadgeClickEvent,
  PixelBadgePosition,
  PixelBadgeRemoveEvent,
  PixelBadgeShape,
  PixelBadgeSize,
  PixelBadgeState,
  PixelBadgeType,
  PixelBadgeValue,
  PixelBadgeVariant,
} from './lib/pixel-badge/pixel-badge';
export type {
  PixelRadioClassValue,
  PixelRadioInteractionSource,
  PixelRadioLabelPosition,
  PixelRadioLayout,
  PixelRadioOption,
  PixelRadioOptionGroup,
  PixelRadioSelectionChangeEvent,
  PixelRadioSize,
  PixelRadioVisualState,
} from './lib/pixel-radio/pixel-radio.tokens';
export { default as PixelStepperComponent } from './lib/pixel-stepper/pixel-stepper';
export type { PixelStepperDraft } from './lib/pixel-stepper/pixel-stepper';
export { default as PixelStepComponent } from './lib/pixel-stepper/pixel-step';
export { default as PixelStepHeaderComponent } from './lib/pixel-stepper/pixel-step-header';
export { default as PixelStepIconDirective } from './lib/pixel-stepper/pixel-step-icon';
export { default as PixelStepContentComponent } from './lib/pixel-stepper/pixel-step-content';
export { default as PixelStepActionsComponent } from './lib/pixel-stepper/pixel-step-actions';
export type { PixelStepActionsAlign } from './lib/pixel-stepper/pixel-step-actions';
export type {
  PixelStepChangeEvent,
  PixelStepData,
  PixelStepGuard,
  PixelStepGuardContext,
  PixelStepperDirection,
  PixelStepperLabelPosition,
  PixelStepperNavigationMode,
  PixelStepperOrientation,
  PixelStepperSize,
  PixelStepperType,
  PixelStepState,
} from './lib/pixel-stepper/pixel-stepper.types';
export { default as PixelProgressBarComponent } from './lib/pixel-progress/pixel-progress-bar';
export { default as PixelProgressCircleComponent } from './lib/pixel-progress/pixel-progress-circle';
export { default as PixelProgressContainerComponent } from './lib/pixel-progress/pixel-progress-container';
export type { PixelProgressContainerLayout } from './lib/pixel-progress/pixel-progress-container';
export {
  clampProgressValue,
  toProgressPercent,
  resolveThresholdStatus,
  progressStatusColor,
  formatProgressBytes,
  formatProgressDuration,
} from './lib/pixel-progress/pixel-progress.types';
export type {
  PixelProgressChangeEvent,
  PixelProgressCompleteEvent,
  PixelProgressMilestone,
  PixelProgressMilestoneEvent,
  PixelProgressMilestoneView,
  PixelProgressMode,
  PixelProgressOrientation,
  PixelProgressSegment,
  PixelProgressSegmentView,
  PixelProgressSize,
  PixelProgressStatus,
  PixelProgressThreshold,
  PixelProgressType,
  PixelProgressVariant,
} from './lib/pixel-progress/pixel-progress.types';
export { default as PixelBreadcrumbComponent } from './lib/pixel-breadcrumb/pixel-breadcrumb';
export { default as PixelBreadcrumbItemComponent } from './lib/pixel-breadcrumb/pixel-breadcrumb-item';
export {
  PixelBreadcrumbService,
  PIXEL_BREADCRUMB_DATA_KEY,
} from './lib/pixel-breadcrumb/pixel-breadcrumb.service';
export type {
  PixelBreadcrumbResolver,
  PixelBreadcrumbRouteData,
} from './lib/pixel-breadcrumb/pixel-breadcrumb.service';
export type {
  PixelBreadcrumbClickEvent,
  PixelBreadcrumbInteractionSource,
  PixelBreadcrumbItem,
  PixelBreadcrumbLink,
  PixelBreadcrumbOverflowMode,
  PixelBreadcrumbSize,
  PixelBreadcrumbType,
  PixelBreadcrumbVariant,
  PixelBreadcrumbViewItem,
} from './lib/pixel-breadcrumb/pixel-breadcrumb.types';

// ---- Query builder ----
export { default as PixelQueryBuilderComponent } from './lib/pixel-query-builder/pixel-query-builder';
export { default as PixelQueryGroupComponent } from './lib/pixel-query-builder/pixel-query-group';
export { default as PixelQueryRuleComponent } from './lib/pixel-query-builder/pixel-query-rule';
export { default as PixelQueryValueComponent } from './lib/pixel-query-builder/pixel-query-value';
export { PixelQueryBuilderStore } from './lib/pixel-query-builder/pixel-query-builder.store';
export {
  getDefaultOperatorForFieldType,
  getOperatorsForFieldType,
  getQueryOperatorLabel,
  operatorExpectsMultiValue,
  operatorExpectsRange,
  operatorNeedsValue,
  VALUELESS_QUERY_OPERATORS,
} from './lib/pixel-query-builder/pixel-query-operator.registry';
export {
  addQueryGroup,
  addQueryRule,
  cloneQueryNode,
  cloneQueryTree,
  conditionHint,
  conditionLabel,
  createEmptyQuery,
  createQueryGroup,
  createQueryNodeId,
  createQueryRule,
  exportQuery,
  findQueryGroup,
  findQueryRule,
  getGroupDepth,
  importQuery,
  isQueryGroup,
  normalizeQueryGroup,
  parseQueryExportJson,
  removeQueryNode,
  serializeQueryExport,
  updateQueryRule,
} from './lib/pixel-query-builder/pixel-query-builder.utils';
export {
  toQueryButtonSize,
  toQueryDateRangePickerSize,
  toQueryDatepickerSize,
  toQueryInputSize,
  toQuerySelectSize,
  toQueryToastSize,
} from './lib/pixel-query-builder/pixel-query-builder-size';
export { isQueryValid, isGroupEmptyInvalid, queryToSummary, validateQuery, buildQuerySummaryTree } from './lib/pixel-query-builder/pixel-query-builder.validator';
export { summaryTreeToText } from './lib/pixel-query-builder/pixel-query-summary.utils';
export type {
  PixelQueryBuilderConfig,
  PixelQueryBuilderMessages,
  PixelQueryBuilderSize,
  PixelQueryBuilderVariant,
  PixelQuerySummaryMode,
  PixelQuerySummaryPreview,
  PixelQueryChangeEvent,
  PixelQueryCondition,
  PixelQueryExport,
  PixelQueryExportEvent,
  PixelQueryExportGroup,
  PixelQueryExportParseResult,
  PixelQueryExportRule,
  PixelQueryFieldConfig,
  PixelQueryFieldOption,
  PixelQueryFieldType,
  PixelQueryGroup,
  PixelQueryGroupValidationIssue,
  PixelQueryImportEvent,
  PixelQueryNode,
  PixelQueryOperator,
  PixelQueryRule,
  PixelQueryRuleContext,
  PixelQueryRuleValidationIssue,
  PixelQueryRunEvent,
  PixelQuerySummaryGroupNode,
  PixelQuerySummaryNode,
  PixelQuerySummaryRuleNode,
  PixelQuerySummaryTree,
  PixelQueryValidationResult,
} from './lib/pixel-query-builder/pixel-query-builder.types';

// ---- Loader / loading-indicator system ----
export { default as PixelLoaderComponent } from './lib/pixel-loader/pixel-loader';
export { default as PixelSkeletonComponent } from './lib/pixel-loader/pixel-skeleton';
export { default as PixelLoadingContainerComponent } from './lib/pixel-loader/pixel-loading-container';
export { PixelLoadingService } from './lib/pixel-loader/pixel-loading.service';
export type {
  PixelLoadingSnapshot,
  PixelLoadingStartOptions,
} from './lib/pixel-loader/pixel-loading.service';
export {
  pixelLoadingInterceptor,
  PIXEL_LOADING_CONFIG,
} from './lib/pixel-loader/pixel-loading.interceptor';
export type { PixelLoadingInterceptorConfig } from './lib/pixel-loader/pixel-loading.interceptor';
export { providePixelRouteLoading } from './lib/pixel-loader/pixel-loading-router';
export type { PixelRouteLoadingOptions } from './lib/pixel-loader/pixel-loading-router';
export {
  clampPercent,
  LOADER_SIZE_METRICS,
  smartLoaderType,
  SKELETON_PRESET_LINES,
} from './lib/pixel-loader/pixel-loader.types';
export type {
  PixelLoaderScope,
  PixelLoaderSize,
  PixelLoaderType,
  PixelLoaderVisibilityEvent,
  PixelLoadingTask,
  PixelSkeletonAnimation,
  PixelSkeletonPreset,
  PixelSkeletonShape,
} from './lib/pixel-loader/pixel-loader.types';

// ─── File Transfer Framework (UI-independent service) ───
export * from './lib/services/file-transfer/public-api';

// ---- Card ----
export { default as PixelCardComponent } from './lib/pixel-card/pixel-card';
export type {
  PixelCardActivateEvent,
  PixelCardAppearance,
  PixelCardInteractionSource,
  PixelCardPadding,
} from './lib/pixel-card/pixel-card';

// ---- Tour ----
export { PixelTourService } from './lib/pixel-tour/pixel-tour.service';
export { PixelTourRef } from './lib/pixel-tour/pixel-tour-ref';
export { default as PixelTourAnchorDirective } from './lib/pixel-tour/pixel-tour-anchor';
export { PIXEL_TOUR_STEP_DATA } from './lib/pixel-tour/pixel-tour.types';
export type {
  PixelTourAlign,
  PixelTourAutoplayOptions,
  PixelTourButton,
  PixelTourConfig,
  PixelTourEndReason,
  PixelTourEvent,
  PixelTourEventType,
  PixelTourLabels,
  PixelTourPlacement,
  PixelTourProgressStyle,
  PixelTourSpotlightOptions,
  PixelTourSpotlightShape,
  PixelTourStatus,
  PixelTourStep,
  PixelTourStepChange,
  PixelTourStepContext,
  PixelTourStorage,
  PixelTourTargetRef,
} from './lib/pixel-tour/pixel-tour.types';

// ---- Tree ----
export { default as PixelTreeComponent } from './lib/pixel-tree/pixel-tree';
export { default as PixelTreeNodeDefDirective } from './lib/pixel-tree/pixel-tree-node.directive';
export type { PixelTreeNodeContext } from './lib/pixel-tree/pixel-tree-node.directive';
export type {
  PixelTreeCheckState,
  PixelTreeFlatRow,
  PixelTreeInteractionSource,
  PixelTreeNode,
  PixelTreeNodeActivateEvent,
  PixelTreeNodeId,
  PixelTreeNodeToggleEvent,
  PixelTreeSelectionChangeEvent,
  PixelTreeSelectionMode,
} from './lib/pixel-tree/pixel-tree.types';

// ---- Popover ----
export { default as PixelPopoverComponent } from './lib/pixel-popover/pixel-popover';
export { default as PixelPopoverTriggerDirective } from './lib/pixel-popover/pixel-popover-trigger';
export type {
  PixelPopoverAlign,
  PixelPopoverPosition,
  PixelPopoverWidth,
} from './lib/pixel-popover/pixel-popover';

// ---- Empty state ----
export { default as PixelEmptyStateComponent } from './lib/pixel-empty-state/pixel-empty-state';
export type {
  PixelEmptyStateAlign,
  PixelEmptyStateSize,
} from './lib/pixel-empty-state/pixel-empty-state';

// ---- Layout shell ----
export { default as PixelContainerComponent } from './lib/pixel-container/pixel-container';
export type { PixelContainerMaxWidth } from './lib/pixel-container/pixel-container';
export { default as PixelHeaderComponent } from './lib/pixel-header/pixel-header';
export { default as PixelFooterComponent } from './lib/pixel-footer/pixel-footer';
export { default as PixelSidenavComponent } from './lib/pixel-sidenav/pixel-sidenav';
export type {
  PixelSidenavAutoCollapse,
  PixelSidenavMode,
  PixelSidenavPosition,
  PixelSidenavSize,
} from './lib/pixel-sidenav/pixel-sidenav';
export { default as PixelAppShellComponent } from './lib/pixel-app-shell/pixel-app-shell';
