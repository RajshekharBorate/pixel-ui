import { createDocExample } from '../../shared/example-source.util';
import { TooltipArrowExample } from './tooltip-arrow.example';
import { TooltipBasicExample } from './tooltip-basic.example';
import { TooltipCustomContentExample } from './tooltip-custom-content.example';
import { TooltipDelaysExample } from './tooltip-delays.example';
import { TooltipDisabledEmptyExample } from './tooltip-disabled-empty.example';
import { TooltipIconButtonsExample } from './tooltip-icon-buttons.example';
import { TooltipOverflowExample } from './tooltip-overflow.example';
import { TooltipPositionsExample } from './tooltip-positions.example';
import { TooltipThemesExample } from './tooltip-themes.example';
import { TooltipTriggersExample } from './tooltip-triggers.example';

const TOOLTIP_IMPORTS = ['PixelTooltipDirective', 'PixelButtonComponent'] as const;

export const TOOLTIP_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic tooltip',
    category: 'Setup',
    description: 'Attach pixelTooltip to any focusable host for a short contextual label.',
    component: TooltipBasicExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<pixel-button appearance="outline" pixelTooltip="Delete this policy permanently">
  Delete policy
</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-basic-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipBasicExample {}`,
  }),
  createDocExample({
    id: 'positions',
    title: 'Positions',
    category: 'Layout',
    description: 'Preferred side via pixelTooltipPosition; flips automatically on overflow.',
    component: TooltipPositionsExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<div class="row">
  @for (position of positions; track position) {
    <pixel-button
      appearance="tonal"
      [pixelTooltip]="'Position: ' + position"
      [pixelTooltipPosition]="position"
    >
      {{ position }}
    </pixel-button>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelTooltipDirective,
  PixelTooltipPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-positions-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './positions.example.html',
  styleUrl: './positions.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipPositionsExample {
  protected readonly positions: readonly PixelTooltipPosition[] = [
    'top',
    'bottom',
    'left',
    'right',
  ];
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'icon-buttons',
    title: 'Icon buttons',
    category: 'Layout',
    description: 'Clarify icon-only controls with concise tooltip labels.',
    component: TooltipIconButtonsExample,
    imports: ['PixelTooltipDirective', 'PixelButtonComponent'],
    html: `<div class="row">
  <pixel-button appearance="icon" ariaLabel="Edit" leadingIcon="edit"
    pixelTooltip="Edit" pixelTooltipPosition="top" />
  <pixel-button appearance="icon" ariaLabel="Duplicate" leadingIcon="content_copy"
    pixelTooltip="Duplicate" pixelTooltipPosition="top" />
  <pixel-button appearance="icon" ariaLabel="Delete permanently" leadingIcon="delete"
    class="danger-btn" pixelTooltip="Delete permanently" pixelTooltipPosition="top" />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({ /* … */ })
