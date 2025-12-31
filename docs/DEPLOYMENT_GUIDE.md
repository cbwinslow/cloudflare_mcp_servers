# Deployment Guide: MCP Servers on Cloudflare

This guide walks you through deploying Model Context Protocol (MCP) servers on Cloudflare Workers from start to finish.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or later) installed
2. **npm** (comes with Node.js)
3. **Cloudflare Account** (free tier works)
4. **Cloudflare API Token** with Workers permissions

## Quick Start (5 Minutes)

### Step 1: Clone or Setup Repository

```bash
# If using this repository
git clone <repository-url>
cd cloudflare_mcp_servers

# Install dependencies
npm install
```

### Step 2: Configure Credentials

```bash
# Run interactive setup
npm run setup
```

You'll be prompted for:
- Cloudflare API Token
- Cloudflare Account ID
- MCP Server Name

Alternatively, manually create `.env`:

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Step 3: Test Locally

```bash
# Start local development server
npm run dev
```

Visit `http://localhost:8787` to see your MCP server running locally.

### Step 4: Deploy to Cloudflare

```bash
# Deploy to production
npm run deploy
```

Your MCP server is now live! 🎉

## Detailed Setup Guide

### Getting Your Cloudflare Credentials

#### 1. Get Your Account ID

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to "Workers & Pages"
3. Your Account ID is displayed on the right side

#### 2. Create an API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Configure:
   - **Permissions**: 
     - Account → Workers Scripts → Edit
     - Account → Workers KV Storage → Edit (if using KV)
   - **Account Resources**: Include your account
   - **TTL**: Set expiration or leave as default
5. Click "Continue to summary" → "Create Token"
6. **SAVE YOUR TOKEN** - You won't see it again!

### Project Configuration

#### wrangler.toml

The main configuration file for your Worker:

```toml
name = "my-mcp-server"           # Your worker name
main = "src/index.ts"             # Entry point
compatibility_date = "2024-01-01" # Compatibility date

# Optional: KV Namespaces
[[kv_namespaces]]
binding = "MCP_STATE"             # Variable name in code
id = "your-kv-namespace-id"       # KV namespace ID

# Environment Variables (non-sensitive)
[vars]
MCP_SERVER_NAME = "My MCP Server"
ENVIRONMENT = "production"
```

#### Creating KV Namespaces (Optional)

If your MCP server needs persistent storage:

```bash
# Create production KV namespace
wrangler kv:namespace create MCP_STATE

# Create preview KV namespace (for testing)
wrangler kv:namespace create MCP_STATE --preview

# This outputs IDs to add to wrangler.toml
```

Add the IDs to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MCP_STATE"
id = "abcd1234..."              # From create command
preview_id = "efgh5678..."      # From create --preview command
```

#### Setting Secrets

For sensitive data (API keys, tokens):

```bash
# Set a secret
wrangler secret put MCP_API_KEY

# You'll be prompted to enter the value
# Secrets are encrypted and never visible in code

# List all secrets
wrangler secret list

# Delete a secret
wrangler secret delete MCP_API_KEY
```

Access secrets in code:

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const apiKey = env.MCP_API_KEY; // Access secret
    // ...
  }
}
```

## Deployment Methods

### Method 1: Using npm Scripts (Recommended)

```bash
# Full deployment (build + deploy + info)
npm run deploy

# Just deploy (skip build)
npm run deploy:worker

# Update existing deployment
npm run update
```

### Method 2: Using Wrangler CLI Directly

```bash
# Deploy to production
wrangler deploy

# Deploy to specific environment
wrangler deploy --env staging

# Deploy with name override
wrangler deploy --name my-custom-name

# Dry run (see what would be deployed)
wrangler deploy --dry-run
```

### Method 3: CI/CD Pipeline

For automated deployments, use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Multiple Environments

### Configure Environments

Add to `wrangler.toml`:

```toml
# Production (default)
name = "mcp-server"
vars = { ENVIRONMENT = "production" }

# Staging environment
[env.staging]
name = "mcp-server-staging"
vars = { ENVIRONMENT = "staging" }

# Development environment
[env.development]
name = "mcp-server-dev"
vars = { ENVIRONMENT = "development" }
```

### Deploy to Specific Environment

```bash
# Deploy to staging
wrangler deploy --env staging

# Deploy to development
wrangler deploy --env development
```

## Custom Domains

### Add a Custom Route

1. In Cloudflare Dashboard:
   - Go to "Workers & Pages"
   - Select your worker
   - Click "Settings" → "Triggers"
   - Add a route: `api.yourdomain.com/*`

