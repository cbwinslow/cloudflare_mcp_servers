/**
 * Minimal MCP Server Example
 * 
 * This is the simplest possible MCP server implementation,
 * perfect for getting started or as a template.
 */

export interface Env {
  MCP_SERVER_NAME?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        name: env.MCP_SERVER_NAME || 'Minimal MCP Server',
        version: '1.0.0',
        status: 'running',
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'POST') {
      try {
        const body: any = await request.json();
        
        // Handle initialize
        if (body.method === 'initialize') {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            result: {
              protocolVersion: '1.0.0',
              capabilities: { tools: true },
              serverInfo: {
                name: env.MCP_SERVER_NAME || 'Minimal MCP Server',
                version: '1.0.0',
              },
            },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Handle tools/list
        if (body.method === 'tools/list') {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            result: {
              tools: [
                {
                  name: 'hello',
                  description: 'Say hello',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Your name' },
                    },
                  },
                },
              ],
            },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Handle tools/call
        if (body.method === 'tools/call' && body.params?.name === 'hello') {
          const name = body.params?.arguments?.name || 'World';
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: `Hello, ${name}!`,
              }],
            },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Unknown method
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id: body.id,
        }), {
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
