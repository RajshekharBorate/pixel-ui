import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-menu-position-example',
  imports: [
    PixelButtonComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
  ],
  template: `
    <div class="row">
      <pixel-button appearance="outline" [pixelMenuTriggerFor]="belowAfter">below / after</pixel-button>
      <pixel-button appearance="outline" [pixelMenuTriggerFor]="belowBefore">below / before</pixel-button>
      <pixel-button appearance="outline" [pixelMenuTriggerFor]="aboveAfter">above / after</pixel-button>
      <pixel-button appearance="outline" [pixelMenuTriggerFor]="aboveBefore">above / before</pixel-button>
    </div>

    <pixel-menu #belowAfter xPosition="after" yPosition="below">
      <pixel-menu-item>Option one</pixel-menu-item>
      <pixel-menu-item>Option two</pixel-menu-item>
    </pixel-menu>
    <pixel-menu #belowBefore xPosition="before" yPosition="below">
      <pixel-menu-item>Option one</pixel-menu-item>
      <pixel-menu-item>Option two</pixel-menu-item>
    </pixel-menu>
    <pixel-menu #aboveAfter xPosition="after" yPosition="above">
      <pixel-menu-item>Option one</pixel-menu-item>
      <pixel-menu-item>Option two</pixel-menu-item>
    </pixel-menu>
    <pixel-menu #aboveBefore xPosition="before" yPosition="above">
      <pixel-menu-item>Option one</pixel-menu-item>
      <pixel-menu-item>Option two</pixel-menu-item>
    </pixel-menu>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPositionExample {}
