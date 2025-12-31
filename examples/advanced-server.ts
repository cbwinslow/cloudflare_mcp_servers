/**
 * Advanced MCP Server Example with Authentication and Caching
 * 
 * This example demonstrates:
 * - Bearer token authentication
 * - Edge caching for performance
 * - KV storage for persistent data
 * - Error handling and logging
 * - Rate limiting
 * - Multiple tool implementations
 * 
 * Setup Required:
 * 1. Create KV namespace: wrangler kv:namespace create MCP_STATE
 * 2. Add KV ID to wrangler.toml
 * 3. Set secret: wrangler secret put API_KEY
 * 4. Deploy: npm run deploy
 */

export interface Env {
  // KV namespace for state and caching
  MCP_STATE: KVNamespace;
  
  // Secrets
  API_KEY: string;
  
  // Environment variables
  MCP_SERVER_NAME?: string;
  ENVIRONMENT?: string;
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

// Rate limiting: Track requests per IP
const RATE_LIMIT = {
  maxRequests: 100,
  windowSeconds: 60,
};

/**
 * Main request handler
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const startTime = Date.now();
    
    // CORS headers for browser compatibility
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Authentication check (skip for GET requests to server info)
      if (request.method === 'POST') {
        const authResult = await checkAuthentication(request, env);
        if (!authResult.authorized) {
          return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: authResult.message,
          }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer',
              ...corsHeaders,
            },
          });
        }

        // Rate limiting
        const rateLimitResult = await checkRateLimit(request, env);
        if (!rateLimitResult.allowed) {
          return new Response(JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
          }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(rateLimitResult.retryAfter),
              ...corsHeaders,
            },
          });
        }
      }

      // Route by method
      let response: Response;
      
      if (request.method === 'GET') {
        response = await handleGetRequest(env);
      } else if (request.method === 'POST') {
        response = await handlePostRequest(request, env, ctx);
      } else {
        response = new Response('Method not allowed', { 
          status: 405,
          headers: corsHeaders,
        });
      }

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      // Log request (background task)
      const duration = Date.now() - startTime;
      ctx.waitUntil(logRequest(request, response.status, duration, env));

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

    } catch (error) {
      console.error('Unhandled error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};

/**
 * Handle GET requests - return server information
 */
async function handleGetRequest(env: Env): Promise<Response> {
  const serverInfo = {
    name: env.MCP_SERVER_NAME || 'Advanced MCP Server',
    version: '1.0.0',
    protocol: 'mcp',
    environment: env.ENVIRONMENT || 'production',
    features: [
      'Authentication',
      'Rate Limiting',
      'Caching',
      'KV Storage',
      'Logging',
    ],
    endpoints: {
      info: 'GET /',
      mcp: 'POST /',
    },
  };

  return new Response(JSON.stringify(serverInfo, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handle POST requests - MCP protocol
 */
async function handlePostRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const body = await request.json() as MCPRequest;
    
    // Validate JSON-RPC format
    if (body.jsonrpc !== '2.0') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: 'jsonrpc must be "2.0"',
        },
        id: body.id,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check cache for read-only operations
    if (['tools/list', 'resources/list', 'prompts/list'].includes(body.method)) {
      const cacheKey = `cache:${body.method}`;
      const cached = await env.MCP_STATE.get(cacheKey, 'json');
      
      if (cached) {
        console.log(`Cache hit for ${body.method}`);
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          result: cached,
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle MCP request
    const response = await handleMCPRequest(body, env);
    
    // Cache list responses (5 minutes)
    if (['tools/list', 'resources/list', 'prompts/list'].includes(body.method)) {
      const cacheKey = `cache:${body.method}`;
      ctx.waitUntil(
        env.MCP_STATE.put(cacheKey, JSON.stringify(response.result), {
          expirationTtl: 300,
        })
      );
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

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
            },
            serverInfo: {
              name: env.MCP_SERVER_NAME || 'Advanced MCP Server',
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
                name: 'store',
                description: 'Store data in KV storage',
                inputSchema: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Storage key' },
                    value: { type: 'string', description: 'Value to store' },
                    ttl: { type: 'number', description: 'TTL in seconds (optional)' },
                  },
                  required: ['key', 'value'],
                },
              },
              {
                name: 'retrieve',
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
                name: 'search',
                description: 'Search keys by prefix',
                inputSchema: {
                  type: 'object',
                  properties: {
                    prefix: { type: 'string', description: 'Key prefix to search' },
                  },
                  required: ['prefix'],
                },
              },
            ],
          },
          id,
        };

      case 'tools/call':
        const result = await callTool(params?.name, params?.arguments, env);
        return { jsonrpc: '2.0', result, id };

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          result: {
            resources: [
              {
                uri: 'stats://requests',
                name: 'Request Statistics',
                description: 'Statistics about server requests',
                mimeType: 'application/json',
              },
            ],
          },
          id,
        };

      case 'resources/read':
        const resourceContent = await readResource(params?.uri, env);
        return { jsonrpc: '2.0', result: resourceContent, id };

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
 * Execute a tool
 */
