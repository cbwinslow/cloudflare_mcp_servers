/**
 * VSCode MCP Server
 * 
 * Provides VSCode extension and workspace management capabilities:
 * - Extension management
 * - Workspace operations
 * - Settings and configuration
 * - File operations
 * - Debug configuration
 */

export interface Env {
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
        name: 'VSCode MCP Server',
        version: '1.0.0',
        description: 'VSCode integration and workspace management',
        capabilities: ['extensions', 'workspace', 'settings', 'files', 'debugging'],
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
              name: 'VSCode MCP Server',
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
                name: 'get_extensions',
                description: 'List installed VSCode extensions',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'search_extensions',
                description: 'Search for VSCode extensions',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'get_workspace_config',
                description: 'Get workspace configuration',
                inputSchema: {
                  type: 'object',
                  properties: {
                    section: { type: 'string', description: 'Config section' },
                  },
                },
              },
              {
                name: 'create_workspace_settings',
                description: 'Create workspace settings file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    settings: { type: 'object', description: 'Settings object' },
                  },
                  required: ['settings'],
                },
              },
              {
                name: 'create_launch_config',
                description: 'Create debug launch configuration',
                inputSchema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', description: 'Debugger type' },
                    name: { type: 'string', description: 'Config name' },
                    request: { type: 'string', description: 'launch or attach' },
                    program: { type: 'string', description: 'Program path' },
                  },
                  required: ['type', 'name', 'request'],
                },
              },
              {
                name: 'create_tasks_config',
                description: 'Create tasks configuration',
                inputSchema: {
                  type: 'object',
                  properties: {
                    tasks: { type: 'array', description: 'Array of task configurations' },
                  },
                  required: ['tasks'],
                },
              },
              {
                name: 'get_recommended_extensions',
                description: 'Get recommended extensions for a workspace',
                inputSchema: {
                  type: 'object',
                  properties: {
                    language: { type: 'string', description: 'Programming language' },
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
                uri: 'vscode://popular-extensions',
                name: 'Popular Extensions',
                description: 'List of popular VSCode extensions',
                mimeType: 'application/json',
              },
              {
                uri: 'vscode://keybindings',
                name: 'Keybindings Reference',
                description: 'Common VSCode keybindings',
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
    case 'get_extensions': {
      // Simulated extension list - in production, this would interface with VSCode API
      const extensions = [
        { id: 'ms-python.python', name: 'Python', publisher: 'Microsoft' },
        { id: 'dbaeumer.vscode-eslint', name: 'ESLint', publisher: 'Microsoft' },
        { id: 'esbenp.prettier-vscode', name: 'Prettier', publisher: 'Prettier' },
        { id: 'ms-vscode.vscode-typescript-next', name: 'TypeScript', publisher: 'Microsoft' },
      ];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(extensions, null, 2),
        }],
      };
    }

    case 'search_extensions': {
      const { query } = args;
      // Simulated search - in production, this would call VSCode Marketplace API
      const results = [
        { id: 'example.extension', name: `Extension for ${query}`, rating: 4.5 },
      ];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2),
        }],
      };
    }

    case 'get_workspace_config': {
      const { section } = args;
      const config = {
        section: section || 'all',
        settings: {
          'editor.fontSize': 14,
          'editor.tabSize': 2,
          'files.autoSave': 'afterDelay',
        },
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(config, null, 2),
        }],
      };
    }

    case 'create_workspace_settings': {
      const { settings } = args;
      const settingsJson = JSON.stringify(settings, null, 2);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            file: '.vscode/settings.json',
            content: settingsJson,
            status: 'created',
          }, null, 2),
        }],
      };
    }

    case 'create_launch_config': {
      const { type, name: configName, request, program } = args;
      const launchConfig = {
        version: '0.2.0',
        configurations: [{
          type,
          name: configName,
          request,
          program: program || '${workspaceFolder}/index.js',
        }],
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            file: '.vscode/launch.json',
            content: JSON.stringify(launchConfig, null, 2),
            status: 'created',
          }, null, 2),
        }],
      };
    }

    case 'create_tasks_config': {
      const { tasks } = args;
      const tasksConfig = {
        version: '2.0.0',
        tasks: tasks || [],
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            file: '.vscode/tasks.json',
            content: JSON.stringify(tasksConfig, null, 2),
            status: 'created',
          }, null, 2),
        }],
      };
    }

    case 'get_recommended_extensions': {
      const { language } = args;
      const recommendations: { [key: string]: string[] } = {
        python: ['ms-python.python', 'ms-python.vscode-pylance'],
        javascript: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode'],
        typescript: ['ms-vscode.vscode-typescript-next'],
        go: ['golang.go'],
        rust: ['rust-lang.rust-analyzer'],
      };

      const recommended = recommendations[language || 'javascript'] || [];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(recommended, null, 2),
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function readResource(uri: string): Promise<any> {
  if (uri === 'vscode://popular-extensions') {
    const popular = [
      'Python', 'ESLint', 'Prettier', 'GitLens',
      'Live Server', 'REST Client', 'Docker',
      'Remote Development', 'Jupyter', 'C/C++'
    ];

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(popular, null, 2),
      }],
    };
  }

  if (uri === 'vscode://keybindings') {
    const keybindings = {
      'Ctrl+P': 'Quick Open',
      'Ctrl+Shift+P': 'Command Palette',
      'Ctrl+B': 'Toggle Sidebar',
      'Ctrl+`': 'Toggle Terminal',
      'Ctrl+Shift+F': 'Search in Files',
    };

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(keybindings, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
