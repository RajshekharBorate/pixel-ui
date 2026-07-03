import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

function makePage(page: number, size: number): PixelSelectOption[] {
  const start = (page - 1) * size;
  return Array.from({ length: size }, (_, index) => {
    const id = start + index + 1;
    return {
      value: id,
      label: `Option ${id}`,
      subtitle: `Server page ${page}`,
      meta: `#${id}`,
      avatarText: `O${id}`,
      group: id % 2 === 0 ? 'Even' : 'Odd',
    };
  });
}

@Component({
  selector: 'docs-select-infinite-scroll-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <pixel-select
      label="Infinite list"
      mode="multiple"
      [options]="pagedOptions()"
      [value]="selected()"
      [searchable]="true"
      [infiniteScroll]="true"
      [hasMore]="hasMore()"
      [loadingMore]="loadingMore()"
      [showSelectAll]="true"
      helperText="IntersectionObserver emits loadMore near panel end."
      (loadMore)="onLoadMore()"
      (valueChange)="setSelected($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectInfiniteScrollExample {
  protected readonly selected = signal<unknown[]>([]);
  protected readonly page = signal(1);
  protected readonly loadingMore = signal(false);
  protected readonly pagedOptions = signal<readonly PixelSelectOption[]>(makePage(1, 20));
  protected readonly hasMore = computed(() => this.page() < 5);

  protected setSelected(value: unknown): void {
    this.selected.set(Array.isArray(value) ? value : []);
  }

  protected onLoadMore(): void {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }
    this.loadingMore.set(true);
    const nextPage = this.page() + 1;
    window.setTimeout(() => {
      this.pagedOptions.update((current) => [...current, ...makePage(nextPage, 20)]);
      this.page.set(nextPage);
      this.loadingMore.set(false);
    }, 500);
  }
}
