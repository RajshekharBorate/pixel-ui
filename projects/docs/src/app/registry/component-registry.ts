import { DocComponentMeta } from './types';
import { ACCORDION_META } from './components/pixel-accordion.meta';
import { AUTOCOMPLETE_META } from './components/pixel-autocomplete.meta';
import { DOC_AVATAR_META } from './components/pixel-avatar.meta';
import { DOC_BADGE_META } from './components/pixel-badge.meta';
import { DOC_BUTTON_META } from './components/pixel-button.meta';
import { BREADCRUMB_META } from './components/pixel-breadcrumb.meta';
import { DOC_CHECKBOX_META } from './components/pixel-checkbox.meta';
import { DOC_CHIP_META } from './components/pixel-chip.meta';
import { DATE_RANGE_PICKER_META } from './components/pixel-date-range-picker.meta';
import { DATEPICKER_META } from './components/pixel-datepicker.meta';
import { DIALOG_META } from './components/pixel-dialog.meta';
import { DIVIDER_META } from './components/pixel-divider.meta';
import { DRAWER_META } from './components/pixel-drawer.meta';
import { CONTAINER_META } from './components/pixel-container.meta';
import { HEADER_META } from './components/pixel-header.meta';
import { FOOTER_META } from './components/pixel-footer.meta';
import { SIDENAV_META } from './components/pixel-sidenav.meta';
import { APP_SHELL_META } from './components/pixel-app-shell.meta';
import { DOC_INPUT_META } from './components/pixel-input.meta';
import { DOC_LOADER_META } from './components/pixel-loader.meta';
import { MENU_META } from './components/pixel-menu.meta';
import { DOC_PROGRESS_META } from './components/pixel-progress.meta';
import { QUERY_BUILDER_META } from './components/pixel-query-builder.meta';
import { DOC_DATA_GRID_META } from './components/pixel-data-grid.meta';
import { DOC_RADIO_META } from './components/pixel-radio.meta';
import { DOC_SELECT_META } from './components/pixel-select.meta';
import { SLIDER_META } from './components/pixel-slider.meta';
import { TIMEPICKER_META } from './components/pixel-timepicker.meta';
import { PAGINATOR_META } from './components/pixel-paginator.meta';
import { FILE_UPLOAD_META } from './components/pixel-file-upload.meta';
import { FILE_TRANSFER_META } from './components/pixel-file-transfer.meta';
import { EXPORT_META } from './components/pixel-export.meta';
import { NAVIGATE_META } from './components/pixel-navigate.meta';
import { STEPPER_META } from './components/pixel-stepper.meta';
import { TABS_META } from './components/pixel-tabs.meta';
import { TOAST_META } from './components/pixel-toast.meta';
import { NOTIFICATION_META } from './components/pixel-notification.meta';
import { DOC_TOGGLE_META } from './components/pixel-toggle.meta';
import { TOOLTIP_META } from './components/pixel-tooltip.meta';
import { CARD_META } from './components/pixel-card.meta';
import { EMPTY_STATE_META } from './components/pixel-empty-state.meta';
import { POPOVER_META } from './components/pixel-popover.meta';
import { TREE_META } from './components/pixel-tree.meta';
import { TOUR_META } from './components/pixel-tour.meta';
import { EDITOR_META } from './components/pixel-editor.meta';
import { CHART_BAR_META } from './components/pixel-chart-bar.meta';
import { CHART_SHELL_META } from './components/pixel-chart-shell.meta';
import { CHART_LINE_META } from './components/pixel-chart-line.meta';
import { CHART_AREA_META } from './components/pixel-chart-area.meta';
import { CHART_PIE_META } from './components/pixel-chart-pie.meta';
import { CHART_GAUGE_META } from './components/pixel-chart-gauge.meta';
import { CHART_SCATTER_META } from './components/pixel-chart-scatter.meta';
import { CHART_BUBBLE_META } from './components/pixel-chart-bubble.meta';
import { CHART_RADAR_META } from './components/pixel-chart-radar.meta';
import { CHART_MAP_META } from './components/pixel-chart-map.meta';
import { CHART_SPARKLINE_META } from './components/pixel-chart-sparkline.meta';

export const COMPONENT_REGISTRY: readonly DocComponentMeta[] = [
  // Form controls
  DOC_BUTTON_META,
  DOC_INPUT_META,
  DOC_SELECT_META,
  AUTOCOMPLETE_META,
  EDITOR_META,
  SLIDER_META,
  TIMEPICKER_META,
  PAGINATOR_META,
  FILE_UPLOAD_META,
  FILE_TRANSFER_META,
  EXPORT_META,
  NAVIGATE_META,
  DOC_CHECKBOX_META,
  DOC_RADIO_META,
  DOC_TOGGLE_META,
  DATEPICKER_META,
  DATE_RANGE_PICKER_META,
  // Data display
  CARD_META,
  CHART_SHELL_META,
  CHART_BAR_META,
  CHART_LINE_META,
  CHART_AREA_META,
  CHART_PIE_META,
  CHART_GAUGE_META,
  CHART_SCATTER_META,
  CHART_BUBBLE_META,
  CHART_RADAR_META,
  CHART_MAP_META,
  CHART_SPARKLINE_META,
  TREE_META,
  DOC_BADGE_META,
  DOC_AVATAR_META,
  DOC_CHIP_META,
  DOC_PROGRESS_META,
  DOC_LOADER_META,
  // Navigation
  TABS_META,
  MENU_META,
  BREADCRUMB_META,
  STEPPER_META,
  // Layout
  CONTAINER_META,
  HEADER_META,
  FOOTER_META,
  SIDENAV_META,
  APP_SHELL_META,
  DIVIDER_META,
  ACCORDION_META,
  DIALOG_META,
  DRAWER_META,
  // Feedback
  EMPTY_STATE_META,
  POPOVER_META,
  TOAST_META,
  NOTIFICATION_META,
  TOOLTIP_META,
  // Advanced
  TOUR_META,
  QUERY_BUILDER_META,
  DOC_DATA_GRID_META,
];

export function getComponentById(id: string): DocComponentMeta | undefined {
  return COMPONENT_REGISTRY.find((component) => component.id === id);
}
