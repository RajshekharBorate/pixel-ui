import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { nativeDateAdapterProviders } from 'pixel-ui';
import {
  PixelAccordionComponent,
  PixelAvatarComponent,
  PixelAvatarGroupComponent,
  PixelBadgeComponent,
  PixelBreadcrumbComponent,
  PixelButtonComponent,
  PixelCheckboxComponent,
  PixelChipComponent,
  PixelChipSetComponent,
  PixelDatepickerComponent,
  PixelExpansionPanelComponent,
  PixelInputComponent,
  PixelProgressBarComponent,
  PixelProgressCircleComponent,
  PixelRadioGroupComponent,
  PixelSelectComponent,
  PixelStepComponent,
  PixelStepperComponent,
  PixelTabComponent,
  PixelTabsComponent,
  PixelToggleComponent,
  type PixelAvatarData,
  type PixelBreadcrumbItem,
  type PixelChipItem,
  type PixelRadioOption,
  type PixelSelectOption,
} from 'pixel-ui';

@Component({
  selector: 'docs-skeleton-gallery-example',
  providers: [...nativeDateAdapterProviders()],
  imports: [
    PixelCheckboxComponent,
    PixelButtonComponent,
    PixelInputComponent,
    PixelSelectComponent,
    PixelCheckboxComponent,
    PixelRadioGroupComponent,
    PixelToggleComponent,
    PixelChipComponent,
    PixelChipSetComponent,
    PixelBadgeComponent,
    PixelAvatarComponent,
    PixelAvatarGroupComponent,
    PixelBreadcrumbComponent,
    PixelTabComponent,
    PixelTabsComponent,
    PixelStepComponent,
    PixelStepperComponent,
    PixelProgressBarComponent,
    PixelProgressCircleComponent,
    PixelAccordionComponent,
    PixelExpansionPanelComponent,
    PixelDatepickerComponent,
  ],
  template: `
    <!-- ── Global toggle ───────────────────────────────────────── -->
    <div class="gallery-toggle">
      <pixel-checkbox
        label="Show all skeletons"
        [checked]="skeleton()"
        (checkedChange)="skeleton.set($event)"
      />
    </div>

    <!-- ── BUTTONS ──────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Button</h3>
      <div class="gallery-row">
        <pixel-button appearance="solid"    [showSkeleton]="skeleton()">Save</pixel-button>
        <pixel-button appearance="outline"  [showSkeleton]="skeleton()">Cancel</pixel-button>
        <pixel-button appearance="text"     [showSkeleton]="skeleton()">Learn more</pixel-button>
        <pixel-button appearance="tonal"    [showSkeleton]="skeleton()">Export</pixel-button>
        <pixel-button appearance="elevated" [showSkeleton]="skeleton()">Elevated</pixel-button>
        <pixel-button appearance="icon" leadingIcon="edit"   ariaLabel="Edit"   [showSkeleton]="skeleton()" />
        <pixel-button appearance="icon" leadingIcon="delete" ariaLabel="Delete" fabShape="square" [showSkeleton]="skeleton()" />
      </div>
      <div class="gallery-row gallery-row--wrap">
        @for (size of btnSizes; track size) {
          <pixel-button appearance="solid" [size]="size" [showSkeleton]="skeleton()">
            {{ size.toUpperCase() }}
          </pixel-button>
        }
      </div>
    </section>

    <!-- ── INPUT ────────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Input</h3>
      <div class="gallery-grid">
        <pixel-input label="Single-line md" [showSkeleton]="skeleton()" />
        <pixel-input label="Single-line sm" size="sm" [showSkeleton]="skeleton()" />
        <pixel-input label="Single-line lg" size="lg" [showSkeleton]="skeleton()" />
        <pixel-input label="Floating label" labelPosition="floating" [showSkeleton]="skeleton()" />
        <pixel-input label="Multiline" [multiline]="true" [rows]="3" [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── SELECT ───────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Select</h3>
      <div class="gallery-grid">
        <pixel-select label="Single md"  [options]="selectOpts" [showSkeleton]="skeleton()" />
        <pixel-select label="Single sm"  [options]="selectOpts" size="sm" [showSkeleton]="skeleton()" />
        <pixel-select label="Single lg"  [options]="selectOpts" size="lg" [showSkeleton]="skeleton()" />
        <pixel-select label="Floating"   [options]="selectOpts" labelPosition="floating" [showSkeleton]="skeleton()" />
        <pixel-select label="Multiple"   [options]="selectOpts" mode="multiple" [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── CHECKBOX ─────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Checkbox</h3>
      <div class="gallery-row gallery-row--wrap">
        <pixel-checkbox label="With label"    [showSkeleton]="skeleton()" />
        <pixel-checkbox                       [showSkeleton]="skeleton()" />
        <pixel-checkbox label="Size xs" size="xs" [showSkeleton]="skeleton()" />
        <pixel-checkbox label="Size sm" size="sm" [showSkeleton]="skeleton()" />
        <pixel-checkbox label="Size lg" size="lg" [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── RADIO GROUP ──────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Radio Group</h3>
      <div class="gallery-grid gallery-grid--3">
        <pixel-radio-group label="Vertical"   [options]="radioOpts"               [showSkeleton]="skeleton()" />
        <pixel-radio-group label="Horizontal" [options]="radioOpts" layout="horizontal" [showSkeleton]="skeleton()" />
        <pixel-radio-group label="Grid"       [options]="radioOpts" layout="grid"       [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── TOGGLE ───────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Toggle</h3>
      <div class="gallery-row gallery-row--wrap">
        @for (size of toggleSizes; track size) {
          <pixel-toggle label="{{ size.toUpperCase() }}" [size]="size" [showSkeleton]="skeleton()" />
        }
      </div>
    </section>

    <!-- ── CHIP (individual) ────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Chip</h3>
      <div class="gallery-row gallery-row--wrap">
        <pixel-chip label="Solid md"    variant="solid"   [showSkeleton]="skeleton()" />
        <pixel-chip label="Outline md"  variant="outline" [showSkeleton]="skeleton()" />
        <pixel-chip label="Size xs"     size="xs"         [showSkeleton]="skeleton()" />
        <pixel-chip label="Size sm"     size="sm"         [showSkeleton]="skeleton()" />
        <pixel-chip label="Size lg"     size="lg"         [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── CHIP SET ─────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Chip Set</h3>
      <div class="gallery-stack">
        <pixel-chip-set [chips]="chipSetItems" layout="wrap"       [showSkeleton]="skeleton()" />
        <pixel-chip-set [chips]="chipSetItems" layout="horizontal" [showSkeleton]="skeleton()" />
        <pixel-chip-set [chips]="chipSetItems" layout="vertical"   [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── BADGE ────────────────────────────────────────────────── -->
    <!-- position="inline" required for standalone badges — the default 'top-right' uses
         position:absolute (overlay mode) which causes overlap in normal flow. -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Badge</h3>
      <div class="gallery-row gallery-row--wrap">
        <pixel-badge type="count"  [value]="3"     position="inline" [showSkeleton]="skeleton()" />
        <pixel-badge type="label"  label="New"     position="inline" [showSkeleton]="skeleton()" />
        <pixel-badge type="dot"                    position="inline" [showSkeleton]="skeleton()" />
        <pixel-badge type="pulse"                  position="inline" [showSkeleton]="skeleton()" />
        <pixel-badge type="status" state="success" position="inline" [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── AVATAR ───────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Avatar</h3>
      <div class="gallery-row gallery-row--wrap">
        @for (size of avatarSizes; track size) {
          <pixel-avatar name="John Doe" initials="JD" [size]="size" [showSkeleton]="skeleton()" />
        }
      </div>
    </section>

    <!-- ── AVATAR GROUP ─────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Avatar Group</h3>
      <div class="gallery-stack">
        <pixel-avatar-group [avatars]="avatarGroupData" layout="stack" [showSkeleton]="skeleton()" />
        <pixel-avatar-group [avatars]="avatarGroupData" layout="grid"  [showSkeleton]="skeleton()" />
        <pixel-avatar-group [avatars]="avatarGroupData" layout="stack" size="sm" [showSkeleton]="skeleton()" />
        <pixel-avatar-group [avatars]="avatarGroupData" layout="stack" size="lg" [showSkeleton]="skeleton()" />
      </div>
    </section>

    <!-- ── BREADCRUMB ───────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Breadcrumb</h3>
      <pixel-breadcrumb [items]="breadcrumbItems" [showSkeleton]="skeleton()" />
    </section>

    <!-- ── TABS ─────────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Tabs</h3>
      <div class="gallery-stack">
        <pixel-tabs appearance="underline" [skeletonCount]="4" [showSkeleton]="skeleton()">
          <pixel-tab label="Overview"><span class="tab-body">Overview content</span></pixel-tab>
          <pixel-tab label="Analytics"><span class="tab-body">Analytics content</span></pixel-tab>
          <pixel-tab label="Reports"><span class="tab-body">Reports content</span></pixel-tab>
          <pixel-tab label="Settings"><span class="tab-body">Settings content</span></pixel-tab>
        </pixel-tabs>
        <pixel-tabs appearance="pill" [skeletonCount]="3" [showSkeleton]="skeleton()">
          <pixel-tab label="All"><span class="tab-body">All items</span></pixel-tab>
          <pixel-tab label="Active"><span class="tab-body">Active items</span></pixel-tab>
          <pixel-tab label="Archived"><span class="tab-body">Archived items</span></pixel-tab>
        </pixel-tabs>
      </div>
    </section>

    <!-- ── STEPPER ──────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Stepper</h3>
      <div class="gallery-stack">
        <pixel-stepper [skeletonSteps]="4" [showSkeleton]="skeleton()">
          <pixel-step label="Personal info" />
          <pixel-step label="Address" />
          <pixel-step label="Payment" />
          <pixel-step label="Review" />
        </pixel-stepper>
        <pixel-stepper type="vertical" [skeletonSteps]="3" [showSkeleton]="skeleton()">
          <pixel-step label="Account" />
          <pixel-step label="Preferences" />
          <pixel-step label="Confirm" />
        </pixel-stepper>
      </div>
    </section>

    <!-- ── PROGRESS ─────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Progress</h3>
      <div class="gallery-stack">
        <pixel-progress-bar [value]="60" [showSkeleton]="skeleton()" />
        <pixel-progress-bar [value]="60" size="sm" [showSkeleton]="skeleton()" />
        <pixel-progress-bar [value]="60" size="lg" [showSkeleton]="skeleton()" />
      </div>
      <div class="gallery-row gallery-row--wrap">
        @for (size of circSizes; track size) {
          <pixel-progress-circle [value]="60" [size]="size" [showSkeleton]="skeleton()" />
        }
      </div>
    </section>

    <!-- ── ACCORDION ────────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Accordion</h3>
      <div class="gallery-stack">
        <pixel-accordion>
          <pixel-expansion-panel title="Account settings"                                          [showSkeleton]="skeleton()" />
          <pixel-expansion-panel title="Notifications"   description="Email and push preferences"  [showSkeleton]="skeleton()" />
          <pixel-expansion-panel title="Security"        icon="lock"                               [showSkeleton]="skeleton()" />
        </pixel-accordion>
        <pixel-accordion size="sm">
          <pixel-expansion-panel title="Small size" description="sm density" [showSkeleton]="skeleton()" />
          <pixel-expansion-panel title="Another panel"                        [showSkeleton]="skeleton()" />
        </pixel-accordion>
        <pixel-accordion size="lg">
          <pixel-expansion-panel title="Large size" icon="expand_more" [showSkeleton]="skeleton()" />
          <pixel-expansion-panel title="Another panel"                  [showSkeleton]="skeleton()" />
        </pixel-accordion>
      </div>
    </section>

    <!-- ── DATEPICKER ───────────────────────────────────────────── -->
    <section class="gallery-section">
      <h3 class="gallery-section__title">Datepicker</h3>
      <div class="gallery-grid">
        <pixel-datepicker label="Date md"  [showSkeleton]="skeleton()" />
        <pixel-datepicker label="Date sm"  size="sm" [showSkeleton]="skeleton()" />
        <pixel-datepicker label="Date lg"  size="lg" [showSkeleton]="skeleton()" />
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }

    .gallery-toggle {
      position: sticky;
      top: 0;
      z-index: 10;
      padding: 0.75rem 1rem;
      background: color-mix(in srgb, var(--pixel-sys-surface) 92%, transparent);
      backdrop-filter: blur(8px);
      border-radius: 0.75rem;
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 12%, transparent);
      margin-block-end: 1.5rem;
    }

    .gallery-section {
      margin-block-end: 2rem;
    }

    .gallery-section__title {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--pixel-sys-outline);
    }

    .gallery-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-block-end: 0.5rem;
    }

    .gallery-row--wrap { flex-wrap: wrap; }

    .gallery-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      gap: 1rem;
    }

    .gallery-grid--3 {
      grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    }

    .tab-body {
      display: block;
      padding: 0.75rem 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-outline);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderSkeletonGalleryExample {
  protected readonly skeleton = signal(true);

  protected readonly btnSizes = ['xs', 'sm', 'md', 'lg'] as const;
  protected readonly toggleSizes = ['sm', 'md', 'lg'] as const;
  protected readonly avatarSizes = ['xs', 'sm', 'md', 'lg'] as const;
  protected readonly circSizes = ['xs', 'sm', 'md', 'lg'] as const;

  protected readonly selectOpts: readonly PixelSelectOption[] = [
    { value: 1, label: 'Option A' },
    { value: 2, label: 'Option B' },
    { value: 3, label: 'Option C' },
  ];

  protected readonly radioOpts: readonly PixelRadioOption[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];

  protected readonly chipSetItems: readonly PixelChipItem[] = [
    { label: 'Design' },
    { label: 'Engineering' },
    { label: 'Product' },
    { label: 'Marketing' },
  ];

  protected readonly avatarGroupData: readonly PixelAvatarData[] = [
    { name: 'Alice', initials: 'AL' },
    { name: 'Bob',   initials: 'BO' },
    { name: 'Carol', initials: 'CA' },
    { name: 'Dave',  initials: 'DA' },
    { name: 'Eve',   initials: 'EV' },
  ];

  protected readonly breadcrumbItems: readonly PixelBreadcrumbItem[] = [
    { label: 'Home',       href: '#' },
    { label: 'Components', href: '#' },
    { label: 'Breadcrumb'             },
  ];

}
