# MCP Server Knowledge Base for AI Agents

## Overview

This knowledge base provides comprehensive context for AI agents working with Model Context Protocol (MCP) servers deployed on Cloudflare Workers.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). It enables:

- **Standardized Integration**: Consistent way to connect AI assistants with data sources
- **Tool Exposure**: Expose custom tools/functions that LLMs can call
- **Resource Access**: Provide structured data and resources to AI models
- **Prompt Templates**: Share reusable prompt templates

## MCP Core Concepts

### 1. Protocol Structure

MCP uses JSON-RPC 2.0 as its communication protocol. Every request and response follows this format:

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { /* parameters */ },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { /* result data */ },
  "id": 1
}
```

### 2. Core Methods

#### Initialize
- **Method**: `initialize`
- **Purpose**: Establish connection and negotiate capabilities
- **Returns**: Server info and capabilities

#### Tools
- **List Tools**: `tools/list` - Get available tools
- **Call Tool**: `tools/call` - Execute a tool
- **Tools** are functions the AI can invoke

#### Resources
- **List Resources**: `resources/list` - Get available resources
- **Read Resource**: `resources/read` - Retrieve resource content
- **Resources** are data sources the AI can access

#### Prompts
- **List Prompts**: `prompts/list` - Get available prompt templates
- **Get Prompt**: `prompts/get` - Retrieve a prompt template
- **Prompts** are reusable prompt templates

## Cloudflare Workers Context

### Why Cloudflare Workers for MCP?

1. **Global Distribution**: Deploy to 300+ locations worldwide
2. **Low Latency**: Execute at the edge, close to users
3. **Serverless**: No infrastructure management
4. **Scalability**: Automatic scaling to handle any load
5. **Cost-Effective**: Pay only for what you use

### Cloudflare Workers Architecture

```
┌─────────────┐
│   Client    │
│   (AI App)  │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────────┐
│  Cloudflare Worker  │
│   (MCP Server)      │
├─────────────────────┤
│ - Request Handler   │
│ - MCP Protocol      │
│ - Tool Execution    │
│ - Resource Access   │
└──────┬──────────────┘
       │
       ├──► KV Storage (Optional)
       ├──► Durable Objects (Optional)
       └──► External APIs (Optional)
```

### Key Cloudflare Features for MCP

#### 1. KV Storage
- **Purpose**: Persistent key-value storage
- **Use Case**: Store MCP server state, cache data
- **Access**: Through `env.KV_NAMESPACE` binding

#### 2. Durable Objects
- **Purpose**: Strongly consistent storage with coordination
- **Use Case**: Stateful MCP operations, real-time collaboration
- **Access**: Through Durable Object bindings

#### 3. Environment Variables & Secrets
- **Variables**: Configuration (in `wrangler.toml`)
- **Secrets**: Sensitive data (API keys, tokens)
- **Access**: Through `env` object

## Implementation Guidelines for AI Agents

### 1. Server Structure

Every MCP server on Cloudflare Workers should:

1. **Export default handler**: 
   ```typescript
   export default {
     async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>
   }
   ```

2. **Handle CORS**: Support cross-origin requests for browser clients

3. **Support GET**: Return server info on GET requests

4. **Support POST**: Handle MCP protocol on POST requests

5. **Error Handling**: Return proper JSON-RPC error responses

### 2. Protocol Implementation

#### Minimum Required Methods:
- `initialize` - MUST implement
- `tools/list` - If providing tools
- `tools/call` - If providing tools
- `resources/list` - If providing resources
- `resources/read` - If providing resources
- `prompts/list` - If providing prompts
- `prompts/get` - If providing prompts

#### Error Codes:
- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

### 3. Tool Design

Good tools are:
- **Focused**: Do one thing well
- **Well-documented**: Clear descriptions and schemas
- **Type-safe**: Use JSON Schema for input validation
- **Idempotent**: When possible, same input = same output

Example tool definition:
```typescript
{
  name: 'fetch_data',
  description: 'Fetch data from an external API',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint: { 
        type: 'string', 
        description: 'API endpoint to call'
      },
      method: { 
        type: 'string',
        enum: ['GET', 'POST'],
        description: 'HTTP method'
      }
    },
    required: ['endpoint']
  }
}
```

### 4. Resource Design

Resources represent data that the AI can access:

```typescript
{
  uri: 'cloudflare://data/users',
  name: 'User Database',
  description: 'Access to user data',
  mimeType: 'application/json'
}
```

Resource URIs should follow a consistent scheme:
- `cloudflare://` - Internal Cloudflare resources
- `https://` - External HTTP resources
- `custom://` - Custom URI schemes

