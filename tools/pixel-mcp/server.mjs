#!/usr/bin/env node
/**
 * Minimal stdio MCP server for Pixel UI discovery tools (zero npm deps).
 * Protocol: JSON-RPC 2.0 with LSP-style Content-Length framing.
 *
 * Tools:
 *   pixel_manifest_search
 *   pixel_example_get
 *   pixel_contract_check
 */
import { createInterface } from 'node:readline';
import { contractCheck, getExample, searchManifest } from './lib.mjs';

const SERVER_INFO = { name: 'pixel-ui', version: '0.1.0' };
const PROTOCOL_VERSION = '2024-11-05';

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
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = `Content-Length: ${body.length}\r\n\r\n`;
  process.stdout.write(header);
  process.stdout.write(body);
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

  const reply = (result) => {
    if (id === undefined || id === null) return;
    sendMessage({ jsonrpc: '2.0', id, result });
  };

  const fail = (code, errMessage) => {
    if (id === undefined || id === null) return;
    sendMessage({ jsonrpc: '2.0', id, error: { code, message: errMessage } });
  };

  switch (method) {
    case 'initialize':
      reply({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
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
    case 'tools/call':
      handleToolCall(params?.name, params?.arguments ?? {})
        .then((result) => reply(result))
        .catch((error) => fail(-32000, error instanceof Error ? error.message : String(error)));
      break;
    default:
      if (id !== undefined && id !== null) {
        fail(-32601, `Method not found: ${method}`);
      }
  }
}

/** Parse Content-Length framed JSON-RPC from stdin. */
function startStdio() {
  let buffer = Buffer.alloc(0);

  process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;
      const header = buffer.slice(0, headerEnd).toString('utf8');
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (buffer.length < bodyEnd) break;
      const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
      buffer = buffer.slice(bodyEnd);
      try {
        const message = JSON.parse(body);
        if (message.method) handleRequest(message);
      } catch (error) {
        process.stderr.write(`pixel-mcp parse error: ${error}\n`);
      }
    }
  });

  process.stdin.on('end', () => process.exit(0));
}

process.stderr.write('pixel-ui MCP server listening on stdio\n');
startStdio();
