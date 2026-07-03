import { Type } from '@angular/core';

export type DocComponentStatus = 'stable' | 'beta' | 'experimental';

export type DocComponentCategoryId =
  | 'form-controls'
  | 'data-display'
  | 'navigation'
  | 'layout'
  | 'feedback'
  | 'advanced';

export interface DocComponentCategory {
  readonly id: DocComponentCategoryId;
  readonly label: string;
  readonly description: string;
}

export type DocExampleFileLabel = 'HTML' | 'TypeScript' | 'SCSS';

export interface DocExampleFile {
  readonly label: DocExampleFileLabel;
  readonly filename: string;
  readonly language: 'html' | 'typescript' | 'scss';
  readonly content: string;
}

export interface DocExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category?: string;
  readonly component: Type<unknown>;
  readonly files: readonly DocExampleFile[];
  readonly imports?: readonly string[];
}

export interface DocServiceApiRow {
  readonly name: string;
  readonly signature: string;
  readonly description: string;
}

export interface DocApiRow {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly description: string;
}

export interface DocComponentMeta {
  readonly id: string;
  readonly title: string;
  readonly selector: string;
  readonly category: DocComponentCategoryId;
  readonly status: DocComponentStatus;
  readonly summary: string;
  readonly overview: readonly string[];
  readonly useCases: readonly string[];
  readonly themingNotes: readonly string[];
  readonly accessibilityNotes: readonly string[];
  readonly imports: readonly string[];
  readonly inputs: readonly DocApiRow[];
  readonly outputs: readonly DocApiRow[];
  readonly serviceApi?: readonly DocServiceApiRow[];
  readonly serviceName?: string;
  readonly examples: readonly DocExample[];
}

export type DocTabId = 'overview' | 'api' | 'examples' | 'theming' | 'accessibility';

export const DOC_TABS: readonly { readonly id: DocTabId; readonly label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'api', label: 'API' },
  { id: 'examples', label: 'Examples' },
  { id: 'theming', label: 'Theming' },
  { id: 'accessibility', label: 'Accessibility' },
] as const;
