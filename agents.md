# MCP Server Agents

This document describes the agents and their capabilities for accessing various data sources and services through MCP servers.

## Government Data Agents

### GovInfo Agent
**Server**: `govinfo-server.ts`
**Purpose**: Access U.S. Government Publishing Office documents
**Capabilities**:
- Search congressional bills, resolutions, and reports
- Access Federal regulations (CFR)
- Retrieve Congressional Record entries
- Search court opinions and presidential documents

**Configuration**:
```json
{
  "name": "govinfo",
  "url": "https://your-worker.workers.dev/govinfo",
  "apiKey": "GOVINFO_API_KEY"
}
```

**Example Usage**:
```json
{
  "tool": "search_bills",
  "arguments": {
    "query": "infrastructure",
    "congress": "118"
  }
}
```

### Congress.gov Agent
**Server**: `congress-server.ts`
**Purpose**: Access detailed Congressional data
**Capabilities**:
- Search and retrieve legislation details
- Access Congressional member information
- Query committee data and assignments
- Retrieve roll call votes
- Track nominations and treaties

**Configuration**:
```json
{
  "name": "congress",
  "url": "https://your-worker.workers.dev/congress",
  "apiKey": "CONGRESS_API_KEY"
}
```

**Example Usage**:
```json
{
  "tool": "get_bill",
  "arguments": {
    "congress": 118,
    "billType": "hr",
    "billNumber": 1234
  }
}
```

### OpenStates Agent
**Server**: `openstates-server.ts`
**Purpose**: Access state legislature data from all 50 states
**Capabilities**:
- Search state bills and resolutions
- Access state legislator information
- Query legislative committees
- Track bill votes and actions
- Monitor multiple state sessions

**Configuration**:
```json
{
  "name": "openstates",
  "url": "https://your-worker.workers.dev/openstates",
  "apiKey": "OPENSTATES_API_KEY"
}
```

**Example Usage**:
```json
{
  "tool": "search_bills",
  "arguments": {
    "jurisdiction": "CA",
    "query": "climate change"
  }
}
```

## AI/LLM Framework Agents

### LangChain Agent
**Server**: `langchain-server.ts`
**Purpose**: Execute LangChain chains and agents
**Capabilities**:
- Execute various chain types (LLM, conversational, sequential)
- Create and run agents with tools
- Split and process documents
- Generate text embeddings
- Perform similarity search

**Configuration**:
```json
{
  "name": "langchain",
  "url": "https://your-worker.workers.dev/langchain",
  "apiKey": "LANGCHAIN_API_KEY"
}
```

**Example Usage**:
```json
{
  "tool": "execute_chain",
  "arguments": {
    "chainType": "conversational",
    "input": "What is the weather like today?"
  }
}
```

### LangFuse Agent
**Server**: `langfuse-server.ts`
**Purpose**: LLM observability and tracing
**Capabilities**:
- Create and manage traces
- Track model performance metrics
- Monitor costs and usage
- Analyze debugging information
- Query evaluation scores

**Configuration**:
```json
{
  "name": "langfuse",
  "url": "https://your-worker.workers.dev/langfuse",
  "publicKey": "LANGFUSE_PUBLIC_KEY",
  "secretKey": "LANGFUSE_SECRET_KEY"
}
```

**Example Usage**:
```json
{
  "tool": "create_trace",
  "arguments": {
    "name": "user_query",
    "userId": "user123"
  }
}
```

### Cloudflare Agent
**Server**: `cloudflare-server.ts`
**Purpose**: Manage Cloudflare resources
**Capabilities**:
- Manage Workers and deployments
- KV namespace operations
- R2 storage management
- Analytics and logs
- DNS and domain management

**Configuration**:
```json
{
  "name": "cloudflare",
  "url": "https://your-worker.workers.dev/cloudflare",
  "apiToken": "CLOUDFLARE_API_TOKEN",
  "accountId": "CLOUDFLARE_ACCOUNT_ID"
}
```

## Development Tool Agents

### Postman Agent
**Server**: `postman-server.ts`
**Purpose**: API testing and collection management
**Capabilities**:
- Manage API collections
- Execute API requests
- Run test suites
- Access mock servers
- Monitor API endpoints

