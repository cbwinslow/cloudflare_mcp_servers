# Complete MCP Server Deployment Guide

## 🎯 Overview

This repository now contains **comprehensive MCP server implementations** for multiple data sources, AI frameworks, and development tools, all deployable to Cloudflare Workers.

### What's Included

✅ **8+ Production-Ready MCP Servers**
✅ **Agent-Zero Autonomous Agent Framework**
✅ **Unified Deployment System**
✅ **Complete Documentation & Configuration**

## 🚀 Quick Start

### 1. Install & Configure

```bash
# Clone and install
git clone <repository-url>
cd cloudflare_mcp_servers
npm install

# Configure API keys
cp .env.example .env
# Edit .env with your API keys
```

### 2. Deploy All Servers

```bash
npm run deploy:all
```

### 3. Deploy Specific Servers

```bash
npm run deploy:server govinfo congress langchain
```

## 📦 Available Servers

### Government Data Servers

#### 1. **GovInfo Server** (`govinfo-server.ts`)
Access U.S. Government documents and publications
- Congressional bills and resolutions
- Federal regulations (CFR)
- Congressional Record
- Court opinions and presidential documents

**Tools**:
- `search_bills` - Search congressional legislation
- `get_bill_details` - Get detailed bill information
- `search_regulations` - Search CFR
- `get_congressional_record` - Access Congressional Record
- `search_documents` - Search all government documents

**Deploy**: `npm run deploy:server govinfo`

#### 2. **Congress Server** (`congress-server.ts`)
Congressional legislation and member data
- Detailed bill information
- Member profiles and committees
- Roll call votes
- Nominations and treaties

**Tools**:
- `search_legislation` - Search bills and resolutions
- `get_bill` - Get specific bill details
- `get_bill_actions` - Get bill action history
- `get_members` - List Congressional members
- `get_member_details` - Get member profile
- `get_committees` - List committees
- `get_nominations` - Presidential nominations
- `get_roll_call_votes` - Vote results

**Deploy**: `npm run deploy:server congress`

#### 3. **OpenStates Server** (`openstates-server.ts`)
State legislature data (all 50 states + DC & PR)
- State bills and resolutions
- State legislators
- Legislative committees and sessions

**Tools**:
- `search_bills` - Search state legislation
- `get_bill` - Get state bill details
- `get_legislators` - List state legislators
- `get_legislator` - Get legislator profile
- `get_jurisdictions` - List available states
- `get_sessions` - Legislative sessions
- `get_bill_votes` - Bill vote results

**Deploy**: `npm run deploy:server openstates`

### AI/LLM Framework Servers

#### 4. **LangChain Server** (`langchain-server.ts`)
Chain execution and agent orchestration
- Execute various chain types
- Agent creation and execution
- Text processing and embeddings
- Similarity search

**Tools**:
- `execute_chain` - Run LangChain chains
- `create_agent` - Create and execute agents
- `split_text` - Split documents into chunks
- `embed_text` - Generate embeddings
- `similarity_search` - Find similar documents

**Deploy**: `npm run deploy:server langchain`

#### 5. **LangFuse Server** (`langfuse-server.ts`)
LLM observability and tracing
- Trace management
- Metrics and analytics
- Performance monitoring
- Cost tracking

**Tools**:
- `create_trace` - Create execution trace
- `get_traces` - List traces with filters
- `get_trace` - Get specific trace details
- `get_metrics` - Analytics and metrics
- `get_observations` - Span details
- `get_scores` - Evaluation scores

**Deploy**: `npm run deploy:server langfuse`

### Infrastructure & Platform Servers

#### 6. **Cloudflare Server** (`cloudflare-server.ts`)
Manage Cloudflare Workers and resources
- Workers deployment and management
- KV storage operations
- R2 object storage
- Analytics and monitoring

**Tools**:
- `list_workers` - List all Workers
- `get_worker` - Get Worker details
- `deploy_worker` - Deploy new Worker
- `kv_list_namespaces` - List KV namespaces
- `kv_get/put/delete` - KV operations
- `r2_list_buckets` - List R2 buckets
- `r2_create_bucket` - Create R2 bucket
- `get_analytics` - Worker analytics

