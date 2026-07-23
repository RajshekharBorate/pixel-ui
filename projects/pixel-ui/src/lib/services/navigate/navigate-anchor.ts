import { Directive, ElementRef, Injectable, DestroyRef, inject, input, effect } from '@angular/core';

/** @internal Registry mapping navigate anchor ids to live elements. */
@Injectable({ providedIn: 'root' })
export class PixelNavAnchorRegistry {
  private readonly anchors = new Map<string, Element>();

  register(id: string, element: Element): void {
    if (!id) {
      return;
    }
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
 * Marks an element as a navigate / deep-link target. Prefer this over CSS selectors.
 *
 * @example
 * ```html
 * <section pixelNavAnchor="payments">…</section>
 * ```
 * ```ts
 * navigate.go({ target: { type: 'section', id: 'payments' } });
 * ```
 */
@Directive({ selector: '[pixelNavAnchor]' })
export default class PixelNavAnchorDirective {
  private readonly host = inject<ElementRef<Element>>(ElementRef);
  private readonly registry = inject(PixelNavAnchorRegistry);
  private readonly destroyRef = inject(DestroyRef);

  /** Anchor id referenced from section / composite targets. */
  readonly pixelNavAnchor = input.required<string>();

  constructor() {
    effect((onCleanup) => {
      const id = this.pixelNavAnchor();
      const element = this.host.nativeElement;
      this.registry.register(id, element);
      onCleanup(() => this.registry.unregister(id, element));
    });
    this.destroyRef.onDestroy(() =>
      this.registry.unregister(this.pixelNavAnchor(), this.host.nativeElement),
    );
  }
}
