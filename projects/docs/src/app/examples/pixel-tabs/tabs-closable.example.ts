import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelTabComponent, PixelTabsComponent } from 'pixel-ui';

interface DynamicTab {
  readonly id: number;
  readonly label: string;
}

@Component({
  selector: 'docs-tabs-closable-example',
  imports: [PixelTabsComponent, PixelTabComponent],
  template: `
    <pixel-tabs
      [(selectedIndex)]="selectedIndex"
      [addable]="true"
      ariaLabel="Open documents"
      (tabAdd)="addTab()"
      (tabClose)="closeTab($event)"
    >
      @for (tab of tabs(); track tab.id) {
        <pixel-tab [label]="tab.label" [closable]="true">
          <p class="panel">Content for {{ tab.label }}.</p>
        </pixel-tab>
      }
    </pixel-tabs>
  `,
  styles: `
    .panel {
      margin: 0;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsClosableExample {
  private nextId = 4;

  protected readonly tabs = signal<DynamicTab[]>([
    { id: 1, label: 'Document 1' },
    { id: 2, label: 'Document 2' },
    { id: 3, label: 'Document 3' },
  ]);

  protected readonly selectedIndex = signal(0);

  protected addTab(): void {
    const id = this.nextId++;
    this.tabs.update((items) => [...items, { id, label: `Document ${id}` }]);
    this.selectedIndex.set(this.tabs().length - 1);
  }

  protected closeTab(index: number): void {
    this.tabs.update((items) => items.filter((_tab, i) => i !== index));
    this.selectedIndex.update((current) =>
      Math.max(0, Math.min(current, this.tabs().length - 1)),
    );
  }
}
