import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PixelTitleService } from './title.service';

/**
 * Single writer for route titles. Angular's `TitleStrategy.buildTitle` walks the
 * **primary** outlet and keeps the deepest defined `title` (leaf, else ancestor).
 * Named / auxiliary outlets are ignored.
 *
 * Provided only when {@link providePixelTitle} is called with `syncRouterTitle: true`.
 * Do not register this class **and** keep `DefaultTitleStrategy` or a Router
 * `NavigationEnd` subscriber that also writes the title.
 */
@Injectable()
export class PixelTitleStrategy extends TitleStrategy {
  private readonly titles = inject(PixelTitleService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.titles.setFromRouteTitle(this.buildTitle(snapshot));
  }
}
