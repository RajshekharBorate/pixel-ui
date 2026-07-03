import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-skeleton-example',
  standalone: true,
  imports: [PixelAutocompleteComponent, PixelCheckboxComponent],
  templateUrl: './autocomplete-skeleton.example.html',
  styleUrl: './autocomplete-skeleton.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteSkeletonExample {
  protected readonly skeleton = signal(true);
}