2. Or via `wrangler.toml`:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Using Workers.dev Subdomain

By default, workers are available at:
```
https://your-worker-name.your-subdomain.workers.dev
```

To set a custom subdomain:
1. Go to Workers & Pages → Settings
2. Find "workers.dev" section
3. Set your preferred subdomain

## Monitoring and Logs

### View Logs in Real-Time

```bash
# Tail logs
wrangler tail

# Filter logs
wrangler tail --status error
wrangler tail --method POST

# Show all details
wrangler tail --format pretty
```

### Cloudflare Dashboard

1. Go to "Workers & Pages"
2. Select your worker
3. View:
   - **Metrics**: Requests, errors, CPU time
   - **Logs**: Recent invocations
   - **Settings**: Configuration

### Log from Your Worker

```typescript
export default {
  async fetch(request: Request, env: Env) {
    console.log('Request received:', request.url);
    console.error('Error occurred:', error);
    
    // Logs appear in `wrangler tail` and dashboard
  }
}
```

## Testing Your Deployment

### Test with curl

```bash
# Test GET endpoint
curl https://your-worker.workers.dev

# Test MCP initialize
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
  }'

# Test tool listing
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }'
```

### Test with Node.js Script

```bash
# Test deployed server
node scripts/test.js https://your-worker.workers.dev
```

### Test with MCP Client

Use an MCP client library to test:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'test-client',
  version: '1.0.0'
});

// Connect to your MCP server
await client.connect({
  url: 'https://your-worker.workers.dev'
});

// List tools
const tools = await client.listTools();
console.log('Available tools:', tools);
```

## Troubleshooting

### "Could not find zone"

**Problem**: Wrangler can't find your zone for custom routes.

**Solution**:
- Ensure domain is added to Cloudflare
- Use zone_id instead of zone_name in routes
- Check API token has DNS permissions

### "Cannot read properties of undefined"

**Problem**: Missing environment binding.

**Solution**:
- Check `wrangler.toml` for correct bindings
- Ensure KV namespaces are created
- Verify secret names match code

### "Worker exceeded size limit"

**Problem**: Bundled worker is too large.

**Solution**:
- Remove unused dependencies
- Use dynamic imports for large libraries
- Enable minification in build

### "Authentication error"

**Problem**: Invalid API token.

**Solution**:
- Regenerate API token
- Ensure token has correct permissions
- Check token hasn't expired

## Performance Optimization

### Reduce Cold Starts

1. **Minimize dependencies**:
   ```bash
   npm install --production
   ```

2. **Use static imports**:
   ```typescript
   // Good
   import { tool } from './tools';
   
   // Avoid dynamic imports for critical paths
   ```

3. **Keep worker small**: Under 1MB uncompressed

### Caching Strategies

```typescript
// Cache responses at the edge
export default {
  async fetch(request: Request, env: Env) {
    const cache = caches.default;
    let response = await cache.match(request);
    
    if (!response) {
      response = await handleRequest(request, env);
      // Cache for 1 hour
      response.headers.set('Cache-Control', 'max-age=3600');
      await cache.put(request, response.clone());
    }
    
    return response;
  }
}
```

## Rollback and Version Management

### Rollback to Previous Version

```bash
# View deployment history
wrangler deployments list

# Rollback to specific deployment
wrangler rollback [deployment-id]
```

### Version Tagging

Use git tags for version tracking:

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# Deploy specific version
git checkout v1.0.0
npm run deploy
```

## Cost Considerations

### Cloudflare Workers Pricing

**Free Tier**:
- 100,000 requests/day
- 10ms CPU time per request
- Unlimited bandwidth

**Paid Plan ($5/month)**:
- 10 million requests/month included
- $0.50 per additional million
- 50ms CPU time per request

### Cost Optimization Tips

1. Use edge caching to reduce compute
2. Minimize external API calls
3. Use KV efficiently (reads are cheaper than writes)
4. Implement request batching where possible

## Next Steps

- ✅ Deploy your first MCP server
- 📖 Read the [Knowledge Base](./KNOWLEDGE_BASE.md)
- 🔧 Customize your server in `src/index.ts`
- 🚀 Add more tools and capabilities
- 📊 Monitor performance in dashboard
- 🔐 Set up proper authentication
- 🌐 Add custom domain

## Support and Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [MCP Specification](https://modelcontextprotocol.io)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Community Discord](https://discord.gg/cloudflaredev)
