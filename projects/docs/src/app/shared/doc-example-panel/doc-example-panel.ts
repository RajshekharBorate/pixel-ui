import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import {
  PixelButtonComponent,
  PixelTabComponent,
  PixelTabsComponent,
  PixelToastService,
  PixelTooltipDirective,
} from 'pixel-ui';
import { DocExample } from '../../registry/types';
import { exampleFileAt } from '../example-source.util';

@Component({
  selector: 'docs-example-panel',
  imports: [
    NgComponentOutlet,
    PixelButtonComponent,
    PixelTabComponent,
    PixelTabsComponent,
    PixelTooltipDirective,
  ],
  templateUrl: './doc-example-panel.html',
  styleUrl: './doc-example-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocExamplePanelComponent {
  private readonly toastService = inject(PixelToastService);

  readonly example = input.required<DocExample>();
  protected readonly fileTabIndex = signal(0);

  protected readonly fileTabs = computed(() => this.example().files);

  constructor() {
    effect(() => {
      this.example();
      this.fileTabIndex.set(0);
    });
  }

  protected onFileTabChange(index: number): void {
    this.fileTabIndex.set(index);
  }

  protected activeFile() {
    return exampleFileAt(this.example(), this.fileTabIndex());
  }

  protected async copyActiveFile(): Promise<void> {
    const file = this.activeFile();
    try {
      await navigator.clipboard.writeText(file.content);
      this.toastService.success('Copied', `${file.filename} copied to clipboard.`, {
        timeOut: 2200,
      });
    } catch {
      this.toastService.error('Copy failed', 'Could not access the clipboard.');
    }
  }

  protected importBlock(): string {
    const imports = this.example().imports ?? [];
    if (!imports.length) {
      return '';
    }
    return `import { ${imports.join(', ')} } from 'pixel-ui';`;
  }
}
