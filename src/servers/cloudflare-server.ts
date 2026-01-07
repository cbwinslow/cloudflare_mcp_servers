/**
 * Cloudflare MCP Server
 * 
 * Provides comprehensive access to Cloudflare API:
 * - Workers management and deployment
 * - KV storage operations
 * - R2 object storage
 * - DNS and domains
 * - Analytics and logs
 * - Pages deployment
 */

export interface Env {
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
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

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

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
        name: 'Cloudflare MCP Server',
        version: '1.0.0',
        description: 'Manage Cloudflare Workers, KV, R2, and infrastructure',
        capabilities: ['workers', 'kv', 'r2', 'dns', 'analytics', 'pages'],
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
              name: 'Cloudflare MCP Server',
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
                name: 'list_workers',
                description: 'List all Workers in account',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'get_worker',
                description: 'Get details of a specific Worker',
                inputSchema: {
                  type: 'object',
                  properties: {
                    scriptName: { type: 'string', description: 'Worker script name' },
                  },
                  required: ['scriptName'],
                },
              },
              {
                name: 'deploy_worker',
                description: 'Deploy a Worker script',
                inputSchema: {
                  type: 'object',
                  properties: {
                    scriptName: { type: 'string', description: 'Worker script name' },
                    script: { type: 'string', description: 'Worker script content' },
                    bindings: { type: 'object', description: 'Environment bindings' },
                  },
                  required: ['scriptName', 'script'],
                },
              },
              {
                name: 'kv_list_namespaces',
                description: 'List KV namespaces',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'kv_create_namespace',
                description: 'Create a new KV namespace',
                inputSchema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Namespace title' },
                  },
                  required: ['title'],
                },
              },
              {
                name: 'kv_list_keys',
                description: 'List keys in a KV namespace',
                inputSchema: {
                  type: 'object',
                  properties: {
                    namespaceId: { type: 'string', description: 'Namespace ID' },
                    prefix: { type: 'string', description: 'Key prefix filter' },
                  },
                  required: ['namespaceId'],
                },
              },
              {
                name: 'kv_get',
                description: 'Get value from KV',
                inputSchema: {
                  type: 'object',
                  properties: {
                    namespaceId: { type: 'string', description: 'Namespace ID' },
                    key: { type: 'string', description: 'Key name' },
                  },
                  required: ['namespaceId', 'key'],
                },
              },
              {
                name: 'kv_put',
                description: 'Put value in KV',
                inputSchema: {
                  type: 'object',
                  properties: {
                    namespaceId: { type: 'string', description: 'Namespace ID' },
                    key: { type: 'string', description: 'Key name' },
                    value: { type: 'string', description: 'Value to store' },
                    expirationTtl: { type: 'number', description: 'Expiration in seconds' },
                  },
                  required: ['namespaceId', 'key', 'value'],
                },
              },
              {
                name: 'kv_delete',
                description: 'Delete key from KV',
                inputSchema: {
                  type: 'object',
                  properties: {
                    namespaceId: { type: 'string', description: 'Namespace ID' },
                    key: { type: 'string', description: 'Key name' },
                  },
                  required: ['namespaceId', 'key'],
                },
              },
              {
                name: 'r2_list_buckets',
                description: 'List R2 buckets',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'r2_create_bucket',
                description: 'Create R2 bucket',
                inputSchema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Bucket name' },
                  },
                  required: ['name'],
                },
              },
              {
                name: 'get_analytics',
                description: 'Get analytics data',
                inputSchema: {
                  type: 'object',
                  properties: {
                    zoneId: { type: 'string', description: 'Zone ID' },
                    since: { type: 'string', description: 'Start time (ISO 8601)' },
                    until: { type: 'string', description: 'End time (ISO 8601)' },
                  },
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
                uri: 'cloudflare://account',
                name: 'Account Information',
                description: 'Cloudflare account details',
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
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    throw new Error('CLOUDFLARE credentials not configured');
  }

  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  switch (name) {
    case 'list_workers': {
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts`;
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_worker': {
      const { scriptName } = args;
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}`;
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'deploy_worker': {
      const { scriptName, script, bindings = {} } = args;
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}`;
      
      const formData = new FormData();
      formData.append('worker.js', new Blob([script], { type: 'application/javascript' }));
      
      if (Object.keys(bindings).length > 0) {
        formData.append('metadata', JSON.stringify({ bindings }));
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${apiToken}` },
        body: formData,
      });
      
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'kv_list_namespaces': {
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/storage/kv/namespaces`;
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'kv_create_namespace': {
      const { title } = args;
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/storage/kv/namespaces`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title }),
      });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'kv_list_keys': {
      const { namespaceId, prefix } = args;
      const url = new URL(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys`);
      if (prefix) url.searchParams.append('prefix', prefix);

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'kv_get': {
      const { namespaceId, key } = args;
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`;
      const response = await fetch(url, { headers });
      const value = await response.text();

      return {
        content: [{
          type: 'text',
          text: value,
        }],
      };
    }

    case 'kv_put': {
      const { namespaceId, key, value, expirationTtl } = args;
      const url = new URL(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`);
      if (expirationTtl) url.searchParams.append('expiration_ttl', expirationTtl);

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'text/plain' },
        body: value,
      });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'kv_delete': {
      const { namespaceId, key } = args;
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'r2_list_buckets': {
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/r2/buckets`;
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'r2_create_bucket': {
      const { name } = args;
      const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/r2/buckets`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_analytics': {
      const { zoneId, since, until } = args;
      const url = new URL(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/analytics/dashboard`);
      if (since) url.searchParams.append('since', since);
      if (until) url.searchParams.append('until', until);

      const response = await fetch(url.toString(), { headers });
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

async function readResource(uri: string, env: Env): Promise<any> {
  if (uri === 'cloudflare://account') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          accountId: env.CLOUDFLARE_ACCOUNT_ID,
          platform: 'Cloudflare',
          features: ['Workers', 'KV', 'R2', 'DNS', 'Analytics'],
        }, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
