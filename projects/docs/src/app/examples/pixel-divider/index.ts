import { createDocExample } from '../../shared/example-source.util';
import { DividerBasicExample } from './divider-basic.example';
import { DividerInsetExample } from './divider-inset.example';
import { DividerLabeledExample } from './divider-labeled.example';
import { DividerVariantsExample } from './divider-variants.example';
import { DividerVerticalExample } from './divider-vertical.example';

const DIVIDER_IMPORTS = ['PixelDividerComponent'] as const;

export const DIVIDER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic horizontal',
    category: 'Setup',
    description: 'Default horizontal rule between stacked content blocks.',
    component: DividerBasicExample,
    imports: [...DIVIDER_IMPORTS],
    html: `<p>Account settings</p>
<pixel-divider />
<p>Notification preferences</p>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DividerBasicExample {}`,
  }),
  createDocExample({
    id: 'variants',
    title: 'Stroke variants',
    category: 'Variants',
    description: 'variant switches between solid, dashed, and dotted strokes.',
    component: DividerVariantsExample,
    imports: [...DIVIDER_IMPORTS],
    html: `<pixel-divider variant="solid" />
<pixel-divider variant="dashed" />
<pixel-divider variant="dotted" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent, type PixelDividerVariant } from 'pixel-ui';

@Component({ /* … */ })
export class DividerVariantsExample {
  protected readonly variants: readonly PixelDividerVariant[] = ['solid', 'dashed', 'dotted'];
}`,
    scss: `.row {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'vertical',
    title: 'Vertical toolbar',
    category: 'Layout',
    description: 'orientation="vertical" separates inline actions; parent needs a defined height.',
    component: DividerVerticalExample,
    imports: [...DIVIDER_IMPORTS],
    html: `<div class="toolbar" role="group" aria-label="Document actions">
  <pixel-button appearance="text" size="sm">Edit</pixel-button>
  <pixel-divider orientation="vertical" />
  <pixel-button appearance="text" size="sm">Share</pixel-button>
  <pixel-divider orientation="vertical" variant="dashed" />
  <pixel-button appearance="text" size="sm">Export</pixel-button>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelDividerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DividerVerticalExample {}`,
    scss: `.toolbar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2rem;
}`,
  }),
  createDocExample({
    id: 'labeled',
    title: 'Labeled divider',
    category: 'Layout',
    description: 'labeled projects a caption with labelAlign controlling position (start/center/end).',
    component: DividerLabeledExample,
    imports: [...DIVIDER_IMPORTS],
    html: `<pixel-divider labeled labelAlign="center">OR</pixel-divider>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DividerLabeledExample {}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'inset',
    title: 'Inset spacing',
    category: 'Layout',
    description:
      'inset adds symmetric margin so the rule does not touch container edges — handy inside lists with leading icons.',
    component: DividerInsetExample,
    imports: [...DIVIDER_IMPORTS],
    html: `<ul class="list">
  <li>Inbox</li>
  <pixel-divider inset />
  <li>Sent</li>
</ul>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelDividerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DividerInsetExample {}`,
    scss: `.list {
  margin: 0;
  padding: 0;
  list-style: none;
}`,
  }),
] as const;
