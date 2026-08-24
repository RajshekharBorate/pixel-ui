import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelDividerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-divider-skeleton-example',
  imports: [PixelDividerComponent, PixelCheckboxComponent],
  template: `
    <pixel-checkbox
      label="Show skeleton"
      [checked]="skeleton()"
      (checkedChange)="skeleton.set($event)"
    />
    <div class="stack">
      <p>Account settings</p>
      <pixel-divider [showSkeleton]="skeleton()" />
      <p>Notification preferences</p>
      <pixel-divider labeled [showSkeleton]="skeleton()">OR</pixel-divider>
      <p>Billing</p>
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--pixel-sys-space-md, 1rem);
      margin-block-start: var(--pixel-sys-space-md, 1rem);
    }
    p {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerSkeletonExample {
  protected readonly skeleton = signal(true);
}