async function callTool(name: string, args: any, env: Env): Promise<any> {
  switch (name) {
    case 'store':
      // Validate input
      if (!args?.key || !args?.value) {
        throw new Error('Missing required parameters: key and value');
      }

      // Store in KV
      const options = args.ttl ? { expirationTtl: args.ttl } : undefined;
      await env.MCP_STATE.put(`data:${args.key}`, args.value, options);

      return {
        content: [{
          type: 'text',
          text: `Stored data with key: ${args.key}${args.ttl ? ` (TTL: ${args.ttl}s)` : ''}`,
        }],
      };

    case 'retrieve':
      if (!args?.key) {
        throw new Error('Missing required parameter: key');
      }

      const value = await env.MCP_STATE.get(`data:${args.key}`);
      
      if (value === null) {
        return {
          content: [{
            type: 'text',
            text: `No data found for key: ${args.key}`,
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: value,
        }],
      };

    case 'search':
      if (!args?.prefix) {
        throw new Error('Missing required parameter: prefix');
      }

      const list = await env.MCP_STATE.list({ 
        prefix: `data:${args.prefix}`,
        limit: 100,
      });

      const keys = list.keys.map(k => k.name.replace('data:', ''));

      return {
        content: [{
          type: 'text',
          text: `Found ${keys.length} keys:\n${keys.join('\n')}`,
        }],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Read a resource
 */
async function readResource(uri: string, env: Env): Promise<any> {
  if (uri === 'stats://requests') {
    const stats = await env.MCP_STATE.get('stats:requests', 'json') || {
      total: 0,
      today: 0,
      lastReset: new Date().toISOString(),
    };

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(stats, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}

/**
 * Check authentication
 */
async function checkAuthentication(request: Request, env: Env): Promise<{
  authorized: boolean;
  message?: string;
}> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return {
      authorized: false,
      message: 'Missing Authorization header',
    };
  }

  const token = authHeader.replace('Bearer ', '');

  if (token !== env.API_KEY) {
    return {
      authorized: false,
      message: 'Invalid API key',
    };
  }

  return { authorized: true };
}

/**
 * Check rate limit
 */
async function checkRateLimit(request: Request, env: Env): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `ratelimit:${ip}`;
  
  // Get current count
  const current = await env.MCP_STATE.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      retryAfter: RATE_LIMIT.windowSeconds,
    };
  }

  // Increment counter
  await env.MCP_STATE.put(
    key,
    String(count + 1),
    { expirationTtl: RATE_LIMIT.windowSeconds }
  );

  return { allowed: true };
}

/**
 * Log request (background task)
 */
async function logRequest(
  request: Request,
  status: number,
  duration: number,
  env: Env
): Promise<void> {
  try {
    const stats = await env.MCP_STATE.get('stats:requests', 'json') || {
      total: 0,
      today: 0,
      lastReset: new Date().toISOString(),
    };

    stats.total++;
    stats.today++;

    await env.MCP_STATE.put('stats:requests', JSON.stringify(stats));

    console.log(`Request: ${request.method} ${request.url} - ${status} (${duration}ms)`);
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}
