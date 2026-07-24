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
| pixel-breadcrumb | Yes (truncate) | `breakpoint-down(sm)` + scroll mode | Normalized | P0 |
| pixel-button | Soft (fullWidth / touch) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-toggle | Soft (full width) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-input | Yes (label-left stack) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-select | Yes (label-left / panel) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-checkbox | Soft (full width) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-radio | Soft (full width) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-badge | Soft (touch) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-avatar | Soft (xs size) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-toast-container | Yes (edge inset) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-skeleton | Soft (table gap) | `breakpoint-down(sm)` | Normalized | P0 |
| pixel-dialog | Yes (sheet width) | `breakpoint-up(sm)` | Normalized | P0 |
| pixel-query-builder | Yes (toolbar / rules) | Container queries + viewport fallbacks via mixins | Normalized | P0 |
| pixel-paginator | Yes (chrome density) | Wrap + hide size label below `sm` | Gap filled | P1 |
| pixel-empty-state | Soft (actions) | Stack / stretch actions below `sm` | Gap filled | P1 |
| pixel-tabs / tab-nav | Overflow | Scroll + chevrons (fill container) | OK — no VP BP | P2 |
| pixel-data-grid | Overflow | Horizontal scroll | OK — no VP BP | P2 |
| pixel-chip-set | Overflow | `wrap` / `scrollable` layouts | OK — consumer choice | P2 |
| pixel-datepicker / range | Overlay | Single calendar panel | OK — no VP BP | P2 |
| pixel-drawer | Overlay | Handled by placement / size inputs | OK | P2 |
| pixel-menu / popover / tooltip | Overlay | Connected overlay flip | OK | — |
| pixel-tree | Fill | Virtualization / scroll | OK | — |
| pixel-tour | Soft | Spotlight fits container | OK | P2 |
| pixel-file-upload | Soft | Already wraps actions | OK | P2 |
| pixel-editor | Soft (toolbar overflow) | Container query collapses Insert; viewport `breakpoint-down(sm)` fallback; contextual image/table/find bars; fullscreen Escape | OK | P2 |
| pixel-divider / progress / loader / tooltip | No | — | N/A | — |

**CQ vs viewport:** use container queries when the component sits in a variable-width host (QB toolbar). Use viewport breakpoints for shell, forms, overlays, and page-level chrome.
