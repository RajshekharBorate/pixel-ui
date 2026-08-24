#!/usr/bin/env node
/**
 * Stdio MCP server for Pixel UI discovery tools.
 * Transport: newline-delimited JSON-RPC (MCP stdio), not LSP Content-Length.
 */
import { contractCheck, getExample, searchManifest } from './lib.mjs';

const SERVER_INFO = { name: 'pixel-ui', version: '0.1.0' };
const FALLBACK_PROTOCOL = '2024-11-05';

const TOOLS = [
  {
    name: 'pixel_manifest_search',
    description:
      'Search projects/pixel-ui/AI-MANIFEST.json for Pixel components/services by keyword, category, or kind. Prefer this over reading the full manifest.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text query (id, title, summary keywords)' },
        category: {
          type: 'string',
          description: 'Optional category filter (layout, form-controls, charts, …)',
        },
        kind: {
          type: 'string',
          description: 'Optional kind filter: component | directive | service',
        },
        limit: { type: 'number', description: 'Max results (default 12, max 50)' },
      },
    },
  },
  {
    name: 'pixel_example_get',
    description:
      'Fetch canonical/docs example metadata and file previews for a Pixel component.',
    inputSchema: {
      type: 'object',
      properties: {
        canonicalId: {
          type: 'string',
          description: 'e.g. pixel-button.basic or pixel-divider.skeleton',
        },
        docId: { type: 'string', description: 'Component id, e.g. pixel-button' },
        exampleId: { type: 'string', description: 'Example local id when using docId' },
      },
    },
  },
  {
    name: 'pixel_contract_check',
    description:
      'Validate an HTML/Angular template snippet against known Pixel selectors and input/output names from the manifest. Returns inventedApiCount.',
    inputSchema: {
      type: 'object',
      required: ['template'],
      properties: {
        template: { type: 'string', description: 'Template fragment containing pixel-* usage' },
        selector: {
          type: 'string',
          description: 'Optional primary selector if the snippet is incomplete',
        },
      },
    },
  },
];

function sendMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function toolResult(data, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    isError,
  };
}

async function handleToolCall(name, args = {}) {
  switch (name) {
    case 'pixel_manifest_search':
      return toolResult(searchManifest(args));
    case 'pixel_example_get':
      return toolResult(getExample(args));
    case 'pixel_contract_check': {
      const result = contractCheck(args);
      return toolResult(result, !result.ok);
    }
    default:
      return toolResult({ error: `Unknown tool: ${name}` }, true);
  }
}

function handleRequest(message) {
  const { id, method, params } = message;
  const hasId = id !== undefined && id !== null;

  const reply = (result) => {
    if (!hasId) return;
    sendMessage({ jsonrpc: '2.0', id, result });
  };

  const fail = (code, errMessage) => {
    if (!hasId) return;
    sendMessage({ jsonrpc: '2.0', id, error: { code, message: errMessage } });
  };

  switch (method) {
    case 'initialize':
      reply({
        protocolVersion: params?.protocolVersion || FALLBACK_PROTOCOL,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
          prompts: { listChanged: false },
        },
        serverInfo: SERVER_INFO,
      });
      break;
    case 'notifications/initialized':
    case 'notifications/cancelled':
      break;
    case 'ping':
      reply({});
      break;
    case 'tools/list':
      reply({ tools: TOOLS });
      break;
    case 'resources/list':
      reply({ resources: [] });
      break;
    case 'prompts/list':
      reply({ prompts: [] });
      break;
    case 'tools/call':
      handleToolCall(params?.name, params?.arguments ?? {})
        .then((result) => reply(result))
        .catch((error) => fail(-32000, error instanceof Error ? error.message : String(error)));
      break;
    default:
      if (hasId) fail(-32601, `Method not found: ${method}`);
  }
}

function startStdio() {
  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, '').trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      try {
        const message = JSON.parse(line);
        if (message.method) handleRequest(message);
      } catch (error) {
        process.stderr.write(`pixel-mcp parse error: ${error}\n`);
      }
    }
  });
  process.stdin.on('end', () => process.exit(0));
  process.stdin.resume();
}

startStdio();