### 5. Authentication

For secure MCP servers:

1. **Check Authorization header**:
   ```typescript
   const authHeader = request.headers.get('Authorization');
   if (authHeader !== `Bearer ${env.MCP_API_KEY}`) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

2. **Use Cloudflare Access**: For enterprise security

3. **Rate Limiting**: Implement using KV or Durable Objects

## Deployment Best Practices

### 1. Environment Setup

Always use separate environments:
- **Development**: Local testing with `wrangler dev`
- **Staging**: Test deployment
- **Production**: Live deployment

### 2. Configuration Management

```toml
# wrangler.toml
[env.staging]
name = "mcp-server-staging"
vars = { ENVIRONMENT = "staging" }

[env.production]
name = "mcp-server-production"
vars = { ENVIRONMENT = "production" }
```

### 3. Secrets Management

NEVER commit secrets to git:
```bash
# Set secrets via CLI
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

### 4. Monitoring

Monitor your MCP server:
- **Cloudflare Dashboard**: View analytics and logs
- **Logpush**: Export logs to external systems
- **Workers Analytics Engine**: Custom metrics

## Common Patterns

### Pattern 1: Stateless Tool Server

Simple, stateless MCP server with tools:
- No storage needed
- Fast and simple
- Perfect for computational tools

### Pattern 2: Stateful Server with KV

MCP server with persistent state:
- Use KV for caching
- Store user preferences
- Track usage metrics

### Pattern 3: Real-time Collaborative Server

Advanced server with Durable Objects:
- Real-time updates
- Strong consistency
- WebSocket support

### Pattern 4: API Gateway

MCP server as API aggregator:
- Combine multiple APIs
- Transform data formats
- Add authentication layer

## Troubleshooting Guide

### Issue: "Worker exceeded CPU time limit"

**Cause**: Long-running computation
**Solution**: 
- Break into smaller chunks
- Use async/await properly
- Consider moving heavy work to external service

### Issue: "KV key not found"

**Cause**: Missing KV binding or key doesn't exist
**Solution**:
- Check `wrangler.toml` for KV binding
- Verify key exists before reading
- Handle null returns gracefully

### Issue: "TypeError: env.BINDING is undefined"

**Cause**: Missing environment binding
**Solution**:
- Add binding to `wrangler.toml`
- Create KV namespace: `wrangler kv:namespace create BINDING`
- Update binding ID in config

### Issue: "CORS Error"

**Cause**: Missing or incorrect CORS headers
**Solution**:
- Add proper CORS headers to all responses
- Handle OPTIONS preflight requests
- Include necessary origins in allow list

## Testing Strategies

### 1. Local Testing

```bash
# Start local dev server
npm run dev

# Test with curl
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

### 2. Integration Testing

Use the provided test script:
```bash
# Test local server
node scripts/test.js

# Test deployed server
node scripts/test.js https://your-worker.workers.dev
```

### 3. Load Testing

For production readiness:
- Use tools like `wrk` or `autocannon`
- Test with realistic workloads
- Monitor Cloudflare analytics

## Security Considerations

1. **Input Validation**: Always validate tool inputs
2. **Rate Limiting**: Prevent abuse
3. **Authentication**: Protect sensitive operations
4. **HTTPS Only**: Never use plain HTTP in production
5. **Secrets**: Use Cloudflare secrets, never hardcode
6. **CORS**: Restrict to known origins when possible

## Performance Optimization

1. **Minimize Dependencies**: Smaller bundles = faster startup
2. **Cache Responses**: Use KV for frequently accessed data
3. **Parallel Requests**: Use `Promise.all()` for concurrent ops
4. **Edge Caching**: Leverage Cloudflare's cache
5. **Compression**: Enable gzip/brotli for responses

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [TypeScript for Workers](https://developers.cloudflare.com/workers/languages/typescript/)
