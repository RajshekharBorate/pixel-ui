import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import PixelToastComponent from './pixel-toast';
import { PixelToastService } from './pixel-toast.service';
import type { PixelToastPosition, PixelToastRecord } from './pixel-toast.types';

@Component({
  selector: 'pixel-toast-container',
  imports: [PixelToastComponent],
  templateUrl: './pixel-toast-container.html',
  styleUrl: './pixel-toast-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelToastContainerComponent {
  private readonly toastService = inject(PixelToastService);

  protected readonly positions = computed(() => {
    const active = this.toastService.activePositions();
    return active.length ? active : [];
  });

  protected toastsForPosition(position: PixelToastPosition): readonly PixelToastRecord[] {
    return this.toastService.visibleByPosition().get(position) ?? [];
  }

  protected containerClass(position: PixelToastPosition): string {
    return `pixel-toast-container pixel-toast-container--${position}`;
  }

  protected positionLabel(position: PixelToastPosition): string {
    return `Notifications ${position.replace('-', ' ')}`;
  }
}
