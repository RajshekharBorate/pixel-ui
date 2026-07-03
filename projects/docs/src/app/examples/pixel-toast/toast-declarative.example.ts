import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelToastComponent } from 'pixel-ui';

@Component({
  selector: 'docs-toast-declarative-example',
  standalone: true,
  imports: [PixelToastComponent],
  template: `
    <p class="lede">Use pixel-toast directly for static inline banners without the service.</p>
    <div class="stack">
      <pixel-toast
        type="warning"
        variant="outlined"
        placement="inline"
        message="Session expires in 5 minutes."
        [closeButton]="false"
      />
      <pixel-toast
        type="info"
        variant="outlined"
        placement="inline"
        message="Changes may take up to 24 hours to propagate."
        [closeButton]="false"
      />
      <pixel-toast
        type="success"
        variant="soft"
        placement="inline"
        title="Connected"
        message="Realtime updates are enabled."
        [progressBar]="false"
      />
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
    }

    .lede {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }

    .stack {
      display: grid;
      gap: 0.65rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastDeclarativeExample {}
