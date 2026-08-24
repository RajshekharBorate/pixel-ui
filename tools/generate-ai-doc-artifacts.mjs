import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import ts from 'typescript';

const ROOT = 'R:/Angular/pixel-ui';
const PUBLIC_API = 'projects/pixel-ui/src/public-api.ts';
const META_DIR = 'projects/docs/src/app/registry/components';
const EXAMPLES_DIR = 'projects/docs/src/app/examples';
const LIB_DIR = 'projects/pixel-ui/src/lib';
const SERVICES_DIR = join(LIB_DIR, 'services');
const GENERATED_DOC_API_PATH = 'projects/docs/src/app/registry/generated-doc-api.ts';
const AI_MANIFEST_PATH = 'projects/pixel-ui/AI-MANIFEST.json';
const SOURCE_OF_TRUTH = [
  'AGENTS.md',
  'projects/pixel-ui/CONVENTIONS.md',
  'projects/pixel-ui/src/public-api.ts',
  'projects/pixel-ui/src/lib/**/README.md',
  'projects/docs/src/app/registry/components/*.meta.ts',
  'projects/docs/src/app/examples/**',
  'projects/pixel-ui/AI-MANIFEST.json',
];

const md = (value) => String(value ?? '').replace(/\r\n/g, '\n');

function readString(node, sf) {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return node.getText(sf).replace(/^['"`]|['"`]$/g, '');
}

function readStringArray(node, sf, constArrays = new Map()) {
  if (!node || !ts.isArrayLiteralExpression(node)) {
    return [];
  }
  const values = [];
  for (const element of node.elements) {
    if (ts.isStringLiteralLike(element) || ts.isNoSubstitutionTemplateLiteral(element)) {
      values.push(readString(element, sf));
      continue;
    }
    if (ts.isSpreadElement(element) && ts.isIdentifier(element.expression)) {
      values.push(...(constArrays.get(element.expression.text) ?? []));
    }
  }
  return values;
}

function readObjectRows(node, sf) {
  if (!node || !ts.isArrayLiteralExpression(node)) {
    return [];
  }
  return node.elements
    .filter(ts.isObjectLiteralExpression)
    .map((element) => {
      const row = {};
      for (const prop of element.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = prop.name.getText(sf);
        row[key] = readString(prop.initializer, sf);
      }
      return row;
    });
}

function getObjectLiteralProperty(node, key, sf) {
  return node.properties.find(
    (prop) => ts.isPropertyAssignment(prop) && prop.name.getText(sf) === key,
  )?.initializer;
}

function parseMeta(metaPath) {
  const source = readFileSync(metaPath, 'utf8');
  const sf = ts.createSourceFile(metaPath, source, ts.ScriptTarget.Latest, true);
  let literal = null;
  ts.forEachChild(sf, (node) => {
    if (literal || !ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (ts.isObjectLiteralExpression(decl.initializer)) {
        literal = decl.initializer;
        break;
      }
    }
  });
  if (!literal) return null;

  const scalar = (key) => {
    const node = getObjectLiteralProperty(literal, key, sf);
    return node ? readString(node, sf) : '';
  };

  return {
    id: scalar('id'),
    title: scalar('title'),
    selector: scalar('selector'),
    category: scalar('category'),
    status: scalar('status'),
    summary: scalar('summary'),
    overview: readStringArray(getObjectLiteralProperty(literal, 'overview', sf), sf),
    useCases: readStringArray(getObjectLiteralProperty(literal, 'useCases', sf), sf),
    themingNotes: readStringArray(getObjectLiteralProperty(literal, 'themingNotes', sf), sf),
    accessibilityNotes: readStringArray(
      getObjectLiteralProperty(literal, 'accessibilityNotes', sf),
      sf,
    ),
    imports: readStringArray(getObjectLiteralProperty(literal, 'imports', sf), sf),
    inputs: readObjectRows(getObjectLiteralProperty(literal, 'inputs', sf), sf),
    outputs: readObjectRows(getObjectLiteralProperty(literal, 'outputs', sf), sf),
    serviceApi: readObjectRows(getObjectLiteralProperty(literal, 'serviceApi', sf), sf),
    serviceName: scalar('serviceName'),
    composeWith: readStringArray(getObjectLiteralProperty(literal, 'composeWith', sf), sf),
    supports: readStringArray(getObjectLiteralProperty(literal, 'supports', sf), sf),
    states: readStringArray(getObjectLiteralProperty(literal, 'states', sf), sf),
    themeTokens: readStringArray(getObjectLiteralProperty(literal, 'themeTokens', sf), sf),
    relatedSymbols: readStringArray(getObjectLiteralProperty(literal, 'relatedSymbols', sf), sf),
  };
}

function parseExamples(docId) {
  const file = join(EXAMPLES_DIR, docId, 'index.ts');
  if (!existsSync(file)) {
    return [];
  }
  const source = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const examples = [];
  const constArrays = new Map();

  ts.forEachChild(sf, (node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      constArrays.set(decl.name.text, readStringArray(decl.initializer, sf));
    }
  });

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'createDocExample' &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const literal = node.arguments[0];
      const scalar = (key) => {
        const value = getObjectLiteralProperty(literal, key, sf);
        return value ? readString(value, sf) : '';
      };
      examples.push({
        id: scalar('id'),
        title: scalar('title'),
        description: scalar('description'),
        category: scalar('category'),
        imports: readStringArray(getObjectLiteralProperty(literal, 'imports', sf), sf, constArrays),
        tags: readStringArray(getObjectLiteralProperty(literal, 'tags', sf), sf, constArrays),
        composeWith: readStringArray(
          getObjectLiteralProperty(literal, 'composeWith', sf),
          sf,
          constArrays,
        ),
        relatedIds: readStringArray(
          getObjectLiteralProperty(literal, 'relatedIds', sf),
          sf,
          constArrays,
        ),
        canonical: scalar('canonical') === 'true',
        packageImportPath: scalar('packageImportPath'),
        sourcePath: relative(ROOT, file).replace(/\\/g, '/'),
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return examples.map((example, index) => ({
    ...example,
    docId,
    canonicalId: `${docId}.${example.id}`,
    canonical: example.canonical || index === 0,
    packageImportPath: example.packageImportPath || inferPackageImportPath(docId, docId.startsWith('pixel-chart') ? 'charts' : ''),
  }));
}

function publicApiMap() {
  const map = new Map();

  function visit(path) {
    if (!existsSync(path)) return;
    const sf = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    ts.forEachChild(sf, (node) => {
      if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) return;
      const spec = readString(node.moduleSpecifier, sf);
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          map.set(element.name.text, spec);
        }
      } else if (!node.exportClause) {
        visit(join(path, '..', spec + '.ts'));
        visit(join(path, '..', spec, 'index.ts'));
      }
    });
  }

  visit(PUBLIC_API);
  visit('projects/pixel-ui/src/lib/pixel-editor/public-api.ts');
  visit('projects/pixel-ui/src/lib/pixel-chart/public-api.ts');
  visit('projects/pixel-ui/src/lib/services/file-transfer/public-api.ts');
  visit('projects/pixel-ui/src/lib/services/export/public-api.ts');
  visit('projects/pixel-ui/src/lib/services/navigate/public-api.ts');
  visit('projects/pixel-ui/src/lib/services/title/public-api.ts');
  return map;
}

