import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, TitleStrategy } from '@angular/router';
import { PixelButtonComponent, PixelTitleService } from 'pixel-ui';

@Component({
  selector: 'docs-title-basic-example',
  imports: [PixelButtonComponent],
  template: `
    <p class="hint">
      PixelTitleService formats <code>document.title</code> (brand suffix, unread count, truncation)
      through Angular <code>Title</code>. This example writes the real tab title; Reset and leaving
      the page restore the current route title.
    </p>
    <p class="current">
      Current title: <strong>{{ titles.value() }}</strong>
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="policy" (click)="setPage()">
        Policies
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="inbox" (click)="setCount()">
        Inbox (3)
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="error" (click)="setNotFound()">
        Not found
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="restart_alt" (click)="restore()">
        Reset
      </pixel-button>
    </div>
    @if (note()) {
      <p class="info">{{ note() }}</p>
    }
  `,
  styles: `
    .hint,
    .current,
    .info {
      margin: 0 0 0.75rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleBasicExample {
  protected readonly titles = inject(PixelTitleService);
  protected readonly note = signal('');
  private readonly router = inject(Router);
  private readonly titleStrategy = inject(TitleStrategy);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.restoreRouteTitle());
  }

  protected setPage(): void {
    this.titles.set('Policies');
    this.note.set('Tab title set to Policies plus the configured suffix.');
  }

  protected setCount(): void {
    this.titles.set({ page: 'Inbox', count: 3 });
    this.note.set('Count-only updates debounce (~1s) so the tab does not flicker.');
  }

  protected setNotFound(): void {
    this.titles.setError('not-found');
    this.note.set('Error titles are copy, not a navigation.');
  }

  protected restore(): void {
    this.restoreRouteTitle();
    this.note.set('Restored the title for the current docs route.');
  }

  private restoreRouteTitle(): void {
    this.titleStrategy.updateTitle(this.router.routerState.snapshot);
  }
}
