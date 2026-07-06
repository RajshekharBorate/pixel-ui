import { Injectable } from '@angular/core';
import { PixelTourRef } from './pixel-tour-ref';
import type { PixelTourViewConfig } from './pixel-tour.types';

/** @internal Binds a consumer-mounted panel to the active headless tour ref after inputs settle. */
@Injectable()
export class PixelTourPanelRefBridge {
  private refValue: PixelTourRef | null = null;

  bind(ref: PixelTourRef): void {
    this.refValue = ref;
  }

  clear(): void {
    this.refValue = null;
  }

  ref(): PixelTourRef {
    if (!this.refValue) {
      throw new Error('pixel-tour: pixel-tour-panel ref input is not bound yet.');
    }
    return this.refValue;
  }

  view(): PixelTourViewConfig {
    return this.ref().view;
  }
}
