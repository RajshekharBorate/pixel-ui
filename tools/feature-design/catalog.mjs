import { actionFeatures } from './catalog-actions.mjs';
import { formFeatures } from './catalog-forms.mjs';
import { overlayFeatures } from './catalog-overlays.mjs';
import { dateFeatures } from './catalog-dates.mjs';
import { layoutFeatures } from './catalog-layout.mjs';
import { dataFeatures } from './catalog-data.mjs';
import { chartFeatures } from './catalog-charts.mjs';
import { serviceFeatures } from './catalog-services.mjs';

export const features = [
  ...actionFeatures,
  ...formFeatures,
  ...overlayFeatures,
  ...dateFeatures,
  ...layoutFeatures,
  ...dataFeatures,
  ...chartFeatures,
  ...serviceFeatures,
];
