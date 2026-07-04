import { createDocExample } from '../../shared/example-source.util';
import { ButtonAsyncSaveExample } from './button-async-save.example';
import { ButtonSkeletonExample } from './button-skeleton.example';
import { ButtonAppearancesExample } from './button-appearances.example';
import { ButtonBasicExample } from './button-basic.example';
import { ButtonControlledToggleExample } from './button-controlled-toggle.example';
import { ButtonFormActionsExample } from './button-form-actions.example';
import { ButtonIconShapesExample } from './button-icon-shapes.example';
import { ButtonSemanticStatesExample } from './button-semantic-states.example';
import { ButtonSizesExample } from './button-sizes.example';
import { ButtonThemingExample } from './button-theming.example';

const BUTTON_IMPORTS = ['PixelButtonComponent'] as const;

export const BUTTON_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic button',
    category: 'Setup',
    description: 'A filled primary action with default size and appearance.',
    component: ButtonBasicExample,
    imports: [...BUTTON_IMPORTS],
    html: `<pixel-button appearance="solid">Save changes</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-basic-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBasicExample {}`,
  }),
  createDocExample({
    id: 'appearances',
    title: 'Appearances',
    category: 'Variants',
    description:
      'Material M3–aligned appearances: text, elevated, outlined, filled, tonal, icon, and mini FAB — each with default and disabled states.',
    component: ButtonAppearancesExample,
    imports: [...BUTTON_IMPORTS],
    html: `<div class="matrix-head" aria-hidden="true">
  <span class="matrix-corner"></span>
  <span>Default</span>
  <span>Disabled</span>
</div>

@for (row of variantShowcase; track row.appearance) {
  <div class="matrix-row">
    <span class="matrix-label">{{ row.name }}</span>
    @for (cell of row.cells; track $index) {
      <pixel-button
        [appearance]="row.appearance"
        [disabled]="cell.disabled ?? false"
        [leadingIcon]="cell.leadingIcon ?? ''"
        [trailingIcon]="cell.trailingIcon ?? ''"
      >
        {{ cell.label }}
      </pixel-button>
    }
  </div>
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonAppearance,
  PixelButtonComponent,
  PixelButtonState,
} from 'pixel-ui';

interface VariantShowcaseRow {
  readonly name: string;
  readonly appearance: PixelButtonAppearance;
  readonly cells: readonly {
    readonly label: string;
    readonly disabled?: boolean;
    readonly state?: PixelButtonState;
    readonly leadingIcon?: string;
    readonly trailingIcon?: string;
  }[];
}

@Component({
  selector: 'docs-button-appearances-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-appearances.example.html',
  styleUrl: './button-appearances.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAppearancesExample {
  protected readonly variantShowcase: readonly VariantShowcaseRow[] = [
    {
      name: 'Text',
      appearance: 'text',
      cells: [{ label: 'Learn more' }, { label: 'Learn more', disabled: true }],
    },
    // …elevated, outlined, filled, tonal, icon, mini-fab rows
  ];
}`,
    scss: `.matrix-head,
.matrix-row {
  display: grid;
  grid-template-columns: minmax(5.5rem, 7.5rem) minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem 1rem;
  align-items: center;
}

.matrix-head {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pixel-sys-outline);
}`,
  }),
  createDocExample({
    id: 'icon-shapes',
    title: 'Icon shapes',
    category: 'Variants',
    description:
      'Use fabShape="square" on icon and mini-fab appearances for rounded-square corners.',
    component: ButtonIconShapesExample,
    imports: [...BUTTON_IMPORTS],
    html: `<div class="row">
  <pixel-button appearance="icon" ariaLabel="Favorite" leadingIcon="favorite" />
  <pixel-button appearance="icon" fabShape="square" ariaLabel="Favorite" leadingIcon="favorite" />
  <pixel-button appearance="mini-fab" ariaLabel="Edit" leadingIcon="edit" />
  <pixel-button appearance="mini-fab" fabShape="square" ariaLabel="Edit" leadingIcon="edit" />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-icon-shapes-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-icon-shapes.example.html',
  styleUrl: './button-icon-shapes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconShapesExample {}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Density scale from xs through lg, aligned to M3 control heights.',
    component: ButtonSizesExample,
    imports: [...BUTTON_IMPORTS],
    html: `<div class="row">
  @for (size of sizes; track size) {
    <div class="size-item">
      <pixel-button [size]="size" appearance="solid" trailingIcon="arrow_forward">
        Continue
      </pixel-button>
      <span class="size-tag">{{ size }}</span>
    </div>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelButtonSize } from 'pixel-ui';

@Component({
  selector: 'docs-button-sizes-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-sizes.example.html',
  styleUrl: './button-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSizesExample {
  protected readonly sizes: readonly PixelButtonSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1.25rem 1.5rem;
}

.size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.size-tag {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pixel-sys-outline);
}`,
  }),
  createDocExample({
    id: 'semantic-states',
    title: 'Semantic states',
    category: 'States',
    description:
      'state drives success, error, loading, and disabled presentation with realistic labels.',
    component: ButtonSemanticStatesExample,
    imports: [...BUTTON_IMPORTS],
    html: `<div class="row">
  <pixel-button appearance="solid">Pay $24.00</pixel-button>
  <pixel-button appearance="solid" state="success" leadingIcon="check_circle">
    Payment saved
  </pixel-button>
  <pixel-button appearance="solid" state="error">Card declined — retry</pixel-button>
  <pixel-button appearance="solid" state="loading" loadingLabel="Saving profile">
    Save profile
  </pixel-button>
  <pixel-button appearance="outline" [disabled]="true" ariaLabel="Invite already sent">
    Invite sent
  </pixel-button>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-semantic-states-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-semantic-states.example.html',
  styleUrl: './button-semantic-states.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSemanticStatesExample {}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'controlled-toggle',
    title: 'Controlled toggle',
    category: 'Behavior',
    description: 'Toggle buttons with explicit pressed state and change events.',
    component: ButtonControlledToggleExample,
    imports: [...BUTTON_IMPORTS],
    html: `<pixel-button
  appearance="tonal"
  leadingIcon="notifications"
  [toggleable]="true"
  [pressed]="notificationsEnabled()"
  ariaLabel="Push notifications"
  ariaDescribedBy="notifications-help"
  (change)="handleToggleChange($event)"
>
  {{ notificationsEnabled() ? 'Enabled' : 'Disabled' }}
</pixel-button>
<p id="notifications-help" class="helper">
  <code>change</code> carries <code>pressed</code>, <code>source</code>, and the original event.
</p>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonChangeEvent, PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-controlled-toggle-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-controlled-toggle.example.html',
  styleUrl: './button-controlled-toggle.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonControlledToggleExample {
  protected readonly notificationsEnabled = signal(false);

  protected handleToggleChange(event: PixelButtonChangeEvent): void {
    this.notificationsEnabled.set(event.pressed);
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}

.helper {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
  createDocExample({
    id: 'async-save',
    title: 'Async save',
    category: 'Behavior',
    description: 'Simulate an async workflow by toggling the loading state from your component.',
    component: ButtonAsyncSaveExample,
    imports: [...BUTTON_IMPORTS],
    html: `<pixel-button
  appearance="outline"
  [state]="isSaving() ? 'loading' : 'default'"
  loadingLabel="Saving draft"
  (click)="saveDraft()"
>
  Save draft
</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-async-save-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-async-save.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAsyncSaveExample {
  protected readonly isSaving = signal(false);

  protected saveDraft(): void {
    if (this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    window.setTimeout(() => this.isSaving.set(false), 1600);
  }
}`,
  }),
  createDocExample({
    id: 'form-actions',
    title: 'Stacked form actions',
    category: 'Layout',
    description:
      'Primary submit and secondary cancel actions with fullWidth in a narrow form column.',
    component: ButtonFormActionsExample,
    imports: [...BUTTON_IMPORTS],
    html: `<div class="stack">
  <pixel-button appearance="solid" buttonType="submit" fullWidth trailingIcon="arrow_forward">
    Place order
  </pixel-button>
  <pixel-button appearance="text" fullWidth>Keep shopping</pixel-button>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-form-actions-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-form-actions.example.html',
  styleUrl: './button-form-actions.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonFormActionsExample {}`,
    scss: `.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'theming',
    title: 'Theme scope',
    category: 'Advanced',
    description: 'Scope a subtree to the active theme using data-theme on an ancestor.',
    component: ButtonThemingExample,
    imports: [...BUTTON_IMPORTS],
    html: `<section [attr.data-theme]="themeService.themeId()">
  <pixel-button appearance="outline">Themed action</pixel-button>
</section>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'docs-button-theming-example',
  imports: [PixelButtonComponent],
  templateUrl: './button-theming.example.html',
  styleUrl: './button-theming.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonThemingExample {
  protected readonly themeService = inject(ThemeService);
}`,
    scss: `section {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 16%, transparent);
  background: var(--pixel-sys-surface-container-low);
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'States',
    description: 'showSkeleton replaces the button with a same-sized placeholder while content or permissions are loading.',
    component: ButtonSkeletonExample,
    imports: [...BUTTON_IMPORTS],
    html: `<!-- Toggle showSkeleton to swap between real and placeholder -->
<pixel-button appearance="solid"   [showSkeleton]="skeleton()">Save</pixel-button>
<pixel-button appearance="outline" [showSkeleton]="skeleton()">Cancel</pixel-button>
<pixel-button appearance="text"    [showSkeleton]="skeleton()">Learn more</pixel-button>
<pixel-button appearance="icon" leadingIcon="edit" ariaLabel="Edit" [showSkeleton]="skeleton()" />

<!-- Sizes scale the skeleton height automatically -->
@for (size of sizes; track size) {
  <pixel-button appearance="solid" [size]="size" [showSkeleton]="skeleton()">
    {{ size.toUpperCase() }}
  </pixel-button>
}`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-skeleton-example',
  imports: [PixelButtonComponent, PixelCheckboxComponent],
  templateUrl: './button-skeleton.example.html',
  styleUrl: './button-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSkeletonExample {
  protected readonly skeleton = signal(true);
  protected readonly sizes = ['xs', 'sm', 'md', 'lg'] as const;
}`,
    scss: `.grid { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.sizes { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-block-start: 1rem; }`,
  }),
] as const;
