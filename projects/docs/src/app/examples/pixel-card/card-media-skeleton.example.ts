import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelCardComponent, PixelToggleComponent } from 'pixel-ui';

@Component({
  selector: 'docs-card-media-skeleton-example',
  imports: [PixelCardComponent, PixelButtonComponent, PixelToggleComponent],
  template: `
    <pixel-toggle
      label="Show skeleton"
      [checked]="loading()"
      (checkedChange)="loading.set($event)"
    />
    <div class="grid">
      <pixel-card
        cardTitle="Quarterly report"
        cardSubtitle="Finance · updated 2h ago"
        [showSkeleton]="loading()"
        skeletonHeight="16rem"
      >
        <div pixelCardMedia class="media" aria-hidden="true"></div>
        Revenue is up 14% quarter-over-quarter with services leading growth.
        <pixel-button pixelCardActions appearance="text">Open report</pixel-button>
        <pixel-button pixelCardActions appearance="text">Share</pixel-button>
      </pixel-card>
    </div>
  `,
  styles: `
    .grid {
      margin-block-start: var(--pixel-sys-space-md, 1rem);
      max-inline-size: 22rem;
    }
    .media {
      block-size: 7rem;
      background: linear-gradient(
        135deg,
        var(--pixel-sys-primary, #0b57d0),
        color-mix(in srgb, var(--pixel-sys-primary, #0b57d0) 40%, transparent)
      );
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMediaSkeletonExample {
  readonly loading = signal(false);
}
