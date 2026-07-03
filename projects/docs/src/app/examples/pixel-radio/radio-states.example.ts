import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-states-example',
  standalone: true,
  imports: [PixelRadioGroupComponent],
  template: `
    <div class="grid">
      <pixel-radio-group
        label="Disabled group"
        disabled
        [options]="channelOptions"
        value="email"
      />
      <pixel-radio-group
        label="Readonly group"
        readonly
        [options]="channelOptions"
        value="sms"
      />
      <pixel-radio-group
        label="Error state"
        state="error"
        helperText="Please choose a valid option."
        required
        [options]="channelOptions"
        value=""
      />
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      max-width: 36rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioStatesExample {
  protected readonly channelOptions: readonly PixelRadioOption<string>[] = [
    { value: 'email', label: 'Email', icon: 'mail' },
    { value: 'sms', label: 'SMS', icon: 'sms' },
    { value: 'push', label: 'Push', icon: 'notifications' },
  ];
}
