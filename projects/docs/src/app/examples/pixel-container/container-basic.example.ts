import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelContainerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-container-basic-example',
  standalone: true,
  imports: [PixelContainerComponent],
  template: `
    <div class="frame">
      <pixel-container maxWidth="sm">
        <p>Capped at <code>sm</code> (40rem) and centered, with responsive inline padding.</p>
      </pixel-container>
    </div>
  `,
  styles: `
    .frame {
      background: var(--pixel-sys-surface-container-low, #f3f6fc);
      border-radius: 0.5rem;
    }

    p {
      margin: 0;
      font-size: 0.875rem;
    }

    code {
      font-family: monospace;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerBasicExample {}
