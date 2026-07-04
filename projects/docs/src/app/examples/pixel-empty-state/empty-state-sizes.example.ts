import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelEmptyStateComponent } from 'pixel-ui';

@Component({
  selector: 'docs-empty-state-sizes-example',
  imports: [PixelEmptyStateComponent],
  template: `
    <pixel-empty-state
      size="sm"
      align="start"
      icon="inbox"
      heading="Nothing here yet"
      description="Small, start-aligned — fits table and list bodies."
    />
    <pixel-empty-state
      icon="cloud_off"
      heading="No connected sources"
      description="Default size for panel and card bodies."
    />
    <pixel-empty-state
      size="lg"
      icon="folder_open"
      heading="Your workspace is empty"
      description="Large size for full-page first-use states."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateSizesExample {}
