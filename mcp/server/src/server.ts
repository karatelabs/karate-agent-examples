// A tiny MCP inventory server — the system under test for the checks in ../checks.
// Streamable HTTP on http://localhost:3001/mcp, stateless transport: a fresh McpServer per request,
// with the inventory itself held at module level so state survives across requests.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import * as z from 'zod/v4';

type Item = { sku: string; name: string; qty: number };

const inventory = new Map<string, Item>();

const itemShape = { sku: z.string(), name: z.string(), qty: z.number() };
const listShape = { items: z.array(z.object(itemShape)) };

const ok = (structuredContent: object) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }],
  structuredContent
});

const fail = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true
});

function buildServer(): McpServer {
  const server = new McpServer({ name: 'inventory', version: '1.0.0' });

  server.registerTool(
    'add_item',
    {
      description: 'Add a new item to the inventory. Fails if the sku already exists.',
      inputSchema: {
        sku: z.string().describe('Stock keeping unit — unique across the inventory'),
        name: z.string().describe('Human readable item name'),
        qty: z.number().optional().describe('Starting quantity, defaults to 1')
      },
      outputSchema: itemShape
    },
    async ({ sku, name, qty }) => {
      console.log(`add_item ${sku}`);
      if (inventory.has(sku)) {
        return fail(`sku ${sku} already exists`);
      }
      const item: Item = { sku, name, qty: qty ?? 1 };
      inventory.set(sku, item);
      return ok(item);
    }
  );

  server.registerTool(
    'get_item',
    {
      description: 'Read one item by sku.',
      inputSchema: { sku: z.string().describe('Stock keeping unit') },
      outputSchema: itemShape
    },
    async ({ sku }) => {
      console.log(`get_item ${sku}`);
      const item = inventory.get(sku);
      return item ? ok(item) : fail(`no item with sku ${sku}`);
    }
  );

  server.registerTool(
    'adjust_stock',
    {
      description: 'Add to or subtract from an item quantity. The result may not go below zero.',
      inputSchema: {
        sku: z.string().describe('Stock keeping unit'),
        delta: z.number().describe('Signed change to apply to the quantity')
      },
      outputSchema: itemShape
    },
    async ({ sku, delta }) => {
      console.log(`adjust_stock ${sku} ${delta}`);
      const item = inventory.get(sku);
      if (!item) {
        return fail(`no item with sku ${sku}`);
      }
      const qty = item.qty + delta;
      if (qty < 0) {
        return fail(`stock for ${sku} would go below zero`);
      }
      item.qty = qty;
      return ok(item);
    }
  );

  server.registerTool(
    'list_items',
    {
      description: 'List every item in the inventory.',
      // `limit` is a string here and a number on search_items — a deliberate wart, see the README
      inputSchema: { limit: z.string().optional().describe('Maximum number of items to return') },
      outputSchema: listShape
    },
    async ({ limit }) => {
      console.log(`list_items ${limit ?? ''}`);
      const items = [...inventory.values()];
      return ok({ items: limit ? items.slice(0, Number(limit)) : items });
    }
  );

  server.registerTool(
    'search_items',
    {
      description: 'Search.',
      inputSchema: {
        q: z.string().describe('Text matched against sku and name'),
        limit: z.number().optional().describe('Maximum number of items to return')
      },
      outputSchema: listShape
    },
    async ({ q, limit }) => {
      console.log(`search_items ${q}`);
      const needle = q.toLowerCase();
      const items = [...inventory.values()].filter(
        i => i.sku.toLowerCase().includes(needle) || i.name.toLowerCase().includes(needle)
      );
      return ok({ items: limit ? items.slice(0, limit) : items });
    }
  );

  server.registerTool(
    'remove_item',
    {
      description: 'Remove an item from the inventory.',
      inputSchema: { sku: z.string().describe('Stock keeping unit') },
      outputSchema: { removed: z.boolean() }
    },
    async ({ sku }) => {
      console.log(`remove_item ${sku}`);
      if (!inventory.delete(sku)) {
        return fail(`no item with sku ${sku}`);
      }
      return ok({ removed: true });
    }
  );

  server.registerResource(
    'summary',
    'inventory://summary',
    { description: 'Item and unit counts for the whole inventory', mimeType: 'application/json' },
    async () => {
      const items = [...inventory.values()];
      const summary = { items: items.length, units: items.reduce((n, i) => n + i.qty, 0) };
      return { contents: [{ uri: 'inventory://summary', text: JSON.stringify(summary) }] };
    }
  );

  server.registerPrompt(
    'restock-plan',
    {
      description: 'Ask for a restock plan for every item below a threshold',
      argsSchema: { threshold: z.string().describe('Quantity below which an item needs restocking') }
    },
    async ({ threshold }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Draft a restock plan for every inventory item with a quantity below ${threshold}.`
          }
        }
      ]
    })
  );

  return server;
}

// DNS-rebinding protection is on by default and is hostname-based, so the container run in the README
// (which reaches this server as host.docker.internal) needs that name allowed alongside localhost.
const app = createMcpExpressApp({
  allowedHosts: ['localhost', '127.0.0.1', '[::1]', 'host.docker.internal']
});

app.post('/mcp', async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = Number(process.argv[2] ?? process.env.PORT ?? 3001);
app.listen(port, () => console.log(`inventory MCP server on http://localhost:${port}/mcp`));
