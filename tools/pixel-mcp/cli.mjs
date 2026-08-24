#!/usr/bin/env node
/**
 * CLI for Pixel UI agent tooling (same logic as the MCP server).
 *
 * Usage (PowerShell-safe — prefer positionals; avoid unquoted `<…>`):
 *   node tools/pixel-mcp/cli.mjs search "data grid" 8
 *   node tools/pixel-mcp/cli.mjs example pixel-button.basic
 *   node tools/pixel-mcp/cli.mjs contract-check --template "<pixel-button appearance=\"solid\">"
 *   node tools/pixel-mcp/cli.mjs contract-check --templateFile path.html
 */
import { readFileSync } from 'node:fs';
import { contractCheck, getExample, searchManifest } from './lib.mjs';

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  const positionals = [];
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith('--')) {
      opts[key] = true;
    } else {
      opts[key] = next;
      i += 1;
    }
  }
  return { command, opts, positionals };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

const { command, opts, positionals } = parseArgs(process.argv.slice(2));

try {
  switch (command) {
    case 'search': {
      const query = opts.query ?? opts.q ?? positionals[0] ?? '';
      const limitRaw = opts.limit ?? positionals[1];
      printJson(
        searchManifest({
          query,
          category: opts.category,
          kind: opts.kind,
          limit: limitRaw != null ? Number(limitRaw) : undefined,
        }),
      );
      break;
    }
    case 'example':
      printJson(
        getExample({
          docId: opts.docId ?? opts.id,
          canonicalId: opts.canonicalId ?? positionals[0],
          exampleId: opts.exampleId ?? positionals[1],
        }),
      );
      break;
    case 'contract-check': {
      let template = opts.template ?? positionals[0] ?? '';
      if (opts.templateFile) {
        template = readFileSync(opts.templateFile, 'utf8');
      }
      const result = contractCheck({
        template,
        selector: opts.selector ?? positionals[1],
      });
      printJson(result);
      process.exitCode = result.ok ? 0 : 1;
      break;
    }
    case 'help':
    case undefined:
      process.stdout.write(`Pixel UI agent CLI

Commands:
  search          [query] [limit]   or --query --category --kind --limit
  example         [canonicalId]     or --canonicalId / --docId --exampleId
  contract-check  [template]        or --template / --templateFile [--selector]

NPM (PowerShell: quote templates; do not leave bare <tags>):
  npm run agent:manifest-search -- "wizard" 8
  npm run agent:example-get -- pixel-divider.skeleton
  npm run agent:contract-check -- --template "<pixel-divider showSkeleton />"
`);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
