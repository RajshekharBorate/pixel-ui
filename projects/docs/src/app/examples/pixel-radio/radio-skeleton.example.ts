import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelRadioGroupComponent, type PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-skeleton-example',
  standalone: true,
  imports: [PixelRadioGroupComponent, PixelCheckboxComponent],
  templateUrl: './radio-skeleton.example.html',
  styleUrl: './radio-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioSkeletonExample {
  protected readonly skeleton = signal(true);

  protected readonly options: readonly PixelRadioOption[] = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'post', label: 'Post' },
  ];
}
