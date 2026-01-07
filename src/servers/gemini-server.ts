/**
 * Gemini MCP Server
 * 
 * Google Gemini AI model integration:
 * - Text generation
 * - Multi-modal understanding (text + images)
 * - Code generation
 * - Function calling
 * - Streaming responses
 */

export interface Env {
  GEMINI_API_KEY?: string;
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

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

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
        name: 'Gemini MCP Server',
        version: '1.0.0',
        description: 'Google Gemini AI model integration',
        capabilities: ['text-generation', 'vision', 'code-generation', 'function-calling'],
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
              name: 'Gemini MCP Server',
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
                name: 'generate_text',
                description: 'Generate text using Gemini',
                inputSchema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string', description: 'Text prompt' },
                    model: { type: 'string', description: 'Model name', default: 'gemini-pro' },
                    temperature: { type: 'number', description: 'Sampling temperature', default: 0.7 },
                    maxTokens: { type: 'number', description: 'Maximum tokens', default: 1024 },
                  },
                  required: ['prompt'],
                },
              },
              {
                name: 'generate_with_vision',
                description: 'Analyze image with Gemini Vision',
                inputSchema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string', description: 'Text prompt' },
                    imageUrl: { type: 'string', description: 'Image URL' },
                    imageData: { type: 'string', description: 'Base64 encoded image' },
                  },
                  required: ['prompt'],
                },
              },
              {
                name: 'generate_code',
                description: 'Generate code using Gemini',
                inputSchema: {
                  type: 'object',
                  properties: {
                    description: { type: 'string', description: 'Code description' },
                    language: { type: 'string', description: 'Programming language' },
                  },
                  required: ['description'],
                },
              },
              {
                name: 'chat',
                description: 'Multi-turn chat conversation',
                inputSchema: {
                  type: 'object',
                  properties: {
                    messages: { type: 'array', description: 'Chat history' },
                    model: { type: 'string', description: 'Model name', default: 'gemini-pro' },
                  },
                  required: ['messages'],
                },
              },
              {
                name: 'function_call',
                description: 'Use Gemini with function calling',
                inputSchema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string', description: 'User prompt' },
                    functions: { type: 'array', description: 'Available functions' },
                  },
                  required: ['prompt', 'functions'],
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
                uri: 'gemini://models',
                name: 'Available Models',
                description: 'List of available Gemini models',
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
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  switch (name) {
    case 'generate_text': {
      const { prompt, model = 'gemini-pro', temperature = 0.7, maxTokens = 1024 } = args;
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
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

    case 'generate_with_vision': {
      const { prompt, imageUrl, imageData } = args;
      const model = 'gemini-pro-vision';
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

      const parts: any[] = [{ text: prompt }];

      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
          },
        });
      } else if (imageUrl) {
        // Fetch image and convert to base64
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64,
          },
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
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

    case 'generate_code': {
      const { description, language = 'python' } = args;
      const prompt = `Generate ${language} code for: ${description}`;
      const model = 'gemini-pro';
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.2,
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

    case 'chat': {
      const { messages, model = 'gemini-pro' } = args;
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

      const contents = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'function_call': {
      const { prompt, functions } = args;
      const model = 'gemini-pro';
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          tools: [{
            functionDeclarations: functions,
          }],
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

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function readResource(uri: string): Promise<any> {
  if (uri === 'gemini://models') {
    const models = [
      'gemini-pro - Text generation',
      'gemini-pro-vision - Multi-modal (text + images)',
      'gemini-ultra - Most capable model',
    ];

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(models, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
