import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelButtonGroupComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-group-example',
  imports: [PixelButtonGroupComponent, PixelButtonComponent],
  template: `
    <div class="stack">
      <pixel-button-group appearance="outline" size="md" ariaLabel="Calendar range">
        <pixel-button appearance="outline">Day</pixel-button>
        <pixel-button appearance="outline">Week</pixel-button>
        <pixel-button appearance="outline">Month</pixel-button>
      </pixel-button-group>

      <pixel-button-group appearance="solid" size="sm" ariaLabel="Zoom">
        <pixel-button appearance="solid" ariaLabel="Zoom out" leadingIcon="remove" />
        <pixel-button appearance="solid">100%</pixel-button>
        <pixel-button appearance="solid" ariaLabel="Zoom in" leadingIcon="add" />
      </pixel-button-group>
    </div>
  `,
  styles: `
    .stack {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonGroupExample {}