const PUBLIC_API_SYMBOLS = publicApiMap();

function decoratorInfo(node, sf) {
  for (const dec of ts.getDecorators?.(node) ?? []) {
    const expr = dec.expression;
    if (!ts.isCallExpression(expr)) continue;
    const name = expr.expression.getText(sf);
    if (!['Component', 'Directive', 'Injectable'].includes(name)) continue;
    const arg = expr.arguments[0];
    const selectorNode =
      arg && ts.isObjectLiteralExpression(arg) ? getObjectLiteralProperty(arg, 'selector', sf) : null;
    return {
      kind: name === 'Injectable' ? 'service' : name.toLowerCase(),
      selector: selectorNode ? readString(selectorNode, sf) : '',
    };
  }
  return null;
}

function jsDocText(node) {
  const docs = node.jsDoc ?? [];
  const parts = [];
  for (const doc of docs) {
    if (typeof doc.comment === 'string') {
      parts.push(doc.comment);
    }
    for (const tag of doc.tags ?? []) {
      if (['description', 'remarks'].includes(tag.tagName?.text ?? '') && typeof tag.comment === 'string') {
        parts.push(tag.comment);
      }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function signalMembers(cls, sf) {
  const inputs = [];
  const outputs = [];
  for (const member of cls.members) {
    if (!ts.isPropertyDeclaration(member) || !member.initializer) continue;
    const init = member.initializer;
    if (!ts.isCallExpression(init)) continue;
    let fn = '';
    let required = false;
    if (ts.isIdentifier(init.expression)) fn = init.expression.text;
    else if (ts.isPropertyAccessExpression(init.expression)) {
      fn = init.expression.expression.getText(sf);
      required = init.expression.name.text === 'required';
    }
    if (!['input', 'model', 'output'].includes(fn)) continue;
    const name = member.name.getText(sf);
    let type = init.typeArguments?.map((arg) => arg.getText(sf)).join(', ') ?? '';
    let defaultValue = required ? '*required*' : '—';
    const args = init.arguments;
    let optionsArg = null;
    if (!required && args.length > 0) {
      const first = args[0];
      const firstIsOptions =
        ts.isObjectLiteralExpression(first) &&
        first.properties.some((prop) => ['transform', 'alias'].includes(prop.name?.getText(sf)));
      if (firstIsOptions) {
        optionsArg = first;
      } else {
        defaultValue = first.getText(sf);
        if (!type) {
          if (ts.isStringLiteralLike(first)) type = 'string';
          else if (first.kind === ts.SyntaxKind.TrueKeyword || first.kind === ts.SyntaxKind.FalseKeyword) type = 'boolean';
          else if (ts.isNumericLiteral(first)) type = 'number';
          else type = first.getText(sf);
        }
        if (ts.isObjectLiteralExpression(args[1] ?? {})) optionsArg = args[1];
      }
    }
    if (optionsArg) {
      const transform = optionsArg.properties.find((prop) => prop.name?.getText(sf) === 'transform');
      const transformValue = transform?.initializer?.getText(sf);
      if (transformValue === 'booleanAttribute') type = 'boolean';
      if (transformValue === 'numberAttribute') type = 'number';
    }
    const row = {
      name,
      type: type || (fn === 'output' ? 'void' : 'unknown'),
      defaultValue,
      description: jsDocText(member),
    };
    if (fn === 'output') {
      outputs.push({ name: row.name, type: row.type, description: row.description });
    } else {
      inputs.push(row);
    }
  }
  return { inputs, outputs };
}

function publicMethods(cls, sf) {
  const serviceApi = [];
  for (const member of cls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const modifiers = ts.getModifiers?.(member) ?? [];
    if (modifiers.some((mod) => [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(mod.kind))) {
      continue;
    }
    const name = member.name.getText(sf);
    if (name.startsWith('ng')) continue;
    const params = member.parameters.map((param) => param.getText(sf)).join(', ');
    const ret = member.type ? `: ${member.type.getText(sf)}` : '';
    serviceApi.push({
      name,
      signature: `${name}(${params})${ret}`,
      description: jsDocText(member),
    });
  }
  return serviceApi;
}

function collectSourceData(folder) {
  const entries = [];
  const files = readdirSync(folder).filter((name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'));
  for (const file of files) {
    const full = join(folder, file);
    const sf = ts.createSourceFile(full, readFileSync(full, 'utf8'), ts.ScriptTarget.Latest, true);
    ts.forEachChild(sf, (node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;
      const info = decoratorInfo(node, sf);
      if (!info) return;
      entries.push({
        className: node.name.text,
        selector: info.selector,
        kind: info.kind,
        doc: jsDocText(node),
        ...signalMembers(node, sf),
        serviceApi: info.kind === 'service' ? publicMethods(node, sf) : [],
      });
    });
  }
  return {
    entries,
    sourcePaths: files.map((file) => relative(ROOT, join(folder, file)).replace(/\\/g, '/')),
  };
}

function inferPackageImportPath(id, category) {
  if (id === 'pixel-data-grid' || id.startsWith('pixel-data-grid')) return 'pixel-ui/data-grid';
  if (id === 'pixel-editor' || id.startsWith('pixel-editor')) return 'pixel-ui/editor';
  if (category === 'charts' || id.startsWith('pixel-chart')) return 'pixel-ui/charts';
  return 'pixel-ui';
}

function resolveDocFolder(meta) {
  if (meta.category === 'services') {
    return join(SERVICES_DIR, meta.id.replace(/^pixel-/, ''));
  }
  return join(LIB_DIR, meta.id);
}

function parseReadmeSections(readmePath) {
  if (!existsSync(readmePath)) return {};
  const content = md(readFileSync(readmePath, 'utf8'));
  const matches = [...content.matchAll(/^##\s+(.+)$/gm)];
  const sections = {};
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index + matches[index][0].length;
    const end = matches[index + 1]?.index ?? content.length;
    sections[matches[index][1].trim().toLowerCase()] = content.slice(start, end).trim();
  }
  return {
    path: relative(ROOT, readmePath).replace(/\\/g, '/'),
    behaviorNotes: sections['behavior notes'] ?? '',
    accessibility: sections['accessibility'] ?? '',
    themeCustomization: sections['theme customization'] ?? '',
    apiContract: sections['api contract'] ?? '',
  };
}

function extractMatches(text, regex) {
  return [...new Set([...md(text).matchAll(regex)].map((match) => match[0]))];
}

function deriveStates(meta, sourceEntries, readmeText) {
  const collected = [
    ...meta.states,
    ...sourceEntries.flatMap((entry) =>
      entry.inputs
        .filter((input) => ['state', 'status', 'variant', 'appearance', 'mode'].includes(input.name))
        .flatMap((input) => extractMatches(input.type, /'[^']+'/g).map((value) => value.replace(/'/g, ''))),
    ),
  ];
  if (/disabled/i.test(readmeText)) collected.push('disabled');
  if (/loading/i.test(readmeText)) collected.push('loading');
  if (/skeleton/i.test(readmeText)) collected.push('skeleton');
  if (/error|invalid/i.test(readmeText)) collected.push('error');
  if (/success/i.test(readmeText)) collected.push('success');
  return [...new Set(collected)];
}

function deriveSupports(meta, readmeText) {
  const supports = [...meta.supports];
  const checks = [
    ['forms', /\bControlValueAccessor\b|\breactive forms\b|\btemplate-driven\b/i],
    ['keyboard', /\bkeyboard\b|\bArrow\b|\bEscape\b/i],
    ['overlay', /\boverlay\b|\bdialog\b|\bdrawer\b|\bpopover\b/i],
    ['lazy', /\blazy\b|\bdefer\b/i],
    ['theming', /data-theme|theme-root|theme-host|--pixel-/i],
    ['dark-mode', /\bdark mode\b|data-theme="dark"/i],
    ['service-composition', /\bservice\b|\binject\(/i],
    ['async', /\basync\b|\bloading\b|\bqueue\b|\bretry\b/i],
  ];
  for (const [label, pattern] of checks) {
    if (pattern.test(readmeText)) supports.push(label);
  }
  return [...new Set(supports)];
}

function deriveComposeWith(meta, examples, readmeText) {
  return [
    ...new Set([
      ...meta.composeWith,
      ...extractMatches(readmeText, /pixel-[a-z0-9-]+/g),
      ...examples.flatMap((example) => example.imports ?? []).filter((symbol) => symbol.startsWith('Pixel')),
    ]),
  ].filter((value) => value !== meta.id && value !== meta.selector);
}

function buildGeneratedEntry(meta, sourceData, examples, readme) {
  const sourceEntries = sourceData.entries;
  const kind =
    meta.category === 'services'
      ? 'service'
      : sourceEntries.find((entry) => entry.kind === 'directive')
        ? 'directive'
        : 'component';
  const publicSymbols = [
    ...new Set(
      sourceEntries
        .map((entry) => entry.className)
        .filter((symbol) => PUBLIC_API_SYMBOLS.has(symbol) || symbol === meta.serviceName),
    ),
  ];
  const imports = meta.imports.length ? meta.imports : publicSymbols;
  const readmeText = [meta.summary, ...meta.overview, ...meta.useCases, readme.behaviorNotes].join('\n');
  return {
    id: meta.id,
    kind,
    packageImportPath: inferPackageImportPath(meta.id, meta.category),
    selectors: [
      ...new Set([
        meta.selector,
        ...sourceEntries.map((entry) => entry.selector).filter(Boolean),
        ...(meta.serviceName ? [meta.serviceName] : []),
      ]),
    ],
    publicSymbols,
    relatedSymbols: [...new Set([...publicSymbols, ...imports])],
    composeWith: deriveComposeWith(meta, examples, readmeText),
    supports: deriveSupports(meta, readmeText),
    states: deriveStates(meta, sourceEntries, readmeText),
    themeTokens: [...new Set([...meta.themeTokens, ...extractMatches(readmeText, /--pixel-[a-z0-9-]+/g)])],
    sourcePaths: sourceData.sourcePaths,
    readmePath: readme.path,
    imports,
    inputs: sourceEntries.flatMap((entry) => entry.inputs),
    outputs: sourceEntries.flatMap((entry) => entry.outputs),
    serviceApi:
      meta.category === 'services'
        ? sourceEntries.flatMap((entry) => entry.serviceApi)
        : meta.serviceApi,
    serviceName: meta.serviceName || sourceEntries.find((entry) => entry.kind === 'service')?.className,
  };
}

const metaFiles = readdirSync(META_DIR).filter((name) => name.endsWith('.meta.ts')).sort();
const generatedDocApi = {};
const manifestEntries = [];

for (const file of metaFiles) {
  const meta = parseMeta(join(META_DIR, file));
  if (!meta?.id) continue;
  const folder = resolveDocFolder(meta);
  const readme = parseReadmeSections(join(folder, 'README.md'));
  const examples = parseExamples(meta.id);
  const sourceData = existsSync(folder) ? collectSourceData(folder) : { entries: [], sourcePaths: [] };
  const generatedEntry = buildGeneratedEntry(meta, sourceData, examples, readme);
  generatedDocApi[meta.id] = generatedEntry;
  manifestEntries.push({
    id: meta.id,
    title: meta.title,
    category: meta.category,
    status: meta.status,
    summary: meta.summary,
    selector: meta.selector,
    kind: generatedEntry.kind,
    packageImportPath: generatedEntry.packageImportPath,
    selectors: generatedEntry.selectors,
    publicSymbols: generatedEntry.publicSymbols,
    imports: generatedEntry.imports,
    inputs: generatedEntry.inputs,
    outputs: generatedEntry.outputs,
    serviceApi: generatedEntry.serviceApi,
    serviceName: generatedEntry.serviceName,
    composeWith: generatedEntry.composeWith,
    supports: generatedEntry.supports,
    states: generatedEntry.states,
    themeTokens: generatedEntry.themeTokens,
    relatedSymbols: generatedEntry.relatedSymbols,
    sourcePaths: generatedEntry.sourcePaths,
    readmePath: generatedEntry.readmePath,
    sourceOfTruth: SOURCE_OF_TRUTH,
    overview: meta.overview,
    useCases: meta.useCases,
    themingNotes: meta.themingNotes,
    accessibilityNotes: meta.accessibilityNotes,
    behaviorNotes: readme.behaviorNotes,
    examples,
  });
}

const tsOutput = `/* Auto-generated by tools/generate-ai-doc-artifacts.mjs. Do not edit by hand. */\n` +
  `import { DocGeneratedApiEntry } from './types';\n\n` +
  `export const GENERATED_DOC_API: Record<string, DocGeneratedApiEntry> = ${JSON.stringify(generatedDocApi, null, 2)} as const;\n`;

writeFileSync(GENERATED_DOC_API_PATH, tsOutput, 'utf8');
writeFileSync(
  AI_MANIFEST_PATH,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      packageName: 'pixel-ui',
      sourceOfTruth: SOURCE_OF_TRUTH,
      entries: manifestEntries,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(`generated ${GENERATED_DOC_API_PATH}`);
console.log(`generated ${AI_MANIFEST_PATH}`);
