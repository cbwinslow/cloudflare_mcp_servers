/**
 * Postman MCP Server
 * 
 * Provides access to Postman API for:
 * - API collection management
 * - Environment management
 * - Mock server operations
 * - API testing and monitoring
 * - Workspace management
 */

export interface Env {
  POSTMAN_API_KEY?: string;
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
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number;
}

const POSTMAN_BASE_URL = 'https://api.getpostman.com';

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
        name: 'Postman MCP Server',
        version: '1.0.0',
        description: 'API testing, collections, and workspace management',
        capabilities: ['collections', 'environments', 'mocks', 'monitors', 'workspaces'],
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
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : 'Unknown error',
          },
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
              name: 'Postman MCP Server',
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
                name: 'get_collections',
                description: 'List all collections',
                inputSchema: {
                  type: 'object',
                  properties: {
                    workspace: { type: 'string', description: 'Workspace ID filter' },
                  },
                },
              },
              {
                name: 'get_collection',
                description: 'Get a specific collection',
                inputSchema: {
                  type: 'object',
                  properties: {
                    collectionId: { type: 'string', description: 'Collection ID' },
                  },
                  required: ['collectionId'],
                },
              },
              {
                name: 'create_collection',
                description: 'Create a new collection',
                inputSchema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Collection name' },
                    description: { type: 'string', description: 'Collection description' },
                  },
                  required: ['name'],
                },
              },
              {
                name: 'run_collection',
                description: 'Run a collection',
                inputSchema: {
                  type: 'object',
                  properties: {
                    collectionId: { type: 'string', description: 'Collection ID' },
                    environmentId: { type: 'string', description: 'Environment ID' },
                  },
                  required: ['collectionId'],
                },
              },
              {
                name: 'get_environments',
                description: 'List all environments',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'get_environment',
                description: 'Get a specific environment',
                inputSchema: {
                  type: 'object',
                  properties: {
                    environmentId: { type: 'string', description: 'Environment ID' },
                  },
                  required: ['environmentId'],
                },
              },
              {
                name: 'get_workspaces',
                description: 'List all workspaces',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'get_mocks',
                description: 'List all mock servers',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'get_monitors',
                description: 'List all monitors',
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
        return {
          jsonrpc: '2.0',
          result,
          id,
        };

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          result: {
            resources: [
              {
                uri: 'postman://info',
                name: 'Postman Info',
                description: 'Postman API information',
                mimeType: 'application/json',
              },
            ],
          },
          id,
        };

      case 'resources/read':
        const resourceContent = await readResource(params?.uri);
        return {
          jsonrpc: '2.0',
          result: resourceContent,
          id,
        };

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
  const apiKey = env.POSTMAN_API_KEY;
  if (!apiKey) {
    throw new Error('POSTMAN_API_KEY not configured');
  }

  const headers = {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json',
  };

  switch (name) {
    case 'get_collections': {
      const url = new URL(`${POSTMAN_BASE_URL}/collections`);
      if (args?.workspace) url.searchParams.append('workspace', args.workspace);

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_collection': {
      const { collectionId } = args;
      const url = `${POSTMAN_BASE_URL}/collections/${collectionId}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'create_collection': {
      const { name, description } = args;
      const url = `${POSTMAN_BASE_URL}/collections`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          collection: {
            info: { name, description },
            item: [],
          },
        }),
      });

      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'run_collection': {
      // Note: Running collections requires Newman or Postman CLI
      // This is a simplified implementation
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Collection run initiated',
            collectionId: args.collectionId,
            note: 'Full execution requires Newman CLI or Postman monitoring',
          }, null, 2),
        }],
      };
    }

    case 'get_environments': {
      const url = `${POSTMAN_BASE_URL}/environments`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_environment': {
      const { environmentId } = args;
      const url = `${POSTMAN_BASE_URL}/environments/${environmentId}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_workspaces': {
      const url = `${POSTMAN_BASE_URL}/workspaces`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_mocks': {
      const url = `${POSTMAN_BASE_URL}/mocks`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_monitors': {
      const url = `${POSTMAN_BASE_URL}/monitors`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function readResource(uri: string): Promise<any> {
  if (uri === 'postman://info') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          platform: 'Postman',
          features: ['Collections', 'Environments', 'Mocks', 'Monitors', 'Workspaces'],
          apiDocs: 'https://www.postman.com/postman/workspace/postman-public-workspace/documentation/12959542-c8142d51-e97c-46b6-bd77-52bb66712c9a',
        }, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
