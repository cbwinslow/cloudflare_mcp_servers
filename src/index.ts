/**
 * Basic MCP Server Implementation for Cloudflare Workers
 * 
 * This is a minimal implementation of an MCP server that can be deployed
 * on Cloudflare Workers. It handles the core MCP protocol methods.
 */

export interface Env {
  // KV Namespace for storing state
  MCP_STATE?: KVNamespace;
  
  // Environment variables
  MCP_SERVER_NAME?: string;
  MCP_API_KEY?: string;
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
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number;
}

/**
 * Main request handler for the MCP server
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle GET request - server info
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        name: env.MCP_SERVER_NAME || 'MCP Server',
        version: '1.0.0',
        protocol: 'mcp',
        description: 'Model Context Protocol server running on Cloudflare Workers',
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Handle POST request - MCP protocol
    if (request.method === 'POST') {
      try {
        const body = await request.json() as MCPRequest;
        const response = await handleMCPRequest(body, env);
        
        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : 'Unknown error',
          },
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders,
    });
  },
};

/**
 * Handle MCP protocol requests
 */
async function handleMCPRequest(request: MCPRequest, env: Env): Promise<MCPResponse> {
  const { method, params, id } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          result: {
            protocolVersion: '1.0.0',
            capabilities: {
              tools: true,
              resources: true,
              prompts: true,
            },
            serverInfo: {
              name: env.MCP_SERVER_NAME || 'MCP Server',
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
                name: 'echo',
                description: 'Echo back the input message',
                inputSchema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      description: 'Message to echo',
                    },
                  },
                  required: ['message'],
                },
              },
              {
                name: 'get_time',
                description: 'Get current server time',
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
        const toolResult = await callTool(params?.name, params?.arguments, env);
        return {
          jsonrpc: '2.0',
          result: toolResult,
          id,
        };

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          result: {
            resources: [
              {
                uri: 'cloudflare://info',
                name: 'Cloudflare Worker Info',
                description: 'Information about this Cloudflare Worker',
                mimeType: 'application/json',
              },
            ],
          },
          id,
        };

      case 'resources/read':
        const resourceContent = await readResource(params?.uri, env);
        return {
          jsonrpc: '2.0',
          result: resourceContent,
          id,
        };

      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          result: {
            prompts: [
              {
                name: 'greeting',
                description: 'Generate a greeting message',
                arguments: [
                  {
                    name: 'name',
                    description: 'Name to greet',
                    required: true,
                  },
                ],
              },
            ],
          },
          id,
        };

      case 'prompts/get':
        const promptResult = await getPrompt(params?.name, params?.arguments);
        return {
          jsonrpc: '2.0',
          result: promptResult,
          id,
        };

      default:
        return {
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found',
            data: { method },
          },
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

/**
 * Execute a tool call
 */
async function callTool(name: string, args: any, env: Env): Promise<any> {
  switch (name) {
    case 'echo':
      return {
        content: [
          {
            type: 'text',
            text: args?.message || '',
          },
        ],
      };

    case 'get_time':
      return {
        content: [
          {
            type: 'text',
            text: new Date().toISOString(),
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Read a resource
 */
async function readResource(uri: string, env: Env): Promise<any> {
  if (uri === 'cloudflare://info') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            platform: 'Cloudflare Workers',
            serverName: env.MCP_SERVER_NAME || 'MCP Server',
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}

/**
 * Get a prompt
 */
async function getPrompt(name: string, args: any): Promise<any> {
  if (name === 'greeting') {
    const userName = args?.name || 'there';
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Hello, ${userName}! Welcome to our MCP server running on Cloudflare Workers.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
}
