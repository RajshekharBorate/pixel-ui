import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'docs-button-theming-example',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <section [attr.data-theme]="themeService.themeId()">
      <pixel-button appearance="outline">Themed action</pixel-button>
    </section>
  `,
  styles: `
    section {
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 16%, transparent);
      background: var(--pixel-sys-surface-container-low);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonThemingExample {
  protected readonly themeService = inject(ThemeService);
}
