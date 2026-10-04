import { actionDepth } from './depth-actions.mjs';
import { formDepth } from './depth-forms.mjs';
import { overlayDepth } from './depth-overlays.mjs';
import { dateDepth } from './depth-dates.mjs';
import { layoutDepth } from './depth-layout.mjs';
import { dataDepth } from './depth-data.mjs';
import { chartDepth } from './depth-charts.mjs';
import { serviceDepth } from './depth-services.mjs';

export const depthByDir = {
  ...actionDepth,
  ...formDepth,
  ...overlayDepth,
  ...dateDepth,
  ...layoutDepth,
  ...dataDepth,
  ...chartDepth,
  ...serviceDepth,
};
