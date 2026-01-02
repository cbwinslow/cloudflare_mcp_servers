# Multi-Server Deployment Guide

This guide covers deploying all MCP servers to Cloudflare Workers.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required for Cloudflare
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Government Data (get from respective sites)
GOVINFO_API_KEY=your_key
CONGRESS_API_KEY=your_key
OPENSTATES_API_KEY=your_key

# AI/LLM Frameworks
OPENAI_API_KEY=your_key
LANGFUSE_PUBLIC_KEY=your_key
LANGFUSE_SECRET_KEY=your_key

# AI Models
GEMINI_API_KEY=your_key

# Agent-Zero KV Namespaces (create first, see below)
AGENT_ZERO_STATE_KV_ID=your_kv_id
AGENT_ZERO_MEMORY_KV_ID=your_kv_id
```

### 3. Create KV Namespaces for Agent-Zero

```bash
# Create state namespace
wrangler kv:namespace create AGENT_ZERO_STATE

# Create memory namespace
wrangler kv:namespace create AGENT_ZERO_MEMORY

# Copy the IDs to your .env file
```

### 4. Deploy All Servers

```bash
# Deploy all servers at once
npm run deploy:all

# Or deploy specific servers
npm run deploy:server govinfo congress
```

## Available Servers

### Government Data Servers

#### GovInfo Server
- **Purpose**: U.S. Government documents and publications
- **Deploy**: `npm run deploy:server govinfo`
- **API Key**: Get from https://api.data.gov/signup/
- **URL**: `https://mcp-govinfo.workers.dev`

#### Congress Server
- **Purpose**: Congressional legislation and member data
- **Deploy**: `npm run deploy:server congress`
- **API Key**: Get from https://api.congress.gov/sign-up/
- **URL**: `https://mcp-congress.workers.dev`

#### OpenStates Server
- **Purpose**: State legislature data (all 50 states)
- **Deploy**: `npm run deploy:server openstates`
- **API Key**: Get from https://openstates.org/accounts/profile/
- **URL**: `https://mcp-openstates.workers.dev`

### AI/LLM Framework Servers

#### LangChain Server
- **Purpose**: Chain execution and agent orchestration
- **Deploy**: `npm run deploy:server langchain`
- **API Key**: OpenAI API key required
- **URL**: `https://mcp-langchain.workers.dev`

#### LangFuse Server
- **Purpose**: LLM observability and tracing
- **Deploy**: `npm run deploy:server langfuse`
- **API Keys**: Get from https://cloud.langfuse.com
- **URL**: `https://mcp-langfuse.workers.dev`

### Infrastructure Servers

#### Cloudflare Server
- **Purpose**: Manage Cloudflare Workers and resources
- **Deploy**: `npm run deploy:server cloudflare`
- **API Key**: Cloudflare API token (already configured)
- **URL**: `https://mcp-cloudflare.workers.dev`

### AI Model Servers

#### Gemini Server
- **Purpose**: Google Gemini AI model integration
- **Deploy**: `npm run deploy:server gemini`
- **API Key**: Get from https://makersuite.google.com/app/apikey
- **URL**: `https://mcp-gemini.workers.dev`

### Agent Framework

#### Agent-Zero Server
- **Purpose**: Autonomous agent with reasoning and planning
- **Deploy**: `npm run deploy:server agent-zero`
- **Requirements**: 
  - OpenAI API key
  - Two KV namespaces (created above)
- **URL**: `https://mcp-agent-zero.workers.dev`

## Getting API Keys

### GovInfo.gov
1. Visit https://api.data.gov/signup/
2. Register for an API key
3. Add to `.env` as `GOVINFO_API_KEY`

### Congress.gov
1. Visit https://api.congress.gov/sign-up/
2. Request API key
3. Add to `.env` as `CONGRESS_API_KEY`

### OpenStates
1. Visit https://openstates.org/accounts/profile/
2. Create account and generate API key
3. Add to `.env` as `OPENSTATES_API_KEY`

### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create API key
3. Add to `.env` as `OPENAI_API_KEY`

### LangFuse
1. Visit https://cloud.langfuse.com
2. Create account and project
3. Go to Settings → API Keys
4. Add both public and secret keys to `.env`

### Google Gemini
1. Visit https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env` as `GEMINI_API_KEY`

### Cloudflare
1. Log into https://dash.cloudflare.com
2. Go to "My Profile" → "API Tokens"
3. Create token with "Edit Cloudflare Workers" permissions
4. Add to `.env` as `CLOUDFLARE_API_TOKEN`
5. Copy Account ID from Workers dashboard to `CLOUDFLARE_ACCOUNT_ID`

## Deployment Commands

### Deploy All Servers
```bash
npm run deploy:all
```

### Deploy Specific Servers
```bash
# Single server
npm run deploy:server govinfo

