import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelDrawerComponent,
  type PixelDrawerSize,
} from 'pixel-ui';

@Component({
  selector: 'docs-drawer-sizes-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelDrawerComponent],
  templateUrl: './drawer-sizes.example.html',
  styleUrl: './drawer-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerSizesExample {
  protected readonly sizes: readonly PixelDrawerSize[] = ['sm', 'md', 'lg', 'xl'];
  protected readonly open = signal(false);
  protected readonly activeSize = signal<PixelDrawerSize>('md');

  protected openSize(size: PixelDrawerSize): void {
    this.activeSize.set(size);
    this.open.set(true);
  }
}
