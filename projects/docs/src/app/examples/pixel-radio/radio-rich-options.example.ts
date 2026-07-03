import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-rich-options-example',
  standalone: true,
  imports: [PixelRadioGroupComponent],
  template: `
    <pixel-radio-group
      label="Payment method"
      layout="horizontal"
      [options]="paymentOptions"
      value="card"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioRichOptionsExample {
  protected readonly paymentOptions: readonly PixelRadioOption<string>[] = [
    {
      value: 'card',
      label: 'Card',
      imageUrl: 'https://placehold.co/48x48/png?text=C',
      imageAlt: 'Card',
      description: 'Visa, Mastercard',
    },
    {
      value: 'bank',
      label: 'Bank',
      imageUrl: 'https://placehold.co/48x48/png?text=B',
      imageAlt: 'Bank',
      description: 'ACH transfer',
    },
  ];
}
