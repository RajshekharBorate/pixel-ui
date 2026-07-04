import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDrawerComponent, PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-drawer-wizard-example',
  imports: [PixelButtonComponent, PixelDrawerComponent, PixelInputComponent],
  template: `
    <pixel-button (click)="open.set(true)">Open create panel</pixel-button>

    <pixel-drawer [(open)]="open" position="end" size="lg">
      <div pixelDrawerHeader class="header">
        <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
        <div>
          <strong>Create policy</strong>
          <span>Step 1 of 3 — basics</span>
        </div>
      </div>

      <form class="form" (submit)="$event.preventDefault()">
        <pixel-input label="Policy name" placeholder="Q3 enterprise renewal" />
        <pixel-input label="Owner" placeholder="Maya Chen" />
        <pixel-input label="Description" multiline [rows]="4" placeholder="Add a short summary…" />
      </form>

      <pixel-button pixelDrawerFooter appearance="text" (click)="open.set(false)">Cancel</pixel-button>
      <pixel-button pixelDrawerFooter appearance="solid" (click)="open.set(false)">Save &amp; continue</pixel-button>
    </pixel-drawer>
  `,
  styles: `
    .header {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .header span {
      display: block;
      font-size: 0.8125rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 68%, transparent);
    }

    .form {
      display: grid;
      gap: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerWizardExample {
  protected readonly open = signal(false);
}
