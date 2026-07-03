import { DocComponentMeta } from '../types';
import { PROGRESS_EXAMPLES } from '../../examples/pixel-progress';

export const DOC_PROGRESS_META: DocComponentMeta = {
  id: 'pixel-progress',
  title: 'Progress',
  selector: 'pixel-progress-bar',
  category: 'data-display',
  status: 'stable',
  summary: 'Linear bars, circular gauges, and dashboard containers with thresholds, milestones, and multi-segment stacks.',
  overview: [
    'pixel-progress-bar supports determinate, indeterminate, buffer, and query modes.',
    'pixel-progress-circle renders SVG ring gauges with optional indeterminate spinner.',
    'pixel-progress-container wraps indicators in KPI card layouts.',
  ],
  useCases: [
    'File upload and download progress',
    'Dashboard CPU and memory gauges',
    'Multi-segment storage breakdown bars',
    'Threshold-driven health indicators',
  ],
  themingNotes: [
    'Status drives fill color via --pixel-progress-fill tokens.',
    'Threshold arrays map value bands to semantic statuses.',
    'Striped and pulse variants add motion to the fill.',
  ],
  accessibilityNotes: [
    'Uses progressbar role with valuenow, valuemin, and valuemax.',
    'Indeterminate mode sets aria-busy.',
    'Labels and percentages are exposed to assistive tech when enabled.',
  ],
  imports: ['PixelProgressBarComponent', 'PixelProgressCircleComponent', 'PixelProgressContainerComponent'],
  inputs: [
    { name: 'value', type: 'number', defaultValue: '0', description: 'Current value within min/max.' },
    { name: 'mode', type: '\'determinate\' | \'indeterminate\' | \'buffer\' | \'query\'', defaultValue: '\'determinate\'', description: 'Determinacy mode.' },
    { name: 'status', type: 'PixelProgressStatus', defaultValue: '\'default\'', description: 'Semantic fill status.' },
    { name: 'thresholds', type: 'PixelProgressThreshold[]', defaultValue: '[]', description: 'Value-band status colors.' },
    { name: 'segments', type: 'PixelProgressSegment[]', defaultValue: '[]', description: 'Multi-segment slices.' },
    { name: 'showPercentage', type: 'boolean', defaultValue: 'false', description: 'Show percentage label.' },
  ],
  outputs: [
    { name: 'valueChange', type: 'number', description: 'Value updated.' },
    { name: 'completed', type: 'void', description: 'Value reached max.' },
    { name: 'milestoneReached', type: 'PixelProgressMilestone', description: 'A milestone was crossed.' },
  ],
  examples: PROGRESS_EXAMPLES,
};
