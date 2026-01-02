/**
 * Agent-Zero MCP Server
 * 
 * Autonomous agent framework hosted on Cloudflare Workers.
 * Provides task decomposition, execution, and orchestration capabilities.
 * 
 * Features:
 * - Task decomposition and planning
 * - Multi-step reasoning
 * - Tool orchestration
 * - Memory management
 * - Self-improvement loops
 * - Access to other MCP servers
 */

export interface Env {
  AGENT_ZERO_STATE: KVNamespace;
  AGENT_ZERO_MEMORY: KVNamespace;
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

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  steps: Step[];
  result?: any;
  createdAt: string;
  updatedAt: string;
}

interface Step {
  id: string;
  action: string;
  tool?: string;
  args?: any;
  result?: any;
  status: 'pending' | 'completed' | 'failed';
}

interface Memory {
  id: string;
  type: 'fact' | 'experience' | 'preference' | 'goal';
  content: string;
  tags: string[];
  timestamp: string;
  relevance: number;
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
        name: 'Agent-Zero MCP Server',
        version: '1.0.0',
        description: 'Autonomous agent framework with task decomposition and execution',
        capabilities: ['reasoning', 'planning', 'execution', 'memory', 'learning'],
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
              name: 'Agent-Zero MCP Server',
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
                name: 'execute_task',
                description: 'Execute an autonomous task with planning and reasoning',
                inputSchema: {
                  type: 'object',
                  properties: {
                    task: { type: 'string', description: 'Task description' },
                    tools: { type: 'array', description: 'Available tools for the task' },
                    maxSteps: { type: 'number', description: 'Maximum execution steps', default: 10 },
                    temperature: { type: 'number', description: 'Reasoning temperature', default: 0.7 },
                  },
                  required: ['task'],
                },
              },
              {
                name: 'get_task_status',
                description: 'Get status of a running or completed task',
                inputSchema: {
                  type: 'object',
                  properties: {
                    taskId: { type: 'string', description: 'Task ID' },
                  },
                  required: ['taskId'],
                },
              },
              {
                name: 'add_memory',
                description: 'Add information to agent memory',
                inputSchema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', description: 'Memory type', enum: ['fact', 'experience', 'preference', 'goal'] },
                    content: { type: 'string', description: 'Memory content' },
                    tags: { type: 'array', description: 'Memory tags' },
                  },
                  required: ['type', 'content'],
                },
              },
              {
                name: 'query_memory',
                description: 'Query agent memory',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    type: { type: 'string', description: 'Filter by memory type' },
                    limit: { type: 'number', description: 'Max results', default: 10 },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'get_capabilities',
                description: 'Get agent capabilities and available tools',
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              },
              {
                name: 'reflect',
                description: 'Agent self-reflection on recent actions',
                inputSchema: {
                  type: 'object',
                  properties: {
                    taskId: { type: 'string', description: 'Task ID to reflect on' },
                  },
                  required: ['taskId'],
                },
              },
              {
                name: 'plan_task',
                description: 'Decompose task into steps without execution',
                inputSchema: {
                  type: 'object',
                  properties: {
                    task: { type: 'string', description: 'Task to plan' },
                    tools: { type: 'array', description: 'Available tools' },
                  },
                  required: ['task'],
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
                uri: 'agent-zero://config',
                name: 'Agent Configuration',
                description: 'Agent-Zero configuration and settings',
                mimeType: 'application/json',
              },
              {
                uri: 'agent-zero://memory',
                name: 'Memory Store',
                description: 'Agent memory statistics',
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
  switch (name) {
    case 'execute_task': {
      const taskId = crypto.randomUUID();
      const { task, tools = [], maxSteps = 10 } = args;

      // Decompose task into steps
      const steps = await decomposeTask(task, tools, env);

      const taskData: Task = {
        id: taskId,
        description: task,
        status: 'in_progress',
        steps: steps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store task
      await env.AGENT_ZERO_STATE.put(`task:${taskId}`, JSON.stringify(taskData));

      // Execute steps (simplified - in production, this would be more sophisticated)
      const results = [];
      for (const step of steps.slice(0, maxSteps)) {
        try {
          const stepResult = await executeStep(step, env);
          step.result = stepResult;
          step.status = 'completed';
          results.push(stepResult);
        } catch (error) {
          step.status = 'failed';
          step.result = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      taskData.status = 'completed';
      taskData.result = results;
      taskData.updatedAt = new Date().toISOString();

      await env.AGENT_ZERO_STATE.put(`task:${taskId}`, JSON.stringify(taskData));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            taskId,
            status: 'completed',
            steps: taskData.steps.length,
            result: results,
          }, null, 2),
        }],
      };
    }

    case 'get_task_status': {
      const { taskId } = args;
      const taskData = await env.AGENT_ZERO_STATE.get(`task:${taskId}`);

      if (!taskData) {
        throw new Error(`Task not found: ${taskId}`);
      }

      return {
        content: [{
          type: 'text',
          text: taskData,
        }],
      };
    }

    case 'add_memory': {
      const memoryId = crypto.randomUUID();
      const memory: Memory = {
        id: memoryId,
        type: args.type,
        content: args.content,
        tags: args.tags || [],
        timestamp: new Date().toISOString(),
        relevance: 1.0,
      };

      await env.AGENT_ZERO_MEMORY.put(`memory:${memoryId}`, JSON.stringify(memory));

      // Also add to index by type
      const typeKey = `index:type:${args.type}`;
      const typeIndex = await env.AGENT_ZERO_MEMORY.get(typeKey) || '[]';
      const typeIndexData = JSON.parse(typeIndex);
      typeIndexData.push(memoryId);
      await env.AGENT_ZERO_MEMORY.put(typeKey, JSON.stringify(typeIndexData));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ memoryId, status: 'stored' }, null, 2),
        }],
      };
    }

    case 'query_memory': {
      const { query, type, limit = 10 } = args;
      const memories: Memory[] = [];

      // Simple search - in production, this would use vector search
      const indexKey = type ? `index:type:${type}` : 'index:all';
      const indexData = await env.AGENT_ZERO_MEMORY.get(indexKey);

      if (indexData) {
        const memoryIds = JSON.parse(indexData);
        for (const memoryId of memoryIds.slice(0, limit)) {
          const memoryData = await env.AGENT_ZERO_MEMORY.get(`memory:${memoryId}`);
          if (memoryData) {
            const memory = JSON.parse(memoryData);
            if (memory.content.toLowerCase().includes(query.toLowerCase())) {
              memories.push(memory);
            }
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ count: memories.length, memories }, null, 2),
        }],
      };
    }

    case 'get_capabilities': {
      const capabilities = {
        reasoning: ['task_decomposition', 'planning', 'reflection'],
        tools: ['execute', 'plan', 'remember', 'learn'],
        memory: ['store', 'retrieve', 'update'],
        learning: ['from_experience', 'from_feedback'],
        available_mcp_servers: [
          'govinfo', 'congress', 'openstates',
          'langchain', 'langfuse',
          'cloudflare', 'postman',
          'gemini', 'qwen',
        ],
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(capabilities, null, 2),
        }],
      };
    }

    case 'reflect': {
      const { taskId } = args;
      const taskData = await env.AGENT_ZERO_STATE.get(`task:${taskId}`);

      if (!taskData) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const task: Task = JSON.parse(taskData);

      // Analyze task execution
      const reflection = {
        taskId,
        successRate: task.steps.filter(s => s.status === 'completed').length / task.steps.length,
        totalSteps: task.steps.length,
        completedSteps: task.steps.filter(s => s.status === 'completed').length,
        failedSteps: task.steps.filter(s => s.status === 'failed').length,
        insights: [
          'Task execution completed',
          `${task.steps.length} steps planned and executed`,
        ],
        improvements: [] as string[],
      };

      if (reflection.successRate < 1.0) {
        reflection.improvements.push('Review failed steps for error patterns');
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(reflection, null, 2),
        }],
      };
    }

    case 'plan_task': {
      const { task, tools = [] } = args;
      const steps = await decomposeTask(task, tools, env);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            task,
            totalSteps: steps.length,
            steps: steps.map(s => ({ action: s.action, tool: s.tool })),
          }, null, 2),
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function decomposeTask(task: string, tools: string[], env: Env): Promise<Step[]> {
  // Simplified task decomposition
  // In production, this would use LLM for intelligent decomposition
  const steps: Step[] = [
    {
      id: crypto.randomUUID(),
      action: 'analyze_task',
      status: 'pending',
    },
    {
      id: crypto.randomUUID(),
      action: 'gather_information',
      tool: 'search',
      status: 'pending',
    },
    {
      id: crypto.randomUUID(),
      action: 'process_information',
      status: 'pending',
    },
    {
      id: crypto.randomUUID(),
      action: 'generate_result',
      status: 'pending',
    },
  ];

  return steps;
}

async function executeStep(step: Step, env: Env): Promise<any> {
  // Simplified step execution
  // In production, this would route to actual tool implementations
  return {
    stepId: step.id,
    action: step.action,
    result: `Executed: ${step.action}`,
    timestamp: new Date().toISOString(),
  };
}

async function readResource(uri: string, env: Env): Promise<any> {
  if (uri === 'agent-zero://config') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          name: 'Agent-Zero',
          version: '1.0.0',
          features: ['autonomous', 'reasoning', 'planning', 'learning'],
          maxSteps: 10,
          temperature: 0.7,
        }, null, 2),
      }],
    };
  }

  if (uri === 'agent-zero://memory') {
    // Get memory statistics
    const stats = {
      total: 0,
      byType: {
        fact: 0,
        experience: 0,
        preference: 0,
        goal: 0,
      },
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
