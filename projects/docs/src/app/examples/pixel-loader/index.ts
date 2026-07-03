import { createDocExample } from '../../shared/example-source.util';
import { LoaderAntiFlashExample } from './loader-anti-flash.example';
import { LoaderFullscreenExample } from './loader-fullscreen.example';
import { LoaderGlobalServiceExample } from './loader-global-service.example';
import { LoaderHttpInterceptorExample } from './loader-http-interceptor.example';
import { LoaderIndicatorsExample } from './loader-indicators.example';
import { LoaderSectionOverlayExample } from './loader-section-overlay.example';
import { LoaderSkeletonPresetsExample } from './loader-skeleton-presets.example';
import { LoaderSizesExample } from './loader-sizes.example';
import { LoaderSkeletonGalleryExample } from './loader-skeleton-gallery.example';

export const LOADER_EXAMPLES = [
  createDocExample({
    id: 'indicators',
    title: 'Loader types',
    category: 'Setup',
    description: 'Seven animated indicator styles driven by one component.',
    component: LoaderIndicatorsExample,
    imports: ['PixelLoaderComponent'],
    html: `@for (item of indicators; track item.type) {
  <div class="cell">
    <pixel-loader [type]="item.type" size="lg" />
    <span class="label">{{ item.label }}</span>
  </div>
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelLoaderComponent, type PixelLoaderType } from 'pixel-ui';

@Component({
  selector: 'docs-loader-indicators-example',
  standalone: true,
  imports: [PixelLoaderComponent],
  templateUrl: './loader-indicators.example.html',
  styleUrl: './loader-indicators.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderIndicatorsExample {
  protected readonly indicators: readonly { type: PixelLoaderType; label: string }[] = [
    { type: 'spinner', label: 'Spinner' },
    { type: 'ring', label: 'Ring' },
    { type: 'dots', label: 'Dots' },
    { type: 'pulse', label: 'Pulse' },
    { type: 'bounce', label: 'Bounce' },
    { type: 'wave', label: 'Wave' },
    { type: 'bars', label: 'Bars' },
  ];
}`,
    scss: `:host {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pixel-sys-outline);
}`,
  }),
  createDocExample({
    id: 'skeleton-presets',
    title: 'Skeleton presets',
    category: 'Variants',
    description: 'Shimmer content placeholders for text, list, card, and table layouts.',
    component: LoaderSkeletonPresetsExample,
    imports: ['PixelSkeletonComponent'],
    html: `<div class="cell"><span class="label">Text</span><pixel-skeleton preset="text" /></div>
<div class="cell"><span class="label">List</span><pixel-skeleton preset="list" [rows]="3" /></div>
<div class="cell"><span class="label">Card</span><pixel-skeleton preset="card" /></div>
<div class="cell"><span class="label">Form</span><pixel-skeleton preset="form" [rows]="3" /></div>
<div class="cell cell--wide"><span class="label">Table</span><pixel-skeleton preset="table" [rows]="4" [columns]="4" /></div>
<div class="cell cell--wide"><span class="label">Dashboard</span><pixel-skeleton preset="dashboard" [rows]="3" /></div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelSkeletonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-skeleton-presets-example',
  standalone: true,
  imports: [PixelSkeletonComponent],
  templateUrl: './loader-skeleton-presets.example.html',
  styleUrl: './loader-skeleton-presets.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderSkeletonPresetsExample {}`,
    scss: `:host {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
}

.cell {
  display: grid;
  gap: 0.5rem;
}

.cell--wide {
  grid-column: 1 / -1;
}

.label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pixel-sys-outline);
}`,
  }),
  createDocExample({
    id: 'section-overlay',
    title: 'Section overlay',
    category: 'Behavior',
    description: 'Lock wrapped content while a section loads with blur and status text.',
    component: LoaderSectionOverlayExample,
    imports: ['PixelLoadingContainerComponent', 'PixelButtonComponent'],
    html: `<pixel-button appearance="solid" size="sm" (click)="runSection()">Load section (2s)</pixel-button>
<pixel-loading-container
  class="section"
  [loading]="loading()"
  scope="section"
  text="Loading orders"
  description="Fetching the latest data"
>
  <div class="content">
    <h3>Order #4821</h3>
    <p>Acme Corp · 12 items · $1,420.00</p>
  </div>
</pixel-loading-container>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelLoadingContainerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-section-overlay-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelLoadingContainerComponent],
  templateUrl: './loader-section-overlay.example.html',
  styleUrl: './loader-section-overlay.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderSectionOverlayExample {
  protected readonly loading = signal(false);

  protected runSection(): void {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 2000);
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}

.section {
  margin-block-start: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 16%, transparent);
}

.content h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.content p {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
  createDocExample({
    id: 'anti-flash',
    title: 'Anti-flash delay',
    category: 'Behavior',
    description: 'showDelay prevents the loader from flashing on fast operations.',
    component: LoaderAntiFlashExample,
    imports: ['PixelLoaderComponent', 'PixelButtonComponent'],
    html: `<pixel-button appearance="outline" size="sm" (click)="runFast()">Run fast op (150ms)</pixel-button>
<pixel-loader [loading]="loading()" [showDelay]="300" type="dots" text="Loading…" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelLoaderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-anti-flash-example',
  standalone: true,
  imports: [PixelLoaderComponent, PixelButtonComponent],
  templateUrl: './loader-anti-flash.example.html',
  styleUrl: './loader-anti-flash.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderAntiFlashExample {
  protected readonly loading = signal(false);

  protected runFast(): void {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 150);
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'xs through xl density scale for spinner, wave, and bars.',
    component: LoaderSizesExample,
    imports: ['PixelLoaderComponent'],
    html: `@for (size of sizes; track size) {
  <pixel-loader type="spinner" [size]="size" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelLoaderComponent, type PixelLoaderSize } from 'pixel-ui';

@Component({
  selector: 'docs-loader-sizes-example',
  standalone: true,
  imports: [PixelLoaderComponent],
  templateUrl: './loader-sizes.example.html',
  styleUrl: './loader-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderSizesExample {
  protected readonly sizes: readonly PixelLoaderSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'fullscreen',
    title: 'Fullscreen loader',
    category: 'Behavior',
    description: 'Locks body scroll for app bootstrap or route loading.',
    component: LoaderFullscreenExample,
    imports: ['PixelLoadingContainerComponent', 'PixelButtonComponent'],
    html: `<pixel-button appearance="solid" size="sm" (click)="runFullscreen()">Show fullscreen (2s)</pixel-button>
<pixel-loading-container
  [loading]="loading()"
  scope="fullscreen"
  size="xl"
  text="Starting up"
  description="Preparing your workspace"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelLoadingContainerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-loader-fullscreen-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelLoadingContainerComponent],
  templateUrl: './loader-fullscreen.example.html',
  styleUrl: './loader-fullscreen.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderFullscreenExample {
  protected readonly loading = signal(false);

  protected runFullscreen(): void {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 2000);
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'global-service',
    title: 'Global loading service',
    category: 'Service & configuration',
    description:
      'PixelLoadingService tracks concurrent tasks with active/count signals — wire a global overlay or bind pixel-loader to the service state.',
    component: LoaderGlobalServiceExample,
    imports: ['PixelLoadingService', 'PixelButtonComponent', 'PixelLoaderComponent'],
    html: `<pixel-button appearance="solid" size="sm" (click)="runGlobal()">Start request (1.8s)</pixel-button>
<p>Active: {{ globalActive() }} · In-flight: {{ globalCount() }}</p>
@if (globalActive()) {
  <pixel-loader type="spinner" text="Working…" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent, PixelLoaderComponent, PixelLoadingService } from 'pixel-ui';

@Component({ /* … */ })
export class LoaderGlobalServiceExample {
  private readonly loadingService = inject(PixelLoadingService);
  protected readonly globalActive = this.loadingService.active;
  protected readonly globalCount = this.loadingService.count;

  protected runGlobal(): void {
    const id = this.loadingService.start({ message: 'Working…', scope: 'demo' });
    window.setTimeout(() => this.loadingService.stop(id), 1800);
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'http-interceptor',
    title: 'HTTP interceptor',
    category: 'Service & configuration',
    description:
      'Register pixelLoadingInterceptor once in app.config.ts to drive PixelLoadingService automatically for every HttpClient request.',
    component: LoaderHttpInterceptorExample,
    imports: ['PixelLoadingService', 'pixelLoadingInterceptor', 'PixelButtonComponent', 'PixelLoaderComponent'],
    html: `<pixel-button appearance="outline" size="sm" (click)="simulateHttp()">Simulate HTTP</pixel-button>
@if (httpLoading()) {
  <pixel-loader type="dots" text="Fetching data…" />
}`,
    typescript: `import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { pixelLoadingInterceptor } from 'pixel-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([pixelLoadingInterceptor])),
  ],
};

// In a component, scope-filter with loadingService.isLoading('http').`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'skeleton-gallery',
    title: 'Skeleton gallery — all components',
    category: 'Variants',
    description: 'Every component that supports showSkeleton in one place. Toggle the checkbox to switch between live and skeleton states and verify visual parity across all sizes and layout variants.',
    component: LoaderSkeletonGalleryExample,
    imports: ['PixelSkeletonComponent'],
    html: `<!-- Use [showSkeleton]="skeleton()" on any component that supports it -->
<pixel-button appearance="solid" [showSkeleton]="skeleton()">Save</pixel-button>
<pixel-input  label="Name"       [showSkeleton]="skeleton()" />
<pixel-select label="Country"    [showSkeleton]="skeleton()" [options]="opts" />
<!-- … see component source for all variants -->`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
// Import every component you want to skeleton-test

@Component({ /* … */ })
export class LoaderSkeletonGalleryExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* Sticky toggle + section grid defined in component styles */`,
  }),
] as const;
