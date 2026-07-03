import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PixelCheckboxComponent, PixelDateRangePickerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-date-range-picker-skeleton-example',
  standalone: true,
  imports: [PixelDateRangePickerComponent, ReactiveFormsModule, PixelCheckboxComponent],
  templateUrl: './date-range-picker-skeleton.example.html',
  styleUrl: './date-range-picker-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangePickerSkeletonExample {
  protected readonly skeleton = signal(true);
  protected readonly form = new FormGroup({});
}
