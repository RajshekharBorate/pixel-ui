import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DocApiRow } from '../../registry/types';

export type DocApiTableKind = 'input' | 'output';

@Component({
  selector: 'docs-api-table',
  templateUrl: './doc-api-table.html',
  styleUrl: './doc-api-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocApiTableComponent {
  readonly rows = input.required<readonly DocApiRow[]>();
  readonly kind = input<DocApiTableKind>('input');

  protected readonly showDefaultColumn = computed(() => this.kind() === 'input');
  protected readonly emptyMessage = computed(() =>
    this.kind() === 'output' ? 'No outputs documented.' : 'No inputs documented.',
  );

  protected typeTokens(type: string): readonly string[] {
    return type
      .split(/\s*\|\s*/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  protected typeTokenClass(token: string): string {
    const normalized = token.replace(/['"]/g, '').toLowerCase();
    if (
      normalized === 'string' ||
      normalized === 'number' ||
      normalized === 'boolean' ||
      normalized === 'void' ||
      normalized === 'null' ||
      normalized === 'undefined'
    ) {
      return 'is-primitive';
    }
    if (/^'.+'$|^".+"$/.test(token.trim())) {
      return 'is-literal';
    }
    if (/event$/i.test(token) || normalized.includes('event')) {
      return 'is-event';
    }
    return 'is-custom';
  }

  protected formatDefault(value: string | undefined): string | null {
    if (!value) {
      return null;
    }
    return value;
  }
}