export class TooltipIconButtonsExample {}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.danger-btn {
  --pixel-button-primary-label: var(--pixel-sys-error);
}`,
  }),
  createDocExample({
    id: 'overflow',
    title: 'Show on overflow',
    category: 'Behavior',
    description:
      'pixelTooltipShowOnOverflow reveals the tooltip only when host text is clipped.',
    component: TooltipOverflowExample,
    imports: ['PixelTooltipDirective'],
    html: `<div class="cells">
  <div class="cell" pixelTooltip="" pixelTooltipShowOnOverflow>Short label</div>
  <div class="cell" pixelTooltip="" pixelTooltipShowOnOverflow>
    A considerably longer label that does not fit within the cell and is clipped with an ellipsis
  </div>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-overflow-example',
  standalone: true,
  imports: [PixelTooltipDirective],
  templateUrl: './overflow.example.html',
  styleUrl: './overflow.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipOverflowExample {}`,
    scss: `.cells {
  display: grid;
  gap: 0.5rem;
  max-width: 16rem;
}

.cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}`,
  }),
  createDocExample({
    id: 'triggers',
    title: 'Triggers',
    category: 'Behavior',
    description: 'pixelTooltipTrigger: hover, focus (keyboard), or both (default).',
    component: TooltipTriggersExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<div class="row">
  @for (trigger of triggers; track trigger) {
    <pixel-button
      appearance="outline"
      [pixelTooltip]="'Trigger: ' + trigger"
      [pixelTooltipTrigger]="trigger"
    >
      {{ trigger }}
    </pixel-button>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelTooltipDirective,
  PixelTooltipTrigger,
} from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-triggers-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './triggers.example.html',
  styleUrl: './triggers.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipTriggersExample {
  protected readonly triggers: readonly PixelTooltipTrigger[] = ['hover', 'focus', 'both'];
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'themes',
    title: 'Themes',
    category: 'Variants',
    description: 'inverse (default) is a dark chip; surface matches the page; primary is bold brand.',
    component: TooltipThemesExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<div class="row">
  @for (theme of themes; track theme) {
    <pixel-button
      [pixelTooltip]="theme + ' theme tooltip'"
      [pixelTooltipTheme]="theme"
      pixelTooltipPosition="bottom"
    >
      {{ theme }}
    </pixel-button>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelTooltipDirective,
  PixelTooltipTheme,
} from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-themes-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './themes.example.html',
  styleUrl: './themes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipThemesExample {
  protected readonly themes: readonly PixelTooltipTheme[] = ['inverse', 'surface', 'primary'];
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'disabled-empty',
    title: 'Disabled and empty',
    category: 'States',
    description: 'Empty message or pixelTooltipDisabled suppresses the tooltip.',
    component: TooltipDisabledEmptyExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<pixel-button appearance="outline" pixelTooltip="Never shows" [pixelTooltipDisabled]="true">
  Disabled tooltip
</pixel-button>
<pixel-button appearance="outline" pixelTooltip="">Empty message</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-disabled-empty-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './disabled-empty.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDisabledEmptyExample {}`,
  }),
  createDocExample({
    id: 'arrow',
    title: 'Plain and arrow tooltips',
    category: 'Layout',
    description: 'Add pixelTooltipArrow for a tail that points at the host in all directions.',
    component: TooltipArrowExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<pixel-button
  appearance="tonal"
  pixelTooltip="Arrow tooltip"
  pixelTooltipPosition="top"
  pixelTooltipArrow
>
  With arrow
</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-arrow-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './arrow.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipArrowExample {}`,
  }),
  createDocExample({
    id: 'custom-content',
    title: 'Rich interactive content',
    category: 'Advanced',
    description: 'Pass a template to pixelTooltipContent for titles, badges, and actions.',
    component: TooltipCustomContentExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<pixel-button
  appearance="outline"
  [pixelTooltipContent]="featureTip"
  pixelTooltipTheme="surface"
  pixelTooltipPosition="bottom"
>
  Upgrade (rich)
</pixel-button>

<ng-template #featureTip>
  <strong>Premium feature</strong>
  <p>Upgrade today to unlock this for 20% off.</p>
  <pixel-button size="sm" (click)="upgrade()">Upgrade</pixel-button>
</ng-template>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-custom-content-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './custom-content.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipCustomContentExample {
  protected upgrade(): void {
    /* handle upgrade */
  }
}`,
  }),
  createDocExample({
    id: 'delays',
    title: 'Show and hide delays',
    category: 'Behavior',
    description: 'Tune pixelTooltipShowDelay, pixelTooltipHideDelay, and pixelTooltipMaxWidth.',
    component: TooltipDelaysExample,
    imports: [...TOOLTIP_IMPORTS],
    html: `<pixel-button
  appearance="solid"
  pixelTooltip="Surface theme with custom delays"
  pixelTooltipTheme="surface"
  [pixelTooltipShowDelay]="300"
  [pixelTooltipHideDelay]="100"
  [pixelTooltipMaxWidth]="'16rem'"
>
  Hover or focus me
</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelTooltipDirective } from 'pixel-ui';

@Component({
  selector: 'docs-tooltip-delays-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelTooltipDirective],
  templateUrl: './delays.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDelaysExample {}`,
  }),
] as const;
