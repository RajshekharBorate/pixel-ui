/**
 * Shared Pixel UI agent tooling over AI-MANIFEST.json (no extra dependencies).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = join(ROOT, 'projects/pixel-ui/AI-MANIFEST.json');

const HOST_ATTRS = new Set([
  'class',
  'style',
  'id',
  'name',
  'type',
  'role',
  'tabindex',
  'disabled',
  'readonly',
  'required',
  'hidden',
  'title',
  'href',
  'src',
  'alt',
  'for',
  'value',
  'placeholder',
  'checked',
  'selected',
  'multiple',
  'autofocus',
]);

let cachedManifest = null;

export function getRoot() {
  return ROOT;
}

export function loadManifest() {
  if (cachedManifest) return cachedManifest;
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing manifest at ${MANIFEST_PATH}. Run npm run docs:ai first.`);
  }
  cachedManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  return cachedManifest;
}

export function clearManifestCache() {
  cachedManifest = null;
}

function haystack(entry) {
  const parts = [
    entry.id,
    entry.title,
    entry.summary,
    entry.category,
    entry.selector,
    entry.kind,
    entry.packageImportPath,
    ...(entry.selectors ?? []),
    ...(entry.composeWith ?? []).map((item) => (typeof item === 'string' ? item : item?.id)),
    ...(entry.tags ?? []),
    ...(entry.supports ?? []),
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function scoreEntry(entry, tokens) {
  const text = haystack(entry);
  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (entry.id === token || entry.selector === token) score += 50;
    else if (entry.id?.includes(token) || entry.selector?.includes(token)) score += 20;
    else if (text.includes(token)) score += 5;
  }
  if (score > 0 && entry.status === 'stable') score += 1;
  return score;
}

function compactEntry(entry) {
  const examples = (entry.examples ?? []).map((ex) => ({
    id: ex.id,
    canonicalId: ex.canonicalId ?? (ex.docId && ex.id ? `${ex.docId}.${ex.id}` : undefined),
    title: ex.title,
    canonical: Boolean(ex.canonical),
    sourcePath: ex.sourcePath,
  }));
  const canonical = examples.find((ex) => ex.canonical) ?? examples[0] ?? null;
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    kind: entry.kind,
    status: entry.status,
    selector: entry.selector,
    packageImportPath: entry.packageImportPath,
    summary: entry.summary,
    composeWith: entry.composeWith ?? [],
    inputNames: (entry.inputs ?? []).map((row) => row.name),
    outputNames: (entry.outputs ?? []).map((row) => row.name),
    canonicalExampleId: canonical?.canonicalId ?? null,
    examples,
  };
}

/**
 * @param {{ query?: string, category?: string, kind?: string, limit?: number }} opts
 */
export function searchManifest(opts = {}) {
  const manifest = loadManifest();
  const query = String(opts.query ?? '').trim().toLowerCase();
  const tokens = query ? query.split(/[\s,+/|_-]+/).filter(Boolean) : [];
  const limit = Math.min(Math.max(Number(opts.limit) || 12, 1), 50);
  let entries = manifest.entries ?? [];

  if (opts.category) {
    const category = String(opts.category).toLowerCase();
    entries = entries.filter((entry) => String(entry.category).toLowerCase() === category);
  }
  if (opts.kind) {
    const kind = String(opts.kind).toLowerCase();
    entries = entries.filter((entry) => String(entry.kind).toLowerCase() === kind);
  }

  let ranked;
  if (!tokens.length) {
    ranked = entries.map((entry) => ({ entry, score: 1 }));
  } else {
    ranked = entries
      .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  }

  return {
    query: opts.query ?? '',
    category: opts.category ?? null,
    kind: opts.kind ?? null,
    totalMatched: ranked.length,
    results: ranked.slice(0, limit).map(({ entry, score }) => ({
      score,
      ...compactEntry(entry),
    })),
  };
}

export function findEntryByIdOrSelector(idOrSelector) {
  const key = String(idOrSelector ?? '').trim().toLowerCase();
  if (!key) return null;
  const entries = loadManifest().entries ?? [];
  return (
    entries.find((entry) => entry.id === key || entry.selector === key) ??
    entries.find(
      (entry) =>
        (entry.selectors ?? []).some((sel) => String(sel).toLowerCase() === key) ||
        entry.id?.toLowerCase() === key,
    ) ??
    null
  );
}

/**
 * @param {{ docId?: string, canonicalId?: string, exampleId?: string }} opts
 */
