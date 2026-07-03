import { DocComponentMeta } from '../types';
import { SIDENAV_EXAMPLES } from '../../examples/pixel-sidenav';

export const SIDENAV_META: DocComponentMeta = {
  id: 'pixel-sidenav',
  title: 'Sidenav',
  selector: 'pixel-sidenav',
  category: 'layout',
  status: 'stable',
  summary:
    'Collapsible side-navigation panel that docks in-flow on desktop and automatically becomes an overlay drawer on narrow viewports.',
  overview: [
    'Declares a preferred mode ("side" docked or "over" overlay) but auto-switches to "over" below autoCollapseBreakpoint regardless of mode.',
    'Mode switches never destroy projected content — the same nav content stays mounted and keeps its own component state across a resize.',
    'Overlay mode reuses the same shared overlay primitives as pixel-drawer (focus trap, body scroll lock, scrim).',
    'Optionally projects a pixelSidenavBrand slot — a non-scrolling header row (matching pixel-header\'s height, bordered by default) for a brand mark and an expand/collapse control; everything else becomes the scrolling items region below it.',
    'The brand region\'s border is automatically suppressed when composed inside pixel-app-shell with a pixel-header present, since the shell draws its own shared toolbar-divider instead — no manual coordination needed.',
  ],
  useCases: [
    'The primary navigation of an application shell (composed inside pixel-app-shell)',
    'A filter/settings panel that should dock on desktop but overlay on mobile',
  ],
  themingNotes: [
    'Consumes --pixel-sys-surface-container-low, --pixel-sys-on-surface, --pixel-sys-outline, --pixel-sys-scrim, --pixel-sys-scrim-blur, and --pixel-sys-elevation-level1 directly.',
    'Sets a [data-rail] host attribute while docked-and-closed with collapseTo="rail" — a CSS-only hook for hiding your own label text, e.g. pixel-sidenav[data-rail] .my-label { display: none; }.',
    'The pixelSidenavBrand region border uses the same color-mix(--pixel-sys-outline) formula as the panel\'s own border and pixel-divider, so lines stay visually consistent.',
  ],
  accessibilityNotes: [
    'Renders a real <aside> element; add your own <nav>/role="navigation" inside if the content is navigation.',
    'Overlay mode traps focus, closes on Escape (when dismissable), and restores focus to the previously focused element on close.',
    'Gets inert whenever opened is false, removing it from the tab order without unmounting it — except when collapseTo="rail", where the panel stays visible and interactive while closed.',
    'Respects prefers-reduced-motion.',
  ],
  imports: ['PixelSidenavComponent'],
  inputs: [
    { name: 'mode', type: "'side' | 'over'", defaultValue: "'side'", description: 'Preferred mode; may be overridden by the auto-collapse breakpoint.' },
    { name: 'position', type: "'start' | 'end'", defaultValue: "'start'", description: 'Edge the panel is docked to / slides in from.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Width when docked — 14 / 16 / 20 rem.' },
    { name: 'collapseTo', type: "'hidden' | 'rail'", defaultValue: "'hidden'", description: 'What a docked-and-closed sidenav looks like — vanish, or shrink to a persistent icon rail.' },
    { name: 'railWidth', type: 'number (rem)', defaultValue: '4.5', description: 'Width of the icon rail when collapseTo="rail".' },
    { name: 'autoCollapseBreakpoint', type: "'sm' | 'md' | 'lg' | 'xl' | 'none'", defaultValue: "'md'", description: 'Below this width, the effective mode is forced to "over". "none" disables auto-collapse.' },
    { name: 'dismissable', type: 'boolean', defaultValue: 'true', description: 'Allows closing via scrim click / Escape while in overlay mode.' },
    { name: 'brandBordered', type: 'boolean', defaultValue: 'true', description: 'Bottom border on the pixelSidenavBrand region. Automatically suppressed when composed inside pixel-app-shell with a pixel-header present — its shared toolbar-divider already draws that line.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible label for the panel.' },
    { name: 'opened', type: 'boolean (two-way)', defaultValue: 'true', description: 'Open state.' },
  ],
  outputs: [
    { name: 'modeChange', type: "output<'side' | 'over'>", description: 'Emits whenever the effective mode changes.' },
  ],
  examples: SIDENAV_EXAMPLES,
};
