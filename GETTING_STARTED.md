# Getting Started Checklist

Use this checklist to set up and deploy your first MCP server on Cloudflare.

## Prerequisites

- [ ] Node.js installed (v16 or later)
- [ ] npm installed
- [ ] Cloudflare account created (free tier is fine)
- [ ] Terminal/command line access

## Step 1: Get Cloudflare Credentials

### Get Your Account ID
- [ ] Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
- [ ] Navigate to "Workers & Pages"
- [ ] Copy your Account ID from the right sidebar
- [ ] Save it somewhere safe

### Create API Token
- [ ] Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [ ] Click "Create Token"
- [ ] Select "Edit Cloudflare Workers" template
- [ ] Configure permissions (Account → Workers Scripts → Edit)
- [ ] Click "Continue to summary"
- [ ] Click "Create Token"
- [ ] **IMPORTANT**: Copy and save your token (you won't see it again!)

## Step 2: Set Up Project

### Clone or Download Repository
- [ ] Clone the repository or download the files
- [ ] Navigate to project directory in terminal

### Install Dependencies
```bash
- [ ] npm install
```

### Configure Environment
Option A: Interactive Setup (Recommended)
```bash
- [ ] npm run setup
```
Follow the prompts to enter:
- Cloudflare API Token
- Cloudflare Account ID
- MCP Server Name
- API Key (optional)

Option B: Manual Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Edit `.env` with your credentials
- [ ] Update `wrangler.toml` with your server name

## Step 3: Test Locally

### Start Development Server
```bash
- [ ] npm run dev
```

### Test in Browser
- [ ] Open http://localhost:8787 in browser
- [ ] You should see server info JSON

### Test MCP Protocol
In another terminal:
```bash
- [ ] curl http://localhost:8787
- [ ] curl -X POST http://localhost:8787 \
      -H "Content-Type: application/json" \
      -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

### Run Test Suite
```bash
- [ ] npm run test
```
All tests should pass.

## Step 4: Deploy to Cloudflare

### Build TypeScript
```bash
- [ ] npm run build
```
Check for any build errors.

### Deploy to Production
```bash
- [ ] npm run deploy
```

### Verify Deployment
- [ ] Check output for worker URL
- [ ] Note: URL format is `https://your-worker-name.your-account.workers.dev`
- [ ] Copy the URL

### Test Deployed Server
```bash
- [ ] curl https://your-worker-name.your-account.workers.dev
- [ ] npm run test https://your-worker-name.your-account.workers.dev
```

## Step 5: Verify in Dashboard

### Check Cloudflare Dashboard
- [ ] Go to Cloudflare Dashboard → Workers & Pages
- [ ] Find your worker in the list
- [ ] Click on it to view details
- [ ] Check metrics (requests, errors, CPU time)

### View Logs (Optional)
```bash
- [ ] wrangler tail
```
Make some requests and watch logs appear.

## Step 6: Customize (Optional)

### Choose Your Starting Point
- [ ] Use `src/index.ts` (full-featured)
- [ ] Or copy from `examples/minimal-server.ts` (simple)
- [ ] Or copy from `examples/kv-storage-server.ts` (with storage)
- [ ] Or copy from `examples/api-integration-server.ts` (with APIs)
- [ ] Or copy from `examples/advanced-server.ts` (production-ready)

### Add Your Tools
- [ ] Edit tool definitions in `tools/list` method
- [ ] Implement tool logic in `callTool` function
- [ ] Test locally with `npm run dev`

### Add Your Resources
- [ ] Edit resource definitions in `resources/list` method
- [ ] Implement resource logic in `readResource` function
- [ ] Test locally

### Redeploy
```bash
- [ ] npm run update
```

## Step 7: Production Checklist

### Security
- [ ] Set up authentication (API key or bearer token)
- [ ] Enable rate limiting if needed
- [ ] Never commit secrets to git
- [ ] Use `wrangler secret put` for sensitive data

### Performance
- [ ] Enable caching for read-only operations
- [ ] Minimize external API calls
- [ ] Use KV for frequently accessed data
- [ ] Test response times

### Monitoring
- [ ] Set up log monitoring
- [ ] Check error rates in dashboard
- [ ] Monitor CPU time usage
- [ ] Set up alerts (optional)

### Documentation
- [ ] Document your tools and their parameters
- [ ] Document any authentication requirements
- [ ] Document rate limits if any
- [ ] Update README with your specifics

## Troubleshooting Checklist

If something doesn't work, check:

- [ ] Node.js version is 16 or later: `node --version`
- [ ] Dependencies are installed: `npm install`
- [ ] `.env` file exists and has correct values
- [ ] Cloudflare API token is valid: `wrangler whoami`
- [ ] Account ID is correct
- [ ] Worker name is unique (not taken by another worker)
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Wrangler is logged in: `wrangler login`

## Common Issues

### "Command not found: wrangler"
```bash
- [ ] npm install
- [ ] Use: npx wrangler instead
```

### "Worker name already exists"
```bash
- [ ] Change name in wrangler.toml
- [ ] Or use different account
```

### "Authentication error"
```bash
- [ ] Regenerate API token
- [ ] Update .env file
- [ ] Run: wrangler logout && wrangler login
```

### "Build fails"
```bash
- [ ] Check TypeScript syntax
- [ ] Run: npm run build for details
- [ ] Check tsconfig.json is present
```

## Next Steps

After successful deployment:

- [ ] Read [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for advanced features
- [ ] Check [KNOWLEDGE_BASE.md](./docs/KNOWLEDGE_BASE.md) for in-depth info
- [ ] Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common tasks
- [ ] Explore other examples in `examples/` directory
- [ ] Set up custom domain (optional)
- [ ] Configure KV storage (if needed)
- [ ] Set up CI/CD (optional)

## Success Criteria

You're successfully deployed when:

✅ Local server runs without errors
✅ All tests pass locally
✅ Build completes successfully
✅ Deploy completes without errors
✅ Worker appears in Cloudflare Dashboard
✅ Worker URL responds to requests
✅ MCP protocol methods work correctly
✅ Logs appear in `wrangler tail`

## Support

If you need help:

1. Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
2. Review documentation in `docs/` folder
3. Check Cloudflare Workers docs
4. Open an issue on GitHub
5. Ask in Cloudflare community forums

---

**Congratulations!** 🎉 Once you complete this checklist, you'll have a working MCP server running on Cloudflare's global network!
