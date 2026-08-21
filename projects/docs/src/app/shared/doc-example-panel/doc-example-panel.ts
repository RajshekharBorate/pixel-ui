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
    const charts: string[] = [];
    const editor: string[] = [];
    const dataGrid: string[] = [];
    const main: string[] = [];
    for (const name of imports) {
      const bare = name.replace(/^type\s+/, '').trim();
      if (
        /^(PixelChart|PIXEL_CHART|ensure\w*Chart|build\w*Chart|buildSparkline|mapDrill|pushDrill|pushMapDrill|truncateDrill|truncateMapDrill|drillLevels|mapRegions|mapPoints|connectPixelCharts|exportChart|registerPixelChart|computeGeoJson)/.test(
          bare,
        )
      ) {
        charts.push(name);
      } else if (/^PixelEditor|^PIXEL_EDITOR/.test(bare)) {
        editor.push(name);
      } else if (/^PixelDataGrid|^(compareGridValues|formatGridCell|createDataGridStore)/.test(bare)) {
        dataGrid.push(name);
      } else {
        main.push(name);
      }
    }
    const lines: string[] = [];
    if (charts.length) {
      lines.push(`import { ${charts.join(', ')} } from 'pixel-ui/charts';`);
    }
    if (editor.length) {
      lines.push(`import { ${editor.join(', ')} } from 'pixel-ui/editor';`);
    }
    if (dataGrid.length) {
      lines.push(`import { ${dataGrid.join(', ')} } from 'pixel-ui/data-grid';`);
    }
    if (main.length) {
      lines.push(`import { ${main.join(', ')} } from 'pixel-ui';`);
    }
    return lines.join('\n');
  }
}
