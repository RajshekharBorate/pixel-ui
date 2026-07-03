import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelDatepickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-datepicker-skeleton-example',
  standalone: true,
  imports: [PixelDatepickerComponent, PixelCheckboxComponent],
  templateUrl: './datepicker-skeleton.example.html',
  styleUrl: './datepicker-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerSkeletonExample {
  protected readonly skeleton = signal(true);
}
