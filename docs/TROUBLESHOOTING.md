# Troubleshooting Guide

Common issues and solutions when working with MCP servers on Cloudflare Workers.

## Build and Development Issues

### "Cannot find module" errors

**Problem**: TypeScript can't find imported modules.

**Solutions**:
```bash
# Install missing dependencies
npm install

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check tsconfig.json paths are correct
```

### "wrangler: command not found"

**Problem**: Wrangler CLI is not installed.

**Solution**:
```bash
# Install wrangler locally
npm install

# Or install globally
npm install -g wrangler

# Use npx if not installed
npx wrangler dev
```

### Local server won't start

**Problem**: Port 8787 is already in use.

**Solutions**:
```bash
# Find process using port 8787
lsof -i :8787  # On Mac/Linux
netstat -ano | findstr :8787  # On Windows

# Kill the process or use different port
wrangler dev --port 8788
```

## Deployment Issues

### "Invalid API token"

**Problem**: Cloudflare API token is incorrect or expired.

**Solutions**:
1. Regenerate API token in Cloudflare Dashboard
2. Ensure token has "Edit Cloudflare Workers" permissions
3. Update `.env` file with new token
4. Try: `wrangler whoami` to verify token

### "Account ID not found"

**Problem**: Account ID is incorrect.

**Solutions**:
1. Log into Cloudflare Dashboard
2. Go to Workers & Pages
3. Copy Account ID from right sidebar
4. Update `.env` file

### "Worker name already exists"

**Problem**: Worker name is taken.

**Solutions**:
```bash
# Use different name in wrangler.toml
name = "my-unique-mcp-server-name"

# Or deploy with custom name
wrangler deploy --name my-custom-name
```

### "Worker exceeded size limit"

**Problem**: Bundled worker is too large (> 1MB).

**Solutions**:
1. Remove unused dependencies
2. Use dynamic imports for large libraries
3. Split into multiple workers
4. Enable minification in build

```typescript
// Use dynamic imports
async function heavyOperation() {
  const lib = await import('./heavy-library');
  return lib.process();
}
```

## Runtime Issues

### "Worker exceeded CPU time limit"

**Problem**: Worker takes too long to execute.

**Solutions**:
1. Break work into smaller chunks
2. Use async/await properly
3. Cache expensive operations
4. Consider moving heavy work to external service

```typescript
// Bad - blocking
for (let i = 0; i < 1000000; i++) {
  doWork(i);
}

// Good - with breaks
async function processInChunks() {
  const chunks = createChunks(data, 1000);
  for (const chunk of chunks) {
    await processChunk(chunk);
  }
}
```

### "KV key not found"

**Problem**: Trying to read non-existent KV key.

**Solutions**:
```typescript
// Always check for null
const value = await env.MY_KV.get('key');
if (value === null) {
  return new Response('Not found', { status: 404 });
}

// Or provide default
const value = await env.MY_KV.get('key') || 'default';
```

### "env.BINDING is undefined"

**Problem**: Missing environment binding.

**Solutions**:
1. Add binding to `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "MY_KV"
id = "your-namespace-id"
```

2. Create KV namespace:
```bash
wrangler kv:namespace create MY_KV
```

3. Update binding ID in `wrangler.toml`

### CORS errors in browser

**Problem**: CORS headers not set correctly.

**Solutions**:
```typescript
// Add CORS headers to ALL responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// Add to all responses
return new Response(body, {
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders,
  },
});
```

## MCP Protocol Issues

### "Method not found" errors

**Problem**: Client calling unsupported method.

**Solutions**:
1. Implement the method in your server
2. Check method name spelling
3. Verify capabilities advertised match implementation

```typescript
// In initialize response, only advertise what you support
capabilities: {
  tools: true,      // Only if you implement tools/list and tools/call
  resources: false, // Don't advertise if not implemented
  prompts: false,
}
```

### "Invalid params" errors

**Problem**: Tool parameters don't match schema.

**Solutions**:
```typescript
// Validate parameters before use
async function callTool(name: string, args: any): Promise<any> {
  if (name === 'echo') {
    if (!args?.message || typeof args.message !== 'string') {
      throw new Error('Invalid message parameter');
    }
    return { content: [{ type: 'text', text: args.message }] };
  }
}
```

### Responses not parsed correctly

**Problem**: Invalid JSON-RPC format.

**Solutions**:
```typescript
// Always include jsonrpc and id
return {
  jsonrpc: '2.0',  // Required
  result: {},       // For success
  // OR
  error: {},        // For errors
  id: request.id,   // Must match request id
};
```

## Performance Issues

### Slow response times

**Solutions**:
1. Enable caching:
```typescript
// Cache at edge
const cache = caches.default;
const cached = await cache.match(request);
if (cached) return cached;
```

2. Use KV efficiently:
```typescript
// Cache frequently accessed data
const cacheKey = `cache:${key}`;
let value = await env.KV.get(cacheKey, { cacheTtl: 300 });
```

3. Parallel requests:
```typescript
// Bad - sequential
const user = await fetchUser();
const posts = await fetchPosts();

// Good - parallel
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts(),
]);
```

### High latency for users

**Solutions**:
1. Use Cloudflare's global network (automatic)
2. Minimize external API calls
3. Use KV for data closer to users
4. Enable Smart Placement (Cloudflare feature)

## Testing Issues

### "Connection refused" when testing locally

**Problem**: Dev server not running.

**Solutions**:
```bash
# Start dev server in one terminal
npm run dev

# Test in another terminal
curl http://localhost:8787
```

### Tests failing on deployed server

**Problem**: Different behavior in production.

**Solutions**:
1. Check environment variables are set
2. Verify KV namespaces exist
3. Check secrets are configured:
```bash
wrangler secret list
```

4. View logs:
```bash
wrangler tail
```

## Debugging Tips

### View real-time logs

```bash
# Tail logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST
```

### Add debug logging

```typescript
export default {
  async fetch(request: Request, env: Env) {
    console.log('Request:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
    });
    
    try {
      const response = await handleRequest(request, env);
      console.log('Response:', response.status);
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}
```

### Test specific methods

```bash
# Test initialize
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'

# Test tools/list
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}'
```

## Getting Help

If you're still stuck:

1. **Check the logs**: `wrangler tail`
2. **Read the docs**: Check [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
3. **Search issues**: Look for similar problems on GitHub
4. **Ask for help**: 
   - Cloudflare Workers Discord
   - Stack Overflow (tag: cloudflare-workers)
   - GitHub Issues

## Quick Checklist

Before asking for help, verify:

- [ ] Dependencies installed: `npm install`
- [ ] `.env` file configured correctly
- [ ] API token has correct permissions
- [ ] Account ID is correct
- [ ] Worker name is unique
- [ ] KV namespaces created (if needed)
- [ ] Secrets set (if needed): `wrangler secret list`
- [ ] Local server works: `npm run dev`
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test`
- [ ] Checked logs: `wrangler tail`
