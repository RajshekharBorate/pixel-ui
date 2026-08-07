# Responsive design inventory — pixel-ui

Living matrix for viewport breakpoints, container queries, and overflow strategies.
Scale: `sm 600 / md 900 / lg 1200 / xl 1536` (`_theming.scss`, `shared/breakpoints.ts`).
Rules: `CONVENTIONS.md` §7 / §7a.

| Component | Needs responsive? | Approach | Status | Priority |
|-----------|-------------------|----------|--------|----------|
| pixel-app-shell | Yes (layout) | Grid + sidenav coupling | OK | — |
| pixel-sidenav | Yes (mode) | JS `PIXEL_BREAKPOINT_PX` + `autoCollapseBreakpoint` | OK | — |
| pixel-container | Yes (gutters) | `breakpoint-up(md)` | OK | — |
| pixel-header | Yes (padding) | `breakpoint-up(md)` | OK | — |
| pixel-footer | Yes (padding) | `breakpoint-up(md)` | OK | — |
| pixel-stepper | Yes (labels) | `breakpoint-down` + matchMedia + overflow | OK | — |
| pixel-breadcrumb | Yes (truncate + collapse) | `matchMedia(sm)` auto-collapse + host `ResizeObserver` width tighten; CSS `breakpoint-down(sm)` label truncate | OK | P0 |
| pixel-button | Soft (fullWidth / touch) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-button-group | Soft (fullWidth) | Host flex + child stretch | OK | P2 |
| pixel-split-button | Soft (fullWidth) | Primary flexes; caret fixed | OK | P2 |
| pixel-toggle | Soft (full width) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-input | Yes (label-left stack) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-select | Yes (label-left / panel) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-checkbox | Soft (full width) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-radio | Soft (full width) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-badge | Soft (touch) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-avatar | Soft (xs size) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-toast-container | Yes (edge inset) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-toast | Soft (via container) | Placement / stacking on container | OK — see container | P2 |
| pixel-skeleton | Soft (table gap) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-dialog | Yes (sheet width) | `breakpoint-up(sm)` | Normalized | P0 |
| pixel-query-builder | Yes (toolbar / rules) | Container queries + viewport fallbacks via mixins | Normalized | P0 |
| pixel-paginator | Yes (chrome density) | Wrap + hide size label + hide page-number buttons below `sm` | Gap filled | P1 |
| pixel-empty-state | Soft (actions) | Stack / stretch actions below `sm` | Gap filled | P1 |
| pixel-tabs / tab-nav | Overflow | Scroll + chevrons (fill container) | OK — no VP BP | P2 |
| pixel-data-grid | Overflow | Horizontal scroll | OK — no VP BP | P2 |
| pixel-chip-set | Overflow | `wrap` / `scrollable` layouts | OK — consumer choice | P2 |
| pixel-chip | Soft (via set) | Follows chip-set layout | OK — consumer choice | P2 |
| pixel-datepicker / range | Overlay | Single calendar panel | OK — no VP BP | P2 |
| pixel-calendar | Soft (grid) | Fill host up to 18rem; circular day marks use row-height square (not cell width) | OK — no VP BP | P2 |
| pixel-date-range-picker | Overlay | Same as datepicker family | OK — no VP BP | P2 |
| pixel-drawer | Overlay | Handled by placement / size inputs | OK | P2 |
| pixel-menu | Overlay | Connected overlay flip | OK | — |
| pixel-popover | Overlay | Connected overlay flip | OK | — |
| pixel-tooltip | Overlay | Connected overlay flip | OK | — |
| pixel-autocomplete | Soft (panel) | Connected overlay + fill-container field | OK — no VP BP | P2 |
| pixel-accordion | Soft (full width) | Fill container; panels stack | OK — no VP BP | P2 |
| pixel-card | Soft | Fill container / appearance chrome | OK — no VP BP | P2 |
| pixel-notification / item | Soft (list) | Density + wrap; banner full-bleed | OK — no VP BP | P2 |
| pixel-slider | Soft (full width) | Track fills host | OK — no VP BP | P2 |
| pixel-timepicker | Soft (panel) | Overlay + form field stack | OK — no VP BP | P2 |
| pixel-progress | No | Fixed sizes | N/A | — |
| pixel-loader | No | Fixed sizes | N/A | — |
| pixel-divider | No | — | N/A | — |
| pixel-tree | Fill | Virtualization / scroll | OK | — |
| pixel-tour | Soft | Spotlight fits container | OK | P2 |
| pixel-file-upload | Soft | Already wraps actions | OK | P2 |
| pixel-editor | Soft (toolbar + status overflow) | Container query collapses Insert; viewport `breakpoint-down(sm)` fallback; status bar horizontal scroll below `sm`; contextual image/table/find bars; fullscreen Escape | OK | P2 |
| pixel-chart (host) | Soft (via shell) | Facades use `pixel-chart-shell` | OK — see shell | P1 |
| pixel-chart-shell | Soft (toolbar / table) | `@container pixel-chart-shell`; viewport `breakpoint-down(sm)` padding; plot fill-container | OK | P1 |
| pixel-chart-bar | No (fill container) | Host ResizeObserver; labels auto-hide when dense | OK | P1 |
| pixel-chart-line | No (fill container) | Host ResizeObserver; labels auto-hide when dense | OK | P1 |
| pixel-chart-area | No (fill container) | Host ResizeObserver; labels auto-hide when dense | OK | P1 |
| pixel-chart-pie | No (fill container) | Host ResizeObserver; labels auto-hide when dense | OK | P1 |
| pixel-chart-gauge | Soft (footer) | Host ResizeObserver; footer wraps; linear/bullet fill-container | OK | P1 |
| pixel-chart-scatter | Soft (stats footer) | Host ResizeObserver; stats wrap | OK | P1 |
| pixel-chart-bubble | No (fill container) | Host ResizeObserver | OK | P1 |
| pixel-chart-radar | No (fill container) | Host ResizeObserver | OK | P1 |
| pixel-chart-map | No (fill container) | Host ResizeObserver; native geo roam; labels auto-hide when dense (`showValues: 'auto'`) | OK | P1 |
| pixel-chart-sparkline | No (inline) | Fixed CSS size inputs; SVG scales | OK | P3 |

**CQ vs viewport:** use container queries when the component sits in a variable-width host (QB toolbar). Use viewport breakpoints for shell, forms, overlays, and page-level chrome.

## Container-query catalog (component-local thresholds)

Allowed by CONVENTIONS §7a. Thresholds are **not** required to match the global viewport scale;
document them here and in the component README.

| Component | Container name | Thresholds | Behavior |
|-----------|----------------|------------|----------|
| pixel-query-builder | `qb-toolbar` | max-width **639px** · **479px** · **359px** | Tighten gaps → icon-only actions → densest chrome; viewport `breakpoint-down(md\|sm)` fallback |
| pixel-chart-shell | `pixel-chart-shell` | max-width **420px** | Collapse / stack toolbar & table chrome |
| pixel-editor toolbar | `pixel-editor-toolbar` | max-width **40rem** (640px) | Collapse Insert group; viewport `breakpoint-down(sm)` fallback |
