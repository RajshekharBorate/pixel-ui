import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-avatars-example',
  imports: [PixelSelectComponent],
  template: `
    <div class="stack">
      <pixel-select
        [searchable]="true"
        label="Reviewer (single)"
        [options]="users"
        [grouped]="true"
        [value]="reviewer()"
        (valueChange)="reviewer.set($event)"
      />
      <pixel-select
        [searchable]="true"
        [showSelectAll]="true"
        label="Assignees (multiple)"
        mode="multiple"
        [options]="users"
        [grouped]="true"
        [value]="assignees()"
        [showTags]="true"
        (valueChange)="setAssignees($event)"
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
export class SelectAvatarsExample {
  protected readonly reviewer = signal<unknown | null>('sam');
  protected readonly assignees = signal<unknown[]>(['sam', 'maya', 'infra']);

  protected readonly users: readonly PixelSelectOption[] = [
    {
      value: 'sam',
      label: 'Sam Wilson',
      subtitle: 'Design',
      meta: 'Online',
      imageSrc: 'https://i.pravatar.cc/40?img=12',
      icon: 'person',
      group: 'People',
    },
    {
      value: 'maya',
      label: 'Maya Chen',
      subtitle: 'Engineering',
      meta: 'Away',
      imageSrc: 'https://i.pravatar.cc/40?img=32',
      icon: 'person',
      group: 'People',
    },
    {
      value: 'infra',
      label: 'Infra Team',
      subtitle: 'Shared ownership',
      meta: 'Group',
      avatarText: 'IT',
      icon: 'group',
      group: 'Teams',
    },
    {
      value: 'qa',
      label: 'QA Guild',
      subtitle: 'Release quality',
      meta: 'Group',
      avatarText: 'QA',
      icon: 'groups',
      group: 'Teams',
    },
  ];

  protected setAssignees(value: unknown): void {
    this.assignees.set(Array.isArray(value) ? value : []);
  }
}
