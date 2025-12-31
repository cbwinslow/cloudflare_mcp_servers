/**
 * Advanced MCP Server with KV Storage
 * 
 * This example demonstrates how to use Cloudflare KV for persistent storage
 * in your MCP server.
 */

export interface Env {
  MCP_STATE: KVNamespace;
  MCP_SERVER_NAME?: string;
}

interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number;
}

interface MCPResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: any;
  id?: string | number;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        name: env.MCP_SERVER_NAME || 'MCP Server with KV',
        version: '1.0.0',
        features: ['KV Storage', 'State Management'],
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'POST') {
      try {
        const body = await request.json() as MCPRequest;
        const response = await handleMCPRequest(body, env);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  },
};

async function handleMCPRequest(request: MCPRequest, env: Env): Promise<MCPResponse> {
  const { method, params, id } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          result: {
            protocolVersion: '1.0.0',
            capabilities: { tools: true, resources: true },
            serverInfo: {
              name: env.MCP_SERVER_NAME || 'MCP Server with KV',
              version: '1.0.0',
            },
          },
          id,
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          result: {
            tools: [
              {
                name: 'store_data',
                description: 'Store data in KV storage',
                inputSchema: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Storage key' },
                    value: { type: 'string', description: 'Value to store' },
                  },
                  required: ['key', 'value'],
                },
              },
              {
                name: 'get_data',
                description: 'Retrieve data from KV storage',
                inputSchema: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Storage key' },
                  },
                  required: ['key'],
                },
              },
              {
                name: 'delete_data',
                description: 'Delete data from KV storage',
                inputSchema: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Storage key' },
                  },
                  required: ['key'],
                },
              },
            ],
          },
          id,
        };

      case 'tools/call':
        const result = await callTool(params?.name, params?.arguments, env);
        return { jsonrpc: '2.0', result, id };

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id,
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error',
      },
      id,
    };
  }
}

async function callTool(name: string, args: any, env: Env): Promise<any> {
  switch (name) {
    case 'store_data':
      await env.MCP_STATE.put(args.key, args.value);
      return {
        content: [{
          type: 'text',
          text: `Stored data with key: ${args.key}`,
        }],
      };

    case 'get_data':
      const value = await env.MCP_STATE.get(args.key);
      return {
        content: [{
          type: 'text',
          text: value || `No data found for key: ${args.key}`,
        }],
      };

    case 'delete_data':
      await env.MCP_STATE.delete(args.key);
      return {
        content: [{
          type: 'text',
          text: `Deleted data with key: ${args.key}`,
        }],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
