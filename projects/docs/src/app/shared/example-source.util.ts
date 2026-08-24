import { Type } from '@angular/core';
import { DocExample, DocExampleFile, DocExampleFileLabel } from '../registry/types';

export const DOC_EXAMPLE_FILE_LABELS: readonly DocExampleFileLabel[] = [
  'HTML',
  'TypeScript',
  'SCSS',
];

export interface DocExampleSourceInput {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category?: string;
  readonly component: Type<unknown>;
  readonly imports?: readonly string[];
  readonly docId?: string;
  readonly canonical?: boolean;
  readonly packageImportPath?: string;
  readonly tags?: readonly string[];
  readonly composeWith?: readonly string[];
  readonly relatedIds?: readonly string[];
  readonly sourcePath?: string;
  readonly html: string;
  readonly typescript: string;
  readonly scss?: string;
  readonly htmlFilename?: string;
  readonly typescriptFilename?: string;
  readonly scssFilename?: string;
}

const EMPTY_SCSS = '/* No styles required for this example */';

export function createDocExample(input: DocExampleSourceInput): DocExample {
  const base = input.id;
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    category: input.category,
    component: input.component,
    imports: input.imports,
    docId: input.docId,
    canonicalId: input.docId ? `${input.docId}.${input.id}` : undefined,
    canonical: input.canonical,
    packageImportPath: input.packageImportPath,
    tags: input.tags,
    composeWith: input.composeWith,
    relatedIds: input.relatedIds,
    sourcePath: input.sourcePath,
    files: [
      {
        label: 'HTML',
        filename: input.htmlFilename ?? `${base}.example.html`,
        language: 'html',
        content: input.html.trim(),
      },
      {
        label: 'TypeScript',
        filename: input.typescriptFilename ?? `${base}.example.ts`,
        language: 'typescript',
        content: input.typescript.trim(),
      },
      {
        label: 'SCSS',
        filename: input.scssFilename ?? `${base}.example.scss`,
        language: 'scss',
        content: (input.scss?.trim() || EMPTY_SCSS).trim(),
      },
    ],
  };
}

export function exampleFileAt(example: DocExample, index: number): DocExampleFile {
  const files = example.files;
  return files[index] ?? files[0];
}

export function fileTabIndexForLabel(example: DocExample, label: DocExampleFileLabel): number {
  const index = example.files.findIndex((file) => file.label === label);
  return index >= 0 ? index : 0;
}