# Multiple servers
npm run deploy:server govinfo congress openstates

# AI servers
npm run deploy:server langchain langfuse gemini

# Infrastructure
npm run deploy:server cloudflare agent-zero
```

### Test Servers
```bash
# Test all deployed servers
npm run test

# Test specific server
curl https://mcp-govinfo.workers.dev
```

## Configuration

### MCP Config File
The `mcp-config.json` file contains all server configurations:

```json
{
  "mcpServers": {
    "govinfo": {
      "name": "GovInfo.gov MCP Server",
      "deployment": {
        "workerName": "mcp-govinfo",
        "scriptPath": "src/servers/govinfo-server.ts"
      },
      "capabilities": ["bills", "regulations", "documents"]
    }
  }
}
```

### Environment Variables
Each server uses specific environment variables defined in `mcp-config.json`:

```json
"env": {
  "GOVINFO_API_KEY": "${GOVINFO_API_KEY}",
  "MCP_SERVER_NAME": "GovInfo MCP Server"
}
```

## Using Agent-Zero

Agent-Zero is the orchestrator that can use all other MCP servers:

### Execute a Task
```bash
curl -X POST https://mcp-agent-zero.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_task",
      "arguments": {
        "task": "Search for climate change legislation",
        "tools": ["govinfo", "congress"]
      }
    },
    "id": 1
  }'
```

### Query Memory
```bash
curl -X POST https://mcp-agent-zero.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "query_memory",
      "arguments": {
        "query": "legislation"
      }
    },
    "id": 1
  }'
```

## MCP Server Access

### From Code

```javascript
// Access GovInfo server
const response = await fetch('https://mcp-govinfo.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'search_bills',
      arguments: {
        query: 'infrastructure',
        congress: '118'
      }
    },
    id: 1
  })
});

const data = await response.json();
```

### From Agent-Zero

Agent-Zero can automatically access other MCP servers:

```json
{
  "task": "Research recent infrastructure bills",
  "tools": ["govinfo", "congress"],
  "maxSteps": 10
}
```

## Monitoring

### View Logs
```bash
# Tail logs for a specific worker
wrangler tail mcp-govinfo

# Tail logs for Agent-Zero
wrangler tail mcp-agent-zero
```

### Check Deployment Status
```bash
# List all deployments
wrangler deployments list

# Get specific deployment info
wrangler deployment view <deployment-id>
```

### Analytics
Visit Cloudflare Dashboard → Workers & Pages → Select your worker → Metrics

## Troubleshooting

### Server Not Deploying
1. Check API keys are set in `.env`
2. Verify Cloudflare credentials
3. Check wrangler is installed: `npm list wrangler`
4. Try deploying with verbose logs: `wrangler deploy --verbose`

### API Key Issues
1. Verify keys are valid and not expired
2. Check API quotas haven't been exceeded
3. Ensure keys have necessary permissions

### KV Namespace Errors
1. Verify KV namespaces exist: `wrangler kv:namespace list`
2. Check namespace IDs in `.env` match created namespaces
3. Ensure account has KV enabled

### CORS Issues
All servers are configured with CORS enabled. If you need to restrict origins:
1. Edit `mcp-config.json` → `security` → `cors`
2. Redeploy affected servers

## Advanced Configuration

### Custom Domains
Add custom domains in `wrangler.toml`:

```toml
routes = [
  { pattern = "govinfo.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Rate Limiting
Configure in `mcp-config.json`:

```json
"security": {
  "rateLimiting": {
    "enabled": true,
    "requestsPerMinute": 60
  }
}
```

### Multiple Environments
Create environment-specific configs:

```bash
# Production
npm run deploy:all -- --env production

# Staging
npm run deploy:all -- --env staging
```

## Cost Estimation

### Free Tier Limits
- 100,000 requests/day per Worker
- Unlimited Workers
- First 10GB KV reads free

### Estimated Costs
For typical usage (1M requests/month):
- Workers: Free (within limits)
- KV Storage: ~$0.50/month
- Total: < $1/month

## Support

- **Documentation**: See `docs/` directory
- **Agents**: See `agents.md`
- **Tools**: See `tools.md`
- **Issues**: Open GitHub issue
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/

## Next Steps

1. ✅ Deploy all servers
2. ✅ Test each server
3. ✅ Configure Agent-Zero
4. ✅ Add custom domains (optional)
5. ✅ Set up monitoring
6. ✅ Integrate with your application

---

**Ready to deploy? Run `npm run deploy:all` to get started!**
