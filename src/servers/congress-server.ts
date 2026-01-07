/**
 * Congress.gov MCP Server
 * 
 * Provides access to Congressional data from Congress.gov including:
 * - Legislation (bills, resolutions, amendments)
 * - Congressional members
 * - Committees
 * - Nominations
 * - Treaties
 * - Congressional votes
 * 
 * API Documentation: https://api.congress.gov
 */

export interface Env {
  CONGRESS_API_KEY?: string;
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

const CONGRESS_BASE_URL = 'https://api.congress.gov/v3';

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
        name: 'Congress.gov MCP Server',
        version: '1.0.0',
        description: 'Access Congressional legislation, members, committees, and votes',
        capabilities: ['legislation', 'members', 'committees', 'nominations', 'votes'],
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
              name: 'Congress.gov MCP Server',
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
                name: 'search_legislation',
                description: 'Search for bills and resolutions',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    congress: { type: 'number', description: 'Congress number (e.g., 118)' },
                    type: { type: 'string', description: 'Bill type (hr, s, hjres, sjres, hconres, sconres, hres, sres)' },
                    limit: { type: 'number', description: 'Results limit', default: 20 },
                  },
                },
              },
              {
                name: 'get_bill',
                description: 'Get details of a specific bill',
                inputSchema: {
                  type: 'object',
                  properties: {
                    congress: { type: 'number', description: 'Congress number' },
                    billType: { type: 'string', description: 'Bill type' },
                    billNumber: { type: 'number', description: 'Bill number' },
                  },
                  required: ['congress', 'billType', 'billNumber'],
                },
              },
              {
                name: 'get_bill_actions',
                description: 'Get all actions taken on a bill',
                inputSchema: {
                  type: 'object',
                  properties: {
                    congress: { type: 'number', description: 'Congress number' },
                    billType: { type: 'string', description: 'Bill type' },
                    billNumber: { type: 'number', description: 'Bill number' },
                  },
                  required: ['congress', 'billType', 'billNumber'],
                },
              },
              {
                name: 'get_members',
                description: 'Get Congressional members',
                inputSchema: {
                  type: 'object',
                  properties: {
                    congress: { type: 'number', description: 'Congress number' },
                    chamber: { type: 'string', description: 'Chamber (house or senate)' },
                    state: { type: 'string', description: 'State abbreviation' },
                  },
                },
              },
              {
                name: 'get_member_details',
                description: 'Get detailed information about a specific member',
                inputSchema: {
                  type: 'object',
                  properties: {
                    bioguideId: { type: 'string', description: 'Member bioguide ID' },
                  },
                  required: ['bioguideId'],
                },
              },
              {
                name: 'get_committees',
                description: 'Get Congressional committees',
                inputSchema: {
                  type: 'object',
                  properties: {
                    congress: { type: 'number', description: 'Congress number' },
                    chamber: { type: 'string', description: 'Chamber (house, senate, or joint)' },
                  },
                },
              },
              {
                name: 'get_nominations',
                description: 'Get Presidential nominations',
                inputSchema: {
                  type: 'object',
                  properties: {
                    congress: { type: 'number', description: 'Congress number' },
                  },
                },
              },
              {
                name: 'get_roll_call_votes',
                description: 'Get roll call votes',
                inputSchema: {
                  type: 'object',
                  properties: {
                    congress: { type: 'number', description: 'Congress number' },
                    chamber: { type: 'string', description: 'Chamber (house or senate)' },
                  },
                  required: ['congress', 'chamber'],
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
                uri: 'congress://current',
                name: 'Current Congress',
                description: 'Information about the current Congress',
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
  const apiKey = env.CONGRESS_API_KEY;
  if (!apiKey) {
    throw new Error('CONGRESS_API_KEY not configured');
  }

  const headers = { 'X-API-Key': apiKey };

  switch (name) {
    case 'search_legislation': {
      const url = new URL(`${CONGRESS_BASE_URL}/bill`);
      if (args.congress) url.searchParams.append('congress', args.congress);
      if (args.type) url.searchParams.append('type', args.type);
      url.searchParams.append('limit', args.limit || '20');
      url.searchParams.append('format', 'json');

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_bill': {
      const { congress, billType, billNumber } = args;
      const url = `${CONGRESS_BASE_URL}/bill/${congress}/${billType}/${billNumber}?format=json`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_bill_actions': {
      const { congress, billType, billNumber } = args;
      const url = `${CONGRESS_BASE_URL}/bill/${congress}/${billType}/${billNumber}/actions?format=json`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_members': {
      const url = new URL(`${CONGRESS_BASE_URL}/member`);
      if (args.congress) url.searchParams.append('congress', args.congress);
      if (args.chamber) url.searchParams.append('chamber', args.chamber);
      if (args.state) url.searchParams.append('state', args.state);
      url.searchParams.append('format', 'json');

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_member_details': {
      const { bioguideId } = args;
      const url = `${CONGRESS_BASE_URL}/member/${bioguideId}?format=json`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_committees': {
      const url = new URL(`${CONGRESS_BASE_URL}/committee`);
      if (args.congress) url.searchParams.append('congress', args.congress);
      if (args.chamber) url.searchParams.append('chamber', args.chamber);
      url.searchParams.append('format', 'json');

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_nominations': {
      const url = new URL(`${CONGRESS_BASE_URL}/nomination`);
      if (args.congress) url.searchParams.append('congress', args.congress);
      url.searchParams.append('format', 'json');

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_roll_call_votes': {
      const { congress, chamber } = args;
      const url = `${CONGRESS_BASE_URL}/vote/${congress}/${chamber}?format=json`;

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

async function readResource(uri: string, env: Env): Promise<any> {
  if (uri === 'congress://current') {
    const currentCongress = 118; // Update as needed
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          congress: currentCongress,
          startYear: 2023,
          endYear: 2025,
          sessions: [1, 2],
        }, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
