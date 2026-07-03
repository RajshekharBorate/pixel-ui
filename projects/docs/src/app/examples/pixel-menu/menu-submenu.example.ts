import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-menu-submenu-example',
  standalone: true,
  imports: [
    PixelButtonComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
  ],
  template: `
    <pixel-button appearance="outline" [pixelMenuTriggerFor]="root">File</pixel-button>

    <pixel-menu #root ariaLabel="File menu">
      <pixel-menu-item icon="note_add" (selected)="record('New document')">New document</pixel-menu-item>
      <pixel-menu-item icon="folder_open" (selected)="record('Open')">Open…</pixel-menu-item>
      <pixel-menu-item icon="share" [pixelMenuTriggerFor]="shareMenu">Share</pixel-menu-item>
      <pixel-menu-item icon="download" [pixelMenuTriggerFor]="exportMenu">Export as</pixel-menu-item>
    </pixel-menu>

    <pixel-menu #shareMenu ariaLabel="Share">
      <pixel-menu-item icon="link" (selected)="record('Copy link')">Copy link</pixel-menu-item>
      <pixel-menu-item icon="mail" (selected)="record('Email')">Email</pixel-menu-item>
      <pixel-menu-item icon="group" [pixelMenuTriggerFor]="teamMenu">To a team</pixel-menu-item>
    </pixel-menu>

    <pixel-menu #teamMenu ariaLabel="Teams">
      <pixel-menu-item (selected)="record('Share to Design')">Design</pixel-menu-item>
      <pixel-menu-item (selected)="record('Share to Engineering')">Engineering</pixel-menu-item>
    </pixel-menu>

    <pixel-menu #exportMenu ariaLabel="Export format">
      <pixel-menu-item (selected)="record('Export PDF')">PDF</pixel-menu-item>
      <pixel-menu-item (selected)="record('Export CSV')">CSV</pixel-menu-item>
    </pixel-menu>

    @if (lastAction()) {
      <p class="log" role="status">{{ lastAction() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
    }

    .log {
      margin: 0;
      font-size: 0.8125rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSubmenuExample {
  protected readonly lastAction = signal('');

  protected record(action: string): void {
    this.lastAction.set(`Selected: ${action}`);
  }
}
