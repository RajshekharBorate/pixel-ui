import type { PixelEditorDoc } from './pixel-editor.types';

type JsonNode = Record<string, unknown>;

/**
 * Best-effort TipTap JSON → Markdown serializer.
 *
 * **Limits (documented for consumers):**
 * - Panels become blockquotes with a variant label prefix.
 * - Tables are GFM pipe tables (no colspan/rowspan).
 * - Mentions render as `@label`; date chips as the ISO date string.
 * - Images use `![alt](src)` (float/align/width attrs dropped).
 * - Highlights/colors/font-size marks are ignored (plain text kept).
 * - Task lists use `- [ ]` / `- [x]`.
 * - Nested complex structures may flatten; not a round-trip guarantee.
 */
export function editorDocToMarkdown(doc: PixelEditorDoc | null | undefined): string {
  if (!doc) return '';
  const lines = serializeBlockChildren(doc);
  return lines.join('\n\n').trim() + (lines.length ? '\n' : '');
}

function serializeBlockChildren(node: JsonNode): string[] {
  const content = node['content'];
  if (!Array.isArray(content)) return [];
  const out: string[] = [];
  for (const child of content) {
    if (child && typeof child === 'object') {
      const block = serializeBlock(child as JsonNode);
      if (block) out.push(block);
    }
  }
  return out;
}

function serializeBlock(node: JsonNode): string {
  const type = String(node['type'] ?? '');
  switch (type) {
    case 'paragraph':
      return serializeInline(node).trim();
    case 'heading': {
      const level = Number((node['attrs'] as JsonNode | undefined)?.['level'] ?? 1);
      const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
      return `${hashes} ${serializeInline(node).trim()}`;
    }
    case 'bulletList':
      return serializeList(node, false);
    case 'orderedList':
      return serializeList(node, true);
    case 'taskList':
      return serializeTaskList(node);
    case 'blockquote':
      return serializeBlockChildren(node)
        .join('\n\n')
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    case 'codeBlock': {
      const lang = String((node['attrs'] as JsonNode | undefined)?.['language'] ?? '');
      const code = collectText(node);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }
    case 'horizontalRule':
      return '---';
    case 'table':
      return serializeTable(node);
    case 'panel': {
      const variant = String((node['attrs'] as JsonNode | undefined)?.['variant'] ?? 'info');
      const body = serializeBlockChildren(node).join('\n\n');
      return [`> **${variant.toUpperCase()}**`, ...body.split('\n').map((l) => `> ${l}`)].join('\n');
    }
    case 'figure': {
      const img = findChild(node, 'image');
      const caption = findChild(node, 'caption');
      const md = img ? serializeImage(img) : '';
      const cap = caption ? serializeInline(caption).trim() : '';
      return cap ? `${md}\n\n*${cap}*` : md;
    }
    case 'image':
      return serializeImage(node);
    default:
      return serializeInline(node).trim() || serializeBlockChildren(node).join('\n\n');
  }
}

function serializeList(node: JsonNode, ordered: boolean): string {
  const items = Array.isArray(node['content']) ? (node['content'] as JsonNode[]) : [];
  return items
    .map((item, i) => {
      const prefix = ordered ? `${i + 1}. ` : '- ';
      const body = serializeBlockChildren(item).join('\n\n') || serializeInline(item);
      return prefix + body.replace(/\n/g, '\n  ');
    })
    .join('\n');
}

function serializeTaskList(node: JsonNode): string {
  const items = Array.isArray(node['content']) ? (node['content'] as JsonNode[]) : [];
  return items
    .map((item) => {
      const checked = Boolean((item['attrs'] as JsonNode | undefined)?.['checked']);
      const body = serializeBlockChildren(item).join('\n\n') || serializeInline(item);
      return `- [${checked ? 'x' : ' '}] ${body.replace(/\n/g, '\n  ')}`;
    })
    .join('\n');
}

function serializeTable(node: JsonNode): string {
  const rows = Array.isArray(node['content']) ? (node['content'] as JsonNode[]) : [];
  if (rows.length === 0) return '';
  const cells = (row: JsonNode) =>
    (Array.isArray(row['content']) ? (row['content'] as JsonNode[]) : []).map((cell) =>
      serializeInline(cell).replace(/\|/g, '\\|').trim(),
    );
  const matrix = rows.map(cells);
  const colCount = Math.max(...matrix.map((r) => r.length), 0);
  const pad = (row: string[]) =>
    Array.from({ length: colCount }, (_, i) => row[i] ?? '');
  const header = pad(matrix[0] ?? []);
  const sep = header.map(() => '---');
  const body = matrix.slice(1).map((r) => `| ${pad(r).join(' | ')} |`);
  return [`| ${header.join(' | ')} |`, `| ${sep.join(' | ')} |`, ...body].join('\n');
}

function serializeImage(node: JsonNode): string {
  const attrs = (node['attrs'] as JsonNode | undefined) ?? {};
  const src = String(attrs['src'] ?? '');
  const alt = String(attrs['alt'] ?? '');
  return src ? `![${alt}](${src})` : '';
}

function serializeInline(node: JsonNode): string {
  const content = node['content'];
  if (!Array.isArray(content)) {
    return typeof node['text'] === 'string' ? applyMarks(node['text'], node['marks']) : '';
  }
  return content
    .map((child) => {
      if (!child || typeof child !== 'object') return '';
      const c = child as JsonNode;
      const type = String(c['type'] ?? '');
      if (type === 'text') {
        return applyMarks(String(c['text'] ?? ''), c['marks']);
      }
      if (type === 'hardBreak') return '  \n';
      if (type === 'mention') {
        const attrs = (c['attrs'] as JsonNode | undefined) ?? {};
        return `@${attrs['label'] ?? attrs['id'] ?? ''}`;
      }
      if (type === 'dateChip') {
        return String((c['attrs'] as JsonNode | undefined)?.['value'] ?? '');
      }
      if (type === 'image') return serializeImage(c);
      return serializeInline(c);
    })
    .join('');
}

function applyMarks(text: string, marks: unknown): string {
  if (!text) return '';
  if (!Array.isArray(marks) || marks.length === 0) return text;
  let out = text;
  for (const mark of marks) {
    if (!mark || typeof mark !== 'object') continue;
    const type = String((mark as JsonNode)['type'] ?? '');
    switch (type) {
      case 'bold':
        out = `**${out}**`;
        break;
      case 'italic':
        out = `*${out}*`;
        break;
      case 'strike':
        out = `~~${out}~~`;
        break;
      case 'code':
        out = `\`${out}\``;
        break;
      case 'link': {
        const href = String(((mark as JsonNode)['attrs'] as JsonNode | undefined)?.['href'] ?? '');
        out = href ? `[${out}](${href})` : out;
        break;
      }
      default:
        break;
    }
  }
  return out;
}

function collectText(node: JsonNode): string {
  if (typeof node['text'] === 'string') return node['text'];
  const content = node['content'];
  if (!Array.isArray(content)) return '';
  return content
    .map((c) => (c && typeof c === 'object' ? collectText(c as JsonNode) : ''))
    .join('');
}

function findChild(node: JsonNode, type: string): JsonNode | null {
  const content = node['content'];
  if (!Array.isArray(content)) return null;
  for (const child of content) {
    if (child && typeof child === 'object' && (child as JsonNode)['type'] === type) {
      return child as JsonNode;
    }
  }
  return null;
}
