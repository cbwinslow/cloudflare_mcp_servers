# Cloudflare MCP Servers

Deploy and manage Model Context Protocol (MCP) servers on Cloudflare Workers. This project provides everything you need to build, deploy, and maintain MCP servers on Cloudflare's global edge network.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd cloudflare_mcp_servers

# 2. Install dependencies
npm install

# 3. Configure your credentials
npm run setup

# 4. Test locally
npm run dev

# 5. Deploy to Cloudflare
npm run deploy
```

Your MCP server is now live on Cloudflare! 🎉

## 📋 What's Included

This repository provides:

- ✅ **Boilerplate MCP Server Code** - Ready-to-deploy MCP server implementations
- ✅ **Deployment Scripts** - Automated deployment using Cloudflare API
- ✅ **Multiple Examples** - Different server patterns and use cases
- ✅ **Comprehensive Documentation** - Step-by-step guides and API references
- ✅ **Testing Utilities** - Tools to test your MCP servers
- ✅ **Knowledge Base** - In-depth context for AI agents

## 📚 Documentation

### Core Guides
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Complete deployment walkthrough
- **[Knowledge Base](./docs/KNOWLEDGE_BASE.md)** - Comprehensive MCP and Cloudflare context
- **[Cloudflare API Reference](./docs/CLOUDFLARE_API_REFERENCE.md)** - API documentation and examples

### Quick Links
- [What is MCP?](#what-is-mcp)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Examples](#examples)
- [Configuration](#configuration)

## 🤔 What is MCP?

The **Model Context Protocol (MCP)** is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). MCP enables:

- **Tools**: Functions that AI assistants can invoke
- **Resources**: Structured data sources AI can access
- **Prompts**: Reusable prompt templates
- **Standardized Communication**: Consistent interface across different AI systems

Learn more at [modelcontextprotocol.io](https://modelcontextprotocol.io)

## 🏗️ Project Structure

```
cloudflare_mcp_servers/
├── src/
│   └── index.ts              # Main MCP server implementation
├── examples/
│   ├── minimal-server.ts     # Minimal MCP server
│   ├── kv-storage-server.ts  # MCP server with KV storage
│   └── api-integration-server.ts # MCP server with external APIs
├── scripts/
│   ├── deploy.js             # Automated deployment script
│   ├── setup.js              # Interactive setup wizard
│   ├── update.js             # Update existing deployments
│   └── test.js               # Test MCP servers
├── docs/
│   ├── DEPLOYMENT_GUIDE.md   # Deployment walkthrough
│   ├── KNOWLEDGE_BASE.md     # Comprehensive knowledge base
│   └── CLOUDFLARE_API_REFERENCE.md # Cloudflare API docs
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── wrangler.toml             # Cloudflare Workers config
└── .env.example              # Environment variables template
```

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start local development server
npm run build        # Build TypeScript code
```

### Deployment
```bash
npm run setup        # Interactive setup wizard
npm run deploy       # Deploy to Cloudflare (build + deploy + info)
npm run deploy:worker # Deploy using wrangler only
npm run update       # Update existing deployment
```

### Testing
```bash
npm run test         # Test your MCP server endpoints
```

## 📖 Examples

### 1. Basic MCP Server (`src/index.ts`)

Full-featured MCP server with:
- Tools (echo, get_time)
- Resources (server info)
- Prompts (greeting templates)
- CORS support
- Error handling

**Deploy**: Default server, ready to use!

### 2. Minimal Server (`examples/minimal-server.ts`)

Simplest possible MCP server:
- One tool (hello)
- Basic protocol support
- Perfect starting point

**Deploy**: Copy to `src/index.ts` and run `npm run deploy`

### 3. KV Storage Server (`examples/kv-storage-server.ts`)

MCP server with persistent storage:
- Store/retrieve/delete data
- Uses Cloudflare KV
- State management

**Setup**:
```bash
# Create KV namespace
wrangler kv:namespace create MCP_STATE

# Add ID to wrangler.toml
# Deploy
npm run deploy
```

### 4. API Integration Server (`examples/api-integration-server.ts`)

MCP server with external APIs:
- Fetch external data
- API integration patterns
- Real-world use cases

**Deploy**: Copy to `src/index.ts` and customize API calls

## ⚙️ Configuration

### Environment Variables

Create `.env` file (or run `npm run setup`):

```env
# Required
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Optional
MCP_SERVER_NAME=my-mcp-server
MCP_API_KEY=your_api_key
```

### Cloudflare Configuration

Edit `wrangler.toml`:

```toml
name = "mcp-server"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Add KV namespace (optional)
[[kv_namespaces]]
binding = "MCP_STATE"
id = "your-kv-namespace-id"

# Environment variables
[vars]
MCP_SERVER_NAME = "My MCP Server"
```

## 🔐 Getting Cloudflare Credentials

### 1. Account ID
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to "Workers & Pages"
3. Copy your Account ID from the right sidebar

### 2. API Token
1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Click "Continue to summary" → "Create Token"
5. **Save your token** (you won't see it again!)

## 🧪 Testing Your Server

### Local Testing

```bash
# Start dev server
npm run dev

# In another terminal, test it
curl http://localhost:8787

# Test MCP initialize
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

### Production Testing

```bash
# Test deployed server
node scripts/test.js https://your-worker.workers.dev
```

## 📊 Monitoring

View your worker's performance:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Workers & Pages"
3. Select your worker
4. View metrics, logs, and analytics

Or use the CLI:

```bash
# Tail logs in real-time
wrangler tail

# View deployment history
wrangler deployments list
```

## 🌍 Custom Domains

Add a custom domain to your MCP server:

1. In Cloudflare Dashboard → Workers & Pages
2. Select your worker → Settings → Triggers
3. Add a route: `api.yourdomain.com/*`

Or configure in `wrangler.toml`:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## 🔒 Security Best Practices

1. **Use Secrets**: Store sensitive data as Cloudflare secrets
   ```bash
   wrangler secret put API_KEY
   ```

2. **Validate Input**: Always validate tool inputs
   ```typescript
   if (!args?.message || typeof args.message !== 'string') {
     throw new Error('Invalid message parameter');
   }
   ```

3. **Implement Rate Limiting**: Prevent abuse
4. **Use Authentication**: Protect sensitive operations
5. **HTTPS Only**: Never use plain HTTP in production

## 💰 Pricing

### Cloudflare Workers

**Free Tier** (Perfect for getting started):
- 100,000 requests/day
- 10ms CPU time per request
- Unlimited bandwidth

**Paid Plan** ($5/month):
- 10 million requests/month included
- Additional requests: $0.50 per million
- 50ms CPU time per request

[View Full Pricing](https://developers.cloudflare.com/workers/platform/pricing/)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check the [docs](./docs/) folder
- **Issues**: Open an issue on GitHub
- **Cloudflare Docs**: [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers/)
- **MCP Docs**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

## 🎯 Next Steps

1. ✅ **Deploy your first server**: `npm run deploy`
2. 📖 **Read the guides**: Check out [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)
3. 🔧 **Customize your server**: Edit `src/index.ts`
4. 🚀 **Add more tools**: Implement custom functionality
5. 🌐 **Add custom domain**: Connect your domain
6. 📊 **Monitor performance**: Check Cloudflare Dashboard

---

**Built with ❤️ for the MCP and Cloudflare communities**