**Deploy**: `npm run deploy:server cloudflare`

### Development Tool Servers

#### 7. **Postman Server** (`postman-server.ts`)
API testing and collection management
- Collection management
- Environment management
- Mock servers
- API monitoring

**Tools**:
- `get_collections` - List collections
- `get_collection` - Get collection details
- `create_collection` - Create new collection
- `run_collection` - Execute collection
- `get_environments` - List environments
- `get_workspaces` - List workspaces
- `get_mocks` - List mock servers
- `get_monitors` - List monitors

**Deploy**: `npm run deploy:server postman`

#### 8. **VSCode Server** (`vscode-server.ts`)
Editor integration and workspace management
- Extension management
- Workspace configuration
- Settings and preferences
- Debug configuration

**Tools**:
- `get_extensions` - List installed extensions
- `search_extensions` - Search marketplace
- `get_workspace_config` - Get settings
- `create_workspace_settings` - Create settings
- `create_launch_config` - Debug config
- `create_tasks_config` - Tasks config
- `get_recommended_extensions` - Get recommendations

**Deploy**: `npm run deploy:server vscode`

### AI Model Servers

#### 9. **Gemini Server** (`gemini-server.ts`)
Google Gemini AI model integration
- Text generation
- Vision (multi-modal)
- Code generation
- Function calling
- Chat conversations

**Tools**:
- `generate_text` - Generate text
- `generate_with_vision` - Image analysis
- `generate_code` - Code generation
- `chat` - Multi-turn conversation
- `function_call` - Function calling

**Deploy**: `npm run deploy:server gemini`

### Autonomous Agent Framework

#### 10. **Agent-Zero** (`agent-zero-server.ts`)
🤖 Autonomous agent with reasoning, planning, and execution
- Task decomposition
- Multi-step reasoning
- Tool orchestration
- Memory management
- Self-improvement

**Tools**:
- `execute_task` - Execute autonomous task
- `get_task_status` - Check task status
- `add_memory` - Store information
- `query_memory` - Search memory
- `get_capabilities` - List capabilities
- `reflect` - Self-reflection
- `plan_task` - Decompose task into steps

**Special Features**:
- Uses KV for persistent memory
- Can access all other MCP servers
- Self-improving through reflection
- Multi-step reasoning and planning

**Deploy**: `npm run deploy:server agent-zero`

## 📚 Documentation

### Core Documentation Files

- **[agents.md](./agents.md)** - Complete agent catalog with configurations
- **[tools.md](./tools.md)** - Tool reference for all servers
- **[mcp-config.json](./mcp-config.json)** - Server configuration
- **[MULTI_SERVER_DEPLOYMENT.md](./MULTI_SERVER_DEPLOYMENT.md)** - Deployment guide

### Existing Documentation

