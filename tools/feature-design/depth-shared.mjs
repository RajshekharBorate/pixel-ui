/** Helpers for the in-depth "who talks to whom" and "step by step" sections. */

export function piece(intro, diagram, bullets, stories, closing = '') {
  const who = [
    intro.trim(),
    '',
    '```mermaid',
    diagram.trim(),
    '```',
    '',
    '**How to read the picture**',
    '',
    bullets.map((line) => `- ${line}`).join('\n'),
    closing.trim() ? `\n${closing.trim()}` : '',
  ].join('\n');

  const steps = [
    'Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.',
    '',
    stories
      .map(
        (story) =>
          `### ${story.title}\n\n\`\`\`mermaid\n${story.diagram.trim()}\n\`\`\`\n\n${story.note.trim()}`,
      )
      .join('\n\n'),
  ].join('\n');

  return { who, steps };
}
