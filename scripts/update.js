#!/usr/bin/env node

/**
 * Update script for Cloudflare MCP Servers
 * 
 * This script updates an existing MCP server deployment on Cloudflare Workers.
 * 
 * Usage: node scripts/update.js [options]
 * 
 * Options:
 *   --name      Worker name (default: from wrangler.toml)
 *   --api-token Cloudflare API token (or set CLOUDFLARE_API_TOKEN env var)
 *   --account   Cloudflare account ID (or set CLOUDFLARE_ACCOUNT_ID env var)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  name: getArg('--name'),
  apiToken: getArg('--api-token') || process.env.CLOUDFLARE_API_TOKEN,
  accountId: getArg('--account') || process.env.CLOUDFLARE_ACCOUNT_ID,
};

function getArg(name) {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

async function update() {
  console.log('🔄 Updating MCP Server on Cloudflare...\n');

  // Validate required options
  if (!options.apiToken) {
    console.error('❌ Error: CLOUDFLARE_API_TOKEN is required');
    process.exit(1);
  }

  if (!options.accountId) {
    console.error('❌ Error: CLOUDFLARE_ACCOUNT_ID is required');
    process.exit(1);
  }

  // Read wrangler.toml to get worker name if not provided
  if (!options.name) {
    try {
      const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
      const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
      const nameMatch = wranglerContent.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) {
        options.name = nameMatch[1];
      }
    } catch (error) {
      console.error('❌ Error reading wrangler.toml:', error.message);
    }
  }

  if (!options.name) {
    console.error('❌ Error: Worker name is required');
    process.exit(1);
  }

  console.log(`📦 Updating worker: ${options.name}\n`);

  try {
    // Build the worker
    console.log('📦 Building TypeScript...');
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build complete\n');

    // Deploy using wrangler
    console.log('🚀 Deploying updates to Cloudflare...');
    execSync('npm run deploy:worker', { stdio: 'inherit' });
    console.log('✅ Update complete\n');

    console.log('🎉 Your MCP server has been updated!');
    console.log(`\n🔗 Worker URL: https://${options.name}.${options.accountId}.workers.dev\n`);
    
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
}

// Run update
update().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
