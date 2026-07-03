import { DocExample } from '../registry/types';

export interface DocExampleSection {
  readonly label: string;
  readonly examples: readonly DocExample[];
}

const DEFAULT_SECTION = 'General';

export function groupDocExamples(examples: readonly DocExample[]): readonly DocExampleSection[] {
  const sections = new Map<string, DocExample[]>();

  for (const example of examples) {
    const label = example.category?.trim() || DEFAULT_SECTION;
    const bucket = sections.get(label) ?? [];
    bucket.push(example);
    sections.set(label, bucket);
  }

  return [...sections.entries()].map(([label, sectionExamples]) => ({
    label,
    examples: sectionExamples,
  }));
}
