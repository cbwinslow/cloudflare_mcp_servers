#!/usr/bin/env node

/**
 * Setup script for Cloudflare MCP Servers
 * 
 * This script helps set up your development environment for MCP servers
 * on Cloudflare Workers.
 * 
 * Usage: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🔧 Cloudflare MCP Server Setup\n');
  console.log('This script will help you configure your MCP server deployment.\n');

  // Check if .env exists
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n✅ Keeping existing .env file');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Please provide the following information:\n');

  // Get Cloudflare credentials
  const apiToken = await question('Cloudflare API Token: ');
  const accountId = await question('Cloudflare Account ID: ');
  const serverName = await question('MCP Server Name (default: mcp-server): ');
  const mcpApiKey = await question('MCP API Key (optional, for authentication): ');

  // Create .env file
  const envContent = `# Cloudflare API Configuration
CLOUDFLARE_API_TOKEN=${apiToken}
CLOUDFLARE_ACCOUNT_ID=${accountId}

# MCP Server Configuration
MCP_SERVER_NAME=${serverName || 'mcp-server'}
${mcpApiKey ? `MCP_API_KEY=${mcpApiKey}` : '# MCP_API_KEY=your_mcp_api_key_here'}

# Optional: KV Namespace IDs
# KV_NAMESPACE_ID=your_kv_namespace_id

# Optional: Durable Object IDs
# DURABLE_OBJECT_ID=your_durable_object_id
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Created .env file');

  // Update wrangler.toml with server name
  if (serverName) {
    const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
    let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    wranglerContent = wranglerContent.replace(/name = "[^"]*"/, `name = "${serverName}"`);
    fs.writeFileSync(wranglerPath, wranglerContent);
    console.log('✅ Updated wrangler.toml');
  }

  console.log('\n📦 Installing dependencies...\n');
  const { execSync } = require('child_process');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✅ Dependencies installed');
  } catch (error) {
    console.error('\n❌ Failed to install dependencies:', error.message);
  }

  console.log('\n🎉 Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Review and customize src/index.ts');
  console.log('  2. Test locally with: npm run dev');
  console.log('  3. Deploy to Cloudflare with: npm run deploy\n');

  rl.close();
}

setup().catch(error => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});
