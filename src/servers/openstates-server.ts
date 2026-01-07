/**
 * OpenStates.org MCP Server
 * 
 * Provides access to state legislature data from all 50 US states plus DC and Puerto Rico:
 * - State bills and resolutions
 * - State legislators
 * - Legislative committees
 * - Legislative sessions
 * - Bill votes
 * 
 * API Documentation: https://docs.openstates.org/api-v3/
 */

export interface Env {
  OPENSTATES_API_KEY?: string;
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

const OPENSTATES_BASE_URL = 'https://v3.openstates.org';

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
        name: 'OpenStates.org MCP Server',
        version: '1.0.0',
        description: 'Access state legislature data from all US states',
        capabilities: ['bills', 'legislators', 'committees', 'sessions', 'votes'],
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
              name: 'OpenStates.org MCP Server',
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
                description: 'Search for state bills',
                inputSchema: {
                  type: 'object',
                  properties: {
                    jurisdiction: { type: 'string', description: 'State abbreviation (e.g., CA, NY)' },
                    query: { type: 'string', description: 'Search query' },
                    session: { type: 'string', description: 'Legislative session' },
                    subject: { type: 'string', description: 'Bill subject/category' },
                    perPage: { type: 'number', description: 'Results per page', default: 20 },
                  },
                },
              },
              {
                name: 'get_bill',
                description: 'Get details of a specific bill',
                inputSchema: {
                  type: 'object',
                  properties: {
                    billId: { type: 'string', description: 'Bill ID (ocd-bill/...)' },
                  },
                  required: ['billId'],
                },
              },
              {
                name: 'get_legislators',
                description: 'Get state legislators',
                inputSchema: {
                  type: 'object',
                  properties: {
                    jurisdiction: { type: 'string', description: 'State abbreviation' },
                    chamber: { type: 'string', description: 'Chamber (upper or lower)' },
                    district: { type: 'string', description: 'District number/name' },
                  },
                },
              },
              {
                name: 'get_legislator',
                description: 'Get details of a specific legislator',
                inputSchema: {
                  type: 'object',
                  properties: {
                    legislatorId: { type: 'string', description: 'Legislator ID (ocd-person/...)' },
                  },
                  required: ['legislatorId'],
                },
              },
              {
                name: 'get_jurisdictions',
                description: 'Get list of available jurisdictions (states)',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'get_sessions',
                description: 'Get legislative sessions for a jurisdiction',
                inputSchema: {
                  type: 'object',
                  properties: {
                    jurisdiction: { type: 'string', description: 'State abbreviation' },
                  },
                  required: ['jurisdiction'],
                },
              },
              {
                name: 'get_bill_votes',
                description: 'Get votes for a specific bill',
                inputSchema: {
                  type: 'object',
                  properties: {
                    billId: { type: 'string', description: 'Bill ID' },
                  },
                  required: ['billId'],
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
                uri: 'openstates://jurisdictions',
                name: 'Jurisdictions',
                description: 'List of all available jurisdictions',
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
  const apiKey = env.OPENSTATES_API_KEY;
  if (!apiKey) {
    throw new Error('OPENSTATES_API_KEY not configured');
  }

  const headers = { 'X-API-Key': apiKey };

  switch (name) {
    case 'search_bills': {
      const url = new URL(`${OPENSTATES_BASE_URL}/bills`);
      if (args.jurisdiction) url.searchParams.append('jurisdiction', args.jurisdiction);
      if (args.query) url.searchParams.append('q', args.query);
      if (args.session) url.searchParams.append('session', args.session);
      if (args.subject) url.searchParams.append('subject', args.subject);
      url.searchParams.append('per_page', args.perPage || '20');

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
      const { billId } = args;
      const url = `${OPENSTATES_BASE_URL}/bills/${billId}`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_legislators': {
      const url = new URL(`${OPENSTATES_BASE_URL}/people`);
      if (args.jurisdiction) url.searchParams.append('jurisdiction', args.jurisdiction);
      if (args.chamber) url.searchParams.append('chamber', args.chamber);
      if (args.district) url.searchParams.append('district', args.district);

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_legislator': {
      const { legislatorId } = args;
      const url = `${OPENSTATES_BASE_URL}/people/${legislatorId}`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_jurisdictions': {
      const url = `${OPENSTATES_BASE_URL}/jurisdictions`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_sessions': {
      const { jurisdiction } = args;
      const url = `${OPENSTATES_BASE_URL}/jurisdictions/${jurisdiction}`;
      
      const response = await fetch(url, { headers });
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_bill_votes': {
      const { billId } = args;
      const url = `${OPENSTATES_BASE_URL}/bills/${billId}/votes`;
      
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
  if (uri === 'openstates://jurisdictions') {
    const jurisdictions = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      'DC', 'PR'
    ];

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(jurisdictions, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
