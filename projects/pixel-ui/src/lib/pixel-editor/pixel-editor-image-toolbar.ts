import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import PixelDividerComponent from '../pixel-divider/pixel-divider';
import PixelMenuComponent from '../pixel-menu/pixel-menu';
import PixelMenuItemComponent from '../pixel-menu/pixel-menu-item';
import PixelMenuTriggerDirective from '../pixel-menu/pixel-menu-trigger';

export type PixelEditorImageToolbarState = {
  readonly src: string;
  readonly alt: string;
  readonly align: string;
  readonly width: string | null;
  readonly float: string;
  readonly hasCaption: boolean;
};

/**
 * Contextual chrome when an image (or figure) is selected.
 */
@Component({
  selector: 'pixel-editor-image-toolbar',
  imports: [
    PixelButtonComponent,
    PixelTooltipDirective,
    PixelDividerComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
  ],
  templateUrl: './pixel-editor-image-toolbar.html',
  styleUrl: './pixel-editor-image-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-editor-image-toolbar',
    role: 'toolbar',
    'aria-label': 'Image formatting',
  },
})
export default class PixelEditorImageToolbarComponent {
  readonly state = input.required<PixelEditorImageToolbarState>();

  readonly alignChange = output<'start' | 'center' | 'end'>();
  readonly floatChange = output<'none' | 'start' | 'end'>();
  readonly widthChange = output<string>();
  readonly captionToggle = output<void>();
  readonly cropRequest = output<'1:1' | '4:3' | '16:9' | 'free'>();
  readonly remove = output<void>();

  protected readonly widthOptions = [
    { value: '25%', label: '25%' },
    { value: '50%', label: '50%' },
    { value: '75%', label: '75%' },
    { value: '100%', label: '100%' },
  ] as const;

  protected widthLabel(): string {
    return this.state().width ?? 'Auto';
  }
}