export function getExample(opts = {}) {
  const entries = loadManifest().entries ?? [];
  let entry = null;
  let example = null;

  if (opts.canonicalId) {
    const canonicalId = String(opts.canonicalId);
    for (const candidate of entries) {
      const hit = (candidate.examples ?? []).find(
        (ex) =>
          ex.canonicalId === canonicalId ||
          `${ex.docId}.${ex.id}` === canonicalId ||
          `${candidate.id}.${ex.id}` === canonicalId,
      );
      if (hit) {
        entry = candidate;
        example = hit;
        break;
      }
    }
  } else if (opts.docId) {
    entry = findEntryByIdOrSelector(opts.docId);
    if (entry) {
      const examples = entry.examples ?? [];
      example = opts.exampleId
        ? examples.find((ex) => ex.id === opts.exampleId)
        : examples.find((ex) => ex.canonical) ?? examples[0];
    }
  }

  if (!entry || !example) {
    return {
      found: false,
      error: 'Example not found. Pass canonicalId (e.g. pixel-button.basic) or docId + optional exampleId.',
    };
  }

  const exampleDir = join(ROOT, 'projects/docs/src/app/examples', entry.id);
  const files = [];
  if (existsSync(exampleDir)) {
    for (const name of readdirSync(exampleDir)) {
      if (name.includes(example.id) || name === 'index.ts') {
        const abs = join(exampleDir, name);
        files.push({
          path: `projects/docs/src/app/examples/${entry.id}/${name}`,
          preview: name.endsWith('.ts') || name.endsWith('.html') || name.endsWith('.scss')
            ? readFileSync(abs, 'utf8').slice(0, 4000)
            : null,
        });
      }
    }
  }

  return {
    found: true,
    componentId: entry.id,
    packageImportPath: entry.packageImportPath,
    example: {
      id: example.id,
      canonicalId: example.canonicalId ?? `${entry.id}.${example.id}`,
      title: example.title,
      description: example.description,
      canonical: Boolean(example.canonical),
      sourcePath: example.sourcePath,
      imports: example.imports ?? [],
    },
    files,
    inputs: (entry.inputs ?? []).slice(0, 40),
  };
}

function extractSelectors(template) {
  const selectors = new Set();
  const re = /<\/?(pixel-[a-z0-9-]+)\b/gi;
  let match;
  while ((match = re.exec(template)) !== null) {
    selectors.add(match[1].toLowerCase());
  }
  return [...selectors];
}

/** Parse each `<pixel-*>` open tag and the attribute names on that tag only. */
function extractTaggedBindings(template) {
  const tags = [];
  const re = /<(pixel-[a-z0-9-]+)(\s[^>]*)?/gi;
  let match;
  while ((match = re.exec(template)) !== null) {
    const selector = match[1].toLowerCase();
    const attrChunk = match[2] ?? '';
    const names = new Set();
    const patterns = [
      /\[\s*([a-zA-Z_][\w]*)\s*\]=/g,
      /\(\s*([a-zA-Z_][\w]*)\s*\)=/g,
      /\[\s*\(\s*([a-zA-Z_][\w]*)\s*\)\s*\]=/g,
      /(?:^|\s)([a-zA-Z_][\w]*)\s*=/g,
      /(?:^|\s)([a-zA-Z_][\w]*)(?=\s|$|\/)/g, // boolean attrs: labeled, showSkeleton
    ];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let attrMatch;
      while ((attrMatch = pattern.exec(attrChunk)) !== null) {
        names.add(attrMatch[1]);
      }
    }
    tags.push({ selector, bindings: [...names] });
  }
  return tags;
}

/**
 * Validate a template snippet against manifest input/output names.
 * @param {{ template: string, selector?: string }} opts
 */
export function contractCheck(opts = {}) {
  const template = String(opts.template ?? '');
  if (!template.trim()) {
    return { ok: false, error: 'template is required' };
  }

  const tagged = extractTaggedBindings(template);
  const selectors = opts.selector
    ? [String(opts.selector).toLowerCase()]
    : tagged.length
      ? [...new Set(tagged.map((row) => row.selector))]
      : extractSelectors(template);

  if (!selectors.length) {
    return {
      ok: false,
      error: 'No pixel-* selectors found. Pass selector explicitly or include <pixel-…> tags.',
    };
  }

  const reports = [];
  let inventedCount = 0;
  const bindingsChecked = [];

  for (const selector of selectors) {
    const entry = findEntryByIdOrSelector(selector);
    const bindingsForSelector = tagged
      .filter((row) => row.selector === selector)
      .flatMap((row) => row.bindings);
    bindingsChecked.push(...bindingsForSelector);

    if (!entry) {
      inventedCount += 1;
      reports.push({
        selector,
        found: false,
        inventedSelector: true,
        unknownBindings: [],
        knownInputs: [],
        knownOutputs: [],
      });
      continue;
    }

    const knownInputs = new Set((entry.inputs ?? []).map((row) => row.name));
    const knownOutputs = new Set((entry.outputs ?? []).map((row) => row.name));
    const allowed = new Set([...knownInputs, ...knownOutputs, ...HOST_ATTRS]);

    const ignore = new Set(['ngModel', 'ngClass', 'ngStyle', 'class', 'style']);
    const unknownBindings = [...new Set(bindingsForSelector)].filter((name) => {
      if (ignore.has(name) || name.startsWith('aria') || name.startsWith('data')) return false;
      return !allowed.has(name);
    });

    inventedCount += unknownBindings.length;
    reports.push({
      selector,
      found: true,
      id: entry.id,
      packageImportPath: entry.packageImportPath,
      inventedSelector: false,
      unknownBindings,
      knownInputs: [...knownInputs],
      knownOutputs: [...knownOutputs],
    });
  }

  return {
    ok: inventedCount === 0,
    inventedApiCount: inventedCount,
    bindingsChecked: [...new Set(bindingsChecked)],
    reports,
  };
}
