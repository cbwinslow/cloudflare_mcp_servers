# Quick Reference Guide

Quick commands and snippets for working with Cloudflare MCP Servers.

## Common Commands

```bash
# Setup
npm install
npm run setup

# Development
npm run dev              # Start local server (http://localhost:8787)
npm run build            # Build TypeScript

# Deployment
npm run deploy           # Full deployment with info
npm run deploy:worker    # Quick deploy with wrangler
npm run update           # Update existing deployment

# Testing
npm run test             # Run test suite
node scripts/test.js https://your-worker.workers.dev  # Test specific server

# Wrangler Commands
wrangler whoami          # Check authentication
wrangler tail            # View logs in real-time
wrangler deployments list # View deployment history
wrangler secret put KEY  # Set a secret
wrangler secret list     # List secrets
```

## Quick Test Requests

### GET Request (Server Info)
```bash
curl http://localhost:8787
```

### Initialize
```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

### List Tools
```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}'
```

### Call Tool
```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{"name":"echo","arguments":{"message":"Hello MCP!"}},
    "id":3
  }'
```

### List Resources
```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":4}'
```

### Read Resource
```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"resources/read",
    "params":{"uri":"cloudflare://info"},
    "id":5
  }'
```

## Code Snippets

### Basic Tool Implementation
```typescript
async function callTool(name: string, args: any, env: Env): Promise<any> {
  switch (name) {
    case 'my_tool':
      // Validate input
      if (!args?.param) {
        throw new Error('Missing required parameter: param');
      }
      
      // Execute tool logic
      const result = await doSomething(args.param);
      
      // Return result
      return {
        content: [{
          type: 'text',
          text: result,
        }],
      };
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

### KV Storage Operations
```typescript
// Write
await env.MY_KV.put('key', 'value');
await env.MY_KV.put('key', JSON.stringify({ data: 'value' }));
await env.MY_KV.put('key', 'value', { expirationTtl: 3600 });

// Read
const value = await env.MY_KV.get('key');
const json = await env.MY_KV.get('key', 'json');
const buffer = await env.MY_KV.get('key', 'arrayBuffer');

// Delete
await env.MY_KV.delete('key');

// List keys
const list = await env.MY_KV.list({ prefix: 'user:' });
for (const key of list.keys) {
  console.log(key.name);
}
```

### External API Call
```typescript
async function fetchExternalData(url: string): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}
```

### Error Handling
```typescript
// JSON-RPC error response
function errorResponse(id: any, code: number, message: string, data?: any) {
  return {
    jsonrpc: '2.0',
    error: { code, message, data },
    id,
  };
}

// Common error codes
const ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

// Usage
return errorResponse(request.id, ERRORS.METHOD_NOT_FOUND, 'Method not found', {
  method: request.method,
});
```

### Authentication
```typescript
function checkAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return false;
  }
  
  const token = authHeader.replace('Bearer ', '');
  return token === env.API_KEY;
}

// Usage in handler
if (!checkAuth(request, env)) {
  return new Response('Unauthorized', { 
    status: 401,
    headers: { 'WWW-Authenticate': 'Bearer' },
  });
}
```

### Caching
```typescript
// Edge caching
export default {
  async fetch(request: Request, env: Env) {
    const cache = caches.default;
    
    // Try cache first
    let response = await cache.match(request);
    if (response) {
      return response;
    }
    
    // Generate response
    response = await handleRequest(request, env);
    
    // Cache for 1 hour
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'max-age=3600');
    response = new Response(response.body, {
      status: response.status,
      headers,
    });
    
    // Store in cache
    await cache.put(request, response.clone());
    
    return response;
  }
}
```

## Environment Variables

### Required
```env
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

### Optional
```env
MCP_SERVER_NAME=my-mcp-server
MCP_API_KEY=secret_key_for_auth
```

## KV Namespace Setup

```bash
# Create namespace
wrangler kv:namespace create MY_KV

# Copy the ID, add to wrangler.toml:
[[kv_namespaces]]
binding = "MY_KV"
id = "abc123def456"

# For preview/development
wrangler kv:namespace create MY_KV --preview

[[kv_namespaces]]
binding = "MY_KV"
id = "abc123def456"
preview_id = "xyz789uvw012"
```

## Secrets Management

```bash
# Set a secret
wrangler secret put API_KEY
# Enter value when prompted

# List all secrets
wrangler secret list

# Delete a secret
wrangler secret delete API_KEY

# Access in code
const apiKey = env.API_KEY;
```

## Deployment Environments

### Production
```bash
wrangler deploy
```

### Staging
```toml
# In wrangler.toml
[env.staging]
name = "mcp-server-staging"
vars = { ENVIRONMENT = "staging" }
```
```bash
wrangler deploy --env staging
```

## Monitoring

### View Logs
```bash
wrangler tail
wrangler tail --status error
wrangler tail --method POST
wrangler tail --format pretty
```

### View Metrics
Visit: https://dash.cloudflare.com → Workers & Pages → Your Worker

## Common URLs

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Workers Dashboard**: https://dash.cloudflare.com → Workers & Pages
- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens
- **Workers Dev**: https://your-worker.your-subdomain.workers.dev
- **MCP Docs**: https://modelcontextprotocol.io
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/

## File Locations

- **Main server**: `src/index.ts`
- **Examples**: `examples/*.ts`
- **Scripts**: `scripts/*.js`
- **Config**: `wrangler.toml`
- **Environment**: `.env`
- **Docs**: `docs/*.md`

## Troubleshooting Quick Fixes

### Can't deploy
```bash
wrangler whoami  # Check auth
wrangler logout
wrangler login
```

### Worker not updating
```bash
# Clear cache and redeploy
wrangler deploy --no-bundle
```

### KV not working
```bash
# List namespaces
wrangler kv:namespace list

# Check binding in wrangler.toml
[[kv_namespaces]]
binding = "MY_KV"  # Must match code
id = "your-id"
```

### Logs not showing
```bash
# Add console.log in code
console.log('Debug:', value);

# Then tail
wrangler tail --format pretty
```

## Best Practices

1. ✅ Always validate input parameters
2. ✅ Use TypeScript for type safety
3. ✅ Handle errors gracefully
4. ✅ Return proper JSON-RPC responses
5. ✅ Add CORS headers for browser clients
6. ✅ Use secrets for sensitive data
7. ✅ Cache expensive operations
8. ✅ Test locally before deploying
9. ✅ Monitor logs and metrics
10. ✅ Document your tools clearly

## Getting Help

- 📖 [Full Documentation](./docs/)
- 🐛 [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- 🚀 [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- 📚 [Knowledge Base](./docs/KNOWLEDGE_BASE.md)
- 🔧 [API Reference](./docs/CLOUDFLARE_API_REFERENCE.md)