**Configuration**:
```json
{
  "name": "postman",
  "url": "https://your-worker.workers.dev/postman",
  "apiKey": "POSTMAN_API_KEY"
}
```

### VSCode Agent
**Server**: `vscode-server.ts`
**Purpose**: Editor integration and automation
**Capabilities**:
- File operations
- Extension management
- Code navigation
- Debug configuration
- Workspace management

**Configuration**:
```json
{
  "name": "vscode",
  "url": "https://your-worker.workers.dev/vscode"
}
```

## AI Model Agents

### Gemini Agent
**Server**: `gemini-server.ts`
**Purpose**: Google Gemini AI integration
**Capabilities**:
- Text generation
- Multi-modal understanding
- Code generation
- Function calling
- Streaming responses

**Configuration**:
```json
{
  "name": "gemini",
  "url": "https://your-worker.workers.dev/gemini",
  "apiKey": "GEMINI_API_KEY"
}
```

### Qwen Agent
**Server**: `qwen-server.ts`
**Purpose**: Alibaba Qwen model integration
**Capabilities**:
- Multi-lingual text generation
- Code understanding
- Reasoning tasks
- Long context processing

**Configuration**:
```json
{
  "name": "qwen",
  "url": "https://your-worker.workers.dev/qwen",
  "apiKey": "QWEN_API_KEY"
}
```

## Agent-Zero Integration

### Agent-Zero
**Server**: `agent-zero-server.ts`
**Purpose**: Autonomous agent framework hosted on Cloudflare
**Capabilities**:
- Task decomposition and execution
- Tool usage and orchestration
- Memory management
- Multi-step reasoning
- Self-improvement loops

**Configuration**:
```json
{
  "name": "agent-zero",
  "url": "https://your-worker.workers.dev/agent-zero",
  "apiKey": "AGENT_ZERO_API_KEY"
}
```

**Architecture**:
- Runs as a Cloudflare Worker
- Uses KV for persistent memory
- Durable Objects for session state
- Accesses other MCP servers as tools

## Multi-Agent Orchestration

### Using Multiple Agents Together

Example orchestration configuration:
```json
{
  "orchestration": {
    "mode": "sequential",
    "agents": [
      {
        "name": "govinfo",
        "task": "search_bills",
        "output": "bill_data"
      },
      {
        "name": "langchain",
        "task": "summarize",
        "input": "${bill_data}"
      }
    ]
  }
}
```

### Agent Communication Patterns

1. **Sequential**: Agents execute one after another
2. **Parallel**: Multiple agents execute simultaneously
3. **Conditional**: Agent execution based on conditions
4. **Loop**: Iterative agent execution until condition met

## Best Practices

### Security
- Store API keys securely in Cloudflare secrets
- Use environment-specific configurations
- Implement rate limiting per agent
- Validate all inputs before passing to agents

### Performance
- Cache frequent queries using Cloudflare KV
- Use parallel agent calls when possible
- Implement timeout handling
- Monitor agent execution times

### Error Handling
- Implement retry logic with exponential backoff
- Provide fallback agents for critical operations
- Log all agent interactions for debugging
- Return meaningful error messages

### Monitoring
- Track agent usage metrics
- Monitor API quota consumption
- Set up alerts for failures
- Analyze agent performance trends

## Environment Variables

Required for each agent type:

### Government Data
```bash
GOVINFO_API_KEY=your_key
CONGRESS_API_KEY=your_key
OPENSTATES_API_KEY=your_key
```

### AI/LLM Frameworks
```bash
LANGCHAIN_API_KEY=your_key
LANGFUSE_PUBLIC_KEY=your_key
LANGFUSE_SECRET_KEY=your_key
OPENAI_API_KEY=your_key
```

### Development Tools
```bash
POSTMAN_API_KEY=your_key
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### AI Models
```bash
GEMINI_API_KEY=your_key
QWEN_API_KEY=your_key
```

## Deployment

### Deploy All Agents
```bash
npm run deploy:all
```

### Deploy Specific Agent
```bash
npm run deploy:agent -- govinfo
```

### Test Agent
```bash
npm run test:agent -- govinfo
```

## Support and Documentation

For more information:
- API References: See individual server files
- Tool Catalog: See `tools.md`
- Deployment Guide: See `docs/DEPLOYMENT_GUIDE.md`
- Examples: See `examples/` directory
