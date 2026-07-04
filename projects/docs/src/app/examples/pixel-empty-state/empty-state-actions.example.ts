import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PixelButtonComponent, PixelCardComponent, PixelEmptyStateComponent, PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-empty-state-actions-example',
  imports: [PixelEmptyStateComponent, PixelButtonComponent, PixelCardComponent, PixelInputComponent],
  template: `
    <pixel-card appearance="outlined" padding="sm">
      <pixel-input
        label="Filter members"
        trailingIcon="search"
        [value]="query()"
        (valueChange)="query.set($event)"
      />
      @if (filtered().length > 0) {
        <ul class="members">
          @for (member of filtered(); track member) {
            <li>{{ member }}</li>
          }
        </ul>
      } @else {
        <pixel-empty-state
          announce
          icon="search_off"
          heading="No members match"
          [description]="'Nothing matches “' + query() + '”.'"
        >
          <pixel-button pixelEmptyStateActions appearance="tonal" (click)="query.set('')">
            Clear filter
          </pixel-button>
        </pixel-empty-state>
      }
    </pixel-card>
  `,
  styles: `
    :host { display: block; max-inline-size: 24rem; }
    .members { margin: 0; padding: var(--pixel-sys-space-md, 1rem); list-style: none; display: grid; gap: 0.5rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateActionsExample {
  private readonly members = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Edsger Dijkstra'];
  readonly query = signal('');
  readonly filtered = computed(() =>
    this.members.filter((m) => m.toLowerCase().includes(this.query().trim().toLowerCase())),
  );
}
