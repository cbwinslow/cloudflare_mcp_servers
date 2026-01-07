/**
 * LangFuse MCP Server
 * 
 * Provides access to LangFuse observability and tracing:
 * - Trace management
 * - Metrics and analytics
 * - Model performance tracking
 * - Cost monitoring
 * - Debug and analysis
 */

export interface Env {
  LANGFUSE_API_KEY?: string;
  LANGFUSE_SECRET_KEY?: string;
  LANGFUSE_PUBLIC_KEY?: string;
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

const LANGFUSE_BASE_URL = 'https://cloud.langfuse.com/api/public';

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
        name: 'LangFuse MCP Server',
        version: '1.0.0',
        description: 'LLM observability, tracing, and analytics',
        capabilities: ['tracing', 'metrics', 'analytics', 'monitoring'],
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
              name: 'LangFuse MCP Server',
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
                name: 'create_trace',
                description: 'Create a new trace',
                inputSchema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Trace name' },
                    userId: { type: 'string', description: 'User ID' },
                    sessionId: { type: 'string', description: 'Session ID' },
                    metadata: { type: 'object', description: 'Additional metadata' },
                  },
                  required: ['name'],
                },
              },
              {
                name: 'get_traces',
                description: 'Get traces with optional filters',
                inputSchema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', description: 'Filter by user ID' },
                    sessionId: { type: 'string', description: 'Filter by session ID' },
                    limit: { type: 'number', description: 'Number of results', default: 50 },
                    page: { type: 'number', description: 'Page number', default: 1 },
                  },
                },
              },
              {
                name: 'get_trace',
                description: 'Get a specific trace by ID',
                inputSchema: {
                  type: 'object',
                  properties: {
                    traceId: { type: 'string', description: 'Trace ID' },
                  },
                  required: ['traceId'],
                },
              },
              {
                name: 'get_metrics',
                description: 'Get metrics and analytics',
                inputSchema: {
                  type: 'object',
                  properties: {
                    startDate: { type: 'string', description: 'Start date (ISO 8601)' },
                    endDate: { type: 'string', description: 'End date (ISO 8601)' },
                    groupBy: { type: 'string', description: 'Group by field (model, user, session)' },
                  },
                },
              },
              {
                name: 'get_observations',
                description: 'Get observations (spans) for a trace',
                inputSchema: {
                  type: 'object',
                  properties: {
                    traceId: { type: 'string', description: 'Trace ID' },
                  },
                  required: ['traceId'],
                },
              },
              {
                name: 'get_scores',
                description: 'Get evaluation scores',
                inputSchema: {
                  type: 'object',
                  properties: {
                    traceId: { type: 'string', description: 'Filter by trace ID' },
                    name: { type: 'string', description: 'Score name' },
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
                uri: 'langfuse://dashboard',
                name: 'Dashboard Info',
                description: 'LangFuse dashboard information',
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
  const apiKey = env.LANGFUSE_PUBLIC_KEY;
  const secretKey = env.LANGFUSE_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('LANGFUSE credentials not configured');
  }

  const authHeader = 'Basic ' + btoa(`${apiKey}:${secretKey}`);
  const headers = { 
    'Authorization': authHeader,
    'Content-Type': 'application/json',
  };

  switch (name) {
    case 'create_trace': {
      const traceData = {
        name: args.name,
        userId: args.userId,
        sessionId: args.sessionId,
        metadata: args.metadata || {},
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${LANGFUSE_BASE_URL}/traces`, {
        method: 'POST',
        headers,
        body: JSON.stringify(traceData),
      });
      
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_traces': {
      const url = new URL(`${LANGFUSE_BASE_URL}/traces`);
      if (args.userId) url.searchParams.append('userId', args.userId);
      if (args.sessionId) url.searchParams.append('sessionId', args.sessionId);
      url.searchParams.append('limit', args.limit || '50');
      url.searchParams.append('page', args.page || '1');

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_trace': {
      const { traceId } = args;
      const url = `${LANGFUSE_BASE_URL}/traces/${traceId}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_metrics': {
      const url = new URL(`${LANGFUSE_BASE_URL}/metrics`);
      if (args.startDate) url.searchParams.append('startDate', args.startDate);
      if (args.endDate) url.searchParams.append('endDate', args.endDate);
      if (args.groupBy) url.searchParams.append('groupBy', args.groupBy);

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_observations': {
      const { traceId } = args;
      const url = `${LANGFUSE_BASE_URL}/traces/${traceId}/observations`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_scores': {
      const url = new URL(`${LANGFUSE_BASE_URL}/scores`);
      if (args.traceId) url.searchParams.append('traceId', args.traceId);
      if (args.name) url.searchParams.append('name', args.name);

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

async function readResource(uri: string): Promise<any> {
  if (uri === 'langfuse://dashboard') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          url: 'https://cloud.langfuse.com',
          features: ['Tracing', 'Metrics', 'Analytics', 'Debugging', 'Cost Tracking'],
        }, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
