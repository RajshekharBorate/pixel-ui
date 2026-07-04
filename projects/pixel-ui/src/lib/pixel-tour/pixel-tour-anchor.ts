import { Directive, ElementRef, Injectable,DestroyRef, inject, input, effect } from '@angular/core';

/** @internal Registry mapping anchor ids to live elements. */
@Injectable({ providedIn: 'root' })
export class PixelTourAnchorRegistry {
  private readonly anchors = new Map<string, Element>();

  register(id: string, element: Element): void {
    this.anchors.set(id, element);
  }

  unregister(id: string, element: Element): void {
    if (this.anchors.get(id) === element) {
      this.anchors.delete(id);
    }
  }

  resolve(id: string): Element | null {
    return this.anchors.get(id) ?? null;
  }
}

/**
 * Marks an element as a tour target. Preferred over CSS selectors in step definitions —
 * anchors survive refactors and don't depend on DOM structure:
 *
 * @example
 * ```html
 * <pixel-button pixelTourAnchor="create-report">New report</pixel-button>
 * ```
 * ```ts
 * tour.start([{ id: 'step-1', target: 'create-report', content: '…' }]);
 * ```
 */
@Directive({ selector: '[pixelTourAnchor]' })
export default class PixelTourAnchorDirective {
  private readonly host = inject<ElementRef<Element>>(ElementRef);
  private readonly registry = inject(PixelTourAnchorRegistry);
  private readonly destroyRef = inject(DestroyRef);

  /** Anchor id referenced from `PixelTourStep.target`. */
  readonly pixelTourAnchor = input.required<string>();

  constructor() {
    effect((onCleanup) => {
      const id = this.pixelTourAnchor();
      const element = this.host.nativeElement;
      this.registry.register(id, element);
      onCleanup(() => this.registry.unregister(id, element));
    });
    this.destroyRef.onDestroy(() =>
      this.registry.unregister(this.pixelTourAnchor(), this.host.nativeElement),
    );
  }
}
