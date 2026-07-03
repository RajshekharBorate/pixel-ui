import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-async-search-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <div class="stack">
      <pixel-select
        label="Searchable dropdown"
        [options]="countries"
        [searchable]="true"
        [grouped]="true"
        helperText="Client-side filtering with highlighted match."
      />
      <pixel-select
        label="Async server search"
        [options]="serverOptions()"
        [value]="asyncValue()"
        [searchable]="true"
        [serverSearch]="true"
        [searchDebounceMs]="250"
        [loading]="serverLoading()"
        [grouped]="true"
        helperText="Debounced searchChange for server calls."
        (searchChange)="onServerSearch($event)"
        (valueChange)="asyncValue.set($event)"
      />
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 22rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAsyncSearchExample {
  protected readonly asyncValue = signal<unknown | null>(null);
  protected readonly serverLoading = signal(false);

  protected readonly allUsers: readonly PixelSelectOption[] = [
    {
      value: 'sam',
      label: 'Sam Wilson',
      subtitle: 'Design',
      imageSrc: 'https://i.pravatar.cc/40?img=12',
      group: 'People',
    },
    {
      value: 'maya',
      label: 'Maya Chen',
      subtitle: 'Engineering',
      imageSrc: 'https://i.pravatar.cc/40?img=32',
      group: 'People',
    },
    {
      value: 'infra',
      label: 'Infra Team',
      subtitle: 'Shared ownership',
      avatarText: 'IT',
      group: 'Teams',
    },
  ];

  protected readonly serverOptions = signal<readonly PixelSelectOption[]>(this.allUsers);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India', subtitle: 'Asia', group: 'Asia' },
    { value: 2, label: 'Japan', subtitle: 'Asia', group: 'Asia' },
    { value: 3, label: 'Germany', subtitle: 'Europe', group: 'Europe' },
    { value: 4, label: 'France', subtitle: 'Europe', group: 'Europe' },
  ];

  protected onServerSearch(query: string): void {
    this.serverLoading.set(true);
    window.setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        this.serverOptions.set(this.allUsers);
      } else {
        this.serverOptions.set(
          this.allUsers.filter((item) =>
            `${item.label} ${item.subtitle ?? ''}`.toLowerCase().includes(q),
          ),
        );
      }
      this.serverLoading.set(false);
    }, 500);
  }
}
