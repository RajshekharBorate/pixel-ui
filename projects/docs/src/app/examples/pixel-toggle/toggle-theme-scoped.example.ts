import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
  type PixelThemeId,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-theme-scoped-example',
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: `
    <div class="grid">
      @for (theme of themes; track theme.id) {
        <div class="panel" [attr.data-theme]="theme.id">
          <p class="label">{{ theme.label }}</p>
          <pixel-toggle
            switchAppearance="labeled"
            size="sm"
            ariaLabel="Theme mode"
            onLabel="Dark"
            offLabel="Light"
            [checked]="theme.id === 'enterprise-dark'"
          >
            <ng-template pixelToggleCheckedIcon>
              <pixel-toggle-thumb-icon icon="dark_mode" />
            </ng-template>
            <ng-template pixelToggleUncheckedIcon>
              <pixel-toggle-thumb-icon icon="light_mode" />
            </ng-template>
          </pixel-toggle>
        </div>
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      max-width: 24rem;
    }

    .panel {
      padding: 1rem;
      border-radius: 0.75rem;
      background: var(--pixel-sys-surface);
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 24%, transparent);
    }

    .label {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleThemeScopedExample {
  protected readonly themes: ReadonlyArray<{ readonly id: PixelThemeId; readonly label: string }> = [
    { id: 'enterprise-light', label: 'Enterprise light' },
    { id: 'enterprise-dark', label: 'Enterprise dark' },
  ];
}
