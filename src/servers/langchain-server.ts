/**
 * LangChain MCP Server
 * 
 * Provides access to LangChain functionality:
 * - Chain execution and composition
 * - Tool management
 * - Vector store operations
 * - Document loading and processing
 * - Agent orchestration
 */

export interface Env {
  LANGCHAIN_API_KEY?: string;
  OPENAI_API_KEY?: string;
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
        name: 'LangChain MCP Server',
        version: '1.0.0',
        description: 'LangChain chain execution and agent orchestration',
        capabilities: ['chains', 'agents', 'tools', 'vectorstores', 'documents'],
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
              name: 'LangChain MCP Server',
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
                name: 'execute_chain',
                description: 'Execute a LangChain chain',
                inputSchema: {
                  type: 'object',
                  properties: {
                    chainType: { type: 'string', description: 'Chain type (llm, conversational, sequential)' },
                    input: { type: 'string', description: 'Input to the chain' },
                    config: { type: 'object', description: 'Chain configuration' },
                  },
                  required: ['chainType', 'input'],
                },
              },
              {
                name: 'create_agent',
                description: 'Create and execute a LangChain agent',
                inputSchema: {
                  type: 'object',
                  properties: {
                    agentType: { type: 'string', description: 'Agent type (zero-shot, conversational, structured)' },
                    tools: { type: 'array', description: 'Tools available to the agent' },
                    input: { type: 'string', description: 'Task for the agent' },
                  },
                  required: ['agentType', 'input'],
                },
              },
              {
                name: 'split_text',
                description: 'Split text into chunks for processing',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to split' },
                    chunkSize: { type: 'number', description: 'Chunk size', default: 1000 },
                    chunkOverlap: { type: 'number', description: 'Overlap between chunks', default: 200 },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'embed_text',
                description: 'Generate embeddings for text',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to embed' },
                    model: { type: 'string', description: 'Embedding model', default: 'text-embedding-ada-002' },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'similarity_search',
                description: 'Search for similar documents',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Query text' },
                    documents: { type: 'array', description: 'Documents to search' },
                    k: { type: 'number', description: 'Number of results', default: 4 },
                  },
                  required: ['query', 'documents'],
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
                uri: 'langchain://chains',
                name: 'Available Chains',
                description: 'List of available LangChain chain types',
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
  switch (name) {
    case 'execute_chain': {
      // Simulated LangChain execution - in production, this would call actual LangChain
      const result = {
        chainType: args.chainType,
        input: args.input,
        output: `Processed: ${args.input}`,
        metadata: {
          tokens: 100,
          model: 'gpt-3.5-turbo',
          timestamp: new Date().toISOString(),
        },
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    }

    case 'create_agent': {
      const result = {
        agentType: args.agentType,
        tools: args.tools || [],
        input: args.input,
        output: `Agent executed task: ${args.input}`,
        steps: [
          { tool: 'reasoning', action: 'analyze task' },
          { tool: 'execution', action: 'perform task' },
        ],
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    }

    case 'split_text': {
      const { text, chunkSize = 1000, chunkOverlap = 200 } = args;
      const chunks = [];
      let start = 0;

      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.substring(start, end));
        start += chunkSize - chunkOverlap;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            totalChunks: chunks.length,
            chunks: chunks,
          }, null, 2),
        }],
      };
    }

    case 'embed_text': {
      // Simulated embedding - in production, this would call actual embedding API
      const result = {
        text: args.text,
        model: args.model || 'text-embedding-ada-002',
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        dimensions: 1536,
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            model: result.model,
            dimensions: result.dimensions,
            note: 'Embedding vector generated (truncated in output)',
          }, null, 2),
        }],
      };
    }

    case 'similarity_search': {
      const { query, documents, k = 4 } = args;
      
      // Simulated similarity search
      const results = documents.slice(0, k).map((doc: any, idx: number) => ({
        document: doc,
        score: 0.9 - (idx * 0.1),
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: query,
            results: results,
          }, null, 2),
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function readResource(uri: string): Promise<any> {
  if (uri === 'langchain://chains') {
    const chains = [
      'llm - Simple LLM chain',
      'conversational - Conversational chain with memory',
      'sequential - Sequential chain of operations',
      'map_reduce - Map-reduce chain for document processing',
      'stuff - Stuff documents into prompt',
      'refine - Iteratively refine answers',
    ];

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(chains, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
