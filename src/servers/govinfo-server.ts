/**
 * GovInfo.gov MCP Server
 * 
 * Provides access to U.S. Government Publishing Office documents including:
 * - Congressional bills, resolutions, and reports
 * - Federal regulations (CFR)
 * - Congressional Record
 * - Court opinions
 * - Presidential documents
 * 
 * API Documentation: https://api.govinfo.gov/docs/
 */

export interface Env {
  GOVINFO_API_KEY?: string;
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

const GOVINFO_BASE_URL = 'https://api.govinfo.gov';

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
        name: 'GovInfo.gov MCP Server',
        version: '1.0.0',
        description: 'Access U.S. Government documents and publications',
        capabilities: ['bills', 'regulations', 'congressional-record', 'court-opinions'],
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
              name: 'GovInfo.gov MCP Server',
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
                name: 'search_bills',
                description: 'Search for congressional bills by query',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    congress: { type: 'string', description: 'Congress number (e.g., 118)' },
                    offset: { type: 'number', description: 'Pagination offset', default: 0 },
                    pageSize: { type: 'number', description: 'Results per page', default: 20 },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'get_bill_details',
                description: 'Get detailed information about a specific bill',
                inputSchema: {
                  type: 'object',
                  properties: {
                    congress: { type: 'string', description: 'Congress number' },
                    billType: { type: 'string', description: 'Bill type (hr, s, hjres, sjres)' },
                    billNumber: { type: 'string', description: 'Bill number' },
                  },
                  required: ['congress', 'billType', 'billNumber'],
                },
              },
              {
                name: 'search_regulations',
                description: 'Search Code of Federal Regulations',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    title: { type: 'string', description: 'CFR title number' },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'get_congressional_record',
                description: 'Get Congressional Record entries',
                inputSchema: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                    section: { type: 'string', description: 'Section (senate, house, extensions)' },
                  },
                },
              },
              {
                name: 'search_documents',
                description: 'Search all GovInfo documents',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    collection: { type: 'string', description: 'Document collection filter' },
                    startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                  },
                  required: ['query'],
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
                uri: 'govinfo://collections',
                name: 'Available Collections',
                description: 'List of available GovInfo collections',
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
  const apiKey = env.GOVINFO_API_KEY;
  if (!apiKey) {
    throw new Error('GOVINFO_API_KEY not configured');
  }

  switch (name) {
    case 'search_bills': {
      const url = new URL(`${GOVINFO_BASE_URL}/search`);
      url.searchParams.append('query', args.query);
      url.searchParams.append('collection', 'BILLS');
      if (args.congress) url.searchParams.append('congress', args.congress);
      url.searchParams.append('offset', args.offset || '0');
      url.searchParams.append('pageSize', args.pageSize || '20');
      url.searchParams.append('api_key', apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_bill_details': {
      const { congress, billType, billNumber } = args;
      const url = `${GOVINFO_BASE_URL}/bills/${congress}/${billType}/${billNumber}?api_key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'search_regulations': {
      const url = new URL(`${GOVINFO_BASE_URL}/search`);
      url.searchParams.append('query', args.query);
      url.searchParams.append('collection', 'CFR');
      if (args.title) url.searchParams.append('title', args.title);
      url.searchParams.append('api_key', apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_congressional_record': {
      const url = new URL(`${GOVINFO_BASE_URL}/congressional-record`);
      if (args.date) url.searchParams.append('date', args.date);
      if (args.section) url.searchParams.append('section', args.section);
      url.searchParams.append('api_key', apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'search_documents': {
      const url = new URL(`${GOVINFO_BASE_URL}/search`);
      url.searchParams.append('query', args.query);
      if (args.collection) url.searchParams.append('collection', args.collection);
      if (args.startDate) url.searchParams.append('startDate', args.startDate);
      if (args.endDate) url.searchParams.append('endDate', args.endDate);
      url.searchParams.append('api_key', apiKey);

      const response = await fetch(url.toString());
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
  if (uri === 'govinfo://collections') {
    const collections = [
      'BILLS - Congressional Bills',
      'CFR - Code of Federal Regulations',
      'CREC - Congressional Record',
      'FR - Federal Register',
      'PLAW - Public Laws',
      'STATUTE - Statutes at Large',
      'USCOURTS - U.S. Courts Opinions',
    ];

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(collections, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
