import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelSplitButtonComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-button-split-example',
  imports: [PixelSplitButtonComponent, PixelMenuComponent, PixelMenuItemComponent],
  template: `
    <div class="row">
      <pixel-split-button [menu]="saveMenu" (click)="record('Save')">Save</pixel-split-button>
      <pixel-menu #saveMenu ariaLabel="Save options">
        <pixel-menu-item icon="save_as" (selected)="record('Save as…')">Save as…</pixel-menu-item>
        <pixel-menu-item icon="done_all" (selected)="record('Save and close')">Save and close</pixel-menu-item>
      </pixel-menu>

      <pixel-split-button
        appearance="outline"
        [menu]="exportMenu"
        leadingIcon="download"
        (click)="record('Export PDF')"
      >
        Export
      </pixel-split-button>
      <pixel-menu #exportMenu ariaLabel="Export formats">
        <pixel-menu-item (selected)="record('Export CSV')">CSV</pixel-menu-item>
        <pixel-menu-item (selected)="record('Export XLSX')">XLSX</pixel-menu-item>
      </pixel-menu>
    </div>

    @if (last()) {
      <p class="log" role="status">{{ last() }}</p>
    }
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .log {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #44474f);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSplitExample {
  protected readonly last = signal('');

  protected record(action: string): void {
    this.last.set(action);
  }
}
