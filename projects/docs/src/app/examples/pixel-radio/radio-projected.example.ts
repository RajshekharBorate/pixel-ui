import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelRadioComponent, PixelRadioGroupComponent } from 'pixel-ui';

@Component({
  selector: 'docs-radio-projected-example',
  standalone: true,
  imports: [PixelRadioGroupComponent, PixelRadioComponent],
  template: `
    <pixel-radio-group
      label="Support tier"
      [value]="tier()"
      (valueChange)="setTier($event)"
    >
      <pixel-radio value="standard" label="Standard" description="Email support" />
      <pixel-radio value="priority" label="Priority" description="24/7 support" badge="Fast" />
    </pixel-radio-group>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioProjectedExample {
  protected readonly tier = signal('standard');

  protected setTier(value: unknown): void {
    this.tier.set(String(value));
  }
}
