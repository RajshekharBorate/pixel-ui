import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelInputComponent, PixelInputType } from 'pixel-ui';

interface TypeDemo {
  readonly type: PixelInputType;
  readonly label: string;
  readonly placeholder: string;
}

@Component({
  selector: 'docs-input-types-example',
  standalone: true,
  imports: [PixelInputComponent],
  template: `
    <div class="grid">
      @for (item of types; track item.type) {
        <pixel-input
          [label]="item.label"
          [type]="item.type"
          [placeholder]="item.placeholder"
          [name]="'demo-' + item.type"
          [showPasswordToggle]="item.type === 'password'"
        />
      }
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
export class InputTypesExample {
  protected readonly types: readonly TypeDemo[] = [
    { type: 'text', label: 'Text', placeholder: 'Plain text' },
    { type: 'email', label: 'Email', placeholder: 'you@example.com' },
    { type: 'password', label: 'Password', placeholder: '••••••••' },
    { type: 'number', label: 'Number', placeholder: '42' },
    { type: 'tel', label: 'Telephone', placeholder: '+1 415 555 0100' },
    { type: 'url', label: 'URL', placeholder: 'https://example.com' },
    { type: 'search', label: 'Search', placeholder: 'Search…' },
  ];
}
