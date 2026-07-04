import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAutocompleteComponent, PixelAutocompleteOption } from 'pixel-ui';

@Component({
  selector: 'docs-autocomplete-rich-options-example',
  imports: [PixelAutocompleteComponent],
  template: `
    <div class="stack">
      <pixel-autocomplete
        label="Assign to"
        placeholder="Search team members…"
        [options]="members"
        [value]="member()"
        helperText="Options with avatar initials and subtitle."
        (valueChange)="member.set($event)"
      />
      <pixel-autocomplete
        label="File type"
        placeholder="Search file types…"
        [options]="fileTypes"
        [value]="fileType()"
        helperText="Options with Material Symbols icons."
        (valueChange)="fileType.set($event)"
      />
    </div>
  `,
  styles: `
    .stack { display: grid; gap: 1.25rem; max-width: 22rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteRichOptionsExample {
  protected readonly member = signal<unknown | null>(null);
  protected readonly fileType = signal<unknown | null>(null);

  protected readonly members: readonly PixelAutocompleteOption[] = [
    { value: 1, label: 'Alice Johnson', subtitle: 'Engineering · Lead', avatarText: 'AJ' },
    { value: 2, label: 'Bob Martinez', subtitle: 'Design · Senior', avatarText: 'BM' },
    { value: 3, label: 'Carol Smith', subtitle: 'Product · Manager', avatarText: 'CS' },
    { value: 4, label: 'David Kim', subtitle: 'Engineering · Mid', avatarText: 'DK' },
    { value: 5, label: 'Eva Patel', subtitle: 'QA · Senior', avatarText: 'EP' },
  ];

  protected readonly fileTypes: readonly PixelAutocompleteOption[] = [
    { value: 'pdf', label: 'PDF Document', subtitle: '.pdf', icon: 'picture_as_pdf' },
    { value: 'image', label: 'Image', subtitle: '.jpg, .png, .webp', icon: 'image' },
    { value: 'video', label: 'Video', subtitle: '.mp4, .mov', icon: 'videocam' },
    { value: 'audio', label: 'Audio', subtitle: '.mp3, .wav', icon: 'audio_file' },
    { value: 'spreadsheet', label: 'Spreadsheet', subtitle: '.xlsx, .csv', icon: 'table_chart' },
    { value: 'code', label: 'Source Code', subtitle: '.ts, .js, .py', icon: 'code' },
  ];
}
