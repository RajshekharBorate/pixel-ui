import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelRadioGroupComponent,
  PixelRadioOption,
} from 'pixel-ui';

@Component({
  selector: 'docs-radio-card-options-example',
  imports: [PixelRadioGroupComponent],
  template: `
    <pixel-radio-group
      label="Choose a plan"
      layout="grid"
      card
      bordered
      [value]="plan()"
      [options]="planOptions"
      (valueChange)="setPlan($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioCardOptionsExample {
  protected readonly plan = signal('pro');

  protected setPlan(value: unknown): void {
    this.plan.set(String(value));
  }

  protected readonly planOptions: readonly PixelRadioOption<string>[] = [
    { value: 'starter', label: 'Starter', description: 'For individuals', card: true },
    {
      value: 'pro',
      label: 'Pro',
      description: 'For growing teams',
      card: true,
      badge: 'Popular',
    },
    {
      value: 'enterprise',
      label: 'Enterprise',
      description: 'Custom contracts',
      card: true,
    },
  ];
}
