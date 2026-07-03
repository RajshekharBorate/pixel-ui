import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelDividerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-divider-vertical-example',
  standalone: true,
  imports: [PixelDividerComponent, PixelButtonComponent],
  template: `
    <div class="toolbar" role="group" aria-label="Document actions">
      <pixel-button appearance="text" size="sm">Edit</pixel-button>
      <pixel-divider orientation="vertical" />
      <pixel-button appearance="text" size="sm">Share</pixel-button>
      <pixel-divider orientation="vertical" />
      <pixel-button appearance="text" size="sm">Export</pixel-button>
      <pixel-divider orientation="vertical" variant="dashed" />
      <pixel-button appearance="text" size="sm">Archive</pixel-button>
    </div>
  `,
  styles: `
    .toolbar {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      height: 2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerVerticalExample {}
