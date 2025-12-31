/**
 * MCP Server with External API Integration
 * 
 * This example shows how to integrate external APIs in your MCP server
 * running on Cloudflare Workers.
 */

export interface Env {
  MCP_SERVER_NAME?: string;
  EXTERNAL_API_KEY?: string;
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
        name: env.MCP_SERVER_NAME || 'MCP API Integration Server',
        version: '1.0.0',
        features: ['External API Integration', 'Data Fetching'],
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
            capabilities: { tools: true },
            serverInfo: {
              name: env.MCP_SERVER_NAME || 'MCP API Integration Server',
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
                name: 'fetch_weather',
                description: 'Fetch weather data for a location',
                inputSchema: {
                  type: 'object',
                  properties: {
                    location: { 
                      type: 'string', 
                      description: 'City name or coordinates' 
                    },
                  },
                  required: ['location'],
                },
              },
              {
                name: 'fetch_joke',
                description: 'Fetch a random joke',
                inputSchema: {
                  type: 'object',
                  properties: {},
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
    case 'fetch_weather':
      // Example: This would integrate with a real weather API
      // For demo purposes, returning mock data
      return {
        content: [{
          type: 'text',
          text: `Weather for ${args.location}: Sunny, 22°C\n(This is a demo - integrate with a real weather API)`,
        }],
      };

    case 'fetch_joke':
      // Fetch from a public joke API
      try {
        const response = await fetch('https://official-joke-api.appspot.com/random_joke');
        const joke = await response.json();
        return {
          content: [{
            type: 'text',
            text: `${joke.setup}\n\n${joke.punchline}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: 'Failed to fetch joke',
          }],
        };
      }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