- **[README.md](./README.md)** - Main project documentation
- **[DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** - Detailed deployment
- **[KNOWLEDGE_BASE.md](./docs/KNOWLEDGE_BASE.md)** - MCP and Cloudflare context
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick command reference

## 🔧 Configuration

### API Keys Required

Create a `.env` file with these keys:

```env
# Cloudflare (Required)
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Government Data
GOVINFO_API_KEY=your_key
CONGRESS_API_KEY=your_key
OPENSTATES_API_KEY=your_key

# AI/LLM Frameworks
OPENAI_API_KEY=your_key
LANGFUSE_PUBLIC_KEY=your_key
LANGFUSE_SECRET_KEY=your_key

# AI Models
GEMINI_API_KEY=your_key

# Development Tools
POSTMAN_API_KEY=your_key

# Agent-Zero KV Namespaces
AGENT_ZERO_STATE_KV_ID=your_kv_id
AGENT_ZERO_MEMORY_KV_ID=your_kv_id
```

### Where to Get API Keys

| Service | URL | Notes |
|---------|-----|-------|
| GovInfo | https://api.data.gov/signup/ | Free, instant |
| Congress.gov | https://api.congress.gov/sign-up/ | Free, email verification |
| OpenStates | https://openstates.org/accounts/profile/ | Free, registration required |
| OpenAI | https://platform.openai.com/api-keys | Paid, credit card required |
| LangFuse | https://cloud.langfuse.com | Free tier available |
| Gemini | https://makersuite.google.com/app/apikey | Free tier available |
| Postman | https://web.postman.co/settings/me/api-keys | Free tier available |
| Cloudflare | https://dash.cloudflare.com/profile/api-tokens | Free tier available |

## 🎮 Usage Examples

### Using Individual Servers

```bash
# Search for climate bills
curl -X POST https://mcp-govinfo.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_bills",
      "arguments": {
        "query": "climate change",
        "congress": "118"
      }
    },
    "id": 1
  }'

# Execute LangChain
curl -X POST https://mcp-langchain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_chain",
      "arguments": {
        "chainType": "conversational",
        "input": "Explain quantum computing"
      }
    },
    "id": 1
  }'
```

### Using Agent-Zero

Agent-Zero can orchestrate multiple servers:

```bash
curl -X POST https://mcp-agent-zero.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_task",
      "arguments": {
        "task": "Research recent infrastructure legislation and summarize findings",
        "tools": ["govinfo", "congress", "langchain"],
        "maxSteps": 10
      }
    },
    "id": 1
  }'
```

## 🔄 Deployment Workflows

### Deploy Everything
```bash
npm run deploy:all
```

### Deploy by Category
```bash
# Government data
npm run deploy:server govinfo congress openstates

# AI frameworks
npm run deploy:server langchain langfuse

# Infrastructure
npm run deploy:server cloudflare agent-zero

# Development tools
npm run deploy:server postman vscode

# AI models
npm run deploy:server gemini
```

### Update Deployments
```bash
npm run update
```

## 🧪 Testing

### Test Individual Server
```bash
# Test GovInfo server
curl https://mcp-govinfo.workers.dev

# Test with actual tool call
npm run test
```

### Monitor Deployments
```bash
# Tail logs
wrangler tail mcp-govinfo

# View analytics
wrangler deployments list
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│            Agent-Zero (Orchestrator)            │
│  - Task Planning & Decomposition                │
│  - Multi-step Reasoning                         │
│  - Memory Management (KV)                       │
└─────────────┬───────────────────────────────────┘
              │
    ┌─────────┴─────────┬────────────┬──────────┐
    │                   │            │          │
┌───▼────┐     ┌───────▼──────┐  ┌──▼───┐  ┌───▼────┐
│ GovData│     │ AI Frameworks│  │Infra │  │DevTools│
└───┬────┘     └───────┬──────┘  └──┬───┘  └───┬────┘
    │                  │             │          │
    ├─ GovInfo         ├─ LangChain  ├─ CF     ├─ Postman
    ├─ Congress        └─ LangFuse   └─ ...    └─ VSCode
    └─ OpenStates                               └─ ...
```

## 💰 Cost Estimation

**Free Tier (Cloudflare Workers)**:
- 100,000 requests/day per Worker
- Unlimited Workers
- 10GB KV reads/month free

**Typical Monthly Cost**:
- Workers: $0 (within free tier)
- KV Storage: ~$0.50
- **Total: < $1/month** for moderate usage

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](./LICENSE)

## 🆘 Support

- **Documentation**: Check `docs/` directory
- **Agent Reference**: See `agents.md`
- **Tool Catalog**: See `tools.md`
- **Deployment Guide**: See `MULTI_SERVER_DEPLOYMENT.md`
- **Issues**: Open GitHub issue

## 🎯 Next Steps

1. ✅ Configure API keys in `.env`
2. ✅ Create Agent-Zero KV namespaces
3. ✅ Deploy servers: `npm run deploy:all`
4. ✅ Test deployments
5. ✅ Configure Agent-Zero with your servers
6. ✅ Start building with MCP!

---

**Built with ❤️ for the MCP and Cloudflare communities**

🚀 **Ready to deploy? Run `npm run deploy:all` now!**
