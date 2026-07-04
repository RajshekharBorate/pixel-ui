import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCardComponent } from 'pixel-ui';

@Component({
  selector: 'docs-card-interactive-example',
  imports: [PixelCardComponent],
  template: `
    <div class="grid" role="group" aria-label="Choose a plan">
      @for (plan of plans; track plan.id) {
        <pixel-card
          appearance="outlined"
          interactive
          selectable
          [selected]="selectedId() === plan.id"
          [cardTitle]="plan.name"
          [cardSubtitle]="plan.price"
          (activate)="selectedId.set(plan.id)"
        >
          {{ plan.description }}
        </pixel-card>
      }
    </div>
    <p class="result">Selected: {{ selectedId() }}</p>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: var(--pixel-sys-space-md, 1rem);
    }
    .result {
      margin-block: var(--pixel-sys-space-md, 1rem) 0;
      color: var(--pixel-sys-on-surface, #1a1b1f);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardInteractiveExample {
  protected readonly plans = [
    { id: 'starter', name: 'Starter', price: 'Free', description: 'For side projects.' },
    { id: 'team', name: 'Team', price: '$12/user', description: 'For growing teams.' },
    { id: 'enterprise', name: 'Enterprise', price: 'Contact us', description: 'SSO, audit, SLA.' },
  ];
  readonly selectedId = signal('team');
}